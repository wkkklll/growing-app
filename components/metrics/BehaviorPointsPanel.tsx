"use client"

import { useEffect, useState, useCallback } from "react"

interface BehaviorLogItem {
  id: string
  behaviorType: string
  points: number
  createdAt: string
}

export function BehaviorPointsPanel({ onPointsUpdate }: { onPointsUpdate?: () => void }) {
  const [totalPoints, setTotalPoints] = useState(0)
  const [recentLogs, setRecentLogs] = useState<BehaviorLogItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/behavior/logs")
      const d = await res.json()
      setTotalPoints(d.totalPoints ?? 0)
      setRecentLogs(d.logs ?? [])
    } catch (e) {
      console.error("Failed to fetch logs", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs, onPointsUpdate])

  const handleDeleteLog = async (id: string) => {
    if (!window.confirm("确定要删除这条积分记录吗？")) return
    try {
      const res = await fetch(`/api/behavior/logs?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        fetchLogs()
        if (onPointsUpdate) onPointsUpdate()
      }
    } catch (e) {
      console.error("Failed to delete log", e)
    }
  }

  const handleClearAll = async () => {
    if (!window.confirm("警告：确定要清空所有积分记录吗？此操作不可撤销。")) return
    try {
      const res = await fetch("/api/behavior/logs?clearAll=true", { method: "DELETE" })
      if (res.ok) {
        fetchLogs()
        if (onPointsUpdate) onPointsUpdate()
      }
    } catch (e) {
      console.error("Failed to clear logs", e)
    }
  }

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center text-slate-500">
        加载中...
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">行为积分</h2>
        <button
          onClick={handleClearAll}
          className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-rose-500 transition-colors"
        >
          一键清空
        </button>
      </div>

      <div className="mb-8 text-center bg-sky-50 rounded-2xl py-6 border border-sky-100">
        <p className="text-5xl font-black text-sky-600 tracking-tight">{totalPoints}</p>
        <p className="text-xs font-bold text-sky-400 uppercase tracking-widest mt-1">Total Points</p>
      </div>

      <div>
        <h3 className="mb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">近期记录</h3>
        {recentLogs.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-4 italic">暂无积分记录</p>
        ) : (
          <ul className="space-y-3">
            {recentLogs.slice(0, 5).map((log) => (
              <li key={log.id} className="group flex items-center justify-between rounded-lg bg-slate-50 p-3 transition-all hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700">{log.behaviorType}</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(log.createdAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${log.points >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {log.points >= 0 ? `+${log.points}` : log.points}
                  </span>
                  <button
                    onClick={() => handleDeleteLog(log.id)}
                    className="rounded-full p-1 text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500 transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
