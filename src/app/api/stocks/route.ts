import { NextResponse } from 'next/server'

const TENCENT_API = 'http://hq.sinajs.cn/list='
const REQUEST_TIMEOUT_MS = 8000

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const requestId = crypto.randomUUID()
  const { searchParams } = new URL(request.url)
  const codes = searchParams.get('codes')

  if (!codes) {
    return NextResponse.json({ error: 'Missing codes parameter' }, { status: 400 })
  }

  const codeList = codes.split(',').filter(Boolean)
  if (codeList.length === 0) {
    return NextResponse.json({})
  }

  const prefixes = codeList.map((code) =>
    code.startsWith('6') ? `sh${code}` : code.startsWith('0') || code.startsWith('3') ? `sz${code}` : `sh${code}`
  )

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const url = `${TENCENT_API}${prefixes.join(',')}`
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Referer: 'http://finance.sina.com.cn',
        'Accept-Charset': 'GBK,utf-8',
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      console.error('[stocks] upstream response not ok', {
        requestId,
        status: response.status,
        statusText: response.statusText,
      })
      return NextResponse.json(
        { error: 'Upstream stock service failed', code: 'upstream_not_ok', requestId },
        { status: 502 }
      )
    }

    const buffer = await response.arrayBuffer()
    const text = new TextDecoder('GBK').decode(buffer)

    if (!text.trim()) {
      console.error('[stocks] empty upstream payload', { requestId })
      return NextResponse.json(
        { error: 'Empty upstream stock payload', code: 'upstream_empty', requestId },
        { status: 502 }
      )
    }

    const results: Record<string, string> = {}
    const stockMatches = text.matchAll(/hq_str_(sh|sz)(\w+)="([^"]+)"/g)
    let matchCount = 0

    for (const match of stockMatches) {
      matchCount += 1
      const code = match[2]
      const name = match[3].split(',')[0]
      if (name) {
        results[code] = name
      }
    }

    if (Object.keys(results).length === 0) {
      console.error('[stocks] parse produced empty result', {
        requestId,
        matchCount,
        sample: text.slice(0, 200),
      })
      return NextResponse.json(
        { error: 'Failed to parse upstream stock payload', code: 'upstream_parse_empty', requestId },
        { status: 502 }
      )
    }

    console.info('[stocks] request completed', {
      requestId,
      requestedCodes: codeList.length,
      parsedCodes: Object.keys(results).length,
      matchCount,
    })

    return NextResponse.json(results)
  } catch (error) {
    console.error('[stocks] handler error', { requestId, error })
    return NextResponse.json({ error: 'Failed to fetch stock names', requestId }, { status: 500 })
  } finally {
    clearTimeout(timer)
  }
}
