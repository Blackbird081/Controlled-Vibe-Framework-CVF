import { describe, expect, it } from "vitest";
import { ContextPackagerContract } from "../src/context.packager.contract";
import { compactToolResultsForContext } from "../src/context.tool-result.compaction.contract";

describe("Brigade-derived tool-result context safety", () => {
  it("applies per-result then aggregate caps while preserving the important tail", () => {
    const errorTail = "FATAL: final causal stack";
    const result = compactToolResultsForContext([
      { id: "old", content: `BEGIN-${"a".repeat(7_000)}-${errorTail}` },
      { id: "new", content: `BEGIN-${"b".repeat(7_000)}-${errorTail}` },
    ], {
      contextWindowTokens: 20_000,
      basePromptTokens: 100,
      hardPerResultCapChars: 5_000,
      hardAggregateCapChars: 8_000,
    });

    expect(result.receipt).toMatchObject({
      disposition: "COMPACTED",
      singleResultCompactions: 2,
      importantTailPreserved: true,
    });
    expect(result.receipt.emittedChars).toBeLessThanOrEqual(result.receipt.aggregateCapChars);
    expect(result.results.every((item) => item.content.endsWith(errorTail))).toBe(true);
  });

  it("refuses unsafe late compaction and the real packager emits no tool result", () => {
    const packager = new ContextPackagerContract({
      now: () => "2026-08-29T00:00:00.000Z",
      estimateTokens: (content) => Math.ceil(content.length / 4),
    });
    const packed = packager.pack({
      contextId: "late-context",
      query: "q".repeat(98_000),
      contextWindowTokens: 32_000,
      maxTokens: 32_000,
      toolResults: [{ id: "tool-1", content: "x".repeat(30_000) }],
    });

    expect(packed.toolResultCompaction).toMatchObject({
      disposition: "REFUSE_LATE_COMPACTION",
      reason: "headroom_too_tight_for_safe_late_compaction",
      emittedChars: 0,
    });
    expect(packed.segments.some((segment) => segment.source === "tool-result:tool-1")).toBe(false);
  });
});
