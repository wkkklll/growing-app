"use client"

import { useState, useEffect, useCallback } from "react"

interface ShortTermWish {
  id: string
  title: string
  costPoints: number
  status: "pending" | "claimed"
}

interface ShortTermWishesPanelProps {
  currentTotalPoints: number
  onPointsUpdate: () => void
}

export function ShortTermWishesPanel({ currentTotalPoints, onPointsUpdate }: ShortTermWishesPanelProps) {
  const [wishes, setWishes] = useState<ShortTermWish[]>([])
  const [newWishTitle, setNewWishTitle] = useState("")
  const [newWishCost, setNewWishCost] = useState<number>(10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWishes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/rewards?rewardType=short_term_wish")
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      const data = await res.json()
      setWishes(data.rewards || [])
    } catch (e: any) {
      setError(e.message || "Failed to fetch short-term wishes")
      console.error("Error fetching short-term wishes:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWishes()
  }, [fetchWishes])

  const handleAddWish = async () => {
    if (!newWishTitle.trim() || newWishCost <= 0) {
      alert("请填写有效的心愿名称和积分成本。")
      return
    }
    try {
      const res = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newWishTitle.trim(),
          costPoints: newWishCost,
          rewardType: "short_term_wish",
          status: "pending"
        }),
      })
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      setNewWishTitle("")
      setNewWishCost(10)
      fetchWishes()
    } catch (e: any) {
      setError(e.message || "Failed to add wish")
      console.error("Error adding wish:", e)
    }
  }

  const handleClaimWish = async (wish: ShortTermWish) => {
    if (currentTotalPoints < wish.costPoints) {
      alert(`积分不足！需要 ${wish.costPoints} 积分，您只有 ${currentTotalPoints} 积分。`)
      return
    }

    const confirmed = window.confirm(
      `确定花费 ${wish.costPoints} 积分兑换“${wish.title}”吗？`
    )
    if (!confirmed) return

    try {
      const res = await fetch("/api/rewards/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: wish.title,
          costPoints: wish.costPoints,
          rewardType: "short_term_wish",
        }),
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`)
      }
      fetchWishes()
      onPointsUpdate()
    } catch (e: any) {
      setError(e.message || "Failed to claim wish")
      console.error("Error claiming wish:", e)
    }
  }

  const handleDeleteWish = async (wishId: string) => {
    const confirmed = window.confirm("确定删除此心愿吗？")
    if (!confirmed) return
    try {
      const res = await fetch(`/api/rewards?id=${wishId}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      fetchWishes()
    } catch (e: any) {
      setError(e.message || "Failed to delete wish")
      console.error("Error deleting wish:", e)
    }
  }

  if (loading) return <div className="p-4 text-center text-slate-400 text-sm">加载中...</div>

  const pendingWishes = wishes.filter(w => w.status === "pending")
  const claimedWishes = wishes.filter(w => w.status === "claimed")

  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2 text-xl font-bold text-slate-800 hover:text-sky-600 transition-colors"
        >
          近日小心愿
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 transition-transform duration-300 ${isCollapsed ? '-rotate-90' : ''}`} 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 border border-amber-100">
          <span className="text-amber-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 005.657 0z" clipRule="evenodd" />
            </svg>
          </span>
          <span className="text-xs font-bold text-amber-700">{currentTotalPoints} 积分</span>
        </div>
      </div>

      {!isCollapsed && (
        <>
      <div className="mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
        <input
          type="text"
          value={newWishTitle}
          onChange={(e) => setNewWishTitle(e.target.value)}
          placeholder="想要什么奖励？"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 focus:outline-none transition-all"
        />
        <div className="flex items-stretch gap-2">
          <div className="relative flex-grow">
            <input
              type="number"
              min={1}
              value={newWishCost}
              onChange={(e) => setNewWishCost(parseInt(e.target.value) || 1)}
              className="w-full h-full rounded-xl border border-slate-200 bg-white pl-4 pr-12 py-2.5 text-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 focus:outline-none transition-all"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase pointer-events-none">Points</span>
          </div>
          <button
            onClick={handleAddWish}
            disabled={!newWishTitle.trim()}
            className="rounded-xl bg-sky-600 px-8 py-2.5 text-sm font-bold text-white hover:bg-sky-700 shadow-lg shadow-sky-100 disabled:opacity-30 transition-all active:scale-95 shrink-0"
          >
            添加
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {pendingWishes.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">待兑换</h3>
            {pendingWishes.map((wish) => (
              <div
                key={wish.id}
                className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3 hover:border-sky-100 hover:shadow-sm transition-all"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700">{wish.title}</span>
                  <span className="text-[10px] font-medium text-sky-600">{wish.costPoints} 积分</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleClaimWish(wish)}
                    className="rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-600 hover:bg-sky-600 hover:text-white transition-all"
                  >
                    兑换
                  </button>
                  <button
                    onClick={() => handleDeleteWish(wish.id)}
                    className="rounded-full p-1 text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {claimedWishes.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">已实现</h3>
            <div className="grid grid-cols-2 gap-2">
              {claimedWishes.map((wish) => (
                <div
                  key={wish.id}
                  className="group relative flex items-center justify-between rounded-xl border border-slate-50 bg-slate-50/50 p-2 transition-all"
                >
                  <span className="text-xs text-slate-400 line-through truncate pr-4">{wish.title}</span>
                  <button
                    onClick={() => handleDeleteWish(wish.id)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  )
}
