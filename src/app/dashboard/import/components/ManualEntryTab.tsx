'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

interface ManualEntryTabProps {
  user: any
  supabase: any
  onImportComplete?: (message: string) => void
}

interface ManualEntry {
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

interface CurrentEntry extends Omit<ManualEntry, 'amount' | 'commission' | 'stamp_duty'> {
  amount: number
  commission: number
  stamp_duty: number
}

export default function ManualEntryTab({ user, supabase, onImportComplete }: ManualEntryTabProps) {
  const [stockList, setStockList] = useState<{ code: string; name: string }[]>([])
  const [stockSearch, setStockSearch] = useState('')
  const [manualEntries, setManualEntries] = useState<ManualEntry[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null)
  const [currentEntry, setCurrentEntry] = useState<CurrentEntry>({
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
      const trade: ManualEntry = {
        trade_date: currentEntry.trade_date,
        trade_time: currentEntry.trade_time,
        stock_code: currentEntry.stock_code,
        stock_name: currentEntry.stock_name,
        direction: currentEntry.direction,
        quantity: currentEntry.quantity,
        price: currentEntry.price,
        amount: currentEntry.quantity * currentEntry.price,
        commission: currentEntry.quantity * currentEntry.price * 0.0003,
        stamp_duty: currentEntry.direction === 'sell' ? currentEntry.quantity * currentEntry.price * 0.0005 : 0
      }
      
      setManualEntries([...manualEntries, trade])
      setModalOpen(false)
    } catch (error: any) {
      console.error('添加失败:', error)
      setImportResult({ success: false, message: `添加失败: ${error.message}` })
    } finally {
      setSubmitting(false)
    }
  }

  // 提交手动录入数据（批量插入到数据库）
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
      onImportComplete?.(`成功导入 ${trades.length} 条交易记录`)
    } catch (error: any) {
      console.error('导入失败:', error)
      setImportResult({ success: false, message: `导入失败: ${error.message}` })
    } finally {
      setSubmitting(false)
    }
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

  return (
    <>
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
            <table className="table">
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
                    <td className="px-2 py-2 text-slate-600">{entry.trade_date}</td>
                    <td className="px-2 py-2 text-slate-600">{entry.trade_time}</td>
                    <td className="px-2 py-2 text-slate-600">{entry.stock_code}</td>
                    <td className="px-2 py-2 text-slate-600">{entry.stock_name}</td>
                    <td className="px-2 py-2">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${entry.direction === 'buy' ? 'badge-buy' : 'badge-sell'}`}>
                        {entry.direction === 'buy' ? '买入' : '卖出'}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-slate-600">{entry.quantity}</td>
                    <td className="px-2 py-2 text-slate-600">{entry.price.toFixed(2)}</td>
                    <td className="px-2 py-2 text-slate-600">{entry.amount?.toFixed(2) || '0.00'}</td>
                    <td className="px-2 py-2 text-slate-600">{entry.commission?.toFixed(2) || '0.00'}</td>
                    <td className="px-2 py-2 text-slate-600">{entry.stamp_duty?.toFixed(2) || '0.00'}</td>
                    <td className="px-2 py-2">
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
    </>
  )
}
