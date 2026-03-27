import { describe, it, expect } from "vitest";
import {
  LearningStorageConsumerPipelineContract,
  createLearningStorageConsumerPipelineContract,
} from "../src/learning.storage.consumer.pipeline.contract";
import type {
  LearningStorageConsumerPipelineRequest,
  LearningStorageConsumerPipelineResult,
} from "../src/learning.storage.consumer.pipeline.contract";
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
