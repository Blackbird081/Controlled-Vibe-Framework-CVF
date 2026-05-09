import { describe, it, expect } from "vitest"
import { evaluateRiskGate } from "../../../CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/risk-check"
import { RefusalPolicy } from "../kernel/04_refusal_router/refusal_policy"

describe("CVF policy parity", () => {
  it("matches governance-mode risk decisions for baseline R0-R4", () => {
    const policy = new RefusalPolicy()
    const levels = ["R0", "R1", "R2", "R3", "R4"] as const

    const actionToGateStatus = {
      allow: "ALLOW",
      clarify: "ALLOW",
      needs_approval: "NEEDS_APPROVAL",
      block: "BLOCK",
    } as const

    for (const level of levels) {
      const gate = evaluateRiskGate(level, "governance")
      const action = policy.decide(level)
      expect(actionToGateStatus[action]).toBe(gate.status)
    }
  })

  it("supports FREEZE-phase escalation behavior for R4", () => {
    const policy = new RefusalPolicy()
    expect(policy.decide("R4", { phase: "FREEZE" })).toBe("needs_approval")
  })
})
