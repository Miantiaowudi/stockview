# filter-controls

统一的筛选控件组件，基于 antd Segmented + Input.Search 实现。

## ADDED Requirements

### Requirement: 搜索功能

系统 SHALL 支持按股票名称或代码搜索。

#### Scenario: 按股票名称搜索
- **WHEN** 用户在搜索框输入股票名称
- **THEN** 系统 SHALL 实时过滤显示匹配的股票

#### Scenario: 按股票代码搜索
- **WHEN** 用户在搜索框输入股票代码
- **THEN** 系统 SHALL 实时过滤显示匹配的股票

#### Scenario: 清空搜索
- **WHEN** 用户清空搜索框
- **THEN** 系统 SHALL 显示所有股票

### Requirement: 盈亏筛选功能

系统 SHALL 支持按盈亏状态筛选（仅当前持仓）。

#### Scenario: 筛选盈利股票
- **WHEN** 用户点击 "盈利" 筛选按钮
- **THEN** 系统 SHALL 仅显示 floating_pnl >= 0 的持仓

#### Scenario: 筛选亏损股票
- **WHEN** 用户点击 "亏损" 筛选按钮
- **THEN** 系统 SHALL 仅显示 floating_pnl < 0 的持仓

#### Scenario: 显示全部股票
- **WHEN** 用户点击 "全部" 筛选按钮
- **THEN** 系统 SHALL 显示所有持仓

### Requirement: 排序功能

系统 SHALL 支持多种排序方式。

#### Scenario: 当前持仓按盈亏排序
- **WHEN** 当前持仓列表且用户选择盈亏排序
- **THEN** 系统 SHALL 按 floating_pnl 升序或降序排列

#### Scenario: 已清仓按盈亏排序
- **WHEN** 已清仓列表且用户选择盈亏排序
- **THEN** 系统 SHALL 按 profit_loss 升序或降序排列

#### Scenario: 已清仓按时间排序
- **WHEN** 已清仓列表且用户选择时间排序
- **THEN** 系统 SHALL 按 cleared_time 升序或降序排列

### Requirement: 筛选控件布局

系统 SHALL 在同一行展示搜索、筛选、排序控件。

#### Scenario: 控件水平排列
- **WHEN** 筛选控件区域渲染时
- **THEN** 系统 SHALL 使用 flex 布局使搜索框、筛选按钮、排序下拉水平排列

#### Scenario: 响应式换行
- **WHEN** 屏幕宽度不足时
- **THEN** 系统 SHALL 允许控件在窄屏下换行显示

### Requirement: 加载状态占位

系统 SHALL 在数据加载时显示骨架屏占位。

#### Scenario: 显示骨架屏
- **WHEN** loaded=false 且 type='current'
- **THEN** 系统 SHALL 显示 6 个卡片形状的骨架屏占位

#### Scenario: 隐藏骨架屏
- **WHEN** loaded=true
- **THEN** 系统 SHALL 移除骨架屏并显示真实数据
