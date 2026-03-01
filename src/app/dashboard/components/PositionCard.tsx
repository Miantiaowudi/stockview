'use client'

import Link from 'next/link'
import { CurrentPosition, ClearedPosition } from '../page'

type Position = CurrentPosition | ClearedPosition

interface PositionCardProps {
  position: Position
  type: 'current' | 'cleared'
}

export default function PositionCard({ position, type }: PositionCardProps) {
  const isCurrent = type === 'current'
  const currentPos = position as CurrentPosition
  const clearedPos = position as ClearedPosition

  // Calculate values based on type
  const floatingPnl = isCurrent ? currentPos.floating_pnl : clearedPos.profit_loss
  const floatingPnlRate = isCurrent ? currentPos.floating_pnl_rate : clearedPos.profit_rate

  return (
    <Link 
      href={`/dashboard/detail/${position.stock_code}`}
      className={`group block p-5 rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
        (floatingPnl || 0) >= 0 
          ? 'border-red-200 bg-gradient-to-br from-white to-red-50 hover:border-red-400' 
          : 'border-green-200 bg-gradient-to-br from-white to-green-50 hover:border-green-400'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg text-slate-800 group-hover:text-blue-600 transition-colors">
            {position.stock_name}
          </h3>
          <p className="text-sm text-slate-500">{position.stock_code}</p>
          {!isCurrent && clearedPos.cleared_time && (
            <p className="text-xs text-slate-400 mt-1">
              清仓时间: {new Date(clearedPos.cleared_time).toLocaleDateString('zh-CN')}
            </p>
          )}
        </div>

        <div className="text-right">
          <p className={`text-xl font-bold ${(floatingPnl || 0) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            {(floatingPnl || 0) >= 0 ? '+' : ''}¥{(floatingPnl || 0).toFixed(2)}
          </p>
          <p className={`text-sm font-medium ${(floatingPnlRate || 0) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            {(floatingPnlRate || 0) >= 0 ? '+' : ''}{(floatingPnlRate || 0).toFixed(2)}%
          </p>
        </div>
      </div>
      
      {isCurrent ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-3 border-t border-slate-100">
          <div>
            <p className="text-xs text-slate-500 mb-1">持仓成本</p>
            <p className="font-semibold text-slate-700">¥{currentPos.avg_cost.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">当前价格</p>
            <p className="font-semibold text-slate-700">¥{currentPos.current_price?.toFixed(2) || '--'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">持仓市值（股数）</p>
            <p className="font-semibold text-slate-700">
              ¥{((currentPos.current_price || 0) * currentPos.hold_quantity).toFixed(2)} ({currentPos.hold_quantity})
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">当日盈亏</p>
            <p className={`font-semibold ${(currentPos.daily_pnl || 0) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {(currentPos.daily_pnl || 0) >= 0 ? '+' : ''}¥{(currentPos.daily_pnl || 0).toFixed(2)} ({(currentPos.daily_pnl_rate || 0) >= 0 ? '+' : ''}{(currentPos.daily_pnl_rate || 0).toFixed(2)}%)
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
          <div>
            <p className="text-xs text-slate-500 mb-1">买入</p>
            <p className="font-semibold text-slate-700">¥{clearedPos.buy_avg_price.toFixed(2)} × {clearedPos.buy_quantity}</p>
            <p className="text-xs text-slate-400">合计: ¥{clearedPos.buy_total.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">卖出</p>
            <p className="font-semibold text-slate-700">¥{clearedPos.sell_avg_price.toFixed(2)} × {clearedPos.sell_quantity}</p>
            <p className="text-xs text-slate-400">合计: ¥{clearedPos.sell_total.toFixed(2)}</p>
          </div>
        </div>
      )}
      
      <div className={`mt-3 flex items-center text-sm text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity ${isCurrent ? 'mt-2' : 'mt-3'}`}>
        <span>查看详情</span>
        <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}
