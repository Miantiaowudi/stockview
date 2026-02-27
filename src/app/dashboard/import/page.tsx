'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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

      // 不显示成功提示，只通过预览表格展示数据
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

      // 查询数据库中已存在的交易记录（用于去重）
      const { data: existingTrades } = await supabase
        .from('normalized_trades')
        .select('stock_code, direction, quantity, price, trade_time')
        .eq('user_id', user.id)

      const existingKeys = new Set<string>()
      if (existingTrades) {
        for (const t of existingTrades) {
          // 只比较日期
          const tradeDate = t.trade_time ? t.trade_time.split('T')[0] : ''
          existingKeys.add(`${t.stock_code}-${t.direction}-${t.quantity}-${t.price}-${tradeDate}`)
        }
      }
      console.log('existing keys:', existingKeys.size)

      // 去重：排除数据库中已存在的记录
      const uniqueTrades = trades.filter(t => {
        const tradeDate = t.trade_time ? t.trade_time.split('T')[0] : ''
        const key = `${t.stock_code}-${t.direction}-${t.quantity}-${t.price}-${tradeDate}`
        if (existingKeys.has(key)) return false
        return true
      })
      console.log('unique trades:', uniqueTrades.length, 'from', trades.length)



      // 保存原始数据到 broker_data
      const { data: brokerData, error: brokerError } = await supabase
        .from('broker_data')
        .insert({
          user_id: user.id,
          broker_name: '标准格式',
          raw_data: { header: header.slice(0, 10), trades: uniqueTrades.slice(0, 100) }
        })
        .select()
        .single()

      if (brokerError) throw brokerError

      // 保存归一化交易到 normalized_trades
      const normalizedTrades = uniqueTrades.map(t => ({
        user_id: user.id,
        stock_code: t.stock_code,
        direction: t.direction,
        price: t.price,
        quantity: t.quantity,
        commission: t.commission || 0,
        trade_time: t.trade_time,
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 page-enter">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h1 className="text-lg font-bold text-slate-800">StockView 数据导入</h1>
              </Link>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link 
                href="/dashboard" 
                className="px-3 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              >
                返回看板
              </Link>
              <span className="hidden sm:inline text-sm text-slate-500">{user?.email}</span>
              <button 
                onClick={handleLogout} 
                className="px-3 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Import Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Upload Card */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                导入数据
              </h2>
              
              {/* File Input */}
              <div className="mb-6">
                <label className="block">
                  <span className="sr-only">选择CSV文件</span>
                  <div className="flex items-center justify-center w-full">
                    <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 group">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <div className="w-12 h-12 mb-3 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                          <svg className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <p className="mb-1 text-sm text-slate-600">
                          <span className="font-semibold text-blue-600">点击上传</span> 或拖拽文件
                        </p>
                        <p className="text-xs text-slate-400">支持 CSV 格式文件</p>
                      </div>
                      <input
                        id="file-upload"
                        type="file"
                        ref={fileInputRef}
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                  </div>
                </label>
              </div>

              {/* Import Result Message */}
              {importResult && (
                <div className={`p-4 rounded-lg mb-6 ${importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center gap-3">
                    {importResult.success ? (
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    <p className={`text-sm ${importResult.success ? 'text-green-700' : 'text-red-700'}`}>
                      {importResult.message}
                    </p>
                  </div>
                </div>
              )}

              {/* Preview Data */}
              {previewData.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    预览（前5条）
                  </h3>
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          {STANDARD_COLUMNS.map((col: string, i: number) => (
                            <th key={i} className="text-xs">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row: any, i: number) => (
                          <tr key={i}>
                            {row.map((val: string, j: number) => (
                              <td key={j} className="text-xs">
                                {j === 4 && typeof val === 'string' ? (
                                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${val.includes('买') ? 'badge-buy' : 'badge-sell'}`}>
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

              {/* Import Button */}
              <button
                onClick={handleImport}
                disabled={uploading || previewData.length === 0}
                className="w-full sm:w-auto py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                {uploading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    导入中...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    确认导入
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column - Instructions */}
          <div className="space-y-6">
            {/* Format Guide Card */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                CSV格式说明
              </h2>
              <div className="text-sm text-slate-600">
                <p className="mb-3">请确保CSV文件包含以下表头（顺序无关）：</p>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <code className="text-xs text-slate-600 break-all">
                    {STANDARD_COLUMNS.join(', ')}
                  </code>
                </div>
              </div>
            </div>

            {/* Instructions Card */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                导入说明
              </h2>
              <ul className="text-sm text-slate-600 space-y-3">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-xs font-medium">1</span>
                  <span>从券商客户端导出CSV格式的交割单</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-xs font-medium">2</span>
                  <span>确保CSV文件包含标准表头</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-xs font-medium">3</span>
                  <span>导入后支持自动去重，相同记录不会重复导入</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-xs font-medium">4</span>
                  <span>导入完成后可在&quot;账户分析&quot;查看统计数据</span>
                </li>
              </ul>
            </div>

            {/* Quick Links Card */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                快速导航
              </h2>
              <div className="space-y-2">
                <Link 
                  href="/dashboard" 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors text-slate-600 hover:text-blue-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="text-sm font-medium">返回看板</span>
                </Link>
                <Link 
                  href="/dashboard/analytics" 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors text-slate-600 hover:text-blue-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-sm font-medium">账户分析</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
