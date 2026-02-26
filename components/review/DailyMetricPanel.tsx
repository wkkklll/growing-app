"use client"

import { useState, useEffect, useCallback } from "react"
import { parseJsonStringArray } from "@/lib/utils"

interface DailyMetric {
  id: string
  logDate: string
  metricType: string
  value: number
}

interface DailyMetricPanelProps {
  date: string // ISO string for the current day
}

export function DailyMetricPanel({ date }: DailyMetricPanelProps) {
  const [enabledMetricTypes, setEnabledMetricTypes] = useState<string[]>([])
  const [dailyMetrics, setDailyMetrics] = useState<Record<string, number>>({}) // metricType -> value
  const [weightValue, setWeightValue] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newMetricType, setNewMetricType] = useState("")

  const fetchSettingsAndMetrics = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch enabled metric types from settings
      const settingsRes = await fetch("/api/settings/vision") // Reusing vision settings API for now, or create a dedicated settings API
      if (!settingsRes.ok) {
        throw new Error(`HTTP error! status: ${settingsRes.status}`)
      }
      const settingsData = await settingsRes.json()
      const types = parseJsonStringArray(settingsData.dailyMetricTypes) || []
      setEnabledMetricTypes(types)

      // Fetch daily metrics for the current date
      const metricsRes = await fetch(`/api/daily-metrics?date=${date}`)
      if (!metricsRes.ok) {
        throw new Error(`HTTP error! status: ${metricsRes.status}`)
      }
      const metricsData = await metricsRes.json()
      const currentMetrics: Record<string, number> = {}
      metricsData.metrics.forEach((m: DailyMetric) => {
        if (m.metricType === "weight") {
          setWeightValue(m.value) // Set dedicated weight value
        } else {
          currentMetrics[m.metricType] = m.value
        }
      })
      setDailyMetrics(currentMetrics)
    } catch (e: any) {
      setError(e.message || "Failed to fetch daily metrics")
      console.error("Error fetching daily metrics:", e)
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    fetchSettingsAndMetrics()
  }, [fetchSettingsAndMetrics])

  const handleMetricValueChange = async (metricType: string, value: string) => {
    const numValue = parseFloat(value)
    if (isNaN(numValue)) return // Only allow valid numbers

    setDailyMetrics((prev) => ({ ...prev, [metricType]: numValue }))

    try {
      const res = await fetch("/api/daily-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logDate: date,
          metricType,
          value: numValue,
        }),
      })
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
    } catch (e: any) {
      setError(e.message || `Failed to save ${metricType}`)
      console.error(`Error saving ${metricType}:`, e)
    }
  }

  const handleWeightValueChange = async (value: string) => {
    const numValue = parseFloat(value)
    if (isNaN(numValue) && value !== "") return // Allow empty string to clear

    setWeightValue(value === "" ? null : numValue)

    if (value === "") {
      // Optionally delete the metric if cleared
      // This requires a DELETE endpoint or a specific value for deletion
      // For now, we'll just not send a request if cleared.
      return
    }

    try {
      const res = await fetch("/api/daily-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logDate: date,
          metricType: "weight",
          value: numValue,
        }),
      })
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
    } catch (e: any) {
      setError(e.message || "Failed to save weight")
      console.error("Error saving weight:", e)
    }
  }

  const handleAddMetricType = async () => {
    if (!newMetricType.trim() || newMetricType.trim() === "weight") return // Prevent adding 'weight' again
    const updatedMetricTypes = [...enabledMetricTypes, newMetricType.trim()]

    try {
      const res = await fetch("/api/settings/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyMetricTypes: JSON.stringify(updatedMetricTypes) }),
      })
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      setEnabledMetricTypes(updatedMetricTypes)
      setNewMetricType("")
    } catch (e: any) {
      setError(e.message || "Failed to add metric type")
      console.error("Error adding metric type:", e)
    }
  }

  const handleRemoveMetricType = async (metricTypeToRemove: string) => {
    if (metricTypeToRemove === "weight") return // Prevent removing weight
    const updatedMetricTypes = enabledMetricTypes.filter((type) => type !== metricTypeToRemove)

    try {
      const res = await fetch("/api/settings/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyMetricTypes: JSON.stringify(updatedMetricTypes) }),
      })
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      setEnabledMetricTypes(updatedMetricTypes)
    } catch (e: any) {
      setError(e.message || "Failed to remove metric type")
      console.error("Error removing metric type:", e)
    }
  }

  if (loading) {
    return <div className="p-4 text-center text-slate-500">加载每日指标...</div>
  }

  if (error) {
    return <div className="p-4 text-red-600">错误：{error}</div>
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">每日记录板块</h2>

      {/* 专门的体重记录 */}
      <div className="mb-4 pb-4 border-b border-slate-100 last:border-b-0">
        <div className="flex items-center gap-2">
          <label className="w-24 shrink-0 text-sm font-medium text-slate-700">体重 (kg):</label>
          <input
            type="number"
            step="0.1"
            value={weightValue ?? ""}
            onChange={(e) => handleWeightValueChange(e.target.value)}
            placeholder="输入体重"
            className="flex-grow rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          <button
            onClick={() => handleWeightValueChange(weightValue !== null ? String(weightValue) : "")}
            className="rounded-md bg-sky-500 px-4 py-2 text-white hover:bg-sky-600"
          >
            保存
          </button>
        </div>
      </div>

      <div className="mb-4 space-y-3">
        {enabledMetricTypes.filter(type => type !== "weight").map((type) => (
          <div key={type} className="flex items-center gap-2">
            <label className="w-24 shrink-0 text-sm font-medium text-slate-700">{type}:</label>
            <input
              type="number"
              step="any"
              value={dailyMetrics[type] ?? ""}
              onChange={(e) => handleMetricValueChange(type, e.target.value)}
              className="flex-grow rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <button
              onClick={() => handleRemoveMetricType(type)}
              className="text-rose-500 hover:text-rose-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newMetricType}
          onChange={(e) => setNewMetricType(e.target.value)}
          placeholder="添加新指标（例如：睡眠时长、运动时间）"
          className="flex-grow rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
        <button
          onClick={handleAddMetricType}
          className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          添加
        </button>
      </div>
    </div>
  )
}
