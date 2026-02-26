import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const logs = await prisma.behaviorLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20, // Limit for recent logs
    })
    
    // Also calculate total points
    const totalPointsResult = await prisma.behaviorLog.aggregate({
      _sum: {
        points: true,
      },
    })
    const totalPoints = totalPointsResult._sum.points || 0

    return NextResponse.json({ logs, totalPoints })
  } catch (e) {
    console.error("behavior/logs", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    const clearAll = searchParams.get("clearAll") === "true"

    if (clearAll) {
      await prisma.behaviorLog.deleteMany({})
      return NextResponse.json({ message: "All behavior logs cleared" })
    }

    if (!id) {
      return NextResponse.json({ error: "Missing log ID" }, { status: 400 })
    }

    await prisma.behaviorLog.delete({
      where: { id },
    })
    return NextResponse.json({ message: "Behavior log deleted successfully" })
  } catch (e) {
    console.error("behavior/logs:delete", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}
