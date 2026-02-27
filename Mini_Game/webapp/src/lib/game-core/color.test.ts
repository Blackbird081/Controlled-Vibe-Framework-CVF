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

  it("supports configurable word/color match chance", () => {
    const alwaysMatch = generateColorRound({ matchChance: 1 });
    expect(alwaysMatch.word).toBe(alwaysMatch.answerColorName);
  });

  it("supports age-specific palette and vocabulary overrides", () => {
    const round = generateColorRound({
      matchChance: 0,
      palette: [
        { name: "Do", hex: "#ff4d4f" },
        { name: "Xanh Duong", hex: "#1fb6ff" },
        { name: "Vang", hex: "#ffb703" },
        { name: "Xanh La", hex: "#52c41a" },
      ],
      wordPool: ["Do", "Xanh Duong", "Vang", "Xanh La", "Tim"],
    });

    expect(round.choices).toHaveLength(4);
    round.choices.forEach((choice) => {
      expect(["Do", "Xanh Duong", "Vang", "Xanh La"].includes(choice)).toBe(true);
    });
    expect(round.word).not.toBe(round.answerColorName);
  });
});
