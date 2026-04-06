## Context

### 背景

当前 StockView 项目使用自定义 HTML/CSS 实现 UI 组件，包括：
- `TradeTable.tsx` - 使用原生 `<table>` 元素
- `PositionList.tsx` - 使用自定义 `<button>` 和 `<input>` 实现筛选和搜索
- `PositionCard.tsx` - 使用自定义 div + CSS 实现卡片样式
- `Select.tsx` - 使用自定义下拉选择器

项目已部分使用 Ant Design (Modal、Form、DatePicker 等)，但 UI 组件未统一。

### 约束

- 保持现有功能和数据结构不变
- 保持红涨绿跌的颜色语义
- 兼容现有的 `showData` 敏感数据隐藏逻辑
- 继续使用 Tailwind CSS 进行布局

## Goals / Non-Goals

**Goals:**
- 使用 antd Table 替换自定义表格，增加排序、筛选、分页功能
- 使用 antd Segmented 替换自定义按钮组筛选
- 使用 antd Input.Search 替换自定义搜索框
- 使用 antd Card 优化 PositionCard 样式
- 使用 antd Select 统一排序选择器
- 移除不再需要的自定义组件代码

**Non-Goals:**
- 不改变现有数据结构或 API 接口
- 不修改业务逻辑（如盈亏计算、数据获取）
- 不添加 antd 以外的 UI 框架
- 不修改 antd 主题配置（保持默认或使用 ConfigProvider 微调）

## Decisions

### Decision 1: 使用 antd Table 替代原生 table

**选择:** 使用 `antd Table` 组件

**理由:**
- 内置排序、筛选、分页功能，无需手动实现
- 支持自定义列渲染，可保持现有的格式化逻辑
- 与 antd Design 视觉一致

**替代方案考虑:**
- React Table (tanstack-table): 功能强大但需要更多配置
- 自定义实现: 维护成本高，不推荐

### Decision 2: 使用 antd Segmented 替代自定义按钮组

**选择:** 使用 `antd Segmented` 组件

**理由:**
- 原生支持选中状态样式切换
- 支持响应式布局
- 与 antd 整体风格一致

**替代方案考虑:**
- antd Radio.Group: 样式较传统
- antd Button.Group: 需要手动管理选中状态

### Decision 3: 使用 antd Input.Search 替代自定义搜索框

**选择:** 使用 `antd Input.Search` 组件

**理由:**
- 内置搜索图标和清除按钮
- 支持 `onSearch` 回调
- 可使用 `enterButton` 属性添加搜索按钮

### Decision 4: 使用 antd Card 优化 PositionCard

**选择:** 使用 `antd Card` 组件，保持内部结构不变

**理由:**
- antd Card 提供外层容器样式（阴影、圆角、hover 效果）
- 内部数据展示逻辑保持不变
- 可使用 `hoverable` 属性启用悬停效果

**替代方案考虑:**
- 完全重写: 工作量大，风险高
- 仅使用 antd 变量覆盖: 需要更多 CSS 配置

### Decision 5: 使用 antd Select 替换自定义 Select

**选择:** 直接使用 `antd Select` 组件

**理由:**
- 功能完整：下拉、搜索、多选
- 性能优化：内置虚拟滚动
- 样式统一：与其他 antd 组件一致

### Decision 6: 保留 React.memo 优化

**选择:** 继续使用 React.memo 包装 PositionCard

**理由:**
- 避免频繁更新时的不必要的重渲染
- 与 antd Card 配合良好

## Risks / Trade-offs

| 风险 | 影响 |  Mitigation |
|------|------|-------------|
| antd 样式与 Tailwind 冲突 | 中 | 使用 antd 的 ConfigProvider，或通过 className 覆盖 |
| 自定义样式丢失 | 中 | 保留必要的 Tailwind 类，antd 仅用于组件外壳 |
| 性能下降（antd 体积） | 低 | 已安装 antd，主要问题是 tree-shaking，按需引入组件 |
| 现有样式被 antd 覆盖 | 中 | 使用 `prefixCls` 或选择器隔离样式 |

## Migration Plan

### Phase 1: 准备
1. 确保 antd 已正确安装
2. 检查现有组件的 antd 引入方式
3. 创建 `DesignSystemProvider` 包装组件（可选）

### Phase 2: 迁移 TradeTable
1. 引入 `Table`, `Tag` 组件
2. 将 `<table>` 结构替换为 `<Table>` 组件
3. 配置 `sorter` 和 `filters`
4. 添加 `pagination` 配置
5. 测试排序、筛选、分页功能

### Phase 3: 迁移 PositionList
1. 引入 `Input.Search`, `Segmented` 组件
2. 替换搜索框和筛选按钮组
3. 配置 `onSearch` 和 `onChange` 回调
4. 测试响应式布局

### Phase 4: 迁移 PositionCard
1. 引入 `Card` 组件
2. 用 `<Card>` 包装现有内容
3. 启用 `hoverable` 属性
4. 调整 Tailwind 类避免冲突

### Phase 5: 迁移 Select
1. 使用 antd `Select` 替换自定义组件
2. 配置 `optionLabelProp` 显示图标
3. 移除 `src/app/dashboard/components/Select.tsx`

### Phase 6: 清理
1. 移除不再使用的自定义 CSS 类
2. 检查 globals.css 中的冗余样式
3. 验证所有功能正常工作

### Rollback Strategy
- 使用 git 标签或分支管理各阶段迁移
- 每个 Phase 完成后进行测试
- 如有问题，通过 git revert 回滚

## Open Questions

1. **主题配置**: 是否需要通过 ConfigProvider 自定义 antd 主题色（目前使用默认蓝色）？
2. **SSR 兼容**: Next.js App Router 下 antd 组件是否需要额外配置（目前已知需要处理 CSS 导入）？
3. **图标方案**: 继续使用内联 SVG 还是替换为 @ant-design/icons？
4. **空状态**: antd Table 的空状态是否需要自定义，还是使用默认样式？
