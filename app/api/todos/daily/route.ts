import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { selectMilestonesByTimeBudget } from "@/lib/daily-todos"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const dateStr = searchParams.get("date")
    const projectId = searchParams.get("projectId")
    const excludeParam = searchParams.get("exclude")
    const excludeIds = excludeParam
      ? excludeParam
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : []
    const date = dateStr ? new Date(dateStr) : new Date()
    date.setHours(0, 0, 0, 0)

    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          milestones: { where: { completed: false }, orderBy: { orderIndex: "asc" } },
        },
      })
      if (!project) {
        return NextResponse.json({ extraTodos: [] })
      }
      const filtered = project.milestones.filter((m) => !excludeIds.includes(m.id))
      const selected = selectMilestonesByTimeBudget(filtered, project.dailyMinutes)
      return NextResponse.json({
        extraTodos: selected.map((m) => ({
          milestoneId: m.id,
          projectId: project.id,
          projectTitle: project.title,
          dailyMinutes: project.dailyMinutes,
          title: m.title,
          estimatedMinutes: m.estimatedMinutes,
        })),
      })
    }

    const projects = await prisma.project.findMany({
      where: { status: "active" },
      include: {
        milestones: { where: { completed: false }, orderBy: { orderIndex: "asc" } },
      },
    })

    const todos = projects.flatMap((p) => {
      const selected = selectMilestonesByTimeBudget(p.milestones, p.dailyMinutes)
      return selected.map((m) => ({
        milestoneId: m.id,
        projectId: p.id,
        projectTitle: p.title,
        dailyMinutes: p.dailyMinutes,
        title: m.title,
        estimatedMinutes: m.estimatedMinutes,
      }))
    })

    const totalDailyMinutes = projects.reduce(
      (sum, p) => sum + (p.dailyMinutes ?? 0),
      0
    )

    const endDate = new Date(date)
    endDate.setDate(endDate.getDate() + 1)

    const customTodos = await prisma.standaloneTask.findMany({
      where: {
        planDate: { gte: date, lt: endDate },
        completed: false,
      },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json({
      date: date.toISOString().slice(0, 10),
      todos,
      customTodos: customTodos.map((t) => ({
        id: t.id,
        title: t.title,
        projectId: null,
        projectTitle: null,
      })),
      totalDailyMinutes: totalDailyMinutes || null,
      projectsWithTime: projects
        .filter((p) => p.dailyMinutes != null)
        .map((p) => ({ id: p.id, title: p.title, dailyMinutes: p.dailyMinutes })),
      projects: projects.map((p) => ({ id: p.id, title: p.title })),
    })
  } catch (e) {
    console.error("todos/daily", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}

