'use client'

import { useState, useRef } from 'react'
import { Button } from 'antd'
import { useLocalTrades } from '@/hooks/useLocalTrades'

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
  onImportComplete?: (message: string) => void
}

export default function ImportTab({ onImportComplete }: ImportTabProps) {
  const [uploading, setUploading] = useState(false)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null)
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { trades, addTrade, reload } = useLocalTrades()

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
        broker_name: '标准格式',
      }
    }).filter(t => t.stock_code)

    setPreviewData(trades.slice(0, 5).map((t, i) => ({
      key: i,
      trade_date: t.trade_time?.split('T')[0]?.replace(/-/g, '') || '',
      trade_time: t.trade_time?.split('T')[1]?.replace(':', '') || '',
      stock_code: t.stock_code,
      stock_name: t.stock_name,
      direction: t.direction === 'buy' ? '买入' : '卖出',
      direction_type: t.direction,
      quantity: t.quantity,
      price: t.price.toFixed(2),
      amount: t.amount.toFixed(2),
      commission: t.commission.toFixed(2),
      stamp_duty: '0.00'
    })))

    return trades
  }

  const handleFileContent = async (file: File) => {
    setCurrentFile(file)
    setImportResult(null)
    setPreviewData([])

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
        return
      }

    } catch (error) {
      setImportResult({ success: false, message: '文件读取失败' })
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await handleFileContent(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.name.endsWith('.csv')) {
      await handleFileContent(file)
    } else {
      setImportResult({ success: false, message: '请上传 CSV 格式文件' })
    }
  }

  const handleImport = async () => {
    if (!currentFile) return

    setUploading(true)

    try {
      let content = await currentFile.text()

      const hasChinese = (str: string) => /[\u4e00-\u9fa5]/.test(str.slice(0, 500))
      if (!hasChinese(content)) {
        content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => reject(reader.error)
          reader.readAsText(currentFile, 'gbk')
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

      const tradesToImport = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
        const parsed = parseRow(values)
        return {
          ...parsed,
          broker_name: '标准格式',
        }
      }).filter(t => t.stock_code)

      // 构建现有交易的唯一键集合（用于去重）
      const existingKeys = new Set<string>()
      for (const t of trades) {
        const tradeDate = t.trade_time ? t.trade_time.split('T')[0] : ''
        existingKeys.add(`${t.stock_code}-${t.direction}-${t.quantity}-${t.price}-${tradeDate}`)
      }

      // 去重：排除已存在的记录
      const uniqueTrades = tradesToImport.filter(t => {
        const tradeDate = t.trade_time ? t.trade_time.split('T')[0] : ''
        const key = `${t.stock_code}-${t.direction}-${t.quantity}-${t.price}-${tradeDate}`
        if (existingKeys.has(key)) return false
        return true
      })

      // 如果没有新记录要导入
      if (uniqueTrades.length === 0) {
        setImportResult({ success: true, message: '没有新的交易记录需要导入（已全部存在）' })
        setUploading(false)
        setPreviewData([])
        setCurrentFile(null)
        return
      }

            // 逐条添加到本地存储
      for (const t of uniqueTrades) {
        await addTrade({
          stock_code: t.stock_code,
          direction: t.direction as 'buy' | 'sell',
          price: t.price,
          quantity: t.quantity,
          commission: t.commission || 0,
          trade_time: t.trade_time,
        })
      }

      await reload()

      setImportResult({
        success: true,
        message: `导入成功！共 ${uniqueTrades.length} 条交易记录`
      })

      setPreviewData([])
      setCurrentFile(null)
      onImportComplete?.(`导入成功！共 ${uniqueTrades.length} 条交易记录`)

    } catch (error: any) {
      setImportResult({ success: false, message: error.message || '导入失败' })
    }

    setUploading(false)
  }

  const previewColumns = [
    { title: '成交日期', dataIndex: 'trade_date', key: 'trade_date' },
    { title: '成交时间', dataIndex: 'trade_time', key: 'trade_time' },
    { title: '证券代码', dataIndex: 'stock_code', key: 'stock_code' },
    { title: '证券名称', dataIndex: 'stock_name', key: 'stock_name' },
    {
      title: '操作',
      dataIndex: 'direction',
      key: 'direction',
      render: (text: string, record: any) => (
        <span className={`badge ${record.direction_type === 'buy' ? 'badge-buy' : 'badge-sell'}`}>
          {text}
        </span>
      )
    },
    { title: '数量', dataIndex: 'quantity', key: 'quantity' },
    { title: '价格', dataIndex: 'price', key: 'price' },
    { title: '金额', dataIndex: 'amount', key: 'amount' },
    { title: '手续费', dataIndex: 'commission', key: 'commission' },
    { title: '印花税', dataIndex: 'stamp_duty', key: 'stamp_duty' },
  ]

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
          导入数据
        </h2>

        {/* File Upload Button */}
        <div>
          <label className="block">
            <span className="sr-only">选择CSV文件</span>
            <div className="flex items-center justify-center">
              <Button
                type="primary"
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>}
                onClick={() => fileInputRef.current?.click()}
              >
                点击上传 CSV 文件
              </Button>
              <input
                id="file-upload"
                type="file"
                ref={fileInputRef}
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />
            </div>
          </label>
        </div>
      </div>

      {/* Result Message */}
      {importResult && (
        <div className={`mb-6 p-4 rounded-lg border ${
          importResult.success
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <div className="flex items-center gap-3">
            {importResult.success ? (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <p className="text-sm">{importResult.message}</p>
          </div>
        </div>
      )}

      {/* Preview Table */}
      {previewData.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-slate-700 mb-3">预览（前5条）</h4>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  {previewColumns.map((col: any) => (
                    <th key={col.key}>
                      {col.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row) => (
                  <tr key={row.key}>
                    {previewColumns.map((col: any) => (
                      <td key={col.key}>
                        {col.render ? col.render(row[col.dataIndex], row) : row[col.dataIndex]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State - Drag & Drop Area */}
      {previewData.length === 0 && !importResult && (
        <div
          className={`mb-6 border-2 border-dashed rounded-xl transition-all duration-200 ${
            isDragging
              ? 'border-blue-400 bg-blue-50'
              : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className={`w-12 h-12 mb-4 rounded-full flex items-center justify-center transition-colors ${
              isDragging ? 'bg-blue-100' : 'bg-slate-100'
            }`}>
              <svg className={`w-6 h-6 ${isDragging ? 'text-blue-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-sm text-slate-600 mb-2">
              <span className="font-semibold text-blue-600">点击上传</span> 或拖拽文件
            </p>
            <p className="text-xs text-slate-400">支持 CSV 格式文件</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      {previewData.length > 0 && (
        <div className="flex justify-center">
          <Button
            type="primary"
            loading={uploading}
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
            onClick={handleImport}
            disabled={uploading}
          >
            {uploading ? '导入中...' : '确认导入'}
          </Button>
        </div>
      )}
    </div>
  )
}
