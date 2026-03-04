import { NextRequest } from "next/server";
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { ChatOllama } from "@langchain/ollama";

// --- 1. 定义状态 ---
const AgentState = Annotation.Root({
  ticker: Annotation<string>,
  data: Annotation<any>,
  analysis: Annotation<string>,
  recommendation: Annotation<string>,
  messages: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

// --- 2. 节点定义 (逻辑同前，确保返回完整状态增量) ---
const fetchNode = async (state: typeof AgentState.State) => {
  // 模拟耗时操作
  await new Promise(resolve => setTimeout(resolve, 500)); 
  return { 
    messages: ["✓ 正在获取行情数据..."],
    data: { name: "示例股票", price: 100, change_pct: 1.5, finance: { "ROE": "15%" } } 
  };
};

const analyzeNode = async (state: typeof AgentState.State) => {
  const llm = new ChatOllama({ model: "qwen2.5:14b", temperature: 0.2 });
  const res = await llm.invoke(`请简要分析股票数据：${JSON.stringify(state.data)}`);
  return { 
    analysis: res.content, 
    messages: ["✓ AI 分析完成"] 
  };
};

const recommendNode = async (state: typeof AgentState.State) => {
  const llm = new ChatOllama({ model: "qwen2.5:14b", temperature: 0.1 });
  const res = await llm.invoke(`基于分析给出建议：${state.analysis}`);
  return { 
    recommendation: res.content, 
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
    const { ticker } = await req.json();
    const encoder = new TextEncoder();
  
    const stream = new ReadableStream({
      async start(controller) {
        // 辅助函数：发送数据包
        const send = (data: any) => {
          controller.enqueue(encoder.encode(JSON.stringify(data) + "\n\n"));
        };
  
        try {
          // 使用 streamEvents 模式，它可以捕获节点内 LLM 的详细事件
          const eventStream = await app.streamEvents(
            { ticker, messages: [], data: {}, analysis: "", recommendation: "" },
            { version: "v2" } // 使用最新的事件 API
          );
  
          for await (const event of eventStream) {
            const eventType = event.event;
  
            // 1. 监听节点开始/结束（用于更新进度条/状态）
            if (eventType === "on_chain_end" && event.name === "fetch") {
              send({ node: "fetch", messages: ["✓ 数据获取完成"], data: event.data.output.data });
            }
  
            // 2. 关键：监听 LLM 的流式 Token (on_chat_model_stream)
            if (eventType === "on_chat_model_stream") {
              const content = event.data.chunk?.content;
              if (content) {
                // 我们根据当前运行的节点名称，推送不同的字段内容
                // 注意：metadata.langgraph_node 可以识别当前是哪个节点在说话
                const nodeName = event.metadata?.langgraph_node;
                send({ 
                  node: nodeName, 
                  chunk: content, // 发送单个字符
                  type: "token" 
                });
              }
            }
  
            // 3. 监听节点最终状态更新
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