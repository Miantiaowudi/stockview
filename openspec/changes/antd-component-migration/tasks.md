## 1. 准备阶段

- [ ] 1.1 检查 antd 安装状态和版本
- [ ] 1.2 确认需要修改的组件文件清单
- [ ] 1.3 创建组件备份或 git commit 基线

## 2. 迁移 TradeTable 组件

- [ ] 2.1 引入 antd Table 和 Tag 组件
- [ ] 2.2 将原生 table 结构替换为 antd Table
- [ ] 2.3 配置 Table columns 定义（时间、方向、价格、数量、金额、手续费）
- [ ] 2.4 配置 direction 列的 Tag 渲染（买入红色、卖出绿色）
- [ ] 2.5 启用 Table sorter 支持按时间、价格、数量排序
- [ ] 2.6 配置 Table filters 支持方向筛选
- [ ] 2.7 配置 Table pagination（默认每页 10 条）
- [ ] 2.8 迁移空状态展示
- [ ] 2.9 测试排序、筛选、分页功能

## 3. 迁移 PositionList 组件

- [ ] 3.1 引入 antd Input.Search 和 Segmented 组件
- [ ] 3.2 将自定义搜索框替换为 Input.Search
- [ ] 3.3 将自定义按钮组替换为 Segmented（全部/盈利/亏损）
- [ ] 3.4 配置 Input.Search 的 onSearch 回调
- [ ] 3.5 配置 Segmented 的 onChange 回调
- [ ] 3.6 调整 flex 布局保持响应式
- [ ] 3.7 测试搜索和筛选功能

## 4. 迁移 PositionCard 组件

- [ ] 4.1 引入 antd Card 组件
- [ ] 4.2 使用 Card 包装现有卡片内容
- [ ] 4.3 启用 Card hoverable 属性
- [ ] 4.4 移除外层自定义的 border/shadow 类
- [ ] 4.5 保留 Tailwind 类处理内部布局
- [ ] 4.6 保持 React.memo 优化逻辑
- [ ] 4.7 测试悬停效果和链接跳转

## 5. 迁移 Select 组件

- [ ] 5.1 引入 antd Select 和 @ant-design/icons
- [ ] 5.2 将自定义 Select 替换为 antd Select
- [ ] 5.3 配置 optionLabelProp 显示图标+文字
- [ ] 5.4 配置 onChange 回调
- [ ] 5.5 移除 src/app/dashboard/components/Select.tsx 文件
- [ ] 5.6 更新 PositionList 的 import 路径

## 6. 清理阶段

- [ ] 6.1 检查 globals.css 中的冗余表格/按钮样式
- [ ] 6.2 移除不再使用的自定义 CSS 类
- [ ] 6.3 验证所有组件导入路径正确
- [ ] 6.4 运行开发服务器测试
- [ ] 6.5 测试响应式布局（桌面/平板/手机）

## 7. 验收阶段

- [ ] 7.1 验证 TradeTable 排序功能正常
- [ ] 7.2 验证 TradeTable 筛选功能正常
- [ ] 7.3 验证 TradeTable 分页功能正常
- [ ] 7.4 验证 PositionList 搜索功能正常
- [ ] 7.5 验证 PositionList 盈亏筛选正常
- [ ] 7.6 验证 PositionCard 显示和跳转正常
- [ ] 7.7 验证 Select 排序选择正常
- [ ] 7.8 验证红涨绿跌颜色语义保持
- [ ] 7.9 验证敏感数据隐藏功能正常
