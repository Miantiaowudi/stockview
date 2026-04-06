'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from 'antd'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getStockPrices, StockPrice, isMarketOpen, getNextMarketTime } from '@/lib/stockApi'
import PositionList from './components/PositionList'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useDashboardUser } from '@/components/DashboardUserProvider'

// Export interfaces for components
export interface Trade {
  id: string
  stock_code: string
  direction: 'buy' | 'sell'
  price: number
  quantity: number
  commission: number
  trade_time: string
}

export interface ClearedPosition {
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
  cleared_time?: string
}

export interface CurrentPosition {
  stock_code: string
  stock_name: string
  hold_quantity: number
  avg_cost: number
  total_cost: number
  buy_total?: number
  sell_total?: number
  current_price?: number
  yesterday_close?: number
  floating_pnl?: number
  floating_pnl_rate?: number
  daily_pnl?: number
  daily_pnl_rate?: number
}

export default function AnalyticsPage() {
  return (
    <ErrorBoundary>
      <AnalyticsPageContent />
    </ErrorBoundary>
  )
}

function AnalyticsPageContent() {
  const user = useDashboardUser()
  const [loading] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [trades, setTrades] = useState<Trade[]>([])
  const [clearedPositions, setClearedPositions] = useState<ClearedPosition[]>([])
  const [currentPositions, setCurrentPositions] = useState<CurrentPosition[]>([])
  const [stockPrices, setStockPrices] = useState<Record<string, StockPrice>>({})
  const [activeTab, setActiveTab] = useState<'current' | 'cleared'>('current')
  const [totalPnL, setTotalPnL] = useState(0)
  const [totalBuy, setTotalBuy] = useState(0)
  const [totalSell, setTotalSell] = useState(0)
  const [currentPnl, setCurrentPnl] = useState(0)
  const [showData, setShowData] = useState(true)
  const [marketStatus, setMarketStatus] = useState<{ isOpen: boolean; label: string }>({ isOpen: false, label: '休市' })

  // 刷新股票价格
  const refreshPrices = useCallback(async (positions: CurrentPosition[]) => {
    if (positions.length === 0) return

    const codes = positions.map(p => p.stock_code)
    try {
      const prices = await getStockPrices(codes)
      setStockPrices(prev => ({ ...prev, ...prices }))

      // 更新当前持仓的价格和盈亏
      const updated = positions.map(pos => {
        const price = prices[pos.stock_code]
        if (!price) return pos

        const currentMarketValue = price.currentPrice * pos.hold_quantity
        const floatingPnl = currentMarketValue - pos.total_cost
        const floatingPnlRate = (floatingPnl / pos.total_cost) * 100

        const dayOfWeek = new Date().getDay()
        let dailyPnl = 0
        let dailyPnlRate = 0
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          dailyPnl = (price.currentPrice - price.yesterdayClose) * pos.hold_quantity
          dailyPnlRate = ((price.currentPrice - price.yesterdayClose) / price.yesterdayClose) * 100
        }

        return {
          ...pos,
          current_price: price.currentPrice,
          yesterday_close: price.yesterdayClose,
          floating_pnl: floatingPnl,
          floating_pnl_rate: floatingPnlRate,
          daily_pnl: dailyPnl,
          daily_pnl_rate: dailyPnlRate
        }
      })

      setCurrentPositions(updated)
      const totalCurrentPnl = updated.reduce((sum, pos) => sum + (pos.daily_pnl || 0), 0)
      setCurrentPnl(totalCurrentPnl)
    } catch (e) {
      console.error('刷新价格失败:', e)
    }
  }, [])
  
  const router = useRouter()

// 掩码显示

  const formatValue = (value: number, showSign = false) => {
    if (!showData) return '****'
    const formatted = value.toLocaleString()
    return showSign && value > 0 ? '+' + formatted : formatted
  }
  
  const supabase = createClient()


  // 检查用户登录

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
      calculatePositions(tradesData || [])
    }

    loadData()
  }, [user, supabase])

  // 市场状态和定时轮询
  useEffect(() => {
    // 更新市场状态
    const updateMarketStatus = () => {
      const status = getNextMarketTime()
      setMarketStatus({ isOpen: status.isOpen, label: status.label })
    }

    updateMarketStatus()
    const statusInterval = setInterval(updateMarketStatus, 60000) // 每分钟检查一次市场状态

    // 定时刷新价格
    const refreshInterval = setInterval(() => {
      if (isMarketOpen() && currentPositions.length > 0 && dataLoaded) {
        refreshPrices(currentPositions)
      }
    }, 5000) // 开盘时每5秒刷新

    return () => {
      clearInterval(statusInterval)
      clearInterval(refreshInterval)
    }
  }, [currentPositions, dataLoaded, refreshPrices])

  // 计算已清仓和当前持仓
  const calculatePositions = async (trades: Trade[]) => {
    const stockMap = new Map<string, { 
      buys: {price: number, quantity: number, time: string}[], 
      sells: {price: number, quantity: number, time: string}[] 
    }>()

    trades.forEach(trade => {
      if (!stockMap.has(trade.stock_code)) {
        stockMap.set(trade.stock_code, { buys: [], sells: [] })
      }
      const stock = stockMap.get(trade.stock_code)!
      
      if (trade.direction === 'buy') {
        stock.buys.push({ price: trade.price, quantity: trade.quantity, time: trade.trade_time })
      } else {
        stock.sells.push({ price: trade.price, quantity: trade.quantity, time: trade.trade_time })
      }
    })

    const cleared: ClearedPosition[] = []
    const current: CurrentPosition[] = []
    let totalPnL = 0
    let totalBuyAmount = 0
    let totalSellAmount = 0

    stockMap.forEach((data, code) => {
      const totalBuyQty = data.buys.reduce((sum, b) => sum + b.quantity, 0)
      const totalSellQty = data.sells.reduce((sum, s) => sum + s.quantity, 0)
      const buyTotal = data.buys.reduce((sum, b) => sum + b.price * b.quantity, 0)
      const sellTotal = data.sells.reduce((sum, s) => sum + s.price * s.quantity, 0)
      const commission = trades
        .filter(t => t.stock_code === code)
        .reduce((sum, t) => sum + t.commission, 0)

      // 已清仓（买入数量 = 卖出数量）
      if (totalBuyQty > 0 && totalBuyQty === totalSellQty) {
        const profitLoss = sellTotal - buyTotal - commission
        const profitRate = (profitLoss / buyTotal) * 100
        
        // 获取最后卖出时间
        const lastSellTime = data.sells.length > 0 
          ? data.sells.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())[0].time
          : undefined

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
          profit_rate: profitRate,
          cleared_time: lastSellTime
        })

        totalPnL += profitLoss
        totalBuyAmount += buyTotal
        totalSellAmount += sellTotal
      } 
      // 当前持仓（买入数量 > 卖出数量）
      else if (totalBuyQty > totalSellQty) {
        const holdQuantity = totalBuyQty - totalSellQty
        const avgCost = (buyTotal - sellTotal + commission) / holdQuantity
        const totalCost = avgCost * holdQuantity

        current.push({
          stock_code: code,
          stock_name: code,
          hold_quantity: holdQuantity,
          avg_cost: avgCost,
          total_cost: totalCost,
          buy_total: buyTotal,
          sell_total: sellTotal
        })
      }
    })

    // 从 /price 接口读取股票名称与价格，避免重复调用 /stocks
    const allCodes = [...cleared.map(c => c.stock_code), ...current.map(c => c.stock_code)]
    if (allCodes.length > 0) {
      try {
        const prices = await getStockPrices(allCodes)
        setStockPrices(prices)
        const clearedWithNames = cleared.map(c => ({
          ...c,
          stock_name: prices[c.stock_code]?.name || c.stock_code
        }))
        const currentWithNames = current.map(c => ({
          ...c,
          stock_name: prices[c.stock_code]?.name || c.stock_code
        }))
        setClearedPositions(clearedWithNames)

        // 为当前持仓计算实时盈亏
        if (currentWithNames.length > 0) {
          // 计算浮动盈亏和当日盈亏
          const today = new Date()
          const dayOfWeek = today.getDay()
          
          const currentWithPnL = currentWithNames.map(pos => {
            const price = prices[pos.stock_code]
            if (price) {
              const currentMarketValue = price.currentPrice * pos.hold_quantity
              const floatingPnl = currentMarketValue - pos.total_cost
              const floatingPnlRate = (floatingPnl / pos.total_cost) * 100
              
              let dailyPnl = 0
              let dailyPnlRate = 0
              if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                dailyPnl = (price.currentPrice - price.yesterdayClose) * pos.hold_quantity
                dailyPnlRate = ((price.currentPrice - price.yesterdayClose) / price.yesterdayClose) * 100
              }
              
              return {
                ...pos,
                current_price: price.currentPrice,
                yesterday_close: price.yesterdayClose,
                floating_pnl: floatingPnl,
                floating_pnl_rate: floatingPnlRate,
                daily_pnl: dailyPnl,
                daily_pnl_rate: dailyPnlRate
              }
            }
            return pos
          })
          setCurrentPositions(currentWithPnL)
          
          const totalCurrentPnl = currentWithPnL.reduce((sum, pos) => sum + (pos.daily_pnl || 0), 0)
          setCurrentPnl(totalCurrentPnl)
          setDataLoaded(true)
        } else {
          setCurrentPnl(0)
          setDataLoaded(true)
        }
      } catch (e) {
        console.error('Failed to fetch stock prices:', e)
        setClearedPositions(cleared)
        setCurrentPositions(current)
        setCurrentPnl(0)
        setDataLoaded(true)
      }
    } else {
      setClearedPositions(cleared)
      setCurrentPositions(current)
      setCurrentPnl(0)
      setDataLoaded(true)
    }
    setTotalPnL(totalPnL)
    setTotalBuy(totalBuyAmount)
    setTotalSell(totalSellAmount)
  }

  // 登出
  const handleLogout = async () => {
    // 广播退出消息，让其他窗口刷新
    const { broadcastLogout } = await import('@/hooks/useAuthSync')
    broadcastLogout()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  // 骨架图加载
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header Skeleton */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse"></div>
                <div className="h-6 w-32 bg-slate-200 rounded animate-pulse"></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-8 w-20 bg-slate-200 rounded-lg animate-pulse"></div>
                <div className="h-6 w-24 bg-slate-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 总体概览 Skeleton */}
          <div className="mb-8">
            <div className="h-6 w-20 bg-slate-200 rounded animate-pulse mb-4"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-5 border border-slate-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-slate-200 rounded-lg animate-pulse"></div>
                    <div className="h-4 w-16 bg-slate-200 rounded animate-pulse"></div>
                  </div>
                  <div className="h-8 w-28 bg-slate-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Tab Skeleton */}
          <div className="mb-6">
            <div className="inline-flex gap-1 p-1 bg-slate-200/50 rounded-xl border border-slate-200/50 w-fit">
              <div className="w-24 h-10 bg-slate-200 rounded-lg animate-pulse"></div>
              <div className="w-24 h-10 bg-slate-200 rounded-lg animate-pulse"></div>
            </div>
          </div>

          {/* Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border-2 border-slate-200 p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="h-5 w-24 bg-slate-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-16 bg-slate-200 rounded animate-pulse"></div>
                  </div>
                  <div className="text-right">
                    <div className="h-6 w-20 bg-slate-200 rounded animate-pulse mb-1"></div>
                    <div className="h-4 w-12 bg-slate-200 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                  <div>
                    <div className="h-3 w-12 bg-slate-200 rounded animate-pulse mb-1"></div>
                    <div className="h-4 w-20 bg-slate-200 rounded animate-pulse"></div>
                  </div>
                  <div>
                    <div className="h-3 w-12 bg-slate-200 rounded animate-pulse mb-1"></div>
                    <div className="h-4 w-20 bg-slate-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
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
              {/* 市场状态指示器 */}
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                marketStatus.isOpen 
                  ? 'bg-green-50 text-green-700' 
                  : 'bg-slate-100 text-slate-500'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  marketStatus.isOpen ? 'bg-green-500 animate-pulse' : 'bg-slate-400'
                }`}></span>
                {marketStatus.isOpen ? '实时' : marketStatus.label}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/about" className="px-3 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">
                关于
              </Link>
              <Link href="/guide" className="px-3 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">
                指南
              </Link>
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
              <Button danger onClick={handleLogout} size="small">
                退出
              </Button>
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
            <Button
              type="text"
              size="small"
              onClick={() => setShowData(!showData)}
              title={showData ? '隐藏数据' : '显示数据'}
              icon={showData ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              )}
            />
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* 总买入 */}
            <div className="stat-card stagger-item">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="stat-card-label">总买入</span>
              </div>
              <p className="stat-card-value">¥{formatValue(totalBuy)}</p>
            </div>

            {/* 总卖出 */}
            <div className="stat-card stagger-item">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="stat-card-label">总卖出</span>
              </div>
              <p className="stat-card-value">¥{formatValue(totalSell)}</p>
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
              <p className="stat-card-value text-slate-700">¥{formatValue(totalSell - totalBuy - totalPnL)}</p>
            </div>

            {/* 清仓盈亏 */}
            <div className={`stat-card stagger-item ${totalPnL >= 0 ? 'border-red-200' : 'border-green-200'}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg ${totalPnL >= 0 ? 'bg-red-50' : 'bg-green-50'} flex items-center justify-center`}>
                  <svg className={`w-5 h-5 ${totalPnL >= 0 ? 'text-red-500' : 'text-green-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {totalPnL >= 0 ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    )}
                  </svg>
                </div>
                <span className="stat-card-label">清仓盈亏</span>
              </div>
              <p className={`stat-card-value ${totalPnL >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                ¥{formatValue(totalPnL, true)}
              </p>
            </div>

            {/* 当日盈亏 */}
            <div className={`stat-card stagger-item ${currentPnl >= 0 ? 'border-red-200' : 'border-green-200'}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg ${currentPnl >= 0 ? 'bg-red-50' : 'bg-green-50'} flex items-center justify-center`}>
                  <svg className={`w-5 h-5 ${currentPnl >= 0 ? 'text-red-500' : 'text-green-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {currentPnl >= 0 ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    )}
                  </svg>
                </div>
                <span className="stat-card-label">当日盈亏</span>
              </div>
              <p className={`stat-card-value ${currentPnl >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                ¥{formatValue(currentPnl, true)}
              </p>
            </div>
          </div>
        </div>

        {/* Tab切换 */}
        <div className="mb-6">
          <div className="inline-flex gap-1 p-1 bg-slate-100/80 backdrop-blur-sm rounded-xl border border-slate-200/50">
            <button
              onClick={() => setActiveTab('current')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 relative overflow-hidden cursor-pointer ${
                activeTab === 'current'
                  ? 'text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-white/60'
              }`}
            >
              {activeTab === 'current' && (
                <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700" />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                当前持仓
              </span>
            </button>
            <button
              onClick={() => setActiveTab('cleared')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 relative overflow-hidden cursor-pointer ${
                activeTab === 'cleared'
                  ? 'text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-white/60'
              }`}
            >
              {activeTab === 'cleared' && (
                <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700" />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                已清仓
              </span>
            </button>
          </div>
        </div>

        {/* Position Lists */}
        {activeTab === 'current' && (
          <PositionList positions={currentPositions} type="current" showData={showData} loaded={dataLoaded} />
        )}

        {activeTab === 'cleared' && (
          <PositionList positions={clearedPositions} type="cleared" showData={showData} loaded={dataLoaded} />
        )}
      </main>
    </div>
  )
}


