import { RiskDetector } from "../03_contamination_guard/risk_detector"
import { RiskScorer } from "../03_contamination_guard/risk_scorer"

export class RiskGate {

  private detector = new RiskDetector()
  private scorer = new RiskScorer()

  evaluate(output: string): string {

    const flags = this.detector.detect(output)
    const assessment = this.scorer.score(flags)

    if (assessment.level === "critical") {
      return JSON.stringify({
        answer: "Request blocked due to safety policy.",
        risk_level: assessment.level
      })
    }

    if (assessment.level === "high") {
      return JSON.stringify({
        answer: "This topic requires professional consultation.",
        risk_level: assessment.level
      })
    }

    return output
  }
}