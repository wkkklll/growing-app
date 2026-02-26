"use client"

import { useState } from "react"

interface MotivationBoardProps {
  phrases: string[]
  onSave: (phrases: string[]) => void
}

export function MotivationBoard({ phrases, onSave }: MotivationBoardProps) {
  const [editing, setEditing] = useState(false)
  const [currentPhrases, setCurrentPhrases] = useState<string[]>(phrases)
  const [newPhrase, setNewPhrase] = useState("")

  const handleAddPhrase = () => {
    if (newPhrase.trim()) {
      setCurrentPhrases([...currentPhrases, newPhrase.trim()])
      setNewPhrase("")
    }
  }

  const handleRemovePhrase = (index: number) => {
    setCurrentPhrases(currentPhrases.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    onSave(currentPhrases)
    setEditing(false)
  }

  const handleCancel = () => {
    setCurrentPhrases(phrases)
    setEditing(false)
    setNewPhrase("")
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">动力话语板</h2>
          <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Motivation Phrases</p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-amber-100 hover:text-amber-600 transition-colors"
            title="编辑动力话语"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
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
            value={newPhrase}
            onChange={(e) => setNewPhrase(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddPhrase()}
            placeholder="输入一段激励自己的话..."
            className="flex-grow rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/10 transition-all"
          />
          <button
            onClick={handleAddPhrase}
            className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600 shadow-md shadow-amber-200 transition-all active:scale-95"
          >
            添加
          </button>
        </div>
      )}

      {currentPhrases.length === 0 && !editing ? (
        <div className="py-12 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.001 0 01-1.564-.317z" />
            </svg>
          </div>
          <p className="text-sm text-slate-400 font-medium">还没有动力话语，给自己一点鼓励吧</p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentPhrases.map((phrase, index) => (
            <div
              key={index}
              className="group relative rounded-2xl border-l-4 border-amber-400 bg-amber-50/30 p-4 hover:bg-amber-50 hover:shadow-sm transition-all duration-300"
            >
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm font-medium text-slate-700 italic leading-relaxed">“{phrase}”</p>
                {editing && (
                  <button
                    onClick={() => handleRemovePhrase(index)}
                    className="rounded-full p-1 text-slate-300 hover:bg-rose-100 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 shrink-0"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
