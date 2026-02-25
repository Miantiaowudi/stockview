// 根据股票代码获取股票名称
// 使用内部API路由（服务器端调用，避免CORS问题）

const API_BASE = '/api/stocks'

export async function getStockName(stockCode: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE}?codes=${stockCode}`)
    const data = await response.json()
    return data[stockCode] || stockCode
  } catch (error) {
    console.error('获取股票名称失败:', error)
    return stockCode
  }
}

// 批量获取股票名称
export async function getStockNames(stockCodes: string[]): Promise<Record<string, string>> {
  if (stockCodes.length === 0) return {}
  
  try {
    const codesParam = stockCodes.join(',')
    const response = await fetch(`${API_BASE}?codes=${codesParam}`)
    const data = await response.json()
    return data
  } catch (error) {
    console.error('批量获取股票名称失败:', error)
    return {}
  }
}
