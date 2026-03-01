import type { Metadata } from "next"
import "./globals.css"
import { Suspense } from 'react'
import { MobileNav } from "@/components/layout/MobileNav"

export const metadata: Metadata = {
  title: "Phoenix Growth OS",
  description: "集项目管理、认知心理学干预、AI 深度复盘于一体的自驱型操作系统",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  themeColor: "#ffffff",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Phoenix Growth OS",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
            <a href="/" className="text-lg sm:text-xl font-bold text-slate-800 truncate">
              Phoenix Growth OS
            </a>
            {/* Desktop Navigation */}
            <nav className="hidden md:flex gap-4 lg:gap-6">
              <a href="/projects" className="text-sm lg:text-base text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap">
                项目仪表盘
              </a>
              <a href="/plan" className="text-sm lg:text-base text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap">
                每日计划
              </a>
              <a href="/logs" className="text-sm lg:text-base text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap">
                复盘
              </a>
              <a href="/vision" className="text-sm lg:text-base text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap">
                成长OS
              </a>
              <a href="/analysis" className="text-sm lg:text-base text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap">
                AI 分析
              </a>
            </nav>
            {/* Mobile Navigation */}
            <MobileNav />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
          <Suspense fallback={<div className="flex items-center justify-center py-12 text-slate-500">加载中...</div>}>
            {children}
          </Suspense>
        </main>
      </body>
    </html>
  )
}
