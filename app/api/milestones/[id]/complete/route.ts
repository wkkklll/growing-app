import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const milestone = await prisma.milestone.update({
      where: { id },
      data: { completed: true, completedAt: new Date() },
      select: { id: true, estimatedMinutes: true },
    })

    const points = Math.max(1, Math.round((milestone.estimatedMinutes || 25) / 10))
    await prisma.behaviorLog.create({
      data: {
        milestoneId: milestone.id,
        behaviorType: "milestone_completion",
        points,
      },
    })

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
    for (const [pid, { total, done }] of Array.from(byProject)) {
      const percent = total > 0 ? Math.round((done / total) * 100) : 0
      await prisma.project.update({
        where: { id: pid },
        data: { progressPercent: percent },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("milestones/complete", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}
