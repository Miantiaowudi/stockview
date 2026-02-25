'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { getStockNames } from '@/lib/stockApi'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

interface Trade {
  id: string
  stock_code: string
  direction: 'buy' | 'sell'
  price: number
  quantity: number
  commission: number
  trade_time: string
}

interface Position {
  stock_code: string
  stock_name: string
  quantity: number
  avg_cost: number
  total_cost: number
  current_value: number
  profit_loss: number
  profit_rate: number
}

interface DailyPnL {
  date: string
  value: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export default function AnalyticsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [trades, setTrades] = useState<Trade[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [dailyPnL, setDailyPnL] = useState<DailyPnL[]>([])
  const [totalPnL, setTotalPnL] = useState(0)
  const [totalCost, setTotalCost] = useState(0)
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

      // 计算持仓和盈亏
      const pos = calculatePositions(tradesData || [])
      
      // 获取股票名称
      const codes = pos.map(p => p.stock_code)
      if (codes.length > 0) {
        const names = await getStockNames(codes)
        const posWithNames = pos.map(p => ({
          ...p,
          stock_name: names[p.stock_code] || p.stock_code
        }))
        setPositions(posWithNames)
      } else {
        setPositions(pos)
      }
      
      calculateDailyPnL(tradesData || [])
    }

    loadData()
  }, [user, supabase])

  // 计算持仓
  const calculatePositions = (trades: Trade[]) => {
    const stockMap = new Map<string, { buys: number[], sells: number[] }>()

    trades.forEach(trade => {
      if (!stockMap.has(trade.stock_code)) {
        stockMap.set(trade.stock_code, { buys: [], sells: [] })
      }
      const stock = stockMap.get(trade.stock_code)!
      
      const cost = trade.price * trade.quantity + trade.commission
      
      if (trade.direction === 'buy') {
        stock.buys.push(cost)
      } else {
        stock.sells.push(trade.price * trade.quantity)
      }
    })

    const positions: Position[] = []
    let totalPnL = 0
    let totalCost = 0

    stockMap.forEach((data, code) => {
      const totalBuys = data.buys.reduce((a, b) => a + b, 0)
      const totalSells = data.sells.reduce((a, b) => a + b, 0)
      const netCost = totalBuys - totalSells

      if (netCost > 0) {
        // 仍在持仓
        const quantity = Math.floor(netCost / 100) * 100
        const avgCost = totalBuys / (quantity || 1)
        
        positions.push({
          stock_code: code,
          stock_name: code,
          quantity,
          avg_cost: avgCost,
          total_cost: netCost,
          current_value: netCost,
          profit_loss: 0,
          profit_rate: 0
        })
        totalCost += netCost
      } else {
        // 已清仓，计算盈亏
        const pnl = totalSells - totalBuys
        totalPnL += pnl
      }
    })

    setTotalPnL(totalPnL)
    setTotalCost(totalCost)
    return positions
  }

  // 计算每日盈亏曲线
  const calculateDailyPnL = (trades: Trade[]) => {
    const dailyMap = new Map<string, number>()
    let runningPnL = 0

    trades.forEach(trade => {
      const date = trade.trade_time.split('T')[0]
      
      if (trade.direction === 'buy') {
        runningPnL -= trade.price * trade.quantity + trade.commission
      } else {
        runningPnL += trade.price * trade.quantity - trade.commission
      }
      
      dailyMap.set(date, runningPnL)
    })

    const dailyData: DailyPnL[] = []
    dailyMap.forEach((value, date) => {
      dailyData.push({ date, value })
    })

    setDailyPnL(dailyData)
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

  // 饼图数据
  const pieData = positions.slice(0, 6).map(p => ({
    name: `${p.stock_name} (${p.stock_code})`,
    value: p.total_cost
  }))

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">总投入</h3>
            <p className="text-2xl font-bold">¥{totalCost.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">已实现盈亏</h3>
            <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalPnL >= 0 ? '+' : ''}¥{totalPnL.toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">持仓数量</h3>
            <p className="text-2xl font-bold">{positions.length} 只</p>
          </div>
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 收益率曲线 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">收益曲线</h2>
            {dailyPnL.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyPnL}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{fontSize: 12}} />
                  <YAxis tick={{fontSize: 12}} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#0088FE" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-10">暂无数据</p>
            )}
          </div>

          {/* 持仓占比 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">持仓占比</h2>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({name, percent}) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-10">暂无持仓</p>
            )}
          </div>
        </div>

        {/* 个股明细 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">持仓明细</h2>
          {positions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">股票</th>
                    <th className="px-4 py-2 text-right">持仓数量</th>
                    <th className="px-4 py-2 text-right">平均成本</th>
                    <th className="px-4 py-2 text-right">总成本</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((pos, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-2">{pos.stock_name} ({pos.stock_code})</td>
                      <td className="px-4 py-2 text-right">{pos.quantity}</td>
                      <td className="px-4 py-2 text-right">¥{pos.avg_cost.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">¥{pos.total_cost.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-10">暂无持仓数据</p>
          )}
        </div>
      </main>
    </div>
  )
}
