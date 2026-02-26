"use client"

import { useState } from "react"

interface YearlyWishesProps {
  wishes: string[]
  onSave: (wishes: string[]) => void
}

export function YearlyWishes({ wishes, onSave }: YearlyWishesProps) {
  const [editing, setEditing] = useState(false)
  const [currentWishes, setCurrentWishes] = useState<string[]>(wishes)
  const [newWish, setNewWish] = useState("")

  const handleAddWish = () => {
    if (newWish.trim()) {
      setCurrentWishes([...currentWishes, newWish.trim()])
      setNewWish("")
    }
  }

  const handleRemoveWish = (index: number) => {
    setCurrentWishes(currentWishes.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    onSave(currentWishes)
    setEditing(false)
  }

  const handleCancel = () => {
    setCurrentWishes(wishes)
    setEditing(false)
    setNewWish("")
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">年度愿望清单</h2>
          <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Yearly Wishes</p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-sky-100 hover:text-sky-600 transition-colors"
            title="编辑愿望"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="rounded-lg bg-emerald-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-600 shadow-sm transition-all"
            >
              保存
            </button>
            <button
              onClick={handleCancel}
              className="rounded-lg bg-slate-100 px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all"
            >
              取消
            </button>
          </div>
        )}
      </div>

      {editing && (
        <div className="mb-6 flex gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <input
            type="text"
            value={newWish}
            onChange={(e) => setNewWish(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddWish()}
            placeholder="写下一个宏大的愿望..."
            className="flex-grow rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition-all"
          />
          <button
            onClick={handleAddWish}
            className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white hover:bg-sky-700 shadow-md shadow-sky-200 transition-all active:scale-95"
          >
            添加
          </button>
        </div>
      )}

      {currentWishes.length === 0 && !editing ? (
        <div className="py-12 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
            </svg>
          </div>
          <p className="text-sm text-slate-400 font-medium">还没有年度愿望，点击右上角开始规划吧</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {currentWishes.map((wish, index) => (
            <div
              key={index}
              className="group relative flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-4 hover:bg-white hover:border-sky-100 hover:shadow-md hover:shadow-sky-500/5 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]"></div>
                <span className="text-sm font-medium text-slate-700 leading-relaxed">{wish}</span>
              </div>
              {editing && (
                <button
                  onClick={() => handleRemoveWish(index)}
                  className="rounded-full p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
