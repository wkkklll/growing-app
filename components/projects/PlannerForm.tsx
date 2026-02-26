"use client"

import { useState, useEffect } from "react"

interface PlannerFormProps {
  onProjectCreated: () => void
  onCancel: () => void
}

export function PlannerForm({ onProjectCreated, onCancel }: PlannerFormProps) {
  const [goal, setGoal] = useState("")
  const [questions, setQuestions] = useState<string[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [dailyMinutes, setDailyMinutes] = useState<number | "ai">("ai")
  const [suggestedMinutes, setSuggestedMinutes] = useState<number | null>(null)
  const [step, setStep] = useState<"goal" | "questions">("goal")
  const [generating, setGenerating] = useState(false)

  const fetchQuestions = async () => {
    if (!goal.trim()) return
    setStep("questions")
    const res = await fetch("/api/planner/guide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal: goal.trim() }),
    })
    const data = await res.json()
    if (data.questions?.length) setQuestions(data.questions)
  }

  const fetchSuggestedDaily = async () => {
    const res = await fetch("/api/planner/suggest-daily", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goal: goal.trim(),
        answers: questions.map((_, i) => answers[i] ?? ""),
      }),
    })
    const data = await res.json()
    if (data.dailyMinutes) setSuggestedMinutes(data.dailyMinutes)
  }

  const submitAndGenerate = async () => {
    setGenerating(true)
    try {
      let finalDaily = 0
      if (dailyMinutes === "ai") {
        if (suggestedMinutes) finalDaily = suggestedMinutes
        else {
          const r = await fetch("/api/planner/suggest-daily", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              goal: goal.trim(),
              answers: questions.map((_, i) => answers[i] ?? ""),
            }),
          })
          const d = await r.json()
          finalDaily = d.dailyMinutes ?? 60
        }
      } else {
        finalDaily = Number(dailyMinutes) || 60
      }
      const res = await fetch("/api/planner/generate-wbs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: goal.trim(),
          questions,
          answers: questions.map((_, i) => answers[i] ?? ""),
          dailyMinutes: finalDaily,
        }),
      })
      const data = await res.json()
      if (data.projectId) {
        onProjectCreated()
      }
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-slate-800">新建项目</h2>

      {step === "goal" && (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            你的目标（可以是模糊的）
          </label>
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="例：学 Python"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          <div className="flex gap-2">
            <button
              onClick={fetchQuestions}
              className="rounded-lg bg-sky-600 px-6 py-2 text-white hover:bg-sky-700"
            >
              下一步
            </button>
            <button
              onClick={onCancel}
              className="rounded-lg border border-slate-300 px-6 py-2 text-slate-600 hover:bg-slate-50"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {step === "questions" && questions.length > 0 && (
        <div className="space-y-6">
          {questions.map((q, i) => (
            <div key={i}>
              <label className="mb-2 block text-sm font-medium text-slate-700">{q}</label>
              <textarea
                value={answers[i] ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [i]: e.target.value }))}
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          ))}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              每日可投入时间（分钟）
            </label>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="dailyMode"
                  checked={dailyMinutes === "ai"}
                  onChange={() => setDailyMinutes("ai")}
                />
                <span className="text-sm">AI 根据目标建议</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="dailyMode"
                  checked={typeof dailyMinutes === "number"}
                  onChange={() => setDailyMinutes(60)}
                />
                <span className="text-sm">自定义</span>
              </label>
              {typeof dailyMinutes === "number" && (
                <input
                  type="number"
                  min={15}
                  max={240}
                  step={15}
                  value={dailyMinutes}
                  onChange={(e) => setDailyMinutes(Number(e.target.value) || 60)}
                  className="w-24 rounded border border-slate-300 px-2 py-1 text-sm"
                />
              )}
              {dailyMinutes === "ai" && (
                <button
                  type="button"
                  onClick={fetchSuggestedDaily}
                  className="rounded border border-slate-300 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50"
                >
                  获取建议
                </button>
              )}
            </div>
            {suggestedMinutes && dailyMinutes === "ai" && (
              <p className="mt-2 text-sm text-slate-500">
                建议每日投入 <strong>{suggestedMinutes}</strong> 分钟
              </p>
            )}
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setStep("goal")}
              className="rounded-lg border border-slate-300 px-6 py-2 text-slate-600 hover:bg-slate-50"
            >
              返回
            </button>
            <button
              onClick={submitAndGenerate}
              disabled={generating}
              className="rounded-lg bg-sky-600 px-6 py-2 text-white hover:bg-sky-700 disabled:opacity-50"
            >
              {generating ? "生成中..." : "生成 WBS"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
