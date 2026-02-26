import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { selectMilestonesByTimeBudget } from "@/lib/daily-todos"
import { parseJsonStringArray } from "@/lib/utils"

const parseWbsTree = (value: string | null) => {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const projects = await prisma.project.findMany({
      where: { status: "active" },
      include: {
        milestones: { orderBy: { orderIndex: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    })

    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const logs = await prisma.dailyLog.findMany({
      where: { logDate: { gte: sevenDaysAgo, lte: today } },
      orderBy: { logDate: "asc" },
    })

    const moodData = logs.map((l) => ({
      date: l.logDate.toISOString().slice(0, 10),
      moodIndex: l.moodIndex,
    }))

    const todos = projects.flatMap((p) => {
      const incomplete = p.milestones.filter((m) => !m.completed)
      const selected = selectMilestonesByTimeBudget(incomplete, p.dailyMinutes)
      return selected.map((m) => ({
        milestoneId: m.id,
        projectId: p.id,
        projectTitle: p.title,
        title: m.title,
      }))
    })

    return NextResponse.json({
      projects: projects.map((p) => ({
        id: p.id,
        title: p.title,
        progressPercent: p.progressPercent,
        status: p.status,
        dailyMinutes: p.dailyMinutes,
        milestones: p.milestones,
        wbsTree: parseWbsTree(p.wbsTree),
        targetDescription: p.targetDescription,
        endDate: p.endDate,
        behaviorMetrics: parseJsonStringArray(p.behaviorMetrics),
        resultMetrics: parseJsonStringArray(p.resultMetrics),
        capabilityMetrics: parseJsonStringArray(p.capabilityMetrics),
      })),
      todos,
      moodData,
    })
  } catch (e) {
    console.error("dashboard", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}
