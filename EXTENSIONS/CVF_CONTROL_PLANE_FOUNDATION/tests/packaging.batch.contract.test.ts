/**
 * CPF Packaging Batch Contract — Dedicated Tests (W40-T1 CP1)
 * =============================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 * GC-024: partition entry added to CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json.
 *
 * Coverage:
 *   PackagingBatchContract.batch (empty):
 *     - totalRequests = 0
 *     - dominantStatus = NONE
 *     - totalTokens = 0
 *     - dominantTokenBudget = 0
 *     - fullCount = 0, truncatedCount = 0
 *     - results is empty array
 *     - batchHash is truthy
 *     - batchId is truthy
 *     - batchId !== batchHash
 *     - createdAt set to injected now()
 *
 *   PackagingBatchContract.batch (single FULL request):
 *     - totalRequests = 1
 *     - dominantStatus = FULL
 *     - fullCount = 1, truncatedCount = 0
 *     - totalTokens matches result.totalTokens
 *     - dominantTokenBudget = request tokenBudget
 *     - result.truncated = false
 *     - batchId !== batchHash
 *
 *   PackagingBatchContract.batch (single TRUNCATED request):
 *     - totalRequests = 1
 *     - dominantStatus = TRUNCATED
 *     - truncatedCount = 1, fullCount = 0
 *     - result.truncated = true
 *
 *   PackagingBatchContract.batch (mixed — TRUNCATED dominates FULL):
 *     - totalRequests = 2
 *     - dominantStatus = TRUNCATED
 *     - fullCount = 1, truncatedCount = 1
 *     - totalTokens is sum of both results
 *     - dominantTokenBudget = max tokenBudget
 *     - results length matches input
 *
 *   PackagingBatchContract.batch — determinism:
 *     - batchHash deterministic for same input and timestamp
 *     - batchId deterministic for same input and timestamp
 *     - different requests produce different batchHash
 *     - different timestamps produce different batchHash
 *
 *   Factory:
 *     - createPackagingBatchContract returns working instance
 */

import { describe, it, expect } from "vitest";
import {
  PackagingBatchContract,
  createPackagingBatchContract,
} from "../src/packaging.batch.contract";
import type { PackagingRequest } from "../src/packaging.contract";

const FIXED_NOW = "2026-04-05T00:00:00.000Z";
const fixedNow = () => FIXED_NOW;

// A request where all chunks fit within budget → FULL
function makeFullRequest(): PackagingRequest {
  return {
    chunks: [
      { id: "c1", source: "s1", content: "hello world", relevanceScore: 0.9 },
      { id: "c2", source: "s2", content: "foo bar",     relevanceScore: 0.8 },
    ],
    tokenBudget: 1000,
  };
}

// A request where budget is too small for any chunk → TRUNCATED
function makeTruncatedRequest(): PackagingRequest {
  return {
    chunks: [
      { id: "c3", source: "s3", content: "some longer content that exceeds tiny budget", relevanceScore: 0.9 },
    ],
    tokenBudget: 1, // budget of 1 token — estimateTokenCount("some...") > 1
  };
}

const contract = new PackagingBatchContract({ now: fixedNow });

// ─── Empty batch ──────────────────────────────────────────────────────────────

describe("PackagingBatchContract.batch (empty)", () => {
  const result = contract.batch([]);

  it("totalRequests = 0", () => {
    expect(result.totalRequests).toBe(0);
  });

  it("dominantStatus = NONE", () => {
    expect(result.dominantStatus).toBe("NONE");
  });

  it("totalTokens = 0", () => {
    expect(result.totalTokens).toBe(0);
  });

  it("dominantTokenBudget = 0", () => {
    expect(result.dominantTokenBudget).toBe(0);
  });

  it("fullCount = 0", () => {
    expect(result.fullCount).toBe(0);
  });

  it("truncatedCount = 0", () => {
    expect(result.truncatedCount).toBe(0);
  });

  it("results is empty array", () => {
    expect(result.results).toHaveLength(0);
  });

  it("batchHash is truthy", () => {
    expect(result.batchHash.length).toBeGreaterThan(0);
  });

  it("batchId is truthy", () => {
    expect(result.batchId.length).toBeGreaterThan(0);
  });

  it("batchId !== batchHash", () => {
    expect(result.batchId).not.toBe(result.batchHash);
  });

  it("createdAt set to injected now()", () => {
    expect(result.createdAt).toBe(FIXED_NOW);
  });
});

// ─── Single FULL request ──────────────────────────────────────────────────────

describe("PackagingBatchContract.batch (single FULL request)", () => {
  const req = makeFullRequest();
  const result = contract.batch([req]);
  const firstResult = result.results[0];

  it("totalRequests = 1", () => {
    expect(result.totalRequests).toBe(1);
  });

  it("dominantStatus = FULL", () => {
    expect(result.dominantStatus).toBe("FULL");
  });

  it("fullCount = 1", () => {
    expect(result.fullCount).toBe(1);
  });

  it("truncatedCount = 0", () => {
    expect(result.truncatedCount).toBe(0);
  });

  it("totalTokens matches result.totalTokens", () => {
    expect(result.totalTokens).toBe(firstResult.totalTokens);
  });

  it("dominantTokenBudget = request tokenBudget", () => {
    expect(result.dominantTokenBudget).toBe(1000);
  });

  it("result.truncated = false", () => {
    expect(firstResult.truncated).toBe(false);
  });

  it("batchId !== batchHash", () => {
    expect(result.batchId).not.toBe(result.batchHash);
  });
});

// ─── Single TRUNCATED request ─────────────────────────────────────────────────

describe("PackagingBatchContract.batch (single TRUNCATED request)", () => {
  const req = makeTruncatedRequest();
  const result = contract.batch([req]);

  it("totalRequests = 1", () => {
    expect(result.totalRequests).toBe(1);
  });

  it("dominantStatus = TRUNCATED", () => {
    expect(result.dominantStatus).toBe("TRUNCATED");
  });

  it("truncatedCount = 1", () => {
    expect(result.truncatedCount).toBe(1);
  });

  it("fullCount = 0", () => {
    expect(result.fullCount).toBe(0);
  });

  it("result.truncated = true", () => {
    expect(result.results[0].truncated).toBe(true);
  });
});

// ─── Mixed batch — TRUNCATED dominates FULL ───────────────────────────────────

describe("PackagingBatchContract.batch (mixed — TRUNCATED dominates)", () => {
  const r1 = makeFullRequest();      // tokenBudget = 1000 → FULL
  const r2 = makeTruncatedRequest(); // tokenBudget = 1    → TRUNCATED
  const result = contract.batch([r1, r2]);

  it("totalRequests = 2", () => {
    expect(result.totalRequests).toBe(2);
  });

  it("dominantStatus = TRUNCATED", () => {
    expect(result.dominantStatus).toBe("TRUNCATED");
  });

  it("fullCount = 1", () => {
    expect(result.fullCount).toBe(1);
  });

  it("truncatedCount = 1", () => {
    expect(result.truncatedCount).toBe(1);
  });

  it("totalTokens is sum of both results", () => {
    const expected = result.results[0].totalTokens + result.results[1].totalTokens;
    expect(result.totalTokens).toBe(expected);
  });

  it("dominantTokenBudget = max tokenBudget (1000)", () => {
    expect(result.dominantTokenBudget).toBe(1000);
  });

  it("results length matches input", () => {
    expect(result.results).toHaveLength(2);
  });
});

// ─── Determinism ──────────────────────────────────────────────────────────────

describe("PackagingBatchContract.batch — determinism", () => {
  const req = makeFullRequest();

  it("batchHash is deterministic for same input and timestamp", () => {
    const b1 = contract.batch([req]);
    const b2 = contract.batch([req]);
    expect(b1.batchHash).toBe(b2.batchHash);
  });

  it("batchId is deterministic for same input and timestamp", () => {
    const b1 = contract.batch([req]);
    const b2 = contract.batch([req]);
    expect(b1.batchId).toBe(b2.batchId);
  });

  it("different requests produce different batchHash", () => {
    const b1 = contract.batch([req]);
    const b2 = contract.batch([makeTruncatedRequest()]);
    expect(b1.batchHash).not.toBe(b2.batchHash);
  });

  it("different timestamps produce different batchHash", () => {
    const contract2 = new PackagingBatchContract({
      now: () => "2026-04-05T12:00:00.000Z",
    });
    const b1 = contract.batch([req]);
    const b2 = contract2.batch([req]);
    expect(b1.batchHash).not.toBe(b2.batchHash);
  });
});

// ─── Factory ──────────────────────────────────────────────────────────────────

describe("createPackagingBatchContract", () => {
  it("returns a working instance", () => {
    const c = createPackagingBatchContract({ now: fixedNow });
    const result = c.batch([makeFullRequest()]);
    expect(result.totalRequests).toBe(1);
    expect(result.dominantStatus).toBe("FULL");
    expect(result.fullCount).toBe(1);
    expect(result.truncatedCount).toBe(0);
    expect(result.createdAt).toBe(FIXED_NOW);
  });
});
