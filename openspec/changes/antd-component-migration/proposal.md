## Why

当前项目使用自定义 HTML/CSS 实现表格 (TradeTable)、按钮组、搜索框等 UI 组件，存在以下问题：
1. **样式不一致** - 自定义样式难以保证与 Ant Design 视觉规范一致
2. **维护成本高** - 每个组件需要手动处理响应式、禁用状态、键盘可访问性等
3. **功能有限** - 自定义表格缺少排序、筛选、分页等内置功能
4. **已有部分 antd** - 项目已使用 antd 的 Modal、Form 等组件，但 UI 组件未统一

统一使用 Ant Design 组件库可以提升开发效率、保证视觉一致性、获得更好的可访问性支持。

## What Changes

### 组件迁移

| 组件 | 当前实现 | 迁移目标 | 优先级 |
|------|---------|---------|--------|
| TradeTable | 自定义 `<table>` | antd Table | P0 |
| PositionList | 自定义按钮组 + 搜索框 | antd Segmented + Input.Search | P0 |
| PositionCard | 自定义 Card 样式 | antd Card | P1 |
| Select | 自定义 Select | antd Select | P1 |

### 新增功能

- **表格排序** - 支持按时间、价格、数量排序
- **表格筛选** - 支持按方向（买入/卖出）筛选
- **分页支持** - 成交记录分页展示
- **搜索增强** - 支持实时搜索

### 样式统一

- 统一使用 antd 主题配置
- 移除自定义的 badge、button 等样式类
- 保持现有的颜色语义（红涨绿跌）

## Capabilities

### New Capabilities

- `table-component`: 统一的表格组件，支持排序、筛选、分页
- `filter-controls`: 统一的筛选控件，支持搜索、过滤、排序
- `card-component`: 统一的卡片组件，保持现有数据展示逻辑

### Modified Capabilities

- 无（现有功能保持不变，仅更换实现方式）

## Impact

### 受影响文件

**需要修改的组件:**
- `src/app/dashboard/components/PositionList.tsx` - 筛选/搜索/排序控件
- `src/app/dashboard/components/PositionCard.tsx` - 卡片样式
- `src/app/dashboard/components/Select.tsx` - 可移除，使用 antd Select
- `src/app/dashboard/detail/components/TradeTable.tsx` - 表格迁移

**需要安装的依赖:**
- 无需额外依赖，antd 已安装

**CSS/样式:**
- `src/styles/globals.css` - 移除不再使用的自定义表格/按钮样式
- 使用 antd ConfigProvider 进行主题配置
