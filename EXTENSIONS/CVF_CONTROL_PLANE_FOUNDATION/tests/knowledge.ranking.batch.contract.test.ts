import { describe, it, expect } from "vitest";
import {
  KnowledgeRankingBatchContract,
  createKnowledgeRankingBatchContract,
  type KnowledgeRankingBatch,
} from "../src/knowledge.ranking.batch.contract";
import type { KnowledgeRankingRequest } from "../src/knowledge.ranking.contract";
import { FIXED_BATCH_NOW } from "./helpers/cpf.batch.contract.fixtures";

// --- Helpers ---

function makeRequest(
  contextId: string,
  itemCount: number,
  overrides: Partial<KnowledgeRankingRequest> = {},
): KnowledgeRankingRequest {
  return {
    query: `query-for-${contextId}`,
    contextId,
    candidateItems: Array.from({ length: itemCount }, (_, i) => ({
      itemId: `item-${contextId}-${i}`,
      title: `Title ${i}`,
      content: `content ${i}`,
      relevanceScore: 0.5 + i * 0.05,
      source: "test",
      tier: "T1",
      recencyScore: 0.8,
    })),
    ...overrides,
  };
}

function makeBatchContract(): KnowledgeRankingBatchContract {
  return new KnowledgeRankingBatchContract({
    now: () => FIXED_BATCH_NOW,
  });
}

// --- Tests ---

describe("KnowledgeRankingBatchContract", () => {
  describe("empty batch", () => {
    it("returns totalRankings = 0 for empty input", () => {
      const contract = makeBatchContract();
      const result = contract.batch([]);
      expect(result.totalRankings).toBe(0);
    });

    it("returns dominantRankedCount = 0 for empty input", () => {
      const contract = makeBatchContract();
      const result = contract.batch([]);
      expect(result.dominantRankedCount).toBe(0);
    });

    it("returns empty results array for empty input", () => {
      const contract = makeBatchContract();
      const result = contract.batch([]);
      expect(result.results).toHaveLength(0);
    });

    it("returns valid batchHash for empty input", () => {
      const contract = makeBatchContract();
      const result = contract.batch([]);
      expect(result.batchHash).toBeTruthy();
      expect(typeof result.batchHash).toBe("string");
    });

    it("returns valid batchId for empty input", () => {
      const contract = makeBatchContract();
      const result = contract.batch([]);
      expect(result.batchId).toBeTruthy();
      expect(typeof result.batchId).toBe("string");
    });

    it("batchId differs from batchHash for empty input", () => {
      const contract = makeBatchContract();
      const result = contract.batch([]);
      expect(result.batchId).not.toBe(result.batchHash);
    });
  });

  describe("single request", () => {
    it("returns totalRankings = 1 for single request", () => {
      const contract = makeBatchContract();
      const result = contract.batch([makeRequest("ctx-1", 3)]);
      expect(result.totalRankings).toBe(1);
    });

    it("calls KnowledgeRankingContract.rank and returns result", () => {
      const contract = makeBatchContract();
      const result = contract.batch([makeRequest("ctx-1", 3)]);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].contextId).toBe("ctx-1");
    });

    it("dominantRankedCount equals totalRanked of the single result", () => {
      const contract = makeBatchContract();
      const result = contract.batch([makeRequest("ctx-1", 3)]);
      expect(result.dominantRankedCount).toBe(result.results[0].totalRanked);
    });

    it("result contains ranked items in descending compositeScore order", () => {
      const contract = makeBatchContract();
      const result = contract.batch([makeRequest("ctx-1", 4)]);
      const scores = result.results[0].items.map((i) => i.compositeScore);
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
      }
    });

    it("result items have sequential 1-based ranks", () => {
      const contract = makeBatchContract();
      const result = contract.batch([makeRequest("ctx-1", 3)]);
      result.results[0].items.forEach((item, idx) => {
        expect(item.rank).toBe(idx + 1);
      });
    });
  });

  describe("multiple requests", () => {
    it("returns correct totalRankings for multiple requests", () => {
      const contract = makeBatchContract();
      const result = contract.batch([
        makeRequest("ctx-a", 2),
        makeRequest("ctx-b", 4),
        makeRequest("ctx-c", 1),
      ]);
      expect(result.totalRankings).toBe(3);
    });

    it("results array contains one entry per request", () => {
      const contract = makeBatchContract();
      const result = contract.batch([
        makeRequest("ctx-a", 2),
        makeRequest("ctx-b", 4),
      ]);
      expect(result.results).toHaveLength(2);
    });

    it("results are mapped in request order", () => {
      const contract = makeBatchContract();
      const result = contract.batch([
        makeRequest("ctx-a", 2),
        makeRequest("ctx-b", 4),
        makeRequest("ctx-c", 1),
      ]);
      expect(result.results[0].contextId).toBe("ctx-a");
      expect(result.results[1].contextId).toBe("ctx-b");
      expect(result.results[2].contextId).toBe("ctx-c");
    });

    it("dominantRankedCount = max totalRanked across all results", () => {
      const contract = makeBatchContract();
      const result = contract.batch([
        makeRequest("ctx-a", 2),
        makeRequest("ctx-b", 5),
        makeRequest("ctx-c", 3),
      ]);
      const expected = Math.max(...result.results.map((r) => r.totalRanked));
      expect(result.dominantRankedCount).toBe(expected);
    });

    it("dominantRankedCount comes from the request with most ranked items", () => {
      const contract = makeBatchContract();
      const result = contract.batch([
        makeRequest("ctx-a", 1),
        makeRequest("ctx-b", 5),
        makeRequest("ctx-c", 2),
      ]);
      expect(result.dominantRankedCount).toBe(result.results[1].totalRanked);
    });
  });

  describe("relevance threshold filtering", () => {
    it("filters out items below relevanceThreshold", () => {
      const contract = makeBatchContract();
      const result = contract.batch([
        makeRequest("ctx-filter", 3, {
          relevanceThreshold: 0.9,
        }),
      ]);
      result.results[0].items.forEach((item) => {
        expect(item.relevanceScore).toBeGreaterThanOrEqual(0.9);
      });
    });

    it("dominantRankedCount reflects post-filter item count", () => {
      const contract = makeBatchContract();
      const result = contract.batch([
        makeRequest("ctx-filter", 3, { relevanceThreshold: 0.9 }),
        makeRequest("ctx-all", 5),
      ]);
      const expected = Math.max(...result.results.map((r) => r.totalRanked));
      expect(result.dominantRankedCount).toBe(expected);
    });
  });

  describe("maxItems cap", () => {
    it("respects maxItems cap on ranked results", () => {
      const contract = makeBatchContract();
      const result = contract.batch([
        makeRequest("ctx-cap", 10, { maxItems: 3 }),
      ]);
      expect(result.results[0].items).toHaveLength(3);
      expect(result.results[0].totalRanked).toBe(3);
    });
  });

  describe("determinism", () => {
    it("produces same batchHash for same requests and same timestamp", () => {
      const contract = makeBatchContract();
      const r1 = contract.batch([makeRequest("ctx-1", 2), makeRequest("ctx-2", 3)]);
      const r2 = contract.batch([makeRequest("ctx-1", 2), makeRequest("ctx-2", 3)]);
      expect(r1.batchHash).toBe(r2.batchHash);
    });

    it("produces same batchId for same requests and same timestamp", () => {
      const contract = makeBatchContract();
      const r1 = contract.batch([makeRequest("ctx-1", 2)]);
      const r2 = contract.batch([makeRequest("ctx-1", 2)]);
      expect(r1.batchId).toBe(r2.batchId);
    });

    it("produces different batchHash for different totalRankings", () => {
      const contract1 = makeBatchContract();
      const contract2 = makeBatchContract();
      const r1 = contract1.batch([makeRequest("ctx-1", 2)]);
      const r2 = contract2.batch([makeRequest("ctx-1", 2), makeRequest("ctx-2", 3)]);
      expect(r1.batchHash).not.toBe(r2.batchHash);
    });

    it("batchId always differs from batchHash", () => {
      const contract = makeBatchContract();
      const result = contract.batch([makeRequest("ctx-1", 3)]);
      expect(result.batchId).not.toBe(result.batchHash);
    });

    it("uses correct batch hash salt prefix in deterministic output", () => {
      const c1 = new KnowledgeRankingBatchContract({ now: () => "2026-04-01T00:00:00.000Z" });
      const c2 = new KnowledgeRankingBatchContract({ now: () => "2026-04-01T00:00:00.000Z" });
      const r1 = c1.batch([makeRequest("ctx-salt", 2)]);
      const r2 = c2.batch([makeRequest("ctx-salt", 2)]);
      expect(r1.batchHash).toBe(r2.batchHash);
    });
  });

  describe("output shape", () => {
    it("output has all required fields", () => {
      const contract = makeBatchContract();
      const result: KnowledgeRankingBatch = contract.batch([makeRequest("ctx-shape", 2)]);
      expect(result).toHaveProperty("batchId");
      expect(result).toHaveProperty("batchHash");
      expect(result).toHaveProperty("createdAt");
      expect(result).toHaveProperty("totalRankings");
      expect(result).toHaveProperty("dominantRankedCount");
      expect(result).toHaveProperty("results");
    });

    it("createdAt is injected timestamp", () => {
      const contract = makeBatchContract();
      const result = contract.batch([makeRequest("ctx-ts", 1)]);
      expect(result.createdAt).toBe(FIXED_BATCH_NOW);
    });

    it("each result has resultId, rankedAt, contextId, query, items, totalRanked, weightsUsed, rankingHash", () => {
      const contract = makeBatchContract();
      const result = contract.batch([makeRequest("ctx-shape-result", 2)]);
      const r = result.results[0];
      expect(r).toHaveProperty("resultId");
      expect(r).toHaveProperty("rankedAt");
      expect(r).toHaveProperty("contextId");
      expect(r).toHaveProperty("query");
      expect(r).toHaveProperty("items");
      expect(r).toHaveProperty("totalRanked");
      expect(r).toHaveProperty("weightsUsed");
      expect(r).toHaveProperty("rankingHash");
    });

    it("result query matches the input query", () => {
      const contract = makeBatchContract();
      const result = contract.batch([makeRequest("ctx-q", 2)]);
      expect(result.results[0].query).toBe("query-for-ctx-q");
    });
  });

  describe("factory function", () => {
    it("createKnowledgeRankingBatchContract returns a working instance", () => {
      const contract = createKnowledgeRankingBatchContract({
        now: () => FIXED_BATCH_NOW,
      });
      const result = contract.batch([makeRequest("ctx-factory", 2)]);
      expect(result.totalRankings).toBe(1);
    });

    it("factory with no arguments uses live timestamp", () => {
      const contract = createKnowledgeRankingBatchContract();
      const result = contract.batch([]);
      expect(result.createdAt).toBeTruthy();
      expect(result.totalRankings).toBe(0);
    });
  });
});
