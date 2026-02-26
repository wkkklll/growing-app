import { NextRequest, NextResponse } from "next/server"
import { getLLMProvider } from "@/lib/llm"
import { prisma } from "@/lib/prisma"

const REVIEW_PROMPT = `你是 Phoenix Growth OS 的人生教练。对用户当日的完成情况给出具有启发性和动力性的评价。
要求：
1. 语气温和、充满智慧且富有洞察力，像一位资深的人生导师。
2. 肯定用户的每一分努力，同时以启发式的问题引导用户思考如何做得更好。
3. 提供 1-2 条具体的、可操作的“人生教练建议”。
4. 使用清晰的排版，总字数控制在 200 字左右。
直接输出评价内容，不要加前缀或标题。`

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      date?: string
      completionText?: string
    }
    const dateStr = body.date ?? new Date().toISOString().slice(0, 10)
    const text = body.completionText ?? ""

    const provider = getLLMProvider()
    const prompt = `${REVIEW_PROMPT}\n\n用户当日完成情况：${text || "（未填写）"}`
    const aiReview = await provider.complete(prompt)

    const date = new Date(dateStr)
    date.setHours(0, 0, 0, 0)

    await prisma.dailyLog.upsert({
      where: { logDate: date },
      create: {
        logDate: date,
        aiReview,
      },
      update: { aiReview },
    })

    return NextResponse.json({ aiReview })
  } catch (e) {
    console.error("review/daily", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}
