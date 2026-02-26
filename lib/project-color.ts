const PALETTE = [
  "#3b82f6", // sky
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
]

export function getProjectColor(projectId: string): string {
  const hash = projectId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return PALETTE[Math.abs(hash) % PALETTE.length]
}
