import { describe, expect, it } from "vitest";
import { generateColorRound } from "@/lib/game-core/color";

describe("color reflex core", () => {
  it("returns a valid color question", () => {
    const round = generateColorRound();

    expect(round.choices).toHaveLength(4);
    expect(round.choices).toContain(round.answerColorName);
    expect(round.word.length).toBeGreaterThan(0);
    expect(round.wordColorHex.startsWith("#")).toBe(true);
  });
});
