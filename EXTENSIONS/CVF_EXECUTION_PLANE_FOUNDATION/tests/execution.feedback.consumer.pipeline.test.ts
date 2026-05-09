import { describe, it, expect } from "vitest";
import {
  ExecutionFeedbackConsumerPipelineContract,
  createExecutionFeedbackConsumerPipelineContract,
} from "../src/execution.feedback.consumer.pipeline.contract";
import type { ExecutionObservation } from "../src/execution.observer.contract";

// ─── W2-T11 CP1: ExecutionFeedbackConsumerPipelineContract ───────────────────

const FIXED_NOW = () => "2026-03-24T08:00:00.000Z";

const SUCCESS_OBSERVATION: ExecutionObservation = {
  observationId: "obs-success-001",
  createdAt: "2026-03-24T07:00:00.000Z",
  sourcePipelineId: "pipeline-001",
  outcomeClass: "SUCCESS",
  confidenceSignal: 0.9,
  totalEntries: 5,
  executedCount: 5,
  failedCount: 0,
  sandboxedCount: 0,
  skippedCount: 0,
  notes: [],
  observationHash: "obs-hash-success-001",
};

const FAILED_OBSERVATION: ExecutionObservation = {
  observationId: "obs-failed-001",
  createdAt: "2026-03-24T07:00:00.000Z",
  sourcePipelineId: "pipeline-002",
  outcomeClass: "FAILED",
  confidenceSignal: 0.1,
  totalEntries: 5,
  executedCount: 2,
  failedCount: 3,
  sandboxedCount: 0,
  skippedCount: 0,
  notes: [],
  observationHash: "obs-hash-failed-001",
};

const PARTIAL_OBSERVATION: ExecutionObservation = {
  observationId: "obs-partial-001",
  createdAt: "2026-03-24T07:00:00.000Z",
  sourcePipelineId: "pipeline-003",
  outcomeClass: "PARTIAL",
  confidenceSignal: 0.5,
  totalEntries: 5,
  executedCount: 3,
  failedCount: 0,
  sandboxedCount: 0,
  skippedCount: 2,
  notes: [],
  observationHash: "obs-hash-partial-001",
};

const CANDIDATE_ITEMS = [
  {
    itemId: "item-1",
    title: "Execution Feedback Patterns",
    content: "Feedback signals drive consumer pipeline enrichment.",
    source: "docs",
    relevanceScore: 0.9,
    tier: "T1" as const,
    recencyScore: 0.85,
  },
];

describe("W2-T11 CP1: ExecutionFeedbackConsumerPipelineContract", () => {
  it("createExecutionFeedbackConsumerPipelineContract returns an instance", () => {
    expect(createExecutionFeedbackConsumerPipelineContract()).toBeInstanceOf(
      ExecutionFeedbackConsumerPipelineContract,
    );
  });

  it("execute returns a result with all required fields", () => {
    const contract = createExecutionFeedbackConsumerPipelineContract({
      now: FIXED_NOW,
    });
    const result = contract.execute({ observation: SUCCESS_OBSERVATION });

    expect(result.resultId).toBeDefined();
    expect(typeof result.resultId).toBe("string");
    expect(result.createdAt).toBe("2026-03-24T08:00:00.000Z");
    expect(result.feedbackSignal).toBeDefined();
    expect(result.consumerPackage).toBeDefined();
    expect(result.pipelineHash).toBeDefined();
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it("execute propagates consumerId from request", () => {
    const contract = createExecutionFeedbackConsumerPipelineContract({
      now: FIXED_NOW,
    });
    const result = contract.execute({
      observation: SUCCESS_OBSERVATION,
      consumerId: "consumer-001",
    });
    expect(result.consumerId).toBe("consumer-001");
  });

  it("execute consumerId is undefined when not provided", () => {
    const contract = createExecutionFeedbackConsumerPipelineContract({
      now: FIXED_NOW,
    });
    const result = contract.execute({ observation: SUCCESS_OBSERVATION });
    expect(result.consumerId).toBeUndefined();
  });

  it("execute generates ACCEPT feedbackClass for SUCCESS observation", () => {
    const contract = createExecutionFeedbackConsumerPipelineContract({
      now: FIXED_NOW,
    });
    const result = contract.execute({ observation: SUCCESS_OBSERVATION });
    expect(result.feedbackSignal.feedbackClass).toBe("ACCEPT");
  });

  it("execute generates ESCALATE feedbackClass for FAILED observation", () => {
    const contract = createExecutionFeedbackConsumerPipelineContract({
      now: FIXED_NOW,
    });
    const result = contract.execute({ observation: FAILED_OBSERVATION });
    expect(result.feedbackSignal.feedbackClass).toBe("ESCALATE");
  });

  it("execute generates RETRY feedbackClass for PARTIAL observation", () => {
    const contract = createExecutionFeedbackConsumerPipelineContract({
      now: FIXED_NOW,
    });
    const result = contract.execute({ observation: PARTIAL_OBSERVATION });
    expect(result.feedbackSignal.feedbackClass).toBe("RETRY");
  });

  it("execute uses feedbackId as contextId in consumerPackage", () => {
    const contract = createExecutionFeedbackConsumerPipelineContract({
      now: FIXED_NOW,
    });
    const result = contract.execute({ observation: SUCCESS_OBSERVATION });
    expect(result.consumerPackage.contextId).toBe(
      result.feedbackSignal.feedbackId,
    );
  });

  it("execute derives query from feedbackSignal.rationale (max 120 chars)", () => {
    const contract = createExecutionFeedbackConsumerPipelineContract({
      now: FIXED_NOW,
    });
    const result = contract.execute({ observation: SUCCESS_OBSERVATION });
    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
    expect(result.consumerPackage.query).toBe(
      result.feedbackSignal.rationale.slice(0, 120),
    );
  });

  it("execute accepts candidateItems and passes them to consumerPackage", () => {
    const contract = createExecutionFeedbackConsumerPipelineContract({
      now: FIXED_NOW,
    });
    const result = contract.execute({
      observation: SUCCESS_OBSERVATION,
      candidateItems: CANDIDATE_ITEMS,
    });
    expect(result.consumerPackage.rankedKnowledgeResult.totalRanked).toBe(1);
  });

  it("execute produces deterministic pipelineHash given fixed now", () => {
    const contract = createExecutionFeedbackConsumerPipelineContract({
      now: FIXED_NOW,
    });
    const r1 = contract.execute({ observation: SUCCESS_OBSERVATION });
    const r2 = contract.execute({ observation: SUCCESS_OBSERVATION });
    expect(r1.pipelineHash).toBe(r2.pipelineHash);
    expect(r1.resultId).toBe(r2.resultId);
  });

  it("execute produces no warnings for ACCEPT feedbackClass", () => {
    const contract = createExecutionFeedbackConsumerPipelineContract({
      now: FIXED_NOW,
    });
    const result = contract.execute({ observation: SUCCESS_OBSERVATION });
    expect(result.warnings).toHaveLength(0);
  });

  it("execute produces escalation warning for FAILED (ESCALATE) observation", () => {
    const contract = createExecutionFeedbackConsumerPipelineContract({
      now: FIXED_NOW,
    });
    const result = contract.execute({ observation: FAILED_OBSERVATION });
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[feedback]");
    expect(result.warnings[0]).toContain("escalation");
  });

  it("execute produces no warnings for PARTIAL (RETRY) observation", () => {
    const contract = createExecutionFeedbackConsumerPipelineContract({
      now: FIXED_NOW,
    });
    const result = contract.execute({ observation: PARTIAL_OBSERVATION });
    expect(result.warnings).toHaveLength(0);
  });

  it("pipelineHash differs from feedbackHash and consumerPackage.pipelineHash", () => {
    const contract = createExecutionFeedbackConsumerPipelineContract({
      now: FIXED_NOW,
    });
    const result = contract.execute({ observation: SUCCESS_OBSERVATION });
    expect(result.pipelineHash).not.toBe(result.feedbackSignal.feedbackHash);
    expect(result.pipelineHash).not.toBe(result.consumerPackage.pipelineHash);
  });

  it("resultId is derived from pipelineHash and differs from pipelineHash", () => {
    const contract = createExecutionFeedbackConsumerPipelineContract({
      now: FIXED_NOW,
    });
    const result = contract.execute({ observation: SUCCESS_OBSERVATION });
    expect(result.resultId).not.toBe(result.pipelineHash);
    expect(result.resultId.length).toBeGreaterThan(0);
  });

  it("different observations produce different resultIds", () => {
    const contract = createExecutionFeedbackConsumerPipelineContract({
      now: FIXED_NOW,
    });
    const r1 = contract.execute({ observation: SUCCESS_OBSERVATION });
    const r2 = contract.execute({ observation: FAILED_OBSERVATION });
    expect(r1.resultId).not.toBe(r2.resultId);
  });

  it("consumerPackage has typedContextPackage with estimatedTokens >= 0", () => {
    const contract = createExecutionFeedbackConsumerPipelineContract({
      now: FIXED_NOW,
    });
    const result = contract.execute({ observation: SUCCESS_OBSERVATION });
    expect(
      result.consumerPackage.typedContextPackage.estimatedTokens,
    ).toBeGreaterThanOrEqual(0);
  });
});
