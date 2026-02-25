import { NextResponse } from 'next/server'

// 腾讯财经API (服务器端调用，无CORS限制)
const TENCENT_API = 'http://hq.sinajs.cn/list='

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const codes = searchParams.get('codes')

  if (!codes) {
    return NextResponse.json({ error: 'Missing codes parameter' }, { status: 400 })
  }

  const codeList = codes.split(',').filter(Boolean)
  if (codeList.length === 0) {
    return NextResponse.json({})
  }

  // 构建腾讯API请求
  const prefixes = codeList.map(code => 
    code.startsWith('6') ? `sh${code}` : 
    code.startsWith('0') || code.startsWith('3') ? `sz${code}` : `sh${code}`
  )

  try {
    const url = `${TENCENT_API}${prefixes.join(',')}`
    const response = await fetch(url, {
      headers: {
        'Referer': 'http://finance.sina.com.cn',
        'Accept-Charset': 'GBK,utf-8'
      }
    })
    
    // 腾讯API返回GBK编码，需要转换
    const buffer = await response.arrayBuffer()
    const decoder = new TextDecoder('GBK')
    const text = decoder.decode(buffer)

    // 解析返回数据
    const results: Record<string, string> = {}
    const stockMatches = text.matchAll(/hq_str_(sh|sz)(\w+)="([^"]+)"/g)
    
    for (const match of stockMatches) {
      const code = match[2]
      const name = match[3].split(',')[0]
      if (name) {
        results[code] = name
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Stock API error:', error)
    return NextResponse.json({ error: 'Failed to fetch stock names' }, { status: 500 })
  }
}
