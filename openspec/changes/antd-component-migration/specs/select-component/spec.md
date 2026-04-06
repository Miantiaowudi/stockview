# select-component

统一的排序选择器组件，基于 antd Select 实现。

## ADDED Requirements

### Requirement: 排序选项选择

系统 SHALL 使用 antd Select 组件展示排序选项。

#### Scenario: 显示排序选项
- **WHEN** Select 组件渲染时
- **THEN** 系统 SHALL 显示包含图标和文字的排序选项下拉列表

#### Scenario: 当前持仓排序选项
- **WHEN** type='current' 且 Select 渲染时
- **THEN** 系统 SHALL 提供以下选项：
  - 默认排序
  - 盈亏 ↑ 升序
  - 盈亏 ↓ 降序

#### Scenario: 已清仓排序选项
- **WHEN** type='cleared' 且 Select 渲染时
- **THEN** 系统 SHALL 提供以下选项：
  - 默认排序
  - 盈亏 ↑ 升序
  - 盈亏 ↓ 降序
  - 清仓时间 ↑ 早到晚
  - 清仓时间 ↓ 晚到早

#### Scenario: 选中状态显示
- **WHEN** 用户选择一个选项
- **THEN** 系统 SHALL 在下拉框中显示选中选项的图标和文字

### Requirement: 触发重渲染

系统 SHALL 在排序选项变更时触发父组件重渲染。

#### Scenario: 排序变更
- **WHEN** 用户选择不同的排序选项
- **THEN** 系统 SHALL 调用 onChange 回调并传递新的排序值
