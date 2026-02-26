import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const planDateStr = searchParams.get("planDate")

  if (!planDateStr) {
    return NextResponse.json({ error: "Missing planDate" }, { status: 400 })
  }

  try {
    const planDate = new Date(planDateStr)
    const scheduledTasks = await prisma.scheduledTask.findMany({
      where: {
        planDate: {
          gte: new Date(planDate.setHours(0, 0, 0, 0)),
          lt: new Date(planDate.setHours(23, 59, 59, 999)),
        },
      },
      orderBy: { startTime: "asc" },
    })
    return NextResponse.json({ scheduledTasks })
  } catch (e: any) {
    console.error("Error fetching scheduled tasks:", e)
    return NextResponse.json({ error: "Failed to fetch scheduled tasks", details: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      planDate: string
      taskId: string
      taskType: "milestone" | "standalone"
      taskTitle: string
      startTime: string
      endTime: string
      originalEstimatedMinutes?: number
    }
    const { planDate, taskId, taskType, taskTitle, startTime, endTime, originalEstimatedMinutes } = body

    // Validate input
    if (!planDate || !taskId || !taskType || !taskTitle || !startTime || !endTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const newScheduledTask = await prisma.scheduledTask.create({
      data: {
        planDate: new Date(planDate),
        taskId,
        taskType,
        taskTitle,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        originalEstimatedMinutes,
      },
    })
    return NextResponse.json({ scheduledTask: newScheduledTask }, { status: 201 })
  } catch (e: any) {
    console.error("Error creating scheduled task:", e)
    return NextResponse.json({ error: "Failed to create scheduled task", details: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      id: string
      startTime?: string
      endTime?: string
    }
    const { id, startTime, endTime } = body

    if (!id) {
      return NextResponse.json({ error: "Missing scheduled task ID" }, { status: 400 })
    }

    const updateData: { startTime?: Date; endTime?: Date } = {}
    if (startTime) updateData.startTime = new Date(startTime)
    if (endTime) updateData.endTime = new Date(endTime)

    const updatedScheduledTask = await prisma.scheduledTask.update({
      where: { id },
      data: updateData,
    })
    return NextResponse.json({ scheduledTask: updatedScheduledTask })
  } catch (e: any) {
    console.error("Error updating scheduled task:", e)
    return NextResponse.json({ error: "Failed to update scheduled task", details: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Missing scheduled task ID" }, { status: 400 })
  }

  try {
    await prisma.scheduledTask.delete({
      where: { id },
    })
    return NextResponse.json({ message: "Scheduled task deleted successfully" }, { status: 200 })
  } catch (e: any) {
    console.error("Error deleting scheduled task:", e)
    return NextResponse.json({ error: "Failed to delete scheduled task", details: e.message }, { status: 500 })
  }
}
