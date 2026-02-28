'use client'

interface Trade {
  id: string
  stock_code: string
  direction: 'buy' | 'sell'
  price: number
  quantity: number
  commission: number
  trade_time: string
}

interface TradeTableProps {
  trades: Trade[]
}

export default function TradeTable({ trades }: TradeTableProps) {
  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
        <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
        成交明细
      </h2>
      {trades.length > 0 ? (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left">时间</th>
                <th className="px-4 py-3 text-left">方向</th>
                <th className="px-4 py-3 text-left">价格</th>
                <th className="px-4 py-3 text-left">数量</th>
                <th className="px-4 py-3 text-left">金额</th>
                <th className="px-4 py-3 text-left">手续费</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                    {new Date(trade.trade_time).toLocaleString('zh-CN')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${trade.direction === 'buy' ? 'badge-buy' : 'badge-sell'}`}>
                      {trade.direction === 'buy' ? '买入' : '卖出'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">¥{trade.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-600">{trade.quantity}</td>
                  <td className="px-4 py-3 font-medium">¥{(trade.price * trade.quantity).toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-500">¥{trade.commission.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-slate-500">暂无成交记录</p>
        </div>
      )}
    </div>
  )
}
