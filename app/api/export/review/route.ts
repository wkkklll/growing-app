import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const reviewId = searchParams.get("reviewId")
  const reviewType = searchParams.get("reviewType")

  if (!reviewId || !reviewType) {
    return NextResponse.json({ error: "Missing reviewId or reviewType" }, { status: 400 })
  }

  let markdownContent = ""
  let filename = "review.md"

  try {
    if (reviewType === "weekly") {
      const weeklyReview = await prisma.weeklyReview.findUnique({
        where: { id: reviewId },
      })

      if (!weeklyReview) {
        return NextResponse.json({ error: "Weekly review not found" }, { status: 404 })
      }

      const reviewDate = new Date(weeklyReview.reviewDate).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })
      filename = `每周复盘-${reviewDate}.md`

      let actionableGuidanceList: string[] = []
      try {
        if (weeklyReview.actionableGuidance) {
          actionableGuidanceList = JSON.parse(weeklyReview.actionableGuidance)
        }
      } catch (e) {
        console.error("Error parsing actionableGuidance:", e)
      }

      markdownContent = `# 每周复盘 - ${reviewDate}\n\n`
      markdownContent += `## 本周概览\n\n`
      markdownContent += `- 复盘日期: ${new Date(weeklyReview.reviewDate).toLocaleDateString("zh-CN")}\n\n`

      markdownContent += `## AI 积极反馈\n\n${weeklyReview.positiveFeedback || "暂无"}\n\n`
      markdownContent += `## AI 改进领域\n\n${weeklyReview.areasForImprovement || "暂无"}\n\n`

      if (actionableGuidanceList.length > 0) {
        markdownContent += `## AI 行动指南\n\n`
        actionableGuidanceList.forEach((guidance) => {
          markdownContent += `- ${guidance}\n`
        })
        markdownContent += `\n`
      }

    } else if (reviewType === "daily") {
      const dailyLog = await prisma.dailyLog.findUnique({
        where: { id: reviewId },
        include: { milestones: true, standaloneTasks: true, behaviorLogs: true, dailyMetrics: true },
      })

      if (!dailyLog) {
        return NextResponse.json({ error: "Daily log not found" }, { status: 404 })
      }

      const logDate = new Date(dailyLog.logDate).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })
      filename = `每日复盘-${logDate}.md`

      markdownContent = `# 每日复盘 - ${logDate}\n\n`
      markdownContent += `## 心情指数\n\n${dailyLog.moodIndex || "N/A"}/10\n\n`
      markdownContent += `## 日志内容\n\n${dailyLog.content || "暂无"}\n\n`

      if (dailyLog.milestones.length > 0) {
        markdownContent += `## 完成里程碑\n\n`
        dailyLog.milestones.forEach((m) => {
          markdownContent += `- [${m.isCompleted ? "x" : " "}] ${m.title}\n`
        })
        markdownContent += `\n`
      }

      if (dailyLog.standaloneTasks.length > 0) {
        markdownContent += `## 完成独立任务\n\n`
        dailyLog.standaloneTasks.forEach((t) => {
          markdownContent += `- [${t.isCompleted ? "x" : " "}] ${t.title}\n`
        })
        markdownContent += `\n`
      }

      if (dailyLog.behaviorLogs.length > 0) {
        markdownContent += `## 行为记录\n\n`
        dailyLog.behaviorLogs.forEach((b) => {
          markdownContent += `- ${b.behaviorType}: ${b.points} 积分 (${new Date(b.createdAt).toLocaleTimeString("zh-CN")})\n`
        })
        markdownContent += `\n`
      }

      if (dailyLog.dailyMetrics.length > 0) {
        markdownContent += `## 每日指标\n\n`
        dailyLog.dailyMetrics.forEach((m) => {
          markdownContent += `- ${m.metricType}: ${m.value}\n`
        })
        markdownContent += `\n`
      }

    } else {
      return NextResponse.json({ error: "Invalid reviewType" }, { status: 400 })
    }

    return new NextResponse(markdownContent, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`, // Ensure filename is URL-encoded
      },
    })
  } catch (e: any) {
    console.error("Error exporting review:", e)
    return NextResponse.json({ error: "Failed to export review", details: e.message }, { status: 500 })
  }
}
