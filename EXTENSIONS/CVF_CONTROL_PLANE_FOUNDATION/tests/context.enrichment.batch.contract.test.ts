/**
 * CPF Context Enrichment Batch Contract — Dedicated Tests (W38-T1)
 * =================================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   ContextEnrichmentBatchContract constructor / factory:
 *     - creates a valid instance
 *     - factory creates a valid instance
 *
 *   ContextEnrichmentBatchContract.batch — empty batch:
 *     - dominantStatus NONE
 *     - totalRequests 0
 *     - enrichedCount 0
 *     - emptyCount 0
 *     - totalSegments 0
 *     - dominantTokenBudget 0
 *     - results empty array
 *     - valid batchHash string for empty input
 *
 *   ContextEnrichmentBatchContract.batch — single ENRICHED request:
 *     - totalRequests 1
 *     - enrichedCount 1, emptyCount 0
 *     - dominantStatus ENRICHED
 *     - dominantTokenBudget is positive
 *
 *   ContextEnrichmentBatchContract.batch — enrichment invariant:
 *     - result always has at least 1 segment (SYSTEM prepended)
 *     - result totalSegments exceeds input totalSegments
 *     - zero-segment input package produces enriched result (totalSegments >= 1)
 *
 *   ContextEnrichmentBatchContract.batch — dominant status resolution:
 *     - all ENRICHED results yield dominantStatus ENRICHED
 *     - multiple ENRICHED requests all resolve to ENRICHED
 *
 *   ContextEnrichmentBatchContract.batch — count accuracy:
 *     - mixed batch counts all status types correctly
 *     - enrichedCount + emptyCount equals totalRequests
 *     - totalRequests equals results array length
 *
 *   ContextEnrichmentBatchContract.batch — totalSegments aggregation:
 *     - totalSegments is 0 for empty batch
 *     - totalSegments equals the result's totalSegments for single request
 *     - totalSegments accumulates across multiple requests
 *
 *   ContextEnrichmentBatchContract.batch — dominantTokenBudget aggregation:
 *     - dominantTokenBudget is 0 for empty batch
 *     - dominantTokenBudget equals estimatedTokens for single result
 *     - dominantTokenBudget is the max estimatedTokens across multiple results
 *
 *   ContextEnrichmentBatchContract.batch — output shape:
 *     - result has all required fields
 *     - createdAt equals injected timestamp
 *     - batchId and batchHash are non-empty strings
 *     - batchId differs from batchHash
 *     - each result has required ContextPackage fields
 *
 *   ContextEnrichmentBatchContract.batch — determinism:
 *     - same batchHash for identical requests
 *     - same batchId for identical requests
 *     - different batchHash for different batch size
 */

import { describe, it, expect } from "vitest";
import {
  ContextEnrichmentBatchContract,
  createContextEnrichmentBatchContract,
  type ContextEnrichmentBatch,
  type ContextEnrichmentBatchRequest,
} from "../src/context.enrichment.batch.contract";
import type { ContextPackage, ContextSegment } from "../src/context.build.contract";
import { FIXED_BATCH_NOW } from "./helpers/cpf.batch.contract.fixtures";

// --- Helpers ---

const FIXED_NOW = FIXED_BATCH_NOW;

function makeSegment(
  id: string,
  type: ContextSegment["segmentType"],
  content: string,
  tokens = content.length,
): ContextSegment {
  return { segmentId: id, segmentType: type, content, tokenEstimate: tokens };
}

function makePackage(
  packageId: string,
  segments: ContextSegment[] = [],
  contextId = "ctx-1",
): ContextPackage {
  const estimatedTokens = segments.reduce((s, seg) => s + seg.tokenEstimate, 0);
  return {
    packageId,
    builtAt: FIXED_NOW,
    contextId,
    query: "test query",
    segments,
    totalSegments: segments.length,
    estimatedTokens,
    packageHash: `hash-${packageId}`,
  };
}

function makeRequest(
  packageId: string,
  systemContent = "You are a helpful assistant.",
  segments: ContextSegment[] = [makeSegment("seg-q1", "QUERY", "hello world")],
  contextId = "ctx-1",
): ContextEnrichmentBatchRequest {
  return {
    pkg: makePackage(packageId, segments, contextId),
    systemContent,
  };
}

function makeContract(): ContextEnrichmentBatchContract {
  return new ContextEnrichmentBatchContract({ now: () => FIXED_NOW });
}

// --- Tests: constructor / factory ---

describe("ContextEnrichmentBatchContract constructor and factory", () => {
  it("creates a valid instance with no dependencies", () => {
    const contract = new ContextEnrichmentBatchContract();
    expect(contract).toBeInstanceOf(ContextEnrichmentBatchContract);
  });

  it("factory creates a valid instance", () => {
    const contract = createContextEnrichmentBatchContract({ now: () => FIXED_NOW });
    expect(contract).toBeInstanceOf(ContextEnrichmentBatchContract);
    const result = contract.batch([]);
    expect(result.dominantStatus).toBe("NONE");
  });
});

// --- Tests: empty batch ---

describe("ContextEnrichmentBatchContract.batch — empty batch", () => {
  const contract = makeContract();

  it("returns dominantStatus NONE for empty input", () => {
    expect(contract.batch([]).dominantStatus).toBe("NONE");
  });

  it("returns totalRequests 0 for empty input", () => {
    expect(contract.batch([]).totalRequests).toBe(0);
  });

  it("returns enrichedCount 0 for empty input", () => {
    expect(contract.batch([]).enrichedCount).toBe(0);
  });

  it("returns emptyCount 0 for empty input", () => {
    expect(contract.batch([]).emptyCount).toBe(0);
  });

  it("returns totalSegments 0 for empty input", () => {
    expect(contract.batch([]).totalSegments).toBe(0);
  });

  it("returns dominantTokenBudget 0 for empty input", () => {
    expect(contract.batch([]).dominantTokenBudget).toBe(0);
  });

  it("returns empty results array for empty input", () => {
    expect(contract.batch([]).results).toHaveLength(0);
  });

  it("returns valid batchHash string for empty input", () => {
    const result = contract.batch([]);
    expect(typeof result.batchHash).toBe("string");
    expect(result.batchHash.length).toBeGreaterThan(0);
  });
});

// --- Tests: single ENRICHED request ---

describe("ContextEnrichmentBatchContract.batch — single ENRICHED request", () => {
  const contract = makeContract();

  it("totalRequests is 1", () => {
    expect(contract.batch([makeRequest("pkg-1")]).totalRequests).toBe(1);
  });

  it("enrichedCount is 1, emptyCount is 0", () => {
    const result = contract.batch([makeRequest("pkg-1")]);
    expect(result.enrichedCount).toBe(1);
    expect(result.emptyCount).toBe(0);
  });

  it("dominantStatus is ENRICHED", () => {
    expect(contract.batch([makeRequest("pkg-1")]).dominantStatus).toBe("ENRICHED");
  });

  it("dominantTokenBudget is positive for ENRICHED result", () => {
    expect(contract.batch([makeRequest("pkg-1")]).dominantTokenBudget).toBeGreaterThan(0);
  });
});

// --- Tests: enrichment invariant ---

describe("ContextEnrichmentBatchContract.batch — enrichment invariant", () => {
  it("result always has at least 1 segment after addSystemSegment", () => {
    const contract = makeContract();
    const result = contract.batch([makeRequest("pkg-inv1")]);
    expect(result.results[0].totalSegments).toBeGreaterThanOrEqual(1);
  });

  it("result totalSegments exceeds input package totalSegments", () => {
    const contract = makeContract();
    const req = makeRequest("pkg-inv2", "System prompt", [
      makeSegment("seg-q2", "QUERY", "hello"),
    ]);
    const result = contract.batch([req]);
    expect(result.results[0].totalSegments).toBeGreaterThan(req.pkg.totalSegments);
  });

  it("zero-segment input package yields enriched result with totalSegments >= 1", () => {
    const contract = makeContract();
    const req = makeRequest("pkg-inv3", "You are helpful.", []);
    const result = contract.batch([req]);
    expect(result.results[0].totalSegments).toBeGreaterThanOrEqual(1);
    expect(result.enrichedCount).toBe(1);
  });
});

// --- Tests: dominant status resolution ---

describe("ContextEnrichmentBatchContract.batch — dominant status resolution", () => {
  it("all ENRICHED results yield dominantStatus ENRICHED", () => {
    const contract = makeContract();
    const result = contract.batch([makeRequest("pkg-d1"), makeRequest("pkg-d2")]);
    expect(result.dominantStatus).toBe("ENRICHED");
  });

  it("multiple ENRICHED requests all resolve enrichedCount to totalRequests", () => {
    const contract = makeContract();
    const result = contract.batch([
      makeRequest("pkg-d3"),
      makeRequest("pkg-d4"),
      makeRequest("pkg-d5"),
    ]);
    expect(result.enrichedCount).toBe(3);
    expect(result.emptyCount).toBe(0);
  });
});

// --- Tests: count accuracy ---

describe("ContextEnrichmentBatchContract.batch — count accuracy", () => {
  it("counts all requests correctly in a multi-request batch", () => {
    const contract = makeContract();
    const result = contract.batch([
      makeRequest("pkg-c1"),
      makeRequest("pkg-c2"),
      makeRequest("pkg-c3"),
    ]);
    expect(result.totalRequests).toBe(3);
    expect(result.enrichedCount).toBe(3);
    expect(result.emptyCount).toBe(0);
  });

  it("enrichedCount + emptyCount equals totalRequests", () => {
    const contract = makeContract();
    const result = contract.batch([makeRequest("pkg-c4"), makeRequest("pkg-c5")]);
    expect(result.enrichedCount + result.emptyCount).toBe(result.totalRequests);
  });

  it("totalRequests equals results array length", () => {
    const contract = makeContract();
    const result = contract.batch([
      makeRequest("pkg-c6", "sys1"),
      makeRequest("pkg-c7", "sys2"),
    ]);
    expect(result.totalRequests).toBe(result.results.length);
  });
});

// --- Tests: totalSegments aggregation ---

describe("ContextEnrichmentBatchContract.batch — totalSegments aggregation", () => {
  it("totalSegments is 0 for empty batch", () => {
    expect(makeContract().batch([]).totalSegments).toBe(0);
  });

  it("totalSegments equals the result totalSegments for a single request", () => {
    const contract = makeContract();
    const result = contract.batch([makeRequest("pkg-s1")]);
    expect(result.totalSegments).toBe(result.results[0].totalSegments);
  });

  it("totalSegments accumulates totalSegments across multiple results", () => {
    const contract = makeContract();
    const result = contract.batch([
      makeRequest("pkg-s2"),
      makeRequest("pkg-s3"),
    ]);
    const expectedTotal = result.results.reduce((sum, r) => sum + r.totalSegments, 0);
    expect(result.totalSegments).toBe(expectedTotal);
  });
});

// --- Tests: dominantTokenBudget aggregation ---

describe("ContextEnrichmentBatchContract.batch — dominantTokenBudget aggregation", () => {
  it("dominantTokenBudget is 0 for empty batch", () => {
    expect(makeContract().batch([]).dominantTokenBudget).toBe(0);
  });

  it("dominantTokenBudget equals estimatedTokens for a single result", () => {
    const contract = makeContract();
    const result = contract.batch([makeRequest("pkg-t1")]);
    expect(result.dominantTokenBudget).toBe(result.results[0].estimatedTokens);
  });

  it("dominantTokenBudget is the max estimatedTokens across multiple results", () => {
    const contract = makeContract();
    const result = contract.batch([
      makeRequest("pkg-t2", "short system"),
      makeRequest("pkg-t3", "a much longer system content string for testing"),
      makeRequest("pkg-t4", "medium content"),
    ]);
    const expectedMax = Math.max(...result.results.map((r) => r.estimatedTokens));
    expect(result.dominantTokenBudget).toBe(expectedMax);
  });
});

// --- Tests: output shape ---

describe("ContextEnrichmentBatchContract.batch — output shape", () => {
  it("result has all required fields", () => {
    const result = makeContract().batch([makeRequest("pkg-o1")]);
    expect(result).toHaveProperty("batchId");
    expect(result).toHaveProperty("batchHash");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("totalRequests");
    expect(result).toHaveProperty("enrichedCount");
    expect(result).toHaveProperty("emptyCount");
    expect(result).toHaveProperty("totalSegments");
    expect(result).toHaveProperty("dominantStatus");
    expect(result).toHaveProperty("dominantTokenBudget");
    expect(result).toHaveProperty("results");
  });

  it("createdAt equals injected timestamp", () => {
    const result = makeContract().batch([makeRequest("pkg-o2")]);
    expect(result.createdAt).toBe(FIXED_NOW);
  });

  it("batchId and batchHash are non-empty strings", () => {
    const result = makeContract().batch([makeRequest("pkg-o3")]);
    expect(typeof result.batchId).toBe("string");
    expect(result.batchId.length).toBeGreaterThan(0);
    expect(typeof result.batchHash).toBe("string");
    expect(result.batchHash.length).toBeGreaterThan(0);
  });

  it("batchId differs from batchHash", () => {
    const result = makeContract().batch([makeRequest("pkg-o4")]);
    expect(result.batchId).not.toBe(result.batchHash);
  });

  it("each result has required ContextPackage fields", () => {
    const result = makeContract().batch([makeRequest("pkg-o5"), makeRequest("pkg-o6")]);
    for (const r of result.results) {
      expect(r).toHaveProperty("packageId");
      expect(r).toHaveProperty("builtAt");
      expect(r).toHaveProperty("contextId");
      expect(r).toHaveProperty("query");
      expect(r).toHaveProperty("segments");
      expect(r).toHaveProperty("totalSegments");
      expect(r).toHaveProperty("estimatedTokens");
      expect(r).toHaveProperty("packageHash");
    }
  });
});

// --- Tests: determinism ---

describe("ContextEnrichmentBatchContract.batch — determinism", () => {
  it("produces same batchHash for identical requests", () => {
    const contractA = makeContract();
    const contractB = makeContract();
    const req1 = makeRequest("pkg-det1");
    const req2 = makeRequest("pkg-det1");
    expect(contractA.batch([req1]).batchHash).toBe(contractB.batch([req2]).batchHash);
  });

  it("produces same batchId for identical requests", () => {
    const contractA = makeContract();
    const contractB = makeContract();
    const req1 = makeRequest("pkg-det2");
    const req2 = makeRequest("pkg-det2");
    expect(contractA.batch([req1]).batchId).toBe(contractB.batch([req2]).batchId);
  });

  it("produces different batchHash for different batch size", () => {
    const contract = makeContract();
    const r1 = contract.batch([makeRequest("pkg-det3")]);
    const r2 = contract.batch([makeRequest("pkg-det4"), makeRequest("pkg-det5")]);
    expect(r1.batchHash).not.toBe(r2.batchHash);
  });
});
