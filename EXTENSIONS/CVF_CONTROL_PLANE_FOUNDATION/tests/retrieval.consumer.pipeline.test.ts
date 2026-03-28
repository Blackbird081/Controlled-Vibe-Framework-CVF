import { describe, it, expect } from "vitest";
import {
  RetrievalConsumerPipelineContract,
  createRetrievalConsumerPipelineContract,
} from "../src/retrieval.consumer.pipeline.contract";
import {
  RetrievalConsumerPipelineBatchContract,
  createRetrievalConsumerPipelineBatchContract,
} from "../src/retrieval.consumer.pipeline.batch.contract";
import type { RetrievalResultSurface } from "../src/retrieval.contract";

const FIXED_NOW = "2026-03-28T14:00:00.000Z";

// --- Helpers ---

function makeResult(options: {
  query?: string;
  chunkCount?: number;
  totalCandidates?: number;
  retrievalTimeMs?: number;
  tiersSearched?: RetrievalResultSurface["tiersSearched"];
} = {}): RetrievalResultSurface {
  const {
    query = "what is CVF governance?",
    chunkCount = 5,
    totalCandidates = 20,
    retrievalTimeMs = 42,
    tiersSearched = ["T1_DOCTRINE", "T2_POLICY"],
  } = options;
  return {
    query,
    chunkCount,
    totalCandidates,
    retrievalTimeMs,
    tiersSearched,
    chunks: [],
  };
}

const richResult = makeResult({ query: "CVF governance guide", chunkCount: 5, totalCandidates: 20, tiersSearched: ["T1_DOCTRINE", "T2_POLICY"] });
const emptyResult = makeResult({ query: "unknown concept xyz", chunkCount: 0, totalCandidates: 0, tiersSearched: ["T1_DOCTRINE"] });
const noTiersResult = makeResult({ query: "search with no tiers", chunkCount: 3, totalCandidates: 10, tiersSearched: [] });
const noChunksNoTiers = makeResult({ query: "empty no tiers", chunkCount: 0, totalCandidates: 0, tiersSearched: [] });
const largeResult = makeResult({ query: "large query batch", chunkCount: 50, totalCandidates: 200, tiersSearched: ["T3_OPERATIONAL"] });

describe("RetrievalConsumerPipelineContract", () => {
  const contract = new RetrievalConsumerPipelineContract({ now: () => FIXED_NOW });

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new RetrievalConsumerPipelineContract()).not.toThrow();
    });
    it("factory returns working instance", () => {
      const c = createRetrievalConsumerPipelineContract();
      expect(c.execute({ retrievalResult: richResult })).toBeDefined();
    });
  });

  describe("output shape", () => {
    const result = contract.execute({ retrievalResult: richResult });

    it("has resultId", () => { expect(typeof result.resultId).toBe("string"); expect(result.resultId.length).toBeGreaterThan(0); });
    it("has createdAt equal to now()", () => { expect(result.createdAt).toBe(FIXED_NOW); });
    it("has retrievalResult reference", () => { expect(result.retrievalResult).toBe(richResult); });
    it("has consumerPackage", () => { expect(result.consumerPackage).toBeDefined(); });
    it("has query containing [retrieval]", () => { expect(result.query).toContain("[retrieval]"); });
    it("has contextId as non-empty string", () => { expect(typeof result.contextId).toBe("string"); expect(result.contextId.length).toBeGreaterThan(0); });
    it("has warnings array", () => { expect(Array.isArray(result.warnings)).toBe(true); });
    it("consumerId is undefined when not provided", () => { expect(result.consumerId).toBeUndefined(); });
    it("has pipelineHash", () => { expect(typeof result.pipelineHash).toBe("string"); expect(result.pipelineHash.length).toBeGreaterThan(0); });
    it("resultId differs from pipelineHash", () => { expect(result.resultId).not.toBe(result.pipelineHash); });
  });

  describe("consumerId propagation", () => {
    it("propagates consumerId", () => {
      const r = contract.execute({ retrievalResult: richResult, consumerId: "consumer-r" });
      expect(r.consumerId).toBe("consumer-r");
    });
    it("consumerId undefined when not provided", () => {
      expect(contract.execute({ retrievalResult: richResult }).consumerId).toBeUndefined();
    });
  });

  describe("query derivation", () => {
    it("includes [retrieval] prefix", () => {
      expect(contract.execute({ retrievalResult: richResult }).query).toContain("[retrieval]");
    });
    it("includes chunk count in query", () => {
      expect(contract.execute({ retrievalResult: richResult }).query).toContain("chunks:5");
    });
    it("includes candidate count in query", () => {
      expect(contract.execute({ retrievalResult: richResult }).query).toContain("candidates:20");
    });
    it("includes (truncated) source query", () => {
      expect(contract.execute({ retrievalResult: richResult }).query).toContain("CVF governance guide");
    });
    it("query is at most 120 characters", () => {
      const longQuery = makeResult({ query: "a".repeat(200), chunkCount: 999999, totalCandidates: 999999 });
      expect(contract.execute({ retrievalResult: longQuery }).query.length).toBeLessThanOrEqual(120);
    });
    it("query contains 0 chunks for empty result", () => {
      expect(contract.execute({ retrievalResult: emptyResult }).query).toContain("chunks:0");
    });
  });

  describe("contextId derivation", () => {
    it("contextId is deterministic for same input", () => {
      const r1 = contract.execute({ retrievalResult: richResult });
      const r2 = contract.execute({ retrievalResult: richResult });
      expect(r1.contextId).toBe(r2.contextId);
    });
    it("different queries yield different contextIds", () => {
      const r1 = contract.execute({ retrievalResult: richResult });
      const r2 = contract.execute({ retrievalResult: emptyResult });
      expect(r1.contextId).not.toBe(r2.contextId);
    });
  });

  describe("warnings", () => {
    it("emits no warnings for rich result", () => {
      expect(contract.execute({ retrievalResult: richResult }).warnings).toHaveLength(0);
    });

    it("emits WARNING_NO_CHUNKS when chunkCount === 0", () => {
      expect(contract.execute({ retrievalResult: emptyResult }).warnings).toContain("WARNING_NO_CHUNKS");
    });
    it("emits only WARNING_NO_CHUNKS for empty result (tiers searched)", () => {
      expect(contract.execute({ retrievalResult: emptyResult }).warnings).toHaveLength(1);
    });

    it("emits WARNING_NO_TIERS_SEARCHED when tiersSearched is empty", () => {
      expect(contract.execute({ retrievalResult: noTiersResult }).warnings).toContain("WARNING_NO_TIERS_SEARCHED");
    });
    it("does not emit WARNING_NO_CHUNKS when chunks > 0", () => {
      expect(contract.execute({ retrievalResult: noTiersResult }).warnings).not.toContain("WARNING_NO_CHUNKS");
    });
    it("emits only WARNING_NO_TIERS_SEARCHED when chunks > 0 but no tiers", () => {
      expect(contract.execute({ retrievalResult: noTiersResult }).warnings).toHaveLength(1);
    });

    it("emits both warnings when chunks === 0 and tiersSearched empty", () => {
      expect(contract.execute({ retrievalResult: noChunksNoTiers }).warnings).toContain("WARNING_NO_CHUNKS");
      expect(contract.execute({ retrievalResult: noChunksNoTiers }).warnings).toContain("WARNING_NO_TIERS_SEARCHED");
      expect(contract.execute({ retrievalResult: noChunksNoTiers }).warnings).toHaveLength(2);
    });
    it("WARNING_NO_CHUNKS precedes WARNING_NO_TIERS_SEARCHED", () => {
      const r = contract.execute({ retrievalResult: noChunksNoTiers });
      expect(r.warnings[0]).toBe("WARNING_NO_CHUNKS");
      expect(r.warnings[1]).toBe("WARNING_NO_TIERS_SEARCHED");
    });
  });

  describe("deterministic hashing", () => {
    it("pipelineHash is deterministic", () => {
      const r1 = contract.execute({ retrievalResult: richResult });
      const r2 = contract.execute({ retrievalResult: richResult });
      expect(r1.pipelineHash).toBe(r2.pipelineHash);
    });
    it("resultId is deterministic", () => {
      const r1 = contract.execute({ retrievalResult: richResult });
      const r2 = contract.execute({ retrievalResult: richResult });
      expect(r1.resultId).toBe(r2.resultId);
    });
    it("pipelineHash differs for different retrieval results", () => {
      const r1 = contract.execute({ retrievalResult: richResult });
      const r2 = contract.execute({ retrievalResult: emptyResult });
      expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
    });
  });
});

describe("RetrievalConsumerPipelineBatchContract", () => {
  const pipelineContract = new RetrievalConsumerPipelineContract({ now: () => FIXED_NOW });
  const batchContract = new RetrievalConsumerPipelineBatchContract({ now: () => FIXED_NOW });
  const makeR = (r: RetrievalResultSurface) => pipelineContract.execute({ retrievalResult: r });

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new RetrievalConsumerPipelineBatchContract()).not.toThrow();
    });
    it("factory returns working instance", () => {
      expect(createRetrievalConsumerPipelineBatchContract().batch([])).toBeDefined();
    });
  });

  describe("output shape", () => {
    const batch = batchContract.batch([makeR(richResult)]);
    it("has batchId", () => { expect(typeof batch.batchId).toBe("string"); });
    it("has batchHash", () => { expect(typeof batch.batchHash).toBe("string"); });
    it("batchId differs from batchHash", () => { expect(batch.batchId).not.toBe(batch.batchHash); });
    it("has createdAt", () => { expect(batch.createdAt).toBe(FIXED_NOW); });
    it("has totalResults", () => { expect(typeof batch.totalResults).toBe("number"); });
    it("has totalChunks", () => { expect(typeof batch.totalChunks).toBe("number"); });
    it("has totalCandidates", () => { expect(typeof batch.totalCandidates).toBe("number"); });
    it("has dominantTokenBudget", () => { expect(typeof batch.dominantTokenBudget).toBe("number"); });
    it("has results array", () => { expect(batch.results).toHaveLength(1); });
  });

  describe("aggregation", () => {
    it("calculates totalResults", () => {
      expect(batchContract.batch([makeR(richResult), makeR(emptyResult)]).totalResults).toBe(2);
    });
    it("calculates totalChunks as sum of chunkCount", () => {
      const b = batchContract.batch([makeR(richResult), makeR(largeResult)]);
      expect(b.totalChunks).toBe(richResult.chunkCount + largeResult.chunkCount);
    });
    it("calculates totalCandidates as sum of totalCandidates", () => {
      const b = batchContract.batch([makeR(richResult), makeR(largeResult)]);
      expect(b.totalCandidates).toBe(richResult.totalCandidates + largeResult.totalCandidates);
    });
    it("dominantTokenBudget is a number", () => {
      expect(typeof batchContract.batch([makeR(richResult)]).dominantTokenBudget).toBe("number");
    });
    it("handles empty batch", () => {
      const b = batchContract.batch([]);
      expect(b.totalResults).toBe(0);
      expect(b.totalChunks).toBe(0);
      expect(b.totalCandidates).toBe(0);
      expect(b.dominantTokenBudget).toBe(0);
    });
  });

  describe("deterministic hashing", () => {
    it("batchHash is deterministic", () => {
      const results = [makeR(richResult)];
      expect(batchContract.batch(results).batchHash).toBe(batchContract.batch(results).batchHash);
    });
    it("batchId is deterministic", () => {
      const results = [makeR(richResult)];
      expect(batchContract.batch(results).batchId).toBe(batchContract.batch(results).batchId);
    });
  });
});
