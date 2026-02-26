import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const settings = await prisma.setting.findUnique({
      where: { key: "visionBoard" },
      select: {
        yearlyWishes: true,
        motivationPhrases: true,
      },
    })

    return NextResponse.json({
      yearlyWishes: settings?.yearlyWishes ? JSON.parse(settings.yearlyWishes) : [],
      motivationPhrases: settings?.motivationPhrases ? JSON.parse(settings.motivationPhrases) : [],
    })
  } catch (error) {
    console.error("Failed to fetch vision board settings:", error)
    return NextResponse.json({ error: "Failed to fetch vision board settings" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { yearlyWishes, motivationPhrases } = await request.json()

    const updatedSettings = await prisma.setting.upsert({
      where: { key: "visionBoard" },
      update: {
        yearlyWishes: JSON.stringify(yearlyWishes),
        motivationPhrases: JSON.stringify(motivationPhrases),
      },
      create: {
        key: "visionBoard",
        value: "Vision Board Settings", // Placeholder value for the 'value' field
        yearlyWishes: JSON.stringify(yearlyWishes),
        motivationPhrases: JSON.stringify(motivationPhrases),
      },
      select: {
        yearlyWishes: true,
        motivationPhrases: true,
      },
    })

    return NextResponse.json({
      yearlyWishes: updatedSettings.yearlyWishes ? JSON.parse(updatedSettings.yearlyWishes) : [],
      motivationPhrases: updatedSettings.motivationPhrases ? JSON.parse(updatedSettings.motivationPhrases) : [],
    })
  } catch (error) {
    console.error("Failed to update vision board settings:", error)
    return NextResponse.json({ error: "Failed to update vision board settings" }, { status: 500 })
  }
}
