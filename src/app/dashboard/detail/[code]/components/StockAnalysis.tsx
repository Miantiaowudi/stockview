'use client'

import { useState } from 'react'
import { streamStockAnalysis } from '@/lib/langGraphApi'

interface StockAnalysisProps {
  stockCode: string
  stockName?: string
}

export default function StockAnalysis({
  stockCode,
  stockName = '',
}: StockAnalysisProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<any>(null)
  const [logs, setLogs] = useState<string[]>([])

  const handleAnalyze = async () => {
    setLoading(true)
    setError(null)
    setLogs(['🔄 正在连接智能体...'])

    try {
      const stream = streamStockAnalysis(stockCode)
      
      for await (const event of stream) {
        // 更新消息
        if (event.messages) {
          setLogs(event.messages)
        }
        // 更新数据
        if (event.data) {
          setAnalysis(event.data)
        }
      }
    } catch (err) {
      console.error('分析失败:', err)
      setError(err instanceof Error ? err.message : '分析失败')
    } finally {
      setLoading(false)
    }
  }

  if (!analysis && !loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">
            🤖 AI 智能分析
          </h3>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {loading ? '分析中...' : '🚀 开始分析'}
          </button>
        </div>
        <p className="text-slate-500 text-sm">
          点击按钮获取 AI 智能分析报告
        </p>
        {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">
            🤖 AI 智能分析
          </h3>
        </div>
        
        {/* 进度日志 */}
        <div className="mb-4 p-3 bg-slate-50 rounded-lg">
          <div className="space-y-1">
            {logs.map((log, idx) => (
              <div key={idx} className="text-xs text-slate-500">{log}</div>
            ))}
            <div className="text-xs text-blue-500 animate-pulse">⏳ AI 思考中...</div>
          </div>
        </div>
        
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-red-500 mb-4">{error}</div>
        <button onClick={handleAnalyze} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          重试
        </button>
      </div>
    )
  }

  if (!analysis) return null

  // 解析数据
  const data = analysis.data || {}
  const messages = analysis.messages || []
  const displayName = data.name || stockName || stockCode
  const currentPrice = data.price || 0
  const changePct = data.change_pct || 0
  const analysisText = analysis.analysis || ''
  const recommendation = analysis.recommendation || ''

  return (
    <div className="space-y-4">
      {/* 头部信息 */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              📊 {displayName} ({stockCode})
            </h3>
            <p className="text-2xl font-bold text-slate-900">
              ¥{currentPrice}
              <span className={`ml-2 text-sm font-normal ${changePct >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                {changePct >= 0 ? '+' : ''}{changePct}%
              </span>
            </p>
          </div>
        </div>
        
        {/* 进度消息 */}
        {messages.length > 0 && (
          <div className="mb-3 p-2 bg-slate-50 rounded text-xs text-slate-500">
            {messages.map((msg: string, idx: number) => (
              <div key={idx}>{msg}</div>
            ))}
          </div>
        )}
      </div>

      {/* AI 分析 */}
      {analysisText && (
        <div className="card">
          <h4 className="font-semibold text-slate-800 mb-3">📈 AI 深度分析</h4>
          <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">
            {analysisText}
          </div>
        </div>
      )}

      {/* 投资建议 */}
      {recommendation && (
        <div className="card bg-gradient-to-r from-blue-50 to-indigo-50">
          <h4 className="font-semibold text-slate-800 mb-3">🎯 投资建议</h4>
          <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">
            {recommendation}
          </div>
        </div>
      )}

      {/* 重新分析 */}
      <div className="flex justify-center">
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          🔄 重新分析
        </button>
      </div>
    </div>
  )
}
