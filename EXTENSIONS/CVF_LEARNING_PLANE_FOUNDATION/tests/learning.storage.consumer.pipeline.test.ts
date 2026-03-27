import { describe, it, expect } from "vitest";
import {
  LearningStorageConsumerPipelineContract,
  createLearningStorageConsumerPipelineContract,
} from "../src/learning.storage.consumer.pipeline.contract";
import type {
  LearningStorageConsumerPipelineRequest,
  LearningStorageConsumerPipelineResult,
} from "../src/learning.storage.consumer.pipeline.contract";
import {
  LearningStorageConsumerPipelineBatchContract,
  createLearningStorageConsumerPipelineBatchContract,
} from "../src/learning.storage.consumer.pipeline.batch.contract";
import type { LearningRecordType } from "../src/learning.storage.contract";

describe("LearningStorageConsumerPipelineContract (W4-T16 CP1)", () => {
  const fixedNow = "2026-03-27T10:00:00.000Z";
  const mockNow = () => fixedNow;

  // ─── Instantiation ──────────────────────────────────────────────────────────

  it("should instantiate with default dependencies", () => {
    const contract = new LearningStorageConsumerPipelineContract();
    expect(contract).toBeInstanceOf(LearningStorageConsumerPipelineContract);
  });

  it("should instantiate with custom dependencies", () => {
    const contract = new LearningStorageConsumerPipelineContract({
      now: mockNow,
    });
    expect(contract).toBeInstanceOf(LearningStorageConsumerPipelineContract);
  });

  it("should instantiate via factory", () => {
    const contract = createLearningStorageConsumerPipelineContract();
    expect(contract).toBeInstanceOf(LearningStorageConsumerPipelineContract);
  });

  it("should instantiate via factory with dependencies", () => {
    const contract = createLearningStorageConsumerPipelineContract({
      now: mockNow,
    });
    expect(contract).toBeInstanceOf(LearningStorageConsumerPipelineContract);
  });

  // ─── Output Shape ───────────────────────────────────────────────────────────

  it("should return result with all required fields", () => {
    const contract = createLearningStorageConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningStorageConsumerPipelineRequest = {
      artifact: { data: "test" },
      recordType: "FEEDBACK_LEDGER",
    };

    const result: LearningStorageConsumerPipelineResult =
      contract.execute(request);

    expect(result).toHaveProperty("resultId");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("storageRecord");
    expect(result).toHaveProperty("consumerPackage");
    expect(result).toHaveProperty("pipelineHash");
    expect(result).toHaveProperty("warnings");
    expect(result).toHaveProperty("consumerId");
  });

  it("should return storageRecord with correct shape", () => {
    const contract = createLearningStorageConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningStorageConsumerPipelineRequest = {
      artifact: { data: "test" },
      recordType: "TRUTH_MODEL",
    };

    const result = contract.execute(request);

    expect(result.storageRecord).toHaveProperty("recordId");
    expect(result.storageRecord).toHaveProperty("recordType");
    expect(result.storageRecord).toHaveProperty("storedAt");
    expect(result.storageRecord).toHaveProperty("payloadSize");
    expect(result.storageRecord).toHaveProperty("payloadHash");
    expect(result.storageRecord).toHaveProperty("storageHash");
  });

  it("should return consumerPackage with correct shape", () => {
    const contract = createLearningStorageConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningStorageConsumerPipelineRequest = {
      artifact: { data: "test" },
      recordType: "EVALUATION_RESULT",
    };

    const result = contract.execute(request);

    expect(result.consumerPackage).toHaveProperty("packageId");
    expect(result.consumerPackage).toHaveProperty("createdAt");
    expect(result.consumerPackage).toHaveProperty("rankedKnowledgeResult");
    expect(result.consumerPackage).toHaveProperty("typedContextPackage");
    expect(result.consumerPackage).toHaveProperty("pipelineHash");
  });

  // ─── consumerId Propagation ─────────────────────────────────────────────────

  it("should propagate consumerId when provided", () => {
    const contract = createLearningStorageConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningStorageConsumerPipelineRequest = {
      artifact: { data: "test" },
      recordType: "GOVERNANCE_SIGNAL",
      consumerId: "consumer-123",
    };

    const result = contract.execute(request);
    expect(result.consumerId).toBe("consumer-123");
  });

  it("should return undefined consumerId when not provided", () => {
    const contract = createLearningStorageConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningStorageConsumerPipelineRequest = {
      artifact: { data: "test" },
      recordType: "REINJECTION_RESULT",
    };

    const result = contract.execute(request);
    expect(result.consumerId).toBeUndefined();
  });

  // ─── Deterministic Hashing ──────────────────────────────────────────────────

  it("should produce deterministic pipelineHash for same inputs", () => {
    const contract = createLearningStorageConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningStorageConsumerPipelineRequest = {
      artifact: { data: "test" },
      recordType: "LOOP_SUMMARY",
    };

    const result1 = contract.execute(request);
    const result2 = contract.execute(request);

    expect(result1.pipelineHash).toBe(result2.pipelineHash);
  });

  it("should produce different pipelineHash for different artifacts", () => {
    const contract = createLearningStorageConsumerPipelineContract({
      now: mockNow,
    });

    const request1: LearningStorageConsumerPipelineRequest = {
      artifact: { data: "test1" },
      recordType: "FEEDBACK_LEDGER",
    };

    const request2: LearningStorageConsumerPipelineRequest = {
      artifact: { data: "test2" },
      recordType: "FEEDBACK_LEDGER",
    };

    const result1 = contract.execute(request1);
    const result2 = contract.execute(request2);

    expect(result1.pipelineHash).not.toBe(result2.pipelineHash);
  });

  it("should produce different pipelineHash for different recordTypes", () => {
    const contract = createLearningStorageConsumerPipelineContract({
      now: mockNow,
    });

    const request1: LearningStorageConsumerPipelineRequest = {
      artifact: { data: "test" },
      recordType: "TRUTH_MODEL",
    };

    const request2: LearningStorageConsumerPipelineRequest = {
      artifact: { data: "test" },
      recordType: "EVALUATION_RESULT",
    };

    const result1 = contract.execute(request1);
    const result2 = contract.execute(request2);

    expect(result1.pipelineHash).not.toBe(result2.pipelineHash);
  });

  // ─── Query Derivation ───────────────────────────────────────────────────────

  it("should derive query with recordType and payloadSize", () => {
    const contract = createLearningStorageConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningStorageConsumerPipelineRequest = {
      artifact: { data: "test" },
      recordType: "THRESHOLD_ASSESSMENT",
    };

    const result = contract.execute(request);

    // Query is internal, but we can verify it's used via consumerPackage.query
    expect(result.consumerPackage.query).toContain("Storage:");
    expect(result.consumerPackage.query).toContain(
      "THRESHOLD_ASSESSMENT",
    );
    expect(result.consumerPackage.query).toContain("bytes");
  });

  it("should truncate query to 120 characters", () => {
    const contract = createLearningStorageConsumerPipelineContract({
      now: mockNow,
    });

    // Create a large artifact to ensure query would exceed 120 chars
    const largeArtifact = { data: "x".repeat(10000) };

    const request: LearningStorageConsumerPipelineRequest = {
      artifact: largeArtifact,
      recordType: "GOVERNANCE_SIGNAL",
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(
      120,
    );
  });

  // ─── Warning Messages ───────────────────────────────────────────────────────

  it("should emit WARNING_LARGE_PAYLOAD for payloadSize > 10000", () => {
    const contract = createLearningStorageConsumerPipelineContract({
      now: mockNow,
    });

    const largeArtifact = { data: "x".repeat(10000) };

    const request: LearningStorageConsumerPipelineRequest = {
      artifact: largeArtifact,
      recordType: "REINJECTION_RESULT",
    };

    const result = contract.execute(request);

    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("large payload");
    expect(result.warnings[0]).toContain("10KB");
  });

  it("should not emit warning for payloadSize <= 10000", () => {
    const contract = createLearningStorageConsumerPipelineContract({
      now: mockNow,
    });

    const smallArtifact = { data: "x".repeat(100) };

    const request: LearningStorageConsumerPipelineRequest = {
      artifact: smallArtifact,
      recordType: "LOOP_SUMMARY",
    };

    const result = contract.execute(request);

    expect(result.warnings).toHaveLength(0);
  });

  it("should not emit warning for payloadSize exactly 10000", () => {
    const contract = createLearningStorageConsumerPipelineContract({
      now: mockNow,
    });

    // Create artifact that serializes to exactly 10000 bytes
    // JSON.stringify adds quotes and braces, so we need to account for that
    const targetSize = 10000 - '{"data":""}'.length;
    const artifact = { data: "x".repeat(targetSize) };

    const request: LearningStorageConsumerPipelineRequest = {
      artifact,
      recordType: "FEEDBACK_LEDGER",
    };

    const result = contract.execute(request);

    expect(result.storageRecord.payloadSize).toBe(10000);
    expect(result.warnings).toHaveLength(0);
  });

  // ─── storageRecord Propagation ──────────────────────────────────────────────

  it("should propagate recordType to storageRecord", () => {
    const contract = createLearningStorageConsumerPipelineContract({
      now: mockNow,
    });

    const recordTypes: LearningRecordType[] = [
      "FEEDBACK_LEDGER",
      "TRUTH_MODEL",
      "EVALUATION_RESULT",
      "THRESHOLD_ASSESSMENT",
      "GOVERNANCE_SIGNAL",
      "REINJECTION_RESULT",
      "LOOP_SUMMARY",
    ];

    recordTypes.forEach((recordType) => {
      const request: LearningStorageConsumerPipelineRequest = {
        artifact: { data: "test" },
        recordType,
      };

      const result = contract.execute(request);
      expect(result.storageRecord.recordType).toBe(recordType);
    });
  });

  it("should use storageRecord.recordId as contextId", () => {
    const contract = createLearningStorageConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningStorageConsumerPipelineRequest = {
      artifact: { data: "test" },
      recordType: "TRUTH_MODEL",
    };

    const result = contract.execute(request);

    // contextId is internal, but we can verify via consumerPackage.contextId
    expect(result.consumerPackage.contextId).toBe(
      result.storageRecord.recordId,
    );
  });

  // ─── consumerPackage Shape ──────────────────────────────────────────────────

  it("should pass candidateItems to consumer pipeline", () => {
    const contract = createLearningStorageConsumerPipelineContract({
      now: mockNow,
    });

    const candidateItems = [
      { itemId: "item-1", title: "Title 1", content: "content-1", relevanceScore: 0.9, source: "test" },
      { itemId: "item-2", title: "Title 2", content: "content-2", relevanceScore: 0.8, source: "test" },
    ];

    const request: LearningStorageConsumerPipelineRequest = {
      artifact: { data: "test" },
      recordType: "EVALUATION_RESULT",
      candidateItems,
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.rankedKnowledgeResult.items).toHaveLength(2);
  });

  it("should handle empty candidateItems", () => {
    const contract = createLearningStorageConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningStorageConsumerPipelineRequest = {
      artifact: { data: "test" },
      recordType: "THRESHOLD_ASSESSMENT",
      candidateItems: [],
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.rankedKnowledgeResult.items).toHaveLength(0);
  });

  it("should handle undefined candidateItems", () => {
    const contract = createLearningStorageConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningStorageConsumerPipelineRequest = {
      artifact: { data: "test" },
      recordType: "GOVERNANCE_SIGNAL",
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.rankedKnowledgeResult.items).toHaveLength(0);
  });

  // ─── Mixed Record Types ─────────────────────────────────────────────────────

  it("should handle all LearningRecordType values", () => {
    const contract = createLearningStorageConsumerPipelineContract({
      now: mockNow,
    });

    const recordTypes: LearningRecordType[] = [
      "FEEDBACK_LEDGER",
      "TRUTH_MODEL",
      "EVALUATION_RESULT",
      "THRESHOLD_ASSESSMENT",
      "GOVERNANCE_SIGNAL",
      "REINJECTION_RESULT",
      "LOOP_SUMMARY",
    ];

    recordTypes.forEach((recordType) => {
      const request: LearningStorageConsumerPipelineRequest = {
        artifact: { type: recordType, data: "test" },
        recordType,
      };

      const result = contract.execute(request);

      expect(result.resultId).toBeTruthy();
      expect(result.storageRecord.recordType).toBe(recordType);
      expect(result.consumerPackage.packageId).toBeTruthy();
    });
  });
});


// ═══════════════════════════════════════════════════════════════════════════════
// W4-T16 CP2 — LearningStorageConsumerPipelineBatchContract
// ═══════════════════════════════════════════════════════════════════════════════

describe("LearningStorageConsumerPipelineBatchContract (W4-T16 CP2)", () => {
  const fixedNow = "2026-03-27T10:00:00.000Z";
  const mockNow = () => fixedNow;

  // ─── Instantiation ──────────────────────────────────────────────────────────

  it("should instantiate with default dependencies", () => {
    const contract = new LearningStorageConsumerPipelineBatchContract();
    expect(contract).toBeInstanceOf(LearningStorageConsumerPipelineBatchContract);
  });

  it("should instantiate with custom dependencies", () => {
    const contract = new LearningStorageConsumerPipelineBatchContract({
      now: mockNow,
    });
    expect(contract).toBeInstanceOf(LearningStorageConsumerPipelineBatchContract);
  });

  it("should instantiate via factory", () => {
    const contract = createLearningStorageConsumerPipelineBatchContract();
    expect(contract).toBeInstanceOf(LearningStorageConsumerPipelineBatchContract);
  });

  it("should instantiate via factory with dependencies", () => {
    const contract = createLearningStorageConsumerPipelineBatchContract({
      now: mockNow,
    });
    expect(contract).toBeInstanceOf(LearningStorageConsumerPipelineBatchContract);
  });

  // ─── Output Shape ───────────────────────────────────────────────────────────

  it("should return batch result with all required fields", () => {
    const contract = createLearningStorageConsumerPipelineBatchContract({
      now: mockNow,
    });

    const pipelineContract = createLearningStorageConsumerPipelineContract({
      now: mockNow,
    });

    const result1 = pipelineContract.execute({
      artifact: { data: "test1" },
      recordType: "FEEDBACK_LEDGER",
    });

    const batchResult = contract.execute([result1]);

    expect(batchResult).toHaveProperty("batchId");
    expect(batchResult).toHaveProperty("createdAt");
    expect(batchResult).toHaveProperty("totalResults");
    expect(batchResult).toHaveProperty("dominantTokenBudget");
    expect(batchResult).toHaveProperty("totalPayloadSize");
    expect(batchResult).toHaveProperty("recordTypeCounts");
    expect(batchResult).toHaveProperty("batchHash");
  });

  // ─── Empty Batch ────────────────────────────────────────────────────────────

  it("should handle empty batch", () => {
    const contract = createLearningStorageConsumerPipelineBatchContract({
      now: mockNow,
    });

    const batchResult = contract.execute([]);

    expect(batchResult.totalResults).toBe(0);
    expect(batchResult.dominantTokenBudget).toBe(0);
    expect(batchResult.totalPayloadSize).toBe(0);
    expect(batchResult.batchHash).toBeTruthy();
  });

  // ─── totalResults ───────────────────────────────────────────────────────────

  it("should count totalResults correctly", () => {
    const contract = createLearningStorageConsumerPipelineBatchContract({
      now: mockNow,
    });

    const pipelineContract = createLearningStorageConsumerPipelineContract({
      now: mockNow,
    });

    const results = [
      pipelineContract.execute({
        artifact: { data: "test1" },
        recordType: "FEEDBACK_LEDGER",
      }),
      pipelineContract.execute({
        artifact: { data: "test2" },
        recordType: "TRUTH_MODEL",
      }),
      pipelineContract.execute({
        artifact: { data: "test3" },
        recordType: "EVALUATION_RESULT",
      }),
    ];

    const batchResult = contract.execute(results);

    expect(batchResult.totalResults).toBe(3);
  });

  // ─── dominantTokenBudget ────────────────────────────────────────────────────

  it("should calculate dominantTokenBudget as max estimatedTokens", () => {
    const contract = createLearningStorageConsumerPipelineBatchContract({
      now: mockNow,
    });

    const pipelineContract = createLearningStorageConsumerPipelineContract({
      now: mockNow,
    });

    const results = [
      pipelineContract.execute({
        artifact: { data: "small" },
        recordType: "FEEDBACK_LEDGER",
      }),
      pipelineContract.execute({
        artifact: { data: "x".repeat(1000) },
        recordType: "TRUTH_MODEL",
      }),
      pipelineContract.execute({
        artifact: { data: "medium" },
        recordType: "EVALUATION_RESULT",
      }),
    ];

    const batchResult = contract.execute(results);

    const maxTokens = Math.max(
      ...results.map((r) => r.consumerPackage.typedContextPackage.estimatedTokens),
    );

    expect(batchResult.dominantTokenBudget).toBe(maxTokens);
  });

  // ─── totalPayloadSize ───────────────────────────────────────────────────────

  it("should sum totalPayloadSize from all results", () => {
    const contract = createLearningStorageConsumerPipelineBatchContract({
      now: mockNow,
    });

    const pipelineContract = createLearningStorageConsumerPipelineContract({
      now: mockNow,
    });

    const results = [
      pipelineContract.execute({
        artifact: { data: "test1" },
        recordType: "FEEDBACK_LEDGER",
      }),
      pipelineContract.execute({
        artifact: { data: "test2" },
        recordType: "TRUTH_MODEL",
      }),
      pipelineContract.execute({
        artifact: { data: "test3" },
        recordType: "EVALUATION_RESULT",
      }),
    ];

    const batchResult = contract.execute(results);

    const expectedTotal = results.reduce(
      (sum, r) => sum + r.storageRecord.payloadSize,
      0,
    );

    expect(batchResult.totalPayloadSize).toBe(expectedTotal);
  });

  it("should have totalPayloadSize of 0 for empty batch", () => {
    const contract = createLearningStorageConsumerPipelineBatchContract({
      now: mockNow,
    });

    const batchResult = contract.execute([]);

    expect(batchResult.totalPayloadSize).toBe(0);
  });

  // ─── recordTypeCounts ───────────────────────────────────────────────────────

  it("should count recordTypes correctly", () => {
    const contract = createLearningStorageConsumerPipelineBatchContract({
      now: mockNow,
    });

    const pipelineContract = createLearningStorageConsumerPipelineContract({
      now: mockNow,
    });

    const results = [
      pipelineContract.execute({
        artifact: { data: "test1" },
        recordType: "FEEDBACK_LEDGER",
      }),
      pipelineContract.execute({
        artifact: { data: "test2" },
        recordType: "FEEDBACK_LEDGER",
      }),
      pipelineContract.execute({
        artifact: { data: "test3" },
        recordType: "TRUTH_MODEL",
      }),
      pipelineContract.execute({
        artifact: { data: "test4" },
        recordType: "EVALUATION_RESULT",
      }),
    ];

    const batchResult = contract.execute(results);

    expect(batchResult.recordTypeCounts.FEEDBACK_LEDGER).toBe(2);
    expect(batchResult.recordTypeCounts.TRUTH_MODEL).toBe(1);
    expect(batchResult.recordTypeCounts.EVALUATION_RESULT).toBe(1);
    expect(batchResult.recordTypeCounts.THRESHOLD_ASSESSMENT).toBe(0);
    expect(batchResult.recordTypeCounts.GOVERNANCE_SIGNAL).toBe(0);
    expect(batchResult.recordTypeCounts.REINJECTION_RESULT).toBe(0);
    expect(batchResult.recordTypeCounts.LOOP_SUMMARY).toBe(0);
  });

  it("should initialize all recordType counts to 0 for empty batch", () => {
    const contract = createLearningStorageConsumerPipelineBatchContract({
      now: mockNow,
    });

    const batchResult = contract.execute([]);

    expect(batchResult.recordTypeCounts.FEEDBACK_LEDGER).toBe(0);
    expect(batchResult.recordTypeCounts.TRUTH_MODEL).toBe(0);
    expect(batchResult.recordTypeCounts.EVALUATION_RESULT).toBe(0);
    expect(batchResult.recordTypeCounts.THRESHOLD_ASSESSMENT).toBe(0);
    expect(batchResult.recordTypeCounts.GOVERNANCE_SIGNAL).toBe(0);
    expect(batchResult.recordTypeCounts.REINJECTION_RESULT).toBe(0);
    expect(batchResult.recordTypeCounts.LOOP_SUMMARY).toBe(0);
  });

  it("should count all 7 recordTypes", () => {
    const contract = createLearningStorageConsumerPipelineBatchContract({
      now: mockNow,
    });

    const pipelineContract = createLearningStorageConsumerPipelineContract({
      now: mockNow,
    });

    const recordTypes: LearningRecordType[] = [
      "FEEDBACK_LEDGER",
      "TRUTH_MODEL",
      "EVALUATION_RESULT",
      "THRESHOLD_ASSESSMENT",
      "GOVERNANCE_SIGNAL",
      "REINJECTION_RESULT",
      "LOOP_SUMMARY",
    ];

    const results = recordTypes.map((recordType) =>
      pipelineContract.execute({
        artifact: { type: recordType },
        recordType,
      }),
    );

    const batchResult = contract.execute(results);

    expect(batchResult.recordTypeCounts.FEEDBACK_LEDGER).toBe(1);
    expect(batchResult.recordTypeCounts.TRUTH_MODEL).toBe(1);
    expect(batchResult.recordTypeCounts.EVALUATION_RESULT).toBe(1);
    expect(batchResult.recordTypeCounts.THRESHOLD_ASSESSMENT).toBe(1);
    expect(batchResult.recordTypeCounts.GOVERNANCE_SIGNAL).toBe(1);
    expect(batchResult.recordTypeCounts.REINJECTION_RESULT).toBe(1);
    expect(batchResult.recordTypeCounts.LOOP_SUMMARY).toBe(1);
  });

  // ─── Deterministic Hashing ──────────────────────────────────────────────────

  it("should produce deterministic batchHash for same inputs", () => {
    const contract = createLearningStorageConsumerPipelineBatchContract({
      now: mockNow,
    });

    const pipelineContract = createLearningStorageConsumerPipelineContract({
      now: mockNow,
    });

    const results = [
      pipelineContract.execute({
        artifact: { data: "test1" },
        recordType: "FEEDBACK_LEDGER",
      }),
      pipelineContract.execute({
        artifact: { data: "test2" },
        recordType: "TRUTH_MODEL",
      }),
    ];

    const batchResult1 = contract.execute(results);
    const batchResult2 = contract.execute(results);

    expect(batchResult1.batchHash).toBe(batchResult2.batchHash);
  });

  it("should produce different batchHash for different results", () => {
    const contract = createLearningStorageConsumerPipelineBatchContract({
      now: mockNow,
    });

    const pipelineContract = createLearningStorageConsumerPipelineContract({
      now: mockNow,
    });

    const results1 = [
      pipelineContract.execute({
        artifact: { data: "test1" },
        recordType: "FEEDBACK_LEDGER",
      }),
    ];

    const results2 = [
      pipelineContract.execute({
        artifact: { data: "test2" },
        recordType: "TRUTH_MODEL",
      }),
    ];

    const batchResult1 = contract.execute(results1);
    const batchResult2 = contract.execute(results2);

    expect(batchResult1.batchHash).not.toBe(batchResult2.batchHash);
  });

  it("should produce different batchHash for different result counts", () => {
    const contract = createLearningStorageConsumerPipelineBatchContract({
      now: mockNow,
    });

    const pipelineContract = createLearningStorageConsumerPipelineContract({
      now: mockNow,
    });

    const result1 = pipelineContract.execute({
      artifact: { data: "test" },
      recordType: "FEEDBACK_LEDGER",
    });

    const batchResult1 = contract.execute([result1]);
    const batchResult2 = contract.execute([result1, result1]);

    expect(batchResult1.batchHash).not.toBe(batchResult2.batchHash);
  });

  // ─── Mixed Scenarios ────────────────────────────────────────────────────────

  it("should handle single result batch", () => {
    const contract = createLearningStorageConsumerPipelineBatchContract({
      now: mockNow,
    });

    const pipelineContract = createLearningStorageConsumerPipelineContract({
      now: mockNow,
    });

    const result = pipelineContract.execute({
      artifact: { data: "test" },
      recordType: "FEEDBACK_LEDGER",
    });

    const batchResult = contract.execute([result]);

    expect(batchResult.totalResults).toBe(1);
    expect(batchResult.dominantTokenBudget).toBe(
      result.consumerPackage.typedContextPackage.estimatedTokens,
    );
    expect(batchResult.totalPayloadSize).toBe(result.storageRecord.payloadSize);
    expect(batchResult.recordTypeCounts.FEEDBACK_LEDGER).toBe(1);
  });

  it("should handle large batch", () => {
    const contract = createLearningStorageConsumerPipelineBatchContract({
      now: mockNow,
    });

    const pipelineContract = createLearningStorageConsumerPipelineContract({
      now: mockNow,
    });

    const results = Array.from({ length: 100 }, (_, i) =>
      pipelineContract.execute({
        artifact: { data: `test${i}` },
        recordType: "FEEDBACK_LEDGER",
      }),
    );

    const batchResult = contract.execute(results);

    expect(batchResult.totalResults).toBe(100);
    expect(batchResult.recordTypeCounts.FEEDBACK_LEDGER).toBe(100);
  });
});
