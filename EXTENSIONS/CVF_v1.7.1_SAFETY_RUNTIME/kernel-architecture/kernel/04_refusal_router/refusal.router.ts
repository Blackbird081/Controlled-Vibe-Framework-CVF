import { RiskAssessment } from "../03_contamination_guard/risk.types"
import { RefusalAction, RefusalPolicy } from "./refusal_policy"
import { SafeRewriteEngine } from "./safe_rewrite_engine"
import { ClarificationGenerator } from "./clarification_generator"
import { AlternativeRouteEngine } from "./alternative_route_engine"

export interface RefusalDecision {
  blocked: boolean
  action: RefusalAction
  policyVersion: string
  response?: any
}

export class RefusalRouter {
  private policy: RefusalPolicy
  private rewrite = new SafeRewriteEngine()
  private clarification = new ClarificationGenerator()
  private alternative = new AlternativeRouteEngine()

  constructor(policyVersion?: string) {
    this.policy = new RefusalPolicy(policyVersion)
  }

  evaluate(risk: RiskAssessment): RefusalDecision {
    const action = this.policy.decide(risk.cvfRiskLevel, {
      driftDetected: risk.driftDetected,
      needsClarification: Boolean(risk.assumptions && risk.assumptions.length > 0)
    })
    const policyVersion = this.policy.getVersion()

    if (action === "block") {
      return {
        blocked: true,
        action,
        policyVersion,
        response: {
          message: "Request blocked due to safety policy.",
          risk: risk.cvfRiskLevel,
          alternative: this.alternative.suggest()
        }
      }
    }

    if (action === "needs_approval") {
      return {
        blocked: true,
        action,
        policyVersion,
        response: {
          message: "This request requires human approval before execution.",
          risk: risk.cvfRiskLevel,
          rewrite: this.rewrite.rewrite("risk escalation path requested")
        }
      }
    }

    if (action === "clarify") {
      return {
        blocked: true,
        action,
        policyVersion,
        response: {
          message: this.clarification.generate(),
          risk: risk.cvfRiskLevel
        }
      }
    }

    return { blocked: false, action, policyVersion }
  }
}
