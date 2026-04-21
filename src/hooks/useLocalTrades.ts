import { useState, useEffect, useCallback } from 'react'
import { Trade, TradeInput, getTrades, addTrade, deleteTrade } from '@/lib/db'

export function useLocalTrades() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)

  // 加载交易数据
  const loadTrades = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getTrades()
      setTrades(data)
    } catch (error) {
      console.error('加载交易数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTrades()
  }, [loadTrades])

  // 添加交易
  const addTradeFn = useCallback(async (trade: TradeInput): Promise<string> => {
    const id = await addTrade(trade)
    await loadTrades()
    return id
  }, [loadTrades])

  // 删除交易
  const deleteTradeFn = useCallback(async (id: string): Promise<void> => {
    await deleteTrade(id)
    await loadTrades()
  }, [loadTrades])

  return {
    trades,
    loading,
    addTrade: addTradeFn,
    deleteTrade: deleteTradeFn,
    reload: loadTrades,
  }
}