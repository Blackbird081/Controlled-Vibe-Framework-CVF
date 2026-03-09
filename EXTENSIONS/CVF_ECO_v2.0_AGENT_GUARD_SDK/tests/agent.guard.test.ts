import { describe, it, expect, beforeEach } from "vitest";
import { AgentGuard, resetSessionCounter, resetAuditCounter } from "../src/agent.guard";
import { AgentAction } from "../src/types";

describe("AgentGuard (SDK orchestrator)", () => {
  let sdk: AgentGuard;
  let sessionId: string;

  beforeEach(() => {
    sdk = new AgentGuard();
    resetSessionCounter();
    resetAuditCounter();
    sessionId = sdk.startSession("test-agent");
  });

  function makeAction(overrides: Partial<AgentAction> = {}): AgentAction {
    return {
      agentId: "test-agent",
      action: "read",
      target: "resource",
      domain: "general",
      params: {},
      ...overrides,
    };
  }

  describe("basic evaluation", () => {
    it("allows safe actions", () => {
      const decision = sdk.evaluate(sessionId, makeAction());
      expect(decision.verdict).toBe("ALLOW");
      expect(decision.riskLevel).toBe("R0");
    });

    it("returns governance decision with all fields", () => {
      const decision = sdk.evaluate(sessionId, makeAction());
      expect(decision).toHaveProperty("action");
      expect(decision).toHaveProperty("verdict");
      expect(decision).toHaveProperty("riskLevel");
      expect(decision).toHaveProperty("riskScore");
      expect(decision).toHaveProperty("violations");
      expect(decision).toHaveProperty("warnings");
      expect(decision).toHaveProperty("reasoning");
      expect(decision).toHaveProperty("policyMatches");
      expect(decision).toHaveProperty("timestamp");
      expect(decision).toHaveProperty("durationMs");
    });
  });

  describe("risk integration", () => {
    it("escalates high-risk actions", () => {
      const decision = sdk.evaluate(sessionId, makeAction({
        domain: "infrastructure",
        action: "deploy",
      }));
      expect(decision.riskLevel).toBe("R3");
      expect(decision.reasoning.some((r) => r.includes("auto-escalate"))).toBe(true);
    });

    it("includes risk factors in reasoning", () => {
      const decision = sdk.evaluate(sessionId, makeAction({
        domain: "finance",
        action: "transfer",
      }));
      expect(decision.reasoning.some((r) => r.includes("domain:finance"))).toBe(true);
    });
  });

  describe("guard integration", () => {
    it("blocks finance transactions over limit", () => {
      const decision = sdk.evaluate(sessionId, makeAction({
        domain: "finance",
        action: "payment",
        params: { amount: 6000 },
      }));
      expect(decision.verdict).toBe("BLOCK");
      expect(decision.violations.length).toBeGreaterThan(0);
    });

    it("blocks unanonymized PII export", () => {
      const decision = sdk.evaluate(sessionId, makeAction({
        domain: "privacy",
        action: "export",
        params: { fields: ["email", "ssn"], anonymized: false, scope: "internal" },
      }));
      expect(decision.verdict).toBe("BLOCK");
    });

    it("blocks dangerous commands", () => {
      const decision = sdk.evaluate(sessionId, makeAction({
        domain: "code_security",
        action: "execute",
        params: { command: "rm -rf /" },
      }));
      expect(decision.verdict).toBe("BLOCK");
    });
  });

  describe("session tracking", () => {
    it("tracks cumulative decisions", () => {
      sdk.evaluate(sessionId, makeAction({ domain: "finance", action: "read" }));
      sdk.evaluate(sessionId, makeAction({ domain: "finance", action: "read" }));
      sdk.evaluate(sessionId, makeAction({ domain: "finance", action: "read" }));

      const summary = sdk.getSessionSummary(sessionId);
      expect(summary!.actionCount).toBe(3);
    });

    it("ends session and returns summary", () => {
      sdk.evaluate(sessionId, makeAction());
      const ended = sdk.endSession(sessionId);
      expect(ended).toBeDefined();
      expect(ended!.actionCount).toBe(1);
    });
  });

  describe("audit logging", () => {
    it("logs every evaluation", () => {
      sdk.evaluate(sessionId, makeAction());
      sdk.evaluate(sessionId, makeAction());
      expect(sdk.getAuditCount()).toBe(2);
    });

    it("retrieves audit by session", () => {
      sdk.evaluate(sessionId, makeAction());
      const entries = sdk.getAuditBySession(sessionId);
      expect(entries.length).toBe(1);
    });

    it("exports audit as JSON", () => {
      sdk.evaluate(sessionId, makeAction());
      const json = sdk.exportAudit();
      expect(() => JSON.parse(json)).not.toThrow();
      const parsed = JSON.parse(json);
      expect(parsed.length).toBe(1);
    });
  });

  describe("configuration", () => {
    it("respects disabled risk scoring", () => {
      const noRisk = new AgentGuard({ enableRiskScoring: false });
      resetSessionCounter();
      const sid = noRisk.startSession("agent");
      const decision = noRisk.evaluate(sid, makeAction({ domain: "infrastructure", action: "deploy" }));
      expect(decision.riskScore).toBe(0);
      expect(decision.riskLevel).toBe("R0");
    });

    it("respects disabled domain guards", () => {
      const noGuard = new AgentGuard({ enableDomainGuards: false });
      resetSessionCounter();
      const sid = noGuard.startSession("agent");
      const decision = noGuard.evaluate(sid, makeAction({
        domain: "finance",
        action: "payment",
        params: { amount: 99999 },
      }));
      expect(decision.violations.length).toBe(0);
    });

    it("respects disabled audit logging", () => {
      const noAudit = new AgentGuard({ enableAuditLog: false });
      resetSessionCounter();
      const sid = noAudit.startSession("agent");
      noAudit.evaluate(sid, makeAction());
      expect(noAudit.getAuditCount()).toBe(0);
    });
  });

  describe("end-to-end scenario", () => {
    it("full agent session lifecycle", () => {
      const sid = sdk.startSession("finance-bot");

      const d1 = sdk.evaluate(sid, makeAction({
        domain: "finance", action: "read", target: "balance",
      }));
      expect(d1.verdict).toBe("ALLOW");

      const d2 = sdk.evaluate(sid, makeAction({
        domain: "finance", action: "payment", target: "vendor",
        params: { amount: 300, hasInvoice: true },
      }));
      expect(d2.verdict).toBe("ALLOW");

      const d3 = sdk.evaluate(sid, makeAction({
        domain: "finance", action: "payment", target: "vendor",
        params: { amount: 8000 },
      }));
      expect(d3.verdict).toBe("BLOCK");

      const summary = sdk.getSessionSummary(sid);
      expect(summary!.actionCount).toBe(3);
      expect(summary!.blockCount).toBe(1);

      const ended = sdk.endSession(sid);
      expect(ended!.decisions.length).toBe(3);
    });
  });
});
