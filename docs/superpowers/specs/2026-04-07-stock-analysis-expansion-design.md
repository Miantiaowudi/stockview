# 股票分析智能体功能拓展设计

## 1. 目标

扩展现有 LangGraph 股票分析智能体，新增三个分析维度：
- **技术指标分析**：KDJ、MACD、RSI、布林带
- **市场情绪分析**：基于新闻数据 + LLM 情绪判断
- **基本面分析**：Tushare 财务数据

## 2. 架构

### 2.1 工作流结构

```
START → ┌─────────────────────────────────────────┐
        ↓           ↓           ↓           ↓
     fetch   indicators  sentiment fundamentals
     (并行)    (并行)      (并行)      (并行)
        ↓           ↓           ↓           ↓
        └───────────┴───────────┴───────────┘
                        ↓
                     analyze
                        ↓
                   recommend
                        ↓
                        END
```

- `fetch` 节点：整合前端传入的原始数据（K线、交易记录），与其他三节点并行执行
- `indicators` 节点：并行计算技术指标
- `sentiment` 节点：并行获取新闻 + 情绪分析
- `fundamentals` 节点：并行获取 Tushare 财务数据
- `analyze` 节点：综合所有数据进行分析
- `recommend` 节点：生成投资建议

### 2.2 状态定义

```typescript
const AgentState = Annotation.Root({
  ticker: Annotation<string>(),
  klineData: Annotation<KLineItem[]>(),
  trades: Annotation<Trade[]>(),
  // 现有字段
  data: Annotation<any>(),
  analysis: Annotation<string>(),
  recommendation: Annotation<string>(),
  messages: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  // 新增字段
  technicalIndicators: Annotation<TechnicalIndicators | null>(),
  marketSentiment: Annotation<MarketSentiment | null>(),
  fundamentals: Annotation<Fundamentals | null>(),
});

// 新增类型
interface TechnicalIndicators {
  kdj: { k: number; d: number; j: number; signal: '买入' | '卖出' | '中性' };
  macd: { dif: number; dea: number; macd: number; signal: '买入' | '卖出' | '中性' };
  rsi: { rsi6: number; rsi12: number; rsi24: number; signal: '买入' | '卖出' | '中性' };
  boll: { upper: number; middle: number; lower: number; position: number; signal: '买入' | '卖出' | '中性' };
}

interface MarketSentiment {
  score: number; // -100 ~ 100，正数为正面
  level: '积极' | '中性' | '消极';
  newsCount: number;
  keyNews: Array<{ title: string; sentiment: string; date: string }>;
}

interface Fundamentals {
  pe: number;       // 市盈率
  pb: number;       // 市净率
  marketCap: number; // 总市值
  revenue: number;   // 营收
  netProfit: number; // 净利润
  roe: number;       // 净资产收益率
}
```

## 3. 节点实现

### 3.1 fetch 节点（保持不变）

整合前端传入的原始数据，传递给后续并行节点。

### 3.2 indicators 节点

**输入**：ticker, klineData

**实现**：
- 使用 `technical-analysis` 库计算 KDJ、MACD、RSI、布林带
- 基于指标数值生成买卖信号（简单阈值判断）
- 增强 prompt 让 LLM 做技术形态综合判断

**依赖**：`technical-analysis` npm 包

### 3.3 sentiment 节点

**输入**：ticker

**实现**：
1. 调用新闻 API（东方财富/同花顺）获取近期新闻
2. 将新闻标题列表传给 LLM 做情绪分析
3. 返回情绪得分（-100~100）、情绪等级、关键新闻

**依赖**：新闻 API（待接入）、DashScope LLM

### 3.4 fundamentals 节点

**输入**：ticker

**实现**：
- 调用 Tushare API 获取财务数据
- 需要 Tushare token（从环境变量 `TUSHARE_TOKEN` 读取）
- 返回市盈率、市净率、总市值、营收、净利润、ROE 等

**依赖**：Tushare API token

### 3.5 analyze 节点（扩展）

**输入**：所有现有数据 + technicalIndicators + marketSentiment + fundamentals

**实现**：
- 扩展 prompt，包含技术指标数据、市场情绪、基本面数据
- 让 LLM 综合分析股价走势、技术形态、市场情绪、基本面

### 3.6 recommend 节点（保持不变）

根据 analyze 结果生成投资建议。

## 4. API 接入

### 4.1 Tushare 配置

```env
TUSHARE_TOKEN=your_tushare_token
```

Tushare 免费接口获取财务数据：
- `stock_basic`：股票基本信息
- `profit_statement`：利润表（净利润、营收）
- `balance_sheet`：资产负债表（净资产）
- `daily_basic`：每日指标（市盈率、市净率、总市值）

### 4.2 新闻 API

使用东方财富新闻接口（免费，无需 key）：
```
https://np-anotice-stock.eastmoney.com/api/security/ann?cb=&sr=-1&page_size=10&page_index=1&ann_type=SHA%2CSZA&client_source=web
```

或同花顺新闻接口，按股票代码查询相关新闻。

## 5. 环境变量

新增环境变量：

```env
# Tushare 财务数据
TUSHARE_TOKEN=your_tushare_token
```

## 6. 改动文件

| 文件 | 改动 |
|------|------|
| `src/app/api/analysis/route.ts` | 扩展 AgentState、添加三个新节点、修改 analyze prompt |
| `.env.local.example` | 添加 `TUSHARE_TOKEN` 示例 |

## 7. 依赖

```bash
npm install technical-analysis
# 或使用ta-lib bindings
npm install ta-lib
```

## 8. 错误处理

- 各并行节点独立错误处理，单节点失败不影响其他节点
- 节点失败时返回 null 或空对象，前端显示"数据获取失败"
- LLM 调用失败时返回友好错误信息

## 9. 待确认

- [ ] Tushare token 由用户提供
- [ ] 新闻 API 选择东方财富还是同花顺
- [ ] 技术指标库选择 `technical-analysis` 还是 `ta-lib`
