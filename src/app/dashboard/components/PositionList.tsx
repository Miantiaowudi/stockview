'use client'

import { useState, useMemo } from 'react'
import { CurrentPosition, ClearedPosition } from '../page'
import PositionCard from './PositionCard'
import Select from './Select'

type Position = CurrentPosition | ClearedPosition

interface PositionListProps {
  positions: Position[]
  type: 'current' | 'cleared'
}

type FilterType = 'all' | 'profit' | 'loss'
type SortType = 'default' | 'pnl-asc' | 'pnl-desc' | 'time-asc' | 'time-desc'

export default function PositionList({ positions, type }: PositionListProps) {
  const isCurrent = type === 'current'
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [sort, setSort] = useState<SortType>('default')

  // Filter and sort logic
  const filteredPositions = useMemo(() => {
    let result = [...positions]

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(pos => 
        pos.stock_name.toLowerCase().includes(term) || 
        pos.stock_code.toLowerCase().includes(term)
      )
    }

    // Profit/Loss filter
    if (filter === 'profit') {
      result = result.filter(pos => isCurrent 
        ? ((pos as CurrentPosition).floating_pnl || 0) >= 0 
        : (pos as ClearedPosition).profit_loss >= 0
      )
    } else if (filter === 'loss') {
      result = result.filter(pos => isCurrent 
        ? ((pos as CurrentPosition).floating_pnl || 0) < 0 
        : (pos as ClearedPosition).profit_loss < 0
      )
    }

    // Sort
    if (isCurrent) {
      if (sort === 'pnl-asc') {
        result.sort((a, b) => ((a as CurrentPosition).floating_pnl || 0) - ((b as CurrentPosition).floating_pnl || 0))
      } else if (sort === 'pnl-desc') {
        result.sort((a, b) => ((b as CurrentPosition).floating_pnl || 0) - ((a as CurrentPosition).floating_pnl || 0))
      }
    } else {
      if (sort === 'pnl-asc') {
        result.sort((a, b) => (a as ClearedPosition).profit_loss - (b as ClearedPosition).profit_loss)
      } else if (sort === 'pnl-desc') {
        result.sort((a, b) => (b as ClearedPosition).profit_loss - (a as ClearedPosition).profit_loss)
      } else if (sort === 'time-asc') {
        result.sort((a, b) => new Date((a as ClearedPosition).cleared_time || 0).getTime() - new Date((b as ClearedPosition).cleared_time || 0).getTime())
      } else if (sort === 'time-desc') {
        result.sort((a, b) => new Date((b as ClearedPosition).cleared_time || 0).getTime() - new Date((a as ClearedPosition).cleared_time || 0).getTime())
      }
    }

    return result
  }, [positions, searchTerm, filter, sort, isCurrent])

  const title = isCurrent ? '当前持仓' : '已清仓'
  const emptyText = isCurrent ? '暂无持仓' : '暂无已清仓交易记录'
  const emptyHint = isCurrent ? '买入股票后，会显示在这里' : '买入并卖出相同数量的股票后，会显示在这里'

  const sortOptions = isCurrent 
    ? [
        { 
          value: 'default', 
          label: '默认排序',
          icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
        },
        { 
          value: 'pnl-asc', 
          label: '盈亏 ↑ 升序',
          icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
        },
        { 
          value: 'pnl-desc', 
          label: '盈亏 ↓ 降序',
          icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
        }
      ]
    : [
        { 
          value: 'default', 
          label: '默认排序',
          icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
        },
        { 
          value: 'pnl-asc', 
          label: '盈亏 ↑ 升序',
          icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
        },
        { 
          value: 'pnl-desc', 
          label: '盈亏 ↓ 降序',
          icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
        },
        { 
          value: 'time-asc', 
          label: '清仓时间 ↑ 早到晚',
          icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        },
        { 
          value: 'time-desc', 
          label: '清仓时间 ↓ 晚到早',
          icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        }
      ]

  return (
    <div className="card p-6">
      
      {/* Search/Filter/Sort Controls */}
      <div className="mb-6 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="搜索股票名称/代码..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 pl-11 text-sm border border-slate-200 rounded-xl bg-slate-50/50 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200"
          />
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        {/* Filter */}
        <div className="flex gap-1 p-1.5 bg-slate-100/80 backdrop-blur-sm rounded-xl border border-slate-200/50">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
              filter === 'all' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' 
                : 'text-slate-600 hover:text-slate-800 hover:bg-white/70'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              全部
            </span>
          </button>
          <button
            onClick={() => setFilter('profit')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
              filter === 'profit' 
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25' 
                : 'text-slate-600 hover:text-emerald-600 hover:bg-white/70'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              盈利
            </span>
          </button>
          <button
            onClick={() => setFilter('loss')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
              filter === 'loss' 
                ? 'bg-red-500 text-white shadow-md shadow-red-500/25' 
                : 'text-slate-600 hover:text-red-600 hover:bg-white/70'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
              亏损
            </span>
          </button>
        </div>
        
        {/* Sort */}
        <Select
          value={sort}
          onChange={(value) => setSort(value as SortType)}
          options={sortOptions}
        />
      </div>
      
      {/* Position Cards */}
      {filteredPositions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPositions.map((pos, i) => (
            <PositionCard key={i} position={pos} type={type} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-slate-500">{emptyText}</p>
          <p className="text-sm text-slate-400 mt-1">{emptyHint}</p>
        </div>
      )}
    </div>
  )
}
