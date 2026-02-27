import { NextRequest, NextResponse } from "next/server"
import { getLLMProvider } from "@/lib/llm"

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { goal, answers } = body

    if (!goal?.trim()) {
      return NextResponse.json(
        { error: "Goal is required" },
        { status: 400 }
      )
    }

    const provider = getLLMProvider()
    
    const context = answers?.length 
      ? `用户的补充回答：\n${answers.map((a: string, i: number) => `${i + 1}. ${a}`).join('\n')}`
      : ''
    
    const prompt = `根据以下项目目标和用户回答，建议一个合理的每日投入时间（分钟数）。

项目目标：${goal.trim()}
${context}

请只返回一个数字（15-240之间的15的倍数），代表建议的每日投入分钟数。不要任何解释。`

    const response = await provider.complete(prompt, { maxTokens: 64 })
    
    // Extract number from response
    const match = response.match(/\d+/)
    const dailyMinutes = match ? parseInt(match[0], 10) : 60
    
    // Round to nearest 15, clamp between 15 and 240
    const normalizedMinutes = Math.min(240, Math.max(15, Math.round(dailyMinutes / 15) * 15))

    return NextResponse.json({ dailyMinutes: normalizedMinutes })
  } catch (e) {
    console.error("planner/suggest-daily error:", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}
