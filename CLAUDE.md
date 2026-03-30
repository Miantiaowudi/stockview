# StockView 项目规则

## 技术栈

- **框架**: Next.js 16 (App Router)
- **UI**: React 19, Ant Design 6, Tailwind CSS 4
- **数据库**: Supabase (PostgreSQL + Auth)
- **AI**: LangGraph + 阿里云 DashScope (qwen-plus)
- **图表**: Recharts, ECharts, Lightweight Charts

## 项目结构

```
src/
├── app/                    # Next.js 页面 (App Router)
│   ├── api/               # API 路由
│   │   ├── analysis/      # AI 分析接口 (LangGraph)
│   │   ├── kline/        # K线数据接口
│   │   └── stocks/       # 股票数据接口
│   ├── auth/             # 认证页面 (login/register)
│   ├── dashboard/        # 登录后的页面
│   │   ├── detail/[code]/ # 个股详情页
│   │   └── import/       # 数据导入页
│   └── page.tsx          # 首页/引导页
├── components/            # React 组件
├── hooks/                 # 自定义 Hooks
├── lib/                   # 工具库
│   └── supabase.ts       # Supabase 客户端
└── styles/                # 全局样式
```

## 数据库

### Supabase 表

- `normalized_trades` - 用户交易记录
  - `id`: UUID (主键)
  - `user_id`: UUID (用户ID)
  - `stock_code`: string (股票代码)
  - `direction`: 'buy' | 'sell'
  - `price`: number
  - `quantity`: number
  - `commission`: number
  - `trade_time`: timestamp

## API 规范

### 环境变量

必须配置以下变量：
```env
# Supabase (客户端需要)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# DashScope AI (服务端需要)
DASHSCOPE_API_KEY=your_dashscope_api_key
```

### API 路由模式

- 客户端数据: `src/lib/supabase.ts` 使用 `@supabase/ssr`
- 服务端 API: 直接使用 `process.env`
- K线数据: `/api/kline?code=xxx`
- 股票价格: `/api/stocks/price`

## 代码规范

### 组件规范

1. 使用 `'use client'` 标记客户端组件
2. 使用 ErrorBoundary 包装页面
3. 组件文件使用 PascalCase: `StockAnalysis.tsx`
4. 组件放在对应页面的 `components/` 目录下

### 样式规范

1. 使用 Tailwind CSS
2. 优先使用原子化类名
3. 复杂样式使用 CSS 变量在 `globals.css` 中定义

### AI 分析规范

1. 使用 LangGraph 构建工作流
2. 节点: fetch → analyze → recommend
3. 使用 `ChatAlibabaTongyi` 调用 DashScope
4. 流式响应使用 `ReadableStream`

## 常用操作

### 添加新页面

1. 在 `src/app/` 下创建目录和 `page.tsx`
2. 使用 `createClient()` 获取 Supabase 客户端
3. 使用 `useDashboardUser()` 获取当前用户

### 添加 API 路由

1. 在 `src/app/api/` 下创建目录和 `route.ts`
2. 导出 `GET`, `POST` 等函数
3. 服务端直接读取 `process.env`

### 调用 AI 分析

```typescript
// 调用 /api/analysis
const response = await fetch('/api/analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ticker, klineData, trades })
})
// 使用 reader.readableStream 读取流
```

## 禁止事项

- ❌ 禁止硬编码 API Key
- ❌ 禁止使用 `as any` 类型断言
- ❌ 禁止提交 `.env.local` 到 Git
- ❌ 禁止在客户端组件中直接使用服务端环境变量
