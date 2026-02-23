'use client'

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
      } else {
        setUser(user)
      }
      setLoading(false)
    }
    getUser()
  }, [supabase, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">StockView 数据看板</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-blue-600 hover:underline"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">总资产</h3>
            <p className="text-2xl font-bold">--</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">总收益率</h3>
            <p className="text-2xl font-bold">--</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">持仓数量</h3>
            <p className="text-2xl font-bold">--</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-lg font-semibold mb-4">功能入口</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href="/dashboard/import" className="p-4 border rounded-lg hover:bg-gray-50">
              <h3 className="font-medium">📥 数据导入</h3>
              <p className="text-sm text-gray-500">导入券商CSV文件</p>
            </a>
            <a href="/dashboard/analytics" className="p-4 border rounded-lg hover:bg-gray-50">
              <h3 className="font-medium">📊 账户分析</h3>
              <p className="text-sm text-gray-500">收益率曲线、仓位占比</p>
            </a>
            <a href="/dashboard/stocks" className="p-4 border rounded-lg hover:bg-gray-50">
              <h3 className="font-medium">📈 个股复盘</h3>
              <p className="text-sm text-gray-500">K线图、买卖点标注</p>
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
