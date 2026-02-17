// financial.risk.profile.ts
// Defines financial-domain specific risk interpretation layered on CVF core

import { RiskLevel } from "../../02_TOOLKIT_CORE/interfaces"

export interface FinancialRiskProfile {
  skillId: string
  financialImpactLevel: "LOW" | "MODERATE" | "HIGH" | "SEVERE"
  regulatoryExposure: boolean
  decisionCritical: boolean
  autoEscalate: boolean
}

class FinancialRiskEngine {

  mapToCVFRisk(profile: FinancialRiskProfile): RiskLevel {

    if (profile.financialImpactLevel === "SEVERE") {
      return "R4"
    }

    if (profile.financialImpactLevel === "HIGH") {
      return "R3"
    }

    if (profile.regulatoryExposure) {
      return "R3"
    }

    if (profile.decisionCritical) {
      return "R3"
    }

    if (profile.financialImpactLevel === "MODERATE") {
      return "R2"
    }

    return "R1"
  }

  requiresExecutiveApproval(profile: FinancialRiskProfile): boolean {
    return (
      profile.financialImpactLevel === "SEVERE" ||
      profile.regulatoryExposure ||
      profile.decisionCritical
    )
  }
}

export const financialRiskEngine = new FinancialRiskEngine()
