import { describe, it, expect } from "vitest"
import { AssumptionTracker } from "../kernel/03_contamination_guard/assumption_tracker"
import { DriftDetector } from "../kernel/03_contamination_guard/drift_detector"
import { RiskPropagationEngine } from "../kernel/03_contamination_guard/risk_propagation_engine"

describe("Contamination guard modules", () => {
  it("detects assumptions and elevates propagated risk", () => {
    const tracker = new AssumptionTracker()
    const propagation = new RiskPropagationEngine()

    const assumptions = tracker.track("I assume this is likely correct.")
    expect(assumptions.length).toBeGreaterThan(0)

    const risk = propagation.propagate(
      {
        level: "medium",
        cvfRiskLevel: "R2",
        score: 60,
        reasons: ["medical"]
      },
      assumptions,
      false
    )

    expect(risk.cvfRiskLevel).toBe("R3")
    expect(risk.reasons).toContain("implicit_assumption")
  })

  it("detects domain drift and risk jump", () => {
    const detector = new DriftDetector()

    const drift = detector.detect({
      declaredDomain: "informational",
      classifiedDomain: "creative",
      previousRisk: "R1",
      currentRisk: "R3"
    })

    expect(drift.detected).toBe(true)
    expect(drift.reasons).toContain("domain_drift")
    expect(drift.reasons).toContain("risk_jump")
  })
})

