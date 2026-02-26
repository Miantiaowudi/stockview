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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">StockView 账户分析</h1>
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-blue-600 hover:underline">返回</a>
            <span className="text-gray-600">{user?.email}</span>
            <button onClick={handleLogout} className="text-sm text-blue-600 hover:underline">
              退出
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 总体概览 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">总买入</h3>
            <p className="text-2xl font-bold">¥{totalBuy.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">总卖出</h3>
            <p className="text-2xl font-bold">¥{totalSell.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">手续费合计</h3>
            <p className="text-2xl font-bold">¥{(totalSell - totalBuy - totalPnL).toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">总盈亏</h3>
            <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalPnL >= 0 ? '+' : ''}¥{totalPnL.toLocaleString()}
            </p>
          </div>
        </div>

        {/* 交易明细 - 已清仓个股 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">已清仓个股</h2>
          {clearedPositions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clearedPositions.map((pos, i) => (
                <Link 
                  key={i} 
                  href={`/dashboard/analytics/detail/${pos.stock_code}`}
                  className={`block border rounded-lg p-4 transition hover:shadow-md ${pos.profit_loss >= 0 ? 'border-green-200 bg-green-50 hover:border-green-400' : 'border-red-200 bg-red-50 hover:border-red-400'}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{pos.stock_name}</h3>
                      <p className="text-sm text-gray-500">{pos.stock_code}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-bold ${pos.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {pos.profit_loss >= 0 ? '+' : ''}¥{pos.profit_loss.toFixed(2)}
                      </p>
                      <p className={`text-sm ${pos.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {pos.profit_rate >= 0 ? '+' : ''}{pos.profit_rate.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">买入</p>
                      <p className="font-medium">¥{pos.buy_avg_price.toFixed(2)} × {pos.buy_quantity}</p>
                      <p className="text-gray-500 text-xs">合计: ¥{pos.buy_total.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">卖出</p>
                      <p className="font-medium">¥{pos.sell_avg_price.toFixed(2)} × {pos.sell_quantity}</p>
                      <p className="text-gray-500 text-xs">合计: ¥{pos.sell_total.toFixed(2)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-10">暂无已清仓交易记录</p>
          )}
        </div>
      </main>
    </div>
  )
}
