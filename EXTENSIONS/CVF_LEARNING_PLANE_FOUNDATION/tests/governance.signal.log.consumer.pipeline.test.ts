import { describe, it, expect } from "vitest";
import {
  GovernanceSignalLogConsumerPipelineContract,
  createGovernanceSignalLogConsumerPipelineContract,
} from "../src/governance.signal.log.consumer.pipeline.contract";
import type {
  GovernanceSignalLogConsumerPipelineRequest,
} from "../src/governance.signal.log.consumer.pipeline.contract";
import {
  GovernanceSignalLogConsumerPipelineBatchContract,
  createGovernanceSignalLogConsumerPipelineBatchContract,
} from "../src/governance.signal.log.consumer.pipeline.batch.contract";
import type { GovernanceSignal, GovernanceUrgency, GovernanceSignalType } from "../src/governance.signal.contract";

describe("GovernanceSignalLogConsumerPipelineContract (W4-T22 CP1)", () => {
  const fixedNow = "2026-03-27T17:00:00.000Z";
  const mockNow = () => fixedNow;

  const createSignal = (overrides?: Partial<GovernanceSignal>): GovernanceSignal => ({
    signalId: `signal-${Math.random()}`,
    issuedAt: fixedNow,
    sourceAssessmentId: `assessment-${Math.random()}`,
    sourceOverallStatus: "PASSING",
    signalType: "MONITOR",
    urgency: "LOW",
    recommendation: "Monitor learning state",
    signalHash: "hash-123",
    ...overrides,
  });

  // ─── Instantiation ──────────────────────────────────────────────────────────

  it("should instantiate with default dependencies", () => {
    const contract = new GovernanceSignalLogConsumerPipelineContract();
    expect(contract).toBeInstanceOf(GovernanceSignalLogConsumerPipelineContract);
  });

  it("should instantiate with custom dependencies", () => {
    const contract = new GovernanceSignalLogConsumerPipelineContract({
      now: mockNow,
    });
    expect(contract).toBeInstanceOf(GovernanceSignalLogConsumerPipelineContract);
  });

  it("should instantiate via factory", () => {
    const contract = createGovernanceSignalLogConsumerPipelineContract();
    expect(contract).toBeInstanceOf(GovernanceSignalLogConsumerPipelineContract);
  });

  it("should instantiate via factory with dependencies", () => {
    const contract = createGovernanceSignalLogConsumerPipelineContract({
      now: mockNow,
    });
    expect(contract).toBeInstanceOf(GovernanceSignalLogConsumerPipelineContract);
  });

  // ─── Output Shape ───────────────────────────────────────────────────────────

  it("should return result with all required fields", () => {
    const contract = createGovernanceSignalLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: GovernanceSignalLogConsumerPipelineRequest = {
      signals: [createSignal()],
    };

    const result = contract.execute(request);

    expect(result).toHaveProperty("resultId");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("log");
    expect(result).toHaveProperty("dominantUrgency");
    expect(result).toHaveProperty("consumerPackage");
    expect(result).toHaveProperty("pipelineHash");
    expect(result).toHaveProperty("warnings");
    expect(result).toHaveProperty("consumerId");
  });

  it("should return log with correct signal counts", () => {
    const contract = createGovernanceSignalLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: GovernanceSignalLogConsumerPipelineRequest = {
      signals: [
        createSignal({ signalType: "ESCALATE" }),
        createSignal({ signalType: "MONITOR" }),
        createSignal({ signalType: "TRIGGER_REVIEW" }),
      ],
    };

    const result = contract.execute(request);

    expect(result.log.escalateCount).toBe(1);
    expect(result.log.monitorCount).toBe(1);
    expect(result.log.reviewCount).toBe(1);
    expect(result.log.totalSignals).toBe(3);
  });

  // ─── consumerId Propagation ─────────────────────────────────────────────────

  it("should propagate consumerId when provided", () => {
    const contract = createGovernanceSignalLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: GovernanceSignalLogConsumerPipelineRequest = {
      signals: [createSignal()],
      consumerId: "consumer-123",
    };

    const result = contract.execute(request);
    expect(result.consumerId).toBe("consumer-123");
  });

  it("should return undefined consumerId when not provided", () => {
    const contract = createGovernanceSignalLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: GovernanceSignalLogConsumerPipelineRequest = {
      signals: [createSignal()],
    };

    const result = contract.execute(request);
    expect(result.consumerId).toBeUndefined();
  });

  // ─── Deterministic Hashing ──────────────────────────────────────────────────

  it("should produce deterministic pipelineHash for same inputs", () => {
    const contract = createGovernanceSignalLogConsumerPipelineContract({
      now: mockNow,
    });

    const signals = [createSignal({ signalId: "fixed-id" })];
    const request: GovernanceSignalLogConsumerPipelineRequest = { signals };

    const result1 = contract.execute(request);
    const result2 = contract.execute(request);

    expect(result1.pipelineHash).toBe(result2.pipelineHash);
  });

  // ─── Query Derivation ───────────────────────────────────────────────────────

  it("should derive query with signal count, urgency, and type", () => {
    const contract = createGovernanceSignalLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: GovernanceSignalLogConsumerPipelineRequest = {
      signals: [createSignal({ signalType: "ESCALATE", urgency: "CRITICAL" })],
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.query).toContain("SignalLog:");
    expect(result.consumerPackage.query).toContain("1 signals");
    expect(result.consumerPackage.query).toContain("urgency=CRITICAL");
    expect(result.consumerPackage.query).toContain("type=ESCALATE");
  });

  it("should truncate query to 120 characters", () => {
    const contract = createGovernanceSignalLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: GovernanceSignalLogConsumerPipelineRequest = {
      signals: [createSignal()],
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
  });

  // ─── Warning Messages ───────────────────────────────────────────────────────

  it("should emit WARNING_CRITICAL_URGENCY_DOMINANT when dominantUrgency is CRITICAL", () => {
    const contract = createGovernanceSignalLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: GovernanceSignalLogConsumerPipelineRequest = {
      signals: [createSignal({ urgency: "CRITICAL" })],
    };

    const result = contract.execute(request);

    expect(result.dominantUrgency).toBe("CRITICAL");
    expect(result.warnings.some((w) => w.includes("critical urgency dominant"))).toBe(true);
  });

  it("should emit WARNING_HIGH_ESCALATION_RATE when >50% signals are escalations", () => {
    const contract = createGovernanceSignalLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: GovernanceSignalLogConsumerPipelineRequest = {
      signals: [
        createSignal({ signalType: "ESCALATE" }),
        createSignal({ signalType: "ESCALATE" }),
        createSignal({ signalType: "MONITOR" }),
      ],
    };

    const result = contract.execute(request);

    expect(result.log.escalateCount).toBe(2);
    expect(result.log.totalSignals).toBe(3);
    expect(result.warnings.some((w) => w.includes("high escalation rate"))).toBe(true);
  });

  it("should emit WARNING_NO_SIGNALS when totalSignals is 0", () => {
    const contract = createGovernanceSignalLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: GovernanceSignalLogConsumerPipelineRequest = {
      signals: [],
    };

    const result = contract.execute(request);

    expect(result.log.totalSignals).toBe(0);
    expect(result.warnings.some((w) => w.includes("no signals"))).toBe(true);
  });

  it("should not emit warnings for normal signals", () => {
    const contract = createGovernanceSignalLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: GovernanceSignalLogConsumerPipelineRequest = {
      signals: [
        createSignal({ signalType: "MONITOR", urgency: "LOW" }),
        createSignal({ signalType: "NO_ACTION", urgency: "LOW" }),
      ],
    };

    const result = contract.execute(request);

    expect(result.dominantUrgency).toBe("LOW");
    expect(result.warnings).toHaveLength(0);
  });

  // ─── log Propagation ────────────────────────────────────────────────────────

  it("should use log.logId as contextId", () => {
    const contract = createGovernanceSignalLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: GovernanceSignalLogConsumerPipelineRequest = {
      signals: [createSignal()],
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.contextId).toBe(result.log.logId);
  });

  it("should log signals correctly", () => {
    const contract = createGovernanceSignalLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: GovernanceSignalLogConsumerPipelineRequest = {
      signals: [
        createSignal({ signalType: "ESCALATE" }),
        createSignal({ signalType: "TRIGGER_REVIEW" }),
        createSignal({ signalType: "MONITOR" }),
        createSignal({ signalType: "NO_ACTION" }),
      ],
    };

    const result = contract.execute(request);

    expect(result.log.totalSignals).toBe(4);
    expect(result.log.escalateCount).toBe(1);
    expect(result.log.reviewCount).toBe(1);
    expect(result.log.monitorCount).toBe(1);
    expect(result.log.noActionCount).toBe(1);
  });

  // ─── consumerPackage Shape ──────────────────────────────────────────────────

  it("should pass candidateItems to consumer pipeline", () => {
    const contract = createGovernanceSignalLogConsumerPipelineContract({
      now: mockNow,
    });

    const candidateItems = [
      { itemId: "item-1", title: "Title 1", content: "content-1", relevanceScore: 0.9, source: "test" },
      { itemId: "item-2", title: "Title 2", content: "content-2", relevanceScore: 0.8, source: "test" },
    ];

    const request: GovernanceSignalLogConsumerPipelineRequest = {
      signals: [createSignal()],
      candidateItems,
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.rankedKnowledgeResult.items).toHaveLength(2);
  });

  it("should handle empty candidateItems", () => {
    const contract = createGovernanceSignalLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: GovernanceSignalLogConsumerPipelineRequest = {
      signals: [createSignal()],
      candidateItems: [],
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.rankedKnowledgeResult.items).toHaveLength(0);
  });

  it("should handle undefined candidateItems", () => {
    const contract = createGovernanceSignalLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: GovernanceSignalLogConsumerPipelineRequest = {
      signals: [createSignal()],
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.rankedKnowledgeResult.items).toHaveLength(0);
  });

  // ─── Dominant Urgency Logic ─────────────────────────────────────────────────

  it("should compute dominant urgency as CRITICAL when present", () => {
    const contract = createGovernanceSignalLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: GovernanceSignalLogConsumerPipelineRequest = {
      signals: [
        createSignal({ urgency: "LOW" }),
        createSignal({ urgency: "CRITICAL" }),
        createSignal({ urgency: "NORMAL" }),
      ],
    };

    const result = contract.execute(request);

    expect(result.dominantUrgency).toBe("CRITICAL");
  });

  it("should compute dominant urgency as HIGH when no CRITICAL", () => {
    const contract = createGovernanceSignalLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: GovernanceSignalLogConsumerPipelineRequest = {
      signals: [
        createSignal({ urgency: "LOW" }),
        createSignal({ urgency: "HIGH" }),
        createSignal({ urgency: "NORMAL" }),
      ],
    };

    const result = contract.execute(request);

    expect(result.dominantUrgency).toBe("HIGH");
  });

  it("should compute dominant urgency as NORMAL when no CRITICAL or HIGH", () => {
    const contract = createGovernanceSignalLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: GovernanceSignalLogConsumerPipelineRequest = {
      signals: [
        createSignal({ urgency: "LOW" }),
        createSignal({ urgency: "NORMAL" }),
      ],
    };

    const result = contract.execute(request);

    expect(result.dominantUrgency).toBe("NORMAL");
  });

  it("should compute dominant urgency as LOW when all LOW", () => {
    const contract = createGovernanceSignalLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: GovernanceSignalLogConsumerPipelineRequest = {
      signals: [
        createSignal({ urgency: "LOW" }),
        createSignal({ urgency: "LOW" }),
      ],
    };

    const result = contract.execute(request);

    expect(result.dominantUrgency).toBe("LOW");
  });

  it("should compute dominant urgency as LOW for empty signals", () => {
    const contract = createGovernanceSignalLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: GovernanceSignalLogConsumerPipelineRequest = {
      signals: [],
    };

    const result = contract.execute(request);

    expect(result.dominantUrgency).toBe("LOW");
  });

  // ─── Dominant Signal Type Logic ─────────────────────────────────────────────

  it("should compute dominant signal type as ESCALATE when present", () => {
    const contract = createGovernanceSignalLogConsumerPipelineContract({
      now: mockNow,
    });

    const request: GovernanceSignalLogConsumerPipelineRequest = {
      signals: [
        createSignal({ signalType: "MONITOR" }),
        createSignal({ signalType: "ESCALATE" }),
        createSignal({ signalType: "NO_ACTION" }),
      ],
    };

    const result = contract.execute(request);

    expect(result.log.dominantSignalType).toBe("ESCALATE");
  });

  // ─── Large Batch ────────────────────────────────────────────────────────────

  it("should handle large signal set", () => {
    const contract = createGovernanceSignalLogConsumerPipelineContract({
      now: mockNow,
    });

    const signals = Array.from({ length: 10 }, () => createSignal({ signalType: "MONITOR" }));

    const request: GovernanceSignalLogConsumerPipelineRequest = { signals };
    const result = contract.execute(request);

    expect(result.log.totalSignals).toBe(10);
    expect(result.log.monitorCount).toBe(10);
    expect(result.log.dominantSignalType).toBe("MONITOR");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// W4-T22 CP2 — GovernanceSignalLogConsumerPipelineBatchContract Tests
// ═══════════════════════════════════════════════════════════════════════════

describe("GovernanceSignalLogConsumerPipelineBatchContract (W4-T22 CP2)", () => {
  const fixedNow = "2026-03-27T17:00:00.000Z";
  const mockNow = () => fixedNow;

  const createPipelineContract = () =>
    createGovernanceSignalLogConsumerPipelineContract({ now: mockNow });

  const createSignal = (overrides?: Partial<GovernanceSignal>): GovernanceSignal => ({
    signalId: `signal-${Math.random()}`,
    issuedAt: fixedNow,
    sourceAssessmentId: `assessment-${Math.random()}`,
    sourceOverallStatus: "PASSING",
    signalType: "MONITOR",
    urgency: "LOW",
    recommendation: "Monitor learning state",
    signalHash: "hash-123",
    ...overrides,
  });

  // ─── Instantiation ──────────────────────────────────────────────────────────

  it("should instantiate with default dependencies", () => {
    const contract = new GovernanceSignalLogConsumerPipelineBatchContract();
    expect(contract).toBeInstanceOf(GovernanceSignalLogConsumerPipelineBatchContract);
  });

  it("should instantiate with custom dependencies", () => {
    const contract = new GovernanceSignalLogConsumerPipelineBatchContract({
      now: mockNow,
    });
    expect(contract).toBeInstanceOf(GovernanceSignalLogConsumerPipelineBatchContract);
  });

  it("should instantiate via factory", () => {
    const contract = createGovernanceSignalLogConsumerPipelineBatchContract();
    expect(contract).toBeInstanceOf(GovernanceSignalLogConsumerPipelineBatchContract);
  });

  it("should instantiate via factory with dependencies", () => {
    const contract = createGovernanceSignalLogConsumerPipelineBatchContract({
      now: mockNow,
    });
    expect(contract).toBeInstanceOf(GovernanceSignalLogConsumerPipelineBatchContract);
  });

  // ─── Output Shape ───────────────────────────────────────────────────────────

  it("should return batch result with all required fields", () => {
    const batchContract = createGovernanceSignalLogConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const result1 = pipelineContract.execute({ signals: [createSignal()] });
    const batchResult = batchContract.batch([result1]);

    expect(batchResult).toHaveProperty("batchId");
    expect(batchResult).toHaveProperty("createdAt");
    expect(batchResult).toHaveProperty("totalLogs");
    expect(batchResult).toHaveProperty("totalSignals");
    expect(batchResult).toHaveProperty("overallDominantUrgency");
    expect(batchResult).toHaveProperty("overallDominantType");
    expect(batchResult).toHaveProperty("dominantTokenBudget");
    expect(batchResult).toHaveProperty("results");
    expect(batchResult).toHaveProperty("batchHash");
  });

  // ─── Empty Batch ────────────────────────────────────────────────────────────

  it("should handle empty batch", () => {
    const batchContract = createGovernanceSignalLogConsumerPipelineBatchContract({
      now: mockNow,
    });

    const batchResult = batchContract.batch([]);

    expect(batchResult.totalLogs).toBe(0);
    expect(batchResult.totalSignals).toBe(0);
    expect(batchResult.overallDominantUrgency).toBe("LOW");
    expect(batchResult.overallDominantType).toBe("NO_ACTION");
    expect(batchResult.dominantTokenBudget).toBe(0);
    expect(batchResult.results).toHaveLength(0);
  });

  // ─── Aggregation Logic ──────────────────────────────────────────────────────

  it("should aggregate totalLogs correctly", () => {
    const batchContract = createGovernanceSignalLogConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const result1 = pipelineContract.execute({ signals: [createSignal()] });
    const result2 = pipelineContract.execute({ signals: [createSignal()] });
    const result3 = pipelineContract.execute({ signals: [createSignal()] });

    const batchResult = batchContract.batch([result1, result2, result3]);

    expect(batchResult.totalLogs).toBe(3);
  });

  it("should aggregate totalSignals correctly", () => {
    const batchContract = createGovernanceSignalLogConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const result1 = pipelineContract.execute({ signals: [createSignal(), createSignal()] });
    const result2 = pipelineContract.execute({ signals: [createSignal()] });
    const result3 = pipelineContract.execute({ signals: [createSignal(), createSignal(), createSignal()] });

    const batchResult = batchContract.batch([result1, result2, result3]);

    expect(batchResult.totalSignals).toBe(6);
  });

  // ─── Overall Dominant Urgency (Severity-First) ─────────────────────────────

  it("should compute overallDominantUrgency as CRITICAL when present", () => {
    const batchContract = createGovernanceSignalLogConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const result1 = pipelineContract.execute({ signals: [createSignal({ urgency: "LOW" })] });
    const result2 = pipelineContract.execute({ signals: [createSignal({ urgency: "CRITICAL" })] });
    const result3 = pipelineContract.execute({ signals: [createSignal({ urgency: "NORMAL" })] });

    const batchResult = batchContract.batch([result1, result2, result3]);

    expect(batchResult.overallDominantUrgency).toBe("CRITICAL");
  });

  it("should compute overallDominantUrgency as HIGH when no CRITICAL", () => {
    const batchContract = createGovernanceSignalLogConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const result1 = pipelineContract.execute({ signals: [createSignal({ urgency: "LOW" })] });
    const result2 = pipelineContract.execute({ signals: [createSignal({ urgency: "HIGH" })] });
    const result3 = pipelineContract.execute({ signals: [createSignal({ urgency: "NORMAL" })] });

    const batchResult = batchContract.batch([result1, result2, result3]);

    expect(batchResult.overallDominantUrgency).toBe("HIGH");
  });

  it("should compute overallDominantUrgency as NORMAL when no CRITICAL or HIGH", () => {
    const batchContract = createGovernanceSignalLogConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const result1 = pipelineContract.execute({ signals: [createSignal({ urgency: "LOW" })] });
    const result2 = pipelineContract.execute({ signals: [createSignal({ urgency: "NORMAL" })] });

    const batchResult = batchContract.batch([result1, result2]);

    expect(batchResult.overallDominantUrgency).toBe("NORMAL");
  });

  it("should compute overallDominantUrgency as LOW when all LOW", () => {
    const batchContract = createGovernanceSignalLogConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const result1 = pipelineContract.execute({ signals: [createSignal({ urgency: "LOW" })] });
    const result2 = pipelineContract.execute({ signals: [createSignal({ urgency: "LOW" })] });

    const batchResult = batchContract.batch([result1, result2]);

    expect(batchResult.overallDominantUrgency).toBe("LOW");
  });

  // ─── Overall Dominant Type (Frequency-Based) ───────────────────────────────

  it("should compute overallDominantType as most frequent type", () => {
    const batchContract = createGovernanceSignalLogConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const result1 = pipelineContract.execute({ signals: [createSignal({ signalType: "MONITOR" })] });
    const result2 = pipelineContract.execute({ signals: [createSignal({ signalType: "MONITOR" })] });
    const result3 = pipelineContract.execute({ signals: [createSignal({ signalType: "ESCALATE" })] });

    const batchResult = batchContract.batch([result1, result2, result3]);

    expect(batchResult.overallDominantType).toBe("MONITOR");
  });

  it("should compute overallDominantType using priority on tie", () => {
    const batchContract = createGovernanceSignalLogConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const result1 = pipelineContract.execute({ signals: [createSignal({ signalType: "ESCALATE" })] });
    const result2 = pipelineContract.execute({ signals: [createSignal({ signalType: "MONITOR" })] });

    const batchResult = batchContract.batch([result1, result2]);

    expect(batchResult.overallDominantType).toBe("ESCALATE");
  });

  it("should compute overallDominantType as NO_ACTION for empty batch", () => {
    const batchContract = createGovernanceSignalLogConsumerPipelineBatchContract({
      now: mockNow,
    });

    const batchResult = batchContract.batch([]);

    expect(batchResult.overallDominantType).toBe("NO_ACTION");
  });

  // ─── Dominant Token Budget ──────────────────────────────────────────────────

  it("should compute dominantTokenBudget as max estimatedTokens", () => {
    const batchContract = createGovernanceSignalLogConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const result1 = pipelineContract.execute({ signals: [createSignal()] });
    const result2 = pipelineContract.execute({ signals: [createSignal(), createSignal()] });
    const result3 = pipelineContract.execute({ signals: [createSignal()] });

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
    const batchContract = createGovernanceSignalLogConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const result1 = pipelineContract.execute({ signals: [createSignal({ signalId: "fixed-1" })] });
    const result2 = pipelineContract.execute({ signals: [createSignal({ signalId: "fixed-2" })] });

    const batchResult1 = batchContract.batch([result1, result2]);
    const batchResult2 = batchContract.batch([result1, result2]);

    expect(batchResult1.batchHash).toBe(batchResult2.batchHash);
  });

  it("should produce deterministic batchId for same inputs", () => {
    const batchContract = createGovernanceSignalLogConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const result1 = pipelineContract.execute({ signals: [createSignal({ signalId: "fixed-1" })] });
    const result2 = pipelineContract.execute({ signals: [createSignal({ signalId: "fixed-2" })] });

    const batchResult1 = batchContract.batch([result1, result2]);
    const batchResult2 = batchContract.batch([result1, result2]);

    expect(batchResult1.batchId).toBe(batchResult2.batchId);
  });

  // ─── Large Batch ────────────────────────────────────────────────────────────

  it("should handle large batch", () => {
    const batchContract = createGovernanceSignalLogConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const results = Array.from({ length: 10 }, () =>
      pipelineContract.execute({ signals: [createSignal({ signalType: "MONITOR" })] }),
    );

    const batchResult = batchContract.batch(results);

    expect(batchResult.totalLogs).toBe(10);
    expect(batchResult.totalSignals).toBe(10);
    expect(batchResult.overallDominantType).toBe("MONITOR");
  });

  // ─── Mixed Urgency and Type ─────────────────────────────────────────────────

  it("should handle mixed urgency and type correctly", () => {
    const batchContract = createGovernanceSignalLogConsumerPipelineBatchContract({
      now: mockNow,
    });
    const pipelineContract = createPipelineContract();

    const result1 = pipelineContract.execute({
      signals: [createSignal({ urgency: "CRITICAL", signalType: "ESCALATE" })],
    });
    const result2 = pipelineContract.execute({
      signals: [createSignal({ urgency: "LOW", signalType: "MONITOR" })],
    });
    const result3 = pipelineContract.execute({
      signals: [createSignal({ urgency: "HIGH", signalType: "TRIGGER_REVIEW" })],
    });

    const batchResult = batchContract.batch([result1, result2, result3]);

    expect(batchResult.overallDominantUrgency).toBe("CRITICAL");
    expect(batchResult.totalSignals).toBe(3);
  });
});
