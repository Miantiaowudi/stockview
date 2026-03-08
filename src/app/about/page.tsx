import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '关于 - StockView 股票投资管理平台',
  description: '了解 StockView 项目、技术栈和开发团队',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-xl font-bold text-slate-800">StockView</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/guide" className="text-slate-600 hover:text-blue-600 transition-colors">
              使用指南
            </Link>
            <Link 
              href="/auth/login" 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              立即登录
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
            关于 StockView
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            一个简洁优雅的股票投资管理平台，帮助您轻松追踪和管理投资组合
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">数据可视化</h3>
            <p className="text-slate-600">清晰的图表展示资产配置和收益走势，一目了然</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">安全可靠</h3>
            <p className="text-slate-600">基于 Supabase 的企业级认证，数据安全有保障</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">多端同步</h3>
            <p className="text-slate-600">支持多窗口操作，退出登录自动同步</p>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 mb-16">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">技术栈</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { name: 'Next.js 16', color: 'bg-black text-white' },
              { name: 'React 19', color: 'bg-blue-500 text-white' },
              { name: 'TypeScript', color: 'bg-blue-400 text-white' },
              { name: 'Tailwind CSS v4', color: 'bg-cyan-500 text-white' },
              { name: 'Supabase', color: 'bg-green-500 text-white' },
              { name: 'Recharts', color: 'bg-red-500 text-white' },
              { name: 'ECharts', color: 'bg-orange-500 text-white' },
            ].map((tech) => (
              <span 
                key={tech.name}
                className={`px-4 py-2 rounded-full font-medium ${tech.color}`}
              >
                {tech.name}
              </span>
            ))}
          </div>
        </div>

        {/* Open Source */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white text-center mb-8">
          <h2 className="text-2xl font-bold mb-4">开源项目</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            StockView 是开源项目，欢迎 Star 和贡献代码。
          </p>
          <a 
            href="https://github.com/Miantiaowudi/stockview"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </a>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/guide" className="group bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:border-blue-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                <svg className="w-6 h-6 text-blue-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">使用指南</h3>
                <p className="text-slate-500 text-sm">5 分钟快速上手</p>
              </div>
              <svg className="w-5 h-5 text-slate-400 ml-auto group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          <a href="https://github.com/Miantiaowudi/stockview" target="_blank" rel="noopener noreferrer" className="group bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:border-slate-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-800 transition-colors">
                <svg className="w-6 h-6 text-slate-600 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 group-hover:text-slate-600 transition-colors">GitHub</h3>
                <p className="text-slate-500 text-sm">欢迎 Star 和贡献</p>
              </div>
              <svg className="w-5 h-5 text-slate-400 ml-auto group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-6">
            <p>© 2024 StockView. Built with ❤️</p>
          </div>
          <div className="flex justify-center gap-6">
            <Link href="/guide" className="text-slate-400 hover:text-white transition-colors">
              使用指南
            </Link>
            <Link href="/about" className="text-slate-400 hover:text-white transition-colors">
              关于我们
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
