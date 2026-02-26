"use client"

import Link from "next/link"

export default function ReviewPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-slate-800">复盘</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Link
          href="/logs"
          className="block rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md"
        >
          <h2 className="mb-2 text-xl font-semibold text-sky-600">每日复盘</h2>
          <p className="text-slate-500">回顾每日任务完成情况</p>
        </Link>

        <Link
          href="/review/weekly"
          className="block rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md"
        >
          <h2 className="mb-2 text-xl font-semibold text-emerald-600">每周复盘</h2>
          <p className="text-slate-500">总结每周成长与挑战</p>
        </Link>
      </div>
    </div>
  )
}
