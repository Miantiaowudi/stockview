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
  const [activeTab, setActiveTab] = useState<'import' | 'manual'>('import')
  
  // 手动录入相关状态
  const [stockList, setStockList] = useState<{ code: string; name: string }[]>([])
  const [stockSearch, setStockSearch] = useState('')
  const [manualEntries, setManualEntries] = useState<{
    trade_date: string
    trade_time: string
    stock_code: string
    stock_name: string
    direction: 'buy' | 'sell'
    quantity: number
    price: number
    amount: number
    commission: number
    stamp_duty: number
  }[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [currentEntry, setCurrentEntry] = useState<{
    trade_date: string
    trade_time: string
    stock_code: string
    stock_name: string
    direction: 'buy' | 'sell'
    quantity: number
    price: number
    amount: number
    commission: number
    stamp_duty: number
  }>({
    trade_date: '',
    trade_time: '',
    stock_code: '',
    stock_name: '',
    direction: 'buy',
    quantity: 100,
    price: 0,
    amount: 0,
    commission: 0,
    stamp_duty: 0
  })
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

  // 获取股票列表
  useEffect(() => {
    const fetchStocks = async () => {
      const searchParam = stockSearch ? `?search=${encodeURIComponent(stockSearch)}` : ''
      const res = await fetch(`/api/stocks/list${searchParam}`)
      const data = await res.json()
      setStockList(data)
    }
    
    if (stockSearch || stockList.length === 0) {
      const timeoutId = setTimeout(fetchStocks, 300)
      return () => clearTimeout(timeoutId)
    }
  }, [stockSearch])

  // 打开新增弹窗
  const openAddModal = () => {
    const today = new Date()
    const dateStr = today.toISOString().split('T')[0]
    const timeStr = today.toTimeString().slice(0, 5)
    
    setCurrentEntry({
      trade_date: dateStr,
      trade_time: timeStr,
      stock_code: '',
      stock_name: '',
      direction: 'buy',
      quantity: 100,
      price: 0,
      amount: 0,
      commission: 0,
      stamp_duty: 0
    })
    setModalOpen(true)
  }

  // 更新当前录入
  const updateCurrentEntry = (field: string, value: any) => {
    const updated = { ...currentEntry, [field]: value }
    
    if (field === 'stock_code') {
      const stock = stockList.find(s => s.code === value)
      if (stock) updated.stock_name = stock.name
    }
    
    if (field === 'quantity' || field === 'price') {
      const qty = field === 'quantity' ? value : updated.quantity
      const prc = field === 'price' ? value : updated.price
      updated.amount = qty * prc
      updated.commission = updated.amount * 0.0003
      updated.stamp_duty = updated.direction === 'sell' ? updated.amount * 0.0005 : 0
    }
    if (field === 'direction') {
      updated.stamp_duty = value === 'sell' ? updated.amount * 0.0005 : 0
    }
    
    setCurrentEntry(updated)
  }

  // 提交单条记录
  const handleSingleSubmit = async () => {
    if (!user || !currentEntry.stock_code || currentEntry.quantity <= 0 || currentEntry.price <= 0) {
      setImportResult({ success: false, message: '请填写完整的交易信息' })
      return
    }
    
    setSubmitting(true)
    
    try {
      const trade = {
        user_id: user.id,
        trade_time: `${currentEntry.trade_date}T${currentEntry.trade_time}:00`,
        stock_code: currentEntry.stock_code,
        stock_name: currentEntry.stock_name,
        direction: currentEntry.direction,
        quantity: currentEntry.quantity,
        price: currentEntry.price
      }
      
      const { error } = await supabase.from('normalized_trades').insert([trade])
      
      if (error) throw error
      
      setImportResult({ success: true, message: '交易记录添加成功' })
      setModalOpen(false)
    } catch (error: any) {
      console.error('添加失败:', error)
      setImportResult({ success: false, message: `添加失败: ${error.message}` })
    } finally {
      setSubmitting(false)
    }
  }


  const addManualEntry = () => {
    const today = new Date()
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '')
    const timeStr = today.toTimeString().slice(0, 5).replace(':', '')
    
    setManualEntries([...manualEntries, {
      trade_date: dateStr,
      trade_time: timeStr,
      stock_code: '',
      stock_name: '',
      direction: 'buy',
      quantity: 100,
      price: 0,
      amount: 0,
      commission: 0,
      stamp_duty: 0
    }])
  }

  // 更新手动录入行
  const updateManualEntry = (index: number, field: string, value: any) => {
    const updated = [...manualEntries]
    updated[index] = { ...updated[index], [field]: value }
    
    // 如果修改了证券代码，同步更新证券名称
    if (field === 'stock_code') {
      const stock = stockList.find(s => s.code === value)
      if (stock) {
        updated[index].stock_name = stock.name
      }
    }
    
    // 计算成交金额
    if (field === 'quantity' || field === 'price') {
      updated[index].amount = updated[index].quantity * updated[index].price
      // 手续费估算（万分之3）
      updated[index].commission = updated[index].amount * 0.0003
      // 印花税（卖出时 万分之5）
      updated[index].stamp_duty = updated[index].direction === 'sell' ? updated[index].amount * 0.0005 : 0
    }
    // 方向改变时更新印花税
    if (field === 'direction') {
      updated[index].stamp_duty = value === 'sell' ? updated[index].amount * 0.0005 : 0
    }
    
    setManualEntries(updated)
  }

  // 删除手动录入行
  const removeManualEntry = (index: number) => {
    setManualEntries(manualEntries.filter((_, i) => i !== index))
  }

  // 提交手动录入数据
  const handleManualSubmit = async () => {
    if (!user) return
    
    // 验证数据
    const validEntries = manualEntries.filter(entry => 
      entry.stock_code && entry.quantity > 0 && entry.price > 0
    )
    
    if (validEntries.length === 0) {
      setImportResult({ success: false, message: '请至少填写一条有效的交易记录' })
      return
    }
    
    setSubmitting(true)
    
    try {
      // 格式化数据
      const trades = validEntries.map(entry => ({
        user_id: user.id,
        trade_time: `${entry.trade_date.slice(0, 4)}-${entry.trade_date.slice(4, 6)}-${entry.trade_date.slice(6, 8)}T${entry.trade_time.slice(0, 2)}:${entry.trade_time.slice(2, 4)}:00`,
        stock_code: entry.stock_code,
        stock_name: entry.stock_name,
        direction: entry.direction,
        quantity: entry.quantity,
        price: entry.price,
        amount: entry.amount,
        commission: entry.commission,
        stamp_duty: entry.stamp_duty
      }))
      
      const { error } = await supabase.from('normalized_trades').insert(trades)
      
      if (error) {
        throw error
      }
      
      setImportResult({ success: true, message: `成功导入 ${trades.length} 条交易记录` })
      setManualEntries([])
    } catch (error: any) {
      console.error('导入失败:', error)
      setImportResult({ success: false, message: `导入失败: ${error.message}` })
    } finally {
      setSubmitting(false)
    }
  }

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
      <div className="min-h-screen bg-slate-50">
        {/* Header Skeleton */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse"></div>
                <div className="h-6 w-40 bg-slate-200 rounded animate-pulse"></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-6 w-24 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-6 w-16 bg-slate-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Import Form Skeleton */}
            <div className="lg:col-span-2 space-y-6">
              {/* File Upload Card Skeleton */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="h-6 w-24 bg-slate-200 rounded animate-pulse mb-6"></div>
                <div className="h-32 bg-slate-100 rounded-xl animate-pulse mb-6"></div>
                {/* Preview Table Skeleton */}
                <div className="h-4 w-32 bg-slate-200 rounded animate-pulse mb-3"></div>
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-8 bg-slate-100 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column Skeleton */}
            <div className="space-y-6">
              {/* Broker Selection Skeleton */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="h-6 w-24 bg-slate-200 rounded animate-pulse mb-4"></div>
                <div className="h-10 bg-slate-100 rounded-lg animate-pulse mb-4"></div>
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              </div>

              {/* Instructions Skeleton */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="h-6 w-20 bg-slate-200 rounded animate-pulse mb-4"></div>
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-4 bg-slate-100 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
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

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="inline-flex gap-1 p-1 bg-white rounded-xl border border-slate-200 shadow-sm w-fit">
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === 'import'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            导入数据
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === 'manual'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            手动录入
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Import Form */}
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Content */}
            {activeTab === 'import' ? (
              <div className="card p-6">
                {/* File Upload Card */}
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
          ) : (
            /* 手动录入表单 */
            <div className="card p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                  手动录入交易记录
                </h2>
                <button
                  onClick={openAddModal}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  添加一行
                </button>
              </div>

              {/* 导入结果提示 */}
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

              {/* 手动录入表格 */}
              {manualEntries.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-2 py-2 text-left text-slate-600 font-medium">成交日期</th>
                        <th className="px-2 py-2 text-left text-slate-600 font-medium">成交时间</th>
                        <th className="px-2 py-2 text-left text-slate-600 font-medium">证券代码</th>
                        <th className="px-2 py-2 text-left text-slate-600 font-medium">证券名称</th>
                        <th className="px-2 py-2 text-left text-slate-600 font-medium">操作</th>
                        <th className="px-2 py-2 text-left text-slate-600 font-medium">数量</th>
                        <th className="px-2 py-2 text-left text-slate-600 font-medium">价格</th>
                        <th className="px-2 py-2 text-left text-slate-600 font-medium">金额</th>
                        <th className="px-2 py-2 text-left text-slate-600 font-medium">手续费</th>
                        <th className="px-2 py-2 text-left text-slate-600 font-medium">印花税</th>
                        <th className="px-2 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {manualEntries.map((entry, index) => (
                        <tr key={index} className="border-b border-slate-100">
                          <td className="px-1 py-2">
                            <input
                              type="text"
                              value={entry.trade_date}
                              onChange={(e) => updateManualEntry(index, 'trade_date', e.target.value)}
                              className="w-20 px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-500"
                              placeholder="YYYYMMDD"
                            />
                          </td>
                          <td className="px-1 py-2">
                            <input
                              type="text"
                              value={entry.trade_time}
                              onChange={(e) => updateManualEntry(index, 'trade_time', e.target.value)}
                              className="w-16 px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-500"
                              placeholder="HHMM"
                            />
                          </td>
                          <td className="px-1 py-2">
                            <input
                              type="text"
                              value={entry.stock_code}
                              onChange={(e) => updateManualEntry(index, 'stock_code', e.target.value)}
                              className="w-20 px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-500"
                              placeholder="600000"
                              list={`stock-list-${index}`}
                            />
                            <datalist id={`stock-list-${index}`}>
                              {stockList.map(stock => (
                                <option key={stock.code} value={stock.code}>
                                  {stock.name}
                                </option>
                              ))}
                            </datalist>
                          </td>
                          <td className="px-1 py-2">
                            <input
                              type="text"
                              value={entry.stock_name}
                              onChange={(e) => updateManualEntry(index, 'stock_name', e.target.value)}
                              className="w-20 px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-500"
                              placeholder="股票名称"
                            />
                          </td>
                          <td className="px-1 py-2">
                            <select
                              value={entry.direction}
                              onChange={(e) => updateManualEntry(index, 'direction', e.target.value)}
                              className="px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-500"
                            >
                              <option value="buy">买入</option>
                              <option value="sell">卖出</option>
                            </select>
                          </td>
                          <td className="px-1 py-2">
                            <input
                              type="number"
                              value={entry.quantity}
                              onChange={(e) => updateManualEntry(index, 'quantity', parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-500"
                            />
                          </td>
                          <td className="px-1 py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={entry.price}
                              onChange={(e) => updateManualEntry(index, 'price', parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-500"
                            />
                          </td>
                          <td className="px-1 py-2 text-slate-600">
                            {entry.amount.toFixed(2)}
                          </td>
                          <td className="px-1 py-2 text-slate-600">
                            {entry.commission.toFixed(2)}
                          </td>
                          <td className="px-1 py-2 text-slate-600">
                            {entry.stamp_duty.toFixed(2)}
                          </td>
                          <td className="px-1 py-2">
                            <button
                              onClick={() => removeManualEntry(index)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* 提交按钮 */}
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleManualSubmit}
                      disabled={submitting || manualEntries.length === 0}
                      className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          提交中...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          确认提交
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>点击"添加一行"开始录入交易记录</p>
                </div>
              )}
            </div>
            )}
          </div>

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
      {/* Modal for single entry */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">添加交易记录</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Form */}
            <div className="p-4 space-y-4">
              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">成交日期</label>
                  <input
                    type="date"
                    value={currentEntry.trade_date}
                    onChange={(e) => updateCurrentEntry('trade_date', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">成交时间</label>
                  <input
                    type="time"
                    value={currentEntry.trade_time}
                    onChange={(e) => updateCurrentEntry('trade_time', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              
              {/* Stock Code */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">证券代码</label>
                <input
                  type="text"
                  value={currentEntry.stock_code}
                  onChange={(e) => updateCurrentEntry('stock_code', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="600000"
                  list="stock-modal-list"
                />
                <datalist id="stock-modal-list">
                  {stockList.map(stock => (
                    <option key={stock.code} value={stock.code}>
                      {stock.name}
                    </option>
                  ))}
                </datalist>
              </div>
              
              {/* Direction */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">操作方向</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="direction"
                      value="buy"
                      checked={currentEntry.direction === 'buy'}
                      onChange={() => updateCurrentEntry('direction', 'buy')}
                      className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">买入</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="direction"
                      value="sell"
                      checked={currentEntry.direction === 'sell'}
                      onChange={() => updateCurrentEntry('direction', 'sell')}
                      className="w-4 h-4 text-red-600 border-slate-300 focus:ring-red-500"
                    />
                    <span className="text-sm text-slate-700">卖出</span>
                  </label>
                </div>
              </div>
              
              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">数量（手）</label>
                <input
                  type="number"
                  value={currentEntry.quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0
                    // Round to nearest 100, minimum 100
                    const rounded = Math.max(100, Math.round(val / 100) * 100)
                    updateCurrentEntry('quantity', rounded)
                  }}
                  min={100}
                  step={100}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-slate-400 mt-1">必须为100的整数倍，最小100</p>
              </div>
              
              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">价格</label>
                <input
                  type="number"
                  step="0.01"
                  value={currentEntry.price}
                  onChange={(e) => updateCurrentEntry('price', parseFloat(e.target.value) || 0)}
                  min={0}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              
              {/* Calculated Fields */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">成交金额：</span>
                  <span className="font-medium text-slate-800">{currentEntry.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">手续费：</span>
                  <span className="font-medium text-slate-800">{currentEntry.commission.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">印花税：</span>
                  <span className="font-medium text-slate-800">{currentEntry.stamp_duty.toFixed(2)}</span>
                </div>
              </div>
              
              {/* Submit Button */}
              <button
                onClick={handleSingleSubmit}
                disabled={submitting || !currentEntry.stock_code || currentEntry.quantity <= 0 || currentEntry.price <= 0}
                className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    提交中...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    确认添加
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
