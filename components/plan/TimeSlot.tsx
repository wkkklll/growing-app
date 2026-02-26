"use client"

import { useDroppable } from "@dnd-kit/core"

interface TimeSlotProps {
  hour: number
  hourHeight: number
  timeSlotId: string
  isLast?: boolean
}

export function TimeSlot({ hour, hourHeight, timeSlotId, isLast }: TimeSlotProps) {
  const { setNodeRef, isOver } = useDroppable({ id: timeSlotId })
  return (
    <div
      ref={setNodeRef}
      className={`relative flex items-start transition-colors ${isOver ? 'bg-sky-50' : ''} ${!isLast ? 'border-b border-slate-100' : ''}`}
      style={{ height: `${hourHeight}px` }}
    >
      <div className="w-16 flex-shrink-0 text-right pr-4 pt-2">
        <span className="text-[10px] font-bold text-slate-300 uppercase">
          {hour === 24 ? "00:00" : `${String(hour).padStart(2, "0")}:00`}
        </span>
      </div>
      <div className="flex-grow h-full border-l border-slate-100"></div>
    </div>
  )
}
