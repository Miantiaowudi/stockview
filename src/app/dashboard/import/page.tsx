'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// 标准CSV格式（银河证券）
const STANDARD_COLUMNS = [
  '成交日期', '成交时间', '证券代码', '证券名称', '操作', 
  '成交数量', '成交均价', '成交金额', '手续费', '印花税'
]

const parseRow = (row: string[]) => {
  const date = row[0]
  const time = row[1]
  // 转换日期格式 YYYYMMDD -> YYYY-MM-DD
  const formattedDate = date.length === 8 
    ? `${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6,8)}`
    : date
  
  return {
    trade_time: time ? `${formattedDate}T${time}` : formattedDate,
    stock_code: row[2],
    stock_name: row[3],
    direction: row[4] === '卖出' ? 'sell' : 'buy',
    quantity: parseFloat(row[5]) || 0,
    price: parseFloat(row[6]) || 0,
    amount: parseFloat(row[7]) || 0,
    commission: (parseFloat(row[8]) || 0) + (parseFloat(row[9]) || 0),
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
    let text = content
    
    // 尝试检测编码，如果是乱码尝试用 GBK 解码
    const hasChinese = (str: string) => /[\u4e00-\u9fa5]/.test(str)
    if (!hasChinese(text.slice(0, 200))) {
      // 尝试 GBK 解码
      try {
        const decoder = new TextDecoder('gbk')
        const bytes = new Uint8Array([...content].map(c => c.charCodeAt(0)))
        text = decoder.decode(bytes)
      } catch (e) {
        console.log('GBK decode failed')
      }
    }

    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length < 2) return null

    // 解析CSV表头
    const header = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    console.log('header:', header)
    
    // 验证是否为标准格式
    const matchCount = STANDARD_COLUMNS.filter(col => 
      header.includes(col)
    ).length
    
    // 必须匹配至少8个字段
    if (matchCount < 8) {
      setSelectedBroker('')
      setImportResult({ 
        success: false, 
        message: `CSV格式不正确。请使用标准格式，表头应为：${STANDARD_COLUMNS.join(', ')}` 
      })
      setUploading(false)
      return
    }

    setSelectedBroker('标准格式')

    // 解析数据行（预览用原始值）
    const data = lines.slice(1, 6).map(line => {
      return line.split(',').map(v => v.trim().replace(/"/g, ''))
    })

    setPreviewData(data)
    return { format: '标准格式', preview: data }
  }

  // 处理文件选择
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setImportResult(null)

    try {
      // 尝试用 UTF-8 读取
      let content = await file.text()
      
      // 检查是否有乱码（如果没有中文字符）
      const hasChinese = (str: string) => /[\u4e00-\u9fa5]/.test(str.slice(0, 500))
      if (!hasChinese(content)) {
        // 尝试用 GBK 读取
        content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => reject(reader.error)
          reader.readAsText(file, 'gbk')
        })
      }
      
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
      // 尝试用 UTF-8 读取
      let content = await file.text()
      
      // 检查是否有乱码
      const hasChinese = (str: string) => /[\u4e00-\u9fa5]/.test(str.slice(0, 500))
      if (!hasChinese(content)) {
        content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => reject(reader.error)
          reader.readAsText(file, 'gbk')
        })
      }
      
      const lines = content.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        setImportResult({ success: false, message: 'CSV文件为空或格式错误' })
        setUploading(false)
        return
      }

      // 验证格式
      const header = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      const matchCount = STANDARD_COLUMNS.filter(col => header.includes(col)).length
      
      if (matchCount < 8) {
        setImportResult({ 
          success: false, 
          message: `CSV格式不正确。请使用标准格式，表头应为：${STANDARD_COLUMNS.join(', ')}` 
        })
        setUploading(false)
        return
      }

      // 解析所有数据
      const trades = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
        const parsed = parseRow(values)
        return {
          ...parsed,
          user_id: user.id,
          broker_name: '标准格式',
        }
      }).filter(t => t.stock_code)

      // 保存原始数据到 broker_data
      const { data: brokerData, error: brokerError } = await supabase
        .from('broker_data')
        .insert({
          user_id: user.id,
          broker_name: '标准格式',
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
        {/* 标准格式说明 */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">标准CSV格式</h2>
          <div className="text-sm text-gray-600">
            <p className="mb-2">请确保CSV文件包含以下表头（顺序无关）：</p>
            <code className="block bg-gray-100 p-3 rounded text-xs overflow-x-auto">
              {STANDARD_COLUMNS.join(', ')}
            </code>
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
              <h3 className="font-medium mb-2">预览（前5条） - {selectedBroker} 格式</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {STANDARD_COLUMNS.map((col: string, i: number) => (
                        <th key={i} className="px-3 py-2 text-left">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row: any, i: number) => (
                      <tr key={i} className="border-t">
                        {row.map((val: string, j: number) => (
                          <td key={j} className="px-3 py-2">
                            {j === 4 && typeof val === 'string' ? (
                              <span className={val.includes('买') ? 'text-green-600' : 'text-red-600'}>
                                {val}
                              </span>
                            ) : (
                              val
                            )}
                          </td>
                        ))}
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
