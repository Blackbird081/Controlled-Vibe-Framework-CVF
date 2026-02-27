import { CVFRiskLevel } from "../03_contamination_guard/risk.types"
import { DomainContextObject } from "../01_domain_lock/domain_context_object"

const RISK_ORDER: Record<CVFRiskLevel, number> = {
  R0: 0,
  R1: 1,
  R2: 2,
  R3: 3,
  R4: 4,
}

export class CreativePermissionPolicy {
  allow(context: DomainContextObject, riskLevel: CVFRiskLevel): boolean {
    if (!context.creative_allowed) {
      return false
    }

    return RISK_ORDER[riskLevel] <= RISK_ORDER.R1
  }
}
