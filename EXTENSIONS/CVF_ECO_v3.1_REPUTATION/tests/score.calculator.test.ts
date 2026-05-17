import { describe, it, expect } from "vitest";
import { ScoreCalculator } from "../src/score.calculator";

describe("ScoreCalculator", () => {
  const calc = new ScoreCalculator();

  describe("clamp", () => {
    it("clamps score to 0-100 range", () => {
      expect(calc.clamp(50)).toBe(50);
      expect(calc.clamp(-10)).toBe(0);
      expect(calc.clamp(120)).toBe(100);
    });
  });

  describe("tierFromScore", () => {
    it("returns untrusted for < 20", () => {
      expect(calc.tierFromScore(10)).toBe("untrusted");
      expect(calc.tierFromScore(0)).toBe("untrusted");
    });

    it("returns newcomer for 20-49", () => {
      expect(calc.tierFromScore(20)).toBe("newcomer");
      expect(calc.tierFromScore(49)).toBe("newcomer");
    });

    it("returns reliable for 50-74", () => {
      expect(calc.tierFromScore(50)).toBe("reliable");
      expect(calc.tierFromScore(74)).toBe("reliable");
    });

    it("returns trusted for 75-89", () => {
      expect(calc.tierFromScore(75)).toBe("trusted");
      expect(calc.tierFromScore(89)).toBe("trusted");
    });

    it("returns exemplary for >= 90", () => {
      expect(calc.tierFromScore(90)).toBe("exemplary");
      expect(calc.tierFromScore(100)).toBe("exemplary");
    });
  });

  describe("successRate", () => {
    it("computes success rate", () => {
      expect(calc.successRate(8, 10)).toBeCloseTo(0.8);
    });

    it("returns 0 for zero total", () => {
      expect(calc.successRate(0, 0)).toBe(0);
    });
  });

  describe("trend", () => {
    it("returns improving for positive deltas", () => {
      expect(calc.trend([5, 5, 5, 5, 5])).toBe("improving");
    });

    it("returns declining for negative deltas", () => {
      expect(calc.trend([-5, -5, -5])).toBe("declining");
    });

    it("returns stable for mixed deltas", () => {
      expect(calc.trend([1, -1, 1, -1])).toBe("stable");
    });

    it("returns stable for < 2 events", () => {
      expect(calc.trend([5])).toBe("stable");
    });
  });

  describe("decay", () => {
    it("no decay within 7 days", () => {
      expect(calc.decay(80, 5)).toBe(80);
    });

    it("decays after 7 days", () => {
      expect(calc.decay(80, 21)).toBe(79);
    });

    it("does not decay below 0", () => {
      expect(calc.decay(1, 365)).toBeGreaterThanOrEqual(0);
    });
  });
});
