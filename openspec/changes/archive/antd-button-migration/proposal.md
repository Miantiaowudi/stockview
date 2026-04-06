# Proposal: antd-button-migration

## Summary
逐步将项目中的原生 `<button>` 和带按钮样式的 `<Link>` 组件迁移为 Ant Design Button 组件，统一 UI 风格，提升用户体验。

## Motivation
1. 原生 button 样式分散，维护成本高
2. antd Button 提供统一的样式、状态管理和无障碍支持
3. 便于后续主题定制和组件库统一

## Scope

### 需要迁移的按钮 (Action Buttons)
| 文件 | 按钮 | 类型 | 优先级 |
|------|------|------|--------|
| `components/ErrorBoundary.tsx` | 刷新页面 | primary | P1 |
| `app/dashboard/page.tsx` | 退出 | text/danger | P1 |
| `app/dashboard/page.tsx` | 显示/隐藏数据 | text | P1 |
| `app/dashboard/page.tsx` | 导入数据 | primary | P1 |
| `app/dashboard/import/page.tsx` | 退出 | text/danger | P1 |
| `app/dashboard/import/components/ImportTab.tsx` | 确认导入 | primary | P1 |
| `app/dashboard/import/components/ManualEntryTab.tsx` | 添加一行 | primary | P1 |
| `app/dashboard/import/components/ManualEntryTab.tsx` | 删除记录 | text/danger | P1 |
| `app/dashboard/import/components/ManualEntryTab.tsx` | 确认提交 | primary | P1 |
| `app/dashboard/import/components/ManualEntryTab.tsx` | 确认添加 (Modal) | primary | P1 |
| `app/dashboard/detail/[code]/page.tsx` | 退出 | text/danger | P1 |
| `app/dashboard/detail/[code]/components/StockAnalysis.tsx` | 开始分析 | primary | P1 |
| `app/dashboard/detail/[code]/components/StockAnalysis.tsx` | 重试 | primary | P1 |
| `app/dashboard/detail/[code]/components/StockAnalysis.tsx` | 重新分析 | text | P1 |
| `app/dashboard/detail/[code]/components/StockAnalysis.tsx` | 滚动到底部 | primary | P1 |
| `app/auth/login/page.tsx` | 登录 | primary | P1 |
| `app/auth/login/page.tsx` | 填写测试账号 | link | P2 |
| `app/auth/register/page.tsx` | 注册 | primary | P1 |
| `app/auth/register/page.tsx` | 前往登录 | primary | P1 |

### 需要迁移的链接按钮 (Link as Button)
| 文件 | 按钮 | 类型 | 优先级 |
|------|------|------|--------|
| `app/not-found.tsx` | 返回首页 | primary | P1 |
| `app/not-found.tsx` | 查看使用指南 | default | P1 |
| `app/guide/page.tsx` | 返回 | default | P1 |
| `app/guide/page.tsx` | 立即注册 | primary | P1 |
| `app/guide/page.tsx` | 登录 | default | P1 |
| `app/about/page.tsx` | 返回 | default | P1 |

### 不迁移的元素 (Keep Native)
- Tab 切换按钮（当前持仓/已清仓、导入数据/手动录入）
- Filter 过滤按钮（全部/盈利/亏损）
- Select 下拉框内的按钮
- 文件上传标签（`<label htmlFor="file-upload">`）
- 导航文字链接（"关于"、"指南"等）

## Implementation Plan
1. 创建 antd-button-migration 变更
2. 按优先级逐步迁移每个按钮
3. 保持原有图标不变
4. 保持原有业务逻辑不变

## Success Criteria
- 所有 action button 均使用 antd Button
- 原有图标和业务逻辑保持不变
- 页面功能验证正常
