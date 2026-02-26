// 根据项目每日投入时间，按预估时长选择任务（不超过时间预算）
const DEFAULT_ESTIMATE_MINUTES = 25

export type MilestoneWithEstimate = {
  id: string
  title: string
  estimatedMinutes: number | null
}

/** 按时间预算选择里程碑，累计预估时长不超过 dailyMinutes */
export function selectMilestonesByTimeBudget<T extends MilestoneWithEstimate>(
  milestones: T[],
  dailyMinutes: number | null
): T[] {
  const budget = dailyMinutes ?? 60
  const selected: T[] = []
  let used = 0
  for (const m of milestones) {
    const est = m.estimatedMinutes ?? DEFAULT_ESTIMATE_MINUTES
    if (used + est <= budget || selected.length === 0) {
      selected.push(m)
      used += est
    } else {
      break
    }
  }
  return selected
}
