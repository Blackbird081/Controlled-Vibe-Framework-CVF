import { describe, it, expect } from "vitest";
import {
  FeedbackLedgerConsumerPipelineContract,
  createFeedbackLedgerConsumerPipelineContract,
} from "../src/feedback.ledger.consumer.pipeline.contract";
import type {
  FeedbackLedgerConsumerPipelineRequest,
  FeedbackLedgerConsumerPipelineResult,
} from "../src/feedback.ledger.consumer.pipeline.contract";
import type { LearningFeedbackInput, FeedbackClass } from "../src/feedback.ledger.contract";

describe("FeedbackLedgerConsumerPipelineContract (W4-T17 CP1)", () => {
  const fixedNow = "2026-03-27T12:00:00.000Z";
  const mockNow = () => fixedNow;

  const createSignal = (
    feedbackClass: FeedbackClass,
    overrides?: Partial<LearningFeedbackInput>,
  ): LearningFeedbackInput => ({
    feedbackId: `feedback-${Math.random()}`,
    sourcePipelineId: "pipeline-1",
    feedbackClass,
    priority: "medium",
    confidenceBoost: 0.1,
    ...overrides,
  });

  // ─── Instantiation ──────────────────────────────────────────────────────────

  it("should instantiate with default dependencies", () => {
    const contract = new FeedbackLedgerConsumerPipelineContract();
    expect(contract).toBeInstanceOf(FeedbackLedgerConsumerPipelineContract);
  });

  it("should instantiate with custom dependencies", () => {
    const contract = new FeedbackLedgerConsumerPipelineContract({
      now: mockNow,
    });
    expect(contract).toBeInstanceOf(FeedbackLedgerConsumerPipelineContract);
  });

  it("should instantiate via factory", () => {
    const contract = createFeedbackLedgerConsumerPipelineContract();
    expect(contract).toBeInstanceOf(FeedbackLedgerConsumerPipelineContract);
  });

  it("should instantiate via factory with dependencies", () => {
    const contract = createFeedbackLedgerConsumerPipelineContract({
      now: mockNow,
    });
    expect(contract).toBeInstanceOf(FeedbackLedgerConsumerPipelineContract);
  });

  // ─── Output Shape ───────────────────────────────────────────────────────────

  it("should return result with all required fields", () => {
    const contract = createFeedbackLedgerConsumerPipelineContract({
      now: mockNow,
    });

    const request: FeedbackLedgerConsumerPipelineRequest = {
      signals: [createSignal("ACCEPT")],
    };

    const result: FeedbackLedgerConsumerPipelineResult =
      contract.execute(request);

    expect(result).toHaveProperty("resultId");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("feedbackLedger");
    expect(result).toHaveProperty("consumerPackage");
    expect(result).toHaveProperty("pipelineHash");
    expect(result).toHaveProperty("warnings");
    expect(result).toHaveProperty("consumerId");
  });

  it("should return feedbackLedger with correct shape", () => {
    const contract = createFeedbackLedgerConsumerPipelineContract({
      now: mockNow,
    });

    const request: FeedbackLedgerConsumerPipelineRequest = {
      signals: [createSignal("ACCEPT")],
    };

    const result = contract.execute(request);

    expect(result.feedbackLedger).toHaveProperty("ledgerId");
    expect(result.feedbackLedger).toHaveProperty("compiledAt");
    expect(result.feedbackLedger).toHaveProperty("records");
    expect(result.feedbackLedger).toHaveProperty("totalRecords");
    expect(result.feedbackLedger).toHaveProperty("acceptCount");
    expect(result.feedbackLedger).toHaveProperty("retryCount");
    expect(result.feedbackLedger).toHaveProperty("escalateCount");
    expect(result.feedbackLedger).toHaveProperty("rejectCount");
    expect(result.feedbackLedger).toHaveProperty("ledgerHash");
  });

  it("should return consumerPackage with correct shape", () => {
    const contract = createFeedbackLedgerConsumerPipelineContract({
      now: mockNow,
    });

    const request: FeedbackLedgerConsumerPipelineRequest = {
      signals: [createSignal("ACCEPT")],
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
    const contract = createFeedbackLedgerConsumerPipelineContract({
      now: mockNow,
    });

    const request: FeedbackLedgerConsumerPipelineRequest = {
      signals: [createSignal("ACCEPT")],
      consumerId: "consumer-123",
    };

    const result = contract.execute(request);
    expect(result.consumerId).toBe("consumer-123");
  });

  it("should return undefined consumerId when not provided", () => {
    const contract = createFeedbackLedgerConsumerPipelineContract({
      now: mockNow,
    });

    const request: FeedbackLedgerConsumerPipelineRequest = {
      signals: [createSignal("ACCEPT")],
    };

    const result = contract.execute(request);
    expect(result.consumerId).toBeUndefined();
  });

  // ─── Deterministic Hashing ──────────────────────────────────────────────────

  it("should produce deterministic pipelineHash for same inputs", () => {
    const contract = createFeedbackLedgerConsumerPipelineContract({
      now: mockNow,
    });

    const signal = createSignal("ACCEPT", { feedbackId: "fixed-id" });
    const request: FeedbackLedgerConsumerPipelineRequest = {
      signals: [signal],
    };

    const result1 = contract.execute(request);
    const result2 = contract.execute(request);

    expect(result1.pipelineHash).toBe(result2.pipelineHash);
  });

  it("should produce different pipelineHash for different signals", () => {
    const contract = createFeedbackLedgerConsumerPipelineContract({
      now: mockNow,
    });

    const request1: FeedbackLedgerConsumerPipelineRequest = {
      signals: [createSignal("ACCEPT", { feedbackId: "id-1" })],
    };

    const request2: FeedbackLedgerConsumerPipelineRequest = {
      signals: [createSignal("RETRY", { feedbackId: "id-2" })],
    };

    const result1 = contract.execute(request1);
    const result2 = contract.execute(request2);

    expect(result1.pipelineHash).not.toBe(result2.pipelineHash);
  });

  // ─── Query Derivation ───────────────────────────────────────────────────────

  it("should derive query with feedback counts", () => {
    const contract = createFeedbackLedgerConsumerPipelineContract({
      now: mockNow,
    });

    const request: FeedbackLedgerConsumerPipelineRequest = {
      signals: [
        createSignal("ACCEPT"),
        createSignal("ACCEPT"),
        createSignal("RETRY"),
        createSignal("ESCALATE"),
        createSignal("REJECT"),
      ],
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.query).toContain("Ledger:");
    expect(result.consumerPackage.query).toContain("5 feedback");
    expect(result.consumerPackage.query).toContain("2A");
    expect(result.consumerPackage.query).toContain("1R");
    expect(result.consumerPackage.query).toContain("1E");
    expect(result.consumerPackage.query).toContain("1X");
  });

  it("should truncate query to 120 characters", () => {
    const contract = createFeedbackLedgerConsumerPipelineContract({
      now: mockNow,
    });

    const signals = Array.from({ length: 1000 }, () => createSignal("ACCEPT"));

    const request: FeedbackLedgerConsumerPipelineRequest = {
      signals,
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
  });

  it("should handle empty signals", () => {
    const contract = createFeedbackLedgerConsumerPipelineContract({
      now: mockNow,
    });

    const request: FeedbackLedgerConsumerPipelineRequest = {
      signals: [],
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.query).toContain("0 feedback");
    expect(result.consumerPackage.query).toContain("0A/0R/0E/0X");
  });

  // ─── Warning Messages ───────────────────────────────────────────────────────

  it("should emit WARNING_FEEDBACK_REJECTED when rejectCount > 0", () => {
    const contract = createFeedbackLedgerConsumerPipelineContract({
      now: mockNow,
    });

    const request: FeedbackLedgerConsumerPipelineRequest = {
      signals: [
        createSignal("ACCEPT"),
        createSignal("REJECT"),
      ],
    };

    const result = contract.execute(request);

    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("rejected feedback");
  });

  it("should emit WARNING_HIGH_ESCALATION_RATE when escalateCount > 30%", () => {
    const contract = createFeedbackLedgerConsumerPipelineContract({
      now: mockNow,
    });

    const request: FeedbackLedgerConsumerPipelineRequest = {
      signals: [
        createSignal("ACCEPT"),
        createSignal("ACCEPT"),
        createSignal("ESCALATE"),
        createSignal("ESCALATE"),
      ],
    };

    const result = contract.execute(request);

    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("high escalation rate");
  });

  it("should emit both warnings when both conditions met", () => {
    const contract = createFeedbackLedgerConsumerPipelineContract({
      now: mockNow,
    });

    const request: FeedbackLedgerConsumerPipelineRequest = {
      signals: [
        createSignal("ACCEPT"),
        createSignal("ESCALATE"),
        createSignal("ESCALATE"),
        createSignal("REJECT"),
      ],
    };

    const result = contract.execute(request);

    expect(result.warnings).toHaveLength(2);
    expect(result.warnings[0]).toContain("rejected feedback");
    expect(result.warnings[1]).toContain("high escalation rate");
  });

  it("should not emit warnings for healthy feedback", () => {
    const contract = createFeedbackLedgerConsumerPipelineContract({
      now: mockNow,
    });

    const request: FeedbackLedgerConsumerPipelineRequest = {
      signals: [
        createSignal("ACCEPT"),
        createSignal("ACCEPT"),
        createSignal("RETRY"),
      ],
    };

    const result = contract.execute(request);

    expect(result.warnings).toHaveLength(0);
  });

  it("should not emit escalation warning at exactly 30%", () => {
    const contract = createFeedbackLedgerConsumerPipelineContract({
      now: mockNow,
    });

    const request: FeedbackLedgerConsumerPipelineRequest = {
      signals: [
        createSignal("ACCEPT"),
        createSignal("ACCEPT"),
        createSignal("ACCEPT"),
        createSignal("ACCEPT"),
        createSignal("ACCEPT"),
        createSignal("ACCEPT"),
        createSignal("ACCEPT"),
        createSignal("ESCALATE"),
        createSignal("ESCALATE"),
        createSignal("ESCALATE"),
      ],
    };

    const result = contract.execute(request);

    expect(result.warnings).toHaveLength(0);
  });

  // ─── feedbackLedger Propagation ────────────────────────────────────────────

  it("should use feedbackLedger.ledgerId as contextId", () => {
    const contract = createFeedbackLedgerConsumerPipelineContract({
      now: mockNow,
    });

    const request: FeedbackLedgerConsumerPipelineRequest = {
      signals: [createSignal("ACCEPT")],
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.contextId).toBe(result.feedbackLedger.ledgerId);
  });

  it("should compile signals into feedbackLedger", () => {
    const contract = createFeedbackLedgerConsumerPipelineContract({
      now: mockNow,
    });

    const request: FeedbackLedgerConsumerPipelineRequest = {
      signals: [
        createSignal("ACCEPT"),
        createSignal("RETRY"),
        createSignal("ESCALATE"),
      ],
    };

    const result = contract.execute(request);

    expect(result.feedbackLedger.totalRecords).toBe(3);
    expect(result.feedbackLedger.acceptCount).toBe(1);
    expect(result.feedbackLedger.retryCount).toBe(1);
    expect(result.feedbackLedger.escalateCount).toBe(1);
    expect(result.feedbackLedger.rejectCount).toBe(0);
  });

  // ─── consumerPackage Shape ──────────────────────────────────────────────────

  it("should pass candidateItems to consumer pipeline", () => {
    const contract = createFeedbackLedgerConsumerPipelineContract({
      now: mockNow,
    });

    const candidateItems = [
      { itemId: "item-1", title: "Title 1", content: "content-1", relevanceScore: 0.9, source: "test" },
      { itemId: "item-2", title: "Title 2", content: "content-2", relevanceScore: 0.8, source: "test" },
    ];

    const request: FeedbackLedgerConsumerPipelineRequest = {
      signals: [createSignal("ACCEPT")],
      candidateItems,
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.rankedKnowledgeResult.items).toHaveLength(2);
  });

  it("should handle empty candidateItems", () => {
    const contract = createFeedbackLedgerConsumerPipelineContract({
      now: mockNow,
    });

    const request: FeedbackLedgerConsumerPipelineRequest = {
      signals: [createSignal("ACCEPT")],
      candidateItems: [],
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.rankedKnowledgeResult.items).toHaveLength(0);
  });

  it("should handle undefined candidateItems", () => {
    const contract = createFeedbackLedgerConsumerPipelineContract({
      now: mockNow,
    });

    const request: FeedbackLedgerConsumerPipelineRequest = {
      signals: [createSignal("ACCEPT")],
    };

    const result = contract.execute(request);

    expect(result.consumerPackage.rankedKnowledgeResult.items).toHaveLength(0);
  });

  // ─── Mixed Feedback Classes ────────────────────────────────────────────────

  it("should handle all feedback classes", () => {
    const contract = createFeedbackLedgerConsumerPipelineContract({
      now: mockNow,
    });

    const feedbackClasses: FeedbackClass[] = ["ACCEPT", "RETRY", "ESCALATE", "REJECT"];

    const signals = feedbackClasses.map((feedbackClass) =>
      createSignal(feedbackClass),
    );

    const request: FeedbackLedgerConsumerPipelineRequest = {
      signals,
    };

    const result = contract.execute(request);

    expect(result.feedbackLedger.totalRecords).toBe(4);
    expect(result.feedbackLedger.acceptCount).toBe(1);
    expect(result.feedbackLedger.retryCount).toBe(1);
    expect(result.feedbackLedger.escalateCount).toBe(1);
    expect(result.feedbackLedger.rejectCount).toBe(1);
  });

  it("should handle large signal batches", () => {
    const contract = createFeedbackLedgerConsumerPipelineContract({
      now: mockNow,
    });

    const signals = Array.from({ length: 100 }, (_, i) =>
      createSignal(i % 2 === 0 ? "ACCEPT" : "RETRY"),
    );

    const request: FeedbackLedgerConsumerPipelineRequest = {
      signals,
    };

    const result = contract.execute(request);

    expect(result.feedbackLedger.totalRecords).toBe(100);
    expect(result.feedbackLedger.acceptCount).toBe(50);
    expect(result.feedbackLedger.retryCount).toBe(50);
  });
});


// ═══════════════════════════════════════════════════════════════════════════════
// W4-T17 CP2 — FeedbackLedgerConsumerPipelineBatchContract
// ═══════════════════════════════════════════════════════════════════════════════

import {
  FeedbackLedgerConsumerPipelineBatchContract,
  createFeedbackLedgerConsumerPipelineBatchContract,
} from "../src/feedback.ledger.consumer.pipeline.batch.contract";

describe("FeedbackLedgerConsumerPipelineBatchContract (W4-T17 CP2)", () => {
  const fixedNow = "2026-03-27T12:00:00.000Z";
  const mockNow = () => fixedNow;

  const createSignal = (
    feedbackClass: FeedbackClass,
    overrides?: Partial<LearningFeedbackInput>,
  ): LearningFeedbackInput => ({
    feedbackId: `feedback-${Math.random()}`,
    sourcePipelineId: "pipeline-1",
    feedbackClass,
    priority: "medium",
    confidenceBoost: 0.1,
    ...overrides,
  });

  // ─── Instantiation ──────────────────────────────────────────────────────────

  it("should instantiate with default dependencies", () => {
    const contract = new FeedbackLedgerConsumerPipelineBatchContract();
    expect(contract).toBeInstanceOf(FeedbackLedgerConsumerPipelineBatchContract);
  });

  it("should instantiate with custom dependencies", () => {
    const contract = new FeedbackLedgerConsumerPipelineBatchContract({
      now: mockNow,
    });
    expect(contract).toBeInstanceOf(FeedbackLedgerConsumerPipelineBatchContract);
  });

  it("should instantiate via factory", () => {
    const contract = createFeedbackLedgerConsumerPipelineBatchContract();
    expect(contract).toBeInstanceOf(FeedbackLedgerConsumerPipelineBatchContract);
  });

  it("should instantiate via factory with dependencies", () => {
    const contract = createFeedbackLedgerConsumerPipelineBatchContract({
      now: mockNow,
    });
    expect(contract).toBeInstanceOf(FeedbackLedgerConsumerPipelineBatchContract);
  });

  // ─── Output Shape ───────────────────────────────────────────────────────────

  it("should return batch result with all required fields", () => {
    const batchContract = createFeedbackLedgerConsumerPipelineBatchContract({
      now: mockNow,
    });

    const pipelineContract = createFeedbackLedgerConsumerPipelineContract({
      now: mockNow,
    });

    const result1 = pipelineContract.execute({
      signals: [createSignal("ACCEPT")],
    });

    const batchResult = batchContract.execute([result1]);

    expect(batchResult).toHaveProperty("batchId");
    expect(batchResult).toHaveProperty("createdAt");
    expect(batchResult).toHaveProperty("totalResults");
    expect(batchResult).toHaveProperty("dominantTokenBudget");
    expect(batchResult).toHaveProperty("totalFeedbackCount");
    expect(batchResult).toHaveProperty("feedbackClassCounts");
    expect(batchResult).toHaveProperty("batchHash");
  });

  // ─── Empty Batch ────────────────────────────────────────────────────────────

  it("should handle empty batch", () => {
    const contract = createFeedbackLedgerConsumerPipelineBatchContract({
      now: mockNow,
    });

    const batchResult = contract.execute([]);

    expect(batchResult.totalResults).toBe(0);
    expect(batchResult.dominantTokenBudget).toBe(0);
    expect(batchResult.totalFeedbackCount).toBe(0);
    expect(batchResult.batchHash).toBeTruthy();
  });

  // ─── totalResults ───────────────────────────────────────────────────────────

  it("should count totalResults correctly", () => {
    const batchContract = createFeedbackLedgerConsumerPipelineBatchContract({
      now: mockNow,
    });

    const pipelineContract = createFeedbackLedgerConsumerPipelineContract({
      now: mockNow,
    });

    const results = [
      pipelineContract.execute({ signals: [createSignal("ACCEPT")] }),
      pipelineContract.execute({ signals: [createSignal("RETRY")] }),
      pipelineContract.execute({ signals: [createSignal("ESCALATE")] }),
    ];

    const batchResult = batchContract.execute(results);

    expect(batchResult.totalResults).toBe(3);
  });

  // ─── dominantTokenBudget ────────────────────────────────────────────────────

  it("should calculate dominantTokenBudget as max estimatedTokens", () => {
    const batchContract = createFeedbackLedgerConsumerPipelineBatchContract({
      now: mockNow,
    });

    const pipelineContract = createFeedbackLedgerConsumerPipelineContract({
      now: mockNow,
    });

    const results = [
      pipelineContract.execute({ signals: [createSignal("ACCEPT")] }),
      pipelineContract.execute({ signals: Array.from({ length: 10 }, () => createSignal("RETRY")) }),
      pipelineContract.execute({ signals: [createSignal("ESCALATE")] }),
    ];

    const batchResult = batchContract.execute(results);

    const maxTokens = Math.max(
      ...results.map((r) => r.consumerPackage.typedContextPackage.estimatedTokens),
    );

    expect(batchResult.dominantTokenBudget).toBe(maxTokens);
  });

  // ─── totalFeedbackCount ─────────────────────────────────────────────────────

  it("should sum totalFeedbackCount from all results", () => {
    const batchContract = createFeedbackLedgerConsumerPipelineBatchContract({
      now: mockNow,
    });

    const pipelineContract = createFeedbackLedgerConsumerPipelineContract({
      now: mockNow,
    });

    const results = [
      pipelineContract.execute({ signals: [createSignal("ACCEPT"), createSignal("ACCEPT")] }),
      pipelineContract.execute({ signals: [createSignal("RETRY")] }),
      pipelineContract.execute({ signals: [createSignal("ESCALATE"), createSignal("REJECT")] }),
    ];

    const batchResult = batchContract.execute(results);

    const expectedTotal = results.reduce(
      (sum, r) => sum + r.feedbackLedger.totalRecords,
      0,
    );

    expect(batchResult.totalFeedbackCount).toBe(expectedTotal);
    expect(batchResult.totalFeedbackCount).toBe(5);
  });

  it("should have totalFeedbackCount of 0 for empty batch", () => {
    const contract = createFeedbackLedgerConsumerPipelineBatchContract({
      now: mockNow,
    });

    const batchResult = contract.execute([]);

    expect(batchResult.totalFeedbackCount).toBe(0);
  });

  // ─── feedbackClassCounts ────────────────────────────────────────────────────

  it("should aggregate feedbackClassCounts correctly", () => {
    const batchContract = createFeedbackLedgerConsumerPipelineBatchContract({
      now: mockNow,
    });

    const pipelineContract = createFeedbackLedgerConsumerPipelineContract({
      now: mockNow,
    });

    const results = [
      pipelineContract.execute({ signals: [createSignal("ACCEPT"), createSignal("ACCEPT")] }),
      pipelineContract.execute({ signals: [createSignal("RETRY")] }),
      pipelineContract.execute({ signals: [createSignal("ESCALATE"), createSignal("REJECT")] }),
    ];

    const batchResult = batchContract.execute(results);

    expect(batchResult.feedbackClassCounts.acceptCount).toBe(2);
    expect(batchResult.feedbackClassCounts.retryCount).toBe(1);
    expect(batchResult.feedbackClassCounts.escalateCount).toBe(1);
    expect(batchResult.feedbackClassCounts.rejectCount).toBe(1);
  });

  it("should initialize all feedbackClassCounts to 0 for empty batch", () => {
    const contract = createFeedbackLedgerConsumerPipelineBatchContract({
      now: mockNow,
    });

    const batchResult = contract.execute([]);

    expect(batchResult.feedbackClassCounts.acceptCount).toBe(0);
    expect(batchResult.feedbackClassCounts.retryCount).toBe(0);
    expect(batchResult.feedbackClassCounts.escalateCount).toBe(0);
    expect(batchResult.feedbackClassCounts.rejectCount).toBe(0);
  });

  // ─── Deterministic Hashing ──────────────────────────────────────────────────

  it("should produce deterministic batchHash for same inputs", () => {
    const batchContract = createFeedbackLedgerConsumerPipelineBatchContract({
      now: mockNow,
    });

    const pipelineContract = createFeedbackLedgerConsumerPipelineContract({
      now: mockNow,
    });

    const signal = createSignal("ACCEPT", { feedbackId: "fixed-id" });
    const results = [
      pipelineContract.execute({ signals: [signal] }),
    ];

    const batchResult1 = batchContract.execute(results);
    const batchResult2 = batchContract.execute(results);

    expect(batchResult1.batchHash).toBe(batchResult2.batchHash);
  });

  it("should produce different batchHash for different results", () => {
    const batchContract = createFeedbackLedgerConsumerPipelineBatchContract({
      now: mockNow,
    });

    const pipelineContract = createFeedbackLedgerConsumerPipelineContract({
      now: mockNow,
    });

    const results1 = [
      pipelineContract.execute({ signals: [createSignal("ACCEPT", { feedbackId: "id-1" })] }),
    ];

    const results2 = [
      pipelineContract.execute({ signals: [createSignal("RETRY", { feedbackId: "id-2" })] }),
    ];

    const batchResult1 = batchContract.execute(results1);
    const batchResult2 = batchContract.execute(results2);

    expect(batchResult1.batchHash).not.toBe(batchResult2.batchHash);
  });

  // ─── Mixed Scenarios ────────────────────────────────────────────────────────

  it("should handle single result batch", () => {
    const batchContract = createFeedbackLedgerConsumerPipelineBatchContract({
      now: mockNow,
    });

    const pipelineContract = createFeedbackLedgerConsumerPipelineContract({
      now: mockNow,
    });

    const result = pipelineContract.execute({
      signals: [createSignal("ACCEPT")],
    });

    const batchResult = batchContract.execute([result]);

    expect(batchResult.totalResults).toBe(1);
    expect(batchResult.dominantTokenBudget).toBe(
      result.consumerPackage.typedContextPackage.estimatedTokens,
    );
    expect(batchResult.totalFeedbackCount).toBe(result.feedbackLedger.totalRecords);
    expect(batchResult.feedbackClassCounts.acceptCount).toBe(1);
  });

  it("should handle large batch", () => {
    const batchContract = createFeedbackLedgerConsumerPipelineBatchContract({
      now: mockNow,
    });

    const pipelineContract = createFeedbackLedgerConsumerPipelineContract({
      now: mockNow,
    });

    const results = Array.from({ length: 50 }, (_, i) =>
      pipelineContract.execute({
        signals: [createSignal(i % 2 === 0 ? "ACCEPT" : "RETRY")],
      }),
    );

    const batchResult = batchContract.execute(results);

    expect(batchResult.totalResults).toBe(50);
    expect(batchResult.feedbackClassCounts.acceptCount).toBe(25);
    expect(batchResult.feedbackClassCounts.retryCount).toBe(25);
  });
});
