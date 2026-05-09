/**
 * CPF Context Packager Batch Contract — Dedicated Tests (W37-T1)
 * ==============================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   ContextPackagerBatchContract constructor / factory:
 *     - creates a valid instance
 *     - factory creates a valid instance
 *
 *   ContextPackagerBatchContract.batch — empty batch:
 *     - dominantStatus NONE
 *     - totalRequests 0
 *     - packagedCount 0
 *     - emptyCount 0
 *     - totalSegments 0
 *     - dominantTokenBudget 0
 *     - results empty array
 *     - valid batchHash string for empty input
 *
 *   ContextPackagerBatchContract.batch — single EMPTY request:
 *     - totalRequests 1
 *     - emptyCount 1, packagedCount 0
 *     - dominantStatus EMPTY
 *
 *   ContextPackagerBatchContract.batch — single PACKAGED request:
 *     - totalRequests 1
 *     - packagedCount 1, emptyCount 0
 *     - dominantStatus PACKAGED
 *     - dominantTokenBudget is positive
 *
 *   ContextPackagerBatchContract.batch — dominant status resolution:
 *     - PACKAGED dominates EMPTY
 *     - all EMPTY yields EMPTY
 *
 *   ContextPackagerBatchContract.batch — count accuracy:
 *     - mixed batch counts all status types correctly
 *     - packagedCount + emptyCount equals totalRequests
 *     - totalRequests equals results array length
 *
 *   ContextPackagerBatchContract.batch — totalSegments aggregation:
 *     - totalSegments is 0 when all results are EMPTY
 *     - totalSegments sums totalSegments across all results
 *     - totalSegments accumulates for multiple PACKAGED results
 *
 *   ContextPackagerBatchContract.batch — dominantTokenBudget aggregation:
 *     - dominantTokenBudget is 0 for empty batch
 *     - dominantTokenBudget equals estimatedTokens for single PACKAGED result
 *     - dominantTokenBudget is the max estimatedTokens across multiple results
 *
 *   ContextPackagerBatchContract.batch — output shape:
 *     - result has all required fields
 *     - createdAt equals injected timestamp
 *     - batchId and batchHash are non-empty strings
 *     - batchId differs from batchHash
 *     - each result has required TypedContextPackage fields
 *
 *   ContextPackagerBatchContract.batch — determinism:
 *     - same batchHash for identical requests
 *     - same batchId for identical requests
 *     - different batchHash for different batch size
 */

import { describe, it, expect } from "vitest";
import {
  ContextPackagerBatchContract,
  createContextPackagerBatchContract,
  type ContextPackagerBatch,
} from "../src/context.packager.batch.contract";
import type { ContextPackagerRequest } from "../src/context.packager.contract";
import { FIXED_BATCH_NOW } from "./helpers/cpf.batch.contract.fixtures";

// --- Helpers ---

const FIXED_NOW = FIXED_BATCH_NOW;

/**
 * Request that produces at least one segment (QUERY type) → PACKAGED.
 */
function makePackagedRequest(contextId = "ctx-packaged-1"): ContextPackagerRequest {
  return {
    query: "analyze system architecture requirements",
    contextId,
  };
}

/**
 * Request with no allowed segment types → zero segments → EMPTY.
 */
function makeEmptyRequest(contextId = "ctx-empty-1"): ContextPackagerRequest {
  return {
    query: "test query",
    contextId,
    segmentTypeConstraints: { allowedTypes: [] },
  };
}

function makeContract(): ContextPackagerBatchContract {
  return new ContextPackagerBatchContract({ now: () => FIXED_NOW });
}

// --- Tests: constructor / factory ---

describe("ContextPackagerBatchContract constructor and factory", () => {
  it("creates a valid instance with no dependencies", () => {
    const contract = new ContextPackagerBatchContract();
    expect(contract).toBeInstanceOf(ContextPackagerBatchContract);
  });

  it("factory creates a valid instance", () => {
    const contract = createContextPackagerBatchContract({ now: () => FIXED_NOW });
    expect(contract).toBeInstanceOf(ContextPackagerBatchContract);
    const result = contract.batch([]);
    expect(result.dominantStatus).toBe("NONE");
  });
});

// --- Tests: empty batch ---

describe("ContextPackagerBatchContract.batch — empty batch", () => {
  const contract = makeContract();

  it("returns dominantStatus NONE for empty input", () => {
    expect(contract.batch([]).dominantStatus).toBe("NONE");
  });

  it("returns totalRequests 0 for empty input", () => {
    expect(contract.batch([]).totalRequests).toBe(0);
  });

  it("returns packagedCount 0 for empty input", () => {
    expect(contract.batch([]).packagedCount).toBe(0);
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

// --- Tests: single EMPTY request ---

describe("ContextPackagerBatchContract.batch — single EMPTY request", () => {
  const contract = makeContract();

  it("totalRequests is 1", () => {
    expect(contract.batch([makeEmptyRequest()]).totalRequests).toBe(1);
  });

  it("emptyCount is 1, packagedCount is 0", () => {
    const result = contract.batch([makeEmptyRequest()]);
    expect(result.emptyCount).toBe(1);
    expect(result.packagedCount).toBe(0);
  });

  it("dominantStatus is EMPTY", () => {
    expect(contract.batch([makeEmptyRequest()]).dominantStatus).toBe("EMPTY");
  });
});

// --- Tests: single PACKAGED request ---

describe("ContextPackagerBatchContract.batch — single PACKAGED request", () => {
  const contract = makeContract();

  it("totalRequests is 1", () => {
    expect(contract.batch([makePackagedRequest()]).totalRequests).toBe(1);
  });

  it("packagedCount is 1, emptyCount is 0", () => {
    const result = contract.batch([makePackagedRequest()]);
    expect(result.packagedCount).toBe(1);
    expect(result.emptyCount).toBe(0);
  });

  it("dominantStatus is PACKAGED", () => {
    expect(contract.batch([makePackagedRequest()]).dominantStatus).toBe("PACKAGED");
  });

  it("dominantTokenBudget is positive for PACKAGED result", () => {
    expect(contract.batch([makePackagedRequest()]).dominantTokenBudget).toBeGreaterThan(0);
  });
});

// --- Tests: dominant status resolution ---

describe("ContextPackagerBatchContract.batch — dominant status resolution", () => {
  it("PACKAGED dominates EMPTY in a mixed batch", () => {
    const contract = makeContract();
    const result = contract.batch([makePackagedRequest(), makeEmptyRequest()]);
    expect(result.dominantStatus).toBe("PACKAGED");
  });

  it("all EMPTY results yield dominantStatus EMPTY", () => {
    const contract = makeContract();
    const result = contract.batch([makeEmptyRequest("ctx-e1"), makeEmptyRequest("ctx-e2")]);
    expect(result.dominantStatus).toBe("EMPTY");
  });
});

// --- Tests: count accuracy ---

describe("ContextPackagerBatchContract.batch — count accuracy", () => {
  it("counts all status types correctly in a mixed batch", () => {
    const contract = makeContract();
    const result = contract.batch([
      makePackagedRequest("ctx-p1"),
      makeEmptyRequest("ctx-e1"),
      makeEmptyRequest("ctx-e2"),
    ]);
    expect(result.totalRequests).toBe(3);
    expect(result.packagedCount).toBe(1);
    expect(result.emptyCount).toBe(2);
  });

  it("packagedCount + emptyCount equals totalRequests", () => {
    const contract = makeContract();
    const result = contract.batch([makePackagedRequest(), makeEmptyRequest()]);
    expect(result.packagedCount + result.emptyCount).toBe(result.totalRequests);
  });

  it("totalRequests equals results array length", () => {
    const contract = makeContract();
    const result = contract.batch([makeEmptyRequest("ctx-e1"), makeEmptyRequest("ctx-e2")]);
    expect(result.totalRequests).toBe(result.results.length);
  });
});

// --- Tests: totalSegments aggregation ---

describe("ContextPackagerBatchContract.batch — totalSegments aggregation", () => {
  it("totalSegments is 0 when all results are EMPTY", () => {
    const contract = makeContract();
    const result = contract.batch([makeEmptyRequest("ctx-e1"), makeEmptyRequest("ctx-e2")]);
    expect(result.totalSegments).toBe(0);
  });

  it("totalSegments equals the result's totalSegments for a single PACKAGED request", () => {
    const contract = makeContract();
    const result = contract.batch([makePackagedRequest()]);
    expect(result.totalSegments).toBe(result.results[0].totalSegments);
  });

  it("totalSegments accumulates totalSegments for multiple PACKAGED results", () => {
    const contract = makeContract();
    const result = contract.batch([
      makePackagedRequest("ctx-p1"),
      makePackagedRequest("ctx-p2"),
    ]);
    const expectedTotal = result.results.reduce((sum, r) => sum + r.totalSegments, 0);
    expect(result.totalSegments).toBe(expectedTotal);
  });
});

// --- Tests: dominantTokenBudget aggregation ---

describe("ContextPackagerBatchContract.batch — dominantTokenBudget aggregation", () => {
  it("dominantTokenBudget is 0 for empty batch", () => {
    expect(makeContract().batch([]).dominantTokenBudget).toBe(0);
  });

  it("dominantTokenBudget equals estimatedTokens for a single PACKAGED result", () => {
    const contract = makeContract();
    const result = contract.batch([makePackagedRequest()]);
    expect(result.dominantTokenBudget).toBe(result.results[0].estimatedTokens);
  });

  it("dominantTokenBudget is the max estimatedTokens across multiple results", () => {
    const contract = makeContract();
    const result = contract.batch([
      makePackagedRequest("ctx-p1"),
      makePackagedRequest("ctx-p2"),
      makeEmptyRequest("ctx-e1"),
    ]);
    const expectedMax = Math.max(...result.results.map((r) => r.estimatedTokens));
    expect(result.dominantTokenBudget).toBe(expectedMax);
  });
});

// --- Tests: output shape ---

describe("ContextPackagerBatchContract.batch — output shape", () => {
  it("result has all required fields", () => {
    const result = makeContract().batch([makeEmptyRequest()]);
    expect(result).toHaveProperty("batchId");
    expect(result).toHaveProperty("batchHash");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("totalRequests");
    expect(result).toHaveProperty("packagedCount");
    expect(result).toHaveProperty("emptyCount");
    expect(result).toHaveProperty("totalSegments");
    expect(result).toHaveProperty("dominantStatus");
    expect(result).toHaveProperty("dominantTokenBudget");
    expect(result).toHaveProperty("results");
  });

  it("createdAt equals injected timestamp", () => {
    const result = makeContract().batch([makeEmptyRequest()]);
    expect(result.createdAt).toBe(FIXED_NOW);
  });

  it("batchId and batchHash are non-empty strings", () => {
    const result = makeContract().batch([makeEmptyRequest()]);
    expect(typeof result.batchId).toBe("string");
    expect(result.batchId.length).toBeGreaterThan(0);
    expect(typeof result.batchHash).toBe("string");
    expect(result.batchHash.length).toBeGreaterThan(0);
  });

  it("batchId differs from batchHash", () => {
    const result = makeContract().batch([makeEmptyRequest()]);
    expect(result.batchId).not.toBe(result.batchHash);
  });

  it("each result has required TypedContextPackage fields", () => {
    const result = makeContract().batch([makePackagedRequest(), makeEmptyRequest()]);
    for (const r of result.results) {
      expect(r).toHaveProperty("packageId");
      expect(r).toHaveProperty("builtAt");
      expect(r).toHaveProperty("contextId");
      expect(r).toHaveProperty("query");
      expect(r).toHaveProperty("segments");
      expect(r).toHaveProperty("totalSegments");
      expect(r).toHaveProperty("estimatedTokens");
      expect(r).toHaveProperty("perTypeTokens");
      expect(r).toHaveProperty("packageHash");
    }
  });
});

// --- Tests: determinism ---

describe("ContextPackagerBatchContract.batch — determinism", () => {
  it("produces same batchHash for identical requests", () => {
    const contractA = makeContract();
    const contractB = makeContract();
    expect(
      contractA.batch([makeEmptyRequest("ctx-e1"), makeEmptyRequest("ctx-e2")]).batchHash,
    ).toBe(
      contractB.batch([makeEmptyRequest("ctx-e1"), makeEmptyRequest("ctx-e2")]).batchHash,
    );
  });

  it("produces same batchId for identical requests", () => {
    const contractA = makeContract();
    const contractB = makeContract();
    expect(contractA.batch([makeEmptyRequest()]).batchId).toBe(
      contractB.batch([makeEmptyRequest()]).batchId,
    );
  });

  it("produces different batchHash for different batch size", () => {
    const contract = makeContract();
    const r1 = contract.batch([makeEmptyRequest()]);
    const r2 = contract.batch([makeEmptyRequest("ctx-e1"), makeEmptyRequest("ctx-e2")]);
    expect(r1.batchHash).not.toBe(r2.batchHash);
  });
});
