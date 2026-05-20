import { describe, expect, it } from "vitest";
import {
  classifyMemoryTier,
  describeMemoryTier,
  type MemoryTier,
} from "../src/memory-tier-classifier.contract";

describe("memory tier classifier contract", () => {
  const cases: Array<[string, MemoryTier]> = [
    ["working", "working"],
    ["task", "task"],
    ["skill", "skill"],
    ["organizational", "organizational"],
    ["long-term", "long-term"],
    ["audit", "audit"],
    ["receipt", "receipt"],
  ];

  it.each(cases)("classifies %s tier", (tier, expected) => {
    expect(classifyMemoryTier({ tier })).toBe(expected);
  });

  it("is deterministic for identical input", () => {
    const input = { source: "session working buffer" };

    expect(classifyMemoryTier(input)).toBe(classifyMemoryTier(input));
  });

  it("returns defensive tier descriptions", () => {
    const first = describeMemoryTier({ tier: "receipt" });
    first.persistenceClass = "durable";

    expect(describeMemoryTier({ tier: "receipt" }).persistenceClass).toBe("append_only");
  });
});
