'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { Button, Modal, Form, InputNumber, Radio, Table, Card, message, DatePicker, TimePicker, Tag, Popconfirm, Select } from 'antd'
import { PlusOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons'
import type { SelectProps } from 'antd'
import dayjs from 'dayjs'

interface ManualEntryTabProps {
  user: any
  supabase: any
  onImportComplete?: (message: string) => void
}

interface ManualEntry {
  key: string
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
}

export default function ManualEntryTab({ user, supabase, onImportComplete }: ManualEntryTabProps) {
  const [stockList, setStockList] = useState<SelectProps['options']>([])
  const [manualEntries, setManualEntries] = useState<ManualEntry[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [stockLoading, setStockLoading] = useState(false)
  const [stockSearch, setStockSearch] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const stockPageRef = useRef(1)
  
  const loadStocks = async (search: string = '', page: number = 1, append: boolean = false) => {
    if (stockLoading) return
    setStockLoading(true)
    
    try {
      const res = await fetch(`/api/stocks/list?search=${encodeURIComponent(search)}&page=${page}&limit=50`)
      const data = await res.json()
      
      const options = (Array.isArray(data) ? data : []).map((stock: any) => ({
        value: stock.code,
        label: `${stock.code} - ${stock.name}`,
        name: stock.name,
      }))
      
      if (append) {
        setStockList(prev => [...(prev || []), ...options])
      } else {
        setStockList(options)
      }
      
      setHasMore(options.length >= 50)
    } catch (error) {
      console.error('加载股票列表失败:', error)
    } finally {
      setStockLoading(false)
    }
  }

  useEffect(() => {
    loadStocks()
  }, [])

  const openAddModal = () => {
    const today = dayjs()
    form.setFieldsValue({
      trade_date: today,
      trade_time: today,
      stock: undefined,
      direction: 'buy',
      quantity: 100,
      price: 0,
    })
    setModalOpen(true)
  }

  const calculateFees = (values: any) => {
    const amount = (values.quantity || 0) * (values.price || 0)
    const commission = amount * 0.0003
    const stamp_duty = values.direction === 'sell' ? amount * 0.0005 : 0
    return { amount, commission, stamp_duty }
  }

  const handleSingleSubmit = async () => {
    if (!user) return
    
    try {
      const values = await form.validateFields()
      
      const selectedStock = stockList?.find(opt => opt.value === values.stock)
      
      const trade: ManualEntry = {
        key: Date.now().toString(),
        trade_date: values.trade_date.format('YYYY-MM-DD'),
        trade_time: values.trade_time.format('HH:mm:ss'),
        stock_code: values.stock,
        stock_name: selectedStock?.name || '',
        direction: values.direction,
        quantity: values.quantity,
        price: values.price,
        ...calculateFees(values),
      }
      
      setManualEntries([...manualEntries, trade])
      setModalOpen(false)
      message.success('添加成功')
    } catch (error) {
      console.error('添加失败:', error)
    }
  }

  const handleStockSearch = (value: string) => {
    setStockSearch(value)
    stockPageRef.current = 1
    loadStocks(value, 1, false)
  }

  const handlePopupScroll: React.UIEventHandler<HTMLDivElement> = (e) => {
    const target = e.target as HTMLDivElement
    const { scrollTop, clientHeight, scrollHeight } = target
    
    if (scrollHeight - scrollTop - clientHeight < 50 && !stockLoading && hasMore) {
      stockPageRef.current += 1
      loadStocks(stockSearch, stockPageRef.current, true)
    }
  }

  const handleManualSubmit = async () => {
    if (!user) return
    
    const validEntries = manualEntries.filter(entry => 
      entry.stock_code && entry.quantity > 0 && entry.price > 0
    )
    
    if (validEntries.length === 0) {
      message.error('请至少填写一条有效的交易记录')
      return
    }
    
    setSubmitting(true)
    
    try {
      const trades = validEntries.map(entry => ({
        user_id: user.id,
        trade_time: `${entry.trade_date}T${entry.trade_time}`,
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
      
      message.success(`成功导入 ${trades.length} 条交易记录`)
      setManualEntries([])
      onImportComplete?.(`成功导入 ${trades.length} 条交易记录`)
    } catch (error: any) {
      console.error('导入失败:', error)
      message.error(`导入失败: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const removeManualEntry = (key: string) => {
    setManualEntries(manualEntries.filter(item => item.key !== key))
  }

  const columns = [
    { title: '成交日期', dataIndex: 'trade_date', key: 'trade_date', width: 120 },
    { title: '成交时间', dataIndex: 'trade_time', key: 'trade_time', width: 100 },
    { title: '证券代码', dataIndex: 'stock_code', key: 'stock_code', width: 100 },
    { title: '证券名称', dataIndex: 'stock_name', key: 'stock_name', width: 100 },
    { 
      title: '操作', 
      dataIndex: 'direction', 
      key: 'direction', 
      width: 80,
      render: (direction: string) => (
        <Tag color={direction === 'buy' ? 'green' : 'red'}>
          {direction === 'buy' ? '买入' : '卖出'}
        </Tag>
      ),
    },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
    { title: '价格', dataIndex: 'price', key: 'price', width: 100, render: (price: number) => price?.toFixed(2) || '0.00' },
    { title: '金额', dataIndex: 'amount', key: 'amount', width: 120, render: (amount: number) => amount?.toFixed(2) || '0.00' },
    { title: '手续费', dataIndex: 'commission', key: 'commission', width: 100, render: (commission: number) => commission?.toFixed(2) || '0.00' },
    { title: '印花税', dataIndex: 'stamp_duty', key: 'stamp_duty', width: 100, render: (stamp_duty: number) => stamp_duty?.toFixed(2) || '0.00' },
    {
      title: '操作',
      key: 'action',
      width: 60,
      render: (_: any, record: ManualEntry) => (
        <Popconfirm title="确定删除这条记录吗？" onConfirm={() => removeManualEntry(record.key)} okText="确定" cancelText="取消">
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ]

  return (
    <>
      <Card 
        title={<span>手动录入交易记录</span>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>添加一行</Button>}
      >
        {manualEntries.length > 0 ? (
          <>
            <Table columns={columns} dataSource={manualEntries} pagination={false} size="small" scroll={{ x: 1200 }} />
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Button type="primary" icon={<CheckOutlined />} onClick={handleManualSubmit} loading={submitting} disabled={manualEntries.length === 0}>确认提交</Button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#999' }}>
            <PlusOutlined style={{ fontSize: 48, marginBottom: 16, display: 'block' }} />
            <p>点击"添加一行"开始录入交易记录</p>
          </div>
        )}
      </Card>

      <Modal title="添加交易记录" open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} width={500}>
        <Form form={form} layout="vertical" onFinish={handleSingleSubmit} initialValues={{ direction: 'buy', quantity: 100, price: 0 }}>
          <Form.Item label="成交日期" name="trade_date" rules={[{ required: true, message: '请选择成交日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="成交时间" name="trade_time" rules={[{ required: true, message: '请选择成交时间' }]}>
            <TimePicker style={{ width: '100%' }} format="HH:mm:ss" />
          </Form.Item>
          <Form.Item label="证券代码" name="stock" rules={[{ required: true, message: '请选择证券代码' }]}>
            <Select
              showSearch
              placeholder="搜索股票代码或名称"
              optionFilterProp="label"
              filterOption={(input, option) =>
                String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={stockList}
              onSearch={handleStockSearch}
              onPopupScroll={handlePopupScroll}
              loading={stockLoading}
              style={{ width: '100%' }}
              dropdownRender={(menu) => (
                <>
                  {menu}
                  {stockLoading && <div style={{ padding: '8px', textAlign: 'center', color: '#999' }}>加载中...</div>}
                  {!hasMore && <div style={{ padding: '8px', textAlign: 'center', color: '#999' }}>没有更多了</div>}
                </>
              )}
            />
          </Form.Item>
          <Form.Item label="操作方向" name="direction" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio.Button value="buy">买入</Radio.Button>
              <Radio.Button value="sell">卖出</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="数量（手）" name="quantity" rules={[{ required: true, message: '请输入数量' }]}>
            <InputNumber min={100} step={100} style={{ width: '100%' }} placeholder="必须为100的整数倍" />
          </Form.Item>
          <Form.Item label="价格" name="price" rules={[{ required: true, message: '请输入价格' }]}>
            <InputNumber min={0} step={0.01} precision={2} style={{ width: '100%' }} placeholder="0.00" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={submitting}>确认添加</Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
