"use client"

import { useState } from "react"
import { getProjectColor } from "@/lib/project-color"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface DailyTaskItemProps {
  milestoneId?: string
  id?: string // for custom todos
  projectId?: string | null
  projectTitle?: string | null
  title: string
  dailyMinutes?: number | null
  twoMinuteVersion?: string | null
  antiProcrastinationScript?: string | null
  onToggleComplete: () => void
}

export function DailyTaskItem({
  milestoneId,
  id,
  projectId,
  projectTitle,
  title,
  dailyMinutes,
  twoMinuteVersion: initialTwoMinuteVersion,
  antiProcrastinationScript: initialAntiProcrastinationScript,
  onToggleComplete,
}: DailyTaskItemProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [twoMinuteVersion, setTwoMinuteVersion] = useState(initialTwoMinuteVersion)
  const [antiProcrastinationScript, setAntiProcrastinationScript] = useState(initialAntiProcrastinationScript)
  const [generatingBreakdown, setGeneratingBreakdown] = useState(false)

  const handleTwoMinuteBreakdown = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent toggling details
    if (!milestoneId && !id) return
    setGeneratingBreakdown(true)
    try {
      const res = await fetch("/api/task/two-minute-breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: milestoneId || id,
          taskType: milestoneId ? "milestone" : "standalone",
          taskTitle: title,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setTwoMinuteVersion(data.twoMinuteVersion)
        setAntiProcrastinationScript(data.antiProcrastinationScript)
        setShowDetails(true) // Show details after breakdown
      } else {
        console.error("Failed to generate two-minute breakdown")
      }
    } catch (error) {
      console.error("Error generating two-minute breakdown:", error)
    } finally {
      setGeneratingBreakdown(false)
    }
  }

  const displayProjectId = projectId ?? "default"

  return (
    <li
      className="group relative flex items-center gap-3 border-l-4 px-4 py-3 hover:bg-slate-50 transition-all duration-200"
      style={{ borderLeftColor: getProjectColor(displayProjectId) }}
    >
      {/* Drag Handle Icon (visible on hover) */}
      <div className="absolute left-[-12px] opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-slate-300">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>

      <input
        type="checkbox"
        className="h-5 w-5 cursor-pointer rounded-full border-slate-300 text-sky-600 focus:ring-sky-500 transition-all"
        onChange={onToggleComplete}
      />
      
      <div className="flex-1 cursor-pointer" onClick={() => setShowDetails(!showDetails)}>
        <div className="flex flex-col">
          <span className="text-slate-800 font-medium group-hover:text-sky-700 transition-colors">{title}</span>
          {projectTitle && (
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">{projectTitle}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {dailyMinutes != null && (
          <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">
            {dailyMinutes}m
          </span>
        )}
        <button
          onClick={handleTwoMinuteBreakdown}
          disabled={generatingBreakdown}
          className="rounded-full bg-white border border-slate-200 p-1.5 text-slate-400 hover:text-sky-600 hover:border-sky-200 hover:bg-sky-50 transition-all disabled:opacity-50 shadow-sm"
          title="两分钟启动 AI 拆解"
        >
          {generatingBreakdown ? (
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )}
        </button>
      </div>

      {showDetails && (
        <div className="absolute left-0 right-0 top-full z-[100] mt-1 rounded-xl border border-slate-200 bg-white p-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <div className="flex justify-between items-start mb-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">任务启动详情</h4>
            <button onClick={() => setShowDetails(false)} className="text-slate-300 hover:text-slate-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {twoMinuteVersion && (
            <div className="mb-4 bg-sky-50 rounded-lg p-3 border border-sky-100 prose prose-sm max-w-none">
              <h5 className="text-[10px] font-bold text-sky-600 uppercase mb-1">2 分钟启动版本</h5>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{twoMinuteVersion}</ReactMarkdown>
            </div>
          )}
          
          {antiProcrastinationScript && (
            <div className="bg-rose-50 rounded-lg p-3 border border-rose-100 prose prose-sm max-w-none">
              <h5 className="text-[10px] font-bold text-rose-600 uppercase mb-1">动摇脚本</h5>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{antiProcrastinationScript}</ReactMarkdown>
            </div>
          )}
          
          {!twoMinuteVersion && !antiProcrastinationScript && (
            <p className="text-xs text-slate-400 text-center py-2">点击右侧闪电图标，让 AI 帮你拆解任务</p>
          )}
        </div>
      )}
    </li>
  )
}
