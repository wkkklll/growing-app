import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getTotalPoints } from "@/lib/utils"

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      title: string
      costPoints: number
      rewardType?: string // e.g., "general", "short_term_wish"
    }

    const { title, costPoints, rewardType = "general" } = body

    if (!title || costPoints === undefined || costPoints <= 0) {
      return NextResponse.json({ error: "Invalid reward details" }, { status: 400 })
    }

    const currentPoints = await getTotalPoints()

    if (currentPoints < costPoints) {
      return NextResponse.json({ error: "Insufficient points" }, { status: 403 })
    }

    const newReward = await prisma.reward.create({
      data: {
        title,
        costPoints,
        rewardType,
        claimedAt: new Date(),
        status: "claimed",
      },
    })

    // Deduct points from BehaviorLog
    await prisma.behaviorLog.create({
      data: {
        behaviorType: "reward_spent",
        points: -costPoints,
        rewardId: newReward.id,
      },
    })

    const updatedPoints = await getTotalPoints()

    return NextResponse.json({
      success: true,
      message: `Successfully claimed reward: ${title}`,
      newReward,
      currentPoints: updatedPoints,
    })
  } catch (e) {
    console.error("rewards/claim", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}
