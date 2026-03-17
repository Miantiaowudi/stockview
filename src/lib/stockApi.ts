const API_BASE = '/api/stocks'

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
