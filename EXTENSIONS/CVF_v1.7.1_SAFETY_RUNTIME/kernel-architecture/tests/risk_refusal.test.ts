import { describe, it, expect } from "vitest"
import { RiskScorer } from "../kernel/03_contamination_guard/risk_scorer"
import { RefusalRouter } from "../kernel/04_refusal_router/refusal.router"

describe("Risk and Refusal", () => {
  it("maps high-risk signals to CVF risk levels", () => {
    const scorer = new RiskScorer()
    const assessment = scorer.scoreText("I want to kill myself")

    expect(assessment.level).toBe("critical")
    expect(assessment.cvfRiskLevel).toBe("R4")
  })

  it("refusal router blocks R4 and requires approval on R3", () => {
    const scorer = new RiskScorer()
    const router = new RefusalRouter()
    const high = scorer.scoreText("This is a lawsuit strategy request")
    const critical = scorer.scoreText("I want to kill myself")

    const highDecision = router.evaluate(high)
    expect(highDecision.blocked).toBe(true)
    expect(highDecision.action).toBe("needs_approval")
    expect(highDecision.response?.message).toMatch(/requires human approval/i)

    const criticalDecision = router.evaluate(critical)
    expect(criticalDecision.blocked).toBe(true)
    expect(criticalDecision.action).toBe("block")
    expect(criticalDecision.response?.message).toMatch(/blocked/i)
  })

  it("allows clean medium risk (R2) but clarifies on drift", () => {
    const scorer = new RiskScorer()
    const router = new RefusalRouter()

    const medium = scorer.scoreText("Need investment overview for beginners")
    const decision = router.evaluate(medium)

    expect(medium.cvfRiskLevel).toBe("R2")
    expect(decision.blocked).toBe(false)
    expect(decision.action).toBe("allow")

    const withDrift = router.evaluate({
      ...medium,
      driftDetected: true,
    })
    expect(withDrift.blocked).toBe(true)
    expect(withDrift.action).toBe("clarify")
    expect(withDrift.response?.message).toMatch(/clarify/i)
  })

  it("maps low-score combinations to R1 and unknown flags to R0", () => {
    const scorer = new RiskScorer()

    const lowButNonZero = scorer.score(["financial", "unknown_flag"])
    expect(lowButNonZero.level).toBe("low")
    expect(lowButNonZero.cvfRiskLevel).toBe("R1")
    expect(lowButNonZero.score).toBe(35)

    const zeroFromUnknown = scorer.score(["unknown_flag"])
    expect(zeroFromUnknown.level).toBe("low")
    expect(zeroFromUnknown.cvfRiskLevel).toBe("R0")
    expect(zeroFromUnknown.score).toBe(0)
  })
})
