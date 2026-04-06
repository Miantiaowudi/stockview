# antd-button-migration

逐步将项目中的原生 `<button>` 和带按钮样式的 `<Link>` 组件迁移为 Ant Design Button 组件。

## Status
- [x] Proposal 创建
- [x] Design 创建
- [x] Tasks 创建
- [x] Implementation 完成
- [x] 验收通过

## 迁移范围
### 按钮组件
- `components/ErrorBoundary.tsx` - 刷新页面按钮
- `app/dashboard/page.tsx` - 退出按钮、显示/隐藏数据按钮、导入数据链接
- `app/dashboard/import/page.tsx` - 退出按钮
- `app/dashboard/import/components/ImportTab.tsx` - 确认导入按钮
- `app/dashboard/import/components/ManualEntryTab.tsx` - 添加按钮、删除按钮、提交按钮、确认添加按钮
- `app/dashboard/detail/[code]/page.tsx` - 退出按钮
- `app/dashboard/detail/[code]/components/StockAnalysis.tsx` - AI分析按钮、重试按钮、重新分析按钮、滚动到底部按钮
- `app/auth/login/page.tsx` - 登录按钮、mock账户按钮
- `app/auth/register/page.tsx` - 注册按钮、前往登录链接

### 页面链接按钮
- `not-found.tsx` - 返回首页、查看使用指南
- `guide/page.tsx` - 返回、立即注册、登录
- `about/page.tsx` - 返回

## 不迁移范围
- Tab 切换按钮（当前持仓/已清仓、导入数据/手动录入）
- Filter 过滤按钮（全部/盈利/亏损）
- Select 下拉框内按钮
- 文件上传标签（`<label htmlFor="file-upload">`）
- 导航链接（"关于"、"指南"等文字链接）
