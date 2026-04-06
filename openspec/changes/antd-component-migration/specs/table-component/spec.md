# table-component

统一的成交记录表格组件，基于 antd Table 实现。

## ADDED Requirements

### Requirement: 成交明细表格展示

系统 SHALL 使用 antd Table 组件展示成交记录，替代现有的自定义 HTML table。

#### Scenario: 展示成交记录列表
- **WHEN** 组件接收到 trades 数据且数据不为空
- **THEN** 系统 SHALL 显示包含时间、方向、价格、数量、金额、手续费的表格

#### Scenario: 空数据状态展示
- **WHEN** trades 数组为空
- **THEN** 系统 SHALL 显示空状态提示 "暂无成交记录"

#### Scenario: 表格列定义
- **WHEN** 表格渲染时
- **THEN** 系统 SHALL 显示以下列：
  - 时间 (trade_time) - 格式: YYYY-MM-DD HH:mm:ss
  - 方向 (direction) - 显示为标签 "买入" 或 "卖出"
  - 价格 (price) - 格式: ¥XX.XX
  - 数量 (quantity) - 数字
  - 金额 (price * quantity) - 格式: ¥XX.XX
  - 手续费 (commission) - 格式: ¥XX.XX

### Requirement: 表格排序功能

系统 SHALL 支持按时间、价格、数量排序。

#### Scenario: 按时间降序排序
- **WHEN** 用户点击时间列表头
- **THEN** 系统 SHALL 按交易时间从新到旧排序

#### Scenario: 按价格排序
- **WHEN** 用户点击价格列表头
- **THEN** 系统 SHALL 切换价格升序/降序排序

#### Scenario: 按数量排序
- **WHEN** 用户点击数量列表头
- **THEN** 系统 SHALL 切换数量升序/降序排序

### Requirement: 方向筛选功能

系统 SHALL 支持按买入/卖出方向筛选记录。

#### Scenario: 筛选买入记录
- **WHEN** 用户选择 "买入" 筛选条件
- **THEN** 系统 SHALL 仅显示 direction='buy' 的记录

#### Scenario: 筛选卖出记录
- **WHEN** 用户选择 "卖出" 筛选条件
- **THEN** 系统 SHALL 仅显示 direction='sell' 的记录

#### Scenario: 显示全部记录
- **WHEN** 用户选择 "全部" 筛选条件
- **THEN** 系统 SHALL 显示所有记录

### Requirement: 表格分页功能

系统 SHALL 支持分页展示成交记录。

#### Scenario: 默认分页
- **WHEN** 成交记录超过 10 条
- **THEN** 系统 SHALL 每页显示 10 条记录

#### Scenario: 切换分页
- **WHEN** 用户点击下一页
- **THEN** 系统 SHALL 显示下一组记录

### Requirement: 方向标签样式

系统 SHALL 使用 antd Tag 组件展示方向，并保持颜色语义。

#### Scenario: 买入标签
- **WHEN** direction='buy'
- **THEN** 系统 SHALL 显示红色 Tag 文字 "买入"

#### Scenario: 卖出标签
- **WHEN** direction='sell'
- **THEN** 系统 SHALL 显示绿色 Tag 文字 "卖出"
