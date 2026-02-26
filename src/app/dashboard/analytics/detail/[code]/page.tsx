'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { getStockNames } from '@/lib/stockApi'
import { ComposedChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'

interface Trade {
  id: string
  stock_code: string
  direction: 'buy' | 'sell'
  price: number
  quantity: number
  commission: number
  trade_time: string
}

interface KLineItem {
  date: string
  open: number
  close: number
  high: number
  low: number
}

export default function StockDetailPage(props: { params: Promise<{ code: string }> }) {
  const params = use(props.params)
  const stockCode = params.code

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [trades, setTrades] = useState<Trade[]>([])
  const [stockName, setStockName] = useState('')
  const [klineData, setKlineData] = useState<KLineItem[]>([])
  
  const router = useRouter()
  const supabase = createClient()

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

  useEffect(() => {
    if (!stockCode) return
    const fetchKline = async () => {
      try {
        const response = await fetch(`/api/kline?code=${stockCode}`)
        const data = await response.json()
        if (Array.isArray(data)) {
          const converted = data.map((item: any) => ({
            date: item.time,
            open: item.open,
            close: item.close,
            high: item.high,
            low: item.low
          }))
          setKlineData(converted.slice(-60))
        }
      } catch (e) {
        console.error('获取K线数据失败:', e)
      }
    }
    fetchKline()
  }, [stockCode])

  useEffect(() => {
    if (!user || !stockCode) return
    const loadData = async () => {
      const { data: tradesData, error } = await supabase
        .from('normalized_trades')
        .select('*')
        .eq('user_id', user.id)
        .eq('stock_code', stockCode)
        .order('trade_time', { ascending: true })

      if (error) {
        console.error('加载交易数据失败:', error)
        return
      }

      setTrades(tradesData || [])
      try {
        const names = await getStockNames([stockCode])
        setStockName(names[stockCode] || stockCode)
      } catch (e) {
        setStockName(stockCode)
      }
    }
    loadData()
  }, [user, stockCode, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const buyTrades = trades.filter(t => t.direction === 'buy')
  const sellTrades = trades.filter(t => t.direction === 'sell')
  const totalBuy = buyTrades.reduce((sum, t) => sum + t.price * t.quantity, 0)
  const totalSell = sellTrades.reduce((sum, t) => sum + t.price * t.quantity, 0)
  const totalCommission = trades.reduce((sum, t) => sum + t.commission, 0)
  const profitLoss = totalSell - totalBuy - totalCommission

  // 为K线图准备数据 - 显示涨跌
  const chartData = klineData.map(item => ({
    date: item.date,
    open: item.open,
    close: item.close,
    high: item.high,
    low: item.low,
    isUp: item.close >= item.open,
    range: [Math.min(item.open, item.close), Math.max(item.open, item.close)],
    wick: [item.low, item.high]
  }))

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">加载中...</p></div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">{stockName} ({stockCode})</h1>
          <div className="flex items-center gap-4">
            <a href="/dashboard/analytics" className="text-blue-600 hover:underline">返回</a>
            <span className="text-gray-600">{user?.email}</span>
            <button onClick={handleLogout} className="text-sm text-blue-600 hover:underline">退出</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">买入总额</h3>
            <p className="text-2xl font-bold">¥{totalBuy.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">卖出总额</h3>
            <p className="text-2xl font-bold">¥{totalSell.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">手续费</h3>
            <p className="text-2xl font-bold">¥{totalCommission.toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">盈亏</h3>
            <p className={`text-2xl font-bold ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitLoss >= 0 ? '+' : ''}¥{profitLoss.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-lg font-semibold mb-4">K线图 (近60日)</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={chartData}>
                <XAxis dataKey="date" tick={{fontSize: 10}} />
                <YAxis domain={['auto', 'auto']} tick={{fontSize: 10}} />
                <Tooltip 
                  formatter={(value: number, name: string) => [`¥${value}`, name]}
                  labelFormatter={(label) => `日期: ${label}`}
                />
                {trades.map((trade, i) => (
                  <ReferenceLine 
                    key={i}
                    segment={[{ x: trade.trade_time.split('T')[0], y: trade.price }, { x: trade.trade_time.split('T')[0], y: trade.price }]}
                    stroke={trade.direction === 'buy' ? '#ef4444' : '#22c55e'}
                    strokeDasharray="3 3"
                  />
                ))}
                <Bar dataKey="range" barSize={8}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.isUp ? '#ef4444' : '#22c55e'} />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-96 flex items-center justify-center text-gray-500">
              <p>加载K线数据中...</p>
            </div>
          )}
          <div className="flex items-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500"></span>
              <span>上涨</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500"></span>
              <span>下跌</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">成交明细</h2>
          {trades.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">时间</th>
                    <th className="px-4 py-2 text-left">方向</th>
                    <th className="px-4 py-2 text-right">价格</th>
                    <th className="px-4 py-2 text-right">数量</th>
                    <th className="px-4 py-2 text-right">金额</th>
                    <th className="px-4 py-2 text-right">手续费</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-2">{new Date(trade.trade_time).toLocaleString('zh-CN')}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs ${trade.direction === 'buy' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                          {trade.direction === 'buy' ? '买入' : '卖出'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">¥{trade.price.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">{trade.quantity}</td>
                      <td className="px-4 py-2 text-right">¥{(trade.price * trade.quantity).toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">¥{trade.commission.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-10">暂无成交记录</p>
          )}
        </div>
      </main>
    </div>
  )
}
