import { NextResponse } from 'next/server'

// 腾讯财经K线API
const TENCENT_KLINE_API = 'https://web.ifzq.gtimg.cn/appstock/app/fqkline/get'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json({ error: 'Missing code parameter' }, { status: 400 })
  }

  // 判断市场
  const prefix = code.startsWith('6') ? 'sh' : 'sz'
  const symbol = `${prefix}${code}`

  try {
    // 获取日K线数据
    const url = `${TENCENT_KLINE_API}?_var=kline_day&param=${symbol},day,,,365,qfq`
    const response = await fetch(url)
    const text = await response.text()

    // 解析返回数据
    // 格式: var kline_day={...}
    const match = text.match(/var kline_day=({.+})/)
    if (!match) {
      return NextResponse.json({ error: 'Failed to parse K-line data' }, { status: 500 })
    }

    const data = JSON.parse(match[1])
    const stockData = data.data?.[symbol]
    
    if (!stockData || !stockData.day) {
      return NextResponse.json({ error: 'No K-line data available' }, { status: 404 })
    }

    // 转换数据格式
    const klineData = stockData.day.map((item: string[]) => ({
      time: item[0],
      open: parseFloat(item[1]),
      high: parseFloat(item[2]),
      low: parseFloat(item[3]),
      close: parseFloat(item[4]),
      volume: parseInt(item[5])
    }))

    return NextResponse.json(klineData)
  } catch (error) {
    console.error('K-line API error:', error)
    return NextResponse.json({ error: 'Failed to fetch K-line data' }, { status: 500 })
  }
}
