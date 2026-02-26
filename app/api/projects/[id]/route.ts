import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        milestones: {
          orderBy: { orderIndex: "asc" },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (e) {
    console.error("projects/get", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    
    const {
      title,
      targetDescription,
      endDate,
      behaviorMetrics,
      resultMetrics,
      capabilityMetrics,
      dailyMinutes,
      status
    } = body

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        title: title !== undefined ? title : undefined,
        targetDescription: targetDescription !== undefined ? targetDescription : undefined,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
        behaviorMetrics: behaviorMetrics !== undefined ? (Array.isArray(behaviorMetrics) ? JSON.stringify(behaviorMetrics) : behaviorMetrics) : undefined,
        resultMetrics: resultMetrics !== undefined ? (Array.isArray(resultMetrics) ? JSON.stringify(resultMetrics) : resultMetrics) : undefined,
        capabilityMetrics: capabilityMetrics !== undefined ? (Array.isArray(capabilityMetrics) ? JSON.stringify(capabilityMetrics) : capabilityMetrics) : undefined,
        dailyMinutes: dailyMinutes !== undefined ? dailyMinutes : undefined,
        status: status !== undefined ? status : undefined,
      },
    })

    return NextResponse.json({ success: true, project: updatedProject })
  } catch (e) {
    console.error("projects/[id] PATCH", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.project.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("projects/delete", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}
