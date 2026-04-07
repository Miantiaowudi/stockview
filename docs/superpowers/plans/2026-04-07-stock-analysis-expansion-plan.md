# 股票分析智能体功能拓展实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 扩展 LangGraph 股票分析智能体，新增技术指标、市场情绪、基本面三个并行分析维度

**Architecture:** 四个节点（holdings、indicators、sentiment、fundamentals）从 START 并行启动，汇聚到 analyze 节点综合分析，最后 recommend 生成建议。indicators 统一处理 klineData（计算指标 + 提取股价摘要），holdings 专注用户持仓聚合。

**Tech Stack:** LangGraph, DashScope LLM, Tushare API, technical-analysis npm 包

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `src/app/api/analysis/route.ts` | 主工作流：AgentState、新增节点（indicators/sentiment/fundamentals）、更新 prompt |
| `.env.local.example` | 添加 `TUSHARE_TOKEN` 示例 |

**改动范围：**
- `route.ts`：重命名 fetch→holdings，新增 indicators/sentiment/fundamentals 三个节点，扩展 AgentState，更新 analyze/recommend prompt
- `.env.local.example`：添加 TUSHARE_TOKEN

---

## Task 1: 安装依赖

**Files:**
- Modify: `package.json` (或直接运行命令)

- [ ] **Step 1: 安装 technical-analysis 包**

Run: `npm install technical-analysis`

Expected: 包安装成功，添加到 package.json dependencies

- [ ] **Step 2: 提交**

```bash
git add package.json package-lock.json
git commit -m "deps: 添加 technical-analysis 依赖"
```

---

## Task 2: 扩展 AgentState 类型

**Files:**
- Modify: `src/app/api/analysis/route.ts:27-55`

- [ ] **Step 1: 添加新的状态字段**

在 `AgentState` 的 `Annotation.Root` 中添加三个新字段：

```typescript
technicalIndicators: Annotation<TechnicalIndicators | null>(),
marketSentiment: Annotation<MarketSentiment | null>(),
fundamentals: Annotation<Fundamentals | null>(),
```

在文件开头添加新类型定义（在 `KLineItem` 接口后）：

```typescript
interface TechnicalIndicators {
  kdj: { k: number; d: number; j: number; signal: string };
  macd: { dif: number; dea: number; macd: number; signal: string };
  rsi: { rsi6: number; rsi12: number; rsi24: number; signal: string };
  boll: { upper: number; middle: number; lower: number; position: number; signal: string };
}

interface MarketSentiment {
  score: number;
  level: string;
  newsCount: number;
  keyNews: Array<{ title: string; sentiment: string; date: string }>;
}

interface Fundamentals {
  pe: number;
  pb: number;
  marketCap: number;
  revenue: number;
  netProfit: number;
  roe: number;
}
```

- [ ] **Step 2: 提交**

```bash
git add src/app/api/analysis/route.ts
git commit -m "feat(analysis): 扩展 AgentState 添加技术指标/情绪/基本面字段"
```

---

## Task 3: 实现 holdings 节点（原 fetch）

**Files:**
- Modify: `src/app/api/analysis/route.ts` (重命名 fetchNode → holdingsNode)

- [ ] **Step 1: 重命名 fetchNode 为 holdingsNode**

将函数名 `fetchNode` 改为 `holdingsNode`，逻辑保持不变（专注用户持仓聚合）。

```typescript
const holdingsNode = async (state: typeof AgentState.State) => {
  // 现有 fetchNode 逻辑不变
  // 计算用户持仓信息...
  return {
    messages: ["✓ 正在整合持仓数据...", "✓ 持仓数据整合完成"],
    data: stockData,
  };
};
```

- [ ] **Step 2: 更新 workflow 图中的节点名**

将 `.addNode("fetch", fetchNode)` 改为 `.addNode("holdings", holdingsNode)`

- [ ] **Step 3: 更新边连接**

将 `.edge(START, "fetch")` 改为 `.edge(START, "holdings")`

- [ ] **Step 4: 提交**

```bash
git add src/app/api/analysis/route.ts
git commit -m "refactor(analysis): 将 fetch 节点重命名为 holdings"
```

---

## Task 4: 实现 indicators 节点

**Files:**
- Modify: `src/app/api/analysis/route.ts`

**前置条件：** Task 1（安装 technical-analysis）、Task 2（类型定义）

- [ ] **Step 1: 添加 technical-analysis import**

```typescript
import ta from 'technical-analysis';
```

- [ ] **Step 2: 实现 indicatorsNode**

在 `holdingsNode` 后添加 `indicatorsNode`：

```typescript
const indicatorsNode = async (state: typeof AgentState.State) => {
  const klineData = state.klineData || [];
  
  if (klineData.length === 0) {
    return { technicalIndicators: null };
  }

  // 转换数据格式 for technical-analysis
  const closes = klineData.map((k: KLineItem) => k.close);
  const highs = klineData.map((k: KLineItem) => k.high);
  const lows = klineData.map((k: KLineItem) => k.low);

  // 计算 KDJ
  const kdj = ta.kdj({
    high: highs,
    low: lows,
    close: closes,
    period: 9,
    signalPeriod: 3
  });
  const k = kdj.kdj[0];
  const d = kdj.kdj[1];
  const j = kdj.kdj[2];
  const kdjSignal = k > 80 ? '卖出' : (k < 20 ? '买入' : '中性');

  // 计算 MACD
  const macd = ta.macd({
    close: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9
  });
  const dif = macd.macd[0];
  const dea = macd.macd[1];
  const macdHist = macd.macd[2];
  const macdSignal = macdHist > 0 ? '买入' : (macdHist < 0 ? '卖出' : '中性');

  // 计算 RSI
  const rsi6 = ta.rsi({ close: closes, period: 6 }).rsi[0];
  const rsi12 = ta.rsi({ close: closes, period: 12 }).rsi[0];
  const rsi24 = ta.rsi({ close: closes, period: 24 }).rsi[0];
  const rsiSignal = rsi6 > 70 ? '卖出' : (rsi6 < 30 ? '买入' : '中性');

  // 计算布林带
  const boll = ta.bollingerBands({
    close: closes,
    period: 20,
    stdDev: 2
  });
  const bollSignal = closes[closes.length - 1] > boll.bollingerBands[0] ? '卖出' : 
                     (closes[closes.length - 1] < boll.bollingerBands[2] ? '买入' : '中性');

  // 提取股价摘要
  const latestKline = klineData[klineData.length - 1];
  const currentPrice = latestKline?.close || 0;
  const prevPrice = klineData.length > 1 ? klineData[klineData.length - 2]?.close : currentPrice;
  const changePct = prevPrice > 0 ? ((currentPrice - prevPrice) / prevPrice * 100) : 0;

  return {
    technicalIndicators: {
      kdj: { k, d, j, signal: kdjSignal },
      macd: { dif, dea, macd: macdHist, signal: macdSignal },
      rsi: { rsi6, rsi12, rsi24, signal: rsiSignal },
      boll: { 
        upper: boll.bollingerBands[0], 
        middle: boll.bollingerBands[1], 
        lower: boll.bollingerBands[2], 
        position: (currentPrice - boll.bollingerBands[2]) / (boll.bollingerBands[0] - boll.bollingerBands[2]),
        signal: bollSignal 
      }
    },
    data: {
      name: state.ticker,
      price: currentPrice,
      change_pct: changePct,
      recent_kline: klineData.slice(-20)
    }
  };
};
```

- [ ] **Step 3: 添加节点到 workflow**

在 workflow 图中添加：
```typescript
.addNode("indicators", indicatorsNode)
```

添加边：
```typescript
.addEdge(START, "indicators")
```

- [ ] **Step 4: 提交**

```bash
git add src/app/api/analysis/route.ts
git commit -m "feat(analysis): 添加 indicators 节点计算 KDJ/MACD/RSI/布林带"
```

---

## Task 5: 实现 sentiment 节点

**Files:**
- Modify: `src/app/api/analysis/route.ts`

**前置条件：** Task 2（类型定义）

- [ ] **Step 1: 实现 sentimentNode**

在 `indicatorsNode` 后添加 `sentimentNode`：

```typescript
const sentimentNode = async (state: typeof AgentState.State) => {
  const { ticker } = state;
  
  try {
    // 调用东方财富新闻 API
    const response = await fetch(
      `https://np-anotice-stock.eastmoney.com/api/security/ann?cb=&sr=-1&page_size=10&page_index=1&ann_type=SHA%2CSZA&client_source=web&stock=${ticker}`
    );
    
    if (!response.ok) {
      return { marketSentiment: null };
    }
    
    const newsData = await response.json();
    const newsList = newsData?.data?.list || [];
    
    if (newsList.length === 0) {
      return { 
        marketSentiment: { 
          score: 0, 
          level: '中性', 
          newsCount: 0, 
          keyNews: [] 
        } 
      };
    }

    // 提取新闻标题
    const newsTitles = newsList
      .slice(0, 10)
      .map((n: any) => `- ${n.title} (${n.notice_date})`)
      .join('\n');

    // 调用 LLM 分析情绪
    const llm = new ChatAlibabaTongyi({
      alibabaApiKey: API_KEY,
      model: "qwen-plus",
      temperature: 0.1,
    });

    const sentimentPrompt = `请分析以下新闻标题，判断市场对该股票的情绪是正面、负面还是中性：

${newsTitles}

请返回：
1. 情绪得分（-100到100，正数为正面）
2. 情绪等级（积极/中性/消极）
3. 关键新闻列表（最多5条，每条包含标题和情绪判断）

请用JSON格式返回。`;

    const res = await llm.invoke(sentimentPrompt);
    const content = typeof res.content === 'string' ? res.content : JSON.stringify(res.content);
    
    // 尝试解析 JSON
    let sentimentData;
    try {
      sentimentData = JSON.parse(content);
    } catch {
      sentimentData = { score: 0, level: '中性', keyNews: [] };
    }

    return {
      marketSentiment: {
        score: sentimentData.score || 0,
        level: sentimentData.level || '中性',
        newsCount: newsList.length,
        keyNews: sentimentData.keyNews || []
      }
    };
  } catch (err) {
    console.error('Sentiment fetch error:', err);
    return { marketSentiment: null };
  }
};
```

- [ ] **Step 2: 添加节点到 workflow**

```typescript
.addNode("sentiment", sentimentNode)
.addEdge(START, "sentiment")
```

- [ ] **Step 3: 提交**

```bash
git add src/app/api/analysis/route.ts
git commit -m "feat(analysis): 添加 sentiment 节点获取新闻并分析市场情绪"
```

---

## Task 6: 实现 fundamentals 节点

**Files:**
- Modify: `src/app/api/analysis/route.ts`
- Modify: `.env.local.example`

**前置条件：** Task 2（类型定义）

- [ ] **Step 1: 添加 TUSHARE_TOKEN 环境变量示例**

Modify `.env.local.example`:
```
# Tushare 财务数据
TUSHARE_TOKEN=your_tushare_token
```

- [ ] **Step 2: 实现 fundamentalsNode**

```typescript
const fundamentalsNode = async (state: typeof AgentState.State) => {
  const { ticker } = state;
  const token = process.env.TUSHARE_TOKEN;
  
  if (!token) {
    console.warn('TUSHARE_TOKEN not configured');
    return { fundamentals: null };
  }

  try {
    // Tushare API 调用示例
    // 实际使用时需要根据 Tushare 文档调整接口
    const response = await fetch('https://api.tushare.pro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_name: 'daily_basic',
        token: token,
        params: { trade_date: new Date().toISOString().split('T')[0] },
        fields: 'pe,pb,total_market_cap,revenue,net_profit,roe'
      })
    });

    if (!response.ok) {
      return { fundamentals: null };
    }

    const data = await response.json();
    
    if (data.code !== 0 || !data.data?.items?.length) {
      return { fundamentals: null };
    }

    const fields = data.data.fields;
    const values = data.data.items[0];
    
    const fundamentals: Fundamentals = {
      pe: values[fields.indexOf('pe')] || 0,
      pb: values[fields.indexOf('pb')] || 0,
      marketCap: values[fields.indexOf('total_market_cap')] || 0,
      revenue: values[fields.indexOf('revenue')] || 0,
      netProfit: values[fields.indexOf('net_profit')] || 0,
      roe: values[fields.indexOf('roe')] || 0,
    };

    return { fundamentals };
  } catch (err) {
    console.error('Fundamentals fetch error:', err);
    return { fundamentals: null };
  }
};
```

- [ ] **Step 3: 添加节点到 workflow**

```typescript
.addNode("fundamentals", fundamentalsNode)
.addEdge(START, "fundamentals")
```

- [ ] **Step 4: 提交**

```bash
git add src/app/api/analysis/route.ts .env.local.example
git commit -m "feat(analysis): 添加 fundamentals 节点从 Tushare 获取财务数据"
```

---

## Task 7: 更新 analyze 节点 prompt

**Files:**
- Modify: `src/app/api/analysis/route.ts`

- [ ] **Step 1: 更新 analyzeNode prompt**

扩展 prompt，添加技术指标、市场情绪、基本面数据：

```typescript
const prompt = `你是一位专业的股票分析师。请根据以下多维度数据，进行深度综合分析：

## 用户持仓信息
- 当前持仓数量: ${state.data?.holdings?.hold_quantity || 0}股
- 买入总额: ¥${(state.data?.holdings?.total_buy || 0).toFixed(2)}
- 卖出总额: ¥${(state.data?.holdings?.total_sell || 0).toFixed(2)}
- 手续费总额: ¥${(state.data?.holdings?.total_commission || 0).toFixed(2)}
- 平均成本: ¥${(state.data?.holdings?.avg_cost || 0).toFixed(2)}
- 当前盈亏: ¥${(state.data?.holdings?.profit_loss || 0).toFixed(2)}

## 近期成交记录
${state.data?.trades?.slice(-10).map((t: any) => `- ${t.time?.split('T')[0]} | ${t.direction === 'buy' ? '买入' : '卖出'} | ¥${t.price} | ${t.quantity}股`).join('\n') || '暂无成交记录'}

## K线数据（最近20个交易日）
${state.data?.recent_kline?.map((k: any) => `${k.date?.split('T')[0]}: 开=${k.open} 高=${k.high} 低=${k.low} 收=${k.close}`).join('\n') || '暂无K线数据'}

## 技术指标分析
${state.technicalIndicators ? `
【KDJ指标】
- K值: ${state.technicalIndicators.kdj.k.toFixed(2)}
- D值: ${state.technicalIndicators.kdj.d.toFixed(2)}
- J值: ${state.technicalIndicators.kdj.j.toFixed(2)}
- 信号: ${state.technicalIndicators.kdj.signal}

【MACD指标】
- DIF: ${state.technicalIndicators.macd.dif.toFixed(4)}
- DEA: ${state.technicalIndicators.macd.dea.toFixed(4)}
- MACD柱: ${state.technicalIndicators.macd.macd.toFixed(4)}
- 信号: ${state.technicalIndicators.macd.signal}

【RSI指标】
- RSI6: ${state.technicalIndicators.rsi.rsi6.toFixed(2)}
- RSI12: ${state.technicalIndicators.rsi.rsi12.toFixed(2)}
- RSI24: ${state.technicalIndicators.rsi.rsi24.toFixed(2)}
- 信号: ${state.technicalIndicators.rsi.signal}

【布林带】
- 上轨: ${state.technicalIndicators.boll.upper.toFixed(2)}
- 中轨: ${state.technicalIndicators.boll.middle.toFixed(2)}
- 下轨: ${state.technicalIndicators.boll.lower.toFixed(2)}
- 当前价位: ${((state.technicalIndicators.boll.position || 0) * 100).toFixed(1)}% (在下轨与上轨之间)
- 信号: ${state.technicalIndicators.boll.signal}
` : '暂无技术指标数据'}

## 市场情绪
${state.marketSentiment ? `
- 情绪得分: ${state.marketSentiment.score}（-100~100）
- 情绪等级: ${state.marketSentiment.level}
- 相关新闻数量: ${state.marketSentiment.newsCount}
- 关键新闻:
${state.marketSentiment.keyNews.map((n: any) => `- ${n.title} [${n.sentiment}]`).join('\n') || '暂无关键新闻'}
` : '暂无市场情绪数据'}

## 基本面数据
${state.fundamentals ? `
- 市盈率(PE): ${state.fundamentals.pe.toFixed(2)}
- 市净率(PB): ${state.fundamentals.pb.toFixed(2)}
- 总市值: ¥${(state.fundamentals.marketCap / 100000000).toFixed(2)}亿
- 营收: ¥${(state.fundamentals.revenue / 100000000).toFixed(2)}亿
- 净利润: ¥${(state.fundamentals.netProfit / 100000000).toFixed(2)}亿
- 净资产收益率(ROE): ${state.fundamentals.roe.toFixed(2)}%
` : '暂无基本面数据'}

请综合以上所有维度，进行全面分析：
1. 当前股价走势和技术形态（结合 KDJ、MACD、RSI、布林带）
2. 用户的盈亏情况和持仓成本
3. 市场情绪对股价的影响
4. 基本面估值是否合理
`;
```

- [ ] **Step 2: 提交**

```bash
git add src/app/api/analysis/route.ts
git commit -m "feat(analysis): 更新 analyze prompt 整合技术指标/情绪/基本面数据"
```

---

## Task 8: 更新 recommend 节点 prompt

**Files:**
- Modify: `src/app/api/analysis/route.ts`

- [ ] **Step 1: 更新 recommendNode prompt**

扩展 prompt，添加技术指标信号和情绪/基本面信息：

```typescript
const prompt = `基于以下深度分析报告，请给出具体的投资建议：

## 分析报告
${state.analysis}

请根据以下信息，给出最终投资建议：
- 持仓情况：${state.data?.holdings?.hold_quantity || 0}股，成本¥${(state.data?.holdings?.avg_cost || 0).toFixed(2)}，当前盈亏¥${(state.data?.holdings?.profit_loss || 0).toFixed(2)}
- 技术指标信号：${state.technicalIndicators ? `KDJ(${state.technicalIndicators.kdj.signal}) MACD(${state.technicalIndicators.macd.signal}) RSI(${state.technicalIndicators.rsi.signal}) 布林带(${state.technicalIndicators.boll.signal})` : '暂无'}
- 市场情绪：${state.marketSentiment?.level || '暂无'}（得分${state.marketSentiment?.score || 0}）
- 估值水平：PE ${state.fundamentals?.pe?.toFixed(2) || 'N/A'}，PB ${state.fundamentals?.pb?.toFixed(2) || 'N/A'}

请给出：
1. 操作建议（买入/卖出/持有）
2. 目标价格区间
3. 风险提示
4. 持仓管理建议
`;
```

- [ ] **Step 2: 提交**

```bash
git add src/app/api/analysis/route.ts
git commit -m "feat(analysis): 更新 recommend prompt 整合技术指标信号"
```

---

## Task 9: 更新 SSE 流式输出

**Files:**
- Modify: `src/app/api/analysis/route.ts`

- [ ] **Step 1: 更新 POST handler 中的 streamEvents 监听**

在 `on_chain_end` 监听中添加 indicators、sentiment、fundamentals 节点的完成通知：

```typescript
// 监听 fetch/holdings 节点结束
if (eventType === "on_chain_end" && event.name === "holdings") {
  send({ 
    node: "holdings", 
    messages: ["✓ 持仓数据整合完成"],
    data: event.data.output.data 
  });
}

// 监听 indicators 节点结束
if (eventType === "on_chain_end" && event.name === "indicators") {
  send({ 
    node: "indicators", 
    messages: ["✓ 技术指标计算完成"],
    technicalIndicators: event.data.output.technicalIndicators
  });
}

// 监听 sentiment 节点结束
if (eventType === "on_chain_end" && event.name === "sentiment") {
  send({ 
    node: "sentiment", 
    messages: ["✓ 市场情绪分析完成"],
    marketSentiment: event.data.output.marketSentiment
  });
}

// 监听 fundamentals 节点结束
if (eventType === "on_chain_end" && event.name === "fundamentals") {
  send({ 
    node: "fundamentals", 
    messages: ["✓ 基本面数据获取完成"],
    fundamentals: event.data.output.fundamentals
  });
}
```

- [ ] **Step 2: 提交**

```bash
git add src/app/api/analysis/route.ts
git commit -m "feat(analysis): 更新 SSE 流式输出监听新节点"
```

---

## Task 10: 端到端测试

**Files:**
- Modify: `src/app/dashboard/detail/[code]/components/StockAnalysis.tsx`（如有需要更新）

- [ ] **Step 1: 启动开发服务器**

Run: `npm run dev`

Expected: 开发服务器启动成功

- [ ] **Step 2: 测试分析流程**

1. 打开个股详情页
2. 点击"开始分析"按钮
3. 观察 SSE 流式输出，确认四个节点依次完成
4. 检查分析报告和投资建议是否正确生成

Expected: 页面正常显示分析结果，无报错

- [ ] **Step 3: 测试错误处理**

1. 不配置 TUSHARE_TOKEN，测试 fundamentals 节点降级
2. 不传入 klineData，测试 indicators 节点降级

Expected: 节点失败时返回 null，不阻塞整体流程

- [ ] **Step 4: 提交测试修复**

```bash
git add src/app/dashboard/detail/[code]/components/StockAnalysis.tsx
git commit -m "fix(analysis): 适配新增节点的数据展示"
```

---

## 自检清单

- [ ] Task 1: technical-analysis 依赖已安装
- [ ] Task 2: AgentState 类型已扩展，字段名一致
- [ ] Task 3: holdings 节点正常工作
- [ ] Task 4: indicators 节点计算 KDJ/MACD/RSI/布林带
- [ ] Task 5: sentiment 节点获取新闻 + 情绪分析
- [ ] Task 6: fundamentals 节点从 Tushare 获取数据
- [ ] Task 7: analyze prompt 包含所有新数据
- [ ] Task 8: recommend prompt 包含技术指标信号
- [ ] Task 9: SSE 输出包含新节点数据
- [ ] Task 10: 端到端测试通过

---

**Plan complete.** 文件已保存到 `docs/superpowers/plans/2026-04-07-stock-analysis-expansion-plan.md`。

**两个执行选项：**

**1. Subagent-Driven (recommended)** - 每次dispatch一个子任务，完成后review，快速迭代

**2. Inline Execution** - 在当前session中批量执行任务，带检查点

选择哪个方式？