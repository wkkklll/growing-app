import type { Metadata } from "next"
import "./globals.css"
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: "Phoenix Growth OS",
  description: "集项目管理、认知心理学干预、AI 深度复盘于一体的自驱型操作系统",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <a href="/" className="text-lg font-semibold text-slate-800">
              Phoenix Growth OS
            </a>
            <nav className="flex gap-6">
              <a href="/projects" className="text-sm text-slate-600 hover:text-slate-900">
                项目仪表盘
              </a>
              <a href="/plan" className="text-sm text-slate-600 hover:text-slate-900">
                每日计划
              </a>
              <a href="/logs" className="text-sm text-slate-600 hover:text-slate-900">
                复盘
              </a>
              <a href="/vision" className="text-sm text-slate-600 hover:text-slate-900">
                精神空间
              </a>
              <a href="/analysis" className="text-sm text-slate-600 hover:text-slate-900">
                AI 分析
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">
          <Suspense fallback={<div>加载中...</div>}>
            {children}
          </Suspense>
        </main>
      </body>
    </html>
  )
}
