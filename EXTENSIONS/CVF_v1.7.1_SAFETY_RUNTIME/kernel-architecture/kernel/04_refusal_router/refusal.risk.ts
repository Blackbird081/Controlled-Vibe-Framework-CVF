import { RiskDetector } from "../03_contamination_guard/risk_detector"
import { RiskScorer } from "../03_contamination_guard/risk_scorer"
import { RefusalPolicy } from "./refusal_policy"

export const REFUSAL_RISK_GATE_ADAPTER_VERSION = "phase2b-refusal-risk-gate-adapter-1"

export interface RefusalRiskGateAdapterSnapshot {
  version: typeof REFUSAL_RISK_GATE_ADAPTER_VERSION
  source: "safety-runtime:refusal-risk-gate"
  flags: string[]
  cvfRiskLevel: string
  policyAction: string
  transformed: boolean
}

export interface RefusalRiskGateEvaluation {
  output: string
  adapter: RefusalRiskGateAdapterSnapshot
}

export class RiskGate {
  private detector = new RiskDetector()
  private scorer = new RiskScorer()
  private policy = new RefusalPolicy()

  evaluate(output: string): string {
    return this.evaluateWithAdapter(output).output
  }

  evaluateWithAdapter(output: string): RefusalRiskGateEvaluation {
    const flags = this.detector.detect(output)
    const assessment = this.scorer.score(flags)
    const action = this.policy.decide(assessment.cvfRiskLevel)
    let evaluatedOutput = output

    if (action === "block") {
      evaluatedOutput = JSON.stringify({
        answer: "Request blocked due to safety policy.",
        risk_level: assessment.cvfRiskLevel,
      })
    } else if (action === "needs_approval") {
      evaluatedOutput = JSON.stringify({
        answer: "This request requires human approval before execution.",
        risk_level: assessment.cvfRiskLevel,
      })
    } else if (action === "clarify") {
      evaluatedOutput = JSON.stringify({
        answer: "Please clarify your intent to continue with a lower-risk path.",
        risk_level: assessment.cvfRiskLevel,
      })
    }

    return {
      output: evaluatedOutput,
      adapter: {
        version: REFUSAL_RISK_GATE_ADAPTER_VERSION,
        source: "safety-runtime:refusal-risk-gate",
        flags,
        cvfRiskLevel: assessment.cvfRiskLevel,
        policyAction: action,
        transformed: evaluatedOutput !== output,
      },
    }
  }
}
