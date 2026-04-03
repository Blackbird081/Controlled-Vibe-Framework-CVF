/**
 * CPF Retrieval Batch Contract — Dedicated Tests (W36-T1)
 * ========================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   RetrievalBatchContract constructor / factory:
 *     - creates a valid instance
 *     - factory creates a valid instance
 *
 *   RetrievalBatchContract.batch — empty batch:
 *     - dominantStatus NONE
 *     - totalRequests 0
 *     - hitCount 0
 *     - emptyCount 0
 *     - totalChunkCount 0
 *     - results empty array
 *     - valid batchHash string for empty input
 *
 *   RetrievalBatchContract.batch — single EMPTY request:
 *     - totalRequests 1
 *     - emptyCount 1, hitCount 0
 *     - dominantStatus EMPTY
 *
 *   RetrievalBatchContract.batch — single HIT request:
 *     - totalRequests 1
 *     - hitCount 1, emptyCount 0
 *     - dominantStatus HIT
 *
 *   RetrievalBatchContract.batch — dominant status resolution:
 *     - HIT dominates EMPTY
 *     - all EMPTY yields EMPTY
 *
 *   RetrievalBatchContract.batch — count accuracy:
 *     - mixed batch counts all status types correctly
 *     - hitCount + emptyCount equals totalRequests
 *     - totalRequests equals results array length
 *
 *   RetrievalBatchContract.batch — totalChunkCount aggregation:
 *     - totalChunkCount is 0 when all results are EMPTY
 *     - totalChunkCount sums chunkCount across all results
 *     - totalChunkCount reflects cumulative chunks for multiple HIT results
 *
 *   RetrievalBatchContract.batch — output shape:
 *     - result has all required fields
 *     - createdAt equals injected timestamp
 *     - batchId and batchHash are non-empty strings
 *     - batchId differs from batchHash
 *     - each result has query, chunkCount, totalCandidates, tiersSearched, chunks
 *
 *   RetrievalBatchContract.batch — determinism:
 *     - same batchHash for identical requests
 *     - same batchId for identical requests
 *     - different batchHash for different batch size
 */

import { describe, it, expect } from "vitest";
import {
  RetrievalBatchContract,
  createRetrievalBatchContract,
  type RetrievalBatch,
} from "../src/retrieval.batch.contract";
import type { RetrievalRequest } from "../src/retrieval.contract";
import { RAGPipeline } from "../../CVF_ECO_v1.4_RAG_PIPELINE/src/rag.pipeline";
import { FIXED_BATCH_NOW } from "./helpers/cpf.batch.contract.fixtures";

// --- Helpers ---

const FIXED_NOW = FIXED_BATCH_NOW;

/**
 * Query with no matching docs → chunkCount = 0 → EMPTY.
 */
const EMPTY_QUERY = "xyzzy-nonexistent-query-12345";

/**
 * Query that matches seeded docs → chunkCount > 0 → HIT.
 */
const HIT_QUERY = "analyze system requirements";

function makeDocSeededRAG(): RAGPipeline {
  const rag = new RAGPipeline();
  rag.getStore().add({
    id: "test-doc-retrieval-batch",
    title: "analyze system requirements guide",
    content: "how to analyze system requirements for software projects",
    tier: "T3_OPERATIONAL",
    documentType: "context_snippet",
    tags: [],
    metadata: {},
  });
  return rag;
}

function makeEmptyContract(): RetrievalBatchContract {
  return new RetrievalBatchContract({ now: () => FIXED_NOW });
}

function makeHitContract(): RetrievalBatchContract {
  return new RetrievalBatchContract({
    contractDependencies: { knowledge: makeDocSeededRAG() },
    now: () => FIXED_NOW,
  });
}

function req(query: string): RetrievalRequest {
  return { query };
}

// --- Tests: constructor / factory ---

describe("RetrievalBatchContract constructor and factory", () => {
  it("creates a valid instance with no dependencies", () => {
    const contract = new RetrievalBatchContract();
    expect(contract).toBeInstanceOf(RetrievalBatchContract);
  });

  it("factory creates a valid instance", () => {
    const contract = createRetrievalBatchContract({ now: () => FIXED_NOW });
    expect(contract).toBeInstanceOf(RetrievalBatchContract);
    const result = contract.batch([]);
    expect(result.dominantStatus).toBe("NONE");
  });
});

// --- Tests: empty batch ---

describe("RetrievalBatchContract.batch — empty batch", () => {
  const contract = makeEmptyContract();

  it("returns dominantStatus NONE for empty input", () => {
    expect(contract.batch([]).dominantStatus).toBe("NONE");
  });

  it("returns totalRequests 0 for empty input", () => {
    expect(contract.batch([]).totalRequests).toBe(0);
  });

  it("returns hitCount 0 for empty input", () => {
    expect(contract.batch([]).hitCount).toBe(0);
  });

  it("returns emptyCount 0 for empty input", () => {
    expect(contract.batch([]).emptyCount).toBe(0);
  });

  it("returns totalChunkCount 0 for empty input", () => {
    expect(contract.batch([]).totalChunkCount).toBe(0);
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

describe("RetrievalBatchContract.batch — single EMPTY request", () => {
  const contract = makeEmptyContract();

  it("totalRequests is 1", () => {
    expect(contract.batch([req(EMPTY_QUERY)]).totalRequests).toBe(1);
  });

  it("emptyCount is 1, hitCount is 0", () => {
    const result = contract.batch([req(EMPTY_QUERY)]);
    expect(result.emptyCount).toBe(1);
    expect(result.hitCount).toBe(0);
  });

  it("dominantStatus is EMPTY", () => {
    expect(contract.batch([req(EMPTY_QUERY)]).dominantStatus).toBe("EMPTY");
  });
});

// --- Tests: single HIT request ---

describe("RetrievalBatchContract.batch — single HIT request", () => {
  const contract = makeHitContract();

  it("totalRequests is 1", () => {
    expect(contract.batch([req(HIT_QUERY)]).totalRequests).toBe(1);
  });

  it("hitCount is 1, emptyCount is 0", () => {
    const result = contract.batch([req(HIT_QUERY)]);
    expect(result.hitCount).toBe(1);
    expect(result.emptyCount).toBe(0);
  });

  it("dominantStatus is HIT", () => {
    expect(contract.batch([req(HIT_QUERY)]).dominantStatus).toBe("HIT");
  });
});

// --- Tests: dominant status resolution ---

describe("RetrievalBatchContract.batch — dominant status resolution", () => {
  it("HIT dominates EMPTY in a mixed batch", () => {
    const contract = makeHitContract();
    const result = contract.batch([req(HIT_QUERY), req(EMPTY_QUERY)]);
    expect(result.dominantStatus).toBe("HIT");
  });

  it("all EMPTY results yield dominantStatus EMPTY", () => {
    const contract = makeEmptyContract();
    const result = contract.batch([req(EMPTY_QUERY), req(EMPTY_QUERY)]);
    expect(result.dominantStatus).toBe("EMPTY");
  });
});

// --- Tests: count accuracy ---

describe("RetrievalBatchContract.batch — count accuracy", () => {
  it("counts all status types correctly in a mixed batch", () => {
    const contract = makeHitContract();
    const result = contract.batch([
      req(HIT_QUERY),
      req(EMPTY_QUERY),
      req(EMPTY_QUERY),
    ]);
    expect(result.totalRequests).toBe(3);
    expect(result.hitCount).toBe(1);
    expect(result.emptyCount).toBe(2);
  });

  it("hitCount + emptyCount equals totalRequests", () => {
    const contract = makeHitContract();
    const result = contract.batch([req(HIT_QUERY), req(EMPTY_QUERY)]);
    expect(result.hitCount + result.emptyCount).toBe(result.totalRequests);
  });

  it("totalRequests equals results array length", () => {
    const contract = makeEmptyContract();
    const result = contract.batch([req(EMPTY_QUERY), req(EMPTY_QUERY)]);
    expect(result.totalRequests).toBe(result.results.length);
  });
});

// --- Tests: totalChunkCount aggregation ---

describe("RetrievalBatchContract.batch — totalChunkCount aggregation", () => {
  it("totalChunkCount is 0 when all results are EMPTY", () => {
    const contract = makeEmptyContract();
    const result = contract.batch([req(EMPTY_QUERY), req(EMPTY_QUERY)]);
    expect(result.totalChunkCount).toBe(0);
  });

  it("totalChunkCount sums chunkCount across all results", () => {
    const contract = makeHitContract();
    const result = contract.batch([req(HIT_QUERY)]);
    expect(result.totalChunkCount).toBe(result.results[0].chunkCount);
  });

  it("totalChunkCount accumulates chunks for multiple HIT results", () => {
    const contract = makeHitContract();
    const result = contract.batch([req(HIT_QUERY), req(HIT_QUERY)]);
    const expectedTotal = result.results.reduce(
      (sum, r) => sum + r.chunkCount,
      0,
    );
    expect(result.totalChunkCount).toBe(expectedTotal);
  });
});

// --- Tests: output shape ---

describe("RetrievalBatchContract.batch — output shape", () => {
  it("result has all required fields", () => {
    const result = makeEmptyContract().batch([req(EMPTY_QUERY)]);
    expect(result).toHaveProperty("batchId");
    expect(result).toHaveProperty("batchHash");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("totalRequests");
    expect(result).toHaveProperty("hitCount");
    expect(result).toHaveProperty("emptyCount");
    expect(result).toHaveProperty("totalChunkCount");
    expect(result).toHaveProperty("dominantStatus");
    expect(result).toHaveProperty("results");
  });

  it("createdAt equals injected timestamp", () => {
    const result = makeEmptyContract().batch([req(EMPTY_QUERY)]);
    expect(result.createdAt).toBe(FIXED_NOW);
  });

  it("batchId and batchHash are non-empty strings", () => {
    const result = makeEmptyContract().batch([req(EMPTY_QUERY)]);
    expect(typeof result.batchId).toBe("string");
    expect(result.batchId.length).toBeGreaterThan(0);
    expect(typeof result.batchHash).toBe("string");
    expect(result.batchHash.length).toBeGreaterThan(0);
  });

  it("batchId differs from batchHash", () => {
    const result = makeEmptyContract().batch([req(EMPTY_QUERY)]);
    expect(result.batchId).not.toBe(result.batchHash);
  });

  it("each result has query, chunkCount, totalCandidates, tiersSearched, chunks fields", () => {
    const result = makeEmptyContract().batch([req(EMPTY_QUERY), req(EMPTY_QUERY)]);
    for (const r of result.results) {
      expect(r).toHaveProperty("query");
      expect(r).toHaveProperty("chunkCount");
      expect(r).toHaveProperty("totalCandidates");
      expect(r).toHaveProperty("tiersSearched");
      expect(r).toHaveProperty("chunks");
    }
  });
});

// --- Tests: determinism ---

describe("RetrievalBatchContract.batch — determinism", () => {
  it("produces same batchHash for identical requests", () => {
    const contractA = makeEmptyContract();
    const contractB = makeEmptyContract();
    expect(
      contractA.batch([req(EMPTY_QUERY), req(EMPTY_QUERY)]).batchHash,
    ).toBe(
      contractB.batch([req(EMPTY_QUERY), req(EMPTY_QUERY)]).batchHash,
    );
  });

  it("produces same batchId for identical requests", () => {
    const contractA = makeEmptyContract();
    const contractB = makeEmptyContract();
    expect(contractA.batch([req(EMPTY_QUERY)]).batchId).toBe(
      contractB.batch([req(EMPTY_QUERY)]).batchId,
    );
  });

  it("produces different batchHash for different batch size", () => {
    const contract = makeEmptyContract();
    const r1 = contract.batch([req(EMPTY_QUERY)]);
    const r2 = contract.batch([req(EMPTY_QUERY), req(EMPTY_QUERY)]);
    expect(r1.batchHash).not.toBe(r2.batchHash);
  });
});
