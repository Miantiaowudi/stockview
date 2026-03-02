import { NextResponse } from 'next/server'

// In-memory cache for stock list
let stockCache: { data: any[]; timestamp: number } | null = null
const CACHE_DURATION = 1000 * 60 * 60 // 1 hour

// Fetch all stock list from East Money API (multiple pages)
async function fetchStockList(): Promise<any[]> {
  // Return cached data if available
  if (stockCache && Date.now() - stockCache.timestamp < CACHE_DURATION) {
    return stockCache.data
  }

  const allStocks: any[] = []
  const pageSize = 5000
  let currentPage = 1
  let hasMore = true

  try {
    while (hasMore) {
      const url = 'https://push2.eastmoney.com/api/qt/clist/get'
      const params = new URLSearchParams({
        fid: 'f184',       // 按股票代码排序
        po: '1',           // 正序
        pz: pageSize.toString(),
        pn: currentPage.toString(),
        np: '1',           // 新版API
        fltt: '2',         // 浮点类型
        invt: '2',         // 沪深A股
        fields: 'f12,f14', // 股票代码、股票名称
        ut: 'b2884a393a59ad64002292a3e90d46a5',
        fs: 'm:0+t:6+f:!2,m:0+t:13+f:!2,m:0+t:80+f:!2,m:1+t:2+f:!2,m:1+t:23+f:!2,m:0+t:7+f:!2,m:1+t:3+f:!2'
      })

      const response = await fetch(`${url}?${params.toString()}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        next: { revalidate: 3600 }
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.data?.diff && data.data.diff.length > 0) {
        const stocks = data.data.diff.map((item: any) => ({
          code: item.f12,
          name: item.f14
        }))
        allStocks.push(...stocks)
        
        // Check if we need more pages
        const total = data.data.total || 0
        hasMore = allStocks.length < total && allStocks.length < 10000 // Max 10000 to prevent infinite loop
        currentPage++
      } else {
        hasMore = false
      }
    }
    
    console.log(`Fetched ${allStocks.length} stocks from East Money API`)
    
    // Update cache
    stockCache = {
      data: allStocks,
      timestamp: Date.now()
    }
    
    return allStocks
  } catch (error) {
    console.error('Failed to fetch stock list:', error)
    if (stockCache) {
      return stockCache.data
    }
    return []
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  // Fetch all stocks from external API
  const allStocks = await fetchStockList()

  // Filter by search term (support both Chinese and English)
  let stocks = allStocks
  if (search) {
    const searchLower = search.toLowerCase()
    stocks = allStocks.filter(
      stock => 
        stock.code.includes(search) || 
        (stock.name && stock.name.toLowerCase().includes(searchLower))
    )
  }

  // Pagination
  const start = (page - 1) * limit
  const end = start + limit
  const paginatedStocks = stocks.slice(start, end)

  return NextResponse.json(paginatedStocks)
}
