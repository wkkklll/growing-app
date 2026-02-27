"use client"

import { useDraggable } from "@dnd-kit/core"
import { TimeSlot } from "@/components/plan/TimeSlot"
import { getProjectColor } from "@/lib/project-color"
import { ScheduledTask } from "@/app/plan/page"
import { useState, useRef, useEffect } from "react"

interface ProjectOption {
  id: string
  title: string
}

interface DailyTimelineProps {
  date: string
  scheduledTasks: ScheduledTask[]
  onRemoveScheduledTask: (task: ScheduledTask) => void
  projects: ProjectOption[]
  onUpdateTaskDuration: (id: string, newEndTime: string) => Promise<void>
}

const HOUR_HEIGHT = 60 // Reduced height for smaller spacing

function ScheduledDraggableItem({ task, style, onRemove, onResizeStart }: {
  task: ScheduledTask,
  style: any,
  onRemove: (task: ScheduledTask) => void,
  onResizeStart: (e: React.MouseEvent, task: ScheduledTask) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `scheduled-${task.id}`,
    data: { type: "scheduled", ...task },
  });

  const durationHours = (new Date(task.endTime).getTime() - new Date(task.startTime).getTime()) / (1000 * 60 * 60);

  const combinedStyle = {
    ...style,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : style.transform,
    zIndex: isDragging ? 50 : 10,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      id={`task-${task.id}`}
      className="absolute left-2 right-4 rounded-lg p-2 text-white shadow-md flex flex-col justify-between pointer-events-auto transition-all bg-sky-600 border-l-4 border-sky-800 touch-none"
      style={{
        ...combinedStyle,
        marginTop: '4px',
        marginBottom: '4px',
        height: typeof combinedStyle.height === 'string' 
          ? `calc(${combinedStyle.height} - 8px)` 
          : (combinedStyle.height - 8) + 'px'
      }}
      {...listeners}
      {...attributes}
    >
      <div className="flex justify-between items-start overflow-hidden">
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-xs leading-tight truncate">{task.taskTitle}</span>
          <span className="text-[9px] opacity-80 mt-0.5">
            {new Date(task.startTime).toLocaleTimeString("zh-CN", { hour: '2-digit', minute: '2-digit' })} - 
            {new Date(task.endTime).toLocaleTimeString("zh-CN", { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[9px] font-bold bg-white/20 px-1 rounded">{durationHours.toFixed(1)}h</span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onRemove(task);
            }}
            onMouseDown={(e) => e.stopPropagation()} // Prevent drag when clicking button
            className="p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Resize handle */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize flex justify-center items-center group"
        onMouseDown={(e) => onResizeStart(e, task)}
      >
        <div className="w-8 h-1 bg-white/30 rounded-full group-hover:bg-white/60 transition-colors"></div>
      </div>
    </div>
  );
}

export function DailyTimeline({
  date,
  scheduledTasks,
  onRemoveScheduledTask,
  projects,
  onUpdateTaskDuration,
}: DailyTimelineProps) {
  const hours = Array.from({ length: 18 }, (_, i) => i + 7) // 7:00 to 24:00
  const [resizingId, setResizingId] = useState<string | null>(null)
  const [initialY, setInitialY] = useState(0)
  const [initialHeight, setInitialHeight] = useState(0)
  const timelineRef = useRef<HTMLDivElement>(null)

  const getTaskStyle = (task: ScheduledTask) => {
    const start = new Date(task.startTime)
    const end = new Date(task.endTime)
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60)
    
    const planDateStart = new Date(date)
    planDateStart.setHours(7, 0, 0, 0) // Timeline starts at 7:00
    
    const offsetMinutes = (start.getTime() - planDateStart.getTime()) / (1000 * 60)

    const top = (offsetMinutes / 60) * HOUR_HEIGHT
    const height = (durationMinutes / 60) * HOUR_HEIGHT

    return {
      top: `${top}px`,
      height: `${Math.max(height, 30)}px`,
    }
  }

  const handleResizeStart = (e: React.MouseEvent, task: ScheduledTask) => {
    e.preventDefault()
    e.stopPropagation()
    setResizingId(task.id)
    setInitialY(e.clientY)
    const start = new Date(task.startTime)
    const end = new Date(task.endTime)
    setInitialHeight(((end.getTime() - start.getTime()) / (1000 * 60 * 60)) * HOUR_HEIGHT)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingId) return
      
      const deltaY = e.clientY - initialY
      const newHeight = Math.max(30, initialHeight + deltaY)
      
      const element = document.getElementById(`task-${resizingId}`)
      if (element) {
        element.style.height = `${newHeight}px`
      }
    }

    const handleMouseUp = async (e: MouseEvent) => {
      if (!resizingId) return
      
      const task = scheduledTasks.find(t => t.id === resizingId)
      if (task) {
        const deltaY = e.clientY - initialY
        const additionalMinutes = Math.round((deltaY / HOUR_HEIGHT) * 60 / 5) * 5
        
        const currentEnd = new Date(task.endTime)
        const newEnd = new Date(currentEnd.getTime() + additionalMinutes * 60 * 1000)
        
        const start = new Date(task.startTime)
        if (newEnd.getTime() > start.getTime() + 5 * 60 * 1000) {
          await onUpdateTaskDuration(resizingId, newEnd.toISOString())
        }
      }
      
      setResizingId(null)
    }

    if (resizingId) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizingId, initialY, initialHeight, scheduledTasks, onUpdateTaskDuration])

  return (
    <div className="flex flex-col h-full">
      
      <div className="relative overflow-hidden flex-grow bg-white">
        <div ref={timelineRef} className="h-full overflow-y-auto relative scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <div className="relative pb-16">
            {hours.map((hour, index) => {
              const timeSlotId = `time-slot-${String(hour).padStart(2, "0")}:00`
              const isLast = index === hours.length - 1

              return (
                <TimeSlot
                  key={hour}
                  hour={hour}
                  hourHeight={HOUR_HEIGHT}
                  timeSlotId={timeSlotId}
                  isLast={isLast}
                />
              )
            })}

            <div className="absolute top-0 left-16 right-0 bottom-0 pointer-events-none">
              {scheduledTasks.map((task) => (
                <ScheduledDraggableItem 
                  key={task.id}
                  task={task}
                  style={getTaskStyle(task)}
                  onRemove={onRemoveScheduledTask}
                  onResizeStart={handleResizeStart}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
