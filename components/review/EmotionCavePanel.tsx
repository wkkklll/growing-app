"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

// Temporarily define interfaces here until proper shared types are established
interface EmotionThread {
  id: string
  logDate: string | null
  title: string
  status: "open" | "resolved" | "archived"
  summary: string | null
  createdAt: string
  updatedAt: string
}

interface EmotionLog {
  id: string
  threadId: string
  role: "user" | "ai"
  content: string
  createdAt: string
}

interface EmotionCavePanelProps {
  date: string // ISO string for the current day
}

export function EmotionCavePanel({ date }: EmotionCavePanelProps) {
  const [threads, setThreads] = useState<EmotionThread[]>([])
  const [activeThread, setActiveThread] = useState<EmotionThread | null>(null)
  const [messages, setMessages] = useState<EmotionLog[]>([])
  const [newMessageContent, setNewMessageContent] = useState("")
  const [newThreadTitle, setNewThreadTitle] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchThreads = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/emotion-cave/threads?logDate=${date}`)
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
      const data = await res.json()
      const fetchedThreads = data.threads || []
      setThreads(fetchedThreads)
    } catch (e: any) {
      setError(e.message || "Failed to fetch emotion threads")
      console.error("Error fetching emotion threads:", e)
    } finally {
      setLoading(false)
    }
  }, [date])

  const fetchMessages = useCallback(async (threadId: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/emotion-cave/messages?threadId=${threadId}`)
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
      const data = await res.json()
      setMessages(data.messages || [])
    } catch (e: any) {
      setError(e.message || "Failed to fetch emotion messages")
      console.error("Error fetching emotion messages:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchThreads()
  }, [fetchThreads])

  useEffect(() => {
    if (activeThread) {
      fetchMessages(activeThread.id)
    } else {
      setMessages([])
    }
  }, [activeThread, fetchMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleCreateThread = async (initialContent?: string) => {
    const title = newThreadTitle.trim() || (initialContent ? initialContent.slice(0, 20) + (initialContent.length > 20 ? "..." : "") : "新对话")
    try {
      const res = await fetch("/api/emotion-cave/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logDate: date, title }),
      })
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
      const data = await res.json()
      setThreads((prev) => [data.thread, ...prev])
      setNewThreadTitle("")
      setActiveThread(data.thread)
      return data.thread
    } catch (e: any) {
      setError(e.message || "Failed to create new thread")
      console.error("Error creating new thread:", e)
      return null
    }
  }

  const handleDeleteThread = async (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation()
    if (!window.confirm("确定要删除这个对话记录吗？")) return

    try {
      const res = await fetch(`/api/emotion-cave/threads?id=${threadId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
      
      setThreads((prev) => prev.filter(t => t.id !== threadId))
      if (activeThread?.id === threadId) {
        setActiveThread(null)
      }
    } catch (e: any) {
      alert(e.message || "删除失败")
    }
  }

  const handleSendMessage = async () => {
    const currentContent = newMessageContent.trim()
    if (!currentContent || sending) return
    
    setNewMessageContent("")
    setSending(true)

    let threadToUse = activeThread
    
    // If no active thread, create one first
    if (!threadToUse) {
      threadToUse = await handleCreateThread(currentContent)
      if (!threadToUse) {
        setSending(false)
        return
      }
    }

    // Optimistic update for user message
    const tempUserMsgId = "temp-user-" + Date.now()
    setMessages((prev) => [
      ...prev,
      { id: tempUserMsgId, threadId: threadToUse!.id, role: "user", content: currentContent, createdAt: new Date().toISOString() },
    ])

    try {
      const res = await fetch("/api/emotion-cave/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: threadToUse!.id, content: currentContent }),
      })
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
      const data = await res.json()

      // Replace temp user message and add AI message
      setMessages((prev) => {
        const filtered = prev.filter(msg => msg.id !== tempUserMsgId)
        return [...filtered, data.userMessage, data.aiMessage]
      })
      
      // Update thread summary and title in local state
      setThreads(prev => prev.map(t => t.id === threadToUse!.id ? { 
        ...t, 
        summary: data.threadSummary, 
        title: t.title === "新对话" ? currentContent.slice(0, 20) + (currentContent.length > 20 ? "..." : "") : t.title,
        updatedAt: new Date().toISOString() 
      } : t))
      
      if (activeThread?.id === threadToUse!.id) {
        setActiveThread(prev => prev ? { 
          ...prev, 
          summary: data.threadSummary, 
          title: prev.title === "新对话" ? currentContent.slice(0, 20) + (currentContent.length > 20 ? "..." : "") : prev.title,
          updatedAt: new Date().toISOString() 
        } : null)
      }

    } catch (e: any) {
      setError(e.message || "Failed to send message")
      console.error("Error sending message:", e)
      setMessages((prev) => prev.filter(msg => msg.id !== tempUserMsgId))
      setMessages((prev) => [...prev, 
        { id: "error-" + Date.now(), threadId: threadToUse!.id, role: "ai", content: `发送失败: ${e.message}`, createdAt: new Date().toISOString() }
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xl flex flex-col h-full overflow-hidden transition-all">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            title={isSidebarOpen ? "隐藏历史" : "显示历史"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-sky-500 flex items-center justify-center text-white shadow-lg shadow-sky-200">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.326 1.882 3.326 3.821v13.135c0 1.939-1.404 3.57-3.326 3.821-2.075.27-4.19.408-6.337.408-2.147 0-4.262-.139-6.337-.408-1.922-.25-3.326-1.882-3.326-3.821V6.479c0-1.94 1.404-3.57 3.326-3.821z" />
                <path d="M7.75 7.75a.75.75 0 01.75-.75h7a.75.75 0 010 1.5h-7a.75.75 0 01-.75-.75zM7.75 11.75a.75.75 0 01.75-.75h7a.75.75 0 010 1.5h-7a.75.75 0 01-.75-.75zM8.5 15a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5H8.5z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">情绪树洞</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeThread && (
            <button 
              onClick={() => setActiveThread(null)}
              className="text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              开启新对话
            </button>
          )}
        </div>
      </div>

      <div className="flex-grow flex min-h-0 relative">
        {/* Sidebar: Threads List */}
        <div className={`absolute lg:relative z-30 h-full bg-slate-50 border-r border-slate-100 transition-all duration-300 ease-in-out flex flex-col overflow-hidden ${isSidebarOpen ? "w-72 translate-x-0" : "w-0 -translate-x-full lg:translate-x-0"}`}>
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">历史对话</h3>
          </div>

          <div className="flex-grow overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {threads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <p className="text-xs text-slate-400 font-medium italic">暂无对话记录</p>
              </div>
            ) : (
              threads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => setActiveThread(thread)}
                  className={`group relative cursor-pointer rounded-xl p-3 text-sm transition-all ${activeThread?.id === thread.id ? "bg-white shadow-md border border-slate-100 text-sky-700 font-bold" : "text-slate-600 hover:bg-white/50"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate flex-1">{thread.title}</p>
                    <button
                      onClick={(e) => handleDeleteThread(e, thread.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  {thread.summary && (
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 font-normal italic">“{thread.summary}”</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-grow flex flex-col bg-white min-w-0">
          {/* Chat Messages */}
          <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-slate-50/30 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {!activeThread && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-20 w-20 rounded-3xl bg-sky-50 flex items-center justify-center text-sky-500 mb-6 shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785 0 .597.597 0 00.412 1.003 3.702 3.702 0 001.5-.333c.608-.288 1.276-.459 2.009-.459.277 0 .541.02.8.058A8.988 8.988 0 0012 20.25z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">欢迎来到情绪树洞</h3>
                <p className="text-sm text-slate-500 max-w-xs leading-relaxed italic font-medium">
                  有什么想说的？直接在下方输入，我会为你开启一段新的对话。
                </p>
              </div>
            )}
            
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div className={`flex gap-3 max-w-[90%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${msg.role === "user" ? "bg-slate-900 text-white" : "bg-sky-500 text-white"}`}>
                    {msg.role === "user" ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                      </svg>
                    )}
                  </div>
                  <div className={`group relative rounded-2xl p-4 shadow-sm ${msg.role === "user" ? "bg-slate-900 text-white rounded-tr-none" : "bg-white text-slate-800 rounded-tl-none border border-slate-100"}`}>
                    {msg.role === "ai" ? (
                      <div className="prose prose-sm max-w-none prose-slate prose-p:leading-relaxed prose-strong:text-sky-600 prose-ul:list-disc prose-ol:list-decimal prose-headings:text-slate-900 prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2 prose-code:text-sky-600 prose-code:bg-sky-50 prose-code:px-1 prose-code:rounded">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    )}
                    <div className={`mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <span className="text-[9px] font-bold uppercase tracking-tighter opacity-50">
                        {new Date(msg.createdAt).toLocaleTimeString("zh-CN", {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start animate-pulse">
                <div className="flex gap-3 max-w-[90%]">
                  <div className="h-8 w-8 rounded-lg bg-sky-500 flex items-center justify-center text-white shrink-0">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-4 shadow-sm">
                    <div className="flex gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white border-t border-slate-100 shrink-0">
            <div className="relative flex items-end gap-3 max-w-4xl mx-auto">
              <textarea
                value={newMessageContent}
                onChange={(e) => setNewMessageContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={activeThread ? "继续对话..." : "说出你的心声，自动开启新对话..."} 
                className="flex-grow rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 focus:outline-none transition-all resize-none min-h-[56px] max-h-40 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
                disabled={sending}
                rows={1}
                style={{ height: 'auto', minHeight: '56px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 160)}px`;
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={sending || !newMessageContent.trim()}
                className="h-14 w-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 transition-all active:scale-95 shadow-lg shadow-slate-200 shrink-0"
              >
                {sending ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 rotate-90">
                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="mt-3 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">
              Shift + Enter 换行 · 你的隐私受到严格保护
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
