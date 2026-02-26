import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const task = await prisma.standaloneTask.update({
      where: { id },
      data: { completed: true },
      select: { id: true }, // Select ID to use for logging
    })

    // For standalone tasks, assign a fixed point value for now
    const points = 5
    await prisma.behaviorLog.create({
      data: {
        standaloneTaskId: task.id,
        behaviorType: "standalone_task_completion",
        points,
      },
    })
  } catch (e) {
    console.error("standalone/complete", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}
