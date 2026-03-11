'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import MarkdownRenderer from '@/components/MarkdownRenderer'

interface KLineItem {
  date: string
  open: number
  close: number
  high: number
  low: number
}

interface Trade {
  id: string
  stock_code: string
  direction: 'buy' | 'sell'
  price: number
  quantity: number
  commission: number
  trade_time: string
}

interface StockAnalysisProps {
  stockCode: string
  stockName?: string
  authToken?: string
  klineData?: KLineItem[]
  trades?: Trade[]
}

export default function StockAnalysis({
  stockCode,
  stockName = '',
  authToken = '',
  klineData = [],
  trades = [],
}: StockAnalysisProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<string>("")
  const [recommendation, setRecommendation] = useState<string>("")
  const [data, setData] = useState<{name?: string; price?: number; change_pct?: number} | null>(null)
  const [hasStarted, setHasStarted] = useState(false)
  
  // ========== 缓冲区 + requestAnimationFrame ==========
  const analysisBuffer = useRef("")
  const recommendationBuffer = useRef("")
  const rafRef = useRef<number | null>(null)
  const isFlushingRef = useRef(false)

  // ========== 自动滚动控制（基于视口位置）==========
  const atBottomRef = useRef(true)

  // 判断是否在视口底部（距离底部 100px 以内）
  const checkAtBottom = useCallback(() => {
    const scrollTop = window.scrollY
    const windowHeight = window.innerHeight
    const docHeight = document.documentElement.scrollHeight
    const distanceToBottom = docHeight - scrollTop - windowHeight
    return distanceToBottom < 100
  }, [])

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    if (!atBottomRef.current) return
    
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    })
  }, [])

  // 监听滚动 - 实时判断是否在底部
  useEffect(() => {
    const handleScroll = () => {
      atBottomRef.current = checkAtBottom()
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    // 初始化检查
    atBottomRef.current = checkAtBottom()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [checkAtBottom])

  // 刷新缓冲区
  const flushBuffers = useCallback(() => {
    let hasUpdate = false
    let newAnalysis = ""
    let newRecommendation = ""
    
    if (analysisBuffer.current) {
      newAnalysis = analysisBuffer.current
      analysisBuffer.current = ""
      hasUpdate = true
    }
    if (recommendationBuffer.current) {
      newRecommendation = recommendationBuffer.current
      recommendationBuffer.current = ""
      hasUpdate = true
    }
    
    if (hasUpdate) {
      if (newAnalysis) {
        setAnalysis(prev => prev + newAnalysis)
      }
      if (newRecommendation) {
        setRecommendation(prev => prev + newRecommendation)
      }
      // 刷新后尝试滚动
      scrollToBottom()
    }
    
    isFlushingRef.current = false
  }, [scrollToBottom])

  // 调度刷新
  const scheduleFlush = useCallback(() => {
    if (isFlushingRef.current) return
    isFlushingRef.current = true
    rafRef.current = requestAnimationFrame(flushBuffers)
  }, [flushBuffers])

  const handleAnalyze = async () => {
    // 重置状态
    setLoading(true)
    setError(null)
    setAnalysis("")
    setRecommendation("")
    setData(null)
    setHasStarted(true)
    
    // 重置缓冲区
    analysisBuffer.current = ""
    recommendationBuffer.current = ""
    isFlushingRef.current = false
    atBottomRef.current = true  // 开始分析时假设在底部
    
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      const response = await fetch("/api/analysis", {
        method: "POST",
        headers,
        body: JSON.stringify({
          ticker: stockCode,
          klineData,
          trades
        }),
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`)
      }

      if (!response.body) {
        throw new Error("响应体为空")
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n").filter(Boolean);

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line)
            
            if (parsed.type === "token") {
              if (parsed.node === "analyze") {
                analysisBuffer.current += parsed.chunk
                scheduleFlush()
              } else if (parsed.node === "recommend") {
                recommendationBuffer.current += parsed.chunk
                scheduleFlush()
              }
            }
            
            if (parsed.data) {
              setData(parsed.data)
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }
      
      flushBuffers()
      setLoading(false)
      
    } catch (err: any) {
      setError(err.message || "分析失败，请重试")
      setLoading(false)
    } finally {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  };

  // 初始状态
  if (!hasStarted) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
            🤖 AI 智能分析
          </h2>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 text-sm font-medium"
          >
            {loading ? '分析中...' : '🚀 开始分析'}
          </button>
        </div>
        <p className="text-slate-500 text-sm">
          点击按钮获取 AI 智能分析报告
        </p>
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>
    )
  }

  // 加载中（无内容）
  const hasContent = analysis || recommendation
  if (loading && !hasContent) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
            🤖 AI 智能分析
          </h2>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          <div className="h-4 bg-slate-200 rounded w-2/3"></div>
        </div>
        <div className="mt-4 text-center text-sm text-blue-600 animate-pulse">
          ⏳ AI 正在分析中...
        </div>
      </div>
    )
  }

  // 错误状态
  if (error) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
            🤖 AI 智能分析
          </h2>
          <button
            onClick={handleAnalyze}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            🔄 重试
          </button>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
          🤖 AI 智能分析
        </h2>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          🔄 重新分析
        </button>
      </div>

      {/* 内容区域 */}
      <div>
        {analysis && (
          <div className="mb-6">
            <h3 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
              📈 AI 深度分析
            </h3>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <MarkdownRenderer content={analysis} />
            </div>
          </div>
        )}

        {recommendation && (
          <div className="mb-6">
            <h3 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
              🎯 投资建议
            </h3>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <MarkdownRenderer content={recommendation} />
            </div>
          </div>
        )}

        {loading && hasContent && (
          <div className="mt-4 text-center text-sm text-blue-600 animate-pulse">
            ⏳ 继续生成中...
          </div>
        )}
      </div>
    </div>
  )
}
