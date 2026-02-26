"use client"

interface TaskCompletionModalProps {
  completedTitle: string
  nextTitle: string
  projectTitle: string
  onContinue: () => void
  onClose: () => void
}

export function TaskCompletionModal({
  completedTitle,
  nextTitle,
  projectTitle,
  onContinue,
  onClose,
}: TaskCompletionModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="mx-4 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <h2 id="modal-title" className="mb-2 text-lg font-semibold text-slate-800">
          太棒了！完成 {completedTitle}
        </h2>
        <p className="mb-6 text-slate-600">
          「{projectTitle}」还有下一个任务：<strong>{nextTitle}</strong>
          。趁热打铁，继续完成吗？
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-slate-600 hover:bg-slate-50"
          >
            稍后再说
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="rounded-lg bg-sky-600 px-4 py-2 text-white hover:bg-sky-700"
          >
            继续完成
          </button>
        </div>
      </div>
    </div>
  )
}
