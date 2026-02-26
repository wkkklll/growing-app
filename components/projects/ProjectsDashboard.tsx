"use client"

import { useCallback, useEffect, useState } from "react"
import { getProjectColor } from "@/lib/project-color"

import { BehaviorPointsPanel } from "@/components/metrics/BehaviorPointsPanel"
import { IdentityReflection } from "@/components/core/IdentityReflection"
import { PlannerForm } from "@/components/projects/PlannerForm"

interface Project {
  id: string
  title: string
  progressPercent: number
  status: string
  milestones: { id: string; title: string; completed: boolean }[]
  wbsTree?: WbsNode[] | null
  targetDescription: string | null
  endDate: string | null // Will be ISO string from Date
  behaviorMetrics: string[] | null
  resultMetrics: string[] | null
  capabilityMetrics: string[] | null
}

interface WbsNode {
  title: string
  children?: WbsNode[]
}

interface Todo {
  milestoneId: string
  projectId: string
  projectTitle: string
  title: string
}

interface MoodPoint {
  date: string
  moodIndex: number
}

export function ProjectsDashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [todos, setTodos] = useState<Todo[]>([])
  const [moodData, setMoodData] = useState<MoodPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null)
  const [showNewProjectForm, setShowNewProjectForm] = useState(false)

  const refresh = useCallback(() => {
    fetch("/api/projects/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setProjects(d.projects ?? [])
        setTodos(d.todos ?? [])
        setMoodData(d.moodData ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const toggleComplete = async (milestoneId: string) => {
    const res = await fetch(`/api/milestones/${milestoneId}/complete`, {
      method: "POST",
    })
    if (res.ok) refresh()
  }

  const toggleProject = (projectId: string) => {
    setExpandedProjectId((prev) => (prev === projectId ? null : projectId))
  }

  const deleteProject = async (projectId: string, projectTitle: string) => {
    const confirmed = window.confirm(`确定删除项目「${projectTitle}」吗？`)
    if (!confirmed) return
    const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" })
    if (res.ok) {
      setExpandedProjectId((prev) => (prev === projectId ? null : prev))
      refresh()
    }
  }

  const renderWbsNodes = (nodes: WbsNode[]) => (
    <ul className="mt-3 space-y-2 text-sm text-slate-700">
      {nodes.map((node, index) => (
        <li key={`${node.title}-${index}`}>
          <div className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
            <span>{node.title}</span>
          </div>
          {node.children && node.children.length > 0 && (
            <div className="ml-4">{renderWbsNodes(node.children)}</div>
          )}
        </li>
      ))}
    </ul>
  )

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        加载中...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">项目仪表盘</h1>
        <button
          onClick={() => setShowNewProjectForm(true)}
          className="rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-sky-700 shadow-lg shadow-sky-200 transition-all active:scale-95"
        >
          新建项目
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-stretch">
        {/* Left Column: Projects & Todos (8 columns) */}
        <div className="lg:col-span-8 space-y-8 flex flex-col">
          {showNewProjectForm && (
            <section className="animate-in fade-in slide-in-from-top-4 duration-300 shrink-0">
              <PlannerForm
                onProjectCreated={() => {
                  setShowNewProjectForm(false)
                  refresh()
                }}
                onCancel={() => setShowNewProjectForm(false)}
              />
            </section>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col flex-grow">
            <div className="flex items-center justify-between shrink-0 mb-4">
              <h2 className="text-xl font-bold text-slate-800">项目进度</h2>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{projects.length} PROJECTS</span>
            </div>
            {projects.length === 0 ? (
              <div className="px-4 py-8 text-center flex-grow flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-300 mb-4 shadow-sm shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p className="text-sm text-slate-500 font-medium mb-4 shrink-0">暂无正在进行的项目</p>
                <button
                  onClick={() => setShowNewProjectForm(true)}
                  className="text-sky-600 font-bold text-sm hover:underline shrink-0"
                >
                  立即开启第一个项目
                </button>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 flex-grow max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className={`group relative cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full ${expandedProjectId === p.id ? 'sm:col-span-2' : ''}`}
                    onClick={() => toggleProject(p.id)}
                  >
                    <div className="flex items-start justify-between mb-4 shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: getProjectColor(p.id) }} />
                        <h3 className="font-bold text-slate-800 group-hover:text-sky-600 transition-colors truncate">{p.title}</h3>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <a
                          href={`/projects/${p.id}`}
                          className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-all"
                          onClick={(e) => e.stopPropagation()}
                          title="详情"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                        <button
                          type="button"
                          className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteProject(p.id, p.title)
                          }}
                          title="删除"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="mt-auto space-y-2 flex-grow">
                      <div className="flex justify-between text-xs font-bold text-slate-400 shrink-0">
                        <span>进度</span>
                        <span>{p.progressPercent}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100 shrink-0">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${p.progressPercent}%`,
                            backgroundColor: getProjectColor(p.id),
                          }}
                        />
                      </div>

                      {expandedProjectId === p.id && (
                        <div className="mt-6 pt-6 border-t border-slate-100 animate-in fade-in zoom-in-95 duration-200 w-full flex-grow">
                          <div className="grid gap-8 sm:grid-cols-2 h-full">
                            <div className="space-y-4 h-full flex flex-col">
                              {p.targetDescription && (
                                <div className="shrink-0">
                                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">核心目标</h4>
                                  <p className="text-sm text-slate-700 leading-relaxed">{p.targetDescription}</p>
                                </div>
                              )}
                              {p.endDate && (
                                <div className="shrink-0">
                                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">截止日期</h4>
                                  <p className="text-sm text-slate-700">{new Date(p.endDate).toLocaleDateString("zh-CN", { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                              )}
                              {(p.behaviorMetrics && p.behaviorMetrics.length > 0) && (
                                <div className="mt-4 flex-grow">
                                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">行为指标：</h3>
                                  <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                                    {p.behaviorMetrics.map((metric, i) => (
                                      <li key={i}>{metric}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {(p.resultMetrics && p.resultMetrics.length > 0) && (
                                <div className="mt-4 flex-grow">
                                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">结果指标：</h3>
                                  <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                                    {p.resultMetrics.map((metric, i) => (
                                      <li key={i}>{metric}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {(p.capabilityMetrics && p.capabilityMetrics.length > 0) && (
                                <div className="mt-4 flex-grow">
                                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">能力指标：</h3>
                                  <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                                    {p.capabilityMetrics.map((metric, i) => (
                                      <li key={i}>{metric}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                            <div className="space-y-4 h-full flex flex-col">
                              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 shrink-0">任务拆解</h4>
                              {p.wbsTree && p.wbsTree.length > 0 ? (
                                renderWbsNodes(p.wbsTree)
                              ) : p.milestones.length > 0 ? (
                                <ul className="space-y-2 flex-grow overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                  {p.milestones.map((m) => (
                                    <li key={m.id} className="flex items-center gap-2 text-sm text-slate-600">
                                      <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${m.completed ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                                      <span className={`truncate ${m.completed ? 'line-through opacity-50' : ''}`}>{m.title}</span>
                                    </li>
                                  ))
                                  }
                                </ul>
                              ) : (
                                <p className="text-sm text-slate-400 italic">暂无拆解任务</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">当日 Todo</h2>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{todos.length} TASKS</span>
            </div>
            {todos.length === 0 ? (
              <div className="px-4 py-8 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                <p className="text-sm text-slate-400 font-medium">今日暂无待办任务，享受轻松的一天吧</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <ul className="divide-y divide-slate-100">
                  {todos.map((t) => (
                    <li
                      key={t.milestoneId}
                      className="group flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        className="h-5 w-5 cursor-pointer rounded-full border-slate-300 text-sky-600 focus:ring-sky-500 transition-all shrink-0"
                        onChange={() => toggleComplete(t.milestoneId)}
                      />
                      <div className="flex-grow min-w-0">
                        <p className="text-sm font-bold text-slate-700 truncate">{t.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: getProjectColor(t.projectId) }} />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate">{t.projectTitle}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Identity & Mood (4 columns) */}
        <div className="lg:col-span-4 space-y-8 flex flex-col">
          <section className="flex-grow rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <IdentityReflection />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm shrink-0">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800">心情水位</h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last 7 Days</span>
            </div>
            {moodData.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-xs text-slate-400 italic">暂无心情记录，去复盘记录一下吧</p>
              </div>
            ) : (
              <div className="flex h-32 items-end justify-between gap-2 px-2">
                {moodData.map((m) => (
                  <div key={m.date} className="group relative flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full min-h-[4px] rounded-t-lg bg-sky-400 transition-all duration-500 hover:bg-sky-500"
                      style={{ height: `${(m.moodIndex / 10) * 100}%` }}
                    />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-slate-800 px-2 py-1 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10">
                      {m.moodIndex}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">
                      {m.date.slice(8)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="shrink-0">
            <BehaviorPointsPanel onPointsUpdate={refresh} />
          </section>
        </div>
      </div>
    </div>
  )
}
