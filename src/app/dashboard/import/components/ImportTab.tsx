'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'

const STANDARD_COLUMNS = [
  '成交日期', '成交时间', '证券代码', '证券名称', '操作', 
  '成交数量', '成交均价', '成交金额', '手续费', '印花税'
]

const parseRow = (row: string[]) => {
  const date = row[0]
  const time = row[1]
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

interface ImportTabProps {
  user: any
  supabase: any
  onImportComplete?: (message: string) => void
}

export default function ImportTab({ user, supabase, onImportComplete }: ImportTabProps) {
  const [uploading, setUploading] = useState(false)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setImportResult(null)

    try {
      let content = await file.text()
      
      const hasChinese = (str: string) => /[\u4e00-\u9fa5]/.test(str.slice(0, 500))
      if (!hasChinese(content)) {
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

    } catch (error) {
      setImportResult({ success: false, message: '文件读取失败' })
    }

    setUploading(false)
  }

  const parseCSV = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim())
    if (lines.length < 2) return null

    const header = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const matchCount = STANDARD_COLUMNS.filter(col => header.includes(col)).length
    
    if (matchCount < 8) {
      setImportResult({ 
        success: false, 
        message: `CSV格式不正确。请使用标准格式，表头应为：${STANDARD_COLUMNS.join(', ')}` 
      })
      return null
    }

    const trades = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
      const parsed = parseRow(values)
      return {
        ...parsed,
        user_id: user.id,
        broker_name: '标准格式',
      }
    }).filter(t => t.stock_code)

    setPreviewData(trades.slice(0, 5).map(t => [
      t.trade_time?.split('T')[0]?.replace(/-/g, '') || '',
      t.trade_time?.split('T')[1]?.replace(':', '') || '',
      t.stock_code,
      t.stock_name,
      t.direction === 'buy' ? '买入' : '卖出',
      t.quantity,
      t.price.toFixed(2),
      t.amount.toFixed(2),
      t.commission.toFixed(2),
      '0.00'
    ]))

    return trades
  }

  const handleImport = async () => {
    if (!fileInputRef.current?.files?.[0] || !user) return

    setUploading(true)
    
    try {
      const file = fileInputRef.current.files[0]
      let content = await file.text()
      
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
          const tradeDate = t.trade_time ? t.trade_time.split('T')[0] : ''
          existingKeys.add(`${t.stock_code}-${t.direction}-${t.quantity}-${t.price}-${tradeDate}`)
        }
      }

      // 去重：排除数据库中已存在的记录
      const uniqueTrades = trades.filter(t => {
        const tradeDate = t.trade_time ? t.trade_time.split('T')[0] : ''
        const key = `${t.stock_code}-${t.direction}-${t.quantity}-${t.price}-${tradeDate}`
        if (existingKeys.has(key)) return false
        return true
      })

      // 如果没有新记录要导入
      if (uniqueTrades.length === 0) {
        setImportResult({ success: true, message: '没有新的交易记录需要导入（已全部存在）' })
        setUploading(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        setPreviewData([])
        return
      }

      // 保存到 broker_data
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
        message: `导入成功！共 ${uniqueTrades.length} 条交易记录` 
      })

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setPreviewData([])
      onImportComplete?.(`导入成功！共 ${uniqueTrades.length} 条交易记录`)

    } catch (error: any) {
      setImportResult({ success: false, message: error.message || '导入失败' })
    }

    setUploading(false)
  }

  return (
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

      {/* Import Result */}
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
  )
}
