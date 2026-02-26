import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { parseJsonStringArray } from "@/lib/utils"

export async function GET(req: NextRequest) {
  try {
    const settings = await prisma.setting.findUnique({
      where: { key: "visionBoard" },
    })

    const phrases = parseJsonStringArray(settings?.motivationPhrases || null) || [
      "每天都是新的开始！",
      "相信自己，你可以做到！",
      "坚持不懈，终将成功！",
      "小步快跑，积少成多！",
      "活在当下，享受过程！",
    ]

    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)]

    return NextResponse.json({ quote: randomPhrase })
  } catch (e) {
    console.error("homepage/quote GET", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}
