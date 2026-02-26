"use client"

import { useState, useEffect } from "react"

export function MotivationalQuote() {
  const [quote, setQuote] = useState("加载中...")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/homepage/quote")
      .then((res) => res.json())
      .then((data) => {
        setQuote(data.quote || "每日一句鼓舞的话")
      })
      .catch((e) => {
        console.error("Failed to fetch motivational quote:", e)
        setQuote("遇到困难，不要放弃！") // Fallback quote
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <p className="text-center text-slate-500">加载鼓舞语...</p>
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 text-center shadow-sm">
      <p className="text-lg italic text-slate-700">“{quote}”</p>
    </div>
  )
}
