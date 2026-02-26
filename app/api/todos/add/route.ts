import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      title: string
      projectId?: string | null
      date?: string
      twoMinuteVersion?: string | null
      antiProcrastinationScript?: string | null
    }

    const { title, projectId, date, twoMinuteVersion, antiProcrastinationScript } = body
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const planDate = date ? new Date(date) : new Date()
    planDate.setHours(0, 0, 0, 0)

    if (projectId) {
      // 创建为项目的 Milestone
      const lastMilestone = await prisma.milestone.findFirst({
        where: { projectId },
        orderBy: { orderIndex: "desc" },
      })
      const orderIndex = (lastMilestone?.orderIndex ?? -1) + 1

      const milestone = await prisma.milestone.create({
        data: {
          title,
          projectId,
          orderIndex,
          isManual: true,
          estimatedMinutes: 25,
          twoMinuteVersion: twoMinuteVersion || undefined,
          antiProcrastinationScript: antiProcrastinationScript || undefined,
        },
        include: {
          project: { select: { title: true, dailyMinutes: true } },
        },
      })

      return NextResponse.json({
        type: "milestone",
        todo: {
          milestoneId: milestone.id,
          projectId: milestone.projectId,
          projectTitle: milestone.project.title,
          title: milestone.title,
          dailyMinutes: milestone.project.dailyMinutes,
        },
      })
    } else {
      // 创建为独立任务
      const task = await prisma.standaloneTask.create({
        data: {
          title,
          planDate,
          twoMinuteVersion: twoMinuteVersion || undefined,
          antiProcrastinationScript: antiProcrastinationScript || undefined,
        },
      })

      return NextResponse.json({
        type: "standalone",
        todo: {
          id: task.id,
          title: task.title,
          completed: task.completed,
        },
      })
    }
  } catch (e) {
    console.error("todos/add", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}
