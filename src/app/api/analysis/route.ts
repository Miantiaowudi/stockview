import { NextRequest } from "next/server";
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { ChatAlibabaTongyi } from "@langchain/community/chat_models/alibaba_tongyi";

interface Trade {
  id: string;
  stock_code: string;
  direction: 'buy' | 'sell';
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

// 阿里云 DashScope API 配置
const API_KEY = "sk-5b892077cc4540b1be1d616c92405c98";

// --- 1. 定义状态 ---
const AgentState = Annotation.Root({
  ticker: Annotation<string>(),
  klineData: Annotation<any[]>(),
  trades: Annotation<Trade[]>(),
  data: Annotation<any>(),
  analysis: Annotation<string>(),
  recommendation: Annotation<string>(),
  messages: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

// --- 2. 节点定义（直接使用前端传入的数据）---
const fetchNode = async (state: typeof AgentState.State) => {
  const { ticker, klineData: frontendKlineData, trades: frontendTrades } = state;
  
  const klineData = frontendKlineData || [];
  const trades = frontendTrades || [];
  
  // 计算用户持仓信息
  const buyTrades = trades.filter((t: Trade) => t.direction === 'buy');
  const sellTrades = trades.filter((t: Trade) => t.direction === 'sell');
  const totalBuyQty = buyTrades.reduce((sum: number, t: Trade) => sum + t.quantity, 0);
  const totalSellQty = sellTrades.reduce((sum: number, t: Trade) => sum + t.quantity, 0);
  const holdQuantity = totalBuyQty - totalSellQty;
  
  const totalBuy = buyTrades.reduce((sum: number, t: Trade) => sum + t.price * t.quantity, 0);
  const totalSell = sellTrades.reduce((sum: number, t: Trade) => sum + t.price * t.quantity, 0);
  const totalCommission = trades.reduce((sum: number, t: Trade) => sum + t.commission, 0);
  
  const latestKline = klineData && klineData.length > 0 ? klineData[klineData.length - 1] : null;
  const currentPrice = latestKline?.close || 0;
  const prevPrice = klineData && klineData.length > 1 ? klineData[klineData.length - 2]?.close : currentPrice;
  const changePct = prevPrice > 0 ? ((currentPrice - prevPrice) / prevPrice * 100) : 0;
  
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
      profit_loss: holdQuantity > 0 ? (currentPrice * holdQuantity) - (totalBuy - totalSell + totalCommission) : (totalSell - totalBuy - totalCommission)
    },
    trades: trades.map((t: Trade) => ({
      time: t.trade_time,
      direction: t.direction,
      price: t.price,
      quantity: t.quantity,
      commission: t.commission
    })),
    recent_kline: klineData?.slice(-20) || []
  };
  
  return {
    messages: ["✓ 正在整合数据...", "✓ 数据整合完成"],
    data: stockData,
    klineData
  };
};

const analyzeNode = async (state: typeof AgentState.State) => {
  const llm = new ChatAlibabaTongyi({
    alibabaApiKey: API_KEY,
    model: "qwen-plus", // qwen3.5-27b
    temperature: 0.2,
  });
  
  const prompt = `你是一位专业的股票分析师。请根据以下用户的实际交易数据和技术K线数据，进行深度分析：

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

请分析：
1. 当前股价走势和技术形态
2. 用户的盈亏情况和持仓成本
`;

  const res = await llm.invoke(prompt);
  return {
    analysis: typeof res.content === 'string' ? res.content : JSON.stringify(res.content),
    messages: ["✓ AI 分析完成"]
  };
};

const recommendNode = async (state: typeof AgentState.State) => {
  const llm = new ChatAlibabaTongyi({
    alibabaApiKey: API_KEY,
    model: "qwen-plus", // qwen3.5-27b
    temperature: 0.1,
  });
  
  const prompt = `基于以下分析结果，请给出具体的投资建议：

## 分析报告
${state.analysis}

请根据用户的实际持仓情况（持仓${state.data?.holdings?.hold_quantity || 0}股，成本¥${(state.data?.holdings?.avg_cost || 0).toFixed(2)}，当前盈亏¥${(state.data?.holdings?.profit_loss || 0).toFixed(2)}），给出：
1. 操作建议（买入/卖出/持有）
2. 是否有交易信号或风险提示
3. 具体的建议价格或价位区间
`;

  const res = await llm.invoke(prompt);
  return {
    recommendation: typeof res.content === 'string' ? res.content : JSON.stringify(res.content),
    messages: ["✓ 策略生成完毕"]
  };
};

// --- 3. 构建图 ---
const workflow = new StateGraph(AgentState)
  .addNode("fetch", fetchNode)
  .addNode("analyze", analyzeNode)
  .addNode("recommend", recommendNode)
  .addEdge(START, "fetch")
  .addEdge("fetch", "analyze")
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
            recommendation: "" 
          },
          { version: "v2" }
        );
  
        for await (const event of eventStream) {
          const eventType = event.event;
  
          // 监听fetch节点结束
          if (eventType === "on_chain_end" && event.name === "fetch") {
            send({ 
              node: "fetch", 
              messages: ["✓ 数据整合完成"],
              data: event.data.output.data 
            });
          }
  
          // 监听LLM流式输出
          if (eventType === "on_chat_model_stream") {
            const content = event.data.chunk?.content;
            if (content) {
              const nodeName = event.metadata?.langgraph_node;
              send({ 
                node: nodeName, 
                chunk: content,
                type: "token" 
              });
            }
          }
  
          // 监听节点完成
          if (eventType === "on_chain_end" && (event.name === "analyze" || event.name === "recommend")) {
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
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
}
