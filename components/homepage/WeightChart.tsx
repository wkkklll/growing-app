"use client"

import { useState, useEffect, useCallback } from "react"

interface WeightDataPoint {
  date: string // YYYY-MM-DD
  value: number | null
}

export function WeightChart() {
  const [weightData, setWeightData] = useState<WeightDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWeightData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/daily-metrics/weight-chart")
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      const data = await res.json()
      setWeightData(data.weightData || [])
    } catch (e: any) {
      setError(e.message || "Failed to fetch weight data")
      console.error("Error fetching weight data:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWeightData()
  }, [fetchWeightData])

  if (loading) {
    return <div className="p-4 text-center text-slate-500">加载体重数据...</div>
  }

  if (error) {
    return <div className="p-4 text-red-600">错误：{error}</div>
  }

  // Simple visualization for now, without a charting library
  const hasData = weightData.some(d => d.value !== null)

  if (!hasData) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">近一个月体重折线图</h2>
        <p className="text-slate-500">暂无体重数据，请在每日复盘中记录。</p>
      </div>
    )
  }

  // Find min/max for scaling
  const validValues = weightData.map(d => d.value).filter((v): v is number => v !== null)
  const minWeight = Math.min(...validValues)
  const maxWeight = Math.max(...validValues)
  const range = maxWeight - minWeight === 0 ? 1 : maxWeight - minWeight // Avoid division by zero

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">近一个月体重折线图</h2>
      <div className="relative h-40 w-full">
        {/* Y-axis labels (min/max) */}
        <div className="absolute left-0 top-0 text-xs text-slate-500">{maxWeight.toFixed(1)}</div>
        <div className="absolute left-0 bottom-0 text-xs text-slate-500">{minWeight.toFixed(1)}</div>

        {/* Horizontal grid lines - simplified */}
        <div className="absolute left-0 right-0 top-1/2 h-px bg-slate-200"></div>

        {/* Data points and lines - simplified representation */}
        <div className="absolute inset-0 flex items-end justify-between px-6">
          {weightData.map((dataPoint, index) => {
            if (dataPoint.value === null) {
              return <div key={dataPoint.date} className="w-2 h-full relative"></div>
            }
            const heightPercent = ((dataPoint.value - minWeight) / range) * 100
            return (
              <div
                key={dataPoint.date}
                title={`${dataPoint.date}: ${dataPoint.value}`}
                className="relative w-2 bg-blue-500 rounded-full"
                style={{ height: `${heightPercent || 2}%` }} // Min height 2% for visibility
              ></div>
            )
          })}
        </div>
      </div>
      <div className="mt-4 flex justify-between text-xs text-slate-500">
        <span>{weightData[0]?.date.slice(5)}</span>
        <span>{weightData[weightData.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  )
}
