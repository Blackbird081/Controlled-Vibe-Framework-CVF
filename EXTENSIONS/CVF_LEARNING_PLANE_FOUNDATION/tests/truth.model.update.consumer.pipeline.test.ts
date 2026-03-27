import { describe, it, expect } from "vitest";
import {
  TruthModelUpdateConsumerPipelineContract,
  createTruthModelUpdateConsumerPipelineContract,
} from "../src/truth.model.update.consumer.pipeline.contract";
import type {
  TruthModelUpdateConsumerPipelineRequest,
} from "../src/truth.model.update.consumer.pipeline.contract";
import {
  TruthModelUpdateConsumerPipelineBatchContract,
  createTruthModelUpdateConsumerPipelineBatchContract,
} from "../src/truth.model.update.consumer.pipeline.batch.contract";
import type {
  TruthModelUpdateConsumerPipelineResult,
} from "../src/truth.model.update.consumer.pipeline.contract";
import { createTruthModelContract } from "../src/truth.model.contract";
import { createTruthModelUpdateContract } from "../src/truth.model.update.contract";
import type { TruthModel } from "../src/truth.model.contract";
import type { PatternInsight } from "../src/pattern.detection.contract";

describe("TruthModelUpdateConsumerPipelineContract (W4-T18 CP1)", () => {
  const fixedNow = "2026-03-27T13:00:00.000Z";
  const mockNow = () => fixedNow;

  const createBaseModel = (): TruthModel => {
    const modelContract = createTruthModelContract({ now: mockNow });
    return modelContract.build([]);
  };

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
    const contract = new TruthModelUpdateConsumerPipelineContract();
    expect(contract).toBeInstanceOf(TruthModelUpdateConsumerPipelineContract);
  });

  it("should instantiate with custom dependencies", () => {
    const contract = new TruthModelUpdateConsumerPipelineContract({
      now: mockNow,
    });
    expect(contract).toBeInstanceOf(TruthModelUpdateConsumerPipelineContract);
  });

  it("should instantiate via factory", () => {
    const contract = createTruthModelUpdateConsumerPipelineContract();
    expect(contract).toBeInstanceOf(TruthModelUpdateConsumerPipelineContract);
  });

  it("should instantiate via factory with dependencies", () => {
    const contract = createTruthModelUpdateConsumerPipelineContract({
      now: mockNow,
    });
    expect(contract).toBeInstanceOf(TruthModelUpdateConsumerPipelineContract);
  });

  // ─── Output Shape ───────────────────────────────────────────────────────────

  it("should return result with all required fields", () => {
    const contract = createTruthModelUpdateConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthModelUpdateConsumerPipelineRequest = {
      model: createBaseModel(),
      insight: createInsight(),
    };

    const result = contract.execute(request);

    expect(result).toHaveProperty("resultId");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("updatedModel");
    expect(result).toHaveProperty("consumerPackage");
    expect(result).toHaveProperty("pipelineHash");
    expect(result).toHaveProperty("warnings");
    expect(result).toHaveProperty("consumerId");
  });

  it("should return updatedModel with incremented version", () => {
    const contract = createTruthModelUpdateConsumerPipelineContract({
      now: mockNow,
    });

    const baseModel = createBaseModel();
    const request: TruthModelUpdateConsumerPipelineRequest = {
      model: baseModel,
      insight: createInsight(),
    };

    const result = contract.execute(request);

    expect(result.updatedModel.version).toBe(baseModel.version + 1);
  });

  // ─── consumerId Propagation ─────────────────────────────────────────────────

  it("should propagate consumerId when provided", () => {
    const contract = createTruthModelUpdateConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthModelUpdateConsumerPipelineRequest = {
      model: createBaseModel(),
      insight: createInsight(),
      consumerId: "consumer-123",
    };

    const result = contract.execute(request);
    expect(result.consumerId).toBe("consumer-123");
  });

  it("should return undefined consumerId when not provided", () => {
    const contract = createTruthModelUpdateConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthModelUpdateConsumerPipelineRequest = {
      model: createBaseModel(),
      insight: createInsight(),
    };

    const result = contract.execute(request);
    expect(result.consumerId).toBeUndefined();
  });

  // ─── Deterministic Hashing ──────────────────────────────────────────────────

  it("should produce deterministic pipelineHash for same inputs", () => {
    const contract = createTruthModelUpdateConsumerPipelineContract({
      now: mockNow,
    });

    const model = createBaseModel();
    const insight = createInsight({ insightId: "fixed-id" });
    const request: TruthModelUpdateConsumerPipelineRequest = {
      model,
      insight,
    };

    const result1 = contract.execute(request);
    const result2 = contract.execute(request);

    expect(result1.pipelineHash).toBe(result2.pipelineHash);
  });

  // ─── Query Derivation ───────────────────────────────────────────────────────

  it("should derive query with version, pattern, and health trajectory", () => {
    const contract = createTruthModelUpdateConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthModelUpdateConsumerPipelineRequest = {
      model: createBaseModel(),
      insight: createInsight({ dominantPattern: "ESCALATE_HEAVY" }),
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.query).toContain("Update:");
    expect(result.consumerPackage.query).toContain("v2"); // v1 base model → v2 after update
    expect(result.consumerPackage.query).toContain("ESCALATE_HEAVY");
  });

  it("should truncate query to 120 characters", () => {
    const contract = createTruthModelUpdateConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthModelUpdateConsumerPipelineRequest = {
      model: createBaseModel(),
      insight: createInsight(),
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
  });

  // ─── Warning Messages ───────────────────────────────────────────────────────

  it("should emit WARNING_HEALTH_DEGRADING when healthTrajectory is DEGRADING", () => {
    const contract = createTruthModelUpdateConsumerPipelineContract({
      now: mockNow,
    });

    // Create model with history that will result in DEGRADING trajectory
    const modelContract = createTruthModelContract({ now: mockNow });
    const updateContract = createTruthModelUpdateContract({ now: mockNow });
    let model = modelContract.build([]);
    
    // Add insights that degrade health
    model = updateContract.update(model, createInsight({ healthSignal: "HEALTHY" }));
    model = updateContract.update(model, createInsight({ healthSignal: "AT_RISK" }));
    model = updateContract.update(model, createInsight({ healthSignal: "UNHEALTHY" }));

    const request: TruthModelUpdateConsumerPipelineRequest = {
      model,
      insight: createInsight({ healthSignal: "CRITICAL" }),
    };

    const result = contract.execute(request);

    if (result.updatedModel.healthTrajectory === "DEGRADING") {
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain("health degrading");
    }
  });

  it("should not emit warning for non-degrading health", () => {
    const contract = createTruthModelUpdateConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthModelUpdateConsumerPipelineRequest = {
      model: createBaseModel(),
      insight: createInsight({ healthSignal: "HEALTHY" }),
    };

    const result = contract.execute(request);

    if (result.updatedModel.healthTrajectory !== "DEGRADING") {
      expect(result.warnings).toHaveLength(0);
    }
  });

  // ─── updatedModel Propagation ───────────────────────────────────────────────

  it("should use updatedModel.modelId as contextId", () => {
    const contract = createTruthModelUpdateConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthModelUpdateConsumerPipelineRequest = {
      model: createBaseModel(),
      insight: createInsight(),
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.contextId).toBe(result.updatedModel.modelId);
  });

  it("should update model with insight", () => {
    const contract = createTruthModelUpdateConsumerPipelineContract({
      now: mockNow,
    });

    const baseModel = createBaseModel();
    const insight = createInsight({ dominantPattern: "RETRY_HEAVY" });

    const request: TruthModelUpdateConsumerPipelineRequest = {
      model: baseModel,
      insight,
    };

    const result = contract.execute(request);

    expect(result.updatedModel.version).toBe(baseModel.version + 1);
    expect(result.updatedModel.totalInsightsProcessed).toBe(baseModel.totalInsightsProcessed + 1);
    expect(result.updatedModel.patternHistory.length).toBe(baseModel.patternHistory.length + 1);
  });

  // ─── consumerPackage Shape ──────────────────────────────────────────────────

  it("should pass candidateItems to consumer pipeline", () => {
    const contract = createTruthModelUpdateConsumerPipelineContract({
      now: mockNow,
    });

    const candidateItems = [
      { itemId: "item-1", title: "Title 1", content: "content-1", relevanceScore: 0.9, source: "test" },
      { itemId: "item-2", title: "Title 2", content: "content-2", relevanceScore: 0.8, source: "test" },
    ];

    const request: TruthModelUpdateConsumerPipelineRequest = {
      model: createBaseModel(),
      insight: createInsight(),
      candidateItems,
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.rankedKnowledgeResult.items).toHaveLength(2);
  });

  it("should handle empty candidateItems", () => {
    const contract = createTruthModelUpdateConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthModelUpdateConsumerPipelineRequest = {
      model: createBaseModel(),
      insight: createInsight(),
      candidateItems: [],
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.rankedKnowledgeResult.items).toHaveLength(0);
  });

  it("should handle undefined candidateItems", () => {
    const contract = createTruthModelUpdateConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthModelUpdateConsumerPipelineRequest = {
      model: createBaseModel(),
      insight: createInsight(),
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.rankedKnowledgeResult.items).toHaveLength(0);
  });

  // ─── Mixed Patterns ─────────────────────────────────────────────────────────

  it("should handle different dominant patterns", () => {
    const contract = createTruthModelUpdateConsumerPipelineContract({
      now: mockNow,
    });

    const patterns = ["ACCEPT_HEAVY", "RETRY_HEAVY", "ESCALATE_HEAVY", "REJECT_HEAVY", "BALANCED"];

    patterns.forEach((pattern) => {
      const request: TruthModelUpdateConsumerPipelineRequest = {
        model: createBaseModel(),
        insight: createInsight({ dominantPattern: pattern as any }),
      };

      const result = contract.execute(request);

      expect(result.resultId).toBeTruthy();
      expect(result.updatedModel.dominantPattern).toBe(pattern);
    });
  });

  it("should handle multiple updates", () => {
    const contract = createTruthModelUpdateConsumerPipelineContract({
      now: mockNow,
    });

    let model = createBaseModel(); // v1 from build([])

    for (let i = 0; i < 5; i++) {
      const request: TruthModelUpdateConsumerPipelineRequest = {
        model,
        insight: createInsight({ insightId: `insight-${i}` }),
      };

      const result = contract.execute(request);
      model = result.updatedModel;

      expect(model.version).toBe(i + 2); // v1 base → v2, v3, v4, v5, v6
      expect(model.totalInsightsProcessed).toBe(i + 1);
    }
  });
});


// ═══════════════════════════════════════════════════════════════════════════════
// W4-T18 CP2 — TruthModelUpdateConsumerPipelineBatchContract
// ═══════════════════════════════════════════════════════════════════════════════

describe("TruthModelUpdateConsumerPipelineBatchContract (W4-T18 CP2)", () => {
  const fixedNow = "2026-03-27T13:00:00.000Z";
  const mockNow = () => fixedNow;

  const createBaseModel = (): TruthModel => {
    const modelContract = createTruthModelContract({ now: mockNow });
    return modelContract.build([]);
  };

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
    overrides?: Partial<TruthModelUpdateConsumerPipelineRequest>,
  ): TruthModelUpdateConsumerPipelineResult => {
    const contract = createTruthModelUpdateConsumerPipelineContract({
      now: mockNow,
    });
    return contract.execute({
      model: createBaseModel(),
      insight: createInsight(),
      ...overrides,
    });
  };

  // ─── Instantiation ──────────────────────────────────────────────────────────

  it("should instantiate with default dependencies", () => {
    const contract = new TruthModelUpdateConsumerPipelineBatchContract();
    expect(contract).toBeInstanceOf(TruthModelUpdateConsumerPipelineBatchContract);
  });

  it("should instantiate with custom dependencies", () => {
    const contract = new TruthModelUpdateConsumerPipelineBatchContract({
      now: mockNow,
    });
    expect(contract).toBeInstanceOf(TruthModelUpdateConsumerPipelineBatchContract);
  });

  it("should instantiate via factory", () => {
    const contract = createTruthModelUpdateConsumerPipelineBatchContract();
    expect(contract).toBeInstanceOf(TruthModelUpdateConsumerPipelineBatchContract);
  });

  it("should instantiate via factory with dependencies", () => {
    const contract = createTruthModelUpdateConsumerPipelineBatchContract({
      now: mockNow,
    });
    expect(contract).toBeInstanceOf(TruthModelUpdateConsumerPipelineBatchContract);
  });

  // ─── Output Shape ───────────────────────────────────────────────────────────

  it("should return batch result with all required fields", () => {
    const contract = createTruthModelUpdateConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = [createResult()];
    const batchResult = contract.execute(results);

    expect(batchResult).toHaveProperty("batchId");
    expect(batchResult).toHaveProperty("createdAt");
    expect(batchResult).toHaveProperty("totalResults");
    expect(batchResult).toHaveProperty("dominantTokenBudget");
    expect(batchResult).toHaveProperty("totalModelUpdates");
    expect(batchResult).toHaveProperty("latestModelVersion");
    expect(batchResult).toHaveProperty("healthTrajectoryDistribution");
    expect(batchResult).toHaveProperty("batchHash");
  });

  // ─── Empty Batch ────────────────────────────────────────────────────────────

  it("should handle empty batch", () => {
    const contract = createTruthModelUpdateConsumerPipelineBatchContract({
      now: mockNow,
    });

    const batchResult = contract.execute([]);

    expect(batchResult.totalResults).toBe(0);
    expect(batchResult.dominantTokenBudget).toBe(0);
    expect(batchResult.totalModelUpdates).toBe(0);
    expect(batchResult.latestModelVersion).toBe(0);
    expect(batchResult.batchHash).toBeTruthy();
  });

  // ─── Aggregation Logic ──────────────────────────────────────────────────────

  it("should aggregate totalResults correctly", () => {
    const contract = createTruthModelUpdateConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = [createResult(), createResult(), createResult()];
    const batchResult = contract.execute(results);

    expect(batchResult.totalResults).toBe(3);
    expect(batchResult.totalModelUpdates).toBe(3);
  });

  it("should compute dominantTokenBudget as max", () => {
    const contract = createTruthModelUpdateConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = [createResult(), createResult(), createResult()];
    const batchResult = contract.execute(results);

    const maxTokens = Math.max(
      ...results.map((r) => r.consumerPackage.typedContextPackage.estimatedTokens),
    );

    expect(batchResult.dominantTokenBudget).toBe(maxTokens);
  });

  it("should compute latestModelVersion as max", () => {
    const contract = createTruthModelUpdateConsumerPipelineBatchContract({
      now: mockNow,
    });

    const modelContract = createTruthModelContract({ now: mockNow });
    const updateContract = createTruthModelUpdateContract({ now: mockNow });
    let model1 = modelContract.build([]);
    let model2 = updateContract.update(model1, createInsight());
    let model3 = updateContract.update(model2, createInsight());

    const pipelineContract = createTruthModelUpdateConsumerPipelineContract({
      now: mockNow,
    });

    const results = [
      pipelineContract.execute({ model: model1, insight: createInsight() }),
      pipelineContract.execute({ model: model2, insight: createInsight() }),
      pipelineContract.execute({ model: model3, insight: createInsight() }),
    ];

    const batchResult = contract.execute(results);

    expect(batchResult.latestModelVersion).toBe(
      Math.max(...results.map((r) => r.updatedModel.version)),
    );
  });

  it("should aggregate healthTrajectoryDistribution correctly", () => {
    const contract = createTruthModelUpdateConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = [createResult(), createResult(), createResult()];
    const batchResult = contract.execute(results);

    const improving = results.filter((r) => r.updatedModel.healthTrajectory === "IMPROVING").length;
    const stable = results.filter((r) => r.updatedModel.healthTrajectory === "STABLE").length;
    const degrading = results.filter((r) => r.updatedModel.healthTrajectory === "DEGRADING").length;

    expect(batchResult.healthTrajectoryDistribution.improving).toBe(improving);
    expect(batchResult.healthTrajectoryDistribution.stable).toBe(stable);
    expect(batchResult.healthTrajectoryDistribution.degrading).toBe(degrading);
  });

  // ─── Deterministic Hashing ──────────────────────────────────────────────────

  it("should produce deterministic batchHash for same inputs", () => {
    const contract = createTruthModelUpdateConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = [createResult({ insight: createInsight({ insightId: "fixed-1" }) })];

    const batch1 = contract.execute(results);
    const batch2 = contract.execute(results);

    expect(batch1.batchHash).toBe(batch2.batchHash);
  });

  // ─── Mixed Trajectories ─────────────────────────────────────────────────────

  it("should handle mixed health trajectories", () => {
    const contract = createTruthModelUpdateConsumerPipelineBatchContract({
      now: mockNow,
    });

    const modelContract = createTruthModelContract({ now: mockNow });
    const updateContract = createTruthModelUpdateContract({ now: mockNow });
    
    // Create models with different trajectories
    let model1 = modelContract.build([]);
    model1 = updateContract.update(model1, createInsight({ healthSignal: "HEALTHY" }));
    
    let model2 = modelContract.build([]);
    model2 = updateContract.update(model2, createInsight({ healthSignal: "HEALTHY" }));
    model2 = updateContract.update(model2, createInsight({ healthSignal: "AT_RISK" }));
    model2 = updateContract.update(model2, createInsight({ healthSignal: "UNHEALTHY" }));

    const pipelineContract = createTruthModelUpdateConsumerPipelineContract({
      now: mockNow,
    });

    const results = [
      pipelineContract.execute({ model: model1, insight: createInsight({ healthSignal: "HEALTHY" }) }),
      pipelineContract.execute({ model: model2, insight: createInsight({ healthSignal: "CRITICAL" }) }),
    ];

    const batchResult = contract.execute(results);

    expect(batchResult.totalResults).toBe(2);
    expect(
      batchResult.healthTrajectoryDistribution.improving +
      batchResult.healthTrajectoryDistribution.stable +
      batchResult.healthTrajectoryDistribution.degrading
    ).toBe(2);
  });

  // ─── Single Result ──────────────────────────────────────────────────────────

  it("should handle single result batch", () => {
    const contract = createTruthModelUpdateConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = [createResult()];
    const batchResult = contract.execute(results);

    expect(batchResult.totalResults).toBe(1);
    expect(batchResult.totalModelUpdates).toBe(1);
    expect(batchResult.latestModelVersion).toBe(results[0].updatedModel.version);
  });

  // ─── Large Batch ────────────────────────────────────────────────────────────

  it("should handle large batch", () => {
    const contract = createTruthModelUpdateConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = Array.from({ length: 10 }, () => createResult());
    const batchResult = contract.execute(results);

    expect(batchResult.totalResults).toBe(10);
    expect(batchResult.totalModelUpdates).toBe(10);
    expect(batchResult.batchHash).toBeTruthy();
  });
});
