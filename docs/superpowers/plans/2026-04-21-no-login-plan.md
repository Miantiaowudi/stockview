# no-login 分支：移除 Supabase 认证，TDD 范式实现 IndexedDB 本地存储

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 移除登录/用户相关功能，交易数据存储在浏览器 IndexedDB 中

**Architecture:**
- 新建 `src/lib/db.ts` 封装 IndexedDB CRUD
- 新建 `src/hooks/useLocalTrades.ts` 管理交易数据状态
- 改造 Dashboard 和 Import 页面使用本地存储
- 移除所有 Supabase 认证相关代码

**Tech Stack:** Vitest + @vitest/browser（测试）, IndexedDB（存储）, TypeScript

---

## 文件结构

```
src/
├── lib/
│   ├── db.ts                    # IndexedDB 封装（新增）
│   └── stockApi.ts              # 股票价格 API（保留）
├── hooks/
│   └── useLocalTrades.ts        # 本地交易 Hook（新增）
└── app/
    ├── dashboard/
    │   ├── page.tsx             # 改用本地存储
    │   └── import/
    │       └── page.tsx        # 改用本地存储
    └── page.tsx                 # 直接跳转 Dashboard
```

**删除文件:**
- `src/app/auth/`（整个目录）
- `src/components/DashboardUserProvider.tsx`
- `src/components/AuthSyncProvider.tsx`
- `src/hooks/useAuthSync.ts`
- `src/lib/supabase.ts`
- `src/types/database.ts`

---

## Task 1: 设置 Vitest 测试框架

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/lib/db.test.ts`

- [ ] **Step 1: 安装 Vitest 依赖**

```bash
npm install -D vitest @vitest/browser playwright @types/node
```

- [ ] **Step 2: 创建 vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    browser: {
      provider: 'playwright',
      instanceOptions: {
        baseURL: 'http://localhost:3000',
      },
    },
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

- [ ] **Step 3: 创建测试 setup 文件**

```typescript
// src/test/setup.ts
// 测试环境初始化
```

- [ ] **Step 4: 更新 package.json scripts**

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run"
  }
}
```

- [ ] **Step 5: 提交**

```bash
git add package.json vitest.config.ts src/test/
git commit -m "test: 设置 Vitest 测试框架"
```

---

## Task 2: 实现 IndexedDB 数据库封装 db.ts（TDD）

**Files:**
- Create: `src/lib/db.ts`
- Create: `src/lib/db.test.ts`

- [ ] **Step 1: 编写 db.ts 测试用例**

```typescript
// src/lib/db.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { openDB, addTrade, getTrades, deleteTrade, clearTrades } from './db'

describe('db', () => {
  beforeEach(async () => {
    // 清理数据库
    await clearTrades()
  })

  it('应该成功打开数据库', async () => {
    const db = await openDB()
    expect(db).toBeDefined()
    expect(db.name).toBe('stockview_db')
  })

  it('应该添加交易记录并返回 id', async () => {
    const trade = {
      stock_code: '000001',
      direction: 'buy' as const,
      price: 10.5,
      quantity: 100,
      commission: 5,
      trade_time: new Date().toISOString(),
    }
    const id = await addTrade(trade)
    expect(id).toBeDefined()
    expect(typeof id).toBe('string')
  })

  it('应该返回所有交易记录', async () => {
    const trade = {
      stock_code: '000001',
      direction: 'buy' as const,
      price: 10.5,
      quantity: 100,
      commission: 5,
      trade_time: new Date().toISOString(),
    }
    await addTrade(trade)
    const trades = await getTrades()
    expect(trades).toHaveLength(1)
    expect(trades[0].stock_code).toBe('000001')
  })

  it('应该删除指定交易记录', async () => {
    const trade = {
      stock_code: '000001',
      direction: 'buy' as const,
      price: 10.5,
      quantity: 100,
      commission: 5,
      trade_time: new Date().toISOString(),
    }
    const id = await addTrade(trade)
    await deleteTrade(id)
    const trades = await getTrades()
    expect(trades).toHaveLength(0)
  })

  it('应该清空所有交易记录', async () => {
    const trades = [
      { stock_code: '000001', direction: 'buy' as const, price: 10.5, quantity: 100, commission: 5, trade_time: new Date().toISOString() },
      { stock_code: '000002', direction: 'sell' as const, price: 11.0, quantity: 50, commission: 3, trade_time: new Date().toISOString() },
    ]
    await addTrade(trades[0])
    await addTrade(trades[1])
    await clearTrades()
    const result = await getTrades()
    expect(result).toHaveLength(0)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm run test:run -- src/lib/db.test.ts
```
Expected: FAIL - "Cannot find module './db'"

- [ ] **Step 3: 实现最小化 db.ts**

```typescript
// src/lib/db.ts

const DB_NAME = 'stockview_db'
const DB_VERSION = 1
const STORE_NAME = 'trades'

export interface Trade {
  id: string
  stock_code: string
  direction: 'buy' | 'sell'
  price: number
  quantity: number
  commission: number
  trade_time: string
}

export type TradeInput = Omit<Trade, 'id'>

function generateId(): string {
  return crypto.randomUUID()
}

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })
}

export async function addTrade(trade: TradeInput): Promise<string> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const record: Trade = { ...trade, id: generateId() }
    const request = store.add(record)

    request.onsuccess = () => resolve(record.id)
    request.onerror = () => reject(request.error)
  })
}

export async function getTrades(): Promise<Trade[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => {
      // 按 trade_time 升序排列
      const sorted = request.result.sort((a, b) =>
        new Date(a.trade_time).getTime() - new Date(b.trade_time).getTime()
      )
      resolve(sorted)
    }
    request.onerror = () => reject(request.error)
  })
}

export async function deleteTrade(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function clearTrades(): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.clear()

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npm run test:run -- src/lib/db.test.ts
```
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/lib/db.ts src/lib/db.test.ts
git commit -m "feat: 实现 IndexedDB 数据库封装

- openDB: 打开数据库连接
- addTrade: 添加交易记录
- getTrades: 获取所有交易
- deleteTrade: 删除交易
- clearTrades: 清空所有交易"
```

---

## Task 3: 实现 useLocalTrades Hook（TDD）

**Files:**
- Create: `src/hooks/useLocalTrades.ts`
- Create: `src/hooks/useLocalTrades.test.ts`

- [ ] **Step 1: 编写 useLocalTrades 测试用例**

```typescript
// src/hooks/useLocalTrades.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalTrades } from './useLocalTrades'
import { clearTrades } from '../lib/db'

describe('useLocalTrades', () => {
  beforeEach(async () => {
    await clearTrades()
  })

  it('应该返回空交易列表', async () => {
    const { result } = renderHook(() => useLocalTrades())
    expect(result.current.trades).toEqual([])
    expect(result.current.loading).toBe(false)
  })

  it('应该添加交易记录', async () => {
    const { result } = renderHook(() => useLocalTrades())
    const trade = {
      stock_code: '000001',
      direction: 'buy' as const,
      price: 10.5,
      quantity: 100,
      commission: 5,
      trade_time: new Date().toISOString(),
    }

    await act(async () => {
      await result.current.addTrade(trade)
    })

    expect(result.current.trades).toHaveLength(1)
    expect(result.current.trades[0].stock_code).toBe('000001')
  })

  it('应该删除交易记录', async () => {
    const { result } = renderHook(() => useLocalTrades())
    const trade = {
      stock_code: '000001',
      direction: 'buy' as const,
      price: 10.5,
      quantity: 100,
      commission: 5,
      trade_time: new Date().toISOString(),
    }

    await act(async () => {
      const id = await result.current.addTrade(trade)
      await result.current.deleteTrade(id)
    })

    expect(result.current.trades).toHaveLength(0)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm run test:run -- src/hooks/useLocalTrades.test.ts
```
Expected: FAIL - "Cannot find module './useLocalTrades'"

- [ ] **Step 3: 实现 useLocalTrades Hook**

```typescript
// src/hooks/useLocalTrades.ts
import { useState, useEffect, useCallback } from 'react'
import { Trade, TradeInput, getTrades, addTrade as dbAddTrade, deleteTrade as dbDeleteTrade } from '@/lib/db'

export function useLocalTrades() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)

  // 加载交易数据
  const loadTrades = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getTrades()
      setTrades(data)
    } catch (error) {
      console.error('加载交易数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTrades()
  }, [loadTrades])

  // 添加交易
  const addTrade = useCallback(async (trade: TradeInput): Promise<string> => {
    const id = await dbAddTrade(trade)
    await loadTrades()
    return id
  }, [loadTrades])

  // 删除交易
  const deleteTrade = useCallback(async (id: string): Promise<void> => {
    await dbDeleteTrade(id)
    await loadTrades()
  }, [loadTrades])

  return {
    trades,
    loading,
    addTrade,
    deleteTrade,
    reload: loadTrades,
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npm run test:run -- src/hooks/useLocalTrades.test.ts
```
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/hooks/useLocalTrades.ts src/hooks/useLocalTrades.test.ts
git commit -m "feat: 实现 useLocalTrades Hook

- 管理本地交易数据状态
- 提供 addTrade, deleteTrade, reload 方法"
```

---

## Task 4: 改造 Dashboard 页面

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: 查看当前 dashboard/page.tsx 的完整代码**

```bash
cat src/app/dashboard/page.tsx
```

- [ ] **Step 2: 移除 Supabase 和用户相关依赖**

删除以下导入：
```typescript
import { createClient } from '@/lib/supabase'
import { useDashboardUser } from '@/components/DashboardUserProvider'
```

替换为：
```typescript
import { useLocalTrades } from '@/hooks/useLocalTrades'
```

- [ ] **Step 3: 移除 useDashboardUser 调用**

删除：
```typescript
const user = useDashboardUser()
```

- [ ] **Step 4: 修改数据加载逻辑**

将 Supabase 查询：
```typescript
const { data: tradesData, error } = await supabase
  .from('normalized_trades')
  .select('*')
  .eq('user_id', user.id)
  .order('trade_time', { ascending: true })
```

替换为使用 Hook：
```typescript
const { trades, loading } = useLocalTrades()
// trades 已经按 trade_time 排序（需要确认 db.ts 实现）
```

- [ ] **Step 5: 移除退出登录按钮和用户邮箱显示**

删除 header 中的：
```typescript
<span className="hidden sm:inline text-sm text-slate-500">{user?.email}</span>
<Button danger onClick={handleLogout} size="small">
  退出
</Button>
```

以及 handleLogout 函数。

- [ ] **Step 6: 提交**

```bash
git add src/app/dashboard/page.tsx
git commit -m "refactor: dashboard 页面改用本地存储

- 移除 Supabase 依赖
- 使用 useLocalTrades Hook 管理数据"
```

---

## Task 5: 改造 Import 页面

**Files:**
- Modify: `src/app/dashboard/import/page.tsx`
- Modify: `src/app/dashboard/import/components/ImportTab.tsx`
- Modify: `src/app/dashboard/import/components/ManualEntryTab.tsx`

- [ ] **Step 1: 移除 Supabase 和用户相关代码**

删除导入：
```typescript
import { createClient } from '@/lib/supabase'
import { useDashboardUser } from '@/components/DashboardUserProvider'
```

- [ ] **Step 2: 使用 useLocalTrades 替代 Supabase**

将数据保存逻辑从：
```typescript
const { error } = await supabase.from('normalized_trades').insert(...)
```

替换为：
```typescript
await addTrade(tradeData)
```

- [ ] **Step 3: 移除退出登录按钮**

- [ ] **Step 4: 提交**

```bash
git add src/app/dashboard/import/
git commit -m "refactor: import 页面改用本地存储"
```

---

## Task 6: 改造首页直接跳转

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: 查看当前 page.tsx**

- [ ] **Step 2: 移除登录检查逻辑，直接跳转 Dashboard**

```typescript
import { redirect } from 'next/navigation'

export default function HomePage() {
  redirect('/dashboard')
}
```

- [ ] **Step 3: 提交**

```bash
git add src/app/page.tsx
git commit -m "refactor: 首页直接跳转到 Dashboard"
```

---

## Task 7: 清理废弃文件

**Files:**
- Delete: `src/app/auth/`（整个目录）
- Delete: `src/components/DashboardUserProvider.tsx`
- Delete: `src/components/AuthSyncProvider.tsx`
- Delete: `src/hooks/useAuthSync.ts`
- Delete: `src/lib/supabase.ts`
- Delete: `src/types/database.ts`

- [ ] **Step 1: 删除文件**

```bash
rm -rf src/app/auth
rm -f src/components/DashboardUserProvider.tsx
rm -f src/components/AuthSyncProvider.tsx
rm -f src/hooks/useAuthSync.ts
rm -f src/lib/supabase.ts
rm -f src/types/database.ts
```

- [ ] **Step 2: 检查还有没有引用这些文件的代码**

```bash
grep -r "DashboardUserProvider\|useDashboardUser\|AuthSyncProvider\|useAuthSync\|supabase" src/ --include="*.ts" --include="*.tsx"
```

- [ ] **Step 3: 清理 layout.tsx 中的 AuthSyncProvider**

如果 `src/app/layout.tsx` 或 `src/app/dashboard/layout.tsx` 中有 AuthSyncProvider，移除它。

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "refactor: 移除 Supabase 认证相关代码"
```

---

## Task 8: 清理 package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 移除 Supabase 依赖**

```bash
npm uninstall @supabase/ssr @supabase/supabase-js
```

- [ ] **Step 2: 确认 package.json**

删除后的依赖：
- `@ant-design/icons`
- `@langchain/community`
- `@langchain/langgraph`
- `@langchain/langgraph-sdk`
- `@langchain/ollama`
- `antd`
- `echarts`
- `echarts-for-react`
- `lightweight-charts`
- `next`
- `react`
- `react-dom`
- `react-markdown`
- `recharts`
- `rehype-katex`
- `remark-gfm`
- `remark-math`
- `trading-signals`

- [ ] **Step 3: 提交**

```bash
git add package.json package-lock.json
git commit -m "chore: 移除 Supabase 依赖"
```

---

## Task 9: 最终验证

- [ ] **Step 1: 运行 lint 检查**

```bash
npm run lint
```

- [ ] **Step 2: 运行构建**

```bash
npm run build
```

- [ ] **Step 3: 运行所有测试**

```bash
npm run test:run
```

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "chore: no-login 分支改造完成"
```

---

## 验证清单

- [ ] IndexedDB CRUD 测试通过
- [ ] useLocalTrades Hook 测试通过
- [ ] Dashboard 页面可正常显示
- [ ] Import 页面可正常导入数据
- [ ] 首页直接跳转 Dashboard
- [ ] 无 Supabase 引用残留
- [ ] `npm run build` 成功
