"use client"

import { useState } from "react"

interface WbsNode {
  title: string
  estimatedMinutes?: number
  children?: WbsNode[]
  id?: string // Add id to WbsNode to identify milestones for AI breakdown
}

interface WbsEditorProps {
  projectId: string
  initialWbsTree: WbsNode[]
  onSave: (updatedWbsTree: WbsNode[]) => void
  onCancel: () => void
}

export function WbsEditor({
  projectId,
  initialWbsTree,
  onSave,
  onCancel,
}: WbsEditorProps) {
  const [wbsTree, setWbsTree] = useState<WbsNode[]>(initialWbsTree)
  const [generatingBreakdown, setGeneratingBreakdown] = useState<Record<string, boolean>>({})

  const updateNode = (
    nodes: WbsNode[],
    path: number[],
    updates: Partial<WbsNode>
  ): WbsNode[] => {
    if (path.length === 0) return nodes

    const [index, ...restPath] = path
    return nodes.map((node, i) => {
      if (i === index) {
        return {
          ...node,
          ...updates,
          children: restPath.length > 0 && node.children
            ? updateNode(node.children, restPath, updates)
            : node.children,
        }
      }
      return node
    })
  }

  const addNode = (
    nodes: WbsNode[],
    path: number[],
    newNode: WbsNode
  ): WbsNode[] => {
    if (path.length === 0) return [...nodes, newNode]

    const [index, ...restPath] = path
    return nodes.map((node, i) => {
      if (i === index) {
        return {
          ...node,
          children: addNode(node.children || [], restPath, newNode),
        }
      }
      return node
    })
  }

  const deleteNode = (nodes: WbsNode[], path: number[]): WbsNode[] => {
    if (path.length === 0) return nodes

    const [index, ...restPath] = path
    if (restPath.length === 0) {
      return nodes.filter((_, i) => i !== index)
    }
    return nodes.map((node, i) => {
      if (i === index) {
        return {
          ...node,
          children: deleteNode(node.children || [], restPath),
        }
      }
      return node
    })
  }

  const renderNode = (node: WbsNode, path: number[]) => (
    <li key={path.join("-")} className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={node.title}
          onChange={(e) =>
            setWbsTree((prev) =>
              updateNode(prev, path, { title: e.target.value })
            )
          }
          placeholder="任务名称"
          className="flex-1 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-sky-500 focus:outline-none"
        />
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={node.estimatedMinutes || 0}
            onChange={(e) =>
              setWbsTree((prev) =>
                updateNode(prev, path, { estimatedMinutes: parseInt(e.target.value) || 0 })
              )
            }
            placeholder="分钟"
            className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-sky-500 focus:outline-none"
          />
          <span className="text-xs text-slate-400">min</span>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={async () => {
              setGeneratingBreakdown((prev) => ({ ...prev, [path.join("-")]: true }))
              try {
                const res = await fetch("/api/task/two-minute-breakdown", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    taskId: node.id, // Assuming node has an ID if it's a milestone
                    taskType: "milestone",
                    taskTitle: node.title,
                  }),
                })
                if (res.ok) {
                  // Optionally update node with twoMinuteVersion and antiProcrastinationScript
                  // For now, just re-fetch the project to get updated milestones
                  // This is a simplified approach, a more robust solution would update the node directly
                  // For now, just log success
                  console.log("AI breakdown generated successfully!")
                } else {
                  console.error("Failed to generate two-minute breakdown")
                }
              } catch (error) {
                console.error("Error generating two-minute breakdown:", error)
              } finally {
                setGeneratingBreakdown((prev) => ({ ...prev, [path.join("-")]: false }))
              }
            }}
            disabled={generatingBreakdown[path.join("-")]}
            className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-700 hover:bg-purple-200 disabled:opacity-50"
          >
            {generatingBreakdown[path.join("-")] ? "AI 拆解中..." : "AI 拆解"}
          </button>
          <button
            type="button"
            onClick={() =>
              setWbsTree((prev) =>
                addNode(prev, path, { title: "新子任务", estimatedMinutes: 30, children: [] })
              )
            }
            className="rounded bg-sky-100 px-2 py-1 text-xs text-sky-700 hover:bg-sky-200"
          >
            + 子任务
          </button>
          <button
            type="button"
            onClick={() => setWbsTree((prev) => deleteNode(prev, path))}
            className="rounded bg-rose-100 px-2 py-1 text-xs text-rose-700 hover:bg-rose-200"
          >
            删除
          </button>
        </div>
      </div>
      {node.children && node.children.length > 0 && (
        <ul className="ml-6 space-y-2">
          {node.children.map((child, i) => renderNode(child, [...path, i]))}
        </ul>
      )}
    </li>
  )

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold text-slate-800">编辑任务拆解</h3>
      <ul className="space-y-3">
        {wbsTree.map((node, i) => renderNode(node, [i]))}
      </ul>
      <div className="mt-4 flex gap-3">
        <button
          onClick={() => onSave(wbsTree)}
          className="rounded-lg bg-sky-600 px-6 py-2 text-white hover:bg-sky-700"
        >
          保存修改
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-6 py-2 text-slate-600 hover:bg-slate-50"
        >
          取消
        </button>
      </div>
    </div>
  )
}
