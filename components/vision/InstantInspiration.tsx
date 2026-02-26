"use client"

import { useState, useEffect, useCallback } from "react"

interface Inspiration {
  id: string
  content: string
  createdAt: string
}

export function InstantInspiration() {
  const [inspirations, setInspirations] = useState<Inspiration[]>([])
  const [newInspiration, setNewInspiration] = useState("")
  const [loading, setLoading] = useState(false)

  const fetchInspirations = useCallback(async () => {
    try {
      const res = await fetch("/api/inspirations")
      const data = await res.json()
      setInspirations(data.inspirations || [])
    } catch (e) {
      console.error("Failed to fetch inspirations", e)
    }
  }, [])

  useEffect(() => {
    fetchInspirations()
  }, [fetchInspirations])

  const handleAdd = async () => {
    if (!newInspiration.trim()) return
    setLoading(true)
    try {
      const res = await fetch("/api/inspirations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newInspiration.trim() }),
      })
      if (res.ok) {
        setNewInspiration("")
        fetchInspirations()
      }
    } catch (e) {
      console.error("Failed to add inspiration", e)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/inspirations?id=${id}`, { method: "DELETE" })
      if (res.ok) fetchInspirations()
    } catch (e) {
      console.error("Failed to delete inspiration", e)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">即时灵感</h2>
          <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Instant Inspiration</p>
        </div>
      </div>

      <div className="mb-6 flex gap-2">
        <input
          type="text"
          value={newInspiration}
          onChange={(e) => setNewInspiration(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="捕捉此刻的灵感..."
          className="flex-grow rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-purple-500/10 transition-all"
        />
        <button
          onClick={handleAdd}
          disabled={loading || !newInspiration.trim()}
          className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-700 shadow-md shadow-purple-200 transition-all active:scale-95 disabled:opacity-50"
        >
          捕捉
        </button>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
        {inspirations.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-8 italic">灵感如流星，快把它记录下来...</p>
        ) : (
          inspirations.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-2xl border border-purple-100 bg-purple-50/30 p-4 hover:bg-white hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm text-slate-700 leading-relaxed">{item.content}</p>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="rounded-full p-1 text-slate-300 hover:bg-rose-100 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                {new Date(item.createdAt).toLocaleString("zh-CN", { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
