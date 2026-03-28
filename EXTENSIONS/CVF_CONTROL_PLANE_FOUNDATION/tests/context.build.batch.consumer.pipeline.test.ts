import { describe, it, expect } from "vitest";
import {
  ContextBuildBatchConsumerPipelineContract,
  createContextBuildBatchConsumerPipelineContract,
} from "../src/context.build.batch.consumer.pipeline.contract";
import {
  ContextBuildBatchConsumerPipelineBatchContract,
  createContextBuildBatchConsumerPipelineBatchContract,
} from "../src/context.build.batch.consumer.pipeline.batch.contract";
import type { ContextBuildBatch } from "../src/context.build.batch.contract";

const FIXED_NOW = "2026-03-28T10:00:00.000Z";

// --- Helpers ---

function makeBatch(options: {
  totalPackages?: number;
  totalSegments?: number;
  avgSegmentsPerPackage?: number;
  batchId?: string;
  batchHash?: string;
} = {}): ContextBuildBatch {
  const {
    totalPackages = 3,
    totalSegments = 9,
    avgSegmentsPerPackage = 3,
    batchId = "batch-001",
    batchHash = "hash-batch-001",
  } = options;
  return {
    batchId,
    createdAt: FIXED_NOW,
    totalPackages,
    totalSegments,
    avgSegmentsPerPackage,
    batchHash,
  };
}

const richBatch = makeBatch({ totalPackages: 3, totalSegments: 9, avgSegmentsPerPackage: 3, batchId: "batch-rich", batchHash: "hash-rich" });
const emptyBatch = makeBatch({ totalPackages: 0, totalSegments: 0, avgSegmentsPerPackage: 0, batchId: "batch-empty", batchHash: "hash-empty" });
const noSegmentsBatch = makeBatch({ totalPackages: 2, totalSegments: 0, avgSegmentsPerPackage: 0, batchId: "batch-nosegs", batchHash: "hash-nosegs" });
const singleBatch = makeBatch({ totalPackages: 1, totalSegments: 5, avgSegmentsPerPackage: 5, batchId: "batch-single", batchHash: "hash-single" });

describe("ContextBuildBatchConsumerPipelineContract", () => {
  const contract = new ContextBuildBatchConsumerPipelineContract({ now: () => FIXED_NOW });

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new ContextBuildBatchConsumerPipelineContract()).not.toThrow();
    });

    it("factory returns working instance", () => {
      const c = createContextBuildBatchConsumerPipelineContract();
      expect(c.execute({ contextBuildBatch: richBatch })).toBeDefined();
    });
  });

  describe("output shape", () => {
    const result = contract.execute({ contextBuildBatch: richBatch });

    it("has resultId", () => { expect(typeof result.resultId).toBe("string"); expect(result.resultId.length).toBeGreaterThan(0); });
    it("has createdAt equal to now()", () => { expect(result.createdAt).toBe(FIXED_NOW); });
    it("has contextBuildBatch reference", () => { expect(result.contextBuildBatch).toBe(richBatch); });
    it("has consumerPackage", () => { expect(result.consumerPackage).toBeDefined(); });
    it("has query containing context-build-batch:", () => { expect(result.query).toContain("[context-build-batch]"); });
    it("has contextId", () => { expect(typeof result.contextId).toBe("string"); expect(result.contextId.length).toBeGreaterThan(0); });
    it("has warnings array", () => { expect(Array.isArray(result.warnings)).toBe(true); });
    it("consumerId is undefined when not provided", () => { expect(result.consumerId).toBeUndefined(); });
    it("has pipelineHash", () => { expect(typeof result.pipelineHash).toBe("string"); expect(result.pipelineHash.length).toBeGreaterThan(0); });
    it("resultId differs from pipelineHash", () => { expect(result.resultId).not.toBe(result.pipelineHash); });
  });

  describe("consumerId propagation", () => {
    it("propagates consumerId", () => {
      const r = contract.execute({ contextBuildBatch: richBatch, consumerId: "consumer-a" });
      expect(r.consumerId).toBe("consumer-a");
    });
    it("consumerId undefined when not provided", () => {
      expect(contract.execute({ contextBuildBatch: richBatch }).consumerId).toBeUndefined();
    });
  });

  describe("query derivation", () => {
    it("includes packages count in query", () => {
      expect(contract.execute({ contextBuildBatch: richBatch }).query).toContain("packages:3");
    });
    it("includes segments count in query", () => {
      expect(contract.execute({ contextBuildBatch: richBatch }).query).toContain("segments:9");
    });
    it("includes avg segments in query", () => {
      expect(contract.execute({ contextBuildBatch: richBatch }).query).toContain("avg:3");
    });
    it("empty batch has packages:0 in query", () => {
      expect(contract.execute({ contextBuildBatch: emptyBatch }).query).toContain("packages:0");
    });
    it("query is at most 120 characters", () => {
      const veryLargeBatch = makeBatch({ totalPackages: 999999, totalSegments: 999999, avgSegmentsPerPackage: 999.99 });
      expect(contract.execute({ contextBuildBatch: veryLargeBatch }).query.length).toBeLessThanOrEqual(120);
    });
  });

  describe("contextId extraction", () => {
    it("contextId equals contextBuildBatch.batchId", () => {
      expect(contract.execute({ contextBuildBatch: richBatch }).contextId).toBe("batch-rich");
    });
    it("different batches yield different contextIds", () => {
      const r1 = contract.execute({ contextBuildBatch: richBatch });
      const r2 = contract.execute({ contextBuildBatch: emptyBatch });
      expect(r1.contextId).not.toBe(r2.contextId);
    });
  });

  describe("warnings", () => {
    it("emits no warnings for rich batch", () => {
      expect(contract.execute({ contextBuildBatch: richBatch }).warnings).toHaveLength(0);
    });

    it("emits WARNING_EMPTY_BATCH when totalPackages === 0", () => {
      expect(contract.execute({ contextBuildBatch: emptyBatch }).warnings).toContain("WARNING_EMPTY_BATCH");
    });
    it("does not emit WARNING_NO_SEGMENTS when totalPackages === 0 (covered by empty batch)", () => {
      expect(contract.execute({ contextBuildBatch: emptyBatch }).warnings).not.toContain("WARNING_NO_SEGMENTS");
    });
    it("emits only WARNING_EMPTY_BATCH for empty batch", () => {
      expect(contract.execute({ contextBuildBatch: emptyBatch }).warnings).toHaveLength(1);
    });

    it("emits WARNING_NO_SEGMENTS when segments === 0 and packages > 0", () => {
      expect(contract.execute({ contextBuildBatch: noSegmentsBatch }).warnings).toContain("WARNING_NO_SEGMENTS");
    });
    it("does not emit WARNING_EMPTY_BATCH when packages > 0 but segments === 0", () => {
      expect(contract.execute({ contextBuildBatch: noSegmentsBatch }).warnings).not.toContain("WARNING_EMPTY_BATCH");
    });
    it("emits only WARNING_NO_SEGMENTS for no-segments batch", () => {
      expect(contract.execute({ contextBuildBatch: noSegmentsBatch }).warnings).toHaveLength(1);
    });
  });

  describe("deterministic hashing", () => {
    it("pipelineHash is deterministic", () => {
      const r1 = contract.execute({ contextBuildBatch: richBatch });
      const r2 = contract.execute({ contextBuildBatch: richBatch });
      expect(r1.pipelineHash).toBe(r2.pipelineHash);
    });
    it("resultId is deterministic", () => {
      const r1 = contract.execute({ contextBuildBatch: richBatch });
      const r2 = contract.execute({ contextBuildBatch: richBatch });
      expect(r1.resultId).toBe(r2.resultId);
    });
    it("pipelineHash differs for different batches", () => {
      const r1 = contract.execute({ contextBuildBatch: richBatch });
      const r2 = contract.execute({ contextBuildBatch: emptyBatch });
      expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
    });
  });
});

describe("ContextBuildBatchConsumerPipelineBatchContract", () => {
  const pipelineContract = new ContextBuildBatchConsumerPipelineContract({ now: () => FIXED_NOW });
  const batchContract = new ContextBuildBatchConsumerPipelineBatchContract({ now: () => FIXED_NOW });
  const makeResult = (b: ContextBuildBatch) => pipelineContract.execute({ contextBuildBatch: b });

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new ContextBuildBatchConsumerPipelineBatchContract()).not.toThrow();
    });
    it("factory returns working instance", () => {
      expect(createContextBuildBatchConsumerPipelineBatchContract().batch([])).toBeDefined();
    });
  });

  describe("output shape", () => {
    const batch = batchContract.batch([makeResult(richBatch)]);
    it("has batchId", () => { expect(typeof batch.batchId).toBe("string"); });
    it("has batchHash", () => { expect(typeof batch.batchHash).toBe("string"); });
    it("batchId differs from batchHash", () => { expect(batch.batchId).not.toBe(batch.batchHash); });
    it("has createdAt", () => { expect(batch.createdAt).toBe(FIXED_NOW); });
    it("has totalResults", () => { expect(typeof batch.totalResults).toBe("number"); });
    it("has totalPackages", () => { expect(typeof batch.totalPackages).toBe("number"); });
    it("has totalSegments", () => { expect(typeof batch.totalSegments).toBe("number"); });
    it("has dominantTokenBudget", () => { expect(typeof batch.dominantTokenBudget).toBe("number"); });
    it("has results array", () => { expect(batch.results).toHaveLength(1); });
  });

  describe("aggregation", () => {
    it("calculates totalResults", () => {
      expect(batchContract.batch([makeResult(richBatch), makeResult(emptyBatch)]).totalResults).toBe(2);
    });
    it("calculates totalPackages as sum of contextBuildBatch.totalPackages", () => {
      const b = batchContract.batch([makeResult(richBatch), makeResult(singleBatch)]);
      expect(b.totalPackages).toBe(richBatch.totalPackages + singleBatch.totalPackages);
    });
    it("calculates totalSegments as sum of contextBuildBatch.totalSegments", () => {
      const b = batchContract.batch([makeResult(richBatch), makeResult(singleBatch)]);
      expect(b.totalSegments).toBe(richBatch.totalSegments + singleBatch.totalSegments);
    });
    it("dominantTokenBudget is a number", () => {
      const b = batchContract.batch([makeResult(richBatch)]);
      expect(typeof b.dominantTokenBudget).toBe("number");
    });
    it("handles empty batch", () => {
      const b = batchContract.batch([]);
      expect(b.totalResults).toBe(0);
      expect(b.totalPackages).toBe(0);
      expect(b.totalSegments).toBe(0);
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
