"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

interface AnalysisItem {
  date: string
  aiReview: string | null
}

interface ProjectOption {
  id: string
  title: string
}

export default function AnalysisPage() {
  const searchParams = useSearchParams()
  const projectIdFromUrl = searchParams.get("projectId")
  const [prompt, setPrompt] = useState("")
  const [analysis, setAnalysis] = useState("")
  const [loading, setLoading] = useState(false)
  const [recentLogs, setRecentLogs] = useState<AnalysisItem[]>([])
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [projectId, setProjectId] = useState<string | null>(projectIdFromUrl)

  useEffect(() => {
    setProjectId(projectIdFromUrl)
  }, [projectIdFromUrl])

  useEffect(() => {
    fetch("/api/analysis/recent")
      .then((r) => r.json())
      .then((d) => setRecentLogs(d.logs ?? []))
      .catch(() => setRecentLogs([]))
  }, [])

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects ?? []))
      .catch(() => setProjects([]))
  }, [])

  const requestAnalysis = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setAnalysis("")
    try {
      const res = await fetch("/api/analysis/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          projectId: projectId || undefined,
        }),
      })
      const data = await res.json()
      setAnalysis(data.analysis ?? data.error ?? "分析失败")
    } catch {
      setAnalysis("请求失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 text-2xl font-bold text-slate-800">AI 分析</h1>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-slate-800">请求分析</h2>
        <p className="mb-4 text-sm text-slate-500">
          输入你想分析的内容，如「分析我近 7 天的完成情况」「根据我的项目进度给些建议」。选择项目可节省 token，仅分析该项目的上下文。
        </p>
        {projects.length > 0 && (
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-600">
              分析范围
            </label>
            <select
              value={projectId ?? ""}
              onChange={(e) => setProjectId(e.target.value || null)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="">全部项目</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex gap-3">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="输入分析请求..."
            className="flex-1 rounded-lg border border-slate-300 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            onKeyDown={(e) => e.key === "Enter" && requestAnalysis()}
          />
          <button
            onClick={requestAnalysis}
            disabled={loading}
            className="rounded-lg bg-sky-600 px-6 py-3 text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {loading ? "分析中..." : "分析"}
          </button>
        </div>
        {analysis && (
          <div className="mt-6 rounded-lg border border-sky-100 bg-sky-50/50 p-5">
            <h3 className="mb-2 text-sm font-medium text-slate-700">AI 分析结果</h3>
            <p className="whitespace-pre-wrap text-slate-700">{analysis}</p>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">近期 AI 复盘记录</h2>
        {recentLogs.length === 0 ? (
          <p className="py-8 text-center text-slate-500">暂无记录，去每日复盘获取 AI 评价</p>
        ) : (
          <ul className="space-y-4">
            {recentLogs.map((log) => (
              <li
                key={log.date}
                className="rounded-lg border border-slate-100 bg-slate-50/50 p-4"
              >
                <div className="mb-2 text-sm font-medium text-slate-500">{log.date}</div>
                <p className="text-slate-700">
                  {log.aiReview || "（该日未生成 AI 评价）"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
