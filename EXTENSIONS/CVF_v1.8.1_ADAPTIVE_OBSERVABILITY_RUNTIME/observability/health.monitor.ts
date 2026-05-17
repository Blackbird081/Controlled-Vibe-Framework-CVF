import { detectRegression } from "./regression.detector"
import { getAverageTokens } from "./token.metrics"

export interface HealthStatus {
  regression: boolean
  avgTokens: number
}

export function getHealthStatus(skillId: string): HealthStatus {
  return {
    regression: detectRegression(skillId),
    avgTokens: getAverageTokens(skillId)
  }
}