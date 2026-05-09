import { CVFRiskLevel, DriftSignal } from "./risk.types"

export interface DriftInput {
  declaredDomain: string
  classifiedDomain: string
  previousRisk?: CVFRiskLevel
  currentRisk: CVFRiskLevel
}

const RISK_ORDER: Record<CVFRiskLevel, number> = {
  R0: 0,
  R1: 1,
  R2: 2,
  R3: 3,
  R4: 4,
}

export class DriftDetector {
  detect(input: DriftInput): DriftSignal {
    const reasons: string[] = []

    if (input.declaredDomain !== input.classifiedDomain) {
      reasons.push("domain_drift")
    }

    if (input.previousRisk) {
      const previous = RISK_ORDER[input.previousRisk]
      const current = RISK_ORDER[input.currentRisk]
      if (current - previous >= 2) {
        reasons.push("risk_jump")
      }
    }

    return {
      detected: reasons.length > 0,
      reasons,
    }
  }
}
