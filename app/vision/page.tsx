"use client"

import { useState, useEffect, useCallback } from "react"
import { YearlyWishes } from "@/components/vision/YearlyWishes"
import { MotivationBoard } from "@/components/vision/MotivationBoard"
import { ShortTermWishesPanel } from "@/components/vision/ShortTermWishesPanel"
import { InstantInspiration } from "@/components/vision/InstantInspiration"

interface VisionBoardData {
  yearlyWishes: string[]
  motivationPhrases: string[]
}

export default function VisionBoardPage() {
  const [visionData, setVisionData] = useState<VisionBoardData>({ yearlyWishes: [], motivationPhrases: [] })
  const [currentTotalPoints, setCurrentTotalPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTotalPoints = useCallback(async () => {
    try {
      const res = await fetch("/api/behavior/logs")
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      const data = await res.json()
      setCurrentTotalPoints(data.totalPoints || 0)
    } catch (e: any) {
      console.error("Error fetching total points:", e)
    }
  }, [])

  const fetchVisionData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/settings/vision")
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      const data = await res.json()
      setVisionData(data)
    } catch (e: any) {
      setError(e.message || "Failed to fetch vision board data")
      console.error("Error fetching vision board data:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVisionData()
    fetchTotalPoints()
  }, [fetchVisionData, fetchTotalPoints])

  const saveVisionData = async (updatedData: Partial<VisionBoardData>) => {
    try {
      const res = await fetch("/api/settings/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...visionData, ...updatedData }),
      })
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      const data = await res.json()
      setVisionData(data)
    } catch (e: any) {
      setError(e.message || "Failed to save vision board data")
      console.error("Error saving vision board data:", e)
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-20 text-center text-slate-500">加载中...</div>
  }

  if (error) {
    return <div className="mx-auto max-w-7xl px-4 py-20 text-red-600">错误：{error}</div>
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-12">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">成长OS</h1>
        <p className="text-slate-500 mt-1">捕捉灵感，描绘未来，记录成长</p>
      </header>

      {/* 2x2 Grid Layout for perfect alignment */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-stretch">
        {/* Row 1 Left: Yearly Wishes */}
        <section className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col">
          <YearlyWishes
            wishes={visionData.yearlyWishes}
            onSave={(wishes) => saveVisionData({ yearlyWishes: wishes })}
          />
        </section>

        {/* Row 1 Right: Instant Inspiration */}
        <section className="lg:col-span-4 rounded-2xl border border-purple-100 bg-purple-50/10 p-8 shadow-sm flex flex-col">
          <InstantInspiration />
        </section>

        {/* Row 2 Left: Motivation Board */}
        <section className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col">
          <MotivationBoard
            phrases={visionData.motivationPhrases}
            onSave={(phrases) => saveVisionData({ motivationPhrases: phrases })}
          />
        </section>

        {/* Row 2 Right: Short Term Wishes */}
        <section className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col">
          <ShortTermWishesPanel
            currentTotalPoints={currentTotalPoints}
            onPointsUpdate={fetchTotalPoints}
          />
        </section>
      </div>
    </div>
  )
}
