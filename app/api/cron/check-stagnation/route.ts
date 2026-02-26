import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// This API route is intended to be called by a cron job (e.g., Vercel Cron, GitHub Actions)
// It checks project stagnation and applies anti-abandonment strategies.
export async function GET(req: NextRequest) {
  try {
    // Ensure this is a cron-only endpoint if deployed publicly
    // const authHeader = req.headers.get("authorization")
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return new NextResponse("Unauthorized", { status: 401 })
    // }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const projects = await prisma.project.findMany({
      where: { status: "active" },
      include: {
        milestones: { select: { id: true, completed: true, completedAt: true } },
        dailyTodos: { where: { completed: true, logDate: today }, select: { id: true } },
      },
    })

    for (const project of projects) {
      const completedMilestonesToday = project.milestones.some(
        (m) => m.completed && m.completedAt && m.completedAt >= today && m.completedAt < tomorrow
      )
      const completedDailyTodosToday = project.dailyTodos.length > 0

      const wasActiveToday = completedMilestonesToday || completedDailyTodosToday

      if (wasActiveToday) {
        await prisma.project.update({
          where: { id: project.id },
          data: {
            stagnationDays: 0,
            lastActivityDate: today,
          },
        })
      } else {
        // If not active today, increment stagnation days
        const newStagnationDays = project.stagnationDays + 1
        await prisma.project.update({
          where: { id: project.id },
          data: {
            stagnationDays: newStagnationDays,
          },
        })

        // Apply anti-abandonment strategies
        if (newStagnationDays === 2) {
          console.log(`Project ${project.title} (${project.id}) has stagnated for 2 days. Consider forcing 2-minute versions.`)
          // Forcing 2-minute versions would be a frontend UI change, or marking tasks in DB
        } else if (newStagnationDays === 3 || newStagnationDays === 7) {
          console.log(`Project ${project.title} (${project.id}) has stagnated for ${newStagnationDays} days. Triggering LLM adjustment.`)
          await fetch(`${req.nextUrl.origin}/api/project/adjust-difficulty`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId: project.id, stagnationDays: newStagnationDays }),
          })
        }
      }
    }

    return NextResponse.json({ success: true, message: "Stagnation check completed." })
  } catch (e) {
    console.error("cron/check-stagnation", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}
