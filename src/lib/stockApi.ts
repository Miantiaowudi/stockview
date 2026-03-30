const API_BASE = '/api/stocks'

// A股开盘时间判断
export function isMarketOpen(): boolean {
  const now = new Date()
  const day = now.getDay()
  const hour = now.getHours()
  const minute = now.getMinutes()
  const time = hour * 60 + minute

  // 周末不交易
  if (day === 0 || day === 6) return false

  // 上午 9:30-11:30
  if (time >= 570 && time <= 690) return true
  // 下午 13:00-15:00
  if (time >= 780 && time <= 900) return true

  return false
}

// 获取下次开盘时间（用于计算倒计时）
export function getNextMarketTime(): { isOpen: boolean; nextTime: Date | null; label: string } {
  const now = new Date()
  const day = now.getDay()
  const hour = now.getHours()
  const minute = now.getMinutes()
  const time = hour * 60 + minute

  // 周末
  if (day === 0 || day === 6) {
    const next = new Date(now)
    if (day === 0) next.setDate(next.getDate() + 1) // 周日 → 周一
    else next.setDate(next.getDate() + 2) // 周六 → 周一
    next.setHours(9, 30, 0, 0)
    return { isOpen: false, nextTime: next, label: '等待开盘' }
  }

  // 开盘前 (9:30 前)
  if (time < 570) {
    const next = new Date(now)
    next.setHours(9, 30, 0, 0)
    return { isOpen: false, nextTime: next, label: '等待开盘' }
  }

  // 上午盘中 (9:30-11:30)
  if (time <= 690) {
    return { isOpen: true, nextTime: null, label: '交易中' }
  }

  // 午间休市 (11:30-13:00)
  if (time < 780) {
    const next = new Date(now)
    next.setHours(13, 0, 0, 0)
    return { isOpen: false, nextTime: next, label: '午间休市' }
  }

  // 下午盘中 (13:00-15:00)
  if (time <= 900) {
    return { isOpen: true, nextTime: null, label: '交易中' }
  }

  // 盘后 (15:00 后)
  const next = new Date(now)
  if (day === 5) {
    next.setDate(next.getDate() + 3) // 周五 → 周一
  } else {
    next.setDate(next.getDate() + 1) // 其他日子 → 明天
  }
  next.setHours(9, 30, 0, 0)
  return { isOpen: false, nextTime: next, label: '等待开盘' }
}

export interface StockPrice {
  name: string
  code: string
  currentPrice: number
  yesterdayClose: number
  openPrice: number
  highPrice: number
  lowPrice: number
  volume: number
  amount: number
}

export async function getStockPrices(stockCodes: string[]): Promise<Record<string, StockPrice>> {
  if (stockCodes.length === 0) return {}

  try {
    const codesParam = stockCodes.join(',')
    const response = await fetch(`${API_BASE}/price?codes=${codesParam}`)
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Failed to fetch stock prices:', error)
    return {}
  }
}
