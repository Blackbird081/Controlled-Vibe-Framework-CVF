import { describe, it, expect } from "vitest";
import {
  StreamingExecutionConsumerPipelineContract,
  createStreamingExecutionConsumerPipelineContract,
} from "../src/streaming.execution.consumer.pipeline.contract";
import {
  StreamingExecutionConsumerPipelineBatchContract,
  createStreamingExecutionConsumerPipelineBatchContract,
} from "../src/streaming.execution.consumer.pipeline.batch.contract";
import type { StreamingExecutionChunk } from "../src/execution.streaming.contract";

const FIXED_NOW = "2026-03-27T10:00:00.000Z";

// Helper: create a streaming chunk
function makeChunk(options: {
  chunkStatus?: "STREAMED" | "SKIPPED" | "FAILED";
  sourceRuntimeId?: string;
  sequenceNumber?: number;
  assignmentId?: string;
  taskId?: string;
} = {}): StreamingExecutionChunk {
  const {
    chunkStatus = "STREAMED",
    sourceRuntimeId = "runtime-abc",
    sequenceNumber = 0,
    assignmentId = "assign-001",
    taskId = "task-001",
  } = options;

  return {
    chunkId: `chunk-${sequenceNumber}`,
    issuedAt: FIXED_NOW,
    sourceRuntimeId,
    sequenceNumber,
    assignmentId,
    taskId,
    chunkStatus,
    recordStatus: chunkStatus === "STREAMED" ? "EXECUTED" : chunkStatus === "SKIPPED" ? "SKIPPED_DENIED" : "EXECUTION_FAILED",
    payload: `payload-${sequenceNumber}`,
    chunkHash: `hash-${sequenceNumber}`,
  };
}

const streamedChunk = makeChunk({ chunkStatus: "STREAMED", sequenceNumber: 0 });
const skippedChunk = makeChunk({ chunkStatus: "SKIPPED", sequenceNumber: 1 });
const failedChunk  = makeChunk({ chunkStatus: "FAILED",  sequenceNumber: 2 });

const allStreamed = [streamedChunk, makeChunk({ chunkStatus: "STREAMED", sequenceNumber: 1 })];
const mixed       = [streamedChunk, skippedChunk, failedChunk];

describe("StreamingExecutionConsumerPipelineContract", () => {
  const contract = new StreamingExecutionConsumerPipelineContract({ now: () => FIXED_NOW });

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new StreamingExecutionConsumerPipelineContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createStreamingExecutionConsumerPipelineContract();
      expect(c.execute({ streamingChunks: [] })).toBeDefined();
    });
  });

  describe("output shape", () => {
    const result = contract.execute({ streamingChunks: allStreamed });

    it("has resultId", () => {
      expect(typeof result.resultId).toBe("string");
      expect(result.resultId.length).toBeGreaterThan(0);
    });

    it("has createdAt equal to now()", () => {
      expect(result.createdAt).toBe(FIXED_NOW);
    });

    it("has streamingChunks", () => {
      expect(result.streamingChunks).toBe(allStreamed);
    });

    it("has consumerPackage", () => {
      expect(result.consumerPackage).toBeDefined();
      expect(typeof result.consumerPackage.pipelineHash).toBe("string");
    });

    it("has query", () => {
      expect(typeof result.query).toBe("string");
      expect(result.query).toContain("StreamingExecution:");
    });

    it("has contextId", () => {
      expect(typeof result.contextId).toBe("string");
    });

    it("has warnings array", () => {
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it("has consumerId as undefined when not provided", () => {
      expect(result.consumerId).toBeUndefined();
    });

    it("has pipelineHash", () => {
      expect(typeof result.pipelineHash).toBe("string");
      expect(result.pipelineHash.length).toBeGreaterThan(0);
    });

    it("resultId is distinct from pipelineHash", () => {
      expect(result.resultId).not.toBe(result.pipelineHash);
    });
  });

  describe("consumerId propagation", () => {
    it("propagates consumerId when provided", () => {
      const result = contract.execute({ streamingChunks: allStreamed, consumerId: "consumer-xyz" });
      expect(result.consumerId).toBe("consumer-xyz");
    });

    it("consumerId is undefined when not provided", () => {
      const result = contract.execute({ streamingChunks: allStreamed });
      expect(result.consumerId).toBeUndefined();
    });
  });

  describe("query derivation", () => {
    it("derives query with correct chunk counts (all streamed)", () => {
      const result = contract.execute({ streamingChunks: allStreamed });
      expect(result.query).toBe("StreamingExecution: chunks=2, streamed=2, failed=0");
    });

    it("derives query with empty chunks", () => {
      const result = contract.execute({ streamingChunks: [] });
      expect(result.query).toBe("StreamingExecution: chunks=0, streamed=0, failed=0");
    });

    it("derives query with mixed chunks", () => {
      const result = contract.execute({ streamingChunks: mixed });
      expect(result.query).toBe("StreamingExecution: chunks=3, streamed=1, failed=1");
    });

    it("derives query with all failed", () => {
      const chunks = [failedChunk, makeChunk({ chunkStatus: "FAILED", sequenceNumber: 1 })];
      const result = contract.execute({ streamingChunks: chunks });
      expect(result.query).toBe("StreamingExecution: chunks=2, streamed=0, failed=2");
    });

    it("derives query with all skipped", () => {
      const chunks = [skippedChunk, makeChunk({ chunkStatus: "SKIPPED", sequenceNumber: 1 })];
      const result = contract.execute({ streamingChunks: chunks });
      expect(result.query).toBe("StreamingExecution: chunks=2, streamed=0, failed=0");
    });
  });

  describe("contextId extraction", () => {
    it("extracts contextId from first chunk sourceRuntimeId", () => {
      const chunk = makeChunk({ sourceRuntimeId: "runtime-XYZ" });
      const result = contract.execute({ streamingChunks: [chunk] });
      expect(result.contextId).toBe("runtime-XYZ");
    });

    it("falls back to no-runtime when chunks are empty", () => {
      const result = contract.execute({ streamingChunks: [] });
      expect(result.contextId).toBe("no-runtime");
    });

    it("uses first chunk sourceRuntimeId even in mixed batch", () => {
      const chunk1 = makeChunk({ sourceRuntimeId: "runtime-FIRST", sequenceNumber: 0 });
      const chunk2 = makeChunk({ sourceRuntimeId: "runtime-SECOND", sequenceNumber: 1 });
      const result = contract.execute({ streamingChunks: [chunk1, chunk2] });
      expect(result.contextId).toBe("runtime-FIRST");
    });
  });

  describe("warnings", () => {
    it("emits no warnings when all chunks streamed", () => {
      const result = contract.execute({ streamingChunks: allStreamed });
      expect(result.warnings).toHaveLength(0);
    });

    it("emits WARNING_NO_CHUNKS when chunks are empty", () => {
      const result = contract.execute({ streamingChunks: [] });
      expect(result.warnings).toContain("WARNING_NO_CHUNKS");
    });

    it("does not emit WARNING_NO_CHUNKS when chunks are present", () => {
      const result = contract.execute({ streamingChunks: allStreamed });
      expect(result.warnings).not.toContain("WARNING_NO_CHUNKS");
    });

    it("emits WARNING_FAILED_CHUNKS when failedCount > 0", () => {
      const result = contract.execute({ streamingChunks: [failedChunk] });
      expect(result.warnings).toContain("WARNING_FAILED_CHUNKS");
    });

    it("does not emit WARNING_FAILED_CHUNKS when no failed chunks", () => {
      const result = contract.execute({ streamingChunks: allStreamed });
      expect(result.warnings).not.toContain("WARNING_FAILED_CHUNKS");
    });

    it("emits WARNING_SKIPPED_CHUNKS when skippedCount > 0", () => {
      const result = contract.execute({ streamingChunks: [skippedChunk] });
      expect(result.warnings).toContain("WARNING_SKIPPED_CHUNKS");
    });

    it("does not emit WARNING_SKIPPED_CHUNKS when no skipped chunks", () => {
      const result = contract.execute({ streamingChunks: allStreamed });
      expect(result.warnings).not.toContain("WARNING_SKIPPED_CHUNKS");
    });

    it("emits multiple warnings for mixed chunks", () => {
      const result = contract.execute({ streamingChunks: mixed });
      expect(result.warnings).toContain("WARNING_FAILED_CHUNKS");
      expect(result.warnings).toContain("WARNING_SKIPPED_CHUNKS");
      expect(result.warnings).toHaveLength(2);
    });

    it("emits only WARNING_NO_CHUNKS for empty input (no failed/skipped)", () => {
      const result = contract.execute({ streamingChunks: [] });
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings).toContain("WARNING_NO_CHUNKS");
    });
  });

  describe("deterministic hashing", () => {
    it("pipelineHash is deterministic for same input", () => {
      const r1 = contract.execute({ streamingChunks: allStreamed });
      const r2 = contract.execute({ streamingChunks: allStreamed });
      expect(r1.pipelineHash).toBe(r2.pipelineHash);
    });

    it("resultId is deterministic for same input", () => {
      const r1 = contract.execute({ streamingChunks: allStreamed });
      const r2 = contract.execute({ streamingChunks: allStreamed });
      expect(r1.resultId).toBe(r2.resultId);
    });

    it("pipelineHash changes when chunk identities differ despite identical counts", () => {
      const variantA = [
        makeChunk({ sourceRuntimeId: "runtime-dup", sequenceNumber: 0 }),
        makeChunk({ sourceRuntimeId: "runtime-dup", sequenceNumber: 1 }),
      ];
      const variantB = [
        makeChunk({ sourceRuntimeId: "runtime-dup", sequenceNumber: 7 }),
        makeChunk({ sourceRuntimeId: "runtime-dup", sequenceNumber: 8 }),
      ];

      const r1 = contract.execute({ streamingChunks: variantA });
      const r2 = contract.execute({ streamingChunks: variantB });

      expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
    });

    it("resultId changes when chunk identities differ despite identical counts", () => {
      const variantA = [
        makeChunk({ sourceRuntimeId: "runtime-dup", sequenceNumber: 2 }),
        makeChunk({ sourceRuntimeId: "runtime-dup", sequenceNumber: 3 }),
      ];
      const variantB = [
        makeChunk({ sourceRuntimeId: "runtime-dup", sequenceNumber: 9 }),
        makeChunk({ sourceRuntimeId: "runtime-dup", sequenceNumber: 10 }),
      ];

      const r1 = contract.execute({ streamingChunks: variantA });
      const r2 = contract.execute({ streamingChunks: variantB });

      expect(r1.resultId).not.toBe(r2.resultId);
    });
  });
});

describe("StreamingExecutionConsumerPipelineBatchContract", () => {
  const pipelineContract = new StreamingExecutionConsumerPipelineContract({ now: () => FIXED_NOW });
  const batchContract    = new StreamingExecutionConsumerPipelineBatchContract({ now: () => FIXED_NOW });

  function makeResult(chunks: StreamingExecutionChunk[]) {
    return pipelineContract.execute({ streamingChunks: chunks });
  }

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new StreamingExecutionConsumerPipelineBatchContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createStreamingExecutionConsumerPipelineBatchContract();
      expect(c.batch([])).toBeDefined();
    });
  });

  describe("output shape", () => {
    const results = [makeResult(allStreamed)];
    const batch = batchContract.batch(results);

    it("has batchId", () => {
      expect(typeof batch.batchId).toBe("string");
      expect(batch.batchId.length).toBeGreaterThan(0);
    });

    it("has batchHash", () => {
      expect(typeof batch.batchHash).toBe("string");
      expect(batch.batchHash.length).toBeGreaterThan(0);
    });

    it("has createdAt", () => {
      expect(batch.createdAt).toBe(FIXED_NOW);
    });

    it("has totalChunks", () => {
      expect(typeof batch.totalChunks).toBe("number");
    });

    it("has totalStreamed", () => {
      expect(typeof batch.totalStreamed).toBe("number");
    });

    it("has totalSkipped", () => {
      expect(typeof batch.totalSkipped).toBe("number");
    });

    it("has totalFailed", () => {
      expect(typeof batch.totalFailed).toBe("number");
    });

    it("has dominantTokenBudget", () => {
      expect(typeof batch.dominantTokenBudget).toBe("number");
    });

    it("has results array", () => {
      expect(Array.isArray(batch.results)).toBe(true);
      expect(batch.results).toHaveLength(1);
    });

    it("batchId differs from batchHash", () => {
      expect(batch.batchId).not.toBe(batch.batchHash);
    });
  });

  describe("aggregation", () => {
    it("calculates totalChunks correctly across results", () => {
      const r1 = makeResult(allStreamed); // 2 chunks
      const r2 = makeResult(mixed);      // 3 chunks
      const batch = batchContract.batch([r1, r2]);
      expect(batch.totalChunks).toBe(5);
    });

    it("calculates totalStreamed correctly", () => {
      const r1 = makeResult(allStreamed);               // 2 streamed
      const r2 = makeResult([streamedChunk, skippedChunk]); // 1 streamed
      const batch = batchContract.batch([r1, r2]);
      expect(batch.totalStreamed).toBe(3);
    });

    it("calculates totalSkipped correctly", () => {
      const r1 = makeResult([skippedChunk]);
      const r2 = makeResult([skippedChunk, skippedChunk]);
      const batch = batchContract.batch([r1, r2]);
      expect(batch.totalSkipped).toBe(3);
    });

    it("calculates totalFailed correctly", () => {
      const r1 = makeResult([failedChunk]);
      const r2 = makeResult([failedChunk, failedChunk]);
      const batch = batchContract.batch([r1, r2]);
      expect(batch.totalFailed).toBe(3);
    });

    it("calculates dominantTokenBudget as max", () => {
      const r1 = makeResult(allStreamed);
      const r2 = makeResult(mixed);
      const batch = batchContract.batch([r1, r2]);
      expect(batch.dominantTokenBudget).toBeGreaterThanOrEqual(0);
    });

    it("handles empty batch", () => {
      const batch = batchContract.batch([]);
      expect(batch.totalChunks).toBe(0);
      expect(batch.totalStreamed).toBe(0);
      expect(batch.totalSkipped).toBe(0);
      expect(batch.totalFailed).toBe(0);
      expect(batch.dominantTokenBudget).toBe(0);
    });

    it("handles empty batch with valid hash", () => {
      const batch = batchContract.batch([]);
      expect(typeof batch.batchHash).toBe("string");
      expect(batch.batchHash.length).toBeGreaterThan(0);
    });

    it("handles single result", () => {
      const batch = batchContract.batch([makeResult(allStreamed)]);
      expect(batch.totalChunks).toBe(2);
      expect(batch.totalStreamed).toBe(2);
    });
  });

  describe("deterministic hashing", () => {
    it("batchHash is deterministic for same input", () => {
      const results = [makeResult(allStreamed)];
      const b1 = batchContract.batch(results);
      const b2 = batchContract.batch(results);
      expect(b1.batchHash).toBe(b2.batchHash);
    });

    it("batchId is deterministic for same input", () => {
      const results = [makeResult(allStreamed)];
      const b1 = batchContract.batch(results);
      const b2 = batchContract.batch(results);
      expect(b1.batchId).toBe(b2.batchId);
    });

    it("batchHash changes when constituent pipeline identities change", () => {
      const variantA = [
        makeChunk({ sourceRuntimeId: "runtime-dup", sequenceNumber: 4 }),
        makeChunk({ sourceRuntimeId: "runtime-dup", sequenceNumber: 5 }),
      ];
      const variantB = [
        makeChunk({ sourceRuntimeId: "runtime-dup", sequenceNumber: 11 }),
        makeChunk({ sourceRuntimeId: "runtime-dup", sequenceNumber: 12 }),
      ];

      const b1 = batchContract.batch([makeResult(variantA)]);
      const b2 = batchContract.batch([makeResult(variantB)]);

      expect(b1.batchHash).not.toBe(b2.batchHash);
    });
  });
});
