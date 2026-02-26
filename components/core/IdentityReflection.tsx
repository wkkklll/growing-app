"use client"

import { useEffect, useRef, useState } from "react"

interface Identity {
  id: string
  identityText: string
  createdAt: string
  updatedAt: string
}

export function IdentityReflection() {
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetch("/api/settings/identity")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.identityDescription) {
          setIdentity({
            id: "setting",
            identityText: data.identityDescription,
            createdAt: "",
            updatedAt: ""
          })
          setEditText(data.identityDescription)
        }
      })
  }, [])

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isEditing])

  const handleSave = async () => {
    if (editText.trim() === "") return

    const res = await fetch("/api/settings/identity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identityDescription: editText.trim() }),
    })

    if (res.ok) {
      const data = await res.json()
      setIdentity({
        id: "setting",
        identityText: data.identityDescription,
        createdAt: "",
        updatedAt: ""
      })
      setIsEditing(false)
    }
  }

  const handleDelete = async () => {
    const confirmed = window.confirm("确定删除你的身份认同吗？这将清空当前内容。")
    if (!confirmed) return

    const res = await fetch("/api/settings/identity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identityDescription: " " }), // Use a space to clear
    })

    if (res.ok) {
      setIdentity(null)
      setEditText("")
      setIsEditing(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h2 className="text-xl font-bold text-slate-800">我是谁？</h2>
        {!isEditing && identity && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sky-600 hover:text-sky-700 text-sm font-medium transition-colors"
          >
            编辑
          </button>
        )}
        {!isEditing && !identity && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sky-600 hover:text-sky-700 text-sm font-medium transition-colors"
          >
            记录我的身份认同
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="flex flex-col flex-grow">
          <textarea
            ref={textareaRef}
            className="w-full flex-grow p-3 border border-slate-300 rounded-lg focus:ring-sky-500 focus:border-sky-500 text-sm text-slate-700 resize-none leading-relaxed"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="我是...（简要描述你的核心身份认同、价值观或人生信念）"
            rows={5} // Set an initial number of rows
          />
          <div className="flex justify-end gap-2 mt-4 shrink-0">
            <button
              onClick={() => {
                setIsEditing(false)
                setEditText(identity?.identityText || "") // Revert changes on cancel
              }}
              className="px-4 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              取消
            </button>
            {identity && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
              >
                删除
              </button>
            )}
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-bold text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors shadow-md shadow-sky-200"
            >
              保存
            </button>
          </div>
        </div>
      ) : (
        <div className="text-slate-700 leading-relaxed text-sm flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {identity && identity.identityText ? (
            <p>{identity.identityText}</p>
          ) : (
            <p className="text-slate-500 italic">你还没有记录你的身份认同。记录你的身份认同可以帮助你明确方向，做出更符合内心期望的选择。</p>
          )}
        </div>
      )}
    </div>
  )
}
