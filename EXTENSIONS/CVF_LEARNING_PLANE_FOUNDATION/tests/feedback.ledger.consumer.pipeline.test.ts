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
