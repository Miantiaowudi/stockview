'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { getStockNames } from '@/lib/stockApi'
import ReactECharts from 'echarts-for-react'
import Link from 'next/link'

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
    // 按日期分组买卖点
    const tradeMap = new Map<number, { buys: any[], sells: any[] }>()
    
    trades.forEach(t => {
      const idx = klineData.findIndex(k => k.date.startsWith(t.trade_time.split('T')[0]))
      if (idx < 0) return
      
      if (!tradeMap.has(idx)) {
        tradeMap.set(idx, { buys: [], sells: [] })
      }
      const entry = tradeMap.get(idx)!
      if (t.direction === 'buy') {
        entry.buys.push({ price: t.price, quantity: t.quantity })
      } else {
        entry.sells.push({ price: t.price, quantity: t.quantity })
      }
    })
    
    // 生成交易标记
    const tradeMarkers: any[] = []
    tradeMap.forEach((tradesAtIdx, idx) => {
      const hasBuy = tradesAtIdx.buys.length > 0
      const hasSell = tradesAtIdx.sells.length > 0
      const price = klineData[idx].high * 1.02
      
      if (hasBuy && hasSell) {
        tradeMarkers.push({
          idx, price, type: 'T', trades: [...tradesAtIdx.buys.map((t: any) => ({...t, direction: '买入'})), ...tradesAtIdx.sells.map((t: any) => ({...t, direction: '卖出'}))]
        })
      } else if (hasBuy) {
        tradeMarkers.push({
          idx, price, type: 'B', trades: tradesAtIdx.buys.map((t: any) => ({...t, direction: '买入'}))
        })
      } else if (hasSell) {
        tradeMarkers.push({
          idx, price, type: 'S', trades: tradesAtIdx.sells.map((t: any) => ({...t, direction: '卖出'}))
        })
      }
    })
    
    // 按类型分组交易标记
    const markersB = tradeMarkers.filter(m => m.type === 'B')
    const markersS = tradeMarkers.filter(m => m.type === 'S')
    const markersT = tradeMarkers.filter(m => m.type === 'T')
    
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
          borderRadius: 8,
          backgroundColor: '#f8fafc',
          fillerColor: 'rgba(59, 130, 246, 0.1)',
          handleStyle: {
            color: '#3b82f6'
          }
        },
      ],
      xAxis: {
        type: 'category',
        data: klineData.map(d => d.date),
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: {
          color: '#64748b',
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
          color: '#64748b',
          fontSize: 10,
          formatter: (value: number) => value.toFixed(2)
        },
        splitLine: {
          lineStyle: {
            color: '#f1f5f9',
            type: 'dashed'
          }
        }
      },
      legend: {
        show: true,
        top: 5,
        textStyle: {
          color: '#64748b'
        },
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
        axisPointer: { 
          type: 'cross',
          crossStyle: {
            color: '#94a3b8'
          }
        },
        backgroundColor: 'rgba(255,255,255,0.98)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#334155', fontSize: 12 },
        shadowBlur: 10,
        shadowColor: 'rgba(0,0,0,0.1)',
        formatter: (params: any) => {
          // 检查是否有交易标记
          const buyPoint = params.find((p: any) => p.seriesName === '买入')
          const sellPoint = params.find((p: any) => p.seriesName === '卖出')
          const tPoint = params.find((p: any) => p.seriesName === 'T+0')
          
          // 获取K线数据的索引
          const klinePoint = params.find((p: any) => p.seriesName === 'K线')
          const dataIndex = klinePoint ? klinePoint.dataIndex : params[0].dataIndex
          const item = klineData[dataIndex]
          const ma5 = calculateMA(5, klineData)[dataIndex]
          const ma10 = calculateMA(10, klineData)[dataIndex]
          const ma20 = calculateMA(20, klineData)[dataIndex]
          const ma60 = calculateMA(60, klineData)[dataIndex]
          
          let html = `<div style="padding: 8px; min-width: 160px;">`
          html += `<div style="font-weight: 600; margin-bottom: 8px; color: #0f172a;">📅 ${item.date}</div>`
          html += `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px;">`
          html += `<span style="color: #64748b;">开盘:</span><span style="text-align: right; font-weight: 500;">¥${item.open.toFixed(2)}</span>`
          html += `<span style="color: #64748b;">收盘:</span><span style="text-align: right; font-weight: 500;">¥${item.close.toFixed(2)}</span>`
          html += `<span style="color: #64748b;">最高:</span><span style="text-align: right; font-weight: 500; color: #dc2626;">¥${item.high.toFixed(2)}</span>`
          html += `<span style="color: #64748b;">最低:</span><span style="text-align: right; font-weight: 500; color: #22c55e;">¥${item.low.toFixed(2)}</span>`
          html += `</div>`
          html += `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0; display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px;">`
          html += `<span style="color: #f97316;">MA5:</span><span style="text-align: right; font-weight: 500;">${ma5 ? ma5.toFixed(2) : '-'}</span>`
          html += `<span style="color: #8b5cf6;">MA10:</span><span style="text-align: right; font-weight: 500;">${ma10 ? ma10.toFixed(2) : '-'}</span>`
          html += `<span style="color: #06b6d4;">MA20:</span><span style="text-align: right; font-weight: 500;">${ma20 ? ma20.toFixed(2) : '-'}</span>`
          html += `<span style="color: #ec4899;">MA60:</span><span style="text-align: right; font-weight: 500;">${ma60 ? ma60.toFixed(2) : '-'}</span>`
          html += `</div>`
          
          // 如果有交易标记，添加交易信息
          if (buyPoint) {
            const tradesList = buyPoint.data.trades
            tradesList.forEach((t: any) => {
              html += `<div style="margin-top: 8px; padding: 6px; background: #fef2f2; border-radius: 4px; color: #dc2626; font-size: 11px;">📍 买入 ¥${t.price.toFixed(2)} × ${t.quantity}</div>`
            })
          }
          if (sellPoint) {
            const tradesList = sellPoint.data.trades
            tradesList.forEach((t: any) => {
              html += `<div style="margin-top: 4px; padding: 6px; background: #f0fdf4; border-radius: 4px; color: #16a34a; font-size: 11px;">📍 卖出 ¥${t.price.toFixed(2)} × ${t.quantity}</div>`
            })
          }
          if (tPoint) {
            const tradesList = tPoint.data.trades
            tradesList.forEach((t: any) => {
              const color = t.direction === '买入' ? '#dc2626' : '#16a34a'
              html += `<div style="margin-top: 4px; padding: 6px; background: #fffbeb; border-radius: 4px; color: ${color}; font-size: 11px;">📍 ${t.direction} ¥${t.price.toFixed(2)} × ${t.quantity}</div>`
            })
          }
          
          html += `</div>`
          return html
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
          lineStyle: { width: 1.5, color: '#f97316' }
        },
        {
          name: 'MA10',
          type: 'line',
          data: calculateMA(10, klineData),
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 1.5, color: '#8b5cf6' }
        },
        {
          name: 'MA20',
          type: 'line',
          data: calculateMA(20, klineData),
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 1.5, color: '#06b6d4' }
        },
        {
          name: 'MA60',
          type: 'line',
          data: calculateMA(60, klineData),
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 1.5, color: '#ec4899' }
        },
        // 买入标记
        {
          name: '买入',
          type: 'scatter',
          data: markersB.map(d => ({
            value: [d.idx, d.price],
            trades: d.trades
          })),
          symbol: 'circle',
          symbolSize: 18,
          itemStyle: { 
            color: '#ef4444',
            shadowBlur: 4,
            shadowColor: 'rgba(239, 68, 68, 0.4)'
          },
          label: {
            show: true,
            formatter: 'B',
            color: '#fff',
            fontSize: 10,
            fontWeight: 'bold'
          }
        },
        // 卖出标记
        {
          name: '卖出',
          type: 'scatter',
          data: markersS.map(d => ({
            value: [d.idx, d.price],
            trades: d.trades
          })),
          symbol: 'circle',
          symbolSize: 18,
          itemStyle: { 
            color: '#22c55e',
            shadowBlur: 4,
            shadowColor: 'rgba(34, 197, 94, 0.4)'
          },
          label: {
            show: true,
            formatter: 'S',
            color: '#fff',
            fontSize: 10,
            fontWeight: 'bold'
          }
        },
        // T+0标记
        {
          name: 'T+0',
          type: 'scatter',
          data: markersT.map(d => ({
            value: [d.idx, d.price],
            trades: d.trades
          })),
          symbol: 'circle',
          symbolSize: 18,
          itemStyle: { 
            color: '#f59e0b',
            shadowBlur: 4,
            shadowColor: 'rgba(245, 158, 11, 0.4)'
          },
          label: {
            show: true,
            formatter: 'T',
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
              <Link 
                href="/dashboard"
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-lg font-bold text-slate-800">{stockName} ({stockCode})</h1>
                <p className="text-xs text-slate-500">股票交易明细</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link 
                href="/dashboard" 
                className="px-3 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              >
                返回列表
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
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="stat-card stagger-item">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="stat-card-label">买入总额</span>
            </div>
            <p className="stat-card-value">¥{totalBuy.toLocaleString()}</p>
          </div>

          <div className="stat-card stagger-item">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="stat-card-label">卖出总额</span>
            </div>
            <p className="stat-card-value">¥{totalSell.toLocaleString()}</p>
          </div>

          <div className="stat-card stagger-item">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
              </div>
              <span className="stat-card-label">手续费</span>
            </div>
            <p className="stat-card-value text-slate-700">¥{totalCommission.toFixed(2)}</p>
          </div>

          <div className={`stat-card stagger-item ${profitLoss >= 0 ? 'border-green-200' : 'border-red-200'}`}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-lg ${profitLoss >= 0 ? 'bg-green-50' : 'bg-red-50'} flex items-center justify-center`}>
                <svg className={`w-5 h-5 ${profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {profitLoss >= 0 ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  )}
                </svg>
              </div>
              <span className="stat-card-label">盈亏</span>
            </div>
            <p className={`stat-card-value ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitLoss >= 0 ? '+' : ''}¥{profitLoss.toFixed(2)}
            </p>
          </div>
        </div>

        {/* K线图 */}
        <div className="card p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
              K线图
            </h2>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-red-500"></span>
                <span className="text-slate-600">上涨</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-green-500"></span>
                <span className="text-slate-600">下跌</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="text-slate-600">买入点</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span className="text-slate-600">卖出点</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span className="text-slate-600">T+0</span>
              </div>
            </div>
          </div>
          
          {klineData.length > 0 ? (
            <ReactECharts 
              option={getChartOption()} 
              style={{ height: '550px', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          ) : (
            <div className="h-96 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500">加载K线数据中...</p>
              </div>
            </div>
          )}
        </div>

        {/* 成交明细 */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
            成交明细
          </h2>
          {trades.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left">时间</th>
                    <th className="px-4 py-3 text-left">方向</th>
                    <th className="px-4 py-3 text-left">价格</th>
                    <th className="px-4 py-3 text-left">数量</th>
                    <th className="px-4 py-3 text-left">金额</th>
                    <th className="px-4 py-3 text-left">手续费</th>
                  </tr>

                </thead>
                <tbody>
                  {trades.map((trade, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                        {new Date(trade.trade_time).toLocaleString('zh-CN')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${trade.direction === 'buy' ? 'badge-buy' : 'badge-sell'}`}>
                          {trade.direction === 'buy' ? '买入' : '卖出'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">¥{trade.price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-600">{trade.quantity}</td>
                      <td className="px-4 py-3 font-medium">¥{(trade.price * trade.quantity).toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-500">¥{trade.commission.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-slate-500">暂无成交记录</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
