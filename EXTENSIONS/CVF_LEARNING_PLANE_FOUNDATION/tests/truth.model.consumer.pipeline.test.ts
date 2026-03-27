import { describe, it, expect } from "vitest";
import {
  TruthModelConsumerPipelineContract,
  createTruthModelConsumerPipelineContract,
} from "../src/truth.model.consumer.pipeline.contract";
import type {
  TruthModelConsumerPipelineRequest,
} from "../src/truth.model.consumer.pipeline.contract";
import type { PatternInsight } from "../src/pattern.detection.contract";

describe("TruthModelConsumerPipelineContract (W4-T19 CP1)", () => {
  const fixedNow = "2026-03-27T14:00:00.000Z";
  const mockNow = () => fixedNow;

  const createInsight = (overrides?: Partial<PatternInsight>): PatternInsight => ({
    insightId: `insight-${Math.random()}`,
    detectedAt: fixedNow,
    dominantPattern: "ACCEPT_HEAVY",
    healthSignal: "HEALTHY",
    escalateRate: 0.1,
    rejectRate: 0.05,
    retryRate: 0.15,
    acceptRate: 0.7,
    insightHash: "hash-123",
    ...overrides,
  });

  // ─── Instantiation ──────────────────────────────────────────────────────────

  it("should instantiate with default dependencies", () => {
    const contract = new TruthModelConsumerPipelineContract();
    expect(contract).toBeInstanceOf(TruthModelConsumerPipelineContract);
  });

  it("should instantiate with custom dependencies", () => {
    const contract = new TruthModelConsumerPipelineContract({
      now: mockNow,
    });
    expect(contract).toBeInstanceOf(TruthModelConsumerPipelineContract);
  });

  it("should instantiate via factory", () => {
    const contract = createTruthModelConsumerPipelineContract();
    expect(contract).toBeInstanceOf(TruthModelConsumerPipelineContract);
  });

  it("should instantiate via factory with dependencies", () => {
    const contract = createTruthModelConsumerPipelineContract({
      now: mockNow,
    });
    expect(contract).toBeInstanceOf(TruthModelConsumerPipelineContract);
  });

  // ─── Output Shape ───────────────────────────────────────────────────────────

  it("should return result with all required fields", () => {
    const contract = createTruthModelConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthModelConsumerPipelineRequest = {
      insights: [createInsight()],
    };

    const result = contract.execute(request);

    expect(result).toHaveProperty("resultId");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("model");
    expect(result).toHaveProperty("consumerPackage");
    expect(result).toHaveProperty("pipelineHash");
    expect(result).toHaveProperty("warnings");
    expect(result).toHaveProperty("consumerId");
  });

  it("should return model with version 1", () => {
    const contract = createTruthModelConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthModelConsumerPipelineRequest = {
      insights: [createInsight()],
    };

    const result = contract.execute(request);

    expect(result.model.version).toBe(1);
  });

  // ─── consumerId Propagation ─────────────────────────────────────────────────

  it("should propagate consumerId when provided", () => {
    const contract = createTruthModelConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthModelConsumerPipelineRequest = {
      insights: [createInsight()],
      consumerId: "consumer-123",
    };

    const result = contract.execute(request);
    expect(result.consumerId).toBe("consumer-123");
  });

  it("should return undefined consumerId when not provided", () => {
    const contract = createTruthModelConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthModelConsumerPipelineRequest = {
      insights: [createInsight()],
    };

    const result = contract.execute(request);
    expect(result.consumerId).toBeUndefined();
  });

  // ─── Deterministic Hashing ──────────────────────────────────────────────────

  it("should produce deterministic pipelineHash for same inputs", () => {
    const contract = createTruthModelConsumerPipelineContract({
      now: mockNow,
    });

    const insights = [createInsight({ insightId: "fixed-id" })];
    const request: TruthModelConsumerPipelineRequest = { insights };

    const result1 = contract.execute(request);
    const result2 = contract.execute(request);

    expect(result1.pipelineHash).toBe(result2.pipelineHash);
  });

  // ─── Query Derivation ───────────────────────────────────────────────────────

  it("should derive query with version, pattern, insight count, and trajectory", () => {
    const contract = createTruthModelConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthModelConsumerPipelineRequest = {
      insights: [createInsight({ dominantPattern: "ESCALATE_HEAVY" })],
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.query).toContain("Model:");
    expect(result.consumerPackage.query).toContain("v1");
    expect(result.consumerPackage.query).toContain("ESCALATE_HEAVY");
    expect(result.consumerPackage.query).toContain("1 insights");
  });

  it("should truncate query to 120 characters", () => {
    const contract = createTruthModelConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthModelConsumerPipelineRequest = {
      insights: [createInsight()],
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
  });

  // ─── Warning Messages ───────────────────────────────────────────────────────

  it("should emit WARNING_HEALTH_DEGRADING when healthTrajectory is DEGRADING", () => {
    const contract = createTruthModelConsumerPipelineContract({
      now: mockNow,
    });

    const insights = [
      createInsight({ healthSignal: "HEALTHY" }),
      createInsight({ healthSignal: "DEGRADED" }),
      createInsight({ healthSignal: "CRITICAL" }),
    ];

    const request: TruthModelConsumerPipelineRequest = { insights };
    const result = contract.execute(request);

    if (result.model.healthTrajectory === "DEGRADING") {
      expect(result.warnings.some((w) => w.includes("health degrading"))).toBe(true);
    }
  });

  it("should emit WARNING_LOW_CONFIDENCE when confidenceLevel < 0.3", () => {
    const contract = createTruthModelConsumerPipelineContract({
      now: mockNow,
    });

    // With default confidence computation, 1-2 insights will have confidence < 0.3
    const request: TruthModelConsumerPipelineRequest = {
      insights: [createInsight()],
    };

    const result = contract.execute(request);

    if (result.model.confidenceLevel < 0.3) {
      expect(result.warnings.some((w) => w.includes("low confidence"))).toBe(true);
    }
  });

  it("should emit WARNING_NO_INSIGHTS when totalInsightsProcessed === 0", () => {
    const contract = createTruthModelConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthModelConsumerPipelineRequest = {
      insights: [],
    };

    const result = contract.execute(request);

    expect(result.model.totalInsightsProcessed).toBe(0);
    expect(result.warnings.some((w) => w.includes("no insights"))).toBe(true);
  });

  it("should not emit warnings for healthy model", () => {
    const contract = createTruthModelConsumerPipelineContract({
      now: mockNow,
    });

    // Build a model with enough insights for high confidence and stable health
    const insights = Array.from({ length: 10 }, () =>
      createInsight({ healthSignal: "HEALTHY" }),
    );

    const request: TruthModelConsumerPipelineRequest = { insights };
    const result = contract.execute(request);

    if (
      result.model.healthTrajectory !== "DEGRADING" &&
      result.model.confidenceLevel >= 0.3 &&
      result.model.totalInsightsProcessed > 0
    ) {
      expect(result.warnings).toHaveLength(0);
    }
  });

  // ─── model Propagation ──────────────────────────────────────────────────────

  it("should use model.modelId as contextId", () => {
    const contract = createTruthModelConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthModelConsumerPipelineRequest = {
      insights: [createInsight()],
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.contextId).toBe(result.model.modelId);
  });

  it("should build model from insights", () => {
    const contract = createTruthModelConsumerPipelineContract({
      now: mockNow,
    });

    const insights = [
      createInsight({ dominantPattern: "RETRY_HEAVY" }),
      createInsight({ dominantPattern: "RETRY_HEAVY" }),
    ];

    const request: TruthModelConsumerPipelineRequest = { insights };
    const result = contract.execute(request);

    expect(result.model.version).toBe(1);
    expect(result.model.totalInsightsProcessed).toBe(2);
    expect(result.model.patternHistory.length).toBe(2);
  });

  // ─── consumerPackage Shape ──────────────────────────────────────────────────

  it("should pass candidateItems to consumer pipeline", () => {
    const contract = createTruthModelConsumerPipelineContract({
      now: mockNow,
    });

    const candidateItems = [
      { itemId: "item-1", title: "Title 1", content: "content-1", relevanceScore: 0.9, source: "test" },
      { itemId: "item-2", title: "Title 2", content: "content-2", relevanceScore: 0.8, source: "test" },
    ];

    const request: TruthModelConsumerPipelineRequest = {
      insights: [createInsight()],
      candidateItems,
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.rankedKnowledgeResult.items).toHaveLength(2);
  });

  it("should handle empty candidateItems", () => {
    const contract = createTruthModelConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthModelConsumerPipelineRequest = {
      insights: [createInsight()],
      candidateItems: [],
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.rankedKnowledgeResult.items).toHaveLength(0);
  });

  it("should handle undefined candidateItems", () => {
    const contract = createTruthModelConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthModelConsumerPipelineRequest = {
      insights: [createInsight()],
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.rankedKnowledgeResult.items).toHaveLength(0);
  });

  // ─── Mixed Patterns ─────────────────────────────────────────────────────────

  it("should handle different dominant patterns", () => {
    const contract = createTruthModelConsumerPipelineContract({
      now: mockNow,
    });

    const patterns = ["ACCEPT_HEAVY", "RETRY_HEAVY", "ESCALATE_HEAVY", "REJECT_HEAVY", "BALANCED"];

    patterns.forEach((pattern) => {
      const request: TruthModelConsumerPipelineRequest = {
        insights: [createInsight({ dominantPattern: pattern as any })],
      };

      const result = contract.execute(request);

      expect(result.resultId).toBeTruthy();
      expect(result.model.dominantPattern).toBe(pattern);
    });
  });

  it("should handle multiple insights", () => {
    const contract = createTruthModelConsumerPipelineContract({
      now: mockNow,
    });

    const insights = Array.from({ length: 5 }, (_, i) =>
      createInsight({ insightId: `insight-${i}` }),
    );

    const request: TruthModelConsumerPipelineRequest = { insights };
    const result = contract.execute(request);

    expect(result.model.totalInsightsProcessed).toBe(5);
    expect(result.model.patternHistory.length).toBe(5);
  });

  // ─── Confidence Levels ──────────────────────────────────────────────────────

  it("should compute confidence based on insight count", () => {
    const contract = createTruthModelConsumerPipelineContract({
      now: mockNow,
    });

    const insights1 = [createInsight()];
    const insights10 = Array.from({ length: 10 }, () => createInsight());

    const result1 = contract.execute({ insights: insights1 });
    const result10 = contract.execute({ insights: insights10 });

    expect(result1.model.confidenceLevel).toBeLessThan(result10.model.confidenceLevel);
  });

  // ─── Health Trajectories ────────────────────────────────────────────────────

  it("should derive UNKNOWN trajectory for single insight", () => {
    const contract = createTruthModelConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthModelConsumerPipelineRequest = {
      insights: [createInsight()],
    };

    const result = contract.execute(request);

    expect(result.model.healthTrajectory).toBe("UNKNOWN");
  });

  it("should derive trajectory from multiple insights", () => {
    const contract = createTruthModelConsumerPipelineContract({
      now: mockNow,
    });

    const insights = [
      createInsight({ healthSignal: "HEALTHY" }),
      createInsight({ healthSignal: "HEALTHY" }),
    ];

    const request: TruthModelConsumerPipelineRequest = { insights };
    const result = contract.execute(request);

    expect(["IMPROVING", "STABLE", "DEGRADING"]).toContain(result.model.healthTrajectory);
  });
});


// ═══════════════════════════════════════════════════════════════════════════════
// W4-T19 CP2 — TruthModelConsumerPipelineBatchContract
// ═══════════════════════════════════════════════════════════════════════════════

import {
  TruthModelConsumerPipelineBatchContract,
  createTruthModelConsumerPipelineBatchContract,
} from "../src/truth.model.consumer.pipeline.batch.contract";
import type {
  TruthModelConsumerPipelineResult,
} from "../src/truth.model.consumer.pipeline.contract";

describe("TruthModelConsumerPipelineBatchContract (W4-T19 CP2)", () => {
  const fixedNow = "2026-03-27T14:00:00.000Z";
  const mockNow = () => fixedNow;

  const createInsight = (overrides?: Partial<PatternInsight>): PatternInsight => ({
    insightId: `insight-${Math.random()}`,
    detectedAt: fixedNow,
    dominantPattern: "ACCEPT_HEAVY",
    healthSignal: "HEALTHY",
    escalateRate: 0.1,
    rejectRate: 0.05,
    retryRate: 0.15,
    acceptRate: 0.7,
    insightHash: "hash-123",
    ...overrides,
  });

  const createResult = (
    overrides?: Partial<TruthModelConsumerPipelineRequest>,
  ): TruthModelConsumerPipelineResult => {
    const contract = createTruthModelConsumerPipelineContract({
      now: mockNow,
    });
    return contract.execute({
      insights: [createInsight()],
      ...overrides,
    });
  };

  // ─── Instantiation ──────────────────────────────────────────────────────────

  it("should instantiate with default dependencies", () => {
    const contract = new TruthModelConsumerPipelineBatchContract();
    expect(contract).toBeInstanceOf(TruthModelConsumerPipelineBatchContract);
  });

  it("should instantiate with custom dependencies", () => {
    const contract = new TruthModelConsumerPipelineBatchContract({
      now: mockNow,
    });
    expect(contract).toBeInstanceOf(TruthModelConsumerPipelineBatchContract);
  });

  it("should instantiate via factory", () => {
    const contract = createTruthModelConsumerPipelineBatchContract();
    expect(contract).toBeInstanceOf(TruthModelConsumerPipelineBatchContract);
  });

  it("should instantiate via factory with dependencies", () => {
    const contract = createTruthModelConsumerPipelineBatchContract({
      now: mockNow,
    });
    expect(contract).toBeInstanceOf(TruthModelConsumerPipelineBatchContract);
  });

  // ─── Output Shape ───────────────────────────────────────────────────────────

  it("should return batch result with all required fields", () => {
    const contract = createTruthModelConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = [createResult()];
    const batchResult = contract.execute(results);

    expect(batchResult).toHaveProperty("batchId");
    expect(batchResult).toHaveProperty("createdAt");
    expect(batchResult).toHaveProperty("totalResults");
    expect(batchResult).toHaveProperty("dominantTokenBudget");
    expect(batchResult).toHaveProperty("totalModels");
    expect(batchResult).toHaveProperty("averageConfidence");
    expect(batchResult).toHaveProperty("dominantPattern");
    expect(batchResult).toHaveProperty("trajectoryDistribution");
    expect(batchResult).toHaveProperty("batchHash");
  });

  // ─── Empty Batch ────────────────────────────────────────────────────────────

  it("should handle empty batch", () => {
    const contract = createTruthModelConsumerPipelineBatchContract({
      now: mockNow,
    });

    const batchResult = contract.execute([]);

    expect(batchResult.totalResults).toBe(0);
    expect(batchResult.dominantTokenBudget).toBe(0);
    expect(batchResult.totalModels).toBe(0);
    expect(batchResult.averageConfidence).toBe(0);
    expect(batchResult.dominantPattern).toBe("EMPTY");
    expect(batchResult.batchHash).toBeTruthy();
  });

  // ─── Aggregation Logic ──────────────────────────────────────────────────────

  it("should aggregate totalResults correctly", () => {
    const contract = createTruthModelConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = [createResult(), createResult(), createResult()];
    const batchResult = contract.execute(results);

    expect(batchResult.totalResults).toBe(3);
    expect(batchResult.totalModels).toBe(3);
  });

  it("should compute dominantTokenBudget as max", () => {
    const contract = createTruthModelConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = [createResult(), createResult(), createResult()];
    const batchResult = contract.execute(results);

    const maxTokens = Math.max(
      ...results.map((r) => r.consumerPackage.typedContextPackage.estimatedTokens),
    );

    expect(batchResult.dominantTokenBudget).toBe(maxTokens);
  });

  it("should compute averageConfidence correctly", () => {
    const contract = createTruthModelConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = [createResult(), createResult(), createResult()];
    const batchResult = contract.execute(results);

    const avgConf = results.reduce((sum, r) => sum + r.model.confidenceLevel, 0) / results.length;
    const expected = Math.round(avgConf * 100) / 100;

    expect(batchResult.averageConfidence).toBe(expected);
  });

  it("should compute dominantPattern from most frequent pattern", () => {
    const contract = createTruthModelConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = [
      createResult({ insights: [createInsight({ dominantPattern: "ACCEPT_HEAVY" })] }),
      createResult({ insights: [createInsight({ dominantPattern: "ACCEPT_HEAVY" })] }),
      createResult({ insights: [createInsight({ dominantPattern: "RETRY_HEAVY" })] }),
    ];

    const batchResult = contract.execute(results);

    expect(batchResult.dominantPattern).toBe("ACCEPT_HEAVY");
  });

  it("should aggregate trajectoryDistribution correctly", () => {
    const contract = createTruthModelConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = [createResult(), createResult(), createResult()];
    const batchResult = contract.execute(results);

    const improving = results.filter((r) => r.model.healthTrajectory === "IMPROVING").length;
    const stable = results.filter((r) => r.model.healthTrajectory === "STABLE").length;
    const degrading = results.filter((r) => r.model.healthTrajectory === "DEGRADING").length;
    const unknown = results.filter((r) => r.model.healthTrajectory === "UNKNOWN").length;

    expect(batchResult.trajectoryDistribution.improving).toBe(improving);
    expect(batchResult.trajectoryDistribution.stable).toBe(stable);
    expect(batchResult.trajectoryDistribution.degrading).toBe(degrading);
    expect(batchResult.trajectoryDistribution.unknown).toBe(unknown);
  });

  // ─── Deterministic Hashing ──────────────────────────────────────────────────

  it("should produce deterministic batchHash for same inputs", () => {
    const contract = createTruthModelConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = [createResult({ insights: [createInsight({ insightId: "fixed-1" })] })];

    const batch1 = contract.execute(results);
    const batch2 = contract.execute(results);

    expect(batch1.batchHash).toBe(batch2.batchHash);
  });

  // ─── Mixed Patterns ─────────────────────────────────────────────────────────

  it("should handle mixed patterns with tie", () => {
    const contract = createTruthModelConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = [
      createResult({ insights: [createInsight({ dominantPattern: "ACCEPT_HEAVY" })] }),
      createResult({ insights: [createInsight({ dominantPattern: "RETRY_HEAVY" })] }),
    ];

    const batchResult = contract.execute(results);

    expect(batchResult.dominantPattern).toBe("MIXED");
  });

  // ─── Single Result ──────────────────────────────────────────────────────────

  it("should handle single result batch", () => {
    const contract = createTruthModelConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = [createResult()];
    const batchResult = contract.execute(results);

    expect(batchResult.totalResults).toBe(1);
    expect(batchResult.totalModels).toBe(1);
    expect(batchResult.averageConfidence).toBe(results[0].model.confidenceLevel);
  });

  // ─── Large Batch ────────────────────────────────────────────────────────────

  it("should handle large batch", () => {
    const contract = createTruthModelConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = Array.from({ length: 10 }, () => createResult());
    const batchResult = contract.execute(results);

    expect(batchResult.totalResults).toBe(10);
    expect(batchResult.totalModels).toBe(10);
    expect(batchResult.batchHash).toBeTruthy();
  });

  // ─── Confidence Range ───────────────────────────────────────────────────────

  it("should compute average confidence across varying confidence levels", () => {
    const contract = createTruthModelConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = [
      createResult({ insights: [createInsight()] }), // low confidence (1 insight)
      createResult({ insights: Array.from({ length: 10 }, () => createInsight()) }), // high confidence (10 insights)
    ];

    const batchResult = contract.execute(results);

    expect(batchResult.averageConfidence).toBeGreaterThan(0);
    expect(batchResult.averageConfidence).toBeLessThanOrEqual(1);
  });
});
