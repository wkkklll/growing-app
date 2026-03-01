"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { DailyMetricPanel } from "@/components/review/DailyMetricPanel"
import { EmotionCavePanel } from "@/components/review/EmotionCavePanel"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Todo {
  milestoneId: string
  projectId: string
  projectTitle: string
  title: string
}

interface CustomTodo {
  id: string
  title: string
  projectId: string | null
  projectTitle: string | null
}

interface LogEntry {
  milestoneId: string
  projectId: string
  projectTitle: string
  title: string
  status: string
}

interface ScheduledTask {
  id: string
  taskId: string
  taskType: "milestone" | "standalone"
  taskTitle: string
  startTime: string
  endTime: string
}

export default function LogsPage() {
  const searchParams = useSearchParams()
  const urlDate = searchParams.get("date")
  
  const [date, setDate] = useState(() => {
    // Priority 1: URL parameter
    if (urlDate) return urlDate
    
    // Priority 2: Default logic (before 2 AM show yesterday)
    const now = new Date()
    if (now.getHours() < 2) {
      const yesterday = new Date(now)
      yesterday.setDate(now.getDate() - 1)
      return yesterday.toISOString().slice(0, 10)
    }
    return now.toISOString().slice(0, 10)
  })
  
  const [todos, setTodos] = useState<Todo[]>([])
  const [customTodos, setCustomTodos] = useState<CustomTodo[]>([])
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([])
  const [logEntries, setLogEntries] = useState<LogEntry[]>([])
  const [summaryText, setSummaryText] = useState("")
  const [highlightText, setHighlightText] = useState("")
  const [blockerText, setBlockerText] = useState("")
  const [improveText, setImproveText] = useState("")
  const [tomorrowText, setTomorrowText] = useState("")
  const [moodIndex, setMoodIndex] = useState(5)
  const [aiReview, setAiReview] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [logId, setLogId] = useState<string | null>(null)

  const fetchLogData = useCallback(async () => {
    const [todoRes, logRes, scheduleRes] = await Promise.all([
      fetch(`/api/todos/daily?date=${date}`),
      fetch(`/api/logs/daily?date=${date}`),
      fetch(`/api/schedule/daily?planDate=${date}`),
    ])
    const todoData = await todoRes.json()
    const logData = await logRes.json()
    const scheduleData = await scheduleRes.json()

    setTodos(todoData.todos ?? [])
    setCustomTodos(todoData.customTodos ?? [])
    setScheduledTasks(scheduleData.scheduledTasks ?? [])
    setLogEntries(logData.entries ?? [])
    setMoodIndex(typeof logData.moodIndex === "number" ? logData.moodIndex : 5)
    setAiReview(logData.aiReview ?? "")
    setLogId(logData.logId || null)
    
    // Parse content back into fields if it exists
    if (logData.content) {
      const content = logData.content
      const summaryMatch = content.match(/总体情况：(.*?)(?=\n完成亮点：|$)/s)
      const highlightMatch = content.match(/完成亮点：(.*?)(?=\n未完成原因：|$)/s)
      const blockerMatch = content.match(/未完成原因：(.*?)(?=\n改进点：|$)/s)
      const improveMatch = content.match(/改进点：(.*?)(?=\n明日重点：|$)/s)
      const tomorrowMatch = content.match(/明日重点：(.*?)$/s)

      setSummaryText(summaryMatch?.[1]?.trim() ?? "")
      setHighlightText(highlightMatch?.[1]?.trim() ?? "")
      setBlockerText(blockerMatch?.[1]?.trim() ?? "")
      setImproveText(improveMatch?.[1]?.trim() ?? "")
      setTomorrowText(tomorrowMatch?.[1]?.trim() ?? "")
    } else {
      setSummaryText("")
      setHighlightText("")
      setBlockerText("")
      setImproveText("")
      setTomorrowText("")
    }
    setSubmitted(false)
  }, [date])

  useEffect(() => {
    fetchLogData()
  }, [fetchLogData])

  const buildCompletionText = useCallback(() => {
    const parts = [
      summaryText.trim() ? `总体情况：${summaryText.trim()}` : "",
      highlightText.trim() ? `完成亮点：${highlightText.trim()}` : "",
      blockerText.trim() ? `未完成原因：${blockerText.trim()}` : "",
      improveText.trim() ? `改进点：${improveText.trim()}` : "",
      tomorrowText.trim() ? `明日重点：${tomorrowText.trim()}` : "",
    ].filter(Boolean)
    return parts.join("\n")
  }, [summaryText, highlightText, blockerText, improveText, tomorrowText])

  // Auto-save functionality with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      const completionText = buildCompletionText()
      if (completionText.trim() || logId) {
        fetch("/api/logs/daily", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date,
            moodIndex,
            completionText,
            milestoneIds: [
              ...todos.map((t) => t.milestoneId),
              ...scheduledTasks.filter((s) => s.taskType === "milestone").map((s) => s.taskId),
            ].filter((id, i, arr) => arr.indexOf(id) === i),
          }),
        }).then(res => res.json()).then(data => {
          if (data.logId) setLogId(data.logId)
        }).catch(console.error)
      }
    }, 3000) // Auto-save after 3 seconds of inactivity
    
    return () => clearTimeout(timer)
  }, [buildCompletionText, moodIndex, date, todos, scheduledTasks, logId])

  const submitLog = async () => {
    setLoading(true)
    try {
      // Step 1: Save the log first
      const completionText = buildCompletionText()
      const saveRes = await fetch("/api/logs/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          moodIndex,
          completionText,
          milestoneIds: [
            ...todos.map((t) => t.milestoneId),
            ...scheduledTasks.filter((s) => s.taskType === "milestone").map((s) => s.taskId),
          ],
        }),
      })
      const saveData = await saveRes.json()
      setLogId(saveData.logId)
      
      // Step 2: Generate AI review and save it
      const reviewRes = await fetch("/api/review/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          completionText,
        }),
      })
      const reviewData = await reviewRes.json()
      setAiReview(reviewData.aiReview ?? "")
      
      setSubmitted(true)
      
      // Keep page at top, prevent auto-scroll to bottom
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setLoading(false)
    }
  }

  const fetchReview = async () => {
    setLoading(true)
    try {
      const completionText = buildCompletionText()
      const res = await fetch("/api/review/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          completionText,
        }),
      })
      const data = await res.json()
      setAiReview(data.aiReview ?? "")
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    if (!logId) {
      alert("请先提交复盘后再导出")
      return
    }
    try {
      const res = await fetch(`/api/export/review?reviewId=${logId}&reviewType=daily`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `每日复盘-${date}.md`
        document.body.appendChild(a)
        a.click()
        a.remove()
      }
    } catch (e) {
      console.error("Export failed", e)
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* Top Section: Header & Review Form */}
      <div className="space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">每日复盘</h1>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-4 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl border-none bg-transparent px-3 sm:px-4 py-2 sm:py-1.5 text-sm font-bold text-slate-700 focus:ring-0 focus:outline-none w-full"
              />
            </div>
            <Link
              href="/review/weekly"
              className="rounded-xl bg-sky-50 px-4 py-3 sm:py-2.5 text-sm font-bold text-sky-600 hover:bg-sky-100 transition-all text-center min-h-[44px] flex items-center justify-center"
            >
              每周复盘 →
            </Link>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 items-stretch">
          {/* Left: Metrics & Tasks (5 columns) */}
          <div className="lg:col-span-5 space-y-8 flex flex-col h-full">
            <div className="shrink-0">
              <DailyMetricPanel date={date} />
            </div>
            
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col flex-grow min-h-0">
              <h3 className="mb-6 text-lg font-bold text-slate-800 shrink-0">今日任务</h3>
              
              {/* Sub-modules: 已完成 + 待跟进 */}
              <div className="grid gap-4 sm:grid-cols-2 flex-grow min-h-0">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-4 flex flex-col min-h-0">
                  <h4 className="mb-3 text-sm font-bold text-emerald-600 uppercase tracking-widest shrink-0">已完成</h4>
                  <div className="flex-grow overflow-y-auto min-h-0">
                    {logEntries.filter((e) => e.status === "completed").length === 0 ? (
                      <p className="text-sm text-slate-400 italic py-2">暂无已完成任务</p>
                    ) : (
                      <ul className="space-y-2">
                        {logEntries
                          .filter((e) => e.status === "completed")
                          .map((e) => (
                            <li key={e.milestoneId} className="flex items-start gap-3 bg-white p-3 rounded-lg border border-emerald-100">
                              <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                              <span className="text-sm text-slate-700 leading-tight">
                                {e.title} <span className="text-[10px] text-slate-400 block mt-0.5 font-bold uppercase">{e.projectTitle}</span>
                              </span>
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-4 flex flex-col min-h-0">
                  <h4 className="mb-3 text-sm font-bold text-amber-600 uppercase tracking-widest shrink-0">待跟进</h4>
                  <div className="flex-grow overflow-y-auto min-h-0">
                    {(() => {
                      const completedIds = new Set(
                        logEntries.filter((e) => e.status === "completed").map((e) => e.milestoneId)
                      )
                      const scheduledIds = new Set(
                        scheduledTasks.map((s) => s.taskId)
                      )
                      const pendingFromEntries = logEntries.filter((e) => e.status !== "completed")
                      const pendingFromTodos = todos
                        .filter((t) => !completedIds.has(t.milestoneId) && !scheduledIds.has(t.milestoneId))
                        .map((t) => ({ id: t.milestoneId, title: t.title, projectTitle: t.projectTitle, status: "pending" as const, complete: async () => { const r = await fetch(`/api/milestones/${t.milestoneId}/complete`, { method: "POST" }); if (r.ok) fetchLogData() } }))
                      const pendingFromCustom = customTodos
                        .filter((ct) => !scheduledIds.has(ct.id))
                        .map((t) => ({ id: t.id, title: t.title, projectTitle: t.projectTitle || "独立任务", status: "pending" as const, complete: async () => { const r = await fetch(`/api/standalone/${t.id}/complete`, { method: "POST" }); if (r.ok) fetchLogData() } }))
                      const pendingFromScheduled = scheduledTasks
                        .filter((s) => !completedIds.has(s.taskId))
                        .map((s) => ({
                          id: s.taskId,
                          title: s.taskTitle,
                          projectTitle: s.taskType === "standalone" ? "独立任务" : "项目任务",
                          status: "pending" as const,
                          complete: async () => {
                            const r = s.taskType === "milestone"
                              ? await fetch(`/api/milestones/${s.taskId}/complete`, { method: "POST" })
                              : await fetch(`/api/standalone/${s.taskId}/complete`, { method: "POST" })
                            if (r.ok) fetchLogData()
                          },
                        }))
                      const pendingEntries = pendingFromEntries.map((e) => ({
                        id: e.milestoneId,
                        title: e.title,
                        projectTitle: e.projectTitle,
                        status: e.status as "pending" | "partial",
                        complete: undefined as (() => Promise<void>) | undefined,
                      }))
                      const pendingAll = [...pendingEntries, ...pendingFromTodos, ...pendingFromCustom, ...pendingFromScheduled]
                      if (pendingAll.length === 0) {
                        return <p className="text-sm text-slate-400 italic py-2">今日任务已全部达成！</p>
                      }
                      return (
                        <ul className="space-y-2">
                          {pendingAll.map((e) => (
                            <li key={e.id} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-amber-100">
                              {e.complete ? (
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 cursor-pointer rounded-full border-slate-300 text-sky-600 focus:ring-sky-500 shrink-0"
                                  onChange={e.complete}
                                />
                              ) : (
                                <div className={`h-2 w-2 rounded-full shrink-0 ${e.status === "partial" ? "bg-sky-400" : "bg-amber-400"}`} />
                              )}
                              <span className="text-sm text-slate-700 leading-tight">
                                {e.title} <span className="text-[10px] text-slate-400 block mt-0.5 font-bold uppercase">{e.projectTitle}</span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      )
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Review Structure (7 columns) */}
          <div className="lg:col-span-7 h-full">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-8 h-full flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-6 shrink-0">
                <h3 className="text-xl font-bold text-slate-800">深度复盘</h3>
                <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">心情指数</span>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={moodIndex}
                    onChange={(e) => setMoodIndex(Number(e.target.value))}
                    className="w-32 accent-sky-500"
                  />
                  <span className="text-xl font-black text-sky-600 w-6 text-center">{moodIndex}</span>
                </div>
              </div>

              <div className="grid gap-8 flex-grow overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                {[
                  { label: "总体情况", value: summaryText, setter: setSummaryText, placeholder: "节奏稳定，完成了核心任务，但分心较多..." },
                  { label: "完成亮点", value: highlightText, setter: setHighlightText, placeholder: "完成了 XX 模块的核心功能并通过自测..." },
                  { label: "未完成原因", value: blockerText, setter: setBlockerText, placeholder: "下午会议过多，注意力被打断..." },
                  { label: "改进点", value: improveText, setter: setImproveText, placeholder: "早上先处理高价值任务，下午处理零碎事项..." },
                  { label: "明日重点", value: tomorrowText, setter: setTomorrowText, placeholder: "完成 XX 测试用例并补齐文档..." },
                ].map((field) => (
                  <div key={field.label} className="group">
                    <label className="mb-2 block text-[10px] font-bold text-slate-400 uppercase tracking-widest group-focus-within:text-sky-600 transition-colors">
                      {field.label}
                    </label>
                    <textarea
                      value={field.value}
                      onChange={(e) => field.setter(e.target.value)}
                      rows={3}
                      placeholder={field.placeholder}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 focus:outline-none transition-all resize-none"
                    />
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-6 border-t border-slate-100 shrink-0">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                  <button
                    onClick={submitLog}
                    disabled={loading}
                    className="rounded-xl bg-slate-900 px-8 sm:px-10 py-3.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50 shadow-xl shadow-slate-200 transition-all active:scale-95 min-h-[48px]"
                  >
                    {loading ? "提交中..." : "保存复盘"}
                  </button>
                  <button
                    onClick={fetchReview}
                    disabled={loading}
                    className="rounded-xl bg-sky-50 px-8 sm:px-10 py-3.5 text-sm font-bold text-sky-600 hover:bg-sky-100 disabled:opacity-50 transition-all active:scale-95 min-h-[48px]"
                  >
                    AI 评价
                  </button>
                </div>
                {logId && (
                  <button
                    onClick={handleExport}
                    className="rounded-xl bg-emerald-50 px-6 py-3 text-sm font-bold text-emerald-600 hover:bg-emerald-100 transition-all active:scale-95 min-h-[44px] w-full sm:w-auto"
                  >
                    📥 导出
                  </button>
                )}
              </div>
                    className="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    导出 MD
                  </button>
                )}
              </div>

              {submitted && (
                <p className="text-center text-sm font-bold text-emerald-600 animate-in fade-in slide-in-from-bottom-2 shrink-0">
                  ✨ 复盘已成功提交，进度已同步回填至项目
                </p>
              )}
            </div>
          </div>
        </div>

        {/* AI Review Display */}
        {aiReview && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-8 shadow-sm animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">AI 人生教练建议</h3>
                <p className="text-xs text-amber-600 font-bold uppercase tracking-widest">Daily Insight</p>
              </div>
            </div>
            <div className="prose prose-sm max-w-none prose-slate prose-p:leading-relaxed prose-strong:text-amber-700 prose-ul:list-disc prose-ol:list-decimal">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiReview}</ReactMarkdown>
            </div>
            <div className="mt-8 pt-6 border-t border-amber-100 flex justify-end">
              <Link
                href={`/analysis?date=${date}`}
                className="text-sm font-bold text-amber-700 hover:text-amber-800 flex items-center gap-2 transition-all group"
              >
                查看完整数据分析报告 
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section: Emotion Cave (Full Width) */}
      <div className="pt-12 border-t border-slate-100">
        <div className="h-[750px]">
          <EmotionCavePanel date={date} />
        </div>
      </div>
    </div>
  )
}
