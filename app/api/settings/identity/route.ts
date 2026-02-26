import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const IDENTITY_KEY = "identityDescription"

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      identityDescription: string
    }

    const { identityDescription } = body

    if (!identityDescription) {
      return NextResponse.json({ error: "identityDescription is required" }, { status: 400 })
    }

    const setting = await prisma.setting.upsert({
      where: { key: IDENTITY_KEY },
      update: { value: identityDescription },
      create: { key: IDENTITY_KEY, value: identityDescription },
    })

    return NextResponse.json({ success: true, identityDescription: setting.value })
  } catch (e) {
    console.error("settings/identity POST", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: IDENTITY_KEY },
    })

    return NextResponse.json({ identityDescription: setting?.value || null })
  } catch (e) {
    console.error("settings/identity GET", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}
