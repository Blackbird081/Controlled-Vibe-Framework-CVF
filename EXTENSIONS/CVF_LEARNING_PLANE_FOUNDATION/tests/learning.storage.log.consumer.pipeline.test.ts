import { describe, it, expect } from "vitest";
import {
  LearningStorageLogConsumerPipelineContract,
  createLearningStorageLogConsumerPipelineContract,
} from "../src/learning.storage.log.consumer.pipeline.contract";
import type {
  LearningStorageLogConsumerPipelineRequest,
} from "../src/learning.storage.log.consumer.pipeline.contract";
import {
  LearningStorageLogConsumerPipelineBatchContract,
  createLearningStorageLogConsumerPipelineBatchContract,
} from "../src/learning.storage.log.consumer.pipeline.batch.contract";
import type { LearningStorageRecord, LearningRecordType } from "../src/learning.storage.contract";

describe("LearningStorageLogConsumerPipelineContract (W4-T24 CP1)", () => {
  const fixedNow = "2026-03-27T19:00:00.000Z";
  const mockNow = () => fixedNow;

  const createRecord = (overrides?: Partial<LearningStorageRecord>): LearningStorageRecord => ({
    recordId: `record-${Math.random()}`,
    recordType: "FEEDBACK_LEDGER",
    storedAt: fixedNow,
    payloadSize: 100,
    payloadHash: "hash-123",
    storageHash: "storage-hash-123",
    ...overrides,
  });

  // ─── Instantiation ──────────────────────────────────────────────────────────

  it("should instantiate with default dependencies", () => {
    const contract = new LearningStorageLogConsumerPipelineContract();
    expect(contract).toBeInstanceOf(LearningStorageLogConsumerPipelineContract);
  });

  it("should instantiate with custom dependencies", () => {
    const contract = new LearningStorageLogConsumerPipelineContract({
      now: mockNow,
    });
    expect(contract).toBeInstanceOf(LearningStorageLogConsumerPipelineContract);
  });

  it("should instantiate via factory", () => {
    const contract = createLearningStorageLogConsumerPipelineContract();
    expect(contract).toBeInstanceOf(LearningStorageLogConsumerPipelineContract);
  });

  it("should instantiate via factory with dependencies", () => {
    const contract = createLearningStorageLogConsumerPipelineContract({
      now: mockNow,
    });
    expect(contract).toBeInstanceOf(LearningStorageLogConsumerPipelineContract);
  });

  // ─── Output Shape ───────────────────────────────────────────────────────────

  it("should return result with all required fields", () => {
    const contract = createLearningStorageLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningStorageLogConsumerPipelineRequest = {
      records: [createRecord()],
    };

    const result = contract.execute(request);

    expect(result).toHaveProperty("resultId");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("log");
    expect(result).toHaveProperty("dominantRecordType");
    expect(result).toHaveProperty("consumerPackage");
    expect(result).toHaveProperty("pipelineHash");
    expect(result).toHaveProperty("warnings");
    expect(result).toHaveProperty("consumerId");
  });

  it("should return log with correct record count", () => {
    const contract = createLearningStorageLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningStorageLogConsumerPipelineRequest = {
      records: [
        createRecord({ recordType: "FEEDBACK_LEDGER" }),
        createRecord({ recordType: "TRUTH_MODEL" }),
        createRecord({ recordType: "EVALUATION_RESULT" }),
      ],
    };

    const result = contract.execute(request);

    expect(result.log.totalRecords).toBe(3);
  });

  // ─── consumerId Propagation ─────────────────────────────────────────────────

  it("should propagate consumerId when provided", () => {
    const contract = createLearningStorageLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningStorageLogConsumerPipelineRequest = {
      records: [createRecord()],
      consumerId: "consumer-123",
    };

    const result = contract.execute(request);
    expect(result.consumerId).toBe("consumer-123");
  });

  it("should return undefined consumerId when not provided", () => {
    const contract = createLearningStorageLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningStorageLogConsumerPipelineRequest = {
      records: [createRecord()],
    };

    const result = contract.execute(request);
    expect(result.consumerId).toBeUndefined();
  });

  // ─── Deterministic Hashing ──────────────────────────────────────────────────

  it("should produce deterministic pipelineHash for same inputs", () => {
    const contract = createLearningStorageLogConsumerPipelineContract({
      now: mockNow,
    });

    const records = [createRecord({ recordId: "fixed-id" })];
    const request: LearningStorageLogConsumerPipelineRequest = { records };

    const result1 = contract.execute(request);
    const result2 = contract.execute(request);

    expect(result1.pipelineHash).toBe(result2.pipelineHash);
  });

  // ─── Query Derivation ───────────────────────────────────────────────────────

  it("should derive query with record count and type", () => {
    const contract = createLearningStorageLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningStorageLogConsumerPipelineRequest = {
      records: [createRecord({ recordType: "FEEDBACK_LEDGER" })],
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.query).toContain("StorageLog:");
    expect(result.consumerPackage.query).toContain("1 records");
    expect(result.consumerPackage.query).toContain("type=FEEDBACK_LEDGER");
  });

  it("should truncate query to 120 characters", () => {
    const contract = createLearningStorageLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningStorageLogConsumerPipelineRequest = {
      records: [createRecord()],
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
  });

  // ─── Warning Messages ───────────────────────────────────────────────────────

  it("should emit WARNING_NO_RECORDS when totalRecords is 0", () => {
    const contract = createLearningStorageLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningStorageLogConsumerPipelineRequest = {
      records: [],
    };

    const result = contract.execute(request);

    expect(result.log.totalRecords).toBe(0);
    expect(result.warnings.some((w) => w.includes("no records"))).toBe(true);
  });

  it("should emit WARNING_NO_DOMINANT_TYPE when dominantRecordType is null", () => {
    const contract = createLearningStorageLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningStorageLogConsumerPipelineRequest = {
      records: [],
    };

    const result = contract.execute(request);

    expect(result.dominantRecordType).toBeNull();
    expect(result.warnings.some((w) => w.includes("no dominant type"))).toBe(true);
  });

  it("should not emit warnings for normal log", () => {
    const contract = createLearningStorageLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningStorageLogConsumerPipelineRequest = {
      records: [
        createRecord({ recordType: "FEEDBACK_LEDGER" }),
        createRecord({ recordType: "TRUTH_MODEL" }),
      ],
    };

    const result = contract.execute(request);

    expect(result.log.totalRecords).toBe(2);
    expect(result.warnings).toHaveLength(0);
  });

  // ─── log Propagation ────────────────────────────────────────────────────────

  it("should use log.logId as contextId", () => {
    const contract = createLearningStorageLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningStorageLogConsumerPipelineRequest = {
      records: [createRecord()],
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.contextId).toBe(result.log.logId);
  });

  it("should log records correctly", () => {
    const contract = createLearningStorageLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningStorageLogConsumerPipelineRequest = {
      records: [
        createRecord({ recordType: "FEEDBACK_LEDGER" }),
        createRecord({ recordType: "TRUTH_MODEL" }),
        createRecord({ recordType: "EVALUATION_RESULT" }),
      ],
    };

    const result = contract.execute(request);

    expect(result.log.totalRecords).toBe(3);
  });

  // ─── consumerPackage Shape ──────────────────────────────────────────────────

  it("should pass candidateItems to consumer pipeline", () => {
    const contract = createLearningStorageLogConsumerPipelineContract({
      now: mockNow,
    });

    const candidateItems = [
      { itemId: "item-1", title: "Title 1", content: "content-1", relevanceScore: 0.9, source: "test" },
      { itemId: "item-2", title: "Title 2", content: "content-2", relevanceScore: 0.8, source: "test" },
    ];

    const request: LearningStorageLogConsumerPipelineRequest = {
      records: [createRecord()],
      candidateItems,
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.rankedKnowledgeResult.items).toHaveLength(2);
  });

  it("should handle empty candidateItems", () => {
    const contract = createLearningStorageLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningStorageLogConsumerPipelineRequest = {
      records: [createRecord()],
      candidateItems: [],
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.rankedKnowledgeResult.items).toHaveLength(0);
  });

  it("should handle undefined candidateItems", () => {
    const contract = createLearningStorageLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningStorageLogConsumerPipelineRequest = {
      records: [createRecord()],
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.rankedKnowledgeResult.items).toHaveLength(0);
  });

  // ─── Dominant Record Type Logic ────────────────────────────────────────────

  it("should compute dominant record type as most frequent", () => {
    const contract = createLearningStorageLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningStorageLogConsumerPipelineRequest = {
      records: [
        createRecord({ recordType: "FEEDBACK_LEDGER" }),
        createRecord({ recordType: "FEEDBACK_LEDGER" }),
        createRecord({ recordType: "TRUTH_MODEL" }),
      ],
    };

    const result = contract.execute(request);

    expect(result.dominantRecordType).toBe("FEEDBACK_LEDGER");
  });

  it("should compute dominant record type as null for empty records", () => {
    const contract = createLearningStorageLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningStorageLogConsumerPipelineRequest = {
      records: [],
    };

    const result = contract.execute(request);

    expect(result.dominantRecordType).toBeNull();
  });

  // ─── Large Batch ────────────────────────────────────────────────────────────

  it("should handle large record set", () => {
    const contract = createLearningStorageLogConsumerPipelineContract({
      now: mockNow,
    });

    const records = Array.from({ length: 10 }, () => createRecord({ recordType: "FEEDBACK_LEDGER" }));

    const request: LearningStorageLogConsumerPipelineRequest = { records };
    const result = contract.execute(request);

    expect(result.log.totalRecords).toBe(10);
    expect(result.dominantRecordType).toBe("FEEDBACK_LEDGER");
  });

  // ─── Mixed Record Types ─────────────────────────────────────────────────────

  it("should handle mixed record types", () => {
    const contract = createLearningStorageLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningStorageLogConsumerPipelineRequest = {
      records: [
        createRecord({ recordType: "FEEDBACK_LEDGER" }),
        createRecord({ recordType: "TRUTH_MODEL" }),
        createRecord({ recordType: "EVALUATION_RESULT" }),
        createRecord({ recordType: "THRESHOLD_ASSESSMENT" }),
        createRecord({ recordType: "GOVERNANCE_SIGNAL" }),
      ],
    };

    const result = contract.execute(request);

    expect(result.log.totalRecords).toBe(5);
    expect(result.dominantRecordType).not.toBeNull();
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// W4-T24 CP2 — LearningStorageLogConsumerPipelineBatchContract Tests
// ═══════════════════════════════════════════════════════════════════════════

describe("LearningStorageLogConsumerPipelineBatchContract (W4-T24 CP2)", () => {
  const fixedNow = "2026-03-27T19:00:00.000Z";
  const mockNow = () => fixedNow;

  const createPipelineContract = () =>
    createLearningStorageLogConsumerPipelineContract({ now: mockNow });

  const createRecord = (overrides?: Partial<LearningStorageRecord>): LearningStorageRecord => ({
    recordId: `record-${Math.random()}`,
    recordType: "FEEDBACK_LEDGER",
    storedAt: fixedNow,
    payloadSize: 100,
    payloadHash: "hash-123",
    storageHash: "storage-hash-123",
    ...overrides,
  });

  // ─── Instantiation ──────────────────────────────────────────────────────────

  it("should instantiate with default dependencies", () => {
    const contract = new LearningStorageLogConsumerPipelineBatchContract();
    expect(contract).toBeInstanceOf(LearningStorageLogConsumerPipelineBatchContract);
  });

  it("should instantiate with custom dependencies", () => {
    const contract = new LearningStorageLogConsumerPipelineBatchContract({
      now: mockNow,
    });
    expect(contract).toBeInstanceOf(LearningStorageLogConsumerPipelineBatchContract);
  });

  it("should instantiate via factory", () => {
    const contract = createLearningStorageLogConsumerPipelineBatchContract();
    expect(contract).toBeInstanceOf(LearningStorageLogConsumerPipelineBatchContract);
  });

  it("should instantiate via factory with dependencies", () => {
    const contract = createLearningStorageLogConsumerPipelineBatchContract({
      now: mockNow,
    });
    expect(contract).toBeInstanceOf(LearningStorageLogConsumerPipelineBatchContract);
  });

  // ─── Output Shape ───────────────────────────────────────────────────────────

  it("should return batch result with all required fields", () => {
    const batchContract = createLearningStorageLogConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const result1 = pipelineContract.execute({ records: [createRecord()] });
    const batchResult = batchContract.batch([result1]);

    expect(batchResult).toHaveProperty("batchId");
    expect(batchResult).toHaveProperty("createdAt");
    expect(batchResult).toHaveProperty("totalLogs");
    expect(batchResult).toHaveProperty("totalRecords");
    expect(batchResult).toHaveProperty("overallDominantRecordType");
    expect(batchResult).toHaveProperty("dominantTokenBudget");
    expect(batchResult).toHaveProperty("results");
    expect(batchResult).toHaveProperty("batchHash");
  });

  // ─── Empty Batch ────────────────────────────────────────────────────────────

  it("should handle empty batch", () => {
    const batchContract = createLearningStorageLogConsumerPipelineBatchContract({
      now: mockNow,
    });

    const batchResult = batchContract.batch([]);

    expect(batchResult.totalLogs).toBe(0);
    expect(batchResult.totalRecords).toBe(0);
    expect(batchResult.overallDominantRecordType).toBeNull();
    expect(batchResult.dominantTokenBudget).toBe(0);
    expect(batchResult.results).toHaveLength(0);
  });

  // ─── Aggregation Logic ──────────────────────────────────────────────────────

  it("should aggregate totalLogs correctly", () => {
    const batchContract = createLearningStorageLogConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const result1 = pipelineContract.execute({ records: [createRecord()] });
    const result2 = pipelineContract.execute({ records: [createRecord()] });
    const result3 = pipelineContract.execute({ records: [createRecord()] });

    const batchResult = batchContract.batch([result1, result2, result3]);

    expect(batchResult.totalLogs).toBe(3);
  });

  it("should aggregate totalRecords correctly", () => {
    const batchContract = createLearningStorageLogConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const result1 = pipelineContract.execute({ records: [createRecord(), createRecord()] });
    const result2 = pipelineContract.execute({ records: [createRecord()] });
    const result3 = pipelineContract.execute({ records: [createRecord(), createRecord(), createRecord()] });

    const batchResult = batchContract.batch([result1, result2, result3]);

    expect(batchResult.totalRecords).toBe(6);
  });

  // ─── Overall Dominant Record Type (Frequency-Based) ────────────────────────

  it("should compute overallDominantRecordType as most frequent type", () => {
    const batchContract = createLearningStorageLogConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const result1 = pipelineContract.execute({ records: [createRecord({ recordType: "FEEDBACK_LEDGER" })] });
    const result2 = pipelineContract.execute({ records: [createRecord({ recordType: "FEEDBACK_LEDGER" })] });
    const result3 = pipelineContract.execute({ records: [createRecord({ recordType: "TRUTH_MODEL" })] });

    const batchResult = batchContract.batch([result1, result2, result3]);

    expect(batchResult.overallDominantRecordType).toBe("FEEDBACK_LEDGER");
  });

  it("should compute overallDominantRecordType as null for empty batch", () => {
    const batchContract = createLearningStorageLogConsumerPipelineBatchContract({
      now: mockNow,
    });

    const batchResult = batchContract.batch([]);

    expect(batchResult.overallDominantRecordType).toBeNull();
  });

  // ─── Dominant Token Budget ──────────────────────────────────────────────────

  it("should compute dominantTokenBudget as max estimatedTokens", () => {
    const batchContract = createLearningStorageLogConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const result1 = pipelineContract.execute({ records: [createRecord()] });
    const result2 = pipelineContract.execute({ records: [createRecord(), createRecord()] });
    const result3 = pipelineContract.execute({ records: [createRecord()] });

    const batchResult = batchContract.batch([result1, result2, result3]);

    const maxTokens = Math.max(
      result1.consumerPackage.typedContextPackage.estimatedTokens,
      result2.consumerPackage.typedContextPackage.estimatedTokens,
      result3.consumerPackage.typedContextPackage.estimatedTokens,
    );

    expect(batchResult.dominantTokenBudget).toBe(maxTokens);
  });

  // ─── Deterministic Hashing ──────────────────────────────────────────────────

  it("should produce deterministic batchHash for same inputs", () => {
    const batchContract = createLearningStorageLogConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const result1 = pipelineContract.execute({ records: [createRecord({ recordId: "fixed-1" })] });
    const result2 = pipelineContract.execute({ records: [createRecord({ recordId: "fixed-2" })] });

    const batchResult1 = batchContract.batch([result1, result2]);
    const batchResult2 = batchContract.batch([result1, result2]);

    expect(batchResult1.batchHash).toBe(batchResult2.batchHash);
  });

  it("should produce deterministic batchId for same inputs", () => {
    const batchContract = createLearningStorageLogConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const result1 = pipelineContract.execute({ records: [createRecord({ recordId: "fixed-1" })] });
    const result2 = pipelineContract.execute({ records: [createRecord({ recordId: "fixed-2" })] });

    const batchResult1 = batchContract.batch([result1, result2]);
    const batchResult2 = batchContract.batch([result1, result2]);

    expect(batchResult1.batchId).toBe(batchResult2.batchId);
  });

  // ─── Large Batch ────────────────────────────────────────────────────────────

  it("should handle large batch", () => {
    const batchContract = createLearningStorageLogConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const results = Array.from({ length: 10 }, () =>
      pipelineContract.execute({ records: [createRecord({ recordType: "FEEDBACK_LEDGER" })] }),
    );

    const batchResult = batchContract.batch(results);

    expect(batchResult.totalLogs).toBe(10);
    expect(batchResult.totalRecords).toBe(10);
    expect(batchResult.overallDominantRecordType).toBe("FEEDBACK_LEDGER");
  });

  // ─── Mixed Record Types ─────────────────────────────────────────────────────

  it("should handle mixed record types correctly", () => {
    const batchContract = createLearningStorageLogConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const result1 = pipelineContract.execute({
      records: [createRecord({ recordType: "FEEDBACK_LEDGER" })],
    });
    const result2 = pipelineContract.execute({
      records: [createRecord({ recordType: "TRUTH_MODEL" })],
    });
    const result3 = pipelineContract.execute({
      records: [createRecord({ recordType: "EVALUATION_RESULT" })],
    });

    const batchResult = batchContract.batch([result1, result2, result3]);

    expect(batchResult.totalRecords).toBe(3);
    expect(batchResult.overallDominantRecordType).not.toBeNull();
  });
});
