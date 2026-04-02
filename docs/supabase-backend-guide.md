# StockView 后端与 Supabase 入门说明（前端工程师版）

## 1. 先建立一套最小后端认知

你可以把一个 Web 应用后端拆成 4 层：

1. 数据层：数据库（这里是 PostgreSQL）。
2. 权限层：谁能读写哪些数据（Auth + RLS）。
3. 业务层：规则和流程（API Route、Edge Function、SQL Function）。
4. 运行层：部署、监控、日志、备份。

对前端工程师来说，最关键的是这 3 件事：

1. 数据模型设计是否支持页面查询和统计。
2. 权限是否默认安全（尤其是“每个用户只能看到自己的数据”）。
3. 写入流程是否可回溯、可去重、可恢复。

---

## 2. PostgreSQL 你最该掌握的部分

### 2.1 常见表结构概念

1. 主键：每行唯一标识（通常用 `uuid`）。
2. 外键：约束表间关系（如 `normalized_trades.broker_data_id -> broker_data.id`）。
3. 索引：加速查询（例如 `user_id + trade_time` 复合索引）。
4. 约束：保证数据质量（`NOT NULL`、`CHECK`、`UNIQUE`）。

### 2.2 交易类系统常见设计

1. 原始数据表：保存导入原始数据，便于审计和重放。
2. 规范化数据表：用于查询、统计和页面展示。
3. 软删除或归档：避免误删不可恢复。
4. 幂等写入：避免重复导入（唯一键或业务去重键）。

### 2.3 你这个项目里已经体现出的好实践

1. `broker_data` 保存了来源信息和原始片段。
2. `normalized_trades` 承载统一交易数据，适合后续统计。
3. 导入前做了去重逻辑，减少重复数据。

---

## 3. 后端服务常用方案（怎么选）

## 方案 A：传统后端（Node/Java/Go + 自建数据库）

适合：复杂领域模型、强流程编排、已有后端团队。

优点：

1. 灵活性最高。
2. 架构可完全定制。

缺点：

1. 开发和运维成本高。
2. 权限、鉴权、迁移都要自己搭。

## 方案 B：BaaS（Supabase/Firebase）

适合：前端主导、快速上线、CRUD+权限为主。

优点：

1. Auth、DB、Storage、实时能力开箱即用。
2. 前端可直接调用，迭代快。

缺点：

1. 高复杂业务后期可能要补自定义后端。
2. 需要团队掌握平台特性（如 RLS、策略调试）。

## 方案 C：Serverless API（Vercel Functions/Cloudflare Workers）

适合：事件型接口、突发流量、按调用计费。

优点：

1. 运维负担低。
2. 弹性扩缩容方便。

缺点：

1. 冷启动、连接池、执行时长限制要关注。
2. 跨函数的事务与调试复杂度更高。

## 方案 D：混合架构（推荐你当前项目继续走的方向）

1. 用户与核心数据：Supabase 承担。
2. 外部行情聚合：Next.js API Route 承担。
3. 复杂计算/AI：独立服务（你项目已有 LangGraph/FastAPI）。

这是前端主导项目最常见、也最稳妥的演进路径。

---

## 4. Supabase 详细介绍（重点）

Supabase 本质上是“托管 PostgreSQL + 一组围绕数据库的后端能力”。

### 4.1 核心组成

1. PostgreSQL：关系数据库本体。
2. Supabase Auth：邮箱密码/OAuth/会话管理。
3. PostgREST：把表和视图暴露为 REST 风格接口。
4. Realtime：数据库变更订阅。
5. Storage：对象存储（文件上传）。
6. Edge Functions：运行自定义服务端逻辑。

### 4.2 在前端里的调用方式

你项目当前是浏览器端创建客户端：

- 文件：`src/lib/supabase.ts`
- 使用 `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`

这表示：

1. 前端直接访问 Supabase。
2. 安全边界依赖 RLS，而不是“隐藏 key”。

### 4.3 为什么 `anon key` 可以放前端

`anon key` 不是管理员密钥。

它只是“公共访问入口”，真正的数据隔离靠：

1. 用户 JWT（登录态）。
2. RLS Policy（行级权限策略）。

所以要记住：

- `anon key` 泄露通常不是大问题。
- `service_role key` 绝对不能放前端，只能在可信服务端使用。

### 4.4 RLS（行级安全）是 Supabase 成败关键

典型策略是：

1. 仅允许登录用户访问。
2. 仅允许访问 `user_id = auth.uid()` 的记录。

示例思路（伪 SQL）：

```sql
-- select policy
using (auth.uid() = user_id)

-- insert policy
with check (auth.uid() = user_id)
```

如果没有 RLS，即使前端代码看起来没问题，也可能发生越权读写。

### 4.5 你项目建议尽快补齐的 Supabase 基础能力

1. 为 `normalized_trades`、`broker_data` 明确启用 RLS。
2. 为两张表加“按 user_id 隔离”的 select/insert/update/delete policy。
3. 加索引：
   - `normalized_trades(user_id, trade_time)`
   - `normalized_trades(user_id, stock_code)`
4. 加去重约束（替代纯前端去重）：
   - 可用唯一索引表达业务键（如 `user_id, stock_code, direction, price, quantity, trade_time::date`）。
5. 用 migration 管理 schema（避免手工改库漂移）。

### 4.6 前端常见协作模式

1. 简单 CRUD：前端直连 Supabase（你现在就在用）。
2. 聚合外部 API：走 Next API Route（你项目 `/api/stocks/*` 已经这样做）。
3. 高风险逻辑：放到服务器函数（Edge Function 或后端服务），前端只拿结果。

### 4.7 什么时候不建议“前端直连”

1. 涉及管理员权限或跨用户批处理。
2. 需要保护第三方私密凭据。
3. 需要复杂事务、工作流、队列消费。

这些场景建议走服务端（Next Route Handler / 独立后端）+ service role。

---

## 5. 回到 StockView：当前架构解读

## 你现在的架构

1. 用户认证：`supabase.auth`（登录、注册、会话）。
2. 用户交易数据：前端直接写 `normalized_trades` / `broker_data`。
3. 行情数据：Next API Route 代理第三方行情源（避免 CORS 和前端暴露细节）。

## 这个架构的优点

1. 上线快、代码路径短。
2. 前后端边界清晰：用户私有数据走 Supabase，公共行情走 API。
3. 易于继续扩展 AI 分析与异步任务。

## 当前主要风险点

1. 去重主要在前端做，存在并发/多端重复写入风险。
2. 若未严格配置 RLS，会有数据越权风险。
3. `any` 较多，类型安全没完全发挥。

---

## 6. 给前端工程师的 Supabase 实战清单

1. 建表时先想清楚主键/外键/索引/约束。
2. 每张业务表默认开启 RLS，再写策略。
3. 永远区分 `anon key` 和 `service_role key`。
4. 所有 schema 变更走 migration。
5. 前端只做“体验层校验”，一致性靠数据库约束兜底。
6. 查询慢先看索引和 SQL，再看前端渲染。
7. 关键写入动作保留原始数据，便于审计和回放。

---

## 7. 一条清晰的后续演进路线（建议）

1. 第一阶段（马上做）
   - 完成 RLS + policy + 索引 + 唯一约束。
2. 第二阶段（稳定性）
   - 接入 Supabase migration 与本地开发流程。
   - 补充关键 API/导入链路的错误监控。
3. 第三阶段（扩展性）
   - 把复杂对账、批量修复、AI 离线计算迁到服务端任务。

这样你可以继续保持“前端主导”，同时把数据安全和一致性补齐到生产级。

---

## 8. 你这段 SQL 在 Supabase SQL Editor 里实际做了什么

下面按“数据库结构 -> 权限 -> 实际效果”解读。

### 8.1 建了 3 张核心表

1. `profiles`
   - `id` 直接关联 `auth.users.id`，并且是主键。
   - `on delete cascade` 表示用户被删时，profile 自动删除。
   - 这是标准的“用户扩展信息表”设计。

2. `broker_data`
   - 存券商原始数据（`raw_data jsonb`）。
   - 每条记录绑定 `user_id`，也关联 `auth.users`。
   - `on delete cascade` 表示用户删除时原始数据一起清理。

3. `normalized_trades`
   - 存归一化后的交易记录，供查询和统计。
   - `direction` 通过 `check (direction in ('buy', 'sell'))` 限制值域。
   - `broker_data_id` 指向 `broker_data.id`，并且 `on delete set null`，避免删除原始数据时把交易记录级联删掉。

### 8.2 启用了 RLS（行级安全）

你对 3 张表都执行了：

1. `alter table ... enable row level security;`

这一步非常关键。启用后，访问是否允许由 policy 决定，不再是“只要拿到 key 就能查全表”。

### 8.3 创建了“按用户隔离”的基础策略

你当前加的是：

1. `profiles`：
   - `select`: 只能看自己的 profile（`auth.uid() = id`）
   - `insert`: 只能插入自己的 profile

2. `broker_data`：
   - `select`: 只能看自己的 `user_id`
   - `insert`: 只能写自己的 `user_id`

3. `normalized_trades`：
   - `select`: 只能看自己的 `user_id`
   - `insert`: 只能写自己的 `user_id`

### 8.4 最终权限效果（当前状态）

如果前端使用 `anon key + 用户登录态` 访问：

1. 用户 A 看不到用户 B 的 profile / 原始数据 / 交易数据。
2. 用户只能新增自己的数据，不能伪造 `user_id` 写别人数据。
3. 这是“前端直连 Supabase”能成立的核心前提。

### 8.5 这段 SQL 还没覆盖到的点（建议补齐）

1. 缺 `update/delete` policy
   - 目前只配了 `select/insert`，更新和删除会被默认拒绝（如果业务需要修改/删除会报权限错误）。

2. 缺索引
   - 建议至少加：
   - `normalized_trades(user_id, trade_time)`
   - `normalized_trades(user_id, stock_code)`
   - `broker_data(user_id, created_at)`

3. 缺幂等/去重约束
   - 现在主要靠前端去重，建议在库里加唯一索引兜底并发写入。

4. 缺自动建 profile 机制（可选）
   - 常见做法是给 `auth.users` 新用户注册加 trigger，自动插入 `profiles`。

### 8.6 一句话总结

你这段 SQL 已经完成了 Supabase 的“最小可用安全底座”：  
`用户表关系 + 交易数据模型 + RLS + 基础隔离策略`。  
下一步重点是：`补 update/delete 策略 + 索引 + 唯一约束`，把它从可用提升到生产稳态。
