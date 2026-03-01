"use client"

import { useState } from "react"

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="md:hidden">
      {/* Hamburger Button - 48x48px touch target */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-12 w-12 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
        aria-label="菜单"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="fixed top-16 right-0 left-0 bg-white border-b border-slate-200 shadow-lg z-50 animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col">
              <a
                href="/projects"
                className="flex items-center h-14 px-6 text-base font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors border-b border-slate-100"
                onClick={() => setIsOpen(false)}
              >
                <span className="mr-3">📊</span>
                项目仪表盘
              </a>
              <a
                href="/plan"
                className="flex items-center h-14 px-6 text-base font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors border-b border-slate-100"
                onClick={() => setIsOpen(false)}
              >
                <span className="mr-3">📅</span>
                每日计划
              </a>
              <a
                href="/logs"
                className="flex items-center h-14 px-6 text-base font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors border-b border-slate-100"
                onClick={() => setIsOpen(false)}
              >
                <span className="mr-3">📝</span>
                复盘
              </a>
              <a
                href="/vision"
                className="flex items-center h-14 px-6 text-base font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors border-b border-slate-100"
                onClick={() => setIsOpen(false)}
              >
                <span className="mr-3">🎯</span>
                成长OS
              </a>
              <a
                href="/analysis"
                className="flex items-center h-14 px-6 text-base font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <span className="mr-3">🤖</span>
                AI 分析
              </a>
            </nav>
          </div>
        </>
      )}
    </div>
  )
}
