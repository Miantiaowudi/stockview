import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useLocalTrades } from './useLocalTrades'
import { clearTrades } from '../lib/db'

describe('useLocalTrades', () => {
  beforeEach(async () => {
    await clearTrades()
  })

  it('应该返回空交易列表', async () => {
    const { result } = renderHook(() => useLocalTrades())
    await waitFor(() => {
      expect(result.current.trades).toEqual([])
      expect(result.current.loading).toBe(false)
    })
  })

  it('应该添加交易记录', async () => {
    const { result } = renderHook(() => useLocalTrades())
    const trade = {
      stock_code: '000001',
      direction: 'buy' as const,
      price: 10.5,
      quantity: 100,
      commission: 5,
      trade_time: new Date().toISOString(),
    }

    await act(async () => {
      await result.current.addTrade(trade)
    })

    expect(result.current.trades).toHaveLength(1)
    expect(result.current.trades[0].stock_code).toBe('000001')
  })

  it('应该删除交易记录', async () => {
    const { result } = renderHook(() => useLocalTrades())
    const trade = {
      stock_code: '000001',
      direction: 'buy' as const,
      price: 10.5,
      quantity: 100,
      commission: 5,
      trade_time: new Date().toISOString(),
    }

    await act(async () => {
      const id = await result.current.addTrade(trade)
      await result.current.deleteTrade(id)
    })

    expect(result.current.trades).toHaveLength(0)
  })
})