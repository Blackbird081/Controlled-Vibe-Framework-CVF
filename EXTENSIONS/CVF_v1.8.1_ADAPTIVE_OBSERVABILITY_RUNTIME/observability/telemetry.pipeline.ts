import { logInvocation } from "./invocation.logger"
import { calculateCost } from "./cost.calculator"

export function processTelemetry(event: {
  skillId: string
  versionHash: string
  model: string
  tokensUsed: number
  durationMs: number
}) {
  logInvocation({
    ...event,
    timestamp: Date.now()
  })

  const cost = calculateCost(event.model, event.tokensUsed)

  return {
    recorded: true,
    estimatedCost: cost
  }
}