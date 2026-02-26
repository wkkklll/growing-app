import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      milestoneId?: string
      standaloneTaskId?: string
      behaviorType: string
      points: number
    }

    const { milestoneId, standaloneTaskId, behaviorType, points } = body

    if (!behaviorType || points === undefined) {
      return NextResponse.json({ error: "behaviorType and points are required" }, { status: 400 })
    }

    const behaviorLog = await prisma.behaviorLog.create({
      data: {
        milestoneId,
        standaloneTaskId,
        behaviorType,
        points,
      },
    })

    return NextResponse.json({ success: true, behaviorLog })
  } catch (e) {
    console.error("behavior/log", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}
