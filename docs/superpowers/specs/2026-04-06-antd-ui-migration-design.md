# antd UI 组件迁移设计

## Context

### 背景

StockView 项目已安装 antd v6，但 UI 组件仍使用自定义实现：
- `TradeTable` - 原生 `<table>` + CSS
- `PositionList` - 自定义搜索框/按钮组
- `Select` - 自定义下拉选择器

项目技术栈：Next.js 16, React 19, Ant Design 6, Tailwind CSS 4

### 约束

- 保持现有功能和数据结构不变
- 保持红涨绿跌的颜色语义（Tailwind 保留）
- 兼容现有的 `showData` 敏感数据隐藏逻辑
- 继续使用 Tailwind CSS 进行布局

## Goals

1. 使用 antd Table 替换 TradeTable，增加排序、筛选、分页
2. 使用 antd Input.Search + Segmented 替换 PositionList 的搜索/筛选控件
3. 使用 antd Select 替换自定义 Select 组件
4. 移除不再需要的自定义 CSS（.table, .badge 相关）
5. 验证所有功能正常工作

## Non-Goals

- PositionCard 暂不迁移（Phase 2）
- 不修改业务逻辑（盈亏计算、数据获取）
- 不修改 antd 主题配置

## Design

### TradeTable 迁移

**替换方案：**
- `antd Table` 替换原生 `<table>`
- `antd Tag` 替换 `.badge-buy` / `.badge-sell`

**Table columns 配置：**
```typescript
const columns: TableColumnsType<Trade> = [
  { title: '时间', dataIndex: 'trade_time', sorter: true, render: ... },
  { title: '方向', dataIndex: 'direction', filters: [...], render: (dir) => <Tag color={dir === 'buy' ? 'red' : 'green'}>...</Tag> },
  { title: '价格', dataIndex: 'price', sorter: true, render: ... },
  { title: '数量', dataIndex: 'quantity', sorter: true, render: ... },
  { title: '金额', key: 'amount', sorter: true, render: ... },  // 计算字段
  { title: '手续费', dataIndex: 'commission', render: ... },
]
```

**pagination 配置：**
```typescript
pagination={{ pageSize: 10, showSizeChanger: false }}
```

**保留样式：**
- 时间使用 `font-mono text-xs text-slate-600`
- 金额使用 `font-medium`

### PositionList 迁移

**替换方案：**
- `antd Input.Search` 替换自定义搜索框
- `antd Segmented` 替换自定义按钮组

**Input.Search 配置：**
```typescript
<Input.Search
  placeholder="搜索股票名称/代码..."
  allowClear
  className="flex-1 min-w-[200px]"
/>
```

**Segmented 配置：**
```typescript
<Segmented
  value={filter}
  onChange={(value) => setFilter(value as FilterType)}
  options={[
    { label: '全部', value: 'all' },
    { label: '盈利', value: 'profit' },
    { label: '亏损', value: 'loss' },
  ]}
/>
```

**保留逻辑：**
- useMemo 筛选/排序逻辑保持不变
- 空状态 UI 保持不变

### Select 迁移

**替换方案：**
- `antd Select` 替换自定义下拉组件

**Select 配置：**
```typescript
interface SortOption {
  value: string
  label: string
  icon?: ReactNode
}

// 使用 optionLabelProp 显示图标+文字
<Select
  value={sort}
  onChange={setSort}
  options={sortOptions.map(opt => ({ value: opt.value, label: opt.label }))}
  optionLabelProp="label"
  optionRender={(option) => {
    const opt = sortOptions.find(o => o.value === option.value)
    return (
      <span className="flex items-center gap-2">
        {opt?.icon}
        <span>{opt?.label}</span>
      </span>
    )
  }}
/>
```

**移除文件：**
- `src/app/dashboard/components/Select.tsx`

### 样式保留策略

| 样式类型 | 处理方式 |
|---------|---------|
| 红涨绿跌颜色 | Tailwind class 保留 (`text-red-600`, `text-green-600`) |
| 卡片渐变背景 | Tailwind class 保留 (`bg-gradient-to-br from-white to-red-50`) |
| 盈亏 Badge 颜色 | antd Tag color 属性 (`red`/`green`) |
| 组件间距/布局 | Tailwind class 保留 |
| antd 组件样式 | antd 默认样式 |

## Migration Plan

### Phase 1 (本次)

1. TradeTable 迁移
2. PositionList 迁移
3. Select 迁移
4. 清理冗余 CSS
5. 验证

### Phase 2 (后续)

- PositionCard 迁移

## Impact

### 修改文件

- `src/app/dashboard/detail/components/TradeTable.tsx`
- `src/app/dashboard/components/PositionList.tsx`
- `src/app/dashboard/components/Select.tsx` (删除)
- `src/app/globals.css` (清理冗余样式)

### CSS 清理

保留：
- `.card` (导入页使用)
- `.badge`, `.badge-buy`, `.badge-sell` (导入页使用)

可移除（如无其他使用）：
- `.table-container`
- `.table` 相关样式

## Verification

- [ ] TypeScript 编译无错误
- [ ] ESLint 无新增错误
- [ ] `npm run dev` 启动正常
- [ ] TradeTable 排序/筛选/分页正常
- [ ] PositionList 搜索/筛选正常
- [ ] Select 选择器正常
- [ ] 颜色语义（红涨绿跌）保持
- [ ] 响应式布局正常
