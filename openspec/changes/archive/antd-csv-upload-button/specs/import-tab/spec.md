# ImportTab 组件规格说明

## 组件信息

- **文件路径**: `src/app/dashboard/import/components/ImportTab.tsx`
- **类型**: 客户端组件 (`'use client'`)
- **依赖**: Ant Design Button, Supabase 客户端

## 功能规格

### CSV 文件上传

- **触发方式**: 点击 Ant Design Button 组件
- **文件类型限制**: 仅接受 `.csv` 格式
- **编码处理**: 自动检测中文编码（GBK/UTF-8）
- **文件大小限制**: 未限制

### 数据预览

- **预览条数**: 显示前 5 条记录
- **预览字段**: 成交日期、成交时间、证券代码、证券名称、操作方向、数量、价格、金额、手续费、印花税

### 数据导入

- **去重策略**: 基于 (stock_code, direction, quantity, price, trade_time) 组合去重
- **存储表**: `normalized_trades`, `broker_data`
- **用户隔离**: 通过 `user_id` 字段隔离不同用户数据

## 接口规格

### Props

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user | any | 是 | 当前用户对象 |
| supabase | any | 是 | Supabase 客户端实例 |
| onImportComplete | `(message: string) => void` | 否 | 导入完成回调 |

### 事件

| 事件 | 触发条件 | 行为 |
|------|----------|------|
| onClick (Button) | 用户点击上传按钮 | 触发隐藏的文件输入框 |
| onChange (input) | 用户选择文件后 | 解析 CSV 并显示预览 |
| onClick (确认导入) | 用户点击确认导入 | 执行数据导入逻辑 |
