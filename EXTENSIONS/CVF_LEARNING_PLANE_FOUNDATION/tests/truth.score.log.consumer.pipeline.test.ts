import { describe, it, expect } from "vitest";
import {
  TruthScoreLogConsumerPipelineContract,
  createTruthScoreLogConsumerPipelineContract,
} from "../src/truth.score.log.consumer.pipeline.contract";
import type {
  TruthScoreLogConsumerPipelineRequest,
} from "../src/truth.score.log.consumer.pipeline.contract";
import type { TruthScore } from "../src/truth.score.contract";

describe("TruthScoreLogConsumerPipelineContract (W4-T21 CP1)", () => {
  const fixedNow = "2026-03-27T16:00:00.000Z";
  const mockNow = () => fixedNow;

  const createScore = (overrides?: Partial<TruthScore>): TruthScore => ({
    scoreId: `score-${Math.random()}`,
    scoredAt: fixedNow,
    sourceTruthModelId: "model-123",
    sourceTruthModelVersion: 1,
    compositeScore: 80,
    scoreClass: "STRONG",
    dimensions: {
      confidenceScore: 20,
      healthScore: 25,
      trajectoryScore: 18,
      patternScore: 17,
    },
    rationale: "Strong truth score",
    scoreHash: "hash-123",
    ...overrides,
  });

  // ─── Instantiation ──────────────────────────────────────────────────────────

  it("should instantiate with default dependencies", () => {
    const contract = new TruthScoreLogConsumerPipelineContract();
    expect(contract).toBeInstanceOf(TruthScoreLogConsumerPipelineContract);
  });

  it("should instantiate with custom dependencies", () => {
    const contract = new TruthScoreLogConsumerPipelineContract({
      now: mockNow,
    });
    expect(contract).toBeInstanceOf(TruthScoreLogConsumerPipelineContract);
  });

  it("should instantiate via factory", () => {
    const contract = createTruthScoreLogConsumerPipelineContract();
    expect(contract).toBeInstanceOf(TruthScoreLogConsumerPipelineContract);
  });

  it("should instantiate via factory with dependencies", () => {
    const contract = createTruthScoreLogConsumerPipelineContract({
      now: mockNow,
    });
    expect(contract).toBeInstanceOf(TruthScoreLogConsumerPipelineContract);
  });


  // ─── Output Shape ───────────────────────────────────────────────────────────

  it("should return result with all required fields", () => {
    const contract = createTruthScoreLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthScoreLogConsumerPipelineRequest = {
      scores: [createScore()],
    };

    const result = contract.execute(request);

    expect(result).toHaveProperty("resultId");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("log");
    expect(result).toHaveProperty("consumerPackage");
    expect(result).toHaveProperty("pipelineHash");
    expect(result).toHaveProperty("warnings");
    expect(result).toHaveProperty("consumerId");
  });

  it("should return log with correct score counts", () => {
    const contract = createTruthScoreLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthScoreLogConsumerPipelineRequest = {
      scores: [
        createScore({ scoreClass: "STRONG" }),
        createScore({ scoreClass: "ADEQUATE" }),
      ],
    };

    const result = contract.execute(request);

    expect(result.log.strongCount).toBe(1);
    expect(result.log.adequateCount).toBe(1);
    expect(result.log.totalScores).toBe(2);
  });

  // ─── consumerId Propagation ─────────────────────────────────────────────────

  it("should propagate consumerId when provided", () => {
    const contract = createTruthScoreLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthScoreLogConsumerPipelineRequest = {
      scores: [createScore()],
      consumerId: "consumer-123",
    };

    const result = contract.execute(request);
    expect(result.consumerId).toBe("consumer-123");
  });

  it("should return undefined consumerId when not provided", () => {
    const contract = createTruthScoreLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthScoreLogConsumerPipelineRequest = {
      scores: [createScore()],
    };

    const result = contract.execute(request);
    expect(result.consumerId).toBeUndefined();
  });

  // ─── Deterministic Hashing ──────────────────────────────────────────────────

  it("should produce deterministic pipelineHash for same inputs", () => {
    const contract = createTruthScoreLogConsumerPipelineContract({
      now: mockNow,
    });

    const scores = [createScore({ scoreId: "fixed-id" })];
    const request: TruthScoreLogConsumerPipelineRequest = { scores };

    const result1 = contract.execute(request);
    const result2 = contract.execute(request);

    expect(result1.pipelineHash).toBe(result2.pipelineHash);
  });

  // ─── Query Derivation ───────────────────────────────────────────────────────

  it("should derive query with score count, average, and dominant class", () => {
    const contract = createTruthScoreLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthScoreLogConsumerPipelineRequest = {
      scores: [createScore({ scoreClass: "STRONG" })],
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.query).toContain("ScoreLog:");
    expect(result.consumerPackage.query).toContain("1 scores");
    expect(result.consumerPackage.query).toContain("avg=");
    expect(result.consumerPackage.query).toContain("dominant=STRONG");
  });

  it("should truncate query to 120 characters", () => {
    const contract = createTruthScoreLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthScoreLogConsumerPipelineRequest = {
      scores: [createScore()],
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
  });

  // ─── Warning Messages ───────────────────────────────────────────────────────

  it("should emit WARNING_INSUFFICIENT_SCORES when dominantClass is INSUFFICIENT", () => {
    const contract = createTruthScoreLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthScoreLogConsumerPipelineRequest = {
      scores: [createScore({ scoreClass: "INSUFFICIENT", compositeScore: 0.2 })],
    };

    const result = contract.execute(request);

    expect(result.log.dominantClass).toBe("INSUFFICIENT");
    expect(result.warnings.some((w) => w.includes("insufficient scores"))).toBe(true);
  });

  it("should emit WARNING_WEAK_SCORES when dominantClass is WEAK", () => {
    const contract = createTruthScoreLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthScoreLogConsumerPipelineRequest = {
      scores: [createScore({ scoreClass: "WEAK", compositeScore: 0.4 })],
    };

    const result = contract.execute(request);

    expect(result.log.dominantClass).toBe("WEAK");
    expect(result.warnings.some((w) => w.includes("weak scores"))).toBe(true);
  });

  it("should emit WARNING_NO_SCORES when totalScores is 0", () => {
    const contract = createTruthScoreLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthScoreLogConsumerPipelineRequest = {
      scores: [],
    };

    const result = contract.execute(request);

    expect(result.log.totalScores).toBe(0);
    expect(result.warnings.some((w) => w.includes("no scores"))).toBe(true);
  });

  it("should not emit warnings for strong scores", () => {
    const contract = createTruthScoreLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthScoreLogConsumerPipelineRequest = {
      scores: [
        createScore({ scoreClass: "STRONG" }),
        createScore({ scoreClass: "STRONG" }),
      ],
    };

    const result = contract.execute(request);

    expect(result.log.dominantClass).toBe("STRONG");
    expect(result.warnings).toHaveLength(0);
  });

  // ─── log Propagation ────────────────────────────────────────────────────────

  it("should use log.logId as contextId", () => {
    const contract = createTruthScoreLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthScoreLogConsumerPipelineRequest = {
      scores: [createScore()],
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.contextId).toBe(result.log.logId);
  });

  it("should log scores correctly", () => {
    const contract = createTruthScoreLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthScoreLogConsumerPipelineRequest = {
      scores: [
        createScore({ scoreClass: "STRONG", compositeScore: 0.9 }),
        createScore({ scoreClass: "ADEQUATE", compositeScore: 0.6 }),
        createScore({ scoreClass: "WEAK", compositeScore: 0.4 }),
      ],
    };

    const result = contract.execute(request);

    expect(result.log.totalScores).toBe(3);
    expect(result.log.strongCount).toBe(1);
    expect(result.log.adequateCount).toBe(1);
    expect(result.log.weakCount).toBe(1);
  });

  // ─── consumerPackage Shape ──────────────────────────────────────────────────

  it("should pass candidateItems to consumer pipeline", () => {
    const contract = createTruthScoreLogConsumerPipelineContract({
      now: mockNow,
    });

    const candidateItems = [
      { itemId: "item-1", title: "Title 1", content: "content-1", relevanceScore: 0.9, source: "test" },
      { itemId: "item-2", title: "Title 2", content: "content-2", relevanceScore: 0.8, source: "test" },
    ];

    const request: TruthScoreLogConsumerPipelineRequest = {
      scores: [createScore()],
      candidateItems,
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.rankedKnowledgeResult.items).toHaveLength(2);
  });

  it("should handle empty candidateItems", () => {
    const contract = createTruthScoreLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthScoreLogConsumerPipelineRequest = {
      scores: [createScore()],
      candidateItems: [],
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.rankedKnowledgeResult.items).toHaveLength(0);
  });

  it("should handle undefined candidateItems", () => {
    const contract = createTruthScoreLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthScoreLogConsumerPipelineRequest = {
      scores: [createScore()],
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.rankedKnowledgeResult.items).toHaveLength(0);
  });

  // ─── Dominant Class Logic ───────────────────────────────────────────────────

  it("should compute dominant class as most severe (INSUFFICIENT)", () => {
    const contract = createTruthScoreLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthScoreLogConsumerPipelineRequest = {
      scores: [
        createScore({ scoreClass: "STRONG" }),
        createScore({ scoreClass: "INSUFFICIENT", compositeScore: 0.2 }),
      ],
    };

    const result = contract.execute(request);

    expect(result.log.dominantClass).toBe("INSUFFICIENT");
  });

  it("should compute dominant class as WEAK when no INSUFFICIENT", () => {
    const contract = createTruthScoreLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthScoreLogConsumerPipelineRequest = {
      scores: [
        createScore({ scoreClass: "STRONG" }),
        createScore({ scoreClass: "WEAK", compositeScore: 0.4 }),
      ],
    };

    const result = contract.execute(request);

    expect(result.log.dominantClass).toBe("WEAK");
  });

  // ─── Score Aggregation ──────────────────────────────────────────────────────

  it("should compute average composite score", () => {
    const contract = createTruthScoreLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthScoreLogConsumerPipelineRequest = {
      scores: [
        createScore({ compositeScore: 0.8 }),
        createScore({ compositeScore: 0.6 }),
      ],
    };

    const result = contract.execute(request);

    expect(result.log.averageComposite).toBe(0.7);
  });

  it("should compute min and max composite scores", () => {
    const contract = createTruthScoreLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: TruthScoreLogConsumerPipelineRequest = {
      scores: [
        createScore({ compositeScore: 0.9 }),
        createScore({ compositeScore: 0.5 }),
        createScore({ compositeScore: 0.7 }),
      ],
    };

    const result = contract.execute(request);

    expect(result.log.minComposite).toBe(0.5);
    expect(result.log.maxComposite).toBe(0.9);
  });

  // ─── Large Batch ────────────────────────────────────────────────────────────

  it("should handle large score set", () => {
    const contract = createTruthScoreLogConsumerPipelineContract({
      now: mockNow,
    });

    const scores = Array.from({ length: 10 }, () => createScore({ scoreClass: "STRONG" }));

    const request: TruthScoreLogConsumerPipelineRequest = { scores };
    const result = contract.execute(request);

    expect(result.log.totalScores).toBe(10);
    expect(result.log.strongCount).toBe(10);
    expect(result.log.dominantClass).toBe("STRONG");
  });
});


// ═══════════════════════════════════════════════════════════════════════════════
// CP2 — TruthScoreLogConsumerPipelineBatchContract (W4-T21 CP2)
// ═══════════════════════════════════════════════════════════════════════════════

import {
  TruthScoreLogConsumerPipelineBatchContract,
  createTruthScoreLogConsumerPipelineBatchContract,
} from "../src/truth.score.log.consumer.pipeline.batch.contract";
import type {
  TruthScoreLogConsumerPipelineResult,
} from "../src/truth.score.log.consumer.pipeline.contract";

describe("TruthScoreLogConsumerPipelineBatchContract (W4-T21 CP2)", () => {
  const fixedNow = "2026-03-27T16:30:00.000Z";
  const mockNow = () => fixedNow;

  const createScore = (overrides?: Partial<TruthScore>): TruthScore => ({
    scoreId: `score-${Math.random()}`,
    scoredAt: fixedNow,
    sourceTruthModelId: "model-123",
    sourceTruthModelVersion: 1,
    compositeScore: 80,
    scoreClass: "STRONG",
    dimensions: {
      confidenceScore: 20,
      healthScore: 25,
      trajectoryScore: 18,
      patternScore: 17,
    },
    rationale: "Strong truth score",
    scoreHash: "hash-123",
    ...overrides,
  });

  const createResult = (
    overrides?: Partial<TruthScoreLogConsumerPipelineResult>,
  ): TruthScoreLogConsumerPipelineResult => {
    const contract = createTruthScoreLogConsumerPipelineContract({
      now: mockNow,
    });
    const base = contract.execute({
      scores: [
        createScore({ scoreClass: "STRONG", compositeScore: 90 }),
        createScore({ scoreClass: "STRONG", compositeScore: 80 }),
        createScore({ scoreClass: "ADEQUATE", compositeScore: 55 }),
      ],
    });
    return {
      ...base,
      ...overrides,
    };
  };

  // ─── Instantiation ──────────────────────────────────────────────────────────

  it("should instantiate with default dependencies", () => {
    const contract = new TruthScoreLogConsumerPipelineBatchContract();
    expect(contract).toBeInstanceOf(TruthScoreLogConsumerPipelineBatchContract);
  });

  it("should instantiate with custom dependencies", () => {
    const contract = new TruthScoreLogConsumerPipelineBatchContract({
      now: mockNow,
    });
    expect(contract).toBeInstanceOf(TruthScoreLogConsumerPipelineBatchContract);
  });

  it("should instantiate via factory", () => {
    const contract = createTruthScoreLogConsumerPipelineBatchContract();
    expect(contract).toBeInstanceOf(TruthScoreLogConsumerPipelineBatchContract);
  });

  it("should instantiate via factory with dependencies", () => {
    const contract = createTruthScoreLogConsumerPipelineBatchContract({
      now: mockNow,
    });
    expect(contract).toBeInstanceOf(TruthScoreLogConsumerPipelineBatchContract);
  });

  // ─── Output Shape ───────────────────────────────────────────────────────────

  it("should return batch with all required fields", () => {
    const contract = createTruthScoreLogConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = [createResult()];
    const batch = contract.batch(results);

    expect(batch).toHaveProperty("batchId");
    expect(batch).toHaveProperty("createdAt");
    expect(batch).toHaveProperty("totalLogs");
    expect(batch).toHaveProperty("totalScores");
    expect(batch).toHaveProperty("overallDominantClass");
    expect(batch).toHaveProperty("averageComposite");
    expect(batch).toHaveProperty("dominantTokenBudget");
    expect(batch).toHaveProperty("results");
    expect(batch).toHaveProperty("batchHash");
  });

  // ─── Aggregation Logic ──────────────────────────────────────────────────────

  it("should compute totalLogs correctly", () => {
    const contract = createTruthScoreLogConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = [createResult(), createResult(), createResult()];
    const batch = contract.batch(results);

    expect(batch.totalLogs).toBe(3);
  });

  it("should compute totalScores as sum of log.totalScores", () => {
    const contract = createTruthScoreLogConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = [
      createResult({ log: { ...createResult().log, totalScores: 5 } }),
      createResult({ log: { ...createResult().log, totalScores: 3 } }),
      createResult({ log: { ...createResult().log, totalScores: 2 } }),
    ];
    const batch = contract.batch(results);

    expect(batch.totalScores).toBe(10);
  });

  it("should compute averageComposite as average of log.averageComposite", () => {
    const contract = createTruthScoreLogConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = [
      createResult({ log: { ...createResult().log, averageComposite: 0.8 } }),
      createResult({ log: { ...createResult().log, averageComposite: 0.6 } }),
    ];
    const batch = contract.batch(results);

    expect(batch.averageComposite).toBe(0.7);
  });

  it("should compute dominantTokenBudget as max estimatedTokens", () => {
    const contract = createTruthScoreLogConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = [
      createResult({
        consumerPackage: {
          ...createResult().consumerPackage,
          typedContextPackage: {
            ...createResult().consumerPackage.typedContextPackage,
            estimatedTokens: 100,
          },
        },
      }),
      createResult({
        consumerPackage: {
          ...createResult().consumerPackage,
          typedContextPackage: {
            ...createResult().consumerPackage.typedContextPackage,
            estimatedTokens: 250,
          },
        },
      }),
      createResult({
        consumerPackage: {
          ...createResult().consumerPackage,
          typedContextPackage: {
            ...createResult().consumerPackage.typedContextPackage,
            estimatedTokens: 150,
          },
        },
      }),
    ];
    const batch = contract.batch(results);

    expect(batch.dominantTokenBudget).toBe(250);
  });

  // ─── Dominant Class Logic ───────────────────────────────────────────────────

  it("should compute overallDominantClass as INSUFFICIENT when present", () => {
    const contract = createTruthScoreLogConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = [
      createResult({ log: { ...createResult().log, dominantClass: "STRONG" } }),
      createResult({ log: { ...createResult().log, dominantClass: "INSUFFICIENT" } }),
      createResult({ log: { ...createResult().log, dominantClass: "ADEQUATE" } }),
    ];
    const batch = contract.batch(results);

    expect(batch.overallDominantClass).toBe("INSUFFICIENT");
  });

  it("should compute overallDominantClass as WEAK when no INSUFFICIENT", () => {
    const contract = createTruthScoreLogConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = [
      createResult({ log: { ...createResult().log, dominantClass: "STRONG" } }),
      createResult({ log: { ...createResult().log, dominantClass: "WEAK" } }),
      createResult({ log: { ...createResult().log, dominantClass: "ADEQUATE" } }),
    ];
    const batch = contract.batch(results);

    expect(batch.overallDominantClass).toBe("WEAK");
  });

  it("should compute overallDominantClass as ADEQUATE when no INSUFFICIENT or WEAK", () => {
    const contract = createTruthScoreLogConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = [
      createResult({ log: { ...createResult().log, dominantClass: "STRONG" } }),
      createResult({ log: { ...createResult().log, dominantClass: "ADEQUATE" } }),
    ];
    const batch = contract.batch(results);

    expect(batch.overallDominantClass).toBe("ADEQUATE");
  });

  it("should compute overallDominantClass as STRONG when all STRONG", () => {
    const contract = createTruthScoreLogConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = [
      createResult({ log: { ...createResult().log, dominantClass: "STRONG" } }),
      createResult({ log: { ...createResult().log, dominantClass: "STRONG" } }),
    ];
    const batch = contract.batch(results);

    expect(batch.overallDominantClass).toBe("STRONG");
  });

  // ─── Edge Cases ─────────────────────────────────────────────────────────────

  it("should handle empty results array", () => {
    const contract = createTruthScoreLogConsumerPipelineBatchContract({
      now: mockNow,
    });

    const batch = contract.batch([]);

    expect(batch.totalLogs).toBe(0);
    expect(batch.totalScores).toBe(0);
    expect(batch.averageComposite).toBe(0);
    expect(batch.dominantTokenBudget).toBe(0);
    expect(batch.overallDominantClass).toBe("INSUFFICIENT");
  });

  it("should handle single result", () => {
    const contract = createTruthScoreLogConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = [createResult({ log: { ...createResult().log, totalScores: 5, averageComposite: 0.8 } })];
    const batch = contract.batch(results);

    expect(batch.totalLogs).toBe(1);
    expect(batch.totalScores).toBe(5);
    expect(batch.averageComposite).toBe(0.8);
  });

  // ─── Deterministic Hashing ──────────────────────────────────────────────────

  it("should produce deterministic batchHash for same inputs", () => {
    const contract = createTruthScoreLogConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = [createResult({ resultId: "fixed-id" })];

    const batch1 = contract.batch(results);
    const batch2 = contract.batch(results);

    expect(batch1.batchHash).toBe(batch2.batchHash);
  });

  // ─── Large Batch ────────────────────────────────────────────────────────────

  it("should handle large batch of results", () => {
    const contract = createTruthScoreLogConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = Array.from({ length: 10 }, () =>
      createResult({ log: { ...createResult().log, totalScores: 3 } }),
    );
    const batch = contract.batch(results);

    expect(batch.totalLogs).toBe(10);
    expect(batch.totalScores).toBe(30);
  });
});
