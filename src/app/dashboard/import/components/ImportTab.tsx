'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Upload, Table, Button, Card, Alert, Space } from 'antd'
import { UploadOutlined, CheckOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'

const STANDARD_COLUMNS = [
  '成交日期', '成交时间', '证券代码', '证券名称', '操作', 
  '成交数量', '成交均价', '成交金额', '手续费', '印花税'
]

const CSV_HELP_TEXT = `支持标准CSV格式文件导入，表头需包含以下字段：
成交日期、成交时间、证券代码、证券名称、操作、成交数量、成交均价、成交金额、手续费、印花税

日期格式：YYYYMMDD 或 YYYY-MM-DD
时间格式：HHmmss 或 HH:MM:SS
操作：买入/卖出`

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
  const [fileList, setFileList] = useState<any[]>([])
  const [currentFile, setCurrentFile] = useState<File | null>(null)

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

  const handleFileChange: UploadProps['onChange'] = async (info) => {
    const file = info.fileList[0]?.originFileObj || info.fileList[0]
    if (!file) return

    setFileList(info.fileList)
    setCurrentFile(file as File)
    setImportResult(null)
    setPreviewData([])

    try {
      let content = await (file as File).text()
      
      const hasChinese = (str: string) => /[\u4e00-\u9fa5]/.test(str.slice(0, 500))
      if (!hasChinese(content)) {
        content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => reject(reader.error)
          reader.readAsText(file as File, 'gbk')
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

  const handleImport = async () => {
    if (!currentFile || !user) return

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
        setFileList([])
        setPreviewData([])
        setCurrentFile(null)
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

      setFileList([])
      setPreviewData([])
      setCurrentFile(null)
      onImportComplete?.(`导入成功！共 ${uniqueTrades.length} 条交易记录`)

    } catch (error: any) {
      setImportResult({ success: false, message: error.message || '导入失败' })
    }

    setUploading(false)
  }

  const previewColumns = [
    { title: '成交日期', dataIndex: 'trade_date', key: 'trade_date', width: 100 },
    { title: '成交时间', dataIndex: 'trade_time', key: 'trade_time', width: 80 },
    { title: '证券代码', dataIndex: 'stock_code', key: 'stock_code', width: 80 },
    { title: '证券名称', dataIndex: 'stock_name', key: 'stock_name', width: 80 },
    { 
      title: '操作', 
      dataIndex: 'direction', 
      key: 'direction', 
      width: 80,
      render: (text: string, record: any) => (
        <span style={{ 
          color: record.direction_type === 'buy' ? '#52c41a' : '#ff4d4f',
          fontWeight: 500
        }}>
          {text}
        </span>
      )
    },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
    { title: '价格', dataIndex: 'price', key: 'price', width: 80 },
    { title: '金额', dataIndex: 'amount', key: 'amount', width: 100 },
    { title: '手续费', dataIndex: 'commission', key: 'commission', width: 80 },
    { title: '印花税', dataIndex: 'stamp_duty', key: 'stamp_duty', width: 80 },
  ]

  return (
    <Card 
      title={<span>导入数据</span>}
      extra={
        <Upload
          accept=".csv"
          fileList={fileList}
          onChange={handleFileChange}
          beforeUpload={() => false}
          maxCount={1}
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />}>点击上传 CSV 文件</Button>
        </Upload>
      }
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {importResult && (
          <Alert
            message={importResult.message}
            type={importResult.success ? 'success' : 'error'}
            showIcon
          />
        )}

        {previewData.length > 0 && (
          <div>
            <h4 style={{ marginBottom: 12 }}>预览（前5条）</h4>
            <Table 
              columns={previewColumns} 
              dataSource={previewData} 
              pagination={false}
              size="small"
              scroll={{ x: 1000 }}
            />
          </div>
        )}

        {previewData.length === 0 && !importResult && (
          <div 
            style={{
              background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)',
              borderRadius: 12,
              padding: '48px 24px',
              textAlign: 'center',
              border: '1px solid #e8e8e8'
            }}
          >
            <UploadOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16, display: 'block' }} />
            <p style={{ color: '#666', fontSize: 14, margin: 0, whiteSpace: 'pre-line', lineHeight: 1.8 }}>
              {CSV_HELP_TEXT}
            </p>
          </div>
        )}

        <Button
          type="primary"
          icon={<CheckOutlined />}
          onClick={handleImport}
          loading={uploading}
          disabled={previewData.length === 0}
          block
        >
          确认导入
        </Button>
      </Space>
    </Card>
  )
}
