import { describe, expect, it } from "vitest";
import { calculateEarnedScore, generateMathQuestion } from "@/lib/game-core/math";

describe("math game core", () => {
  it("generates a question with valid choices and answer", () => {
    const question = generateMathQuestion(20);

    expect(question.choices).toHaveLength(4);
    expect(new Set(question.choices).size).toBe(4);
    expect(question.choices).toContain(question.answer);
  });

  it("applies combo scoring rule", () => {
    expect(calculateEarnedScore(1, 10)).toBe(10);
    expect(calculateEarnedScore(2, 10)).toBe(10);
    expect(calculateEarnedScore(3, 10)).toBe(30);
  });
});
