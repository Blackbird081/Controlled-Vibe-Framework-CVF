import { describe, it, expect } from "vitest";
import {
  KnowledgeQueryBatchConsumerPipelineContract,
  createKnowledgeQueryBatchConsumerPipelineContract,
} from "../src/knowledge.query.batch.consumer.pipeline.contract";
import {
  KnowledgeQueryBatchConsumerPipelineBatchContract,
  createKnowledgeQueryBatchConsumerPipelineBatchContract,
} from "../src/knowledge.query.batch.consumer.pipeline.batch.contract";
import type { KnowledgeQueryBatch } from "../src/knowledge.query.batch.contract";

const FIXED_NOW = "2026-03-28T12:00:00.000Z";

// --- Helpers ---

function makeBatch(options: {
  totalQueries?: number;
  totalItemsFound?: number;
  avgItemsPerQuery?: number;
  queriesWithResults?: number;
  emptyQueryCount?: number;
  batchId?: string;
  batchHash?: string;
} = {}): KnowledgeQueryBatch {
  const {
    totalQueries = 4,
    totalItemsFound = 20,
    avgItemsPerQuery = 5,
    queriesWithResults = 4,
    emptyQueryCount = 0,
    batchId = "kqbatch-001",
    batchHash = "hash-kqbatch-001",
  } = options;
  return {
    batchId,
    createdAt: FIXED_NOW,
    totalQueries,
    totalItemsFound,
    avgItemsPerQuery,
    queriesWithResults,
    emptyQueryCount,
    batchHash,
  };
}

const richBatch = makeBatch({ totalQueries: 4, totalItemsFound: 20, queriesWithResults: 4, emptyQueryCount: 0, batchId: "kqb-rich", batchHash: "hash-rich" });
const emptyBatch = makeBatch({ totalQueries: 0, totalItemsFound: 0, avgItemsPerQuery: 0, queriesWithResults: 0, emptyQueryCount: 0, batchId: "kqb-empty", batchHash: "hash-empty" });
const noResultsBatch = makeBatch({ totalQueries: 3, totalItemsFound: 0, avgItemsPerQuery: 0, queriesWithResults: 0, emptyQueryCount: 3, batchId: "kqb-nores", batchHash: "hash-nores" });
const mixedBatch = makeBatch({ totalQueries: 5, totalItemsFound: 10, queriesWithResults: 2, emptyQueryCount: 3, batchId: "kqb-mixed", batchHash: "hash-mixed" });

describe("KnowledgeQueryBatchConsumerPipelineContract", () => {
  const contract = new KnowledgeQueryBatchConsumerPipelineContract({ now: () => FIXED_NOW });

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new KnowledgeQueryBatchConsumerPipelineContract()).not.toThrow();
    });
    it("factory returns working instance", () => {
      const c = createKnowledgeQueryBatchConsumerPipelineContract();
      expect(c.execute({ knowledgeQueryBatch: richBatch })).toBeDefined();
    });
  });

  describe("output shape", () => {
    const result = contract.execute({ knowledgeQueryBatch: richBatch });

    it("has resultId", () => { expect(typeof result.resultId).toBe("string"); expect(result.resultId.length).toBeGreaterThan(0); });
    it("has createdAt equal to now()", () => { expect(result.createdAt).toBe(FIXED_NOW); });
    it("has knowledgeQueryBatch reference", () => { expect(result.knowledgeQueryBatch).toBe(richBatch); });
    it("has consumerPackage", () => { expect(result.consumerPackage).toBeDefined(); });
    it("has query containing knowledge-query-batch:", () => { expect(result.query).toContain("[knowledge-query-batch]"); });
    it("has contextId", () => { expect(typeof result.contextId).toBe("string"); expect(result.contextId.length).toBeGreaterThan(0); });
    it("has warnings array", () => { expect(Array.isArray(result.warnings)).toBe(true); });
    it("consumerId is undefined when not provided", () => { expect(result.consumerId).toBeUndefined(); });
    it("has pipelineHash", () => { expect(typeof result.pipelineHash).toBe("string"); expect(result.pipelineHash.length).toBeGreaterThan(0); });
    it("resultId differs from pipelineHash", () => { expect(result.resultId).not.toBe(result.pipelineHash); });
  });

  describe("consumerId propagation", () => {
    it("propagates consumerId", () => {
      const r = contract.execute({ knowledgeQueryBatch: richBatch, consumerId: "consumer-kq" });
      expect(r.consumerId).toBe("consumer-kq");
    });
    it("consumerId undefined when not provided", () => {
      expect(contract.execute({ knowledgeQueryBatch: richBatch }).consumerId).toBeUndefined();
    });
  });

  describe("query derivation", () => {
    it("includes queries count in query", () => {
      expect(contract.execute({ knowledgeQueryBatch: richBatch }).query).toContain("queries:4");
    });
    it("includes found count in query", () => {
      expect(contract.execute({ knowledgeQueryBatch: richBatch }).query).toContain("found:20");
    });
    it("includes withResults in query", () => {
      expect(contract.execute({ knowledgeQueryBatch: richBatch }).query).toContain("withResults:4");
    });
    it("includes empty count in query", () => {
      expect(contract.execute({ knowledgeQueryBatch: richBatch }).query).toContain("empty:0");
    });
    it("empty batch has queries:0 in query", () => {
      expect(contract.execute({ knowledgeQueryBatch: emptyBatch }).query).toContain("queries:0");
    });
    it("query is at most 120 characters", () => {
      const largeBatch = makeBatch({ totalQueries: 999999, totalItemsFound: 999999, queriesWithResults: 999999, emptyQueryCount: 999999 });
      expect(contract.execute({ knowledgeQueryBatch: largeBatch }).query.length).toBeLessThanOrEqual(120);
    });
  });

  describe("contextId extraction", () => {
    it("contextId equals knowledgeQueryBatch.batchId", () => {
      expect(contract.execute({ knowledgeQueryBatch: richBatch }).contextId).toBe("kqb-rich");
    });
    it("different batches yield different contextIds", () => {
      const r1 = contract.execute({ knowledgeQueryBatch: richBatch });
      const r2 = contract.execute({ knowledgeQueryBatch: emptyBatch });
      expect(r1.contextId).not.toBe(r2.contextId);
    });
  });

  describe("warnings", () => {
    it("emits no warnings for rich batch", () => {
      expect(contract.execute({ knowledgeQueryBatch: richBatch }).warnings).toHaveLength(0);
    });

    it("emits WARNING_EMPTY_BATCH when totalQueries === 0", () => {
      expect(contract.execute({ knowledgeQueryBatch: emptyBatch }).warnings).toContain("WARNING_EMPTY_BATCH");
    });
    it("emits only WARNING_EMPTY_BATCH for empty batch", () => {
      expect(contract.execute({ knowledgeQueryBatch: emptyBatch }).warnings).toHaveLength(1);
    });
    it("does not emit WARNING_NO_RESULTS when totalQueries === 0", () => {
      expect(contract.execute({ knowledgeQueryBatch: emptyBatch }).warnings).not.toContain("WARNING_NO_RESULTS");
    });

    it("emits WARNING_NO_RESULTS when totalItemsFound === 0 and totalQueries > 0", () => {
      expect(contract.execute({ knowledgeQueryBatch: noResultsBatch }).warnings).toContain("WARNING_NO_RESULTS");
    });
    it("does not emit WARNING_EMPTY_BATCH when totalQueries > 0", () => {
      expect(contract.execute({ knowledgeQueryBatch: noResultsBatch }).warnings).not.toContain("WARNING_EMPTY_BATCH");
    });
    it("emits only WARNING_NO_RESULTS for no-results batch", () => {
      expect(contract.execute({ knowledgeQueryBatch: noResultsBatch }).warnings).toHaveLength(1);
    });

    it("emits no warnings for mixed batch with some results", () => {
      expect(contract.execute({ knowledgeQueryBatch: mixedBatch }).warnings).toHaveLength(0);
    });
  });

  describe("deterministic hashing", () => {
    it("pipelineHash is deterministic", () => {
      const r1 = contract.execute({ knowledgeQueryBatch: richBatch });
      const r2 = contract.execute({ knowledgeQueryBatch: richBatch });
      expect(r1.pipelineHash).toBe(r2.pipelineHash);
    });
    it("resultId is deterministic", () => {
      const r1 = contract.execute({ knowledgeQueryBatch: richBatch });
      const r2 = contract.execute({ knowledgeQueryBatch: richBatch });
      expect(r1.resultId).toBe(r2.resultId);
    });
    it("pipelineHash differs for different batches", () => {
      const r1 = contract.execute({ knowledgeQueryBatch: richBatch });
      const r2 = contract.execute({ knowledgeQueryBatch: emptyBatch });
      expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
    });
  });
});

describe("KnowledgeQueryBatchConsumerPipelineBatchContract", () => {
  const pipelineContract = new KnowledgeQueryBatchConsumerPipelineContract({ now: () => FIXED_NOW });
  const batchContract = new KnowledgeQueryBatchConsumerPipelineBatchContract({ now: () => FIXED_NOW });
  const makeResult = (b: KnowledgeQueryBatch) => pipelineContract.execute({ knowledgeQueryBatch: b });

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new KnowledgeQueryBatchConsumerPipelineBatchContract()).not.toThrow();
    });
    it("factory returns working instance", () => {
      expect(createKnowledgeQueryBatchConsumerPipelineBatchContract().batch([])).toBeDefined();
    });
  });

  describe("output shape", () => {
    const batch = batchContract.batch([makeResult(richBatch)]);
    it("has batchId", () => { expect(typeof batch.batchId).toBe("string"); });
    it("has batchHash", () => { expect(typeof batch.batchHash).toBe("string"); });
    it("batchId differs from batchHash", () => { expect(batch.batchId).not.toBe(batch.batchHash); });
    it("has createdAt", () => { expect(batch.createdAt).toBe(FIXED_NOW); });
    it("has totalResults", () => { expect(typeof batch.totalResults).toBe("number"); });
    it("has totalQueries", () => { expect(typeof batch.totalQueries).toBe("number"); });
    it("has totalItemsFound", () => { expect(typeof batch.totalItemsFound).toBe("number"); });
    it("has dominantTokenBudget", () => { expect(typeof batch.dominantTokenBudget).toBe("number"); });
    it("has results array", () => { expect(batch.results).toHaveLength(1); });
  });

  describe("aggregation", () => {
    it("calculates totalResults", () => {
      expect(batchContract.batch([makeResult(richBatch), makeResult(emptyBatch)]).totalResults).toBe(2);
    });
    it("calculates totalQueries as sum of knowledgeQueryBatch.totalQueries", () => {
      const b = batchContract.batch([makeResult(richBatch), makeResult(mixedBatch)]);
      expect(b.totalQueries).toBe(richBatch.totalQueries + mixedBatch.totalQueries);
    });
    it("calculates totalItemsFound as sum of knowledgeQueryBatch.totalItemsFound", () => {
      const b = batchContract.batch([makeResult(richBatch), makeResult(mixedBatch)]);
      expect(b.totalItemsFound).toBe(richBatch.totalItemsFound + mixedBatch.totalItemsFound);
    });
    it("dominantTokenBudget is a number", () => {
      const b = batchContract.batch([makeResult(richBatch)]);
      expect(typeof b.dominantTokenBudget).toBe("number");
    });
    it("handles empty batch", () => {
      const b = batchContract.batch([]);
      expect(b.totalResults).toBe(0);
      expect(b.totalQueries).toBe(0);
      expect(b.totalItemsFound).toBe(0);
      expect(b.dominantTokenBudget).toBe(0);
    });
  });

  describe("deterministic hashing", () => {
    it("batchHash is deterministic", () => {
      const results = [makeResult(richBatch)];
      expect(batchContract.batch(results).batchHash).toBe(batchContract.batch(results).batchHash);
    });
    it("batchId is deterministic", () => {
      const results = [makeResult(richBatch)];
      expect(batchContract.batch(results).batchId).toBe(batchContract.batch(results).batchId);
    });
  });
});
