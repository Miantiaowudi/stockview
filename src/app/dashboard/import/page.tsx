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

  const handleImportComplete = (message: string) => {
    setImportMessage(message)
    setTimeout(() => setImportMessage(null), 5000)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
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
          <div className="space-y-6">
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
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 page-enter">
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
              <Link href="/dashboard" className="px-3 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">
                返回看板
              </Link>
              <span className="hidden sm:inline text-sm text-slate-500">{user?.email}</span>
              <button onClick={handleLogout} className="px-3 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200">
                退出
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="inline-flex gap-1 p-1 bg-slate-100/80 backdrop-blur-sm rounded-xl border border-slate-200/50">
          <button
            onClick={() => setActiveTab('import')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 relative overflow-hidden cursor-pointer ${
              activeTab === 'import'
                ? 'text-white shadow-md shadow-blue-500/25'
                : 'text-slate-600 hover:text-slate-800 hover:bg-white/60'
            }`}
          >
            {activeTab === 'import' && (
              <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700" />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              导入数据
            </span>
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 relative overflow-hidden cursor-pointer ${
              activeTab === 'manual'
                ? 'text-white shadow-md shadow-blue-500/25'
                : 'text-slate-600 hover:text-slate-800 hover:bg-white/60'
            }`}
          >
            {activeTab === 'manual' && (
              <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700" />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              手动录入
            </span>
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {importMessage && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-green-700">{importMessage}</p>
            </div>
          </div>
        )}

        {activeTab === 'import' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  CSV格式说明
                </h3>
                <p className="text-sm text-slate-600 mb-3">请确保CSV文件包含以下表头（顺序无关）：</p>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <code className="text-xs text-slate-600 break-all">
                    成交日期, 成交时间, 证券代码, 证券名称, 操作, 成交数量, 成交均价, 成交金额, 手续费, 印花税
                  </code>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  导入说明
                </h3>
                <ul className="text-sm text-slate-600 space-y-2">
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
                    <span>导入后支持自动去重</span>
                  </li>
                </ul>
              </div>
            </div>

            <ImportTab user={user} supabase={supabase} onImportComplete={handleImportComplete} />
          </>
        )}

        {activeTab === 'manual' && (
          <ManualEntryTab user={user} supabase={supabase} onImportComplete={handleImportComplete} />
        )}
      </main>
    </div>
  )
}
