"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { getProjectColor } from "@/lib/project-color"
import { parseJsonStringArray } from "@/lib/utils"

interface WbsNode {
  title: string
  children?: WbsNode[]
}

interface Project {
  id: string
  title: string
  progressPercent: number
  status: string
  dailyMinutes: number | null
  wbsTree: WbsNode[] | null
  milestones: { id: string; title: string; completed: boolean }[]
  targetDescription: string | null
  endDate: string | null // Will be ISO string from Date
  behaviorMetrics: string[] | null
  resultMetrics: string[] | null
  capabilityMetrics: string[] | null
  stagnationDays: number
}

export function ProjectOverview() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/projects/dashboard")
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      const data = await res.json()

      const processedProjects: Project[] = (data.projects || []).map((p: any) => ({
        ...p,
        wbsTree: p.wbsTree ? JSON.parse(p.wbsTree) : null,
        behaviorMetrics: parseJsonStringArray(p.behaviorMetrics),
        resultMetrics: parseJsonStringArray(p.resultMetrics),
        capabilityMetrics: parseJsonStringArray(p.capabilityMetrics),
      }))
      setProjects(processedProjects)
    } catch (e: any) {
      setError(e.message || "Failed to fetch projects")
      console.error("Error fetching projects:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  if (loading) {
    return <div className="p-4 text-center text-slate-500">加载项目概览...</div>
  }

  if (error) {
    return <div className="p-4 text-red-600">错误：{error}</div>
  }

  const activeProjects = projects.filter(p => p.status === "active")

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">进行中项目</h2>
      {activeProjects.length === 0 ? (
        <p className="text-slate-500">暂无进行中项目。</p>
      ) : (
        <div className="space-y-4">
          {activeProjects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="block cursor-pointer rounded-lg border-l-4 border-slate-200 bg-white p-4 shadow-sm hover:shadow-md"
              style={{ borderLeftColor: getProjectColor(p.id) }}
            >
              <div className="mb-2 flex items-center justify-between gap-4">
                <span className="font-medium text-slate-800">{p.title}</span>
                {p.stagnationDays > 0 && (
                  <span className="rounded bg-rose-100 px-2 py-0.5 text-xs text-rose-700">停滞 {p.stagnationDays} 天</span>
                )}
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100 mb-2">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${p.progressPercent}%`,
                    backgroundColor: getProjectColor(p.id),
                  }}
                />
              </div>
              <div className="text-sm text-slate-500">
                进度 {p.progressPercent}% {p.endDate && ` | 截止：${new Date(p.endDate).toLocaleDateString()}`}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
