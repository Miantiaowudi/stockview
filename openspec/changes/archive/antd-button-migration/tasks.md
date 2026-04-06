# Tasks: antd-button-migration

## P1 Tasks - Button 组件

### Task 1: ErrorBoundary 刷新按钮
- **文件**: `src/components/ErrorBoundary.tsx`
- **变更**: `<button>` → `<Button type="primary">`
- **验证**: 页面出错时刷新按钮正常工作

### Task 2: Dashboard 退出按钮
- **文件**: `src/app/dashboard/page.tsx`
- **变更**: `<button className="...text-slate-500 hover:text-red-600...">` → `<Button type="text" danger>`
- **验证**: 退出登录功能正常

### Task 3: Dashboard 显示/隐藏数据按钮
- **文件**: `src/app/dashboard/page.tsx`
- **变更**: `<button><svg>...</svg></button>` → `<Button type="text" icon={...}>`
- **验证**: 点击切换显示/隐藏数据

### Task 4: Dashboard 导入数据按钮
- **文件**: `src/app/dashboard/page.tsx`
- **变更**: `<Link className="bg-blue-600...">` → `<Button type="primary" onClick={() => router.push('/dashboard/import')}>`
- **验证**: 导航到导入页面正常（无刷新）

### Task 5: Import 页面退出按钮
- **文件**: `src/app/dashboard/import/page.tsx`
- **变更**: 同 Task 2
- **验证**: 退出登录功能正常

### Task 6: ImportTab 确认导入按钮
- **文件**: `src/app/dashboard/import/components/ImportTab.tsx`
- **变更**: `<button className="bg-blue-600...">` → `<Button type="primary" loading={...}>`
- **验证**: 导入功能正常

### Task 7: ManualEntryTab 添加按钮
- **文件**: `src/app/dashboard/import/components/ManualEntryTab.tsx`
- **变更**: `<button className="bg-blue-600...">` → `<Button type="primary" icon={...}>`
- **验证**: 打开添加记录弹窗

### Task 8: ManualEntryTab 删除按钮
- **文件**: `src/app/dashboard/import/components/ManualEntryTab.tsx`
- **变更**: `<button className="text-red-500...">` → `<Button type="text" danger icon={...}>`
- **验证**: 删除记录功能正常

### Task 9: ManualEntryTab 提交按钮
- **文件**: `src/app/dashboard/import/components/ManualEntryTab.tsx`
- **变更**: 提交按钮迁移
- **验证**: 批量提交功能正常

### Task 10: ManualEntryTab Modal 确认按钮
- **文件**: `src/app/dashboard/import/components/ManualEntryTab.tsx`
- **变更**: Modal 内的确认按钮迁移
- **验证**: 添加单条记录功能正常

### Task 11: Detail 页面退出按钮
- **文件**: `src/app/dashboard/detail/[code]/page.tsx`
- **变更**: 同 Task 2
- **验证**: 退出登录功能正常

### Task 12: StockAnalysis AI 分析按钮
- **文件**: `src/app/dashboard/detail/[code]/components/StockAnalysis.tsx`
- **变更**: 开始分析、重试、重新分析、滚动到底部按钮迁移
- **验证**: AI 分析功能正常

### Task 13: Login 页面按钮
- **文件**: `src/app/auth/login/page.tsx`
- **变更**: 登录按钮和测试账号按钮迁移
- **验证**: 登录功能正常

### Task 14: Register 页面按钮
- **文件**: `src/app/auth/register/page.tsx`
- **变更**: 注册按钮使用 `<Button type="primary" htmlType="submit">`，前往登录链接使用 `<Link className="ant-btn ant-btn-primary">`
- **验证**: 注册功能正常，导航无刷新

## P1 Tasks - Link 按钮组件

### Task 15: not-found 页面按钮
- **文件**: `src/app/not-found.tsx`
- **变更**: `<Link className="px-6 py-3 bg-blue-600...">` → `<Link className="ant-btn ant-btn-primary">`
- **验证**: 导航功能正常（无刷新）

### Task 16: guide 页面按钮
- **文件**: `src/app/guide/page.tsx`
- **变更**: 返回、立即注册、登录链接使用 `<Link className="ant-btn">` 或 `<Link className="ant-btn ant-btn-primary">`
- **验证**: 导航功能正常（无刷新）

### Task 17: about 页面按钮
- **文件**: `src/app/about/page.tsx`
- **变更**: 返回链接使用 `<Link className="ant-btn">`
- **验证**: 导航功能正常（无刷新）

## P2 Tasks (可选)

### Task 18: 代码清理
- 移除不再使用的 button 相关 CSS class
- 确认 globals.css 中无冗余 button 样式
