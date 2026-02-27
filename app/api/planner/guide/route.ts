import { NextRequest, NextResponse } from "next/server"
import { getLLMProvider } from "@/lib/llm"

export const dynamic = 'force-dynamic'

const GUIDE_PROMPT = `你是一位项目规划专家。用户想开始一个新项目，但目标还比较模糊。

请根据用户的目标，生成 3-5 个引导性问题，帮助用户澄清：
1. 项目的具体范围
2. 当前的基础/资源
3. 时间约束
4. 成功标准

请只输出问题列表，每行一个，不要编号，不要其他解释。格式示例：
你希望这个项目在多长时间内完成？
你目前在这个领域有什么基础？
项目的最低可交付成果是什么？`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { goal } = body

    if (!goal?.trim()) {
      return NextResponse.json(
        { error: "Goal is required" },
        { status: 400 }
      )
    }

    const provider = getLLMProvider()
    const prompt = `${GUIDE_PROMPT}\n\n用户目标：${goal.trim()}`
    
    const response = await provider.complete(prompt, { maxTokens: 512 })
    
    // Parse questions from response
    const questions = response
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && line.includes('?'))
      .slice(0, 5) // Max 5 questions

    return NextResponse.json({ questions })
  } catch (e) {
    console.error("planner/guide error:", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}
