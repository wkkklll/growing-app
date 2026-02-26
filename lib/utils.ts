export function parseJsonStringArray(jsonString: string | null): string[] | null {
  if (!jsonString) return null
  try {
    const parsed = JSON.parse(jsonString)
    return Array.isArray(parsed) ? parsed : null
  } catch (e) {
    console.error("Failed to parse JSON string array:", jsonString, e)
    return null
  }
}

import { prisma } from "@/lib/prisma"

export async function getTotalPoints() {
  const totalPointsResult = await prisma.behaviorLog.aggregate({
    _sum: {
      points: true,
    },
  })
  return totalPointsResult._sum.points || 0
}
