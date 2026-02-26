import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const logDateStr = req.nextUrl.searchParams.get("date")
  const metricType = req.nextUrl.searchParams.get("metricType")

  if (!logDateStr) {
    return NextResponse.json({ error: "Missing date parameter" }, { status: 400 })
  }

  const logDate = new Date(logDateStr)
  logDate.setUTCHours(0, 0, 0, 0) // Normalize to start of day UTC

  try {
    const whereClause: any = { logDate }
    if (metricType) {
      whereClause.metricType = metricType
    }

    const metrics = await prisma.dailyMetric.findMany({
      where: whereClause,
      orderBy: { createdAt: "asc" },
    })
    return NextResponse.json({ metrics })
  } catch (e) {
    console.error("daily-metrics/GET", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      logDate: string
      metricType: string
      value: number
    }
    const { logDate, metricType, value } = body

    if (!logDate || !metricType || value === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const date = new Date(logDate)
    date.setUTCHours(0, 0, 0, 0)

    const updatedMetric = await prisma.dailyMetric.upsert({
      where: {
        logDate_metricType: {
          logDate: date,
          metricType: metricType,
        },
      },
      update: { value },
      create: {
        logDate: date,
        metricType,
        value,
      },
    })

    return NextResponse.json({ metric: updatedMetric })
  } catch (e) {
    console.error("daily-metrics/POST", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}
