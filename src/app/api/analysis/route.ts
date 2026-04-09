import { NextRequest } from "next/server";
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { ChatAlibabaTongyi } from "@langchain/community/chat_models/alibaba_tongyi";
import {
  StochasticOscillator,
  MACD,
  RSI,
  BollingerBands,
  EMA,
} from "trading-signals";

interface Trade {
  id: string;
  stock_code: string;
  direction: "buy" | "sell";
  price: number;
  quantity: number;
  commission: number;
  trade_time: string;
}

interface KLineItem {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
}

interface TechnicalIndicators {
  kdj: { k: number; d: number; j: number; signal: string };
  macd: { dif: number; dea: number; macd: number; signal: string };
  rsi: { rsi6: number; rsi12: number; rsi24: number; signal: string };
  boll: {
    upper: number;
    middle: number;
    lower: number;
    position: number;
    signal: string;
  };
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

// 阿里云 DashScope API 配置
const API_KEY = process.env.DASHSCOPE_API_KEY || "";

// --- 1. 定义状态 ---
const AgentState = Annotation.Root({
  ticker: Annotation<string>(),
  klineData: Annotation<any[]>(),
  trades: Annotation<Trade[]>(),
  data: Annotation<any>(),
  analysis: Annotation<string>(),
  recommendation: Annotation<string>(),
  technicalIndicators: Annotation<TechnicalIndicators | null>(),
  marketSentiment: Annotation<MarketSentiment | null>(),
  fundamentals: Annotation<Fundamentals | null>(),
  messages: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

// --- 2. 节点定义（并行执行）---

// holdingsNode - 专注用户持仓聚合
const holdingsNode = async (state: typeof AgentState.State) => {
  const {
    ticker,
    klineData: frontendKlineData,
    trades: frontendTrades,
  } = state;

  const klineData = frontendKlineData || [];
  const trades = frontendTrades || [];

  // 计算用户持仓信息
  const buyTrades = trades.filter((t: Trade) => t.direction === "buy");
  const sellTrades = trades.filter((t: Trade) => t.direction === "sell");
  const totalBuyQty = buyTrades.reduce(
    (sum: number, t: Trade) => sum + t.quantity,
    0,
  );
  const totalSellQty = sellTrades.reduce(
    (sum: number, t: Trade) => sum + t.quantity,
    0,
  );
  const holdQuantity = totalBuyQty - totalSellQty;

  const totalBuy = buyTrades.reduce(
    (sum: number, t: Trade) => sum + t.price * t.quantity,
    0,
  );
  const totalSell = sellTrades.reduce(
    (sum: number, t: Trade) => sum + t.price * t.quantity,
    0,
  );
  const totalCommission = trades.reduce(
    (sum: number, t: Trade) => sum + t.commission,
    0,
  );

  const latestKline =
    klineData && klineData.length > 0 ? klineData[klineData.length - 1] : null;
  const currentPrice = latestKline?.close || 0;
  const prevPrice =
    klineData && klineData.length > 1
      ? klineData[klineData.length - 2]?.close
      : currentPrice;
  const changePct =
    prevPrice > 0 ? ((currentPrice - prevPrice) / prevPrice) * 100 : 0;

  const stockData = {
    name: ticker,
    price: currentPrice,
    change_pct: changePct,
    kline_count: klineData?.length || 0,
    holdings: {
      hold_quantity: holdQuantity,
      total_buy: totalBuy,
      total_sell: totalSell,
      total_commission: totalCommission,
      avg_cost: holdQuantity > 0 ? (totalBuy - totalSell) / holdQuantity : 0,
      profit_loss:
        holdQuantity > 0
          ? currentPrice * holdQuantity -
            (totalBuy - totalSell + totalCommission)
          : totalSell - totalBuy - totalCommission,
    },
    trades: trades.map((t: Trade) => ({
      time: t.trade_time,
      direction: t.direction,
      price: t.price,
      quantity: t.quantity,
      commission: t.commission,
    })),
    recent_kline: klineData?.slice(-20) || [],
  };

  return {
    messages: ["✓ 正在整合持仓数据...", "✓ 持仓数据整合完成"],
    data: stockData,
    klineData,
  };
};

// indicatorsNode - 计算技术指标 + 提取股价摘要
const indicatorsNode = async (state: typeof AgentState.State) => {
  const klineData = state.klineData || [];

  if (klineData.length === 0) {
    return { technicalIndicators: null };
  }

  // 初始化指标
  const stochastic = new StochasticOscillator(9, 3, 3);
  const macd = new MACD(new EMA(12), new EMA(26), new EMA(9));
  const rsi6 = new RSI(6);
  const rsi12 = new RSI(12);
  const rsi24 = new RSI(24);
  const boll = new BollingerBands(20, 2);

  // 逐个更新指标
  for (const k of klineData) {
    stochastic.update({ high: k.high, low: k.low, close: k.close }, false);
    macd.update(k.close, false);
    rsi6.update(k.close, false);
    rsi12.update(k.close, false);
    rsi24.update(k.close, false);
    boll.update(k.close, false);
  }

  // 获取结果
  const kdjResult = stochastic.getResultOrThrow();
  const macdResult = macd.getResultOrThrow();
  const rsi6Val = rsi6.getResultOrThrow();
  const rsi12Val = rsi12.getResultOrThrow();
  const rsi24Val = rsi24.getResultOrThrow();
  const bollResult = boll.getResultOrThrow();

  // J = 3K - 2D (KDJ 公式)
  const k = kdjResult.stochK;
  const d = kdjResult.stochD;
  const j = 3 * k - 2 * d;
  const kdjSignal = k > 80 ? "卖出" : k < 20 ? "买入" : "中性";

  const macdHist = macdResult.histogram;
  const macdSignal = macdHist > 0 ? "买入" : macdHist < 0 ? "卖出" : "中性";

  const rsiSignal = rsi6Val > 70 ? "卖出" : rsi6Val < 30 ? "买入" : "中性";

  const currentPrice = klineData[klineData.length - 1]?.close || 0;
  const bollSignal =
    currentPrice > bollResult.upper
      ? "卖出"
      : currentPrice < bollResult.lower
        ? "买入"
        : "中性";

  // 提取股价摘要
  const latestKline = klineData[klineData.length - 1];
  const prevPrice =
    klineData.length > 1
      ? klineData[klineData.length - 2]?.close
      : currentPrice;
  const changePct =
    prevPrice > 0 ? ((currentPrice - prevPrice) / prevPrice) * 100 : 0;

  return {
    technicalIndicators: {
      kdj: { k, d, j, signal: kdjSignal },
      macd: {
        dif: macdResult.macd,
        dea: macdResult.signal,
        macd: macdHist,
        signal: macdSignal,
      },
      rsi: {
        rsi6: rsi6Val,
        rsi12: rsi12Val,
        rsi24: rsi24Val,
        signal: rsiSignal,
      },
      boll: {
        upper: bollResult.upper,
        middle: bollResult.middle,
        lower: bollResult.lower,
        position:
          (currentPrice - bollResult.lower) /
          (bollResult.upper - bollResult.lower),
        signal: bollSignal,
      },
    },
  };
};

// sentimentNode - 获取新闻并分析市场情绪
const sentimentNode = async (state: typeof AgentState.State) => {
  const { ticker } = state;

  try {
    // 调用东方财富新闻 API
    const response = await fetch(
      `https://np-anotice-stock.eastmoney.com/api/security/ann?cb=&sr=-1&page_size=10&page_index=1&ann_type=SHA%2CSZA&client_source=web&stock=${ticker}`,
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
          level: "中性",
          newsCount: 0,
          keyNews: [],
        },
      };
    }

    // 提取新闻标题
    const newsTitles = newsList
      .slice(0, 10)
      .map((n: any) => `- ${n.title} (${n.notice_date})`)
      .join("\n");

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
    const content =
      typeof res.content === "string"
        ? res.content
        : JSON.stringify(res.content);

    // 尝试解析 JSON
    let sentimentData;
    try {
      sentimentData = JSON.parse(content);
    } catch {
      sentimentData = { score: 0, level: "中性", keyNews: [] };
    }

    return {
      marketSentiment: {
        score: sentimentData.score || 0,
        level: sentimentData.level || "中性",
        newsCount: newsList.length,
        keyNews: sentimentData.keyNews || [],
      },
    };
  } catch (err) {
    console.error("Sentiment fetch error:", err);
    return { marketSentiment: null };
  }
};

// fundamentalsNode - 从 Tushare 获取财务数据
const fundamentalsNode = async (state: typeof AgentState.State) => {
  const { ticker } = state;
  const token = process.env.TUSHARE_TOKEN;

  if (!token) {
    console.warn("TUSHARE_TOKEN not configured");
    return { fundamentals: null };
  }

  try {
    // Tushare API 调用示例
    // 实际使用时需要根据 Tushare 文档调整接口
    const response = await fetch("http://sszhixia.cn:8009/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_name: "daily_basic",
        token: token,
        params: { trade_date: new Date().toISOString().split("T")[0] },
        fields: "pe,pb,total_market_cap,revenue,net_profit,roe",
      }),
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
      pe: values[fields.indexOf("pe")] || 0,
      pb: values[fields.indexOf("pb")] || 0,
      marketCap: values[fields.indexOf("total_market_cap")] || 0,
      revenue: values[fields.indexOf("revenue")] || 0,
      netProfit: values[fields.indexOf("net_profit")] || 0,
      roe: values[fields.indexOf("roe")] || 0,
    };

    return { fundamentals };
  } catch (err) {
    console.error("Fundamentals fetch error:", err);
    return { fundamentals: null };
  }
};

const analyzeNode = async (state: typeof AgentState.State) => {
  const llm = new ChatAlibabaTongyi({
    alibabaApiKey: API_KEY,
    model: "qwen-plus", // qwen3.5-27b
    temperature: 0.2,
  });

  const prompt = `你是一位专业的股票分析师。请根据以下多维度数据，进行深度综合分析：

## 用户持仓信息
- 当前持仓数量: ${state.data?.holdings?.hold_quantity || 0}股
- 买入总额: ¥${(state.data?.holdings?.total_buy || 0).toFixed(2)}
- 卖出总额: ¥${(state.data?.holdings?.total_sell || 0).toFixed(2)}
- 手续费总额: ¥${(state.data?.holdings?.total_commission || 0).toFixed(2)}
- 平均成本: ¥${(state.data?.holdings?.avg_cost || 0).toFixed(2)}
- 当前盈亏: ¥${(state.data?.holdings?.profit_loss || 0).toFixed(2)}

## 近期成交记录
${
  state.data?.trades
    ?.slice(-10)
    .map(
      (t: any) =>
        `- ${t.time?.split("T")[0]} | ${t.direction === "buy" ? "买入" : "卖出"} | ¥${t.price} | ${t.quantity}股`,
    )
    .join("\n") || "暂无成交记录"
}

## K线数据（最近20个交易日）
${state.data?.recent_kline?.map((k: any) => `${k.date?.split("T")[0]}: 开=${k.open} 高=${k.high} 低=${k.low} 收=${k.close}`).join("\n") || "暂无K线数据"}

## 技术指标分析
${
  state.technicalIndicators
    ? `
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
`
    : "暂无技术指标数据"
}

## 市场情绪
${
  state.marketSentiment
    ? `
- 情绪得分: ${state.marketSentiment.score}（-100~100）
- 情绪等级: ${state.marketSentiment.level}
- 相关新闻数量: ${state.marketSentiment.newsCount}
- 关键新闻:
${state.marketSentiment.keyNews.map((n: any) => `- ${n.title} [${n.sentiment}]`).join("\n") || "暂无关键新闻"}
`
    : "暂无市场情绪数据"
}

## 基本面数据
${
  state.fundamentals
    ? `
- 市盈率(PE): ${state.fundamentals.pe.toFixed(2)}
- 市净率(PB): ${state.fundamentals.pb.toFixed(2)}
- 总市值: ¥${(state.fundamentals.marketCap / 100000000).toFixed(2)}亿
- 营收: ¥${(state.fundamentals.revenue / 100000000).toFixed(2)}亿
- 净利润: ¥${(state.fundamentals.netProfit / 100000000).toFixed(2)}亿
- 净资产收益率(ROE): ${state.fundamentals.roe.toFixed(2)}%
`
    : "暂无基本面数据"
}

请综合以上所有维度，进行全面分析：
1. 当前股价走势和技术形态（结合 KDJ、MACD、RSI、布林带）
2. 用户的盈亏情况和持仓成本
3. 市场情绪对股价的影响
4. 基本面估值是否合理
`;

  const res = await llm.invoke(prompt);
  return {
    analysis:
      typeof res.content === "string"
        ? res.content
        : JSON.stringify(res.content),
    messages: ["✓ AI 分析完成"],
  };
};

const recommendNode = async (state: typeof AgentState.State) => {
  const llm = new ChatAlibabaTongyi({
    alibabaApiKey: API_KEY,
    model: "qwen-plus", // qwen3.5-27b
    temperature: 0.1,
  });

  const prompt = `基于以下深度分析报告，请给出具体的投资建议：

## 分析报告
${state.analysis}

请根据以下信息，给出最终投资建议：
- 持仓情况：${state.data?.holdings?.hold_quantity || 0}股，成本¥${(state.data?.holdings?.avg_cost || 0).toFixed(2)}，当前盈亏¥${(state.data?.holdings?.profit_loss || 0).toFixed(2)}
- 技术指标信号：${state.technicalIndicators ? `KDJ(${state.technicalIndicators.kdj.signal}) MACD(${state.technicalIndicators.macd.signal}) RSI(${state.technicalIndicators.rsi.signal}) 布林带(${state.technicalIndicators.boll.signal})` : "暂无"}
- 市场情绪：${state.marketSentiment?.level || "暂无"}（得分${state.marketSentiment?.score || 0}）
- 估值水平：PE ${state.fundamentals?.pe?.toFixed(2) || "N/A"}，PB ${state.fundamentals?.pb?.toFixed(2) || "N/A"}

请给出：
1. 操作建议（买入/卖出/持有）
2. 目标价格区间
3. 风险提示
4. 持仓管理建议
`;

  const res = await llm.invoke(prompt);
  return {
    recommendation:
      typeof res.content === "string"
        ? res.content
        : JSON.stringify(res.content),
    messages: ["✓ 策略生成完毕"],
  };
};

// --- 3. 构建图（四个节点并行执行，汇聚到 analyze）---
const workflow = new StateGraph(AgentState)
  .addNode("holdings", holdingsNode)
  .addNode("indicators", indicatorsNode)
  .addNode("sentiment", sentimentNode)
  .addNode("fundamentalData", fundamentalsNode)
  .addNode("analyze", analyzeNode)
  .addNode("recommend", recommendNode)
  // 四个节点从 START 并行启动
  .addEdge(START, "holdings")
  .addEdge(START, "indicators")
  .addEdge(START, "sentiment")
  .addEdge(START, "fundamentalData")
  // 四个节点汇聚到 analyze
  .addEdge("holdings", "analyze")
  .addEdge("indicators", "analyze")
  .addEdge("sentiment", "analyze")
  .addEdge("fundamentalData", "analyze")
  .addEdge("analyze", "recommend")
  .addEdge("recommend", END);

const app = workflow.compile();

// --- 4. 流式接口出口 ---
export async function POST(req: NextRequest) {
  const { ticker, klineData, trades } = await req.json();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        controller.enqueue(encoder.encode(JSON.stringify(data) + "\n\n"));
      };

      try {
        const eventStream = await app.streamEvents(
          {
            ticker,
            klineData: klineData || [],
            trades: trades || [],
            messages: [],
            data: {},
            analysis: "",
            recommendation: "",
            technicalIndicators: null,
            marketSentiment: null,
            fundamentals: null,
          },
          { version: "v2" },
        );

        for await (const event of eventStream) {
          const eventType = event.event;

          // 监听 holdings 节点结束
          if (eventType === "on_chain_end" && event.name === "holdings") {
            send({
              node: "holdings",
              messages: ["✓ 持仓数据整合完成"],
              data: event.data.output.data,
            });
          }

          // 监听 indicators 节点结束
          if (eventType === "on_chain_end" && event.name === "indicators") {
            send({
              node: "indicators",
              messages: ["✓ 技术指标计算完成"],
              technicalIndicators: event.data.output.technicalIndicators,
            });
          }

          // 监听 sentiment 节点结束
          if (eventType === "on_chain_end" && event.name === "sentiment") {
            send({
              node: "sentiment",
              messages: ["✓ 市场情绪分析完成"],
              marketSentiment: event.data.output.marketSentiment,
            });
          }

          // 监听 fundamentals 节点结束
          if (
            eventType === "on_chain_end" &&
            event.name === "fundamentalData"
          ) {
            send({
              node: "fundamentalData",
              messages: ["✓ 基本面数据获取完成"],
              fundamentals: event.data.output.fundamentals,
            });
          }

          // 监听 LLM 流式输出
          if (eventType === "on_chat_model_stream") {
            const content = event.data.chunk?.content;
            if (content) {
              const nodeName = event.metadata?.langgraph_node;
              send({
                node: nodeName,
                chunk: content,
                type: "token",
              });
            }
          }

          // 监听节点完成
          if (
            eventType === "on_chain_end" &&
            (event.name === "analyze" || event.name === "recommend")
          ) {
            send({ node: event.name, status: "completed" });
          }
        }
        controller.close();
      } catch (err) {
        console.error(err);
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
