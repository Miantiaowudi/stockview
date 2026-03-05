# StockView 股票交易整合平台 - 项目经验文档

> 用于简历撰写的项目总结

---

## 项目概述

**项目名称**: StockView 股票交易整合平台  
**项目类型**: 全栈 Web 应用 (Vibe Coding)  
**开发周期**: 2026年2月 - 2026年3月 (持续迭代)  
**项目地址**: https://github.com/Miantiaowudi/stockview

### 一句话描述

解决 A 股投资者在多券商开户导致的数据分散问题，通过自动化手段整合各券商导出的 CSV 交易账单，生成统一的资产配置、收益曲线及个股复盘视图。

---

## 技术栈

### 核心技术
| 类别 | 技术 |
|------|------|
| 前端框架 | Next.js 16 (App Router) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS V4 |
| UI 组件库 | antd V6 |
| 图表 | ECharts + Lightweight Charts |

### 后端 & 数据
| 类别 | 技术 |
|------|------|
| API | Next.js API Routes |
| 数据库 | Supabase (PostgreSQL) |
| 认证 | Supabase Auth |
| AI 能力 | LangGraph + Ollama (qwen2.5:14b) |

### 其他
- 股票数据源: 东方财富 API
- Markdown 渲染: react-markdown + remarkGfm + rehypeKatex

---

## 核心功能

### 1. 用户认证系统
- 邮箱/密码注册登录
- Supabase Auth 会话管理
- 路由保护 (Middleware)

### 2. 数据导入模块
- **CSV 文件导入**: 拖拽上传、自动识别编码 (GBK/UTF-8)、数据去重、预览确认
- **手动录入**: 股票搜索 (东方财富 API + 无限滚动)、弹窗表单、批量提交

### 3. 账户分析看板
- **总体概览**: 总买入/卖出金额、手续费、清仓盈亏、当日盈亏
- **当前持仓**: 成本/现价/市值/浮动盈亏/当日盈亏，支持搜索/筛选/排序
- **已清仓个股**: 买卖均价/盈亏金额及比例，支持搜索/筛选/排序

### 4. 个股复盘
- **K线图**: 东方财富实时数据，支持 MA5/10/20/60 均线、缩放滚动
- **交易标记**: B(买入)/S(卖出)/T(当日买卖) 多笔交易显示
- **Tooltip**: 行情数据 + 均线 + 买卖明细

### 5. AI 智能分析
- 本地 LangGraph 智能体服务 (Ollama qwen2.5:14b)
- K线数据 + 成交明细分析
- 流式输出实时显示
- Markdown 格式渲染 (数学公式支持)

---

## 路由结构

```
/                       # 首页 (登录引导)
/auth/login             # 登录页 (含 mock 账户快速体验)
/auth/register          # 注册页
/dashboard              # 账户分析首页
  └── /detail/[code]    # 个股详情页 (K线 + AI分析)
```

---

## 数据库设计

### normalized_trades (统一交易记录表)
```sql
- id: UUID (主键)
- user_id: UUID (关联用户)
- stock_code: string (股票代码)
- direction: string (buy/sell)
- price: decimal (成交价格)
- quantity: integer (成交数量)
- commission: decimal (手续费)
- trade_time: timestamp (交易时间)
- created_at: timestamp
```

### broker_data (券商原始数据)
```sql
- id: UUID
- user_id: UUID
- broker_name: string
- raw_data: jsonb
```

---

## 项目亮点

### 1. 完整的全栈开发经验
从 0 到 1 构建了一个完整的前后端分离应用，包括数据库设计、API 开发、用户认证、数据可视化等功能。

### 2. AI 集成能力
实现了本地大语言模型 (LLM) 集成，使用 LangGraph 构建智能体工作流，处理流式输出并渲染 Markdown 格式结果。

### 3. 数据处理能力
- CSV 文件解析 (多编码支持)
- 数据去重逻辑
- 股票数据获取 (第三方 API 集成)

### 4. 前端工程化
- TypeScript 类型安全
- Tailwind CSS 响应式设计
- 组件化开发 (antd + 自定义)
- 代码规范 (ESLint)

### 5. Vibe Coding 实践
- 快速迭代开发
- 用户反馈驱动优化
- 持续集成部署 (GitHub Actions Ready)

---

## 简历写法建议

### 项目标题 (2-3个)
```
StockView - 股票交易整合平台 | 全栈开发
```

### 项目描述 (1-2行)
```
独立开发了一个股票交易数据整合平台，支持多券商 CSV 账单导入、AI 智能分析、K线复盘等功能。
```

### 核心职责/技术要点 (3-5条)
- 使用 Next.js 16 + TypeScript + Tailwind CSS 构建全栈应用
- 基于 Supabase 实现用户认证和数据持久化
- 集成 ECharts 和 Lightweight Charts 实现 K线可视化
- 使用 LangGraph + Ollama 实现本地 AI 智能分析功能
- 接入东方财富 API 获取实时股票数据

### 成果/数据 (可选)
- 实现了完整的用户认证流程
- 支持 CSV 批量导入和手动录入两种数据方式
- AI 分析支持流式输出和 Markdown 渲染
- 响应式设计，适配多端设备

---

## 关键词 (用于简历搜索)

```
Next.js, TypeScript, Tailwind CSS, antd, Supabase, PostgreSQL,
ECharts, LangGraph, Ollama, AI, LLM, 股票, 数据可视化,
全栈开发, 前端开发, 后端开发
```

---

*文档更新时间: 2026-03-05*
