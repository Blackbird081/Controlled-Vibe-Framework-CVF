import { describe, it, expect } from "vitest";
import {
  StructuralIndexBatchContract,
  createStructuralIndexBatchContract,
  type StructuralIndexBatch,
} from "../src/knowledge.structural.index.batch.contract";
import type { StructuralIndexRequest } from "../src/knowledge.structural.index.contract";
import { FIXED_BATCH_NOW } from "./helpers/cpf.batch.contract.fixtures";

// ─── W72-T1 CP1: StructuralIndexBatchContract ────────────────────────────────

function makeRequest(
  contextId: string,
  overrides: Partial<StructuralIndexRequest> = {},
): StructuralIndexRequest {
  return {
    contextId,
    entities: [
      { entityId: "A", label: "Label-A" },
      { entityId: "B", label: "Label-B" },
      { entityId: "C", label: "Label-C" },
    ],
    relations: [
      { fromId: "A", toId: "B", relationType: "depends_on" },
      { fromId: "B", toId: "C", relationType: "related_to" },
    ],
    queryEntityId: "A",
    ...overrides,
  };
}

function makeBatchContract(): StructuralIndexBatchContract {
  return new StructuralIndexBatchContract({ now: () => FIXED_BATCH_NOW });
}

// --- empty batch ---

describe("StructuralIndexBatchContract — empty batch", () => {
  it("returns totalIndexed = 0 for empty input", () => {
    const result = makeBatchContract().batch([]);
    expect(result.totalIndexed).toBe(0);
  });

  it("returns dominantNeighborCount = 0 for empty input", () => {
    const result = makeBatchContract().batch([]);
    expect(result.dominantNeighborCount).toBe(0);
  });

  it("returns empty results array for empty input", () => {
    const result = makeBatchContract().batch([]);
    expect(result.results).toHaveLength(0);
  });

  it("returns valid batchHash for empty input", () => {
    const result = makeBatchContract().batch([]);
    expect(result.batchHash).toBeTruthy();
    expect(typeof result.batchHash).toBe("string");
  });

  it("returns valid batchId for empty input", () => {
    const result = makeBatchContract().batch([]);
    expect(result.batchId).toBeTruthy();
    expect(typeof result.batchId).toBe("string");
  });

  it("batchId differs from batchHash for empty input", () => {
    const result = makeBatchContract().batch([]);
    expect(result.batchId).not.toBe(result.batchHash);
  });
});

// --- single request ---

describe("StructuralIndexBatchContract — single request", () => {
  it("returns totalIndexed = 1 for single request", () => {
    const result = makeBatchContract().batch([makeRequest("ctx-1")]);
    expect(result.totalIndexed).toBe(1);
  });

  it("delegates to StructuralIndexContract and returns result", () => {
    const result = makeBatchContract().batch([makeRequest("ctx-1")]);
    expect(result.results).toHaveLength(1);
    expect(result.results[0].contextId).toBe("ctx-1");
  });

  it("dominantNeighborCount equals neighbors.length of the single result", () => {
    const result = makeBatchContract().batch([makeRequest("ctx-1")]);
    expect(result.dominantNeighborCount).toBe(result.results[0].neighbors.length);
  });

  it("result has correct queryEntityId", () => {
    const result = makeBatchContract().batch([makeRequest("ctx-1")]);
    expect(result.results[0].queryEntityId).toBe("A");
  });
});

// --- multiple requests ---

describe("StructuralIndexBatchContract — multiple requests", () => {
  it("returns correct totalIndexed for multiple requests", () => {
    const result = makeBatchContract().batch([
      makeRequest("ctx-a"),
      makeRequest("ctx-b"),
      makeRequest("ctx-c"),
    ]);
    expect(result.totalIndexed).toBe(3);
  });

  it("results array contains one entry per request", () => {
    const result = makeBatchContract().batch([
      makeRequest("ctx-a"),
      makeRequest("ctx-b"),
    ]);
    expect(result.results).toHaveLength(2);
  });

  it("results are mapped in request order", () => {
    const result = makeBatchContract().batch([
      makeRequest("ctx-a"),
      makeRequest("ctx-b"),
      makeRequest("ctx-c"),
    ]);
    expect(result.results[0].contextId).toBe("ctx-a");
    expect(result.results[1].contextId).toBe("ctx-b");
    expect(result.results[2].contextId).toBe("ctx-c");
  });

  it("dominantNeighborCount = max neighbors.length across all results", () => {
    const result = makeBatchContract().batch([
      makeRequest("ctx-a", { queryEntityId: "A" }),             // 1 neighbor at depth 1
      makeRequest("ctx-b", { queryEntityId: "A", maxDepth: 2 }), // 2 neighbors
      makeRequest("ctx-c", { queryEntityId: "C" }),             // 0 neighbors
    ]);
    const expected = Math.max(...result.results.map((r) => r.neighbors.length));
    expect(result.dominantNeighborCount).toBe(expected);
  });
});

// --- output shape ---

describe("StructuralIndexBatchContract — output shape", () => {
  it("batch result has all required fields", () => {
    const result: StructuralIndexBatch = makeBatchContract().batch([makeRequest("ctx-shape")]);
    expect(result).toHaveProperty("batchId");
    expect(result).toHaveProperty("batchHash");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("totalIndexed");
    expect(result).toHaveProperty("dominantNeighborCount");
    expect(result).toHaveProperty("results");
  });

  it("createdAt is injected timestamp", () => {
    const result = makeBatchContract().batch([makeRequest("ctx-ts")]);
    expect(result.createdAt).toBe(FIXED_BATCH_NOW);
  });

  it("each result has required StructuralIndexResult fields", () => {
    const result = makeBatchContract().batch([makeRequest("ctx-result-shape")]);
    const r = result.results[0];
    expect(r).toHaveProperty("resultId");
    expect(r).toHaveProperty("indexedAt");
    expect(r).toHaveProperty("contextId");
    expect(r).toHaveProperty("queryEntityId");
    expect(r).toHaveProperty("totalEntities");
    expect(r).toHaveProperty("totalRelations");
    expect(r).toHaveProperty("neighbors");
    expect(r).toHaveProperty("indexHash");
  });
});

// --- determinism ---

describe("StructuralIndexBatchContract — determinism", () => {
  it("produces same batchHash for same requests and same timestamp", () => {
    const r1 = makeBatchContract().batch([makeRequest("ctx-1"), makeRequest("ctx-2")]);
    const r2 = makeBatchContract().batch([makeRequest("ctx-1"), makeRequest("ctx-2")]);
    expect(r1.batchHash).toBe(r2.batchHash);
  });

  it("produces same batchId for same requests and same timestamp", () => {
    const r1 = makeBatchContract().batch([makeRequest("ctx-1")]);
    const r2 = makeBatchContract().batch([makeRequest("ctx-1")]);
    expect(r1.batchId).toBe(r2.batchId);
  });

  it("produces different batchHash for different totalIndexed", () => {
    const r1 = makeBatchContract().batch([makeRequest("ctx-1")]);
    const r2 = makeBatchContract().batch([makeRequest("ctx-1"), makeRequest("ctx-2")]);
    expect(r1.batchHash).not.toBe(r2.batchHash);
  });

  it("batchId always differs from batchHash", () => {
    const result = makeBatchContract().batch([makeRequest("ctx-1")]);
    expect(result.batchId).not.toBe(result.batchHash);
  });
});

// --- factory ---

describe("StructuralIndexBatchContract — factory", () => {
  it("createStructuralIndexBatchContract returns a working instance", () => {
    const contract = createStructuralIndexBatchContract({ now: () => FIXED_BATCH_NOW });
    const result = contract.batch([makeRequest("ctx-factory")]);
    expect(result.totalIndexed).toBe(1);
  });

  it("factory with no arguments uses live timestamp", () => {
    const contract = createStructuralIndexBatchContract();
    const result = contract.batch([]);
    expect(result.createdAt).toBeTruthy();
    expect(result.totalIndexed).toBe(0);
  });
});
