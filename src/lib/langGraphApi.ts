// LangGraph SDK Client
import { Client } from "@langchain/langgraph-sdk"

const LANGGRAPH_API = process.env.NEXT_PUBLIC_LANGGRAPH_API || "http://127.0.0.1:2024"

const client = new Client({ apiUrl: LANGGRAPH_API })

export interface StockAnalysisResult {
  ticker: string
  data: {
    name?: string
    price?: number
    change_pct?: number
    [key: string]: any
  }
  analysis: string
  recommendation: string
  messages: string[]
}

export async function* streamStockAnalysis(ticker: string): AsyncGenerator<any> {
  // 搜索助手
  const assistants = await client.assistants.search()
  const assistantId = assistants[0]?.assistant_id

  if (!assistantId) {
    throw new Error("未找到股票分析助手")
  }

  // 创建线程
  const thread = await client.threads.create()

  // 流式执行
  const stream = client.runs.stream(
    thread.thread_id,
    assistantId,
    {
      input: {
        ticker: ticker,
        data: {},
        analysis: "",
        recommendation: "",
        messages: []
      }
    }
  )

  for await (const event of stream) {
    if (event.event === "values") {
      yield event.data
    }
  }
}
