import { RiskAssessment } from "./risk.types"

export interface RollbackPlan {
  required: boolean
  reason?: string
  safeMessage?: string
}

export class RollbackController {
  plan(assessment: RiskAssessment): RollbackPlan {
    if (assessment.cvfRiskLevel === "R4") {
      return {
        required: true,
        reason: "critical_risk",
        safeMessage: "Output withheld due to critical safety risk."
      }
    }

    if (assessment.driftDetected) {
      return {
        required: true,
        reason: "drift_detected",
        safeMessage: "Output withheld until domain alignment is confirmed."
      }
    }

    return { required: false }
  }
}

