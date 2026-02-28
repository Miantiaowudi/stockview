'use client'

import ReactECharts from 'echarts-for-react'

interface KLineItem {
  date: string
  open: number
  close: number
  high: number
  low: number
}

interface Trade {
  direction: 'buy' | 'sell'
  price: number
  quantity: number
  trade_time: string
}

interface KLineChartProps {
  klineData: KLineItem[]
  trades: Trade[]
}

export default function KLineChart({ klineData, trades }: KLineChartProps) {
  // 计算移动平均线
  const calculateMA = (dayCount: number, data: KLineItem[]) => {
    const result: (number | null)[] = []
    for (let i = 0; i < data.length; i++) {
      if (i < dayCount - 1) {
        result.push(null)
        continue
      }
      let sum = 0
      for (let j = 0; j < dayCount; j++) {
        sum += data[i - j].close
      }
      result.push(Number((sum / dayCount).toFixed(2)))
    }
    return result
  }

  const getChartOption = () => {
    const initialStart = 90
    const initialEnd = 100
    
    // 按日期分组买卖点
    const tradeMap = new Map<number, { buys: any[], sells: any[] }>()
    
    trades.forEach(t => {
      const idx = klineData.findIndex(k => k.date.startsWith(t.trade_time.split('T')[0]))
      if (idx < 0) return
      
      if (!tradeMap.has(idx)) {
        tradeMap.set(idx, { buys: [], sells: [] })
      }
      const entry = tradeMap.get(idx)!
      if (t.direction === 'buy') {
        entry.buys.push({ price: t.price, quantity: t.quantity })
      } else {
        entry.sells.push({ price: t.price, quantity: t.quantity })
      }
    })
    
    // 生成交易标记
    const tradeMarkers: any[] = []
    tradeMap.forEach((tradesAtIdx, idx) => {
      const hasBuy = tradesAtIdx.buys.length > 0
      const hasSell = tradesAtIdx.sells.length > 0
      const price = klineData[idx].high * 1.02
      
      if (hasBuy && hasSell) {
        tradeMarkers.push({
          idx, price, type: 'T', trades: [...tradesAtIdx.buys.map((t: any) => ({...t, direction: '买入'})), ...tradesAtIdx.sells.map((t: any) => ({...t, direction: '卖出'}))]
        })
      } else if (hasBuy) {
        tradeMarkers.push({
          idx, price, type: 'B', trades: tradesAtIdx.buys.map((t: any) => ({...t, direction: '买入'}))
        })
      } else if (hasSell) {
        tradeMarkers.push({
          idx, price, type: 'S', trades: tradesAtIdx.sells.map((t: any) => ({...t, direction: '卖出'}))
        })
      }
    })
    
    const markersB = tradeMarkers.filter(m => m.type === 'B')
    const markersS = tradeMarkers.filter(m => m.type === 'S')
    const markersT = tradeMarkers.filter(m => m.type === 'T')
    
    return {
      grid: {
        left: '80',
        right: '80',
        top: '20',
        bottom: '80'
      },
      dataZoom: [
        {
          type: 'slider',
          show: true,
          xAxisIndex: 0,
          start: initialStart,
          end: initialEnd,
          height: 30,
          bottom: 25,
          borderRadius: 8,
          backgroundColor: '#f8fafc',
          fillerColor: 'rgba(59, 130, 246, 0.1)',
          handleStyle: {
            color: '#3b82f6'
          }
        },
      ],
      xAxis: {
        type: 'category',
        data: klineData.map(d => d.date),
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: {
          color: '#64748b',
          fontSize: 10,
          formatter: (value: string) => {
            const date = new Date(value)
            const year = date.getFullYear()
            const month = date.getMonth() + 1
            const day = date.getDate()
            return `${year}/${month}/${day}`
          },
        },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'value',
        scale: true,
        position: 'left',
        axisLine: { show: false },
        axisLabel: {
          color: '#64748b',
          fontSize: 10,
          formatter: (value: number) => value.toFixed(2)
        },
        splitLine: {
          lineStyle: {
            color: '#f1f5f9',
            type: 'dashed'
          }
        }
      },
      legend: {
        show: true,
        top: 5,
        textStyle: {
          color: '#64748b'
        },
        data: ['MA5', 'MA10', 'MA20', 'MA60'],
        selected: {
          'MA5': true,
          'MA10': true,
          'MA20': true,
          'MA60': true
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { 
          type: 'cross',
          crossStyle: {
            color: '#94a3b8'
          }
        },
        backgroundColor: 'rgba(255,255,255,0.98)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#334155', fontSize: 12 },
        shadowBlur: 10,
        shadowColor: 'rgba(0,0,0,0.1)',
        formatter: (params: any) => {
          const buyPoint = params.find((p: any) => p.seriesName === '买入')
          const sellPoint = params.find((p: any) => p.seriesName === '卖出')
          const tPoint = params.find((p: any) => p.seriesName === 'T+0')
          
          const klinePoint = params.find((p: any) => p.seriesName === 'K线')
          const dataIndex = klinePoint ? klinePoint.dataIndex : params[0].dataIndex
          const item = klineData[dataIndex]
          const ma5 = calculateMA(5, klineData)[dataIndex]
          const ma10 = calculateMA(10, klineData)[dataIndex]
          const ma20 = calculateMA(20, klineData)[dataIndex]
          const ma60 = calculateMA(60, klineData)[dataIndex]
          
          let html = `<div style="padding: 8px; min-width: 160px;">`
          html += `<div style="font-weight: 600; margin-bottom: 8px; color: #0f172a;">📅 ${item.date}</div>`
          html += `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px;">`
          html += `<span style="color: #64748b;">开盘:</span><span style="text-align: right; font-weight: 500;">¥${item.open.toFixed(2)}</span>`
          html += `<span style="color: #64748b;">收盘:</span><span style="text-align: right; font-weight: 500;">¥${item.close.toFixed(2)}</span>`
          html += `<span style="color: #64748b;">最高:</span><span style="text-align: right; font-weight: 500; color: #dc2626;">¥${item.high.toFixed(2)}</span>`
          html += `<span style="color: #64748b;">最低:</span><span style="text-align: right; font-weight: 500; color: #22c55e;">¥${item.low.toFixed(2)}</span>`
          html += `</div>`
          html += `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0; display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px;">`
          html += `<span style="color: #f97316;">MA5:</span><span style="text-align: right; font-weight: 500;">${ma5 ? ma5.toFixed(2) : '-'}</span>`
          html += `<span style="color: #8b5cf6;">MA10:</span><span style="text-align: right; font-weight: 500;">${ma10 ? ma10.toFixed(2) : '-'}</span>`
          html += `<span style="color: #06b6d4;">MA20:</span><span style="text-align: right; font-weight: 500;">${ma20 ? ma20.toFixed(2) : '-'}</span>`
          html += `<span style="color: #ec4899;">MA60:</span><span style="text-align: right; font-weight: 500;">${ma60 ? ma60.toFixed(2) : '-'}</span>`
          html += `</div>`
          
          if (buyPoint) {
            const tradesList = buyPoint.data.trades
            tradesList.forEach((t: any) => {
              html += `<div style="margin-top: 8px; padding: 6px; background: #fef2f2; border-radius: 4px; color: #dc2626; font-size: 11px;">📍 买入 ¥${t.price.toFixed(2)} × ${t.quantity}</div>`
            })
          }
          if (sellPoint) {
            const tradesList = sellPoint.data.trades
            tradesList.forEach((t: any) => {
              html += `<div style="margin-top: 4px; padding: 6px; background: #f0fdf4; border-radius: 4px; color: #16a34a; font-size: 11px;">📍 卖出 ¥${t.price.toFixed(2)} × ${t.quantity}</div>`
            })
          }
          if (tPoint) {
            const tradesList = tPoint.data.trades
            tradesList.forEach((t: any) => {
              const color = t.direction === '买入' ? '#dc2626' : '#16a34a'
              html += `<div style="margin-top: 4px; padding: 6px; background: #fffbeb; border-radius: 4px; color: ${color}; font-size: 11px;">📍 ${t.direction} ¥${t.price.toFixed(2)} × ${t.quantity}</div>`
            })
          }
          
          html += `</div>`
          return html
        }
      },
      series: [
        {
          name: 'K线',
          type: 'candlestick',
          data: klineData.map(d => [d.open, d.close, d.low, d.high]),
          itemStyle: {
            color: '#ef4444',
            color0: '#22c55e',
            borderColor: '#ef4444',
            borderColor0: '#22c55e'
          }
        },
        {
          name: 'MA5',
          type: 'line',
          data: calculateMA(5, klineData),
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 1.5, color: '#f97316' }
        },
        {
          name: 'MA10',
          type: 'line',
          data: calculateMA(10, klineData),
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 1.5, color: '#8b5cf6' }
        },
        {
          name: 'MA20',
          type: 'line',
          data: calculateMA(20, klineData),
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 1.5, color: '#06b6d4' }
        },
        {
          name: 'MA60',
          type: 'line',
          data: calculateMA(60, klineData),
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 1.5, color: '#ec4899' }
        },
        // 买入标记
        {
          name: '买入',
          type: 'scatter',
          data: markersB.map(d => ({
            value: [d.idx, d.price],
            trades: d.trades
          })),
          symbol: 'circle',
          symbolSize: 18,
          itemStyle: { 
            color: '#ef4444',
            shadowBlur: 4,
            shadowColor: 'rgba(239, 68, 68, 0.4)'
          },
          label: {
            show: true,
            formatter: 'B',
            color: '#fff',
            fontSize: 10,
            fontWeight: 'bold'
          }
        },
        // 卖出标记
        {
          name: '卖出',
          type: 'scatter',
          data: markersS.map(d => ({
            value: [d.idx, d.price],
            trades: d.trades
          })),
          symbol: 'circle',
          symbolSize: 18,
          itemStyle: { 
            color: '#22c55e',
            shadowBlur: 4,
            shadowColor: 'rgba(34, 197, 94, 0.4)'
          },
          label: {
            show: true,
            formatter: 'S',
            color: '#fff',
            fontSize: 10,
            fontWeight: 'bold'
          }
        },
        // T+0标记
        {
          name: 'T+0',
          type: 'scatter',
          data: markersT.map(d => ({
            value: [d.idx, d.price],
            trades: d.trades
          })),
          symbol: 'circle',
          symbolSize: 18,
          itemStyle: { 
            color: '#f59e0b',
            shadowBlur: 4,
            shadowColor: 'rgba(245, 158, 11, 0.4)'
          },
          label: {
            show: true,
            formatter: 'T',
            color: '#fff',
            fontSize: 10,
            fontWeight: 'bold'
          }
        }
      ]
    }
  }

  return (
    <div className="card p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
          K线图
        </h2>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-500"></span>
            <span className="text-slate-600">上涨</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-green-500"></span>
            <span className="text-slate-600">下跌</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-slate-600">买入点</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-slate-600">卖出点</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span className="text-slate-600">T+0</span>
          </div>
        </div>
      </div>
      
      {klineData.length > 0 ? (
        <ReactECharts 
          option={getChartOption()} 
          style={{ height: '550px', width: '100%' }}
          opts={{ renderer: 'svg' }}
        />
      ) : (
        <div className="h-96 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500">加载K线数据中...</p>
          </div>
        </div>
      )}
    </div>
  )
}
