import { RiskDetector } from "../03_contamination_guard/risk_detector"
import { RiskScorer } from "../03_contamination_guard/risk_scorer"
import { RefusalPolicy } from "./refusal_policy"

export class RiskGate {

  private detector = new RiskDetector()
  private scorer = new RiskScorer()
  private policy = new RefusalPolicy()

  evaluate(output: string): string {

    const flags = this.detector.detect(output)
    const assessment = this.scorer.score(flags)
    const action = this.policy.decide(assessment.cvfRiskLevel)

    if (action === "block") {
      return JSON.stringify({
        answer: "Request blocked due to safety policy.",
        risk_level: assessment.cvfRiskLevel
      })
    }

    if (action === "needs_approval") {
      return JSON.stringify({
        answer: "This request requires human approval before execution.",
        risk_level: assessment.cvfRiskLevel
      })
    }

    if (action === "clarify") {
      return JSON.stringify({
        answer: "Please clarify your intent to continue with a lower-risk path.",
        risk_level: assessment.cvfRiskLevel
      })
    }

    return output
  }
}
