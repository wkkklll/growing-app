"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { parseJsonStringArray } from "@/lib/utils"

interface WeeklyReviewItem {
  id: string
  projectId: string | null
  reviewDate: string
  positiveFeedback: string | null
  areasForImprovement: string | null
  actionableGuidance: string[] | null // Now an array of strings
  aiRawOutput: string | null
  createdAt: string
}

interface ProjectOption {
  id: string
  title: string
}

export default function WeeklyReviewPage() {
  const searchParams = useSearchParams()
  const projectIdFromUrl = searchParams.get("projectId")

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projectIdFromUrl)
  const [loading, setLoading] = useState(false)
  const [reviews, setReviews] = useState<WeeklyReviewItem[]>([])
  const [projects, setProjects] = useState<ProjectOption[]>([])

  useEffect(() => {
    setSelectedProjectId(projectIdFromUrl)
  }, [projectIdFromUrl])

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects ?? []))
      .catch(() => setProjects([]))
  }, [])

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    try {
      const url = selectedProjectId
        ? `/api/review/weekly?projectId=${selectedProjectId}`
        : "/api/review/weekly"
      const res = await fetch(url)
      const data = await res.json()
      setReviews(data.reviews ?? [])
    } catch (e) {
      console.error("Failed to fetch reviews", e)
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [selectedProjectId])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const generateReview = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/review/weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId || null,
        }),
      })
      if (res.ok) {
        fetchReviews()
      } else {
        alert("AI 复盘生成失败！")
      }
    } catch (e) {
      console.error("Failed to generate review", e)
      alert("AI 复盘生成失败！")
    } finally {
      setLoading(false)
    }
  }

  const handleExportReview = async (reviewId: string, reviewType: string) => {
    try {
      const res = await fetch(`/api/export/review?reviewId=${reviewId}&reviewType=${reviewType}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = res.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") || "review.md"
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
      } else {
        const errorData = await res.json()
        alert(`导出失败: ${errorData.error}`)
      }
    } catch (e) {
      console.error("Error exporting review:", e)
      alert("导出复盘失败！")
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-8 text-2xl font-bold text-slate-800">每周复盘</h1>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-slate-800">生成周复盘</h2>
        {projects.length > 0 && (
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-600">
              关联项目 (可选)
            </label>
            <select
              value={selectedProjectId ?? ""}
              onChange={(e) => setSelectedProjectId(e.target.value || null)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="">不关联任何项目</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        )}
        <button
          onClick={generateReview}
          disabled={loading}
          className="rounded-lg bg-sky-600 px-6 py-3 text-white hover:bg-sky-700 disabled:opacity-50"
        >
          {loading ? "AI 生成中..." : "AI 自动生成本周复盘"}
        </button>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">历史周复盘</h2>
        {loading && reviews.length === 0 ? (
          <p className="py-8 text-center text-slate-500">加载中...</p>
        ) : reviews.length === 0 ? (
          <p className="py-8 text-center text-slate-500">暂无历史周复盘记录。</p>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-lg border border-slate-100 bg-slate-50/50 p-4"
              >
                <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
                  <span>复盘日期：{new Date(review.reviewDate).toLocaleDateString()}</span>
                  <button
                    onClick={() => handleExportReview(review.id, "weekly")}
                    className="ml-auto rounded-md bg-blue-500 px-3 py-1 text-xs text-white hover:bg-blue-600"
                  >
                    导出 Markdown
                  </button>
                  {review.projectId && (
                    <span className="rounded bg-slate-100 px-2 py-0.5">
                      项目：{projects.find(p => p.id === review.projectId)?.title || review.projectId}
                    </span>
                  )}
                </div>
                {review.positiveFeedback && (
                  <div className="mb-2">
                    <h3 className="text-sm font-medium text-green-700">做得好的地方：</h3>
                    <p className="whitespace-pre-wrap text-slate-700">{review.positiveFeedback}</p>
                  </div>
                )}
                {review.areasForImprovement && (
                  <div className="mb-2">
                    <h3 className="text-sm font-medium text-amber-700">需要改进的地方：</h3>
                    <p className="whitespace-pre-wrap text-slate-700">{review.areasForImprovement}</p>
                  </div>
                )}
                {review.actionableGuidance && review.actionableGuidance.length > 0 && (
                  <div className="mb-2">
                    <h3 className="text-sm font-medium text-sky-700">行动指南：</h3>
                    <ul className="list-disc pl-5 text-slate-700">
                      {review.actionableGuidance.map((guidance, i) => (
                        <li key={i}>{guidance}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Debugging raw output if needed */}
                {/* {review.aiRawOutput && (
                  <div className="mt-4 p-2 bg-slate-100 text-xs text-slate-500 rounded-md">
                    <h4 className="font-medium">AI Raw Output:</h4>
                    <pre className="whitespace-pre-wrap">{review.aiRawOutput}</pre>
                  </div>
                )} */}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
