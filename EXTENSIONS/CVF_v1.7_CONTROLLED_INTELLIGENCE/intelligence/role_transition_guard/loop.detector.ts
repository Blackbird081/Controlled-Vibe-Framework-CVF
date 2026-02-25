import { AgentRole } from "./role.graph"

export interface LoopDetectionResult {
  loopDetected: boolean
  reason?: string
}

export function detectRoleLoop(
  history: AgentRole[],
  maxRepeat: number = 3
): LoopDetectionResult {

  if (history.length < maxRepeat) {
    return { loopDetected: false }
  }

  const recent = history.slice(-maxRepeat)

  const allSame = recent.every(role => role === recent[0])

  if (allSame) {
    return {
      loopDetected: true,
      reason: `Role ${recent[0]} repeated ${maxRepeat} times consecutively.`
    }
  }

  return { loopDetected: false }
}