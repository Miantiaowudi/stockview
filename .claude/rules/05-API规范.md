---
alwaysApply: false
description: 项目的 API 规范，包括接口请求封装、错误处理原则。当新增或修改接口时读取此规则。
---

# API 规范

## 接口请求规范

- 客户端数据：使用 `src/lib/supabase.ts` 的 `@supabase/ssr`
- 服务端 API：直接使用 `process.env`
- 所有接口集中在 `src/app/api/` 目录下

## API 路由

| 路由 | 说明 |
|------|------|
| `/api/kline?code=xxx` | K线数据 |
| `/api/stocks/price` | 股票价格 |
| `/api/analysis` | AI 分析 (LangGraph) |

## 接口函数命名

| 操作 | 命名规则 | 示例 |
|------|---------|------|
| 获取列表 | getXxxList | `getBannerList` |
| 获取详情 | getXxxDetail | `getBannerDetail` |
| 创建 | createXxx | `createBanner` |
| 更新 | updateXxx | `updateBanner` |
| 删除 | deleteXxx | `deleteBanner` |

## 错误处理

- 服务端错误由 API 拦截器统一处理
- 前端表单验证错误和业务逻辑检查错误单独处理
- 成功提示可以保留

## 环境变量

```env
# Supabase（客户端）
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# DashScope（服务端）
DASHSCOPE_API_KEY=
```

## 调用 AI 分析

```typescript
const res = await fetch('/api/analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ticker, klineData, trades })
})
// 通过 reader.readableStream 读取流
```
