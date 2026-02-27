import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getLLMProvider } from "@/lib/llm"

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { goal, questions, answers, dailyMinutes } = body

    if (!goal?.trim()) {
      return NextResponse.json(
        { error: "Goal is required" },
        { status: 400 }
      )
    }

    const provider = getLLMProvider()
    
    // Build context from Q&A
    const qaContext = questions?.map((q: string, i: number) => {
      const a = answers?.[i] ?? "未回答"
      return `Q: ${q}\nA: ${a}`
    }).join('\n\n') ?? ""

    const prompt = `你是一位 WBS (工作分解结构) 专家。请为以下项目生成一个结构化的 WBS。

项目目标：${goal.trim()}

${qaContext ? `补充信息：\n${qaContext}\n\n` : ""}
建议每日投入：${dailyMinutes} 分钟

请生成一个 JSON 格式的 WBS，包含以下字段：
- title: 项目标题（简洁）
- description: 项目描述（一句话）
- milestones: 里程碑数组，每个包含 title 和 estimatedMinutes

里程碑数量建议 3-6 个，每个里程碑建议 30-120 分钟。请确保里程碑是具体可执行的任务。

只返回 JSON，不要其他文字。格式示例：
{
  "title": "学习 Python 基础",
  "description": "掌握 Python 编程语言的核心语法和基本概念",
  "milestones": [
    {"title": "完成变量和数据类型学习", "estimatedMinutes": 45},
    {"title": "掌握条件语句和循环", "estimatedMinutes": 60}
  ]
}`

    const response = await provider.complete(prompt, { maxTokens: 1024 })
    
    // Parse JSON from response
    let parsed: {
      title?: string
      description?: string
      milestones?: Array<{ title: string; estimatedMinutes: number }>
    }
    
    try {
      const cleaned = response.replace(/```json\n?|\n?```/g, "").trim()
      parsed = JSON.parse(cleaned)
    } catch (parseError) {
      console.error("Failed to parse WBS JSON:", response)
      return NextResponse.json(
        { error: "Failed to generate valid WBS" },
        { status: 500 }
      )
    }

    // Create project in database
    const project = await prisma.project.create({
      data: {
        title: parsed.title || goal.trim(),
        targetDescription: parsed.description || goal.trim(),
        dailyMinutes: dailyMinutes || 60,
        status: "active",
        progressPercent: 0,
        stagnationDays: 0,
        wbsTree: JSON.stringify(parsed.milestones || []),
      },
    })

    // Create milestones
    const milestones = parsed.milestones || []
    if (milestones.length > 0) {
      await prisma.milestone.createMany({
        data: milestones.map((m, index) => ({
          projectId: project.id,
          title: m.title,
          estimatedMinutes: m.estimatedMinutes || 60,
          orderIndex: index,
          completed: false,
        })),
      })
    }

    return NextResponse.json({ 
      projectId: project.id,
      project: {
        id: project.id,
        title: project.title,
        milestones: milestones,
      }
    })
  } catch (e) {
    console.error("planner/generate-wbs error:", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}
