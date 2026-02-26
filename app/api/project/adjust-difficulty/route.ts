import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getLLMProvider } from "@/lib/llm"

// This API is intended to be called by the cron job to adjust project difficulty
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      projectId: string
      stagnationDays: number
    }

    const { projectId, stagnationDays } = body

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        targetDescription: true,
        wbsTree: true,
        milestones: { where: { completed: false }, select: { id: true, title: true, estimatedMinutes: true } },
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const provider = getLLMProvider()
    let llmPrompt = ""

    if (stagnationDays === 3) {
      llmPrompt = `项目「${project.title}」已连续停滞 3 天。当前目标描述：${project.targetDescription}。未完成任务：${project.milestones.map(m => m.title).join(", ")}。请提供降低项目难度的建议，可以修改目标描述或调整未完成任务的预估时间。输出格式为 JSON，包含 "newTargetDescription" (可选) 和 "milestoneAdjustments": [{ id: "milestoneId", newEstimatedMinutes: 30 }] (可选)。`
    } else if (stagnationDays >= 7) {
      llmPrompt = `项目「${project.title}」已连续停滞 ${stagnationDays} 天。当前目标描述：${project.targetDescription}。未完成任务：${project.milestones.map(m => m.title).join(", ")}。请提供重新定义阶段目标的建议。输出格式为 JSON，包含 "newTargetDescription" (可选) 和 "newMilestones": [{ title: "新任务", estimatedMinutes: 30 }] (可选)。`
    } else {
      return NextResponse.json({ success: true, message: "No LLM adjustment needed for this stagnation level." })
    }

    const raw = await provider.complete(llmPrompt, { maxTokens: 1024 })
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim()
    const llmResponse = JSON.parse(cleaned)

    // Apply changes from LLM response
    if (llmResponse.newTargetDescription) {
      await prisma.project.update({
        where: { id: projectId },
        data: { targetDescription: llmResponse.newTargetDescription },
      })
    }
    if (llmResponse.milestoneAdjustments) {
      for (const adj of llmResponse.milestoneAdjustments) {
        await prisma.milestone.update({
          where: { id: adj.id },
          data: { estimatedMinutes: adj.newEstimatedMinutes },
        })
      }
    }
    if (llmResponse.newMilestones) {
      await prisma.milestone.createMany({
        data: llmResponse.newMilestones.map((m: { title: string; estimatedMinutes: number }) => ({
          projectId: project.id,
          title: m.title,
          estimatedMinutes: m.estimatedMinutes,
          orderIndex: 9999, // TODO: proper orderIndex logic
          isManual: true, // Mark as manually (AI) adjusted
        })),
      })
    }

    return NextResponse.json({ success: true, llmResponse })
  } catch (e) {
    console.error("project/adjust-difficulty", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}
