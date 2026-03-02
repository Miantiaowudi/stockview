'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ImportTab from './components/ImportTab'
import ManualEntryTab from './components/ManualEntryTab'

export default function ImportPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'import' | 'manual'>('import')
  const [importMessage, setImportMessage] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  // 检查用户登录
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
      } else {
        setUser(user)
      }
      setLoading(false)
    }
    checkUser()
  }, [supabase, router])

  // 处理导入完成回调
  const handleImportComplete = (message: string) => {
    setImportMessage(message)
    // 5秒后清除消息
    setTimeout(() => setImportMessage(null), 5000)
  }

  // 登出
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header Skeleton */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse"></div>
                <div className="h-6 w-40 bg-slate-200 rounded animate-pulse"></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-6 w-24 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-6 w-16 bg-slate-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="h-6 w-24 bg-slate-200 rounded animate-pulse mb-6"></div>
                <div className="h-32 bg-slate-100 rounded-xl animate-pulse mb-6"></div>
                <div className="h-4 w-32 bg-slate-200 rounded animate-pulse mb-3"></div>
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-8 bg-slate-100 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="h-6 w-24 bg-slate-200 rounded animate-pulse mb-4"></div>
                <div className="h-10 bg-slate-100 rounded-lg animate-pulse mb-4"></div>
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="h-6 w-20 bg-slate-200 rounded animate-pulse mb-4"></div>
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-4 bg-slate-100 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 page-enter">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h1 className="text-lg font-bold text-slate-800">StockView 数据导入</h1>
              </Link>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link 
                href="/dashboard" 
                className="px-3 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              >
                返回看板
              </Link>
              <span className="hidden sm:inline text-sm text-slate-500">{user?.email}</span>
              <button 
                onClick={handleLogout} 
                className="px-3 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="inline-flex gap-1 p-1 bg-white rounded-xl border border-slate-200 shadow-sm w-fit">
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === 'import'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            导入数据
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === 'manual'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            手动录入
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Tab Content */}
          <div className="lg:col-span-2 space-y-6">
            {importMessage && (
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-green-700">{importMessage}</p>
                </div>
              </div>
            )}
            
            {activeTab === 'import' ? (
              <ImportTab 
                user={user} 
                supabase={supabase}
                onImportComplete={handleImportComplete}
              />
            ) : (
              <ManualEntryTab 
                user={user} 
                supabase={supabase}
                onImportComplete={handleImportComplete}
              />
            )}
          </div>

          {/* Right Column - Only show help on import tab */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              {/* Format Guide Card */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                  CSV格式说明
                </h2>
                <div className="text-sm text-slate-600">
                  <p className="mb-3">请确保CSV文件包含以下表头（顺序无关）：</p>
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <code className="text-xs text-slate-600 break-all">
                      成交日期, 成交时间, 证券代码, 证券名称, 操作, 成交数量, 成交均价, 成交金额, 手续费, 印花税
                    </code>
                  </div>
                </div>
              </div>

              {/* Instructions Card */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                  导入说明
                </h2>
                <ul className="text-sm text-slate-600 space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-xs font-medium">1</span>
                    <span>从券商客户端导出CSV格式的交割单</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-xs font-medium">2</span>
                    <span>确保CSV文件包含标准表头</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-xs font-medium">3</span>
                    <span>导入后支持自动去重，相同记录不会重复导入</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-xs font-medium">4</span>
                    <span>导入完成后可在"账户分析"查看统计数据</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
