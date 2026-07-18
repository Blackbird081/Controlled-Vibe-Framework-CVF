import { describe, expect, it } from "vitest";

import {
  AGENT_GUARD_RISK_MODULE_ADAPTER_VERSION,
  RiskModule,
} from "../src/risk.module";

describe("Phase 2.B agent guard risk module adapter", () => {
  it("evaluateWithAdapter preserves risk evaluation result", () => {
    const risk = new RiskModule();
    const action = {
      agentId: "agent-risk-fanout-001",
      action: "deploy",
      target: "production",
      domain: "infrastructure" as const,
      params: {},
    };
    const wrapped = risk.evaluateWithAdapter(action);

    expect(wrapped.version).toBe(AGENT_GUARD_RISK_MODULE_ADAPTER_VERSION);
    expect(wrapped.source).toBe("eco-v2.0:agent-guard-risk-module");
    expect(wrapped.action.agentId).toBe(action.agentId);
    expect(wrapped.result).toEqual(risk.evaluate(action));
    expect(wrapped.result.level).toBe("R3");
  });
});
