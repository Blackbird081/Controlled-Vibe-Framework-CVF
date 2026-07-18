import { describe, expect, it } from "vitest"

import {
  RISK_EVOLUTION_ADAPTER_VERSION,
  RiskEvolution,
} from "../kernel-architecture/internal_ledger/risk_evolution"
import {
  REFUSAL_RISK_GATE_ADAPTER_VERSION,
  RiskGate,
} from "../kernel-architecture/kernel/04_refusal_router/refusal.risk"

describe("Phase 2.B safety tail risk adapters", () => {
  it("RiskEvolution records history through a bounded adapter snapshot", () => {
    const evolution = new RiskEvolution()
    const adapter = evolution.recordWithAdapter({
      requestId: "req-tail-001",
      policyVersion: "policy-v1",
      decisionCode: "ALLOW",
      traceHash: "trace-001",
      level: "R2",
      score: 8,
      reasons: ["tail-risk-fixture"],
      timestamp: 1,
    })

    expect(adapter.version).toBe(RISK_EVOLUTION_ADAPTER_VERSION)
    expect(adapter.source).toBe("safety-runtime:internal-ledger-risk-evolution")
    expect(adapter.historyCount).toBe(1)
    expect(adapter.latestLevel).toBe("R2")
    expect(adapter.highestScore).toBe(8)
    expect(evolution.getHistory()).toHaveLength(1)
  })

  it("Refusal RiskGate exposes policy action without changing evaluate() output", () => {
    const gate = new RiskGate()
    const output = "Need legal advice about a lawsuit."
    const direct = gate.evaluate(output)
    const wrapped = gate.evaluateWithAdapter(output)

    expect(wrapped.output).toBe(direct)
    expect(wrapped.adapter.version).toBe(REFUSAL_RISK_GATE_ADAPTER_VERSION)
    expect(wrapped.adapter.source).toBe("safety-runtime:refusal-risk-gate")
    expect(wrapped.adapter.flags).toContain("legal")
    expect(wrapped.adapter.policyAction).toBeTruthy()
  })
})
