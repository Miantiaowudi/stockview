// 根据股票代码获取股票名称
// 腾讯财经API: http://hq.sinajs.cn/list=sh600519

export async function getStockName(stockCode: string): Promise<string> {
  try {
    // 判断市场：上海sh，深圳sz
    const prefix = stockCode.startsWith('6') ? 'sh' : 
                   stockCode.startsWith('0') || stockCode.startsWith('3') ? 'sz' : 'sh'
    
    const url = `http://hq.sinajs.cn/list=${prefix}${stockCode}`
    
    const response = await fetch(url)
    const text = await response.text()
    
    // 解析返回数据: var hq_str_sh600519="贵州茅台,..."
    const match = text.match(/="([^"]+)"/)
    if (match && match[1]) {
      const parts = match[1].split(',')
      return parts[0] || stockCode
    }
    
    return stockCode
  } catch (error) {
    console.error('获取股票名称失败:', error)
    return stockCode
  }
}

// 批量获取股票名称
export async function getStockNames(stockCodes: string[]): Promise<Record<string, string>> {
  const results: Record<string, string> = {}
  
  // 腾讯财经支持批量查询，最多20个
  const batchSize = 20
  for (let i = 0; i < stockCodes.length; i += batchSize) {
    const batch = stockCodes.slice(i, i + batchSize)
    const prefixes = batch.map(code => 
      code.startsWith('6') ? `sh${code}` : 
      code.startsWith('0') || code.startsWith('3') ? `sz${code}` : `sh${code}`
    )
    
    try {
      const url = `http://hq.sinajs.cn/list=${prefixes.join(',')}`
      const response = await fetch(url)
      const text = await response.text()
      
      // 解析多个股票
      const stockMatches = text.matchAll(/hq_str_(sh|sz)(\w+)="([^"]+)"/g)
      for (const match of stockMatches) {
        const code = match[2]
        const name = match[3].split(',')[0]
        results[code] = name
      }
    } catch (error) {
      console.error('批量获取股票名称失败:', error)
    }
  }
  
  return results
}
