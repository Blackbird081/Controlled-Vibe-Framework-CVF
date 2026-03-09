import { describe, it, expect } from "vitest";
import { RiskModule } from "../src/risk.module";
import { AgentAction } from "../src/types";

describe("RiskModule", () => {
  const risk = new RiskModule();

  function makeAction(overrides: Partial<AgentAction> = {}): AgentAction {
    return {
      agentId: "agent-1",
      action: "read",
      target: "test",
      domain: "general",
      params: {},
      ...overrides,
    };
  }

  it("scores general/read as R0", () => {
    const result = risk.evaluate(makeAction());
    expect(result.level).toBe("R0");
    expect(result.score).toBeLessThan(0.25);
  });

  it("scores infrastructure/deploy as R3", () => {
    const result = risk.evaluate(makeAction({ domain: "infrastructure", action: "deploy" }));
    expect(result.level).toBe("R3");
  });

  it("scores finance/withdraw as R2", () => {
    const result = risk.evaluate(makeAction({ domain: "finance", action: "withdraw" }));
    expect(["R2", "R3"]).toContain(result.level);
  });

  it("scores code_security/execute as R3", () => {
    const result = risk.evaluate(makeAction({ domain: "code_security", action: "execute" }));
    expect(result.level).toBe("R3");
  });

  it("adds amount bonus for high amounts", () => {
    const low = risk.evaluate(makeAction({ domain: "finance", action: "transfer", params: { amount: 500 } }));
    const high = risk.evaluate(makeAction({ domain: "finance", action: "transfer", params: { amount: 15000 } }));
    expect(high.score).toBeGreaterThan(low.score);
  });

  it("includes factors in result", () => {
    const result = risk.evaluate(makeAction({ domain: "finance", action: "transfer" }));
    expect(result.factors.length).toBeGreaterThan(0);
    expect(result.factors.some((f) => f.includes("domain:"))).toBe(true);
  });

  it("caps score at 1.0", () => {
    const result = risk.evaluate(makeAction({
      domain: "infrastructure",
      action: "execute",
      params: { amount: 50000 },
    }));
    expect(result.score).toBeLessThanOrEqual(1.0);
  });
});
