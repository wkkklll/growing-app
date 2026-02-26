import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const logDateStr = searchParams.get("logDate")
  const status = searchParams.get("status")

  try {
    const where: any = {}
    if (logDateStr) {
      const logDate = new Date(logDateStr)
      where.logDate = {
        gte: new Date(logDate.setHours(0, 0, 0, 0)),
        lt: new Date(logDate.setHours(23, 59, 59, 999)),
      }
    }
    if (status) {
      where.status = status
    }

    const threads = await prisma.emotionThread.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    })
    return NextResponse.json({ threads })
  } catch (e: any) {
    console.error("Error fetching emotion threads:", e)
    return NextResponse.json({ error: "Failed to fetch emotion threads", details: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      logDate?: string
      title: string
    }
    const { logDate, title } = body

    if (!title) {
      return NextResponse.json({ error: "Missing thread title" }, { status: 400 })
    }

    const newThread = await prisma.emotionThread.create({
      data: {
        logDate: logDate ? new Date(logDate) : undefined,
        title,
        status: "open",
      },
    })
    return NextResponse.json({ thread: newThread }, { status: 201 })
  } catch (e: any) {
    console.error("Error creating emotion thread:", e)
    return NextResponse.json({ error: "Failed to create emotion thread", details: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Missing thread ID" }, { status: 400 })
  }

  try {
    await prisma.emotionThread.delete({
      where: { id },
    })
    return NextResponse.json({ message: "Emotion thread deleted successfully" })
  } catch (e: any) {
    console.error("Error deleting emotion thread:", e)
    return NextResponse.json({ error: "Failed to delete emotion thread", details: e.message }, { status: 500 })
  }
}
