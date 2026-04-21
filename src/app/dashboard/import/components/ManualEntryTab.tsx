'use client'

import { useState, useEffect, useRef } from 'react'
import { Modal, Form, InputNumber, Radio, DatePicker, TimePicker, Select, message, Button } from 'antd'
import type { SelectProps } from 'antd'
import dayjs from 'dayjs'
import { useLocalTrades } from '@/hooks/useLocalTrades'

interface ManualEntryTabProps {
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

// Debounce hook
const useDebouncedValue = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

export default function ManualEntryTab({ onImportComplete }: ManualEntryTabProps) {
  const [stockList, setStockList] = useState<SelectProps['options']>([])
  const [manualEntries, setManualEntries] = useState<ManualEntry[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [stockLoading, setStockLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const stockPageRef = useRef(1)

  const [stockSearchInput, setStockSearchInput] = useState('')
  const debouncedStockSearch = useDebouncedValue(stockSearchInput, 300)

  const { addTrade, reload } = useLocalTrades()

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

  // Load stocks when debounced search changes
  useEffect(() => {
    if (debouncedStockSearch) {
      stockPageRef.current = 1
      loadStocks(debouncedStockSearch, 1, false)
    } else {
      // Clear list when search is empty
      setStockList([])
      setHasMore(true)
      stockPageRef.current = 1
    }
  }, [debouncedStockSearch])

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
    setStockSearchInput(value)
  }

  const handlePopupScroll: React.UIEventHandler<HTMLDivElement> = (e) => {
    const target = e.target as HTMLDivElement
    const { scrollTop, clientHeight, scrollHeight } = target

    if (scrollHeight - scrollTop - clientHeight < 50 && !stockLoading && hasMore) {
      stockPageRef.current += 1
      loadStocks(debouncedStockSearch, stockPageRef.current, true)
    }
  }

  const handleManualSubmit = async () => {
    const validEntries = manualEntries.filter(entry =>
      entry.stock_code && entry.quantity > 0 && entry.price > 0
    )

    if (validEntries.length === 0) {
      message.error('请至少填写一条有效的交易记录')
      return
    }

    setSubmitting(true)

    try {
      for (const entry of validEntries) {
        await addTrade({
          stock_code: entry.stock_code,
          direction: entry.direction,
          price: entry.price,
          quantity: entry.quantity,
          commission: entry.commission,
          trade_time: `${entry.trade_date}T${entry.trade_time}`,
        })
      }

      await reload()

      message.success(`成功导入 ${validEntries.length} 条交易记录`)
      setManualEntries([])
      onImportComplete?.(`成功导入 ${validEntries.length} 条交易记录`)
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

  return (
    <>
      <div className="card p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
            手动录入
          </h2>

          {/* Add Button */}
          <Button
            type="primary"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
            onClick={openAddModal}
          >
            添加
          </Button>
        </div>

        {/* Table with data */}
        {manualEntries.length > 0 ? (
          <>
            <div className="table-container mb-6">
              <table className="table">
                <thead>
                  <tr>
                    <th>成交日期</th>
                    <th>成交时间</th>
                    <th>证券代码</th>
                    <th>证券名称</th>
                    <th>操作</th>
                    <th>数量</th>
                    <th>价格</th>
                    <th>金额</th>
                    <th>手续费</th>
                    <th>印花税</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {manualEntries.map((row) => (
                    <tr key={row.key}>
                      <td>{row.trade_date}</td>
                      <td>{row.trade_time}</td>
                      <td>{row.stock_code}</td>
                      <td>{row.stock_name}</td>
                      <td>
                        <span className={`badge ${row.direction === 'buy' ? 'badge-buy' : 'badge-sell'}`}>
                          {row.direction === 'buy' ? '买入' : '卖出'}
                        </span>
                      </td>
                      <td>{row.quantity}</td>
                      <td>{row.price?.toFixed(2) || '0.00'}</td>
                      <td>{row.amount?.toFixed(2) || '0.00'}</td>
                      <td>{row.commission?.toFixed(2) || '0.00'}</td>
                      <td>{row.stamp_duty?.toFixed(2) || '0.00'}</td>
                      <td>
                        <Button
                          danger
                          type="text"
                          size="small"
                          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                          onClick={() => removeManualEntry(row.key)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <Button
                type="primary"
                loading={submitting}
                disabled={manualEntries.length === 0}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                onClick={handleManualSubmit}
              >
                {submitting ? '提交中...' : '提交'}
              </Button>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200">
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-12 h-12 mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-sm text-slate-600 mb-2">
                点击"<span className="font-semibold text-blue-600">添加</span>"开始录入交易记录
              </p>
              <p className="text-xs text-slate-400">支持手动添加股票买卖记录</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal - unchanged */}
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
                  {!hasMore && debouncedStockSearch && <div style={{ padding: '8px', textAlign: 'center', color: '#999' }}>没有更多了</div>}
                  {!debouncedStockSearch && <div style={{ padding: '8px', textAlign: 'center', color: '#999' }}>请输入搜索关键词</div>}
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
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
              disabled={submitting}
            >
              确认添加
            </button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
