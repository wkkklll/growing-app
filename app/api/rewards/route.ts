import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const rewardType = req.nextUrl.searchParams.get("rewardType") || "general"
  try {
    const rewards = await prisma.reward.findMany({
      where: { rewardType },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ rewards })
  } catch (e) {
    console.error("rewards/GET", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      title: string
      costPoints: number
      rewardType?: string
      status?: "pending" | "claimed"
    }
    const { title, costPoints, rewardType = "general", status = "pending" } = body

    if (!title || costPoints === undefined || costPoints <= 0) {
      return NextResponse.json({ error: "Invalid reward details" }, { status: 400 })
    }

    const newReward = await prisma.reward.create({
      data: {
        title,
        costPoints,
        rewardType,
        status,
      },
    })
    return NextResponse.json({ reward: newReward })
  } catch (e) {
    console.error("rewards/POST", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "Missing reward ID" }, { status: 400 })
  }

  try {
    await prisma.reward.delete({
      where: { id },
    })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("rewards/DELETE", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}
