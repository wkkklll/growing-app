import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      where: { status: "active" },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ projects })
  } catch (e) {
    console.error("projects/list", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}
