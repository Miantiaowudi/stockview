import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '使用指南 - StockView 股票投资管理平台',
  description: 'StockView 使用指南，新手入门教程',
}

export default function GuidePage() {
  const steps = [
    {
      step: '01',
      title: '注册账户',
      description: '点击注册按钮，使用邮箱地址创建账户。',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
    },
    {
      step: '02',
      title: '登录系统',
      description: '使用注册的邮箱和密码登录平台。',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
      ),
    },
    {
      step: '03',
      title: '导入数据',
      description: '在「数据导入」页面上传 CSV 文件，批量添加持仓。',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      ),
    },
    {
      step: '04',
      title: '查看仪表盘',
      description: '在「仪表盘」页面查看总资产、持仓分布和收益走势。',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      step: '05',
      title: '个股分析',
      description: '点击任意持仓股票，进入详情页面分析走势。',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      ),
    },
  ]

  const faqs = [
    {
      question: '支持哪些券商的数据导入？',
      answer: '目前支持 CSV 格式的持仓数据导入，您可以从券商客户端导出持仓记录后上传。',
    },
    {
      question: '数据存储在哪里？',
      answer: '您的数据存储在 Supabase 云数据库中，只有您自己可以访问。',
    },
    {
      question: '忘记密码怎么办？',
      answer: '请联系系统管理员重置密码。',
    },
    {
      question: '如何删除我的账户？',
      answer: '请联系系统管理员处理账户注销事宜。',
    },
  ]

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
            <Link href="/about" className="text-slate-600 hover:text-blue-600 transition-colors">
              关于
            </Link>
            <Link href="/" className="ant-btn">
              返回
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
            使用指南
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            5 分钟快速上手 StockView
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-5 gap-6 mb-20">
          {steps.map((item, index) => (
            <div key={item.step} className="relative">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full">
                <div className="text-blue-600 mb-4">{item.icon}</div>
                <div className="text-3xl font-bold text-slate-200 mb-2">{item.step}</div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm">{item.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 text-slate-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CSV Format */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 mb-16">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">CSV 导入格式</h2>
          <p className="text-slate-600 mb-4">
            上传的 CSV 文件需要包含以下列：
          </p>
          <div className="bg-slate-900 rounded-xl p-6 overflow-x-auto">
            <pre className="text-green-400 font-mono text-sm">
{`股票代码,股票名称,持仓数量,成本价,当前价
600519,贵州茅台,100,1500.00,1800.00
000858,五粮液,200,120.00,145.00`}
            </pre>
          </div>
          <p className="text-slate-500 text-sm mt-4">
            * 股票代码为必填项，其他字段可选
          </p>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">常见问题</h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{faq.question}</h3>
                <p className="text-slate-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <p className="text-slate-600 mb-6">准备好开始了吗？</p>
          <div className="flex justify-center gap-4">
            <Link href="/auth/register" className="ant-btn ant-btn-primary">
              立即注册
            </Link>
            <Link href="/auth/login" className="ant-btn">
              登录
            </Link>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-2 gap-6 mt-16">
          <Link href="/about" className="group bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:border-blue-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                <svg className="w-6 h-6 text-blue-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">关于我们</h3>
                <p className="text-slate-500 text-sm">了解项目和技术栈</p>
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
            <p>© 2026 StockView. Built with ❤️</p>
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
