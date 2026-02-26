"use client"

import { useDraggable } from "@dnd-kit/core"
import { DailyTaskItem } from "./DailyTaskItem"

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

interface DailyTodoListProps {
  todos: Todo[]
  customTodos: CustomTodo[]
  onToggleComplete: (todo: Todo) => void
  onCompleteCustomTodo: (todoId: string) => void
}

function DraggableItem({ id, data, children }: { id: string, data: any, children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
    data: data,
  });
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 50 : undefined,
  } : undefined;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes}
      className={`${isDragging ? 'opacity-50' : ''} touch-none`}
    >
      {children}
    </div>
  );
}

export function DailyTodoList({
  todos,
  customTodos,
  onToggleComplete,
  onCompleteCustomTodo,
}: DailyTodoListProps) {
  return (
    <div className="flex flex-col gap-6">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">项目任务</h3>
          <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
            {todos.length}
          </span>
        </div>
        
        {todos.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/50 px-6 py-10 text-center">
            <p className="text-sm text-slate-400">暂无待办项目任务</p>
            <a href="/projects" className="mt-2 inline-block text-xs font-bold text-sky-600 hover:text-sky-700">
              去项目仪表盘看看 →
            </a>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <ul className="divide-y divide-slate-100">
              {todos.map((t) => (
                <DraggableItem key={t.milestoneId} id={t.milestoneId} data={{ type: "milestone", ...t }}>
                  <DailyTaskItem
                    milestoneId={t.milestoneId}
                    projectId={t.projectId}
                    projectTitle={t.projectTitle}
                    title={t.title}
                    dailyMinutes={t.dailyMinutes}
                    twoMinuteVersion={t.twoMinuteVersion}
                    antiProcrastinationScript={t.antiProcrastinationScript}
                    onToggleComplete={() => onToggleComplete(t)}
                  />
                </DraggableItem>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">自定义计划</h3>
          <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
            {customTodos.length}
          </span>
        </div>

        {customTodos.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/50 px-6 py-10 text-center">
            <p className="text-sm text-slate-400">暂无自定义计划</p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <ul className="divide-y divide-slate-100">
              {customTodos.map((t) => (
                <DraggableItem key={t.id} id={t.id} data={{ type: "standalone", ...t }}>
                  <DailyTaskItem
                    id={t.id}
                    title={t.title}
                    projectId={t.projectId}
                    projectTitle={t.projectTitle}
                    twoMinuteVersion={t.twoMinuteVersion}
                    antiProcrastinationScript={t.antiProcrastinationScript}
                    onToggleComplete={() => onCompleteCustomTodo(t.id)}
                  />
                </DraggableItem>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  )
}
