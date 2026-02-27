'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getStockNames } from '@/lib/stockApi'

interface Trade {
  id: string
  stock_code: string
  direction: 'buy' | 'sell'
  price: number
  quantity: number
  commission: number
  trade_time: string
}

interface ClearedPosition {
  stock_code: string
  stock_name: string
  buy_quantity: number
  buy_avg_price: number
  buy_total: number
  sell_quantity: number
  sell_avg_price: number
  sell_total: number
  profit_loss: number
  profit_rate: number
}

export default function AnalyticsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [trades, setTrades] = useState<Trade[]>([])
  const [clearedPositions, setClearedPositions] = useState<ClearedPosition[]>([])
  const [totalPnL, setTotalPnL] = useState(0)
  const [totalBuy, setTotalBuy] = useState(0)
  const [totalSell, setTotalSell] = useState(0)
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

  // 加载交易数据并计算
  useEffect(() => {
    if (!user) return

    const loadData = async () => {
      // 获取所有交易记录
      const { data: tradesData, error } = await supabase
        .from('normalized_trades')
        .select('*')
        .eq('user_id', user.id)
        .order('trade_time', { ascending: true })

      if (error) {
        console.error('加载交易数据失败:', error)
        return
      }

      setTrades(tradesData || [])
      calculateClearedPositions(tradesData || [])
    }

    loadData()
  }, [user, supabase])

  // 计算已清仓的个股
  const calculateClearedPositions = async (trades: Trade[]) => {
    const stockMap = new Map<string, { buys: {price: number, quantity: number}[], sells: {price: number, quantity: number}[] }>()

    trades.forEach(trade => {
      if (!stockMap.has(trade.stock_code)) {
        stockMap.set(trade.stock_code, { buys: [], sells: [] })
      }
      const stock = stockMap.get(trade.stock_code)!
      
      if (trade.direction === 'buy') {
        stock.buys.push({ price: trade.price, quantity: trade.quantity })
      } else {
        stock.sells.push({ price: trade.price, quantity: trade.quantity })
      }
    })

    const cleared: ClearedPosition[] = []
    let totalPnL = 0
    let totalBuyAmount = 0
    let totalSellAmount = 0

    stockMap.forEach((data, code) => {
      const totalBuyQty = data.buys.reduce((sum, b) => sum + b.quantity, 0)
      const totalSellQty = data.sells.reduce((sum, s) => sum + s.quantity, 0)

      // 只处理已清仓的（买入数量 = 卖出数量）
      if (totalBuyQty > 0 && totalBuyQty === totalSellQty) {
        const buyTotal = data.buys.reduce((sum, b) => sum + b.price * b.quantity, 0)
        const sellTotal = data.sells.reduce((sum, s) => sum + s.price * s.quantity, 0)
        const commission = trades
          .filter(t => t.stock_code === code)
          .reduce((sum, t) => sum + t.commission, 0)
        
        const profitLoss = sellTotal - buyTotal - commission
        const profitRate = (profitLoss / buyTotal) * 100

        cleared.push({
          stock_code: code,
          stock_name: code,
          buy_quantity: totalBuyQty,
          buy_avg_price: buyTotal / totalBuyQty,
          buy_total: buyTotal,
          sell_quantity: totalSellQty,
          sell_avg_price: sellTotal / totalSellQty,
          sell_total: sellTotal,
          profit_loss: profitLoss,
          profit_rate: profitRate
        })

        totalPnL += profitLoss
        totalBuyAmount += buyTotal
        totalSellAmount += sellTotal
      }
    })

    // 获取股票名称
    const codes = cleared.map(c => c.stock_code)
    if (codes.length > 0) {
      try {
        const names = await getStockNames(codes)
        const clearedWithNames = cleared.map(c => ({
          ...c,
          stock_name: names[c.stock_code] || c.stock_code
        }))
        setClearedPositions(clearedWithNames)
      } catch (e) {
        console.error('获取股票名称失败:', e)
        setClearedPositions(cleared)
      }
    } else {
      setClearedPositions(cleared)
    }

    setTotalPnL(totalPnL)
    setTotalBuy(totalBuyAmount)
    setTotalSell(totalSellAmount)
  }

  // 登出
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
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
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h1 className="text-lg font-bold text-slate-800">StockView 账户分析</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link 
                href="/dashboard/import" 
                className="px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                导入数据
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
        {/* 总体概览 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
            总体概览
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 总买入 */}
            <div className="stat-card stagger-item">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="stat-card-label">总买入</span>
              </div>
              <p className="stat-card-value">¥{totalBuy.toLocaleString()}</p>
            </div>

            {/* 总卖出 */}
            <div className="stat-card stagger-item">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="stat-card-label">总卖出</span>
              </div>
              <p className="stat-card-value">¥{totalSell.toLocaleString()}</p>
            </div>

            {/* 手续费合计 */}
            <div className="stat-card stagger-item">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                  </svg>
                </div>
                <span className="stat-card-label">手续费合计</span>
              </div>
              <p className="stat-card-value text-slate-700">¥{(totalSell - totalBuy - totalPnL).toFixed(2)}</p>
            </div>

            {/* 总盈亏 */}
            <div className={`stat-card stagger-item ${totalPnL >= 0 ? 'border-green-200' : 'border-red-200'}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg ${totalPnL >= 0 ? 'bg-green-50' : 'bg-red-50'} flex items-center justify-center`}>
                  <svg className={`w-5 h-5 ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {totalPnL >= 0 ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    )}
                  </svg>
                </div>
                <span className="stat-card-label">总盈亏</span>
              </div>
              <p className={`stat-card-value ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalPnL >= 0 ? '+' : ''}¥{totalPnL.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* 交易明细 - 已清仓个股 */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
            已清仓个股
          </h2>
          {clearedPositions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clearedPositions.map((pos, i) => (
                <Link 
                  key={i} 
                  href={`/dashboard/detail/${pos.stock_code}`}
                  className={`group block p-5 rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                    pos.profit_loss >= 0 
                      ? 'border-green-200 bg-gradient-to-br from-white to-green-50 hover:border-green-400' 
                      : 'border-red-200 bg-gradient-to-br from-white to-red-50 hover:border-red-400'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-slate-800 group-hover:text-blue-600 transition-colors">{pos.stock_name}</h3>
                      <p className="text-sm text-slate-500">{pos.stock_code}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-bold ${pos.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {pos.profit_loss >= 0 ? '+' : ''}¥{pos.profit_loss.toFixed(2)}
                      </p>
                      <p className={`text-sm font-medium ${pos.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {pos.profit_rate >= 0 ? '+' : ''}{pos.profit_rate.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">买入</p>
                      <p className="font-semibold text-slate-700">¥{pos.buy_avg_price.toFixed(2)} × {pos.buy_quantity}</p>
                      <p className="text-xs text-slate-400">合计: ¥{pos.buy_total.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">卖出</p>
                      <p className="font-semibold text-slate-700">¥{pos.sell_avg_price.toFixed(2)} × {pos.sell_quantity}</p>
                      <p className="text-xs text-slate-400">合计: ¥{pos.sell_total.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center text-sm text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>查看详情</span>
                    <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-slate-500">暂无已清仓交易记录</p>
              <p className="text-sm text-slate-400 mt-1">买入并卖出相同数量的股票后，会显示在这里</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
