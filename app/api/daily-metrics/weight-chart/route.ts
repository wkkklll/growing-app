import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const oneMonthAgo = new Date()
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30)
    oneMonthAgo.setUTCHours(0, 0, 0, 0)

    const weightData = await prisma.dailyMetric.findMany({
      where: {
        metricType: "weight",
        logDate: {
          gte: oneMonthAgo,
        },
      },
      select: {
        logDate: true,
        value: true,
      },
      orderBy: { logDate: "asc" },
    })

    // Fill in missing dates with null or 0 for a continuous chart
    const dateMap = new Map(weightData.map(d => [d.logDate.toISOString().split('T')[0], d.value]))
    const result = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      result.push({
        date: dateStr,
        value: dateMap.get(dateStr) || null, // null for missing days
      })
    }

    return NextResponse.json({ weightData: result })
  } catch (e) {
    console.error("daily-metrics/weight-chart GET", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}
