import { describe, expect, it } from "vitest";
import { generateMemoryRound } from "@/lib/game-core/memory";

describe("memory game core", () => {
  it("generates valid memory round", () => {
    const round = generateMemoryRound(50);

    expect(round.choices).toHaveLength(4);
    expect(round.choices).toContain(round.answer);
    expect(round.sequence.length).toBeGreaterThanOrEqual(5);
    expect(round.sequence.includes(round.answer)).toBe(true);
  });
});
