import { describe, expect, it } from "vitest";
import { ScoreCalculator } from "../../src/reputation/score.calculator";

describe("ScoreCalculator", () => {
  const calc = new ScoreCalculator();

  it("maps score to tiers", () => {
    expect(calc.tierFromScore(10)).toBe("untrusted");
    expect(calc.tierFromScore(20)).toBe("newcomer");
    expect(calc.tierFromScore(50)).toBe("reliable");
    expect(calc.tierFromScore(75)).toBe("trusted");
    expect(calc.tierFromScore(90)).toBe("exemplary");
  });

  it("computes trend and decay", () => {
    expect(calc.trend([5, 5, 5])).toBe("improving");
    expect(calc.decay(80, 21)).toBe(79);
  });
});
