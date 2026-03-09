import { describe, it, expect, beforeEach } from "vitest";
import { RiskAggregator, resetSessionCounter } from "../src/risk.aggregator";
import { ContextAnalyzer } from "../src/context.analyzer";
import { RiskScorer } from "../src/risk.scorer";

describe("RiskAggregator", () => {
  let aggregator: RiskAggregator;
  const scorer = new RiskScorer();
  const analyzer = new ContextAnalyzer();

  beforeEach(() => {
    aggregator = new RiskAggregator();
    resetSessionCounter();
  });

  function makeAssessment(domain: import("../src/types").RiskDomain = "general", action = "read") {
    const base = scorer.score({ domain, action, target: "test", targetScope: "internal" });
    return analyzer.analyze(base, {});
  }

  describe("session management", () => {
    it("starts a new session", () => {
      const id = aggregator.startSession();
      expect(id).toMatch(/^SES-/);
    });

    it("auto-creates session on first record", () => {
      const assessment = makeAssessment();
      const session = aggregator.record(assessment);
      expect(session.sessionId).toMatch(/^SES-/);
      expect(session.totalActions).toBe(1);
    });

    it("tracks multiple actions in session", () => {
      aggregator.startSession();
      aggregator.record(makeAssessment());
      aggregator.record(makeAssessment("finance", "payment"));
      aggregator.record(makeAssessment("code_security", "execute"));

      const session = aggregator.getSessionRisk();
      expect(session!.totalActions).toBe(3);
      expect(session!.assessments.length).toBe(3);
    });

    it("ends session and clears active", () => {
      aggregator.startSession();
      aggregator.record(makeAssessment());
      const ended = aggregator.endSession();

      expect(ended).toBeDefined();
      expect(ended!.totalActions).toBe(1);
      expect(aggregator.getSessionRisk()).toBeUndefined();
    });

    it("lists all sessions", () => {
      aggregator.startSession();
      aggregator.record(makeAssessment());
      aggregator.startSession();
      aggregator.record(makeAssessment());

      expect(aggregator.listSessions().length).toBe(2);
    });
  });

  describe("cumulative risk", () => {
    it("accumulates score across actions", () => {
      aggregator.startSession();
      aggregator.record(makeAssessment("finance", "payment"));
      aggregator.record(makeAssessment("finance", "withdraw"));

      const session = aggregator.getSessionRisk();
      expect(session!.cumulativeScore).toBeGreaterThan(0);
    });

    it("tracks highest risk level", () => {
      aggregator.startSession();
      aggregator.record(makeAssessment("general", "read"));
      aggregator.record(makeAssessment("infrastructure", "execute"));

      const session = aggregator.getSessionRisk();
      expect(session!.highestLevel).toBe("R3");
    });
  });

  describe("escalation", () => {
    it("escalates on R3 action", () => {
      aggregator.startSession();
      const highRisk = (() => {
        const base = scorer.score({
          domain: "infrastructure", action: "execute",
          target: "server", targetScope: "external",
        });
        return analyzer.analyze(base, { timeOfDay: "after_hours" });
      })();

      aggregator.record(highRisk);
      expect(aggregator.isEscalated()).toBe(true);
    });

    it("escalates when cumulative score exceeds threshold", () => {
      aggregator.startSession();

      for (let i = 0; i < 20; i++) {
        aggregator.record(makeAssessment("finance", "payment"));
      }

      expect(aggregator.isEscalated()).toBe(true);
    });

    it("does not escalate for low-risk actions", () => {
      aggregator.startSession();
      aggregator.record(makeAssessment("general", "read"));
      aggregator.record(makeAssessment("general", "summarize"));

      expect(aggregator.isEscalated()).toBe(false);
    });
  });

  describe("session level", () => {
    it("returns R0 for empty session", () => {
      aggregator.startSession();
      expect(aggregator.getSessionLevel()).toBe("R0");
    });

    it("reflects highest level seen", () => {
      aggregator.startSession();
      aggregator.record(makeAssessment("general", "read"));
      aggregator.record(makeAssessment("infrastructure", "execute"));

      const level = aggregator.getSessionLevel();
      expect(level).toBe("R3");
    });
  });

  describe("clearAll", () => {
    it("removes all sessions", () => {
      aggregator.startSession();
      aggregator.record(makeAssessment());
      aggregator.clearAll();

      expect(aggregator.listSessions().length).toBe(0);
      expect(aggregator.getSessionRisk()).toBeUndefined();
    });
  });
});
