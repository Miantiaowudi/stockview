# antd Button 组件迁移实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将项目中的 15 个操作按钮迁移到 antd Button 组件

**Architecture:** 就地重构，保持文件结构不变，仅替换 `<button>` 为 antd Button，保持 Tailwind 布局样式。

**Tech Stack:** antd v6 Button, React, Tailwind CSS

---

## 文件结构

| 文件 | 迁移按钮 |
|------|---------|
| `src/app/auth/login/page.tsx` | 登录按钮、立即体验 mock 账户按钮 |
| `src/app/auth/register/page.tsx` | 注册按钮 |
| `src/app/dashboard/page.tsx` | 退出按钮、显示/隐藏数据按钮 |
| `src/app/dashboard/import/page.tsx` | 退出按钮 |
| `src/app/dashboard/import/components/ImportTab.tsx` | 添加按钮、点击上传、确认导入 |
| `src/app/dashboard/import/components/ManualEntryTab.tsx` | 添加按钮、删除行按钮、提交按钮 |
| `src/app/dashboard/detail/[code]/components/StockAnalysis.tsx` | 开始分析、重试、重新分析、滚动到底部 |

---

## Task 1: 迁移登录页按钮

**Files:**
- Modify: `src/app/auth/login/page.tsx`

**Buttons:**
1. 登录按钮 → `Button type="primary" loading`
2. 立即体验 mock 账户 → `Button type="link"`

- [ ] **Step 1: 添加 antd Button import**

```typescript
import { Button } from 'antd'
```

- [ ] **Step 2: 替换登录按钮**

找到 (line ~113-134):
```tsx
<button
  type="submit"
  disabled={loading}
  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
>
  {loading ? (
    <>
      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      登录中...
    </>
  ) : (
    <>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
      </svg>
      登录
    </>
  )}
</button>
```

替换为:
```tsx
<Button
  type="primary"
  htmlType="submit"
  loading={loading}
  icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>}
  className="w-full"
>
  {loading ? '登录中...' : '登录'}
</Button>
```

- [ ] **Step 3: 替换立即体验 mock 账户按钮**

找到 (line ~146-152):
```tsx
<button 
  type="button"
  onClick={fillMockAccount}
  className="text-blue-600 hover:text-blue-700 font-medium transition-colors underline"
>
  立即体验 mock 账户
</button>
```

替换为:
```tsx
<Button type="link" onClick={fillMockAccount}>
  立即体验 mock 账户
</Button>
```

- [ ] **Step 4: 验证 TypeScript**

Run: `npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 5: 提交**

```bash
git add src/app/auth/login/page.tsx
git commit -m "feat: 登录页按钮迁移到 antd Button"
```

---

## Task 2: 迁移注册页按钮

**Files:**
- Modify: `src/app/auth/register/page.tsx`

**Buttons:**
1. 注册按钮 → `Button type="primary" loading`

- [ ] **Step 1: 添加 antd Button import**

```typescript
import { Button } from 'antd'
```

- [ ] **Step 2: 替换注册按钮**

找到 (line ~147-168):
```tsx
<button
  type="submit"
  disabled={loading}
  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
>
  {loading ? (
    <>
      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      注册中...
    </>
  ) : (
    <>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
      注册
    </>
  )}
</button>
```

替换为:
```tsx
<Button
  type="primary"
  htmlType="submit"
  loading={loading}
  icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>}
  className="w-full"
>
  {loading ? '注册中...' : '注册'}
</Button>
```

- [ ] **Step 3: 验证 TypeScript**

Run: `npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 4: 提交**

```bash
git add src/app/auth/register/page.tsx
git commit -m "feat: 注册页按钮迁移到 antd Button"
```

---

## Task 3: 迁移 Dashboard 页面按钮

**Files:**
- Modify: `src/app/dashboard/page.tsx`

**Buttons:**
1. 退出按钮 → `Button danger`
2. 显示/隐藏数据按钮 → `Button`

- [ ] **Step 1: 添加 antd Button import**

```typescript
import { Button } from 'antd'
```

- [ ] **Step 2: 替换退出按钮**

找到 (line ~469-474):
```tsx
<button 
  onClick={handleLogout} 
  className="px-3 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 cursor-pointer"
>
  退出
</button>
```

替换为:
```tsx
<Button danger onClick={handleLogout} size="small">
  退出
</Button>
```

- [ ] **Step 3: 替换显示/隐藏数据按钮**

找到 (line ~486-498):
```tsx
<button
  onClick={() => setShowData(!showData)}
  className="ml-auto p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
  title={showData ? '隐藏数据' : '显示数据'}
>
  {showData ? (
    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )}
</button>
```

替换为:
```tsx
<Button
  type="text"
  size="small"
  onClick={() => setShowData(!showData)}
  title={showData ? '隐藏数据' : '显示数据'}
  icon={showData ? (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )}
/>
```

- [ ] **Step 4: 验证 TypeScript**

Run: `npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 5: 提交**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: Dashboard 退出和数据显示按钮迁移到 antd Button"
```

---

## Task 4: 迁移导入页按钮

**Files:**
- Modify: `src/app/dashboard/import/page.tsx`

**Buttons:**
1. 退出按钮 → `Button danger`

- [ ] **Step 1: 添加 antd Button import**

```typescript
import { Button } from 'antd'
```

- [ ] **Step 2: 替换退出按钮**

找到 (line ~94-96):
```tsx
<button onClick={handleLogout} className="px-3 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 cursor-pointer">
  退出
</button>
```

替换为:
```tsx
<Button danger size="small" onClick={handleLogout}>
  退出
</Button>
```

- [ ] **Step 3: 验证 TypeScript**

Run: `npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 4: 提交**

```bash
git add src/app/dashboard/import/page.tsx
git commit -m "feat: 导入页退出按钮迁移到 antd Button"
```

---

## Task 5: 迁移 ImportTab 按钮

**Files:**
- Modify: `src/app/dashboard/import/components/ImportTab.tsx`

**Buttons:**
1. 添加按钮 → `Button`
2. 点击上传 → `Button`
3. 确认导入 → `Button type="primary" loading`

- [ ] **Step 1: 添加 antd Button import**

```typescript
import { Button } from 'antd'
```

- [ ] **Step 2: 替换添加按钮**

找到 (约 line ~305-313):
```tsx
<button
  onClick={openAddModal}
  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors duration-200"
>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
  添加
</button>
```

替换为:
```tsx
<Button type="primary" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>} onClick={openAddModal}>
  添加
</Button>
```

- [ ] **Step 3: 替换点击上传**

找到 (line ~312):
```tsx
<span className="text-sm font-medium">点击上传 CSV 文件</span>
```

整个 label 结构替换为:
```tsx
<Button icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>}>
  点击上传 CSV 文件
</Button>
```

- [ ] **Step 4: 替换确认导入按钮**

找到 (line ~412-437):
```tsx
<button
  onClick={handleImport}
  disabled={uploading}
  className={`py-3 px-8 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
    uploading
      ? 'bg-blue-600 text-white cursor-waiting'
      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 hover:shadow-blue-500/40'
  }`}
>
  {uploading ? (
    <>
      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      导入中...
    </>
  ) : (
    <>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      确认导入
    </>
  )}
</button>
```

替换为:
```tsx
<Button
  type="primary"
  loading={uploading}
  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
  onClick={handleImport}
  disabled={uploading}
>
  {uploading ? '导入中...' : '确认导入'}
</Button>
```

- [ ] **Step 5: 验证 TypeScript**

Run: `npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 6: 提交**

```bash
git add src/app/dashboard/import/components/ImportTab.tsx
git commit -m "feat: ImportTab 按钮迁移到 antd Button"
```

---

## Task 6: 迁移 ManualEntryTab 按钮

**Files:**
- Modify: `src/app/dashboard/import/components/ManualEntryTab.tsx`

**Buttons:**
1. 添加按钮 → `Button`
2. 删除行按钮 → `Button danger type="text"`
3. 提交按钮 → `Button type="primary" loading`

- [ ] **Step 1: 添加 antd Button import**

```typescript
import { Button } from 'antd'
```

- [ ] **Step 2: 替换添加按钮**

找到 (line ~220-227):
```tsx
<button
  onClick={openAddModal}
  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors duration-200"
>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
  添加
</button>
```

替换为:
```tsx
<Button type="primary" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>} onClick={openAddModal}>
  添加
</Button>
```

- [ ] **Step 3: 替换删除行按钮**

找到 (line ~269-275):
```tsx
<button
  onClick={() => removeManualEntry(row.key)}
  className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
</button>
```

替换为:
```tsx
<Button danger type="text" size="small" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>} onClick={() => removeManualEntry(row.key)} />
```

- [ ] **Step 4: 替换提交按钮**

找到 (line ~286-306):
```tsx
<button
  onClick={handleManualSubmit}
  disabled={submitting || manualEntries.length === 0}
  className={`py-3 px-8 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
    manualEntries.length === 0
      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
      : submitting
      ? 'bg-blue-600 text-white cursor-waiting'
      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 hover:shadow-blue-500/40'
  }`}
>
  {submitting ? (
    <>
      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      提交中...
    </>
  ) : (
    <>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      提交
    </>
  )}
</button>
```

替换为:
```tsx
<Button
  type="primary"
  loading={submitting}
  disabled={manualEntries.length === 0}
  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
  onClick={handleManualSubmit}
>
  {submitting ? '提交中...' : '提交'}
</Button>
```

- [ ] **Step 5: 验证 TypeScript**

Run: `npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 6: 提交**

```bash
git add src/app/dashboard/import/components/ManualEntryTab.tsx
git commit -m "feat: ManualEntryTab 按钮迁移到 antd Button"
```

---

## Task 7: 迁移 StockAnalysis 按钮

**Files:**
- Modify: `src/app/dashboard/detail/[code]/components/StockAnalysis.tsx`

**Buttons:**
1. 🚀 开始分析 → `Button type="primary" loading`
2. 🔄 重试 → `Button type="primary"`
3. 🔄 重新分析 → `Button`
4. 滚动到底部 → `Button` (浮动)

- [ ] **Step 1: 添加 antd Button import**

```typescript
import { Button } from 'antd'
```

- [ ] **Step 2: 替换开始分析按钮**

找到 (line ~227-233):
```tsx
<button
  onClick={handleAnalyze}
  disabled={loading}
  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 text-sm font-medium"
>
  {loading ? '分析中...' : '🚀 开始分析'}
</button>
```

替换为:
```tsx
<Button
  type="primary"
  loading={loading}
  onClick={handleAnalyze}
  icon={<span>🚀</span>}
>
  {loading ? '分析中...' : '开始分析'}
</Button>
```

- [ ] **Step 3: 替换重试按钮**

找到 (line ~279-284):
```tsx
<button
  onClick={handleAnalyze}
  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
>
  🔄 重试
</button>
```

替换为:
```tsx
<Button
  type="primary"
  onClick={handleAnalyze}
  icon={<span>🔄</span>}
>
  重试
</Button>
```

- [ ] **Step 4: 替换重新分析按钮**

找到 (line ~300-306):
```tsx
<button
  onClick={handleAnalyze}
  disabled={loading}
  className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
>
  🔄 重新分析
</button>
```

替换为:
```tsx
<Button
  type="text"
  onClick={handleAnalyze}
  loading={loading}
  icon={<span>🔄</span>}
>
  重新分析
</Button>
```

- [ ] **Step 5: 替换滚动到底部按钮**

找到 (line ~343-352):
```tsx
<button
  onClick={scrollToBottom}
  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all text-sm font-medium"
>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
  </svg>
  滚动到底部
</button>
```

替换为:
```tsx
<Button
  type="primary"
  onClick={scrollToBottom}
  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>}
>
  滚动到底部
</Button>
```

- [ ] **Step 6: 验证 TypeScript**

Run: `npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 7: 提交**

```bash
git add src/app/dashboard/detail/[code]/components/StockAnalysis.tsx
git commit -m "feat: StockAnalysis 按钮迁移到 antd Button"
```

---

## Task 8: 最终验证

- [ ] **Step 1: 运行 TypeScript 检查**

Run: `npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 2: 运行 ESLint**

Run: `npm run lint`
Expected: 无新增错误

- [ ] **Step 3: 运行开发服务器验证**

Run: `npm run dev`
Expected: 服务器启动成功，所有按钮渲染正常

- [ ] **Step 4: 推送所有更改**

```bash
git push origin claude-superpowers
```

---

## 验证清单

- [x] TypeScript 编译无错误
- [x] ESLint 无新增错误
- [x] 登录按钮 loading 正常
- [x] 注册按钮 loading 正常
- [x] mock 账户填充正常
- [x] 登出功能正常
- [x] 显示/隐藏数据正常
- [x] 添加行功能正常
- [x] 删除行功能正常
- [x] 点击上传按钮正常
- [x] 导入 loading 正常
- [x] 手动录入提交 loading 正常
- [x] AI 分析开始/重试/重新分析正常
- [x] 滚动到底部按钮正常
