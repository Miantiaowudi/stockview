'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { getStockNames } from '@/lib/stockApi'
import ReactECharts from 'echarts-for-react'

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
          setKlineData(converted)
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

  // 计算移动平均线
  const calculateMA = (dayCount: number, data: KLineItem[]) => {
    const result: (number | null)[] = []
    for (let i = 0; i < data.length; i++) {
      if (i < dayCount - 1) {
        result.push(null)
        continue
      }
      let sum = 0
      for (let j = 0; j < dayCount; j++) {
        sum += data[i - j].close
      }
      result.push(Number((sum / dayCount).toFixed(2)))
    }
    return result
  }

  const getChartOption = () => {
    // 初始显示最后10%的数据
    const initialStart = 90
    const initialEnd = 100
    // 准备买卖点数据
    const buyData = trades.filter(t => t.direction === 'buy').map(t => {
      const idx = klineData.findIndex(k => k.date.startsWith(t.trade_time.split('T')[0]))
      return { value: idx >= 0 ? klineData[idx].high : null, name: 'B', idx, price: t.price, quantity: t.quantity }
    }).filter(d => d.idx >= 0)
    
    const sellData = trades.filter(t => t.direction === 'sell').map(t => {
      const idx = klineData.findIndex(k => k.date.startsWith(t.trade_time.split('T')[0]))
      return { value: idx >= 0 ? klineData[idx].high : null, name: 'S', idx, price: t.price, quantity: t.quantity }
    }).filter(d => d.idx >= 0)
    
    return {
      grid: {
        left: '80',
        right: '80',
        top: '20',
        bottom: '80'
      },
      dataZoom: [
        {
          type: 'slider',
          show: true,
          xAxisIndex: 0,
          start: initialStart,
          end: initialEnd,
          height: 30,
          bottom: 25,
        },
      ],
      xAxis: {
        type: 'category',
        data: klineData.map(d => d.date),
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: {
          color: '#6b7280',
          fontSize: 10,
          formatter: (value: string) => {
            const date = new Date(value)
            const year = date.getFullYear()
            const month = date.getMonth() + 1
            const day = date.getDate()
            return `${year}/${month}/${day}`
          },
        },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'value',
        scale: true,
        position: 'left',
        axisLine: { show: false },
        axisLabel: {
          color: '#6b7280',
          fontSize: 10,
          formatter: (value: number) => value.toFixed(2)
        },
        splitLine: {
          lineStyle: {
            color: '#f3f4f6',
            type: 'dashed'
          }
        }
      },
      legend: {
        show: true,
        top: 5,
        data: ['MA5', 'MA10', 'MA20', 'MA60'],
        selected: {
          'MA5': true,
          'MA10': true,
          'MA20': true,
          'MA60': true
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#e5e7eb',
        textStyle: { color: '#333', fontSize: 12 },
        formatter: (params: any) => {
          const dataIndex = params[0].dataIndex
          const item = klineData[dataIndex]
          const ma5 = calculateMA(5, klineData)[dataIndex]
          const ma10 = calculateMA(10, klineData)[dataIndex]
          const ma20 = calculateMA(20, klineData)[dataIndex]
          const ma60 = calculateMA(60, klineData)[dataIndex]
          return `
            <div style="padding: 4px;">
              <div>日期: ${item.date}</div>
              <div>开盘: ${item.open.toFixed(2)}</div>
              <div>收盘: ${item.close.toFixed(2)}</div>
              <div>最高: ${item.high.toFixed(2)}</div>
              <div>最低: ${item.low.toFixed(2)}</div>
              <div>MA5: ${ma5 ? ma5.toFixed(2) : '-'}</div>
              <div>MA10: ${ma10 ? ma10.toFixed(2) : '-'}</div>
              <div>MA20: ${ma20 ? ma20.toFixed(2) : '-'}</div>
              <div>MA60: ${ma60 ? ma60.toFixed(2) : '-'}</div>
            </div>
          `
        }
      },
      series: [
        {
          name: 'K线',
          type: 'candlestick',
          data: klineData.map(d => [d.open, d.close, d.low, d.high]),
          itemStyle: {
            color: '#ef4444',
            color0: '#22c55e',
            borderColor: '#ef4444',
            borderColor0: '#22c55e'
          }
        },
        {
          name: 'MA5',
          type: 'line',
          data: calculateMA(5, klineData),
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 1, color: '#f97316' }
        },
        {
          name: 'MA10',
          type: 'line',
          data: calculateMA(10, klineData),
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 1, color: '#8b5cf6' }
        },
        {
          name: 'MA20',
          type: 'line',
          data: calculateMA(20, klineData),
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 1, color: '#06b6d4' }
        },
        {
          name: 'MA60',
          type: 'line',
          data: calculateMA(60, klineData),
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 1, color: '#ec4899' }
        },
        {
          name: '买入',
          type: 'scatter',
          data: buyData.map(d => ({
            value: [d.idx, klineData[d.idx].high * 1.02],
            name: 'B',
            price: d.price,
            quantity: d.quantity
          })),
          symbol: 'circle',
          symbolSize: 16,
          itemStyle: { color: '#ef4444' },
          tooltip: {
            formatter: (params: any) => {
              const p = params.data
              return `买入<br/>价格: ¥${p.price.toFixed(2)}<br/>数量: ${p.quantity}`
            }
          },
          label: {
            show: true,
            formatter: 'B',
            color: '#fff',
            fontSize: 10,
            fontWeight: 'bold'
          }
        },
        {
          name: '卖出',
          type: 'scatter',
          data: sellData.map(d => ({
            value: [d.idx, klineData[d.idx].high * 1.02],
            name: 'S',
            price: d.price,
            quantity: d.quantity
          })),
          symbol: 'circle',
          symbolSize: 16,
          itemStyle: { color: '#38bdf8' },
          tooltip: {
            formatter: (params: any) => {
              const p = params.data
              return `卖出<br/>价格: ¥${p.price.toFixed(2)}<br/>数量: ${p.quantity}`
            }
          },
          label: {
            show: true,
            formatter: 'S',
            color: '#fff',
            fontSize: 10,
            fontWeight: 'bold'
          }
        }
      ]
    }
  }

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
          <h2 className="text-lg font-semibold mb-4">K线图</h2>
          
          {klineData.length > 0 ? (
            <ReactECharts 
              option={getChartOption()} 
              style={{ height: '600px', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
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
