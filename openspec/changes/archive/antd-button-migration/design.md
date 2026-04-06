# Design: antd-button-migration

## Design Principles
1. **保持图标** - 所有按钮的图标元素保持原样
2. **统一尺寸** - 使用 antd 默认尺寸，特殊情况使用 `size="small"` 或 `size="large"`
3. **语义类型** - 根据按钮用途选择正确的 antd 类型
4. **状态一致** - 保持原有的 loading/disabled 状态

## Button Type Mapping

| 用途 | antd Type | 示例 |
|------|-----------|------|
| 主要操作 | `type="primary"` | 登录、提交、导入、注册 |
| 危险操作 | `danger` | 删除 |
| 图标按钮 | `type="text"` | 退出、显示/隐藏 |
| 链接按钮 | `<Link className="ant-btn">` | 导航链接 |
| 默认按钮 | default | 次要操作 |

## 重要：Next.js App Router 导航

**问题**：antd Button 的 `href` 属性会触发浏览器完整刷新，破坏 SPA 体验。

**正确做法**：
1. **导航链接** - 使用 `<Link>` + antd button 样式类
   ```tsx
   <Link href="/auth/register" className="ant-btn ant-btn-primary">
     立即注册
   </Link>
   ```

2. **需要图标的导航** - 使用 `<Link>` + 内联 SVG
   ```tsx
   <Link href="/auth/login" className="ant-btn ant-btn-primary">
     <svg className="w-5 h-5 mr-2" />
     前往登录
   </Link>
   ```

3. **需要状态的导航** - 使用 `router.push()`
   ```tsx
   import { useRouter } from 'next/navigation'
   const router = useRouter()

   <Button type="primary" onClick={() => router.push('/dashboard/import')}>
     导入数据
   </Button>
   ```

## Component Mapping

### 1. ErrorBoundary 刷新按钮
```tsx
// Before
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
  刷新页面
</button>

// After
<Button type="primary" onClick={() => window.location.reload()}>
  刷新页面
</Button>
```

### 2. 退出按钮
```tsx
// Before
<button className="px-3 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
  退出
</button>

// After
<Button type="text" danger onClick={handleLogout}>
  退出
</Button>
```

### 3. 显示/隐藏数据按钮 (Icon Button)
```tsx
// Before
<button className="p-1.5 rounded-lg hover:bg-slate-100">
  <svg>...</svg>
</button>

// After
<Button type="text" icon={<EyeIcon />} />
```

### 4. 导入/提交按钮
```tsx
// Before
<button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
  确认导入
</button>

// After
<Button type="primary" icon={<CheckIcon />}>
  确认导入
</Button>
```

### 5. AI 分析按钮
```tsx
// Before
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
  🚀 开始分析
</button>

// After
<Button type="primary">
  🚀 开始分析
</Button>
```

### 6. 删除按钮
```tsx
// Before
<button className="text-red-500 hover:text-red-700 p-1 rounded">
  <TrashIcon />
</button>

// After
<Button type="text" danger icon={<TrashIcon />} />
```

### 7. Link 导航按钮 (Primary)
```tsx
// Before
<Link href="/auth/register" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
  立即注册
</Link>

// After - 使用 <Link> + ant-btn 样式类
<Link href="/auth/register" className="ant-btn ant-btn-primary">
  立即注册
</Link>
```

### 8. Link 导航按钮 (Default)
```tsx
// Before
<Link href="/" className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg">
  返回
</Link>

// After - 使用 <Link> + ant-btn 样式类
<Link href="/" className="ant-btn">
  返回
</Link>
```

### 9. Link 导航按钮 (带图标)
```tsx
// After - 带图标的导航链接
<Link href="/auth/login" className="ant-btn ant-btn-primary">
  <svg className="w-5 h-5 mr-2" />
  前往登录
</Link>
```

### 10. Button 触发导航 (router.push)
```tsx
// After - 需要在 onClick 中使用 router.push
import { useRouter } from 'next/navigation'

<Button type="primary" onClick={() => router.push('/dashboard/import')}>
  导入数据
</Button>
```

## Icon Preservation
所有 SVG 图标需要提取为独立组件或直接作为 icon prop 传入：
```tsx
import { Button } from 'antd'

<Button type="primary" icon={<SvgIcon />} >
  按钮文字
</Button>
```

## File Changes
### Button 组件
1. `src/components/ErrorBoundary.tsx`
2. `src/app/dashboard/page.tsx`
3. `src/app/dashboard/import/page.tsx`
4. `src/app/dashboard/import/components/ImportTab.tsx`
5. `src/app/dashboard/import/components/ManualEntryTab.tsx`
6. `src/app/dashboard/detail/[code]/page.tsx`
7. `src/app/dashboard/detail/[code]/components/StockAnalysis.tsx`
8. `src/app/auth/login/page.tsx`
9. `src/app/auth/register/page.tsx`

### Link 按钮组件
10. `src/app/not-found.tsx`
11. `src/app/guide/page.tsx`
12. `src/app/about/page.tsx`
