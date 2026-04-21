# StockView 项目规范

> 基于 Next.js 16 + Ant Design 6 + Supabase + LangGraph 的股票分析平台

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| UI | React 19, Ant Design 6, Tailwind CSS 4 |
| 数据库 | Supabase (PostgreSQL + Auth) |
| AI | LangGraph + 阿里云 DashScope (qwen-plus) |
| 图表 | Recharts, ECharts, Lightweight Charts |

## 项目结构

```
src/
├── app/                    # Next.js 页面
│   ├── api/               # API 路由
│   │   ├── analysis/      # AI 分析 (LangGraph)
│   │   ├── kline/         # K线数据
│   │   └── stocks/         # 股票数据
│   ├── auth/              # 登录/注册
│   ├── dashboard/          # 登录后页面
│   │   ├── detail/[code]/ # 个股详情
│   │   └── import/        # 数据导入
│   └── page.tsx           # 首页
├── components/             # React 组件
├── hooks/                  # 自定义 Hooks
├── lib/                    # 工具库 (supabase.ts)
└── styles/                 # 全局样式
```

## 数据库

### normalized_trades（用户交易记录）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户ID |
| stock_code | string | 股票代码 |
| direction | 'buy' \| 'sell' | 买卖方向 |
| price | number | 成交价 |
| quantity | number | 数量 |
| commission | number | 佣金 |
| trade_time | timestamp | 交易时间 |

## 环境变量

```env
# Supabase（客户端）
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# DashScope（服务端）
DASHSCOPE_API_KEY=
```

## 代码规范

### 组件
- 客户端组件添加 `'use client'`
- 使用 ErrorBoundary 包装页面
- 文件名 PascalCase: `StockCard.tsx`
- 组件放在页面目录的 `components/` 下

### 样式
- Tailwind CSS 原子化类名优先
- 复杂样式用 CSS 变量（定义在 `globals.css`）

### AI 分析
- LangGraph 工作流：`fetch → analyze → recommend`
- 调用 `ChatAlibabaTongyi`（DashScope）
- 流式响应用 `ReadableStream`

## 常用操作

### 新增页面
1. 创建 `src/app/<path>/page.tsx`
2. 使用 `createClient()` 获取 Supabase 客户端
3. 使用 `useDashboardUser()` 获取当前用户

### 新增 API 路由
1. 创建 `src/app/api/<name>/route.ts`
2. 导出 `GET`/`POST` 函数
3. 服务端直接读取 `process.env`

### 调用 AI 分析
```typescript
const res = await fetch('/api/analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ticker, klineData, trades })
})
// 通过 reader.readableStream 读取流
```

## 禁止事项

- ❌ 硬编码 API Key
- ❌ `as any` 类型断言
- ❌ 提交 `.env.local` 到 Git
- ❌ 客户端组件直接使用服务端环境变量
