import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const inspirations = await prisma.inspiration.findMany({
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ inspirations })
  } catch (e: any) {
    console.error("Error fetching inspirations:", e)
    return NextResponse.json({ error: "Failed to fetch inspirations" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json()
    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }
    const inspiration = await prisma.inspiration.create({
      data: { content },
    })
    return NextResponse.json({ inspiration }, { status: 201 })
  } catch (e: any) {
    console.error("Error creating inspiration:", e)
    return NextResponse.json({ error: "Failed to create inspiration" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 })
  }
  try {
    await prisma.inspiration.delete({ where: { id } })
    return NextResponse.json({ message: "Inspiration deleted" })
  } catch (e: any) {
    console.error("Error deleting inspiration:", e)
    return NextResponse.json({ error: "Failed to delete inspiration" }, { status: 500 })
  }
}
