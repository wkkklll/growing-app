import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const logs = await prisma.dailyLog.findMany({
      where: { aiReview: { not: null } },
      orderBy: { logDate: "desc" },
      take: 10,
      select: { logDate: true, aiReview: true },
    })
    return NextResponse.json({
      logs: logs.map((l) => ({
        date: l.logDate.toISOString().slice(0, 10),
        aiReview: l.aiReview,
      })),
    })
  } catch (e) {
    console.error("analysis/recent", e)
    return NextResponse.json({ logs: [] })
  }
}
