import { describe, it, expect, beforeEach } from "vitest";
import { SessionManager, resetSessionCounter } from "../src/session.manager";
import { GovernanceDecision, AgentAction } from "../src/types";

describe("SessionManager", () => {
  let manager: SessionManager;

  beforeEach(() => {
    manager = new SessionManager();
    resetSessionCounter();
  });

  function makeDecision(overrides: Partial<GovernanceDecision> = {}): GovernanceDecision {
    return {
      action: { agentId: "a1", action: "read", target: "t", domain: "general", params: {} },
      verdict: "ALLOW",
      riskLevel: "R0",
      riskScore: 0.1,
      violations: [],
      warnings: [],
      reasoning: [],
      policyMatches: [],
      timestamp: Date.now(),
      durationMs: 1,
      ...overrides,
    };
  }

  it("starts a session with unique ID", () => {
    const s1 = manager.startSession("agent-1");
    const s2 = manager.startSession("agent-2");
    expect(s1.sessionId).toMatch(/^SDK-SES-/);
    expect(s1.sessionId).not.toBe(s2.sessionId);
  });

  it("records decisions in session", () => {
    const session = manager.startSession("agent-1");
    manager.recordDecision(session.sessionId, makeDecision());
    manager.recordDecision(session.sessionId, makeDecision({ riskScore: 0.3, riskLevel: "R1" }));

    const s = manager.getSession(session.sessionId);
    expect(s!.actionCount).toBe(2);
    expect(s!.cumulativeRisk).toBeCloseTo(0.4);
    expect(s!.highestRisk).toBe("R1");
  });

  it("tracks highest risk level", () => {
    const session = manager.startSession("agent-1");
    manager.recordDecision(session.sessionId, makeDecision({ riskLevel: "R1" }));
    manager.recordDecision(session.sessionId, makeDecision({ riskLevel: "R3" }));
    manager.recordDecision(session.sessionId, makeDecision({ riskLevel: "R0" }));

    expect(manager.getSession(session.sessionId)!.highestRisk).toBe("R3");
  });

  it("ends session and removes it", () => {
    const session = manager.startSession("agent-1");
    const ended = manager.endSession(session.sessionId);
    expect(ended).toBeDefined();
    expect(manager.getSession(session.sessionId)).toBeUndefined();
  });

  it("lists all active sessions", () => {
    manager.startSession("a1");
    manager.startSession("a2");
    expect(manager.listSessions().length).toBe(2);
  });

  it("provides session summary", () => {
    const session = manager.startSession("agent-1");
    manager.recordDecision(session.sessionId, makeDecision({ verdict: "BLOCK", riskLevel: "R3", riskScore: 0.8 }));
    manager.recordDecision(session.sessionId, makeDecision({ verdict: "ESCALATE", riskLevel: "R2", riskScore: 0.5 }));
    manager.recordDecision(session.sessionId, makeDecision({ verdict: "ALLOW", riskLevel: "R0", riskScore: 0.1 }));

    const summary = manager.getSessionSummary(session.sessionId);
    expect(summary!.actionCount).toBe(3);
    expect(summary!.blockCount).toBe(1);
    expect(summary!.escalateCount).toBe(1);
    expect(summary!.highestRisk).toBe("R3");
  });

  it("clears all sessions", () => {
    manager.startSession("a1");
    manager.startSession("a2");
    manager.clearAll();
    expect(manager.listSessions().length).toBe(0);
  });
});
