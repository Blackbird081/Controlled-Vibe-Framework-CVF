import { describe, it, expect } from "vitest";
import {
  ExecutionAuditSummaryConsumerPipelineBatchContract,
  createExecutionAuditSummaryConsumerPipelineBatchContract,
} from "../src/execution.audit.summary.consumer.pipeline.batch.contract";
import { createExecutionAuditSummaryConsumerPipelineContract } from "../src/execution.audit.summary.consumer.pipeline.contract";
import type { ExecutionAuditSummaryConsumerPipelineResult } from "../src/execution.audit.summary.consumer.pipeline.contract";
import type { ExecutionObservation } from "../src/execution.observer.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fixedNow(ts = "2026-03-24T10:00:00.000Z"): () => string {
  return () => ts;
}

function makeObservation(
  outcomeClass: ExecutionObservation["outcomeClass"] = "SUCCESS",
  overrides: Partial<ExecutionObservation> = {},
): ExecutionObservation {
  return {
    observationId: "obs-001",
    createdAt: "2026-03-24T10:00:00.000Z",
    sourcePipelineId: "pipeline-001",
    outcomeClass,
    confidenceSignal: 0.9,
    totalEntries: 5,
    executedCount: 5,
    failedCount: 0,
    sandboxedCount: 0,
    skippedCount: 0,
    notes: [],
    observationHash: "hash-obs-001",
    ...overrides,
  };
}

function makeResult(
  outcomeClass: ExecutionObservation["outcomeClass"] = "SUCCESS",
): ExecutionAuditSummaryConsumerPipelineResult {
  const contract = createExecutionAuditSummaryConsumerPipelineContract({ now: fixedNow() });
  const failedCount = outcomeClass === "FAILED" ? 1 : 0;
  return contract.execute({
    observations: [makeObservation(outcomeClass, { failedCount })],
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ExecutionAuditSummaryConsumerPipelineBatchContract", () => {
  it("batches an empty array correctly", () => {
    const contract = createExecutionAuditSummaryConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([]);

    expect(batch.totalResults).toBe(0);
    expect(batch.dominantTokenBudget).toBe(0);
    expect(batch.highRiskResultCount).toBe(0);
    expect(batch.mediumRiskResultCount).toBe(0);
    expect(batch.batchHash).toBeTruthy();
    expect(batch.batchId).toBeTruthy();
    expect(batch.results).toEqual([]);
  });

  it("counts highRiskResultCount from FAILED-dominant results", () => {
    const contract = createExecutionAuditSummaryConsumerPipelineBatchContract({ now: fixedNow() });
    const r1 = makeResult("FAILED");
    const r2 = makeResult("FAILED");
    const r3 = makeResult("SUCCESS");
    const batch = contract.batch([r1, r2, r3]);

    expect(batch.highRiskResultCount).toBe(2);
    expect(batch.mediumRiskResultCount).toBe(0);
    expect(batch.totalResults).toBe(3);
  });

  it("counts mediumRiskResultCount from GATED-dominant results", () => {
    const contract = createExecutionAuditSummaryConsumerPipelineBatchContract({ now: fixedNow() });
    const r1 = makeResult("GATED");
    const r2 = makeResult("GATED");
    const r3 = makeResult("PARTIAL");
    const batch = contract.batch([r1, r2, r3]);

    expect(batch.mediumRiskResultCount).toBe(2);
    expect(batch.highRiskResultCount).toBe(0);
  });

  it("counts mediumRiskResultCount from SANDBOXED-dominant results", () => {
    const contract = createExecutionAuditSummaryConsumerPipelineBatchContract({ now: fixedNow() });
    const r1 = makeResult("SANDBOXED");
    const batch = contract.batch([r1]);

    expect(batch.mediumRiskResultCount).toBe(1);
    expect(batch.highRiskResultCount).toBe(0);
  });

  it("dominantTokenBudget is max estimatedTokens across results", () => {
    const contract = createExecutionAuditSummaryConsumerPipelineBatchContract({ now: fixedNow() });
    const r1 = makeResult("SUCCESS");
    const r2 = makeResult("GATED");
    const batch = contract.batch([r1, r2]);

    const expectedMax = Math.max(
      r1.consumerPackage.typedContextPackage.estimatedTokens,
      r2.consumerPackage.typedContextPackage.estimatedTokens,
    );
    expect(batch.dominantTokenBudget).toBe(expectedMax);
  });

  it("dominantTokenBudget is 0 for empty batch", () => {
    const contract = createExecutionAuditSummaryConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([]);

    expect(batch.dominantTokenBudget).toBe(0);
  });

  it("batchId differs from batchHash", () => {
    const contract = createExecutionAuditSummaryConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([makeResult("SUCCESS")]);

    expect(batch.batchId).not.toBe(batch.batchHash);
  });

  it("results are preserved in output batch", () => {
    const contract = createExecutionAuditSummaryConsumerPipelineBatchContract({ now: fixedNow() });
    const r1 = makeResult("SUCCESS");
    const r2 = makeResult("FAILED");
    const batch = contract.batch([r1, r2]);

    expect(batch.results).toHaveLength(2);
    expect(batch.results[0].resultId).toBe(r1.resultId);
    expect(batch.results[1].resultId).toBe(r2.resultId);
  });

  it("is deterministic — same inputs produce identical batch hashes", () => {
    const contract = createExecutionAuditSummaryConsumerPipelineBatchContract({ now: fixedNow() });
    const r1 = makeResult("SUCCESS");
    const b1 = contract.batch([r1]);
    const b2 = contract.batch([r1]);

    expect(b1.batchHash).toBe(b2.batchHash);
    expect(b1.batchId).toBe(b2.batchId);
  });

  it("different results produce different batchHash", () => {
    const contract = createExecutionAuditSummaryConsumerPipelineBatchContract({ now: fixedNow() });
    const b1 = contract.batch([makeResult("SUCCESS")]);
    const b2 = contract.batch([makeResult("FAILED")]);

    expect(b1.batchHash).not.toBe(b2.batchHash);
  });

  it("factory creates a working contract", () => {
    const contract = createExecutionAuditSummaryConsumerPipelineBatchContract({ now: fixedNow() });
    expect(contract).toBeInstanceOf(ExecutionAuditSummaryConsumerPipelineBatchContract);
    const batch = contract.batch([makeResult()]);
    expect(batch.batchHash).toBeTruthy();
  });

  it("createdAt is set from injected now()", () => {
    const contract = createExecutionAuditSummaryConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([makeResult()]);

    expect(batch.createdAt).toBe("2026-03-24T10:00:00.000Z");
  });

  it("NONE-risk and LOW-risk results do not increment highRisk or mediumRisk counts", () => {
    const contract = createExecutionAuditSummaryConsumerPipelineBatchContract({ now: fixedNow() });
    const rSuccess = makeResult("SUCCESS");
    const rPartial = makeResult("PARTIAL");
    const batch = contract.batch([rSuccess, rPartial]);

    expect(batch.highRiskResultCount).toBe(0);
    expect(batch.mediumRiskResultCount).toBe(0);
    expect(batch.totalResults).toBe(2);
  });
});
