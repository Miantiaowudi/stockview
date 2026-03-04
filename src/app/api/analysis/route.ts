import { NextRequest } from "next/server";
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { ChatOllama } from "@langchain/ollama";
import { createClient } from "@/lib/supabase";

interface Trade {
  id: string;
  stock_code: string;
  direction: 'buy' | 'sell';
  price: number;
  quantity: number;
  commission: number;
  trade_time: string;
}

// --- 1. 定义状态 ---
const AgentState = Annotation.Root({
  ticker: Annotation<string>,
  klineData: Annotation<any[]>,
  trades: Annotation<Trade[]>,
  data: Annotation<any>,
  analysis: Annotation<string>,
  recommendation: Annotation<string>,
  messages: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

// --- 2. 获取K线数据 ---
async function fetchKlineData(ticker: string): Promise<any[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/kline?code=${ticker}`);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('获取K线数据失败:', e);
    return [];
  }
}

// --- 3. 获取用户成交明细 ---
async function fetchUserTrades(supabase: any, userId: string, ticker: string): Promise<Trade[]> {
  try {
    const { data, error } = await supabase
      .from('normalized_trades')
      .select('*')
      .eq('user_id', userId)
      .eq('stock_code', ticker)
      .order('trade_time', { ascending: true });
    
    if (error) {
      console.error('获取成交明细失败:', error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error('获取成交明细失败:', e);
    return [];
  }
}

// --- 4. 节点定义 ---
const fetchNode = async (state: typeof AgentState.State) => {
  const { ticker } = state;
  
  // 并行获取K线数据和成交明细
  const [klineData, trades] = await Promise.all([
    fetchKlineData(ticker),
    state.trades || []  // 已经在主节点获取
  ]);
  
  // 计算用户持仓信息
  const buyTrades = trades.filter((t: Trade) => t.direction === 'buy');
  const sellTrades = trades.filter((t: Trade) => t.direction === 'sell');
  const totalBuyQty = buyTrades.reduce((sum: number, t: Trade) => sum + t.quantity, 0);
  const totalSellQty = sellTrades.reduce((sum: number, t: Trade) => sum + t.quantity, 0);
  const holdQuantity = totalBuyQty - totalSellQty;
  
  const totalBuy = buyTrades.reduce((sum: number, t: Trade) => sum + t.price * t.quantity, 0);
  const totalSell = sellTrades.reduce((sum: number, t: Trade) => sum + t.price * t.quantity, 0);
  const totalCommission = trades.reduce((sum: number, t: Trade) => sum + t.commission, 0);
  
  // 获取最新行情（从K线数据）
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
    recent_kline: klineData?.slice(-20) || []  // 最近20条K线数据
  };
  
  return {
    messages: ["✓ 正在获取行情数据...", "✓ 正在获取成交明细...", "✓ 数据整合完成"],
    data: stockData,
    klineData
  };
};

const analyzeNode = async (state: typeof AgentState.State) => {
  const llm = new ChatOllama({ model: "qwen2.5:14b", temperature: 0.2 });
  
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
${state.data?.recent_kline?.map((k: any) => `${k.time?.split('T')[0]}: 开=${k.open} 高=${k.high} 低=${k.low} 收=${k.close} 量=${k.volume || '-'}`).join('\n') || '暂无K线数据'}

请分析：
1. 当前股价走势和技术形态
2. 用户的盈亏情况和持仓成本
3. 是否有交易信号或风险提示
4. 给出详细的分析报告（用中文）

请用Markdown格式输出分析结果。`;

  const res = await llm.invoke(prompt);
  return {
    analysis: res.content,
    messages: ["✓ AI 分析完成"]
  };
};

const recommendNode = async (state: typeof AgentState.State) => {
  const llm = new ChatOllama({ model: "qwen2.5:14b", temperature: 0.1 });
  
  const prompt = `基于以下分析结果，请给出具体的投资建议：

## 分析报告
${state.analysis}

请根据用户的实际持仓情况（持仓${state.data?.holdings?.hold_quantity || 0}股，成本¥${(state.data?.holdings?.avg_cost || 0).toFixed(2)}，当前盈亏¥${(state.data?.holdings?.profit_loss || 0).toFixed(2)}），给出：
1. 操作建议（买入/卖出/持有）
2. 风险提示
3. 具体的建议价格或价位区间

请用简洁的Markdown格式输出建议。`;

  const res = await llm.invoke(prompt);
  return {
    recommendation: res.content,
    messages: ["✓ 策略生成完毕"]
  };
};

// --- 5. 构建图 ---
const workflow = new StateGraph(AgentState)
  .addNode("fetch", fetchNode)
  .addNode("analyze", analyzeNode)
  .addNode("recommend", recommendNode)
  .addEdge(START, "fetch")
  .addEdge("fetch", "analyze")
  .addEdge("analyze", "recommend")
  .addEdge("recommend", END);

const app = workflow.compile();

// --- 6. 流式接口出口 ---
export async function POST(req: NextRequest) {
  const { ticker } = await req.json();
  
  // 从Header获取Supabase token来验证用户
  const supabaseToken = req.headers.get('Authorization')?.replace('Bearer ', '');
  let userId: string | null = null;
  let trades: Trade[] = [];
  
  // 验证用户并获取成交明细
  if (supabaseToken) {
    try {
      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser(supabaseToken);
      
      if (user && !error) {
        userId = user.id;
        // 获取该用户的成交明细
        const { data: tradesData } = await supabase
          .from('normalized_trades')
          .select('*')
          .eq('user_id', userId)
          .eq('stock_code', ticker)
          .order('trade_time', { ascending: true });
        
        trades = tradesData || [];
      }
    } catch (e) {
      console.error('获取用户信息失败:', e);
    }
  }
  
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
            klineData: [],
            trades,
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
              messages: ["✓ 数据获取完成"],
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
