import { describe, it, expect, beforeEach } from 'vitest'
import { openDB, addTrade, getTrades, deleteTrade, clearTrades } from './db'

describe('db', () => {
  beforeEach(async () => {
    // 清理数据库
    await clearTrades()
  })

  it('应该成功打开数据库', async () => {
    const db = await openDB()
    expect(db).toBeDefined()
    expect(db.name).toBe('stockview_db')
  })

  it('应该添加交易记录并返回 id', async () => {
    const trade = {
      stock_code: '000001',
      direction: 'buy' as const,
      price: 10.5,
      quantity: 100,
      commission: 5,
      trade_time: new Date().toISOString(),
    }
    const id = await addTrade(trade)
    expect(id).toBeDefined()
    expect(typeof id).toBe('string')
  })

  it('应该返回所有交易记录', async () => {
    const trade = {
      stock_code: '000001',
      direction: 'buy' as const,
      price: 10.5,
      quantity: 100,
      commission: 5,
      trade_time: new Date().toISOString(),
    }
    await addTrade(trade)
    const trades = await getTrades()
    expect(trades).toHaveLength(1)
    expect(trades[0].stock_code).toBe('000001')
  })

  it('应该删除指定交易记录', async () => {
    const trade = {
      stock_code: '000001',
      direction: 'buy' as const,
      price: 10.5,
      quantity: 100,
      commission: 5,
      trade_time: new Date().toISOString(),
    }
    const id = await addTrade(trade)
    await deleteTrade(id)
    const trades = await getTrades()
    expect(trades).toHaveLength(0)
  })

  it('应该清空所有交易记录', async () => {
    const trades = [
      { stock_code: '000001', direction: 'buy' as const, price: 10.5, quantity: 100, commission: 5, trade_time: new Date().toISOString() },
      { stock_code: '000002', direction: 'sell' as const, price: 11.0, quantity: 50, commission: 3, trade_time: new Date().toISOString() },
    ]
    await addTrade(trades[0])
    await addTrade(trades[1])
    await clearTrades()
    const result = await getTrades()
    expect(result).toHaveLength(0)
  })
})