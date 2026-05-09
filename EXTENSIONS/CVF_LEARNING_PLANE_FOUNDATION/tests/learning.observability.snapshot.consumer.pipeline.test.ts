import { describe, it, expect } from "vitest";
import {
  LearningObservabilitySnapshotConsumerPipelineContract,
  createLearningObservabilitySnapshotConsumerPipelineContract,
} from "../src/learning.observability.snapshot.consumer.pipeline.contract";
import type {
  LearningObservabilitySnapshotConsumerPipelineRequest,
} from "../src/learning.observability.snapshot.consumer.pipeline.contract";
import {
  LearningObservabilitySnapshotConsumerPipelineBatchContract,
  createLearningObservabilitySnapshotConsumerPipelineBatchContract,
} from "../src/learning.observability.snapshot.consumer.pipeline.batch.contract";
import type { LearningObservabilityReport, ObservabilityHealth } from "../src/learning.observability.contract";

describe("LearningObservabilitySnapshotConsumerPipelineContract (W4-T23 CP1)", () => {
  const fixedNow = "2026-03-27T18:00:00.000Z";
  const mockNow = () => fixedNow;

  const createReport = (overrides?: Partial<LearningObservabilityReport>): LearningObservabilityReport => ({
    reportId: `report-${Math.random()}`,
    generatedAt: fixedNow,
    sourceStorageLogId: "storage-log-1",
    sourceLoopSummaryId: "loop-summary-1",
    observabilityHealth: "HEALTHY",
    storageRecordCount: 5,
    loopSignalCount: 5,
    healthRationale: "All metrics healthy",
    reportHash: "hash-123",
    ...overrides,
  });

  // ─── Instantiation ──────────────────────────────────────────────────────────

  it("should instantiate with default dependencies", () => {
    const contract = new LearningObservabilitySnapshotConsumerPipelineContract();
    expect(contract).toBeInstanceOf(LearningObservabilitySnapshotConsumerPipelineContract);
  });

  it("should instantiate with custom dependencies", () => {
    const contract = new LearningObservabilitySnapshotConsumerPipelineContract({
      now: mockNow,
    });
    expect(contract).toBeInstanceOf(LearningObservabilitySnapshotConsumerPipelineContract);
  });

  it("should instantiate via factory", () => {
    const contract = createLearningObservabilitySnapshotConsumerPipelineContract();
    expect(contract).toBeInstanceOf(LearningObservabilitySnapshotConsumerPipelineContract);
  });

  it("should instantiate via factory with dependencies", () => {
    const contract = createLearningObservabilitySnapshotConsumerPipelineContract({
      now: mockNow,
    });
    expect(contract).toBeInstanceOf(LearningObservabilitySnapshotConsumerPipelineContract);
  });

  // ─── Output Shape ───────────────────────────────────────────────────────────

  it("should return result with all required fields", () => {
    const contract = createLearningObservabilitySnapshotConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningObservabilitySnapshotConsumerPipelineRequest = {
      reports: [createReport()],
    };

    const result = contract.execute(request);

    expect(result).toHaveProperty("resultId");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("snapshot");
    expect(result).toHaveProperty("dominantHealth");
    expect(result).toHaveProperty("dominantTrend");
    expect(result).toHaveProperty("consumerPackage");
    expect(result).toHaveProperty("pipelineHash");
    expect(result).toHaveProperty("warnings");
    expect(result).toHaveProperty("consumerId");
  });

  it("should return snapshot with correct report counts", () => {
    const contract = createLearningObservabilitySnapshotConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningObservabilitySnapshotConsumerPipelineRequest = {
      reports: [
        createReport({ observabilityHealth: "HEALTHY" }),
        createReport({ observabilityHealth: "DEGRADED" }),
        createReport({ observabilityHealth: "CRITICAL" }),
      ],
    };

    const result = contract.execute(request);

    expect(result.snapshot.healthyCount).toBe(1);
    expect(result.snapshot.degradedCount).toBe(1);
    expect(result.snapshot.criticalCount).toBe(1);
    expect(result.snapshot.totalReports).toBe(3);
  });

  // ─── consumerId Propagation ─────────────────────────────────────────────────

  it("should propagate consumerId when provided", () => {
    const contract = createLearningObservabilitySnapshotConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningObservabilitySnapshotConsumerPipelineRequest = {
      reports: [createReport()],
      consumerId: "consumer-123",
    };

    const result = contract.execute(request);
    expect(result.consumerId).toBe("consumer-123");
  });

  it("should return undefined consumerId when not provided", () => {
    const contract = createLearningObservabilitySnapshotConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningObservabilitySnapshotConsumerPipelineRequest = {
      reports: [createReport()],
    };

    const result = contract.execute(request);
    expect(result.consumerId).toBeUndefined();
  });

  // ─── Deterministic Hashing ──────────────────────────────────────────────────

  it("should produce deterministic pipelineHash for same inputs", () => {
    const contract = createLearningObservabilitySnapshotConsumerPipelineContract({
      now: mockNow,
    });

    const reports = [createReport({ reportId: "fixed-id" })];
    const request: LearningObservabilitySnapshotConsumerPipelineRequest = { reports };

    const result1 = contract.execute(request);
    const result2 = contract.execute(request);

    expect(result1.pipelineHash).toBe(result2.pipelineHash);
  });

  // ─── Query Derivation ───────────────────────────────────────────────────────

  it("should derive query with report count, health, and trend", () => {
    const contract = createLearningObservabilitySnapshotConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningObservabilitySnapshotConsumerPipelineRequest = {
      reports: [createReport({ observabilityHealth: "HEALTHY" })],
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.query).toContain("ObservabilitySnapshot:");
    expect(result.consumerPackage.query).toContain("1 reports");
    expect(result.consumerPackage.query).toContain("health=HEALTHY");
  });

  it("should truncate query to 120 characters", () => {
    const contract = createLearningObservabilitySnapshotConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningObservabilitySnapshotConsumerPipelineRequest = {
      reports: [createReport()],
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
  });

  // ─── Warning Messages ───────────────────────────────────────────────────────

  it("should emit WARNING_CRITICAL_HEALTH_DOMINANT when dominantHealth is CRITICAL", () => {
    const contract = createLearningObservabilitySnapshotConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningObservabilitySnapshotConsumerPipelineRequest = {
      reports: [createReport({ observabilityHealth: "CRITICAL" })],
    };

    const result = contract.execute(request);

    expect(result.dominantHealth).toBe("CRITICAL");
    expect(result.warnings.some((w) => w.includes("critical health dominant"))).toBe(true);
  });

  it("should emit WARNING_DEGRADING_TREND when trend is DEGRADING", () => {
    const contract = createLearningObservabilitySnapshotConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningObservabilitySnapshotConsumerPipelineRequest = {
      reports: [
        createReport({ observabilityHealth: "HEALTHY" }),
        createReport({ observabilityHealth: "CRITICAL" }),
      ],
    };

    const result = contract.execute(request);

    expect(result.dominantTrend).toBe("DEGRADING");
    expect(result.warnings.some((w) => w.includes("degrading trend"))).toBe(true);
  });

  it("should emit WARNING_NO_REPORTS when totalReports is 0", () => {
    const contract = createLearningObservabilitySnapshotConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningObservabilitySnapshotConsumerPipelineRequest = {
      reports: [],
    };

    const result = contract.execute(request);

    expect(result.snapshot.totalReports).toBe(0);
    expect(result.warnings.some((w) => w.includes("no reports"))).toBe(true);
  });

  it("should not emit warnings for healthy snapshot", () => {
    const contract = createLearningObservabilitySnapshotConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningObservabilitySnapshotConsumerPipelineRequest = {
      reports: [
        createReport({ observabilityHealth: "HEALTHY" }),
        createReport({ observabilityHealth: "HEALTHY" }),
      ],
    };

    const result = contract.execute(request);

    expect(result.dominantHealth).toBe("HEALTHY");
    expect(result.dominantTrend).toBe("STABLE");
    expect(result.warnings).toHaveLength(0);
  });

  // ─── snapshot Propagation ───────────────────────────────────────────────────

  it("should use snapshot.snapshotId as contextId", () => {
    const contract = createLearningObservabilitySnapshotConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningObservabilitySnapshotConsumerPipelineRequest = {
      reports: [createReport()],
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.contextId).toBe(result.snapshot.snapshotId);
  });

  it("should snapshot reports correctly", () => {
    const contract = createLearningObservabilitySnapshotConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningObservabilitySnapshotConsumerPipelineRequest = {
      reports: [
        createReport({ observabilityHealth: "HEALTHY" }),
        createReport({ observabilityHealth: "DEGRADED" }),
        createReport({ observabilityHealth: "CRITICAL" }),
        createReport({ observabilityHealth: "UNKNOWN" }),
      ],
    };

    const result = contract.execute(request);

    expect(result.snapshot.totalReports).toBe(4);
    expect(result.snapshot.healthyCount).toBe(1);
    expect(result.snapshot.degradedCount).toBe(1);
    expect(result.snapshot.criticalCount).toBe(1);
    expect(result.snapshot.unknownCount).toBe(1);
  });

  // ─── consumerPackage Shape ──────────────────────────────────────────────────

  it("should pass candidateItems to consumer pipeline", () => {
    const contract = createLearningObservabilitySnapshotConsumerPipelineContract({
      now: mockNow,
    });

    const candidateItems = [
      { itemId: "item-1", title: "Title 1", content: "content-1", relevanceScore: 0.9, source: "test" },
      { itemId: "item-2", title: "Title 2", content: "content-2", relevanceScore: 0.8, source: "test" },
    ];

    const request: LearningObservabilitySnapshotConsumerPipelineRequest = {
      reports: [createReport()],
      candidateItems,
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.rankedKnowledgeResult.items).toHaveLength(2);
  });

  it("should handle empty candidateItems", () => {
    const contract = createLearningObservabilitySnapshotConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningObservabilitySnapshotConsumerPipelineRequest = {
      reports: [createReport()],
      candidateItems: [],
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.rankedKnowledgeResult.items).toHaveLength(0);
  });

  it("should handle undefined candidateItems", () => {
    const contract = createLearningObservabilitySnapshotConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningObservabilitySnapshotConsumerPipelineRequest = {
      reports: [createReport()],
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.rankedKnowledgeResult.items).toHaveLength(0);
  });

  // ─── Dominant Health Logic ──────────────────────────────────────────────────

  it("should compute dominant health as CRITICAL when present", () => {
    const contract = createLearningObservabilitySnapshotConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningObservabilitySnapshotConsumerPipelineRequest = {
      reports: [
        createReport({ observabilityHealth: "HEALTHY" }),
        createReport({ observabilityHealth: "CRITICAL" }),
        createReport({ observabilityHealth: "DEGRADED" }),
      ],
    };

    const result = contract.execute(request);

    expect(result.dominantHealth).toBe("CRITICAL");
  });

  it("should compute dominant health as DEGRADED when no CRITICAL", () => {
    const contract = createLearningObservabilitySnapshotConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningObservabilitySnapshotConsumerPipelineRequest = {
      reports: [
        createReport({ observabilityHealth: "HEALTHY" }),
        createReport({ observabilityHealth: "DEGRADED" }),
        createReport({ observabilityHealth: "UNKNOWN" }),
      ],
    };

    const result = contract.execute(request);

    expect(result.dominantHealth).toBe("DEGRADED");
  });

  it("should compute dominant health as UNKNOWN when no CRITICAL or DEGRADED", () => {
    const contract = createLearningObservabilitySnapshotConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningObservabilitySnapshotConsumerPipelineRequest = {
      reports: [
        createReport({ observabilityHealth: "HEALTHY" }),
        createReport({ observabilityHealth: "UNKNOWN" }),
      ],
    };

    const result = contract.execute(request);

    expect(result.dominantHealth).toBe("UNKNOWN");
  });

  it("should compute dominant health as HEALTHY when all HEALTHY", () => {
    const contract = createLearningObservabilitySnapshotConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningObservabilitySnapshotConsumerPipelineRequest = {
      reports: [
        createReport({ observabilityHealth: "HEALTHY" }),
        createReport({ observabilityHealth: "HEALTHY" }),
      ],
    };

    const result = contract.execute(request);

    expect(result.dominantHealth).toBe("HEALTHY");
  });

  it("should compute dominant health as UNKNOWN for empty reports", () => {
    const contract = createLearningObservabilitySnapshotConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningObservabilitySnapshotConsumerPipelineRequest = {
      reports: [],
    };

    const result = contract.execute(request);

    expect(result.dominantHealth).toBe("UNKNOWN");
  });

  // ─── Trend Logic ────────────────────────────────────────────────────────────

  it("should compute trend as IMPROVING when health improves", () => {
    const contract = createLearningObservabilitySnapshotConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningObservabilitySnapshotConsumerPipelineRequest = {
      reports: [
        createReport({ observabilityHealth: "CRITICAL" }),
        createReport({ observabilityHealth: "HEALTHY" }),
      ],
    };

    const result = contract.execute(request);

    expect(result.dominantTrend).toBe("IMPROVING");
  });

  it("should compute trend as STABLE when health stays same", () => {
    const contract = createLearningObservabilitySnapshotConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningObservabilitySnapshotConsumerPipelineRequest = {
      reports: [
        createReport({ observabilityHealth: "HEALTHY" }),
        createReport({ observabilityHealth: "HEALTHY" }),
      ],
    };

    const result = contract.execute(request);

    expect(result.dominantTrend).toBe("STABLE");
  });

  it("should compute trend as INSUFFICIENT_DATA for single report", () => {
    const contract = createLearningObservabilitySnapshotConsumerPipelineContract({
      now: mockNow,
    });

    const request: LearningObservabilitySnapshotConsumerPipelineRequest = {
      reports: [createReport({ observabilityHealth: "HEALTHY" })],
    };

    const result = contract.execute(request);

    expect(result.dominantTrend).toBe("INSUFFICIENT_DATA");
  });

  // ─── Large Batch ────────────────────────────────────────────────────────────

  it("should handle large report set", () => {
    const contract = createLearningObservabilitySnapshotConsumerPipelineContract({
      now: mockNow,
    });

    const reports = Array.from({ length: 10 }, () => createReport({ observabilityHealth: "HEALTHY" }));

    const request: LearningObservabilitySnapshotConsumerPipelineRequest = { reports };
    const result = contract.execute(request);

    expect(result.snapshot.totalReports).toBe(10);
    expect(result.snapshot.healthyCount).toBe(10);
    expect(result.dominantHealth).toBe("HEALTHY");
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// W4-T23 CP2 — LearningObservabilitySnapshotConsumerPipelineBatchContract Tests
// ═══════════════════════════════════════════════════════════════════════════

describe("LearningObservabilitySnapshotConsumerPipelineBatchContract (W4-T23 CP2)", () => {
  const fixedNow = "2026-03-27T18:00:00.000Z";
  const mockNow = () => fixedNow;

  const createPipelineContract = () =>
    createLearningObservabilitySnapshotConsumerPipelineContract({ now: mockNow });

  const createReport = (overrides?: Partial<LearningObservabilityReport>): LearningObservabilityReport => ({
    reportId: `report-${Math.random()}`,
    generatedAt: fixedNow,
    sourceStorageLogId: "storage-log-1",
    sourceLoopSummaryId: "loop-summary-1",
    observabilityHealth: "HEALTHY",
    storageRecordCount: 5,
    loopSignalCount: 5,
    healthRationale: "All metrics healthy",
    reportHash: "hash-123",
    ...overrides,
  });

  // ─── Instantiation ──────────────────────────────────────────────────────────

  it("should instantiate with default dependencies", () => {
    const contract = new LearningObservabilitySnapshotConsumerPipelineBatchContract();
    expect(contract).toBeInstanceOf(LearningObservabilitySnapshotConsumerPipelineBatchContract);
  });

  it("should instantiate with custom dependencies", () => {
    const contract = new LearningObservabilitySnapshotConsumerPipelineBatchContract({
      now: mockNow,
    });
    expect(contract).toBeInstanceOf(LearningObservabilitySnapshotConsumerPipelineBatchContract);
  });

  it("should instantiate via factory", () => {
    const contract = createLearningObservabilitySnapshotConsumerPipelineBatchContract();
    expect(contract).toBeInstanceOf(LearningObservabilitySnapshotConsumerPipelineBatchContract);
  });

  it("should instantiate via factory with dependencies", () => {
    const contract = createLearningObservabilitySnapshotConsumerPipelineBatchContract({
      now: mockNow,
    });
    expect(contract).toBeInstanceOf(LearningObservabilitySnapshotConsumerPipelineBatchContract);
  });

  // ─── Output Shape ───────────────────────────────────────────────────────────

  it("should return batch result with all required fields", () => {
    const batchContract = createLearningObservabilitySnapshotConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const result1 = pipelineContract.execute({ reports: [createReport()] });
    const batchResult = batchContract.batch([result1]);

    expect(batchResult).toHaveProperty("batchId");
    expect(batchResult).toHaveProperty("createdAt");
    expect(batchResult).toHaveProperty("totalSnapshots");
    expect(batchResult).toHaveProperty("totalReports");
    expect(batchResult).toHaveProperty("overallDominantHealth");
    expect(batchResult).toHaveProperty("overallDominantTrend");
    expect(batchResult).toHaveProperty("dominantTokenBudget");
    expect(batchResult).toHaveProperty("results");
    expect(batchResult).toHaveProperty("batchHash");
  });

  // ─── Empty Batch ────────────────────────────────────────────────────────────

  it("should handle empty batch", () => {
    const batchContract = createLearningObservabilitySnapshotConsumerPipelineBatchContract({
      now: mockNow,
    });

    const batchResult = batchContract.batch([]);

    expect(batchResult.totalSnapshots).toBe(0);
    expect(batchResult.totalReports).toBe(0);
    expect(batchResult.overallDominantHealth).toBe("UNKNOWN");
    expect(batchResult.overallDominantTrend).toBe("INSUFFICIENT_DATA");
    expect(batchResult.dominantTokenBudget).toBe(0);
    expect(batchResult.results).toHaveLength(0);
  });

  // ─── Aggregation Logic ──────────────────────────────────────────────────────

  it("should aggregate totalSnapshots correctly", () => {
    const batchContract = createLearningObservabilitySnapshotConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const result1 = pipelineContract.execute({ reports: [createReport()] });
    const result2 = pipelineContract.execute({ reports: [createReport()] });
    const result3 = pipelineContract.execute({ reports: [createReport()] });

    const batchResult = batchContract.batch([result1, result2, result3]);

    expect(batchResult.totalSnapshots).toBe(3);
  });

  it("should aggregate totalReports correctly", () => {
    const batchContract = createLearningObservabilitySnapshotConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const result1 = pipelineContract.execute({ reports: [createReport(), createReport()] });
    const result2 = pipelineContract.execute({ reports: [createReport()] });
    const result3 = pipelineContract.execute({ reports: [createReport(), createReport(), createReport()] });

    const batchResult = batchContract.batch([result1, result2, result3]);

    expect(batchResult.totalReports).toBe(6);
  });

  // ─── Overall Dominant Health (Severity-First) ──────────────────────────────

  it("should compute overallDominantHealth as CRITICAL when present", () => {
    const batchContract = createLearningObservabilitySnapshotConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const result1 = pipelineContract.execute({ reports: [createReport({ observabilityHealth: "HEALTHY" })] });
    const result2 = pipelineContract.execute({ reports: [createReport({ observabilityHealth: "CRITICAL" })] });
    const result3 = pipelineContract.execute({ reports: [createReport({ observabilityHealth: "DEGRADED" })] });

    const batchResult = batchContract.batch([result1, result2, result3]);

    expect(batchResult.overallDominantHealth).toBe("CRITICAL");
  });

  it("should compute overallDominantHealth as DEGRADED when no CRITICAL", () => {
    const batchContract = createLearningObservabilitySnapshotConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const result1 = pipelineContract.execute({ reports: [createReport({ observabilityHealth: "HEALTHY" })] });
    const result2 = pipelineContract.execute({ reports: [createReport({ observabilityHealth: "DEGRADED" })] });
    const result3 = pipelineContract.execute({ reports: [createReport({ observabilityHealth: "UNKNOWN" })] });

    const batchResult = batchContract.batch([result1, result2, result3]);

    expect(batchResult.overallDominantHealth).toBe("DEGRADED");
  });

  it("should compute overallDominantHealth as UNKNOWN when no CRITICAL or DEGRADED", () => {
    const batchContract = createLearningObservabilitySnapshotConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const result1 = pipelineContract.execute({ reports: [createReport({ observabilityHealth: "HEALTHY" })] });
    const result2 = pipelineContract.execute({ reports: [createReport({ observabilityHealth: "UNKNOWN" })] });

    const batchResult = batchContract.batch([result1, result2]);

    expect(batchResult.overallDominantHealth).toBe("UNKNOWN");
  });

  it("should compute overallDominantHealth as HEALTHY when all HEALTHY", () => {
    const batchContract = createLearningObservabilitySnapshotConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const result1 = pipelineContract.execute({ reports: [createReport({ observabilityHealth: "HEALTHY" })] });
    const result2 = pipelineContract.execute({ reports: [createReport({ observabilityHealth: "HEALTHY" })] });

    const batchResult = batchContract.batch([result1, result2]);

    expect(batchResult.overallDominantHealth).toBe("HEALTHY");
  });

  // ─── Overall Dominant Trend (Most Concerning) ──────────────────────────────

  it("should compute overallDominantTrend as DEGRADING when present", () => {
    const batchContract = createLearningObservabilitySnapshotConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const result1 = pipelineContract.execute({ reports: [createReport({ observabilityHealth: "HEALTHY" })] });
    const result2 = pipelineContract.execute({
      reports: [
        createReport({ observabilityHealth: "HEALTHY" }),
        createReport({ observabilityHealth: "CRITICAL" }),
      ],
    });

    const batchResult = batchContract.batch([result1, result2]);

    expect(batchResult.overallDominantTrend).toBe("DEGRADING");
  });

  it("should compute overallDominantTrend as INSUFFICIENT_DATA when no DEGRADING", () => {
    const batchContract = createLearningObservabilitySnapshotConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const result1 = pipelineContract.execute({ reports: [createReport({ observabilityHealth: "HEALTHY" })] });
    const result2 = pipelineContract.execute({
      reports: [
        createReport({ observabilityHealth: "HEALTHY" }),
        createReport({ observabilityHealth: "HEALTHY" }),
      ],
    });

    const batchResult = batchContract.batch([result1, result2]);

    expect(batchResult.overallDominantTrend).toBe("INSUFFICIENT_DATA");
  });

  it("should compute overallDominantTrend as STABLE when no DEGRADING or INSUFFICIENT_DATA", () => {
    const batchContract = createLearningObservabilitySnapshotConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const result1 = pipelineContract.execute({
      reports: [
        createReport({ observabilityHealth: "HEALTHY" }),
        createReport({ observabilityHealth: "HEALTHY" }),
      ],
    });
    const result2 = pipelineContract.execute({
      reports: [
        createReport({ observabilityHealth: "DEGRADED" }),
        createReport({ observabilityHealth: "DEGRADED" }),
      ],
    });

    const batchResult = batchContract.batch([result1, result2]);

    expect(batchResult.overallDominantTrend).toBe("STABLE");
  });

  it("should compute overallDominantTrend as IMPROVING when all IMPROVING", () => {
    const batchContract = createLearningObservabilitySnapshotConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const result1 = pipelineContract.execute({
      reports: [
        createReport({ observabilityHealth: "CRITICAL" }),
        createReport({ observabilityHealth: "HEALTHY" }),
      ],
    });
    const result2 = pipelineContract.execute({
      reports: [
        createReport({ observabilityHealth: "DEGRADED" }),
        createReport({ observabilityHealth: "HEALTHY" }),
      ],
    });

    const batchResult = batchContract.batch([result1, result2]);

    expect(batchResult.overallDominantTrend).toBe("IMPROVING");
  });

  // ─── Dominant Token Budget ──────────────────────────────────────────────────

  it("should compute dominantTokenBudget as max estimatedTokens", () => {
    const batchContract = createLearningObservabilitySnapshotConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const result1 = pipelineContract.execute({ reports: [createReport()] });
    const result2 = pipelineContract.execute({ reports: [createReport(), createReport()] });
    const result3 = pipelineContract.execute({ reports: [createReport()] });

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
    const batchContract = createLearningObservabilitySnapshotConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const result1 = pipelineContract.execute({ reports: [createReport({ reportId: "fixed-1" })] });
    const result2 = pipelineContract.execute({ reports: [createReport({ reportId: "fixed-2" })] });

    const batchResult1 = batchContract.batch([result1, result2]);
    const batchResult2 = batchContract.batch([result1, result2]);

    expect(batchResult1.batchHash).toBe(batchResult2.batchHash);
  });

  it("should produce deterministic batchId for same inputs", () => {
    const batchContract = createLearningObservabilitySnapshotConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const result1 = pipelineContract.execute({ reports: [createReport({ reportId: "fixed-1" })] });
    const result2 = pipelineContract.execute({ reports: [createReport({ reportId: "fixed-2" })] });

    const batchResult1 = batchContract.batch([result1, result2]);
    const batchResult2 = batchContract.batch([result1, result2]);

    expect(batchResult1.batchId).toBe(batchResult2.batchId);
  });

  // ─── Large Batch ────────────────────────────────────────────────────────────

  it("should handle large batch", () => {
    const batchContract = createLearningObservabilitySnapshotConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const results = Array.from({ length: 10 }, () =>
      pipelineContract.execute({ reports: [createReport({ observabilityHealth: "HEALTHY" })] }),
    );

    const batchResult = batchContract.batch(results);

    expect(batchResult.totalSnapshots).toBe(10);
    expect(batchResult.totalReports).toBe(10);
    expect(batchResult.overallDominantHealth).toBe("HEALTHY");
  });

  // ─── Mixed Health and Trend ─────────────────────────────────────────────────

  it("should handle mixed health and trend correctly", () => {
    const batchContract = createLearningObservabilitySnapshotConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const result1 = pipelineContract.execute({
      reports: [createReport({ observabilityHealth: "CRITICAL" })],
    });
    const result2 = pipelineContract.execute({
      reports: [createReport({ observabilityHealth: "HEALTHY" })],
    });
    const result3 = pipelineContract.execute({
      reports: [
        createReport({ observabilityHealth: "HEALTHY" }),
        createReport({ observabilityHealth: "CRITICAL" }),
      ],
    });

    const batchResult = batchContract.batch([result1, result2, result3]);

    expect(batchResult.overallDominantHealth).toBe("CRITICAL");
    expect(batchResult.totalReports).toBe(4);
  });
});
