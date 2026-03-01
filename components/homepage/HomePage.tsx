"use client"

import { useState, useCallback, useEffect } from "react"
import { BehaviorPointsPanel } from "@/components/metrics/BehaviorPointsPanel"
import { QuickActions } from "@/components/homepage/QuickActions"
import { DailyHeatmap } from "@/components/homepage/DailyHeatmap"
import { WeightChart } from "@/components/homepage/WeightChart"

export function HomePage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [totalPoints, setTotalPoints] = useState(0)

  const fetchTotalPoints = useCallback(async () => {
    try {
      const res = await fetch("/api/behavior/logs")
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      const data = await res.json()
      setTotalPoints(data.totalPoints || 0)
    } catch (e: any) {
      console.error("Error fetching total points:", e)
    }
  }, [])

  const refreshAllPanels = useCallback(() => {
    setRefreshKey((prev) => prev + 1)
    fetchTotalPoints()
  }, [fetchTotalPoints])

  useEffect(() => {
    fetchTotalPoints()
  }, [fetchTotalPoints])

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">欢迎回来！</h1>
        <p className="text-sm sm:text-base text-slate-500 mt-1">今天也是充满活力的一天，继续向目标迈进吧。</p>
      </header>

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-12 items-stretch mb-6 sm:mb-8" key={refreshKey}>
        <section className="lg:col-span-8 h-full">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-8 shadow-sm h-full">
            <DailyHeatmap />
          </div>
        </section>
        <section className="lg:col-span-4 h-full">
          <div className="h-full">
            <BehaviorPointsPanel onPointsUpdate={refreshAllPanels} />
          </div>
        </section>
      </div>

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-12 items-start mb-6 sm:mb-8">
        <section className="lg:col-span-12">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-8 shadow-sm">
            <WeightChart />
          </div>
        </section>
      </div>

      <section>
        <QuickActions />
      </section>
    </div>
  )
}
