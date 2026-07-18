import { describe, expect, it } from "vitest"

import { RiskDetector } from "../kernel-architecture/kernel/03_contamination_guard/risk_detector"
import { RiskPropagationEngine } from "../kernel-architecture/kernel/03_contamination_guard/risk_propagation_engine"
import { RiskScorer } from "../kernel-architecture/kernel/03_contamination_guard/risk_scorer"

describe("Phase 2.B risk-chain adapters", () => {
  it("RiskDetector.detectWithAdapter wraps flags without changing detection", () => {
    const detector = new RiskDetector()
    const snapshot = detector.detectWithAdapter("Need legal advice")

    expect(snapshot.version).toBe("phase2b-risk-detector-adapter-1")
    expect(snapshot.source).toBe("safety-runtime:contamination-risk-detector")
    expect(snapshot.flags).toEqual(detector.detect("Need legal advice"))
    expect(snapshot.flagCount).toBe(snapshot.flags.length)
  })

  it("RiskScorer.scoreWithAdapter wraps scoring without changing assessment", () => {
    const scorer = new RiskScorer()
    const snapshot = scorer.scoreWithAdapter(["legal"])

    expect(snapshot.version).toBe("phase2b-contamination-risk-scorer-adapter-1")
    expect(snapshot.source).toBe("safety-runtime:contamination-risk-scorer")
    expect(snapshot.assessment.reasons).toEqual(["legal"])
  })

  it("RiskPropagationEngine.propagateWithAdapter wraps propagation result", () => {
    const scorer = new RiskScorer()
    const engine = new RiskPropagationEngine()
    const base = scorer.score(["legal"])
    const snapshot = engine.propagateWithAdapter(base, ["assumption"], true)

    expect(snapshot.version).toBe("phase2b-risk-propagation-adapter-1")
    expect(snapshot.source).toBe("safety-runtime:risk-propagation-engine")
    expect(snapshot.base).toBe(base)
    expect(snapshot.result.cvfRiskLevel).toBe(
      engine.propagate(base, ["assumption"], true).cvfRiskLevel
    )
  })
})
