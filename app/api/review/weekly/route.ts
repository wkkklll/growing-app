import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getLLMProvider } from "@/lib/llm"
import { parseJsonStringArray } from "@/lib/utils"

export const dynamic = 'force-dynamic'

// API for creating and getting weekly review records
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      projectId?: string | null
      reviewDate?: string
    }

    const { projectId, reviewDate } = body

    const date = reviewDate ? new Date(reviewDate) : new Date()
    date.setHours(0, 0, 0, 0)

    // Calculate the start and end of the current week (Monday to Sunday)
    const startOfWeek = new Date(date)
    startOfWeek.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1)) // Adjust for Monday start
    startOfWeek.setUTCHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setUTCHours(23, 59, 59, 999)

    // 1. Fetch relevant data for the week
    const dailyLogs = await prisma.dailyLog.findMany({
      where: {
        logDate: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
      orderBy: { logDate: "asc" },
    })

    const completedMilestones = await prisma.milestone.findMany({
      where: {
        projectId: projectId || undefined,
        completed: true,
        completedAt: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
      select: { title: true, project: { select: { title: true } } },
    })

    const behaviorLogs = await prisma.behaviorLog.findMany({
      where: {
        createdAt: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
      orderBy: { createdAt: "asc" },
    })

    // 2. Build AI Prompt
    let promptData = `
你是一位经验丰富、善于激励和指导的成长导师。现在我需要你根据用户本周的数据，生成一份结构化的周复盘报告。请严格按照 JSON 格式输出，不要包含任何其他文字或解释。

**本周复盘数据：**
周开始日期: ${startOfWeek.toISOString().split('T')[0]}
周结束日期: ${endOfWeek.toISOString().split('T')[0]}

**本周完成任务：**
`
    if (completedMilestones.length > 0) {
      completedMilestones.forEach(m => {
        promptData += `- ${m.title} (项目: ${m.project?.title || '无'})
`
      })
    } else {
      promptData += `- 无
`
    }

    promptData += `
**本周每日复盘摘要 (AI 评价和心情指数):**
`
    if (dailyLogs.length > 0) {
      dailyLogs.forEach(log => {
        promptData += `- 日期: ${log.logDate.toISOString().split('T')[0]}, 心情指数: ${log.moodIndex}, AI 评价: ${log.aiReview || '无'}
`
      })
    } else {
      promptData += `- 无每日复盘记录
`
    }

    promptData += `
**本周行为积分记录：**
`
    if (behaviorLogs.length > 0) {
      behaviorLogs.forEach(log => {
        const sign = log.points >= 0 ? '+' : ''
        promptData += `- ${log.createdAt.toISOString().split('T')[0]}: ${log.behaviorType}, 积分: ${sign}${log.points}
`
      })
    } else {
      promptData += `- 无行为积分记录
`
    }

    promptData += `
**请根据以上数据，生成以下 JSON 格式的周复盘报告：**
{
  "positiveFeedback": "[具体夸奖用户做得好的地方，例如：在项目X中完成了Y任务，保持了Z心情指数，获得了W积分等。]",
  "areasForImprovement": "[具体指出可以改进的地方，例如：任务X进展缓慢，心情指数Y较低等，并分析潜在原因。]",
  "actionableGuidance": [
    "[明确具体的下周行动指南，例如：下周尝试将大型任务拆解成更小的，不超过30分钟的子任务。]",
    "[另一条行动指南]"
  ]
}
`

    // 3. Call LLM
    const provider = getLLMProvider()
    const rawOutput = await provider.complete(promptData, { maxTokens: 2048 }) // Increased maxTokens for detailed review
    const cleanedOutput = rawOutput.replace(/```json\n?|\n?```/g, "").trim()

    let parsedOutput
    try {
      parsedOutput = JSON.parse(cleanedOutput)
    } catch (parseError) {
      console.error("Failed to parse LLM output for weekly review:", cleanedOutput, parseError)
      return NextResponse.json({ error: "Failed to parse LLM output", rawOutput, cleanedOutput }, { status: 500 })
    }

    const { positiveFeedback, areasForImprovement, actionableGuidance } = parsedOutput

    const weeklyReview = await prisma.weeklyReview.create({
      data: {
        projectId,
        reviewDate: date,
        positiveFeedback: positiveFeedback || "",
        areasForImprovement: areasForImprovement || "",
        actionableGuidance: JSON.stringify(actionableGuidance || []), // Store as JSON string
        aiRawOutput: rawOutput, // Store raw output for debugging
      },
    })

    return NextResponse.json({ success: true, weeklyReview })
  } catch (e) {
    console.error("review/weekly POST", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get("projectId")
    const take = parseInt(searchParams.get("take") || "5", 10)

    const reviews = await prisma.weeklyReview.findMany({
      where: projectId ? { projectId } : {},
      orderBy: { reviewDate: "desc" },
      take,
    })

    return NextResponse.json({
      reviews: reviews.map((r) => ({
        ...r,
        actionableGuidance: parseJsonStringArray(r.actionableGuidance) || [],
      })),
    })
  } catch (e) {
    console.error("review/weekly GET", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}
