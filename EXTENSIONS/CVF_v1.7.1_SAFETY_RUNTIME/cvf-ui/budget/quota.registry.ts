import { prisma } from "../lib/db"

export async function getUserDailyUsage(userId: string): Promise<number> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const logs = await prisma.auditLog.findMany({
    where: {
      userId,
      createdAt: { gte: today },
    },
  })

  return logs.reduce(
    (sum: number, l: { totalTokens: number | null }) => sum + (l.totalTokens || 0),
    0
  )
}

export async function getOrgMonthlyUsage(): Promise<number> {
  const start = new Date()
  start.setDate(1)
  start.setHours(0, 0, 0, 0)

  const logs = await prisma.auditLog.findMany({
    where: {
      createdAt: { gte: start },
    },
  })

  return logs.reduce(
    (sum: number, l: { totalTokens: number | null }) => sum + (l.totalTokens || 0),
    0
  )
}
