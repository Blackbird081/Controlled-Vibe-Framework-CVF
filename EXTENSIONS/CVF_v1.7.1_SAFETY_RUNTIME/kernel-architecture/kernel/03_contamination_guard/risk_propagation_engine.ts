import { RiskAssessment } from "./risk.types"

const CVF_ORDER = {
  R0: 0,
  R1: 1,
  R2: 2,
  R3: 3,
  R4: 4
} as const

const ORDER_TO_LEVEL = ["R0", "R1", "R2", "R3", "R4"] as const

export class RiskPropagationEngine {
  propagate(
    base: RiskAssessment,
    assumptions: string[],
    driftDetected: boolean
  ): RiskAssessment {
    let next: number = CVF_ORDER[base.cvfRiskLevel]

    if (assumptions.length > 0) {
      next = Math.min(4, next + 1)
    }

    if (driftDetected) {
      next = Math.min(4, next + 1)
    }

    const cvfRiskLevel = ORDER_TO_LEVEL[next]
    const score = Math.min(100, base.score + assumptions.length * 5 + (driftDetected ? 10 : 0))

    return {
      ...base,
      cvfRiskLevel,
      level: cvfRiskLevel === "R4" ? "critical" : cvfRiskLevel === "R3" ? "high" : cvfRiskLevel === "R2" ? "medium" : "low",
      score,
      reasons: [...base.reasons, ...assumptions, ...(driftDetected ? ["drift_detected"] : [])],
      driftDetected,
      assumptions
    }
  }
}
