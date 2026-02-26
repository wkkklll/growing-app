"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { getProjectColor } from "@/lib/project-color"
import { parseJsonStringArray } from "@/lib/utils"
import { WbsEditor } from "@/components/projects/WbsEditor"

interface WbsNode {
  title: string
  children?: WbsNode[]
  id?: string
}

interface Milestone {
  id: string
  title: string
  completed: boolean
  orderIndex: number
}

interface Project {
  id: string
  title: string
  progressPercent: number
  status: string
  dailyMinutes: number | null
  wbsTree: WbsNode[] | null
  milestones: Milestone[]
  targetDescription: string | null
  endDate: string | null // Will be ISO string from Date
  behaviorMetrics: string[] | null
  resultMetrics: string[] | null
  capabilityMetrics: string[] | null
}

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params?.id as string | undefined
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditingWbs, setIsEditingWbs] = useState(false)
  const [isEditingInfo, setIsEditingInfo] = useState(false)
  const [editInfo, setEditInfo] = useState({
    title: "",
    targetDescription: "",
    endDate: "",
    dailyMinutes: 0,
  })
  const [isEditingMetrics, setIsEditingMetrics] = useState(false)
  const [editMetrics, setEditMetrics] = useState({
    behaviorMetrics: [] as string[],
    resultMetrics: [] as string[],
    capabilityMetrics: [] as string[],
  })

  const fetchProject = useCallback(async () => {
    if (!projectId) return
    const res = await fetch(`/api/projects/${projectId}`)
    const d = await res.json()
    if (d.error) setProject(null)
    else {
      const behaviorMetrics = parseJsonStringArray(d.behaviorMetrics) || []
      const resultMetrics = parseJsonStringArray(d.resultMetrics) || []
      const capabilityMetrics = parseJsonStringArray(d.capabilityMetrics) || []
      const wbsTree = d.wbsTree ? JSON.parse(d.wbsTree) : null

      setProject({
        ...d,
        wbsTree,
        behaviorMetrics,
        resultMetrics,
        capabilityMetrics,
      })
      setEditInfo({
        title: d.title || "",
        targetDescription: d.targetDescription || "",
        endDate: d.endDate ? new Date(d.endDate).toISOString().split("T")[0] : "",
        dailyMinutes: d.dailyMinutes || 0,
      })
      setEditMetrics({
        behaviorMetrics,
        resultMetrics,
        capabilityMetrics,
      })
    }
    setLoading(false)
  }, [projectId, setProject, setEditInfo, setEditMetrics, setLoading])

  useEffect(() => {
    fetchProject()
  }, [projectId, fetchProject])

  const saveProjectInfo = async () => {
    if (!projectId) return
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editInfo),
    })
    if (res.ok) {
      await fetchProject()
      setIsEditingInfo(false)
    }
  }

  const saveProjectMetrics = async () => {
    if (!projectId) return
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editMetrics),
    })
    if (res.ok) {
      await fetchProject()
      setIsEditingMetrics(false)
    }
  }

  const toggleMilestone = async (milestoneId: string) => {
    if (!project) return
    const m = project.milestones.find((x) => x.id === milestoneId)
    if (!m) return
    const res = await fetch(`/api/milestones/${milestoneId}/complete`, {
      method: "POST",
    })
    if (res.ok) {
      setProject((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          milestones: prev.milestones.map((x) =>
            x.id === milestoneId ? { ...x, completed: true } : x
          ),
          progressPercent:
            prev.milestones.filter((x) => x.completed || x.id === milestoneId).length *
            Math.round(100 / prev.milestones.length),
        }
      })
    }
  }

  const deleteProject = async () => {
    if (!project) return
    const confirmed = window.confirm(`确定删除项目「${project.title}」吗？`)
    if (!confirmed) return
    const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" })
    if (res.ok) {
      window.location.href = "/"
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        加载中...
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center">
        <p className="mb-4 text-slate-600">项目不存在</p>
        <Link href="/" className="text-sky-600 hover:underline">
          返回仪表盘
        </Link>
      </div>
    )
  }

  const completedCount = project.milestones.filter((m) => m.completed).length
  const totalCount = project.milestones.length
  const remainingCount = totalCount - completedCount

  const renderWbsNodes = (nodes: WbsNode[]) => (
    <ul className="mt-2 space-y-1 text-sm text-slate-700">
      {nodes.map((node, index) => (
        <li key={`${node.title}-${index}`}>
          <div className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
            <span>{node.title}</span>
          </div>
          {node.children && node.children.length > 0 && (
            <div className="ml-4">{renderWbsNodes(node.children)}</div>
          )}
        </li>
      ))}
    </ul>
  )

  const mapWbsTreeWithMilestoneIds = (wbsNodes: WbsNode[] | null, milestones: Milestone[]): WbsNode[] => {
    if (!wbsNodes) return []
    return wbsNodes.map(node => {
      const matchedMilestone = milestones.find(m => m.title === node.title)
      return {
        ...node,
        id: matchedMilestone?.id,
        children: node.children ? mapWbsTreeWithMilestoneIds(node.children, milestones) : undefined
      }
    })
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
          ← 返回仪表盘
        </Link>
        <button
          onClick={deleteProject}
          className="text-sm text-rose-600 hover:underline"
        >
          删除项目
        </button>
      </div>

      <div
        className="mb-8 rounded-xl border-l-4 border-slate-200 bg-white p-6 shadow-sm"
        style={{ borderLeftColor: getProjectColor(project.id) }}
      >
        {isEditingInfo ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">项目名称</label>
              <input
                type="text"
                value={editInfo.title}
                onChange={(e) => setEditInfo({ ...editInfo, title: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">终局目标</label>
              <textarea
                value={editInfo.targetDescription}
                onChange={(e) => setEditInfo({ ...editInfo, targetDescription: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">截止日期</label>
                <input
                  type="date"
                  value={editInfo.endDate}
                  onChange={(e) => setEditInfo({ ...editInfo, endDate: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">每日投入 (min)</label>
                <input
                  type="number"
                  value={editInfo.dailyMinutes}
                  onChange={(e) => setEditInfo({ ...editInfo, dailyMinutes: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveProjectInfo}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-700"
              >
                保存
              </button>
              <button
                onClick={() => setIsEditingInfo(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-2 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-slate-800">{project.title}</h1>
              <button
                onClick={() => setIsEditingInfo(true)}
                className="text-sm text-sky-600 hover:underline"
              >
                编辑信息
              </button>
            </div>
            {project.targetDescription && (
              <p className="mb-2 text-sm text-slate-700">目标：{project.targetDescription}</p>
            )}
            {project.endDate && (
              <p className="mb-2 text-sm text-slate-700">截止日期：{new Date(project.endDate).toLocaleDateString()}</p>
            )}
            <div className="mb-4 flex flex-wrap gap-4 text-sm text-slate-500">
              <span>进度 {project.progressPercent}%</span>
              {project.dailyMinutes != null && (
                <span>每日 {project.dailyMinutes} 分钟</span>
              )}
              <span className="rounded bg-slate-100 px-2 py-0.5">{project.status}</span>
            </div>
          </>
        )}
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${project.progressPercent}%`,
              backgroundColor: getProjectColor(project.id),
            }}
          />
        </div>
      </div>

      <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">量化指标</h2>
          {!isEditingMetrics && (
            <button
              onClick={() => setIsEditingMetrics(true)}
              className="text-sm text-sky-600 hover:underline"
            >
              编辑指标
            </button>
          )}
        </div>

        {isEditingMetrics ? (
          <div className="space-y-6">
            {(["behaviorMetrics", "resultMetrics", "capabilityMetrics"] as const).map((key) => (
              <div key={key}>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  {key === "behaviorMetrics" ? "行为指标" : key === "resultMetrics" ? "结果指标" : "能力指标"}
                </label>
                <div className="space-y-2">
                  {editMetrics[key].map((metric, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={metric}
                        onChange={(e) => {
                          const newMetrics = [...editMetrics[key]]
                          newMetrics[i] = e.target.value
                          setEditMetrics({ ...editMetrics, [key]: newMetrics })
                        }}
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-1 text-sm focus:border-sky-500 focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          const newMetrics = editMetrics[key].filter((_, idx) => idx !== i)
                          setEditMetrics({ ...editMetrics, [key]: newMetrics })
                        }}
                        className="text-rose-600 hover:text-rose-700"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setEditMetrics({ ...editMetrics, [key]: [...editMetrics[key], ""] })
                    }}
                    className="text-sm text-sky-600 hover:underline"
                  >
                    + 添加指标
                  </button>
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <button
                onClick={saveProjectMetrics}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-700"
              >
                保存指标
              </button>
              <button
                onClick={() => setIsEditingMetrics(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <h3 className="mb-2 text-sm font-medium text-slate-700">行为指标</h3>
              <ul className="list-disc pl-5 text-sm text-slate-600">
                {project.behaviorMetrics?.map((metric, i) => <li key={i}>{metric}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium text-slate-700">结果指标</h3>
              <ul className="list-disc pl-5 text-sm text-slate-600">
                {project.resultMetrics?.map((metric, i) => <li key={i}>{metric}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium text-slate-700">能力指标</h3>
              <ul className="list-disc pl-5 text-sm text-slate-600">
                {project.capabilityMetrics?.map((metric, i) => <li key={i}>{metric}</li>)}
              </ul>
            </div>
          </div>
        )}
      </section>

      <div className="mb-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="text-2xl font-semibold text-slate-800">{completedCount}</div>
          <div className="text-sm text-slate-500">已完成</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="text-2xl font-semibold text-slate-800">{remainingCount}</div>
          <div className="text-sm text-slate-500">待完成</div>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">任务拆解</h2>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          {isEditingWbs && project.wbsTree && projectId ? (
            <WbsEditor
              projectId={projectId}
              initialWbsTree={mapWbsTreeWithMilestoneIds(project.wbsTree, project.milestones)}
              onSave={async (updatedWbsTree) => {
                if (!projectId) return
                const res = await fetch(`/api/projects/${projectId}/wbs`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ wbsTree: JSON.stringify(updatedWbsTree) }),
                })
                if (res.ok) {
                  // Re-fetch project to get updated milestones
                  const updatedRes = await fetch(`/api/projects/${projectId}`)
                  const updatedData = await updatedRes.json()
                  setProject({
                    ...updatedData,
                    wbsTree: updatedData.wbsTree ? JSON.parse(updatedData.wbsTree) : null,
                    behaviorMetrics: parseJsonStringArray(updatedData.behaviorMetrics),
                    resultMetrics: parseJsonStringArray(updatedData.resultMetrics),
                    capabilityMetrics: parseJsonStringArray(updatedData.capabilityMetrics),
                  })
                }
                setIsEditingWbs(false)
              }}
              onCancel={() => setIsEditingWbs(false)}
            />
          ) : project.wbsTree && project.wbsTree.length > 0 ? (
            renderWbsNodes(project.wbsTree)
          ) : (
            <ul className="space-y-2">
              {project.milestones.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-3 border-b border-slate-100 py-2 last:border-0"
                >
                  <input
                    type="checkbox"
                    checked={m.completed}
                    disabled={m.completed}
                    onChange={() => toggleMilestone(m.id)}
                    className="h-4 w-4 cursor-pointer rounded border-slate-300"
                  />
                  <span
                    className={
                      m.completed ? "text-slate-400 line-through" : "text-slate-800"
                    }
                  >
                    {m.title}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {!isEditingWbs && project.wbsTree && (
          <button
            onClick={() => setIsEditingWbs(true)}
            className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            编辑任务拆解
          </button>
        )}
      </section>

      <div className="mb-8">
        <Link
          href={`/analysis?projectId=${project.id}`}
          className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100"
        >
          AI 分析此项目
        </Link>
      </div>

      {project.milestones.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-800">里程碑列表</h2>
          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {project.milestones.map((m) => (
              <li
                key={m.id}
                className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={m.completed}
                  disabled={m.completed}
                  onChange={() => toggleMilestone(m.id)}
                  className="h-4 w-4 cursor-pointer rounded border-slate-300"
                />
                <span
                  className={
                    m.completed ? "text-slate-400 line-through" : "text-slate-800"
                  }
                >
                  {m.title}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
