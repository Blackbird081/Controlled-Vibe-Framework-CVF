import { describe, it, expect } from "vitest";
import {
  EvaluationThresholdConsumerPipelineContract,
  createEvaluationThresholdConsumerPipelineContract,
} from "../src/evaluation.threshold.consumer.pipeline.contract";
import type {
  EvaluationThresholdConsumerPipelineRequest,
} from "../src/evaluation.threshold.consumer.pipeline.contract";
import type { EvaluationResult } from "../src/evaluation.engine.contract";

describe("EvaluationThresholdConsumerPipelineContract (W4-T20 CP1)", () => {
  const fixedNow = "2026-03-27T15:00:00.000Z";
  const mockNow = () => fixedNow;

  const createEvalResult = (overrides?: Partial<EvaluationResult>): EvaluationResult => ({
    resultId: `eval-${Math.random()}`,
    evaluatedAt: fixedNow,
    sourceTruthModelId: "model-123",
    sourceTruthModelVersion: 1,
    verdict: "PASS",
    severity: "NONE",
    confidenceLevel: 0.9,
    rationale: "Test rationale",
    evaluationHash: "hash-123",
    ...overrides,
  });

  // ─── Instantiation ──────────────────────────────────────────────────────────

  it("should instantiate with default dependencies", () => {
    const contract = new EvaluationThresholdConsumerPipelineContract();
    expect(contract).toBeInstanceOf(EvaluationThresholdConsumerPipelineContract);
  });

  it("should instantiate with custom dependencies", () => {
    const contract = new EvaluationThresholdConsumerPipelineContract({
      now: mockNow,
    });
    expect(contract).toBeInstanceOf(EvaluationThresholdConsumerPipelineContract);
  });

  it("should instantiate via factory", () => {
    const contract = createEvaluationThresholdConsumerPipelineContract();
    expect(contract).toBeInstanceOf(EvaluationThresholdConsumerPipelineContract);
  });

  it("should instantiate via factory with dependencies", () => {
    const contract = createEvaluationThresholdConsumerPipelineContract({
      now: mockNow,
    });
    expect(contract).toBeInstanceOf(EvaluationThresholdConsumerPipelineContract);
  });

  // ─── Output Shape ───────────────────────────────────────────────────────────

  it("should return result with all required fields", () => {
    const contract = createEvaluationThresholdConsumerPipelineContract({
      now: mockNow,
    });

    const request: EvaluationThresholdConsumerPipelineRequest = {
      results: [createEvalResult()],
    };

    const result = contract.execute(request);

    expect(result).toHaveProperty("resultId");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("assessment");
    expect(result).toHaveProperty("consumerPackage");
    expect(result).toHaveProperty("pipelineHash");
    expect(result).toHaveProperty("warnings");
    expect(result).toHaveProperty("consumerId");
  });

  it("should return assessment with correct verdict counts", () => {
    const contract = createEvaluationThresholdConsumerPipelineContract({
      now: mockNow,
    });

    const request: EvaluationThresholdConsumerPipelineRequest = {
      results: [
        createEvalResult({ verdict: "PASS" }),
        createEvalResult({ verdict: "WARN" }),
      ],
    };

    const result = contract.execute(request);

    expect(result.assessment.passCount).toBe(1);
    expect(result.assessment.warnCount).toBe(1);
    expect(result.assessment.totalVerdicts).toBe(2);
  });

  // ─── consumerId Propagation ─────────────────────────────────────────────────

  it("should propagate consumerId when provided", () => {
    const contract = createEvaluationThresholdConsumerPipelineContract({
      now: mockNow,
    });

    const request: EvaluationThresholdConsumerPipelineRequest = {
      results: [createEvalResult()],
      consumerId: "consumer-123",
    };

    const result = contract.execute(request);
    expect(result.consumerId).toBe("consumer-123");
  });

  it("should return undefined consumerId when not provided", () => {
    const contract = createEvaluationThresholdConsumerPipelineContract({
      now: mockNow,
    });

    const request: EvaluationThresholdConsumerPipelineRequest = {
      results: [createEvalResult()],
    };

    const result = contract.execute(request);
    expect(result.consumerId).toBeUndefined();
  });

  // ─── Deterministic Hashing ──────────────────────────────────────────────────

  it("should produce deterministic pipelineHash for same inputs", () => {
    const contract = createEvaluationThresholdConsumerPipelineContract({
      now: mockNow,
    });

    const results = [createEvalResult({ resultId: "fixed-id" })];
    const request: EvaluationThresholdConsumerPipelineRequest = { results };

    const result1 = contract.execute(request);
    const result2 = contract.execute(request);

    expect(result1.pipelineHash).toBe(result2.pipelineHash);
  });

  // ─── Query Derivation ───────────────────────────────────────────────────────

  it("should derive query with status and verdict distribution", () => {
    const contract = createEvaluationThresholdConsumerPipelineContract({
      now: mockNow,
    });

    const request: EvaluationThresholdConsumerPipelineRequest = {
      results: [
        createEvalResult({ verdict: "PASS" }),
        createEvalResult({ verdict: "WARN" }),
      ],
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.query).toContain("Assessment:");
    expect(result.consumerPackage.query).toContain("WARNING");
    expect(result.consumerPackage.query).toContain("1P/1W/0F/0I");
  });

  it("should truncate query to 120 characters", () => {
    const contract = createEvaluationThresholdConsumerPipelineContract({
      now: mockNow,
    });

    const request: EvaluationThresholdConsumerPipelineRequest = {
      results: [createEvalResult()],
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
  });

  // ─── Warning Messages ───────────────────────────────────────────────────────

  it("should emit WARNING_ASSESSMENT_FAILING when status is FAILING", () => {
    const contract = createEvaluationThresholdConsumerPipelineContract({
      now: mockNow,
    });

    const request: EvaluationThresholdConsumerPipelineRequest = {
      results: [createEvalResult({ verdict: "FAIL" })],
    };

    const result = contract.execute(request);

    expect(result.assessment.overallStatus).toBe("FAILING");
    expect(result.warnings.some((w) => w.includes("assessment failing"))).toBe(true);
  });

  it("should emit WARNING_INSUFFICIENT_DATA when status is INSUFFICIENT_DATA", () => {
    const contract = createEvaluationThresholdConsumerPipelineContract({
      now: mockNow,
    });

    const request: EvaluationThresholdConsumerPipelineRequest = {
      results: [],
    };

    const result = contract.execute(request);

    expect(result.assessment.overallStatus).toBe("INSUFFICIENT_DATA");
    expect(result.warnings.some((w) => w.includes("insufficient data"))).toBe(true);
  });

  it("should emit WARNING_FAILURES_DETECTED when failCount > 0", () => {
    const contract = createEvaluationThresholdConsumerPipelineContract({
      now: mockNow,
    });

    const request: EvaluationThresholdConsumerPipelineRequest = {
      results: [
        createEvalResult({ verdict: "PASS" }),
        createEvalResult({ verdict: "FAIL" }),
      ],
    };

    const result = contract.execute(request);

    expect(result.assessment.failCount).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.includes("failures detected"))).toBe(true);
  });

  it("should not emit warnings for passing assessment", () => {
    const contract = createEvaluationThresholdConsumerPipelineContract({
      now: mockNow,
    });

    const request: EvaluationThresholdConsumerPipelineRequest = {
      results: [
        createEvalResult({ verdict: "PASS" }),
        createEvalResult({ verdict: "PASS" }),
      ],
    };

    const result = contract.execute(request);

    expect(result.assessment.overallStatus).toBe("PASSING");
    expect(result.warnings).toHaveLength(0);
  });

  // ─── assessment Propagation ─────────────────────────────────────────────────

  it("should use assessment.assessmentId as contextId", () => {
    const contract = createEvaluationThresholdConsumerPipelineContract({
      now: mockNow,
    });

    const request: EvaluationThresholdConsumerPipelineRequest = {
      results: [createEvalResult()],
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.contextId).toBe(result.assessment.assessmentId);
  });

  it("should assess results correctly", () => {
    const contract = createEvaluationThresholdConsumerPipelineContract({
      now: mockNow,
    });

    const request: EvaluationThresholdConsumerPipelineRequest = {
      results: [
        createEvalResult({ verdict: "PASS" }),
        createEvalResult({ verdict: "WARN" }),
        createEvalResult({ verdict: "FAIL" }),
      ],
    };

    const result = contract.execute(request);

    expect(result.assessment.totalVerdicts).toBe(3);
    expect(result.assessment.passCount).toBe(1);
    expect(result.assessment.warnCount).toBe(1);
    expect(result.assessment.failCount).toBe(1);
  });

  // ─── consumerPackage Shape ──────────────────────────────────────────────────

  it("should pass candidateItems to consumer pipeline", () => {
    const contract = createEvaluationThresholdConsumerPipelineContract({
      now: mockNow,
    });

    const candidateItems = [
      { itemId: "item-1", title: "Title 1", content: "content-1", relevanceScore: 0.9, source: "test" },
      { itemId: "item-2", title: "Title 2", content: "content-2", relevanceScore: 0.8, source: "test" },
    ];

    const request: EvaluationThresholdConsumerPipelineRequest = {
      results: [createEvalResult()],
      candidateItems,
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.rankedKnowledgeResult.items).toHaveLength(2);
  });

  it("should handle empty candidateItems", () => {
    const contract = createEvaluationThresholdConsumerPipelineContract({
      now: mockNow,
    });

    const request: EvaluationThresholdConsumerPipelineRequest = {
      results: [createEvalResult()],
      candidateItems: [],
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.rankedKnowledgeResult.items).toHaveLength(0);
  });

  it("should handle undefined candidateItems", () => {
    const contract = createEvaluationThresholdConsumerPipelineContract({
      now: mockNow,
    });

    const request: EvaluationThresholdConsumerPipelineRequest = {
      results: [createEvalResult()],
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.rankedKnowledgeResult.items).toHaveLength(0);
  });

  // ─── Status Derivation ──────────────────────────────────────────────────────

  it("should derive PASSING status for all pass verdicts", () => {
    const contract = createEvaluationThresholdConsumerPipelineContract({
      now: mockNow,
    });

    const request: EvaluationThresholdConsumerPipelineRequest = {
      results: [
        createEvalResult({ verdict: "PASS" }),
        createEvalResult({ verdict: "PASS" }),
      ],
    };

    const result = contract.execute(request);

    expect(result.assessment.overallStatus).toBe("PASSING");
  });

  it("should derive WARNING status when warn verdicts present", () => {
    const contract = createEvaluationThresholdConsumerPipelineContract({
      now: mockNow,
    });

    const request: EvaluationThresholdConsumerPipelineRequest = {
      results: [
        createEvalResult({ verdict: "PASS" }),
        createEvalResult({ verdict: "WARN" }),
      ],
    };

    const result = contract.execute(request);

    expect(result.assessment.overallStatus).toBe("WARNING");
  });

  it("should derive FAILING status when fail verdicts present", () => {
    const contract = createEvaluationThresholdConsumerPipelineContract({
      now: mockNow,
    });

    const request: EvaluationThresholdConsumerPipelineRequest = {
      results: [
        createEvalResult({ verdict: "PASS" }),
        createEvalResult({ verdict: "FAIL" }),
      ],
    };

    const result = contract.execute(request);

    expect(result.assessment.overallStatus).toBe("FAILING");
  });

  it("should derive INSUFFICIENT_DATA for empty results", () => {
    const contract = createEvaluationThresholdConsumerPipelineContract({
      now: mockNow,
    });

    const request: EvaluationThresholdConsumerPipelineRequest = {
      results: [],
    };

    const result = contract.execute(request);

    expect(result.assessment.overallStatus).toBe("INSUFFICIENT_DATA");
  });

  it("should derive INSUFFICIENT_DATA for all inconclusive verdicts", () => {
    const contract = createEvaluationThresholdConsumerPipelineContract({
      now: mockNow,
    });

    const request: EvaluationThresholdConsumerPipelineRequest = {
      results: [
        createEvalResult({ verdict: "INCONCLUSIVE" }),
        createEvalResult({ verdict: "INCONCLUSIVE" }),
      ],
    };

    const result = contract.execute(request);

    expect(result.assessment.overallStatus).toBe("INSUFFICIENT_DATA");
  });

  // ─── Mixed Verdicts ─────────────────────────────────────────────────────────

  it("should handle mixed verdicts", () => {
    const contract = createEvaluationThresholdConsumerPipelineContract({
      now: mockNow,
    });

    const request: EvaluationThresholdConsumerPipelineRequest = {
      results: [
        createEvalResult({ verdict: "PASS" }),
        createEvalResult({ verdict: "WARN" }),
        createEvalResult({ verdict: "FAIL" }),
        createEvalResult({ verdict: "INCONCLUSIVE" }),
      ],
    };

    const result = contract.execute(request);

    expect(result.assessment.totalVerdicts).toBe(4);
    expect(result.assessment.passCount).toBe(1);
    expect(result.assessment.warnCount).toBe(1);
    expect(result.assessment.failCount).toBe(1);
    expect(result.assessment.inconclusiveCount).toBe(1);
  });

  // ─── Large Batch ────────────────────────────────────────────────────────────

  it("should handle large result set", () => {
    const contract = createEvaluationThresholdConsumerPipelineContract({
      now: mockNow,
    });

    const results = Array.from({ length: 10 }, () => createEvalResult({ verdict: "PASS" }));

    const request: EvaluationThresholdConsumerPipelineRequest = { results };
    const result = contract.execute(request);

    expect(result.assessment.totalVerdicts).toBe(10);
    expect(result.assessment.passCount).toBe(10);
    expect(result.assessment.overallStatus).toBe("PASSING");
  });
});


// ═══════════════════════════════════════════════════════════════════════════════
// W4-T20 CP2 — EvaluationThresholdConsumerPipelineBatchContract
// ═══════════════════════════════════════════════════════════════════════════════

import {
  EvaluationThresholdConsumerPipelineBatchContract,
  createEvaluationThresholdConsumerPipelineBatchContract,
} from "../src/evaluation.threshold.consumer.pipeline.batch.contract";
import type {
  EvaluationThresholdConsumerPipelineResult,
} from "../src/evaluation.threshold.consumer.pipeline.contract";

describe("EvaluationThresholdConsumerPipelineBatchContract (W4-T20 CP2)", () => {
  const fixedNow = "2026-03-27T15:00:00.000Z";
  const mockNow = () => fixedNow;

  const createEvalResult = (overrides?: Partial<EvaluationResult>): EvaluationResult => ({
    resultId: `eval-${Math.random()}`,
    evaluatedAt: fixedNow,
    sourceTruthModelId: "model-123",
    sourceTruthModelVersion: 1,
    verdict: "PASS",
    severity: "NONE",
    confidenceLevel: 0.9,
    rationale: "Test rationale",
    evaluationHash: "hash-123",
    ...overrides,
  });

  const createResult = (
    overrides?: Partial<EvaluationThresholdConsumerPipelineRequest>,
  ): EvaluationThresholdConsumerPipelineResult => {
    const contract = createEvaluationThresholdConsumerPipelineContract({
      now: mockNow,
    });
    return contract.execute({
      results: [createEvalResult()],
      ...overrides,
    });
  };

  // ─── Instantiation ──────────────────────────────────────────────────────────

  it("should instantiate with default dependencies", () => {
    const contract = new EvaluationThresholdConsumerPipelineBatchContract();
    expect(contract).toBeInstanceOf(EvaluationThresholdConsumerPipelineBatchContract);
  });

  it("should instantiate with custom dependencies", () => {
    const contract = new EvaluationThresholdConsumerPipelineBatchContract({
      now: mockNow,
    });
    expect(contract).toBeInstanceOf(EvaluationThresholdConsumerPipelineBatchContract);
  });

  it("should instantiate via factory", () => {
    const contract = createEvaluationThresholdConsumerPipelineBatchContract();
    expect(contract).toBeInstanceOf(EvaluationThresholdConsumerPipelineBatchContract);
  });

  it("should instantiate via factory with dependencies", () => {
    const contract = createEvaluationThresholdConsumerPipelineBatchContract({
      now: mockNow,
    });
    expect(contract).toBeInstanceOf(EvaluationThresholdConsumerPipelineBatchContract);
  });

  // ─── Output Shape ───────────────────────────────────────────────────────────

  it("should return batch result with all required fields", () => {
    const contract = createEvaluationThresholdConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = [createResult()];
    const batchResult = contract.execute(results);

    expect(batchResult).toHaveProperty("batchId");
    expect(batchResult).toHaveProperty("createdAt");
    expect(batchResult).toHaveProperty("totalResults");
    expect(batchResult).toHaveProperty("dominantTokenBudget");
    expect(batchResult).toHaveProperty("totalAssessments");
    expect(batchResult).toHaveProperty("dominantStatus");
    expect(batchResult).toHaveProperty("totalVerdicts");
    expect(batchResult).toHaveProperty("verdictTotals");
    expect(batchResult).toHaveProperty("statusDistribution");
    expect(batchResult).toHaveProperty("batchHash");
  });

  // ─── Empty Batch ────────────────────────────────────────────────────────────

  it("should handle empty batch", () => {
    const contract = createEvaluationThresholdConsumerPipelineBatchContract({
      now: mockNow,
    });

    const batchResult = contract.execute([]);

    expect(batchResult.totalResults).toBe(0);
    expect(batchResult.dominantTokenBudget).toBe(0);
    expect(batchResult.totalAssessments).toBe(0);
    expect(batchResult.dominantStatus).toBe("INSUFFICIENT_DATA");
    expect(batchResult.batchHash).toBeTruthy();
  });

  // ─── Aggregation Logic ──────────────────────────────────────────────────────

  it("should aggregate totalResults correctly", () => {
    const contract = createEvaluationThresholdConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = [createResult(), createResult(), createResult()];
    const batchResult = contract.execute(results);

    expect(batchResult.totalResults).toBe(3);
    expect(batchResult.totalAssessments).toBe(3);
  });

  it("should compute dominantTokenBudget as max", () => {
    const contract = createEvaluationThresholdConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = [createResult(), createResult(), createResult()];
    const batchResult = contract.execute(results);

    const maxTokens = Math.max(
      ...results.map((r) => r.consumerPackage.typedContextPackage.estimatedTokens),
    );

    expect(batchResult.dominantTokenBudget).toBe(maxTokens);
  });

  it("should compute dominantStatus as most severe", () => {
    const contract = createEvaluationThresholdConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = [
      createResult({ results: [createEvalResult({ verdict: "PASS" })] }),
      createResult({ results: [createEvalResult({ verdict: "FAIL" })] }),
    ];

    const batchResult = contract.execute(results);

    expect(batchResult.dominantStatus).toBe("FAILING");
  });

  it("should aggregate totalVerdicts correctly", () => {
    const contract = createEvaluationThresholdConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = [
      createResult({ results: [createEvalResult(), createEvalResult()] }),
      createResult({ results: [createEvalResult()] }),
    ];

    const batchResult = contract.execute(results);

    expect(batchResult.totalVerdicts).toBe(3);
  });

  it("should aggregate verdictTotals correctly", () => {
    const contract = createEvaluationThresholdConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = [
      createResult({ results: [createEvalResult({ verdict: "PASS" }), createEvalResult({ verdict: "WARN" })] }),
      createResult({ results: [createEvalResult({ verdict: "FAIL" })] }),
    ];

    const batchResult = contract.execute(results);

    expect(batchResult.verdictTotals.passCount).toBeGreaterThan(0);
    expect(batchResult.verdictTotals.warnCount).toBeGreaterThan(0);
    expect(batchResult.verdictTotals.failCount).toBeGreaterThan(0);
  });

  it("should aggregate statusDistribution correctly", () => {
    const contract = createEvaluationThresholdConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = [
      createResult({ results: [createEvalResult({ verdict: "PASS" })] }),
      createResult({ results: [createEvalResult({ verdict: "WARN" })] }),
      createResult({ results: [createEvalResult({ verdict: "FAIL" })] }),
    ];

    const batchResult = contract.execute(results);

    expect(batchResult.statusDistribution.passing).toBe(1);
    expect(batchResult.statusDistribution.warning).toBe(1);
    expect(batchResult.statusDistribution.failing).toBe(1);
  });

  // ─── Deterministic Hashing ──────────────────────────────────────────────────

  it("should produce deterministic batchHash for same inputs", () => {
    const contract = createEvaluationThresholdConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = [createResult({ results: [createEvalResult({ resultId: "fixed-1" })] })];

    const batch1 = contract.execute(results);
    const batch2 = contract.execute(results);

    expect(batch1.batchHash).toBe(batch2.batchHash);
  });

  // ─── Single Result ──────────────────────────────────────────────────────────

  it("should handle single result batch", () => {
    const contract = createEvaluationThresholdConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = [createResult()];
    const batchResult = contract.execute(results);

    expect(batchResult.totalResults).toBe(1);
    expect(batchResult.totalAssessments).toBe(1);
  });

  // ─── Large Batch ────────────────────────────────────────────────────────────

  it("should handle large batch", () => {
    const contract = createEvaluationThresholdConsumerPipelineBatchContract({
      now: mockNow,
    });

    const results = Array.from({ length: 10 }, () => createResult());
    const batchResult = contract.execute(results);

    expect(batchResult.totalResults).toBe(10);
    expect(batchResult.totalAssessments).toBe(10);
    expect(batchResult.batchHash).toBeTruthy();
  });
});
