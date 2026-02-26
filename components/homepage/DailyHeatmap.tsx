"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"

interface HeatmapDay {
  date: string // YYYY-MM-DD
  mood: number // 1-10
  hasReview: boolean
}

export function DailyHeatmap() {
  const [heatmapData, setHeatmapData] = useState<HeatmapDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const today = new Date().toISOString().split('T')[0]

  const fetchHeatmapData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/homepage/heatmap")
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      const data = await res.json()
      setHeatmapData(data.heatmapData || [])
    } catch (e: any) {
      setError(e.message || "Failed to fetch heatmap data")
      console.error("Error fetching heatmap data:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHeatmapData()
  }, [fetchHeatmapData])

  const getDayColor = (mood: number, hasReview: boolean) => {
    if (!hasReview) return "bg-slate-100" // No review, light gray
    if (mood >= 8) return "bg-green-500" // High mood, dark green
    if (mood >= 6) return "bg-green-400" // Medium-high mood, green
    if (mood >= 4) return "bg-yellow-400" // Medium mood, yellow
    if (mood >= 2) return "bg-orange-400" // Low mood, orange
    return "bg-red-500" // Very low mood, red
  }

  const generateMonthDays = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const firstDayOfMonth = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const startDayOfWeek = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1 // Monday is 0, Sunday is 6

    const days = []
    // Fill leading empty days for alignment
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null)
    }
    // Fill actual days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i)
      days.push(d.toISOString().split('T')[0])
    }
    return days
  }

  const monthDays = generateMonthDays()
  const dataMap = new Map(heatmapData.map(d => [d.date, d]))

  if (loading) {
    return <div className="p-4 text-center text-slate-500">加载本月热力图...</div>
  }

  if (error) {
    return <div className="p-4 text-red-600">错误：{error}</div>
  }

  const weekdays = ['一', '二', '三', '四', '五', '六', '日']

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">本月每日复盘热力图</h2>
      <div className="grid grid-cols-7 text-center text-sm font-medium text-slate-500 mb-2">
        {weekdays.map(day => <div key={day}>{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 auto-rows-[28px] sm:auto-rows-[32px]">
        {monthDays.map((dateStr, index) => {
          if (dateStr === null) {
            return <div key={`empty-${index}`} className="w-full h-full"></div>
          }
          const dayData = dataMap.get(dateStr)
          const mood = dayData?.mood || 0
          const hasReview = dayData?.hasReview || false
          const colorClass = getDayColor(mood, hasReview)
          const dayOfMonth = new Date(dateStr).getDate()
          const isToday = dateStr === today

          return (
            <Link
              href={`/logs?date=${dateStr}`}
              key={dateStr}
              title={`${dateStr} - 心情: ${mood}/10, ${hasReview ? '有复盘' : '无复盘'}`}
              className={`relative flex items-center justify-center text-xs rounded-sm cursor-pointer ${colorClass} ${isToday ? 'ring-2 ring-blue-500 ring-offset-1' : ''} ${hasReview ? 'text-white' : 'text-slate-700'}`}
            >
              {dayOfMonth}
            </Link>
          )
        })}
      </div>
      <div className="mt-4 flex justify-between text-sm text-slate-500">
        <span>低活跃度 / 无复盘</span>
        <span>→</span>
        <span>高活跃度 / 高心情指数</span>
      </div>
    </div>
  )
}
