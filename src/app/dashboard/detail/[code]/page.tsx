'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { getStockNames, getStockPrices, StockPrice } from '@/lib/stockApi'
import Link from 'next/link'
import KLineChart from '../components/KLineChart'
import TradeTable from '../components/TradeTable'
import StockAnalysis from './components/StockAnalysis'

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
  const [authToken, setAuthToken] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(true)
  const [trades, setTrades] = useState<Trade[]>([])
  const [stockName, setStockName] = useState('')
  const [stockPrice, setStockPrice] = useState<StockPrice | null>(null)
  const [klineData, setKlineData] = useState<KLineItem[]>([])
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user }, data: sessionData } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
      } else {
        setUser(user)
        // 获取access token
        if (sessionData.session) {
          setAuthToken(sessionData.session.access_token)
        }
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
      setDataLoading(true)
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
      
      // 计算持仓数量
      const buyTradesData = (tradesData || []).filter((t: Trade) => t.direction === 'buy')
      const sellTradesData = (tradesData || []).filter((t: Trade) => t.direction === 'sell')
      const totalBuyQty = buyTradesData.reduce((sum: number, t: Trade) => sum + t.quantity, 0)
      const totalSellQty = sellTradesData.reduce((sum: number, t: Trade) => sum + t.quantity, 0)
      const holdQuantity = totalBuyQty - totalSellQty
      
      // 如果有持仓，获取实时价格
      if (holdQuantity > 0) {
        try {
          const prices = await getStockPrices([stockCode])
          if (prices[stockCode]) {
            setStockPrice(prices[stockCode])
          }
        } catch (e) {
          console.error('获取实时价格失败:', e)
        }
      }
      
      try {
        const names = await getStockNames([stockCode])
        setStockName(names[stockCode] || stockCode)
      } catch (e) {
        setStockName(stockCode)
      }
      setDataLoading(false)
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
  const totalBuyQty = buyTrades.reduce((sum, t) => sum + t.quantity, 0)
  const totalSellQty = sellTrades.reduce((sum, t) => sum + t.quantity, 0)
  const holdQuantity = totalBuyQty - totalSellQty
  const totalCommission = trades.reduce((sum, t) => sum + t.commission, 0)
  
  // 判断是否已清仓（持仓数量为0）
  const isClosed = holdQuantity === 0
  
  let profitLoss = 0
  let profitLossLabel = '盈亏'
  
  if (isClosed) {
    // 已清仓：使用原有计算方式
    // 盈亏 = 卖出总额 - 买入总额 - 手续费
    profitLoss = totalSell - totalBuy - totalCommission
    profitLossLabel = '盈亏'
  } else {
    // 未清仓：计算浮动盈亏
    // 持仓成本 = 买入总额 - 卖出总额 + 手续费
    const totalCost = totalBuy - totalSell + totalCommission
    // 浮动盈亏 = 当前市值 - 持仓成本
    if (stockPrice) {
      const currentMarketValue = stockPrice.currentPrice * holdQuantity
      profitLoss = currentMarketValue - totalCost
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header Skeleton */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-lg animate-pulse"></div>
                <div>
                  <div className="h-5 w-32 bg-slate-200 rounded animate-pulse mb-1"></div>
                  <div className="h-3 w-20 bg-slate-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-8 w-24 bg-slate-200 rounded-lg animate-pulse"></div>
                <div className="hidden sm:block h-6 w-32 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-8 w-16 bg-slate-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 统计卡片 Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-slate-200 rounded-lg animate-pulse"></div>
                  <div className="h-4 w-16 bg-slate-200 rounded animate-pulse"></div>
                </div>
                <div className="h-8 w-32 bg-slate-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* K线图 Skeleton */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-8">
            <div className="h-6 w-24 bg-slate-200 rounded animate-pulse mb-4"></div>
            <div className="h-96 bg-slate-100 rounded-lg animate-pulse"></div>
          </div>

          {/* 成交明细 Skeleton */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="h-6 w-24 bg-slate-200 rounded animate-pulse mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-4 w-20 bg-slate-200 rounded animate-pulse"></div>
                  <div className="h-4 w-16 bg-slate-200 rounded animate-pulse"></div>
                  <div className="h-4 w-16 bg-slate-200 rounded animate-pulse"></div>
                  <div className="h-4 w-12 bg-slate-200 rounded animate-pulse"></div>
                  <div className="h-4 w-20 bg-slate-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
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
            <p className="stat-card-value">{dataLoading ? '-' : `¥${totalBuy.toLocaleString()}`}</p>
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
            <p className="stat-card-value">{dataLoading ? '-' : `¥${totalSell.toLocaleString()}`}</p>
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
            <p className="stat-card-value text-slate-700">{dataLoading ? '-' : `¥${totalCommission.toFixed(2)}`}</p>
          </div>

          <div className={`stat-card stagger-item ${!dataLoading && profitLoss >= 0 ? 'border-green-200' : 'border-red-200'}`}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-lg ${!dataLoading && profitLoss >= 0 ? 'bg-green-50' : 'bg-red-50'} flex items-center justify-center`}>
                <svg className={`w-5 h-5 ${!dataLoading && profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {!dataLoading && profitLoss >= 0 ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  )}
                </svg>
              </div>
              <span className="stat-card-label">{profitLossLabel}</span>
            </div>
            <p className={`stat-card-value ${!dataLoading && profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {dataLoading ? '-' : `${profitLoss >= 0 ? '+' : ''}¥${profitLoss.toFixed(2)}`}
            </p>
          </div>
        </div>
        {/* K线图 */}
        <KLineChart klineData={klineData} trades={trades} />

        {/* 成交明细 */}
        <TradeTable trades={trades} />

        {/* AI 智能分析 */}
        <div className="mt-8">
          <StockAnalysis stockCode={stockCode} stockName={stockName} authToken={authToken} />
        </div>
      </main>
    </div>
  )
}
