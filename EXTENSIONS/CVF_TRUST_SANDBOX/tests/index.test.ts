import { describe, expect, it } from "vitest";
import { AgentGuard, TRUST_SANDBOX_COORDINATION } from "../src/index";

describe("CVF_TRUST_SANDBOX", () => {
  it("re-exports lightweight guard sdk for embedded trust evaluation", () => {
    const guard = new AgentGuard();
    const sessionId = guard.startSession("agent-1");
    const decision = guard.evaluate(sessionId, {
      agentId: "agent-1",
      action: "read",
      target: "spec.md",
      domain: "general",
      params: {},
    });

    expect(decision.verdict).toBe("ALLOW");
    expect(decision.riskLevel).toBe("R0");
  });

  it("publishes umbrella lineage metadata without pretending runtime collapse", () => {
    expect(TRUST_SANDBOX_COORDINATION.executionClass).toBe("coordination package");
    expect(TRUST_SANDBOX_COORDINATION.fullRuntime).toContain("CVF_v1.7.1_SAFETY_RUNTIME");
    expect(TRUST_SANDBOX_COORDINATION.lightweightSdk).toContain("CVF_ECO_v2.0_AGENT_GUARD_SDK");
    expect(TRUST_SANDBOX_COORDINATION.fullRuntimeEntrypoints.length).toBeGreaterThan(0);
  });
});
