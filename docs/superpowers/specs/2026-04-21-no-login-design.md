# no-login 分支：移除 Supabase 认证，改用本地 IndexedDB 存储

## 背景

Supabase 到期，需要在本地运行功能。目标：移除登录/用户相关功能，交易数据存储在浏览器 IndexedDB 中。

## 架构变更

### 删除

| 文件/目录 | 说明 |
|-----------|------|
| `src/app/auth/` | 登录/注册页面 |
| `src/components/DashboardUserProvider.tsx` | 用户上下文 |
| `src/components/AuthSyncProvider.tsx` | 认证同步 |
| `src/hooks/useAuthSync.ts` | 认证同步 Hook |
| `src/lib/supabase.ts` | 客户端 Supabase 客户端 |
| `src/types/database.ts` | Supabase 类型定义 |

### 新增

| 文件 | 说明 |
|------|------|
| `src/lib/db.ts` | IndexedDB CRUD 封装 |
| `src/hooks/useLocalTrades.ts` | 本地交易数据 Hook |

### 修改

| 文件 | 说明 |
|------|------|
| `src/app/dashboard/page.tsx` | 从 IndexedDB 读取数据 |
| `src/app/dashboard/import/page.tsx` | 写入 IndexedDB |
| `src/app/page.tsx` | 直接跳转 Dashboard |
| `src/app/layout.tsx` | 移除 AuthSyncProvider |

## 数据层设计

### IndexedDB Schema

```typescript
// 数据库名：stockview_db
// 对象仓库：trades
interface Trade {
  id: string           // UUID
  stock_code: string   // 股票代码
  direction: 'buy' | 'sell'
  price: number
  quantity: number
  commission: number
  trade_time: string   // ISO 时间戳
}
```

### API 设计

```typescript
// db.ts
openDB(): Promise<IDBDatabase>
addTrade(trade: Omit<Trade, 'id'>): Promise<string>
getTrades(): Promise<Trade[]>
deleteTrade(id: string): Promise<void>
clearTrades(): Promise<void>
```

## 测试策略

- 使用 Vitest + @vitest/browser
- 测试文件：`src/lib/db.test.ts`
- 核心测试用例：
  1. 数据库初始化
  2. 添加交易记录
  3. 查询所有交易
  4. 删除交易
  5. 清空交易

## 路由变更

- `/` → 直接进入 `/dashboard`（无需登录）
- `/dashboard/import` → 直接访问（无需登录）

## 实施步骤

1. 创建 `src/lib/db.ts`（IndexedDB 封装）+ 测试用例
2. 创建 `src/hooks/useLocalTrades.ts`（交易数据 Hook）+ 测试用例
3. 改造 `src/app/dashboard/page.tsx`
4. 改造 `src/app/dashboard/import/page.tsx`
5. 改造 `src/app/page.tsx`（直接跳转）
6. 删除废弃文件
7. 清理 package.json（移除 Supabase SSR 相关依赖）
