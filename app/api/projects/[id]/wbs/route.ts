import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = (await req.json()) as {
      wbsTree: string
    }
    const { wbsTree } = body

    if (!wbsTree) {
      return NextResponse.json({ error: "wbsTree is required" }, { status: 400 })
    }

    await prisma.project.update({
      where: { id },
      data: { wbsTree: wbsTree },
    })

    // Sync milestones table with leaf nodes of the new wbsTree
    const parsedTree = JSON.parse(wbsTree)
    const flattenMilestones = (
      nodes: any[],
      acc: { title: string; estimatedMinutes: number }[] = []
    ) => {
      nodes.forEach((n) => {
        const hasChildren = Array.isArray(n.children) && n.children.length > 0
        if (!hasChildren) {
          acc.push({ title: n.title, estimatedMinutes: n.estimatedMinutes || 30 })
        } else {
          flattenMilestones(n.children, acc)
        }
      })
      return acc
    }

    const leafMilestones = flattenMilestones(parsedTree)

    // Simple sync: delete old milestones and create new ones
    // NOTE: This will lose completion status. A more advanced sync would match by title/id.
    // For now, let's just update the milestones.
    await prisma.milestone.deleteMany({ where: { projectId: id, isManual: false } })
    await prisma.milestone.createMany({
      data: leafMilestones.map((m, i) => ({
        projectId: id,
        title: m.title,
        orderIndex: i,
        estimatedMinutes: m.estimatedMinutes,
      })),
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("projects/[id]/wbs PATCH", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}
