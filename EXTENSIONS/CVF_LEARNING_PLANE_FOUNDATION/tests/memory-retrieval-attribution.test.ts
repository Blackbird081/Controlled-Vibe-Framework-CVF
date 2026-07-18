import { describe, expect, it } from "vitest";
import {
  buildRetrievalAttribution,
  DEFAULT_STALE_THRESHOLD_MS,
} from "../src/memory-retrieval-attribution";
import {
  MEMORY_RETRIEVAL_POLICY_VERSION,
  type MemoryRetrievalResult,
} from "../src/memory-retrieval-policy";

function createResult(partial: Partial<MemoryRetrievalResult>): MemoryRetrievalResult {
  return {
    contractVersion: MEMORY_RETRIEVAL_POLICY_VERSION,
    method: "keyword",
    status: "allowed",
    reason: "ok",
    selected: [],
    excluded: [],
    rawMemoryReleased: false,
    ...partial,
  };
}

describe("memory retrieval attribution", () => {
  it("strips raw content and populates selected attribution fields", () => {
    const result = createResult({
      selected: [
        {
          id: "mem-1",
          scope: "scope-a",
          summary: "summary",
          content: "raw text should not appear",
          createdAt: 1_000_000,
          auditTrust: 0.92,
          lifecycleState: "semantic",
        },
      ],
    });

    const attributions = buildRetrievalAttribution(result, {
      currentTimeMs: 1_200_000,
      staleThresholdMs: 180_000,
    });

    expect(attributions).toHaveLength(1);
    const entry = attributions[0];
    expect(entry).toMatchObject({
      sourceId: "mem-1",
      scope: "scope-a",
      freshnessMs: 200_000,
      rankReason: "high_trust",
      exclusionReason: undefined,
      isStale: true,
      rawContentBoundary: "content_stripped",
      rawMemoryReleased: false,
    });
    const hasContent = Object.prototype.hasOwnProperty.call(
      entry as unknown as Record<string, unknown>,
      "content",
    );
    expect(hasContent).toBe(false);
  });

  it("maps excluded reasons and marks them stale by default", () => {
    const result = createResult({
      selected: [],
      excluded: [
        { id: "mem-2", reason: "out_of_scope" },
        { id: "mem-3", reason: "privacy_filtered" },
      ],
    });

    const attributions = buildRetrievalAttribution(result, { currentTimeMs: 500_000 });

    expect(attributions).toEqual([
      {
        sourceId: "mem-2",
        scope: undefined,
        freshnessMs: undefined,
        rankReason: undefined,
        exclusionReason: "out_of_scope",
        isStale: true,
        rawContentBoundary: "content_stripped",
        rawMemoryReleased: false,
      },
      {
        sourceId: "mem-3",
        scope: undefined,
        freshnessMs: undefined,
        rankReason: undefined,
        exclusionReason: "privacy_filtered",
        isStale: true,
        rawContentBoundary: "content_stripped",
        rawMemoryReleased: false,
      },
    ]);
  });

  it("respects stale threshold and rank buckets", () => {
    const result = createResult({
      selected: [
        {
          id: "mem-4",
          scope: "scope-b",
          summary: "fresh memory",
          createdAt: 1_180_000,
          auditTrust: 0.8,
          lifecycleState: "semantic",
        },
      ],
    });

    const attributions = buildRetrievalAttribution(result, {
      currentTimeMs: 1_200_000,
      staleThresholdMs: DEFAULT_STALE_THRESHOLD_MS,
    });

    expect(attributions[0]).toMatchObject({
      sourceId: "mem-4",
      scope: "scope-b",
      freshnessMs: 20_000,
      rankReason: "medium_trust",
      isStale: false,
      rawContentBoundary: "content_stripped",
      rawMemoryReleased: false,
    });
  });
});
