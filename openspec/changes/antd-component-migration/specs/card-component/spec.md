# card-component

统一的持仓卡片组件，基于 antd Card 实现。

## ADDED Requirements

### Requirement: 卡片容器

系统 SHALL 使用 antd Card 组件展示单个持仓信息。

#### Scenario: 卡片基本结构
- **WHEN** 卡片组件渲染时
- **THEN** 系统 SHALL 显示包含股票名称、代码、盈亏金额的卡片

#### Scenario: 卡片悬停效果
- **WHEN** 用户鼠标悬停在卡片上
- **THEN** 系统 SHALL 显示阴影提升效果和轻微上移动画

### Requirement: 当前持仓卡片

系统 SHALL 展示当前持仓的详细信息。

#### Scenario: 显示当前持仓数据
- **WHEN** type='current' 且 showData=true
- **THEN** 系统 SHALL 显示：
  - 股票名称和代码
  - 浮动盈亏金额和收益率
  - 持仓成本
  - 当前价格
  - 持仓市值和股数
  - 当日盈亏

#### Scenario: 隐藏敏感数据
- **WHEN** type='current' 且 showData=false
- **THEN** 系统 SHALL 将股数显示为 "**"，市值显示为 "****"

### Requirement: 已清仓卡片

系统 SHALL 展示已清仓交易的详细信息。

#### Scenario: 显示已清仓数据
- **WHEN** type='cleared' 且 showData=true
- **THEN** 系统 SHALL 显示：
  - 股票名称和代码
  - 清仓时间
  - 盈亏金额和收益率
  - 买入详情（均价 × 数量 = 合计）
  - 卖出详情（均价 × 数量 = 合计）

#### Scenario: 已清仓隐藏数据
- **WHEN** type='cleared' 且 showData=false
- **THEN** 系统 SHALL 将买卖数量显示为 "**"

### Requirement: 盈亏颜色语义

系统 SHALL 使用颜色区分盈亏状态。

#### Scenario: 盈利状态样式
- **WHEN** floating_pnl >= 0
- **THEN** 系统 SHALL：
  - 卡片边框使用红色系
  - 盈亏金额显示为红色
  - 盈亏率显示为红色

#### Scenario: 亏损状态样式
- **WHEN** floating_pnl < 0
- **THEN** 系统 SHALL：
  - 卡片边框使用绿色系
  - 盈亏金额显示为绿色
  - 盈亏率显示为绿色

### Requirement: 卡片链接

系统 SHALL 将卡片包装为链接，点击进入个股详情页。

#### Scenario: 点击卡片跳转
- **WHEN** 用户点击卡片任意位置
- **THEN** 系统 SHALL 导航到 /dashboard/detail/{stock_code}

#### Scenario: 悬停显示查看详情
- **WHEN** 用户鼠标悬停在卡片上
- **THEN** 系统 SHALL 在底部显示 "查看详情" 提示

### Requirement: 性能优化

系统 SHALL 使用 React.memo 避免不必要的重渲染。

#### Scenario: 相同数据不重渲染
- **WHEN** 父组件渲染但 position 数据未变化
- **THEN** 系统 SHALL 不重新渲染卡片组件

#### Scenario: 关键字段变化触发重渲染
- **WHEN** floating_pnl 或 current_price 变化
- **THEN** 系统 SHALL 重新渲染卡片
