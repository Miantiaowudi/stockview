'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// 券商CSV格式定义
const BROKER_FORMATS = {
  '华泰': {
    columns: ['交易时间', '证券代码', '证券名称', '买卖方向', '成交数量', '成交价格', '成交金额', '手续费', '印花税', '过户费'],
    parse: (row: string[]) => ({
      trade_time: row[0],
      stock_code: row[1],
      stock_name: row[2],
      direction: row[3] === '卖出' ? 'sell' : 'buy',
      quantity: parseFloat(row[4]),
      price: parseFloat(row[5]),
      amount: parseFloat(row[6]),
      commission: parseFloat(row[7]) + parseFloat(row[8]) + parseFloat(row[9]),
    })
  },
  '中信': {
    columns: ['时间', '股票代码', '股票名称', '操作', '数量', '价格', '金额', '手续费'],
    parse: (row: string[]) => ({
      trade_time: row[0],
      stock_code: row[1],
      stock_name: row[2],
      direction: row[3] === '卖出' ? 'sell' : 'buy',
      quantity: parseFloat(row[4]),
      price: parseFloat(row[5]),
      amount: parseFloat(row[6]),
      commission: parseFloat(row[7]),
    })
  },
  '国泰': {
    columns: ['成交日期', '股票代码', '股票名称', '操作方向', '成交数量', '成交价格', '成交金额', '手续费', '印花税'],
    parse: (row: string[]) => ({
      trade_time: row[0],
      stock_code: row[1],
      stock_name: row[2],
      direction: row[3] === '卖出' ? 'sell' : 'buy',
      quantity: parseFloat(row[4]),
      price: parseFloat(row[5]),
      amount: parseFloat(row[6]),
      commission: parseFloat(row[7]) + parseFloat(row[8]),
    })
  },
  '银河': {
    columns: ['成交日期', '成交时间', '证券代码', '证券名称', '操作', '成交数量', '成交均价', '成交金额', '手续费', '印花税', '其他杂费'],
    parse: (row: string[]) => {
      const date = row[0]
      const time = row[1]
      // 转换日期格式 YYYYMMDD -> YYYY-MM-DD
      const formattedDate = `${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6,8)}`
      return {
        trade_time: `${formattedDate}T${time}`,
        stock_code: row[2],
        stock_name: row[3],
        direction: row[4] === '卖出' ? 'sell' : 'buy',
        quantity: parseFloat(row[5]),
        price: parseFloat(row[6]),
        amount: parseFloat(row[7]),
        commission: parseFloat(row[10]) + parseFloat(row[11]) + parseFloat(row[12]),
      }
    }
  },
  '通用': {
    columns: ['时间', '代码', '名称', '方向', '数量', '价格', '金额'],
    parse: (row: string[]) => ({
      trade_time: row[0],
      stock_code: row[1],
      stock_name: row[2],
      direction: row[3]?.includes('卖') ? 'sell' : 'buy',
      quantity: parseFloat(row[4]) || 0,
      price: parseFloat(row[5]) || 0,
      amount: parseFloat(row[6]) || 0,
      commission: 0,
    })
  }
}

export default function ImportPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedBroker, setSelectedBroker] = useState('')
  const [previewData, setPreviewData] = useState<any[]>([])
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  // 检查用户登录
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
      } else {
        setUser(user)
      }
      setLoading(false)
    }
    checkUser()
  }, [supabase, router])

  // 解析CSV文件
  const parseCSV = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim())
    if (lines.length < 2) return null

    // 检测格式
    const header = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    
    let detectedFormat = '通用'
    for (const [name, format] of Object.entries(BROKER_FORMATS)) {
      const matchCount = format.columns.filter(col => 
        header.some(h => h.includes(col) || col.includes(h))
      ).length
      if (matchCount >= 3) {
        detectedFormat = name
        break
      }
    }

    setSelectedBroker(detectedFormat)

    // 解析数据行
    const data = lines.slice(1, 6).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
      return BROKER_FORMATS[detectedFormat as keyof typeof BROKER_FORMATS]?.parse(values) || {}
    })

    setPreviewData(data)
    return { format: detectedFormat, preview: data }
  }

  // 处理文件选择
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setImportResult(null)

    try {
      const content = await file.text()
      const result = parseCSV(content)
      
      if (!result) {
        setImportResult({ success: false, message: 'CSV文件格式解析失败' })
        setUploading(false)
        return
      }

      setImportResult({ 
        success: true, 
        message: `检测到格式: ${result.format}，预览成功（${previewData.length}条）` 
      })
    } catch (error) {
      setImportResult({ success: false, message: '文件读取失败' })
    }

    setUploading(false)
  }

  // 确认导入
  const handleImport = async () => {
    if (!fileInputRef.current?.files?.[0] || !user) return

    setUploading(true)
    
    try {
      const file = fileInputRef.current.files[0]
      const content = await file.text()
      const lines = content.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        setImportResult({ success: false, message: 'CSV文件为空或格式错误' })
        setUploading(false)
        return
      }

      // 检测格式
      const header = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      let detectedFormat = '通用'
      for (const [name, format] of Object.entries(BROKER_FORMATS)) {
        const matchCount = format.columns.filter(col => 
          header.some(h => h.includes(col) || col.includes(h))
        ).length
        if (matchCount >= 3) {
          detectedFormat = name
          break
        }
      }

      // 解析所有数据
      const trades = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
        const parsed = BROKER_FORMATS[detectedFormat as keyof typeof BROKER_FORMATS]?.parse(values)
        return {
          ...parsed,
          user_id: user.id,
          broker_name: detectedFormat,
        }
      }).filter(t => t.stock_code)

      // 保存原始数据到 broker_data
      const { data: brokerData, error: brokerError } = await supabase
        .from('broker_data')
        .insert({
          user_id: user.id,
          broker_name: detectedFormat,
          raw_data: { header: header.slice(0, 10), trades: trades.slice(0, 100) }
        })
        .select()
        .single()

      if (brokerError) throw brokerError

      // 保存归一化交易到 normalized_trades
      const normalizedTrades = trades.map(t => ({
        user_id: user.id,
        stock_code: t.stock_code,
        direction: t.direction,
        price: t.price,
        quantity: t.quantity,
        commission: t.commission || 0,
        trade_time: new Date(t.trade_time).toISOString(),
        broker_data_id: brokerData.id
      }))

      const { error: tradesError } = await supabase
        .from('normalized_trades')
        .insert(normalizedTrades)

      if (tradesError) throw tradesError

      setImportResult({ 
        success: true, 
        message: `导入成功！共 ${trades.length} 条交易记录` 
      })

      // 清空文件选择
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setPreviewData([])

    } catch (error: any) {
      setImportResult({ success: false, message: error.message || '导入失败' })
    }

    setUploading(false)
  }

  // 登出
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">StockView 数据导入</h1>
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-blue-600 hover:underline">返回看板</a>
            <span className="text-gray-600">{user?.email}</span>
            <button onClick={handleLogout} className="text-sm text-blue-600 hover:underline">
              退出
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 券商选择说明 */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">支持的券商</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
            {Object.keys(BROKER_FORMATS).map(broker => (
              <div key={broker} className={`p-3 border rounded ${selectedBroker === broker ? 'bg-blue-50 border-blue-500' : ''}`}>
                {broker}
              </div>
            ))}
          </div>
        </div>

        {/* 文件上传 */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">导入数据</h2>
          
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-4"
          />

          {importResult && (
            <div className={`p-3 rounded mb-4 ${importResult.success ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {importResult.message}
            </div>
          )}

          {/* 预览数据 */}
          {previewData.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">预览（前5条）</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">时间</th>
                      <th className="px-3 py-2 text-left">代码</th>
                      <th className="px-3 py-2 text-left">名称</th>
                      <th className="px-3 py-2 text-left">方向</th>
                      <th className="px-3 py-2 text-right">数量</th>
                      <th className="px-3 py-2 text-right">价格</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2">{row.trade_time}</td>
                        <td className="px-3 py-2">{row.stock_code}</td>
                        <td className="px-3 py-2">{row.stock_name}</td>
                        <td className="px-3 py-2">
                          <span className={row.direction === 'buy' ? 'text-green-600' : 'text-red-600'}>
                            {row.direction === 'buy' ? '买入' : '卖出'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">{row.quantity}</td>
                        <td className="px-3 py-2 text-right">{row.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={uploading || previewData.length === 0}
            className="py-2 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? '导入中...' : '确认导入'}
          </button>
        </div>

        {/* 导入说明 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">导入说明</h2>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>1. 从券商客户端导出CSV格式的交割单</li>
            <li>2. 支持华泰、中信、国泰等主流券商格式</li>
            <li>3. 系统会自动识别券商格式</li>
            <li>4. 导入后可在"账户分析"查看统计数据</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
