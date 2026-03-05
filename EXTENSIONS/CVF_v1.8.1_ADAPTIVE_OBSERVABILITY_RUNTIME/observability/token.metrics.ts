import { invocationLog } from "./invocation.logger"

export function getAverageTokens(skillId: string): number {
  const entries = invocationLog.filter(e => e.skillId === skillId)
  if (entries.length === 0) return 0

  const total = entries.reduce((sum, e) => sum + e.tokensUsed, 0)
  return total / entries.length
}