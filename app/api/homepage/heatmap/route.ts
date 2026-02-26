import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    // Get data for the last year for the heatmap
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    oneYearAgo.setUTCHours(0, 0, 0, 0)

    const dailyLogs = await prisma.dailyLog.findMany({
      where: {
        logDate: {
          gte: oneYearAgo,
        },
      },
      select: {
        logDate: true,
        moodIndex: true,
        aiReview: true,
      },
      orderBy: { logDate: "asc" },
    })

    // Transform data for heatmap: { date: 'YYYY-MM-DD', mood: 1-10, hasReview: boolean }
    const heatmapData = dailyLogs.map(log => ({
      date: log.logDate.toISOString().split('T')[0],
      mood: log.moodIndex,
      hasReview: !!log.aiReview,
    }))

    return NextResponse.json({ heatmapData })
  } catch (e) {
    console.error("homepage/heatmap GET", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}
