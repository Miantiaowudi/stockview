// Database types based on REQUIREMENTS.md schema

export type User = {
  id: string
  email: string
  created_at: string
}

export type BrokerData = {
  id: string
  user_id: string
  broker_name: string
  raw_data: Record<string, unknown>
  created_at: string
}

export type NormalizedTrade = {
  id: string
  user_id: string
  stock_code: string
  direction: 'buy' | 'sell'
  price: number
  quantity: number
  commission: number
  trade_time: string
  broker_data_id: string
}
