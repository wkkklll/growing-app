"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { getProjectColor } from "@/lib/project-color"
import { TaskCompletionModal } from "@/components/plan/TaskCompletionModal"
import { DailyTaskItem } from "@/components/plan/DailyTaskItem"
import { DailyTimeline } from "@/components/plan/DailyTimeline"
import { DailyTodoList } from "@/components/plan/DailyTodoList"

import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, DropAnimation, defaultDropAnimation, UniqueIdentifier } from "@dnd-kit/core"

interface Todo {
  milestoneId: string
  projectId: string
  projectTitle: string
  title: string
  dailyMinutes?: number | null
  twoMinuteVersion?: string | null
  antiProcrastinationScript?: string | null
}

interface CustomTodo {
  id: string
  title: string
  projectId?: string | null
  projectTitle?: string | null
  twoMinuteVersion?: string | null
  antiProcrastinationScript?: string | null
}

interface ProjectOption {
  id: string
  title: string
}

export interface ScheduledTask {
  id: string
  planDate: string
  taskId: string
  taskType: "milestone" | "standalone"
  taskTitle: string
  startTime: string
  endTime: string
  originalEstimatedMinutes?: number | null
}

const dropAnimation: DropAnimation = {
  ...defaultDropAnimation,
}

export default function PlanPage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [todos, setTodos] = useState<Todo[]>([])
  const [customTodos, setCustomTodos] = useState<CustomTodo[]>([])
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([])
  const [totalDailyMinutes, setTotalDailyMinutes] = useState<number | null>(null)
  const [projectsWithTime, setProjectsWithTime] = useState<
    { id: string; title: string; dailyMinutes: number | null }[]
  >([])
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [newTodoTitle, setNewTodoTitle] = useState("")
  const [newTodoProjectId, setNewTodoProjectId] = useState("")
  const [continueModal, setContinueModal] = useState<{
    completedTitle: string
    nextTodo: Todo
  } | null>(null)

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const fetchDailyPlanData = useCallback(async () => {
    const res = await fetch(`/api/todos/daily?date=${date}`)
    const d = await res.json()
    setTodos(d.todos ?? [])
    setCustomTodos(d.customTodos ?? [])
    setTotalDailyMinutes(d.totalDailyMinutes ?? null)
    setProjectsWithTime(d.projectsWithTime ?? [])
    setProjects(d.projects ?? [])

    const scheduledRes = await fetch(`/api/schedule/daily?planDate=${date}`)
    const scheduledData = await scheduledRes.json()
    setScheduledTasks(scheduledData.scheduledTasks ?? [])
  }, [date])

  useEffect(() => {
    fetchDailyPlanData()
  }, [fetchDailyPlanData])

  const toggleComplete = async (todo: Todo) => {
    const currentProjectMilestones = todos
      .filter((t) => t.projectId === todo.projectId)
      .map((t) => t.milestoneId)
    const res = await fetch(`/api/milestones/${todo.milestoneId}/complete`, {
      method: "POST",
    })
    if (res.ok) {
      setTodos((prev) => prev.filter((t) => t.milestoneId !== todo.milestoneId))
      setScheduledTasks((prev) => prev.filter(st => !(st.taskId === todo.milestoneId && st.taskType === "milestone")))

      const excludeIds = [...currentProjectMilestones, todo.milestoneId]
      const extraRes = await fetch(
        `/api/todos/daily?date=${date}&projectId=${todo.projectId}&exclude=${excludeIds.join(",")}`
      )
      const extraData = await extraRes.json()
      const nextTodo = extraData.extraTodos?.[0]
      if (nextTodo) {
        setContinueModal({
          completedTitle: todo.title,
          nextTodo,
        })
      }
    }
  }

  const handleContinueModal = () => {
    if (!continueModal) return
    setTodos((prev) => [...prev, continueModal.nextTodo])
    setContinueModal(null)
  }

  const addTodo = async () => {
    const title = newTodoTitle.trim()
    if (!title) return
    const res = await fetch("/api/todos/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        date,
        projectId: newTodoProjectId || null,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      if (data.type === "milestone") {
        setTodos((prev) => [...prev, data.todo])
      } else {
        setCustomTodos((prev) => [...prev, { id: data.todo.id, title: data.todo.title, twoMinuteVersion: data.todo.twoMinuteVersion, antiProcrastinationScript: data.todo.antiProcrastinationScript }])
      }
      setNewTodoTitle("")
      setNewTodoProjectId("")
    }
  }

  const completeCustomTodo = async (todoId: string) => {
    const res = await fetch(`/api/standalone/${todoId}/complete`, { method: "POST" })
    if (res.ok) {
      setCustomTodos((prev) => prev.filter((t) => t.id !== todoId))
      setScheduledTasks((prev) => prev.filter(st => !(st.taskId === todoId && st.taskType === "standalone")))
    }
  }

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = async (event: any) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    // 1. Handle dragging within timeline (re-scheduling)
    if (active.id.toString().startsWith("scheduled-")) {
      const scheduledId = active.id.replace("scheduled-", "")
      const task = scheduledTasks.find(t => t.id === scheduledId)
      const startTimeStr = over.id.startsWith("time-slot-") ? over.id.replace("time-slot-", "") : null

      if (task && startTimeStr) {
        const [startHour, startMinute] = startTimeStr.split(":").map(Number)
        
        const durationMs = new Date(task.endTime).getTime() - new Date(task.startTime).getTime()
        
        // Use local date parts to avoid UTC shifting
        const [y, m, d] = date.split('-').map(Number)
        const newStart = new Date(y, m - 1, d, startHour, startMinute, 0, 0)
        const newEnd = new Date(newStart.getTime() + durationMs)

        const res = await fetch("/api/schedule/daily", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            id: scheduledId, 
            startTime: newStart.toISOString(),
            endTime: newEnd.toISOString() 
          }),
        })
        if (res.ok) {
          const data = await res.json()
          setScheduledTasks(prev => prev.map(t => t.id === scheduledId ? data.scheduledTask : t))
        }
      }
      return
    }

    // 2. Handle dragging from list to timeline
    const draggedItem = [...todos, ...customTodos].find(item => 
      (item as Todo).milestoneId === active.id || (item as CustomTodo).id === active.id
    )

    if (!draggedItem) return

    const isMilestone = (draggedItem as Todo).milestoneId !== undefined
    const taskId = isMilestone ? (draggedItem as Todo).milestoneId : (draggedItem as CustomTodo).id
    const taskType = isMilestone ? "milestone" : "standalone"
    const taskTitle = draggedItem.title
    const originalEstimatedMinutes = isMilestone ? (draggedItem as Todo).dailyMinutes : null

    const startTimeStr = over.id.startsWith("time-slot-") ? over.id.replace("time-slot-", "") : null

    if (startTimeStr) {
      const [startHour, startMinute] = startTimeStr.split(":").map(Number)
      const [y, m, d] = date.split('-').map(Number)
      
      const newStart = new Date(y, m - 1, d, startHour, startMinute, 0, 0)
      const durationMinutes = originalEstimatedMinutes || 30
      const newEnd = new Date(newStart.getTime() + durationMinutes * 60 * 1000)

      const scheduledRes = await fetch("/api/schedule/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planDate: date,
          taskId,
          taskType,
          taskTitle,
          startTime: newStart.toISOString(),
          endTime: newEnd.toISOString(),
          originalEstimatedMinutes,
        }),
      })

      if (scheduledRes.ok) {
        const newScheduledTask = await scheduledRes.json()
        setScheduledTasks((prev) => [...prev, newScheduledTask.scheduledTask])
        if (isMilestone) {
          setTodos((prev) => prev.filter(t => t.milestoneId !== taskId))
        } else {
          setCustomTodos((prev) => prev.filter(t => t.id !== taskId))
        }
      } else {
        alert("安排任务失败！")
      }
    }
  }

  const handleRemoveScheduledTask = async (scheduledTask: ScheduledTask) => {
    const res = await fetch(`/api/schedule/daily?id=${scheduledTask.id}`, {
      method: "DELETE",
    })
    if (res.ok) {
      setScheduledTasks((prev) => prev.filter(task => task.id !== scheduledTask.id))
      
      // Add back to todo list
      if (scheduledTask.taskType === "milestone") {
        setTodos((prev) => [...prev, {
          milestoneId: scheduledTask.taskId,
          projectId: "", 
          projectTitle: "", 
          title: scheduledTask.taskTitle,
          dailyMinutes: scheduledTask.originalEstimatedMinutes
        }])
      } else {
        setCustomTodos((prev) => [...prev, {
          id: scheduledTask.taskId,
          title: scheduledTask.taskTitle,
        }])
      }
      
      fetchDailyPlanData()
    } else {
      alert("删除已安排任务失败！")
    }
  }

  const activeItem = activeId
    ? [...todos.map(t => ({...t, id: t.milestoneId, type: "milestone"})), ...customTodos.map(t => ({...t, type: "standalone"}))]
      .find(item => item.id === activeId)
    : null

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">每日计划</h1>
        <div className="flex items-center gap-4 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border-none bg-transparent px-4 py-1.5 text-sm font-bold text-slate-700 focus:ring-0 focus:outline-none"
          />
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: TODO List (5 columns) */}
          <div className="lg:col-span-5 space-y-8 flex flex-col">
            {totalDailyMinutes != null && totalDailyMinutes > 0 && (
              <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-6 shadow-sm shrink-0">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">今日计划投入</h3>
                    <p className="text-2xl font-black text-sky-600">{totalDailyMinutes} <span className="text-xs font-bold uppercase">min</span></p>
                  </div>
                </div>
                {projectsWithTime.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {projectsWithTime.map((p) => (
                      <span key={p.id} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-sky-100 text-[10px] font-bold text-sky-700 shadow-sm">
                        <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: getProjectColor(p.id) }} />
                        {p.title}: {p.dailyMinutes}m
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shrink-0">
              <h3 className="mb-4 text-sm font-bold text-slate-400 uppercase tracking-widest">新增计划</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={newTodoTitle}
                  onChange={(e) => setNewTodoTitle(e.target.value)}
                  placeholder="例如：阅读 30 分钟"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 focus:outline-none transition-all"
                />
                <div className="flex gap-2">
                  <select
                    value={newTodoProjectId}
                    onChange={(e) => setNewTodoProjectId(e.target.value)}
                    className="flex-grow rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:border-sky-500 focus:outline-none transition-all"
                  >
                    <option value="">不归属项目</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={addTodo}
                    disabled={!newTodoTitle.trim()}
                    className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all active:scale-95 disabled:opacity-30"
                  >
                    添加
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-1 shadow-sm overflow-hidden flex-grow h-[400px] flex flex-col">
              <DailyTodoList 
                todos={todos}
                customTodos={customTodos}
                onToggleComplete={toggleComplete}
                onCompleteCustomTodo={completeCustomTodo}
              />
            </div>
          </div>

          {/* Right Column: Timeline (7 columns) */}
          <div className="lg:col-span-7 flex flex-col h-full">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex-grow h-[800px] flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800">时间轴排期</h2>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Schedule</span>
                </div>
              </div>
              <DailyTimeline 
                date={date}
                scheduledTasks={scheduledTasks}
                onRemoveScheduledTask={handleRemoveScheduledTask}
                projects={projects}
                onUpdateTaskDuration={async (id, newEndTime) => {
                  const res = await fetch("/api/schedule/daily", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id, endTime: newEndTime }),
                  })
                  if (res.ok) {
                    const data = await res.json()
                    setScheduledTasks(prev => prev.map(t => t.id === id ? data.scheduledTask : t))
                  }
                }}
              />
            </div>
          </div>
        </div>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeItem ? (
            <div className="rounded-xl bg-slate-900 px-5 py-3 text-white shadow-2xl cursor-grabbing border border-white/10 flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-sky-400" />
              <span className="text-sm font-bold">{activeItem.title}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="mt-12 flex justify-center">
        <Link
          href="/logs"
          className="group flex items-center gap-2 rounded-2xl bg-slate-50 px-8 py-4 text-sm font-bold text-slate-600 hover:bg-sky-50 hover:text-sky-600 transition-all shadow-sm"
        >
          前往每日复盘记录完成情况
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>

      {continueModal && (
        <TaskCompletionModal
          completedTitle={continueModal.completedTitle}
          nextTitle={continueModal.nextTodo.title}
          projectTitle={continueModal.nextTodo.projectTitle}
          onContinue={handleContinueModal}
          onClose={() => setContinueModal(null)}
        />
      )}
    </div>
  )
}
