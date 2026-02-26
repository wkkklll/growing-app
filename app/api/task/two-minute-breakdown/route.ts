import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { callLLM } from "@/lib/llm"

// TODO: move this prompt to a central config or lib
const TWO_MINUTE_BREAKDOWN_PROMPT = `你是一个专业的任务分解助手。你的目标是帮助用户将一个可能让他们感到困难或动力不足的任务，分解成一个可以在两分钟内开始的微小行动，并提供一段能激励用户立刻开始的“动摇脚本”。

请严格遵循以下 JSON 格式输出，不要包含任何其他文字或解释：
{
  "twoMinuteVersion": "[两分钟启动版本，一个具体的、可执行的、两分钟内能完成的行动，例如：打开 VS Code]",
  "antiProcrastinationScript": "[动摇脚本，一段直接针对用户拖延情绪的激励话语，例如：别再等了，你已经知道怎么开始！]"
}

现在，请根据以下任务标题进行分解：
任务标题：{TASK_TITLE}`

export async function POST(request: Request) {
  try {
    const { taskId, taskType, taskTitle } = await request.json()

    if (!taskId || !taskType || !taskTitle) {
      return NextResponse.json({ error: "Missing taskId, taskType, or taskTitle" }, { status: 400 })
    }

    const prompt = TWO_MINUTE_BREAKDOWN_PROMPT.replace("{TASK_TITLE}", taskTitle)
    const rawOutput = await callLLM(prompt)
    const cleanedOutput = rawOutput.replace(/```json\n|```/g, "").trim()

    let parsedOutput
    try {
      parsedOutput = JSON.parse(cleanedOutput)
    } catch (parseError) {
      console.error("Failed to parse LLM output:", cleanedOutput, parseError)
      return NextResponse.json({ error: "Failed to parse LLM output", rawOutput, cleanedOutput }, { status: 500 })
    }

    const { twoMinuteVersion, antiProcrastinationScript } = parsedOutput

    if (taskType === "milestone") {
      await prisma.milestone.update({
        where: { id: taskId },
        data: {
          twoMinuteVersion,
          antiProcrastinationScript,
        },
      })
    } else if (taskType === "standalone") {
      await prisma.standaloneTask.update({
        where: { id: taskId },
        data: {
          twoMinuteVersion,
          antiProcrastinationScript,
        },
      })
    } else {
      return NextResponse.json({ error: "Invalid taskType" }, { status: 400 })
    }

    return NextResponse.json({ twoMinuteVersion, antiProcrastinationScript })
  } catch (error) {
    console.error("Error in two-minute breakdown API:", error)
    return NextResponse.json({ error: "Failed to generate two-minute breakdown" }, { status: 500 })
  }
}
