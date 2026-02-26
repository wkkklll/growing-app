import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getLLMProvider } from "@/lib/llm"

const PARSE_PROMPT = `用户提交了当日任务完成情况。请解析并输出严格 JSON：
{
  "taskCompletions": { "milestoneId1": "completed", "milestoneId2": "partial", "milestoneId3": "pending" },
  "moodIndex": 5
}
- milestoneId 从提供的任务列表中来，未提到的任务默认 "pending"
- completed=完成, partial=部分完成, pending=未完成
- moodIndex 1-10，若用户未提及则 5
只输出 JSON，不要其它内容。`

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const dateStr = searchParams.get("date") ?? new Date().toISOString().slice(0, 10)
    const date = new Date(dateStr)
    date.setHours(0, 0, 0, 0)

    const log = await prisma.dailyLog.findUnique({
      where: { logDate: date },
      select: { taskCompletions: true, moodIndex: true, logDate: true, content: true, aiReview: true },
    })

    const taskCompletions = log?.taskCompletions
      ? (JSON.parse(log.taskCompletions) as Record<string, string>)
      : {}
    
    // Fetch log entries (milestones) for this date
    const entries = await prisma.milestone.findMany({
      where: {
        id: { in: Object.keys(taskCompletions) }
      },
      include: {
        project: {
          select: { title: true }
        }
      }
    }).then(ms => ms.map(m => ({
      milestoneId: m.id,
      projectId: m.projectId,
      projectTitle: m.project.title,
      title: m.title,
      status: taskCompletions[m.id]
    })))

    return NextResponse.json({
      date: dateStr,
      logId: log?.id ?? null,
      moodIndex: log?.moodIndex ?? 5,
      content: log?.content ?? "",
      aiReview: log?.aiReview ?? "",
      taskCompletions,
      entries,
    })
  } catch (e) {
    console.error("logs/daily:get", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      date?: string
      moodIndex?: number
      completionText?: string
      milestoneIds?: string[]
    }
    const dateStr = body.date ?? new Date().toISOString().slice(0, 10)
    const date = new Date(dateStr)
    date.setHours(0, 0, 0, 0)

    let taskCompletions: Record<string, string> = {}
    let moodIndex = body.moodIndex ?? 5

    if (body.completionText?.trim() && body.milestoneIds?.length) {
      const provider = getLLMProvider()
      const milestones = await prisma.milestone.findMany({
        where: { id: { in: body.milestoneIds } },
        select: { id: true, title: true },
      })
      const promptWithTitles = `${PARSE_PROMPT}\n\n任务列表：\n${milestones
        .map((m) => `${m.id}: ${m.title}`)
        .join("\n")}\n\n用户描述：${body.completionText}`

      const raw = await provider.complete(promptWithTitles, { maxTokens: 1024 })
      try {
        const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim()
        const parsed = JSON.parse(cleaned) as {
          taskCompletions?: Record<string, string>
          moodIndex?: number
        }
        taskCompletions = parsed.taskCompletions ?? {}
        if (typeof parsed.moodIndex === "number") moodIndex = Math.max(1, Math.min(10, parsed.moodIndex))
      } catch {
        taskCompletions = {}
      }
    }

    const log = await prisma.dailyLog.upsert({
      where: { logDate: date },
      create: {
        logDate: date,
        moodIndex,
        content: body.completionText,
        taskCompletions: JSON.stringify(taskCompletions),
      },
      update: {
        moodIndex,
        content: body.completionText,
        taskCompletions: JSON.stringify(taskCompletions),
      },
    })

    for (const [mid, status] of Object.entries(taskCompletions)) {
      if (status === "completed") {
        await prisma.milestone.update({
          where: { id: mid },
          data: { completed: true },
        })
      }
    }

    const allMilestones = await prisma.milestone.findMany({
      where: { project: { status: "active" } },
      select: { id: true, projectId: true, completed: true },
    })
    const byProject = new Map<string, { total: number; done: number }>()
    for (const m of allMilestones) {
      const cur = byProject.get(m.projectId) ?? { total: 0, done: 0 }
      cur.total++
      if (m.completed) cur.done++
      byProject.set(m.projectId, cur)
    }
    await Promise.all(
      Array.from(byProject.entries()).map(([pid, { total, done }]) => {
        const percent = total > 0 ? Math.round((done / total) * 100) : 0
        return prisma.project.update({
          where: { id: pid },
          data: { progressPercent: percent },
        })
      })
    )

    return NextResponse.json({
      logId: log.id,
      logDate: dateStr,
      moodIndex,
      taskCompletions,
    })
  } catch (e) {
    console.error("logs/daily", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}
