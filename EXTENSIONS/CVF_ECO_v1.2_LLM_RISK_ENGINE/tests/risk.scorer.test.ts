import { describe, it, expect } from "vitest";
import { RiskScorer } from "../src/risk.scorer";
import { ActionContext } from "../src/types";

describe("RiskScorer", () => {
  const scorer = new RiskScorer();

  function makeContext(overrides: Partial<ActionContext> = {}): ActionContext {
    return {
      domain: "general",
      action: "read",
      target: "document",
      targetScope: "internal",
      ...overrides,
    };
  }

  describe("domain-based scoring", () => {
    it("scores infrastructure domain as high risk", () => {
      const result = scorer.score(makeContext({ domain: "infrastructure", action: "deploy" }));
      expect(result.level).toBe("R3");
    });

    it("scores code_security domain as high risk with execute action", () => {
      const result = scorer.score(makeContext({ domain: "code_security", action: "execute" }));
      expect(result.level).toBe("R3");
    });

    it("scores general domain read as low risk", () => {
      const result = scorer.score(makeContext({ domain: "general", action: "read" }));
      expect(result.level).toBe("R0");
    });

    it("scores finance domain with withdraw as R2+", () => {
      const result = scorer.score(makeContext({ domain: "finance", action: "withdraw" }));
      expect(["R2", "R3"]).toContain(result.level);
    });
  });

  describe("action-based scoring", () => {
    it("scores delete action higher than read", () => {
      const deleteScore = scorer.score(makeContext({ action: "delete" }));
      const readScore = scorer.score(makeContext({ action: "read" }));
      expect(deleteScore.numericScore).toBeGreaterThan(readScore.numericScore);
    });

    it("scores execute as high-risk action", () => {
      const result = scorer.score(makeContext({ action: "execute" }));
      expect(result.numericScore).toBeGreaterThan(0.3);
    });

    it("scores summarize as low-risk action", () => {
      const result = scorer.score(makeContext({ action: "summarize" }));
      expect(result.numericScore).toBeLessThan(0.2);
    });
  });

  describe("scope multiplier", () => {
    it("external scope increases risk", () => {
      const ext = scorer.score(makeContext({ targetScope: "external", action: "transfer" }));
      const int = scorer.score(makeContext({ targetScope: "internal", action: "transfer" }));
      expect(ext.numericScore).toBeGreaterThan(int.numericScore);
    });
  });

  describe("data classification", () => {
    it("restricted data adds risk", () => {
      const restricted = scorer.score(makeContext({ dataClassification: "restricted" }));
      const public_ = scorer.score(makeContext({ dataClassification: "public" }));
      expect(restricted.numericScore).toBeGreaterThan(public_.numericScore);
    });
  });

  describe("amount-based risk", () => {
    it("large amounts increase risk", () => {
      const large = scorer.score(makeContext({ domain: "finance", action: "payment", amount: 15000 }));
      const small = scorer.score(makeContext({ domain: "finance", action: "payment", amount: 50 }));
      expect(large.numericScore).toBeGreaterThan(small.numericScore);
    });
  });

  describe("factors tracking", () => {
    it("includes domain factor", () => {
      const result = scorer.score(makeContext({ domain: "finance" }));
      expect(result.factors.some((f) => f.startsWith("domain:"))).toBe(true);
    });

    it("includes scope factor for external", () => {
      const result = scorer.score(makeContext({ targetScope: "external" }));
      expect(result.factors.some((f) => f.startsWith("scope:"))).toBe(true);
    });
  });

  describe("score capping", () => {
    it("caps numeric score at 1.0", () => {
      const result = scorer.score(makeContext({
        domain: "infrastructure",
        action: "execute",
        targetScope: "external",
        dataClassification: "restricted",
        amount: 50000,
      }));
      expect(result.numericScore).toBeLessThanOrEqual(1.0);
    });
  });
});
