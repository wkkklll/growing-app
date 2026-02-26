import { NextRequest, NextResponse } from "next/server"
import { getLLMProvider } from "@/lib/llm"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { prompt, projectId } = (await req.json()) as {
      prompt?: string
      projectId?: string | null
    }
    if (!prompt?.trim()) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 })
    }

    const projectFilter = projectId?.trim()
      ? { id: projectId, status: "active" }
      : { status: "active" }
    const projects = await prisma.project.findMany({
      where: projectFilter,
      include: { milestones: { orderBy: { orderIndex: "asc" } } },
    })
    const logs = await prisma.dailyLog.findMany({
      orderBy: { logDate: "desc" },
      take: 14,
      select: { logDate: true, moodIndex: true, aiReview: true },
    })

    const context = `
【当前项目】
${projects
  .map(
    (p) =>
      `- ${p.title}: 进度 ${p.progressPercent}%，${p.dailyMinutes ? `每日 ${p.dailyMinutes} 分钟` : ""}，任务: ${p.milestones.map((m) => `${m.title}(${m.completed ? "已完成" : "待办"})`).join("、")}`
  )
  .join("\n")}

【近 14 天复盘】
${logs.map((l) => `- ${l.logDate.toISOString().slice(0, 10)}: 心情${l.moodIndex}/10，${l.aiReview || "无"}`).join("\n")}
`

    const provider = getLLMProvider()
    const fullPrompt = `你是 Phoenix Growth OS 的智能分析助手。基于以下用户数据，回答用户的分析请求。回答要简洁、有针对性，2-6 句话。\n\n${context}\n\n用户请求：${prompt}`
    const analysis = await provider.complete(fullPrompt, { maxTokens: 512 })

    return NextResponse.json({ analysis: analysis.trim() })
  } catch (e) {
    console.error("analysis/request", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}
