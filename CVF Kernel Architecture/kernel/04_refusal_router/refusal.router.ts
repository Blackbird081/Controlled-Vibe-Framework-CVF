import { RiskAssessment } from "../03_contamination_guard/risk_scorer"

export interface RefusalDecision {
  blocked: boolean
  response?: any
}

export class RefusalRouter {

  evaluate(risk: RiskAssessment): RefusalDecision {

    if (risk.level === "critical") {
      return {
        blocked: true,
        response: {
          message: "Request blocked due to safety policy.",
          risk: risk.level
        }
      }
    }

    if (risk.level === "high") {
      return {
        blocked: true,
        response: {
          message: "This topic requires professional consultation.",
          risk: risk.level
        }
      }
    }

    return { blocked: false }
  }
}