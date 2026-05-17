// regression.detector.ts

export {}

import { invocationLog } from "./invocation.logger"

export function detectRegression(skillId: string): boolean {
  const entries = invocationLog
    .filter(e => e.skillId === skillId)
    .slice(-20)

  if (entries.length < 10) return false

  const firstHalf = entries.slice(0, 10)
  const secondHalf = entries.slice(10)

  const avgFirst =
    firstHalf.reduce((s, e) => s + e.tokensUsed, 0) / firstHalf.length

  const avgSecond =
    secondHalf.reduce((s, e) => s + e.tokensUsed, 0) / secondHalf.length

  return avgSecond > avgFirst * 1.3
}