import { describe, it, expect } from "vitest";
import { ContextAnalyzer } from "../src/context.analyzer";
import { RiskScorer } from "../src/risk.scorer";

describe("ContextAnalyzer", () => {
  const scorer = new RiskScorer();
  const analyzer = new ContextAnalyzer();

  function makeBase(domain = "finance" as const, action = "payment") {
    return scorer.score({ domain, action, target: "vendor", targetScope: "external" });
  }

  describe("time-based modifiers", () => {
    it("after_hours increases risk", () => {
      const base = makeBase();
      const normal = analyzer.analyze(base, { timeOfDay: "business_hours" });
      const afterHours = analyzer.analyze(base, { timeOfDay: "after_hours" });
      expect(afterHours.finalScore).toBeGreaterThan(normal.finalScore);
    });

    it("weekend increases risk", () => {
      const base = makeBase();
      const normal = analyzer.analyze(base, {});
      const weekend = analyzer.analyze(base, { timeOfDay: "weekend" });
      expect(weekend.finalScore).toBeGreaterThan(normal.finalScore);
    });
  });

  describe("frequency modifiers", () => {
    it("high frequency adds risk", () => {
      const base = makeBase();
      const low = analyzer.analyze(base, { frequency: 5 });
      const high = analyzer.analyze(base, { frequency: 30 });
      expect(high.finalScore).toBeGreaterThan(low.finalScore);
    });

    it("frequency below 10 does not add risk", () => {
      const base = makeBase();
      const noFreq = analyzer.analyze(base, {});
      const lowFreq = analyzer.analyze(base, { frequency: 5 });
      expect(lowFreq.finalScore).toBe(noFreq.finalScore);
    });
  });

  describe("first occurrence", () => {
    it("first occurrence increases caution", () => {
      const base = makeBase();
      const first = analyzer.analyze(base, { isFirstOccurrence: true });
      const repeat = analyzer.analyze(base, { isFirstOccurrence: false });
      expect(first.finalScore).toBeGreaterThan(repeat.finalScore);
    });
  });

  describe("approval modifier", () => {
    it("pre-approval reduces risk", () => {
      const base = makeBase();
      const approved = analyzer.analyze(base, { hasApproval: true });
      const notApproved = analyzer.analyze(base, { hasApproval: false });
      expect(approved.finalScore).toBeLessThan(notApproved.finalScore);
    });

    it("approval downgrades enforcement for R2", () => {
      const base = makeBase();
      const approved = analyzer.analyze(base, { hasApproval: true });
      expect(["ALLOW", "LOG_ONLY"]).toContain(approved.enforcement);
    });
  });

  describe("enforcement mapping", () => {
    it("R0 maps to ALLOW", () => {
      const base = scorer.score({ domain: "general", action: "read", target: "doc", targetScope: "internal" });
      const assessment = analyzer.analyze(base, {});
      expect(assessment.enforcement).toBe("ALLOW");
    });

    it("R3 maps to HARD_BLOCK", () => {
      const base = scorer.score({
        domain: "infrastructure", action: "execute",
        target: "server", targetScope: "external",
      });
      const assessment = analyzer.analyze(base, { timeOfDay: "after_hours" });
      expect(assessment.enforcement).toBe("HARD_BLOCK");
    });
  });

  describe("reasoning trail", () => {
    it("includes base risk in reasoning", () => {
      const base = makeBase();
      const assessment = analyzer.analyze(base, {});
      expect(assessment.reasoning.some((r) => r.includes("Base risk"))).toBe(true);
    });

    it("includes final assessment in reasoning", () => {
      const base = makeBase();
      const assessment = analyzer.analyze(base, {});
      expect(assessment.reasoning.some((r) => r.includes("Final"))).toBe(true);
    });
  });
});
