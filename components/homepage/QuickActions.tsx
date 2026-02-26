"use client"

import Link from "next/link"

export function QuickActions() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-slate-800">快捷操作</h2>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/projects"
          className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200 transition-all active:scale-95 shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新建项目
        </Link>
        <Link
          href="/plan"
          className="inline-flex items-center justify-center rounded-xl bg-sky-50 px-5 py-2.5 text-sm font-bold text-sky-700 hover:bg-sky-100 transition-all active:scale-95 shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          添加每日计划
        </Link>
      </div>
    </div>
  )
}
