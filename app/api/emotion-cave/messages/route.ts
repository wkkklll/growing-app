import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAliyunLLMResponse } from "@/lib/llm"

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const threadId = searchParams.get("threadId")

  if (!threadId) {
    return NextResponse.json({ error: "Missing threadId" }, { status: 400 })
  }

  try {
    const messages = await prisma.emotionLog.findMany({
      where: { threadId },
      orderBy: { createdAt: "asc" },
    })
    return NextResponse.json({ messages })
  } catch (e: any) {
    console.error("Error fetching emotion messages:", e)
    return NextResponse.json({ error: "Failed to fetch emotion messages", details: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      threadId: string
      content: string
    }
    const { threadId, content } = body

    if (!threadId || !content) {
      return NextResponse.json({ error: "Missing threadId or content" }, { status: 400 })
    }

    // 1. Save user message
    const userMessage = await prisma.emotionLog.create({
      data: { threadId, role: "user", content },
    })

    // 2. Fetch thread and previous messages for context
    const thread = await prisma.emotionThread.findUnique({
      where: { id: threadId },
      include: { logs: { orderBy: { createdAt: "asc" } } },
    })

    if (!thread) {
      return NextResponse.json({ error: "Emotion thread not found" }, { status: 404 })
    }

    // Limit context to last 10 messages to avoid token issues and keep it focused
    const lastMessages = thread.logs.slice(-10)
    const contextMessages = lastMessages.map(log => ({ 
      role: log.role === "ai" ? "assistant" : "user", 
      content: log.content 
    }))

    const promptMessages = [
      { role: "system", content: "你是一个高度共情和专业的“人生教练”AI，被设计为用户的情绪树洞和支持者，帮助用户自我成长并解决实际问题。你的核心职责是：\n1. 深入倾听并理解用户的情绪困扰和挑战，用积极和支持性的语言回应。\n2. 提供真诚的共情，并引导用户进行自我反思，帮助他们发现问题根源。\n3. 针对用户的问题，提供具体、实用、可操作的解决方案和应对策略。鼓励用户采取行动，并提供实现目标的微小步骤。\n4. **记住并利用**用户所有的困惑和历史对话。在后续交流中，你需要引用之前的讨论、追踪问题进展，并避免重复或遗漏信息。如果用户的问题在之前提到过，请在回答中明确指出进展或之前给出的建议，并在此基础上提供新的洞察。\n5. 在每次回复时，请使用清晰、易读的 Markdown 排版，如加粗、列表、引用和代码块（如果适用）来突出关键信息和行动步骤。\n6. 在每次回复的末尾，必须用格式 '### 总结：[当前对话的核心困惑/问题进展/已解决问题]' 总结讨论的核心困惑或问题进展。如果一个问题已得到解决或取得了显著进展，请在总结中明确说明。这个总结将用于你的长期记忆，请务必准确和简洁。" },
      ...contextMessages
    ]

    // 3. Call Aliyun LLM
    const aiResponse = await getAliyunLLMResponse(promptMessages as any)

    // 4. Extract summary from AI response and update thread
    let aiContent = aiResponse
    let newSummary = thread.summary
    
    // Look for summary in various formats
    const summaryMatch = aiResponse.match(/### 总结：(.+)$/m) || aiResponse.match(/总结：(.+)$/m)
    if (summaryMatch) {
      newSummary = summaryMatch[1].trim()
      aiContent = aiResponse.replace(summaryMatch[0], "").trim()
    }

    const aiMessage = await prisma.emotionLog.create({
      data: { threadId, role: "ai", content: aiContent },
    })

    await prisma.emotionThread.update({
      where: { id: threadId },
      data: { summary: newSummary, updatedAt: new Date() },
    })

    return NextResponse.json({ userMessage, aiMessage, threadSummary: newSummary })
  } catch (e: any) {
    console.error("Error sending emotion message:", e)
    return NextResponse.json({ error: "Failed to send emotion message", details: e.message }, { status: 500 })
  }
}
