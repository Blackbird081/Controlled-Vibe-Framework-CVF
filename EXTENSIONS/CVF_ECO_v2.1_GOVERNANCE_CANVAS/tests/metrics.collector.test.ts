import { describe, it, expect, beforeEach } from "vitest";
import { MetricsCollector } from "../src/metrics.collector";
import { SessionSnapshot } from "../src/types";

describe("MetricsCollector", () => {
  let collector: MetricsCollector;

  function makeSnapshot(overrides: Partial<SessionSnapshot> = {}): SessionSnapshot {
    return {
      sessionId: "SES-001",
      agentId: "agent-1",
      actionCount: 5,
      cumulativeRisk: 1.2,
      highestRisk: "R1",
      verdictCounts: { ALLOW: 3, WARN: 1, ESCALATE: 1, BLOCK: 0 },
      domainBreakdown: { finance: 3, privacy: 2 },
      startedAt: Date.now(),
      ...overrides,
    };
  }

  beforeEach(() => {
    collector = new MetricsCollector();
  });

  it("adds and retrieves sessions", () => {
    collector.addSession(makeSnapshot());
    expect(collector.getSessions().length).toBe(1);
  });

  it("adds batch of sessions", () => {
    collector.addSessions([makeSnapshot(), makeSnapshot({ sessionId: "SES-002" })]);
    expect(collector.getSessions().length).toBe(2);
  });

  describe("compute", () => {
    beforeEach(() => {
      collector.addSession(makeSnapshot({
        sessionId: "SES-001",
        actionCount: 5,
        cumulativeRisk: 1.0,
        highestRisk: "R1",
        verdictCounts: { ALLOW: 3, WARN: 1, ESCALATE: 1, BLOCK: 0 },
        domainBreakdown: { finance: 3, privacy: 2 },
      }));
      collector.addSession(makeSnapshot({
        sessionId: "SES-002",
        actionCount: 3,
        cumulativeRisk: 2.5,
        highestRisk: "R3",
        verdictCounts: { ALLOW: 1, WARN: 0, ESCALATE: 1, BLOCK: 1 },
        domainBreakdown: { finance: 1, code_security: 2 },
      }));
    });

    it("counts total sessions", () => {
      const m = collector.compute();
      expect(m.totalSessions).toBe(2);
    });

    it("sums total actions", () => {
      const m = collector.compute();
      expect(m.totalActions).toBe(8);
    });

    it("sums blocks and escalations", () => {
      const m = collector.compute();
      expect(m.totalBlocks).toBe(1);
      expect(m.totalEscalations).toBe(2);
    });

    it("computes average risk score", () => {
      const m = collector.compute();
      expect(m.avgRiskScore).toBeCloseTo(1.75);
    });

    it("tracks risk distribution", () => {
      const m = collector.compute();
      expect(m.riskDistribution.R1).toBe(1);
      expect(m.riskDistribution.R3).toBe(1);
    });

    it("tracks verdict distribution", () => {
      const m = collector.compute();
      expect(m.verdictDistribution.ALLOW).toBe(4);
      expect(m.verdictDistribution.BLOCK).toBe(1);
      expect(m.verdictDistribution.ESCALATE).toBe(2);
    });

    it("tracks domain activity", () => {
      const m = collector.compute();
      expect(m.domainActivity.finance).toBe(4);
      expect(m.domainActivity.privacy).toBe(2);
      expect(m.domainActivity.code_security).toBe(2);
    });
  });

  it("handles empty sessions", () => {
    const m = collector.compute();
    expect(m.totalSessions).toBe(0);
    expect(m.totalActions).toBe(0);
    expect(m.avgRiskScore).toBe(0);
  });

  it("clears all sessions", () => {
    collector.addSession(makeSnapshot());
    collector.clear();
    expect(collector.getSessions().length).toBe(0);
  });
});
