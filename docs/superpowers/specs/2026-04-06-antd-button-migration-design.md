# antd Button 组件迁移设计

## Context

### 背景

StockView 项目已安装 antd v6，部分 UI 组件使用自定义 `<button>` 实现。需要统一迁移到 antd Button 组件，以获得：
- 一致的按钮样式和行为
- 内置 loading 状态支持
- 内置 disabled 状态支持
- 更好的可访问性

### 约束

- 保持现有功能不变
- 保持 Tailwind CSS 进行布局
- 导航链接保持 `<Link>` 不变
- Tab 切换暂不迁移

## Goals

1. 将所有操作按钮迁移到 antd Button
2. 保持 loading、disabled 等交互状态
3. 保持图标和文字显示
4. 验证所有功能正常

## Non-Goals

- 不迁移导航链接（关于、指南等）
- 不迁移 Tab 切换按钮
- 不迁移 PositionList 内部筛选按钮

## Design

### 迁移清单

| 页面 | 按钮 | antd 替换 | 样式 |
|------|------|----------|------|
| 登录页 | 登录按钮 | `Button type="primary" loading` | 主操作 |
| 登录页 | 立即体验 mock 账户 | `Button type="link"` | 链接样式 |
| 注册页 | 注册按钮 | `Button type="primary" loading` | 主操作 |
| Dashboard | 退出按钮 | `Button danger` | 危险操作 |
| Dashboard | 显示/隐藏数据 | `Button` | 图标按钮 |
| 导入页 | 添加按钮 | `Button` | 次要按钮 |
| 导入页 | 删除行按钮 | `Button danger type="text"` | 危险操作-文字 |
| 导入页 | 点击上传 | `Button` | 次要按钮 |
| 导入页 | 确认导入 | `Button type="primary" loading` | 主操作 |
| 手动录入 | 提交按钮 | `Button type="primary" loading` | 主操作 |
| AI 分析 | 🚀 开始分析 | `Button type="primary" loading` | 主操作 |
| AI 分析 | 🔄 重试 | `Button type="primary"` | 主操作 |
| AI 分析 | 🔄 重新分析 | `Button` | 次要按钮 |
| AI 分析 | 滚动到底部 | `Button` | 浮动样式 |

### antd Button 使用方式

```typescript
import { Button } from 'antd'

// 主按钮带 loading
<Button type="primary" loading={loading} icon={<RocketIcon />}>
  开始分析
</Button>

// 链接按钮
<Button type="link">立即体验 mock 账户</Button>

// 危险按钮
<Button danger onClick={handleLogout}>退出</Button>

// 文字危险按钮（删除）
<Button danger type="text" onClick={() => removeRow(key)}>
  删除
</Button>

// 带图标的按钮
<Button icon={<EyeIcon />} onClick={toggleShowData}>
  {showData ? '隐藏数据' : '显示数据'}
</Button>

// 浮动定位按钮
<div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-10">
  <Button icon={<ArrowDownIcon />}>滚动到底部</Button>
</div>
```

### 样式保留策略

| 样式类型 | 处理方式 |
|---------|---------|
| 主按钮颜色 | antd 默认 primary 蓝色 |
| 危险操作 | `danger` 属性 |
| 图标 | 保留 emoji 或 SVG |
| loading 状态 | antd `loading` 属性 |
| disabled 状态 | antd 内置支持 |
| 浮动定位 | Tailwind 定位样式保留 |
| 图标按钮 | `icon` prop 或 children |

## Migration Plan

### 修改文件

1. `src/app/auth/login/page.tsx` - 登录按钮、mock 账户按钮
2. `src/app/auth/register/page.tsx` - 注册按钮
3. `src/app/dashboard/page.tsx` - 退出按钮、显示/隐藏数据按钮
4. `src/app/dashboard/import/page.tsx` - 退出按钮
5. `src/app/dashboard/import/components/ImportTab.tsx` - 添加按钮、确认导入按钮
6. `src/app/dashboard/import/components/ManualEntryTab.tsx` - 添加按钮、删除按钮、提交按钮
7. `src/app/dashboard/detail/[code]/components/StockAnalysis.tsx` - 开始分析、重试、重新分析、滚动到底部

### 不修改

- 导航链接（保持 `<Link>`）
- Tab 切换按钮
- PositionList 内部筛选按钮

## Verification

- [ ] TypeScript 编译无错误
- [ ] ESLint 无新增错误
- [ ] 登录按钮 loading 正常
- [ ] 注册按钮 loading 正常
- [ ] mock 账户填充正常
- [ ] 登出功能正常
- [ ] 显示/隐藏数据正常
- [ ] 添加行功能正常
- [ ] 删除行功能正常
- [ ] 点击上传按钮正常
- [ ] 导入 loading 正常
- [ ] 手动录入提交 loading 正常
- [ ] AI 分析开始/重试/重新分析正常
- [ ] 滚动到底部按钮正常
