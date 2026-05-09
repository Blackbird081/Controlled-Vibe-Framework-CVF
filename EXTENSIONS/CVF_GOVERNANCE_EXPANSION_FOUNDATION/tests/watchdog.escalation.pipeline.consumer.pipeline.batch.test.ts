import { describe, it, expect } from "vitest";
import {
  WatchdogEscalationPipelineConsumerPipelineBatchContract,
  createWatchdogEscalationPipelineConsumerPipelineBatchContract,
} from "../src/watchdog.escalation.pipeline.consumer.pipeline.batch.contract";
import { createWatchdogEscalationPipelineConsumerPipelineContract } from "../src/watchdog.escalation.pipeline.consumer.pipeline.contract";
import type { WatchdogEscalationPipelineConsumerPipelineResult } from "../src/watchdog.escalation.pipeline.consumer.pipeline.contract";
import type { WatchdogObservabilityInput, WatchdogExecutionInput } from "../src/watchdog.pulse.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeResult(
  dominantHealth: WatchdogObservabilityInput["dominantHealth"] = "HEALTHY",
  dominantStatus: WatchdogExecutionInput["dominantStatus"] = "COMPLETED",
  index = 0,
): WatchdogEscalationPipelineConsumerPipelineResult {
  const ts = `2026-03-24T10:0${index}:00.000Z`;
  const contract = createWatchdogEscalationPipelineConsumerPipelineContract({ now: () => ts });
  const criticalCount = dominantHealth === "CRITICAL" ? 1 : 0;
  const failedCount = dominantStatus === "FAILED" ? 1 : 0;
  return contract.execute({
    observabilityInput: { snapshotId: `snap-${index}`, dominantHealth, criticalCount, degradedCount: 0 },
    executionInput: { summaryId: `exec-${index}`, dominantStatus, failedCount, runningCount: 0 },
  });
}

function fixedNow(ts = "2026-03-24T10:00:00.000Z"): () => string {
  return () => ts;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("WatchdogEscalationPipelineConsumerPipelineBatchContract", () => {
  it("is instantiable via factory", () => {
    const contract = createWatchdogEscalationPipelineConsumerPipelineBatchContract({ now: fixedNow() });
    expect(contract).toBeInstanceOf(WatchdogEscalationPipelineConsumerPipelineBatchContract);
  });

  it("empty batch — dominantTokenBudget is 0, totalResults is 0", () => {
    const contract = createWatchdogEscalationPipelineConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([]);

    expect(batch.dominantTokenBudget).toBe(0);
    expect(batch.totalResults).toBe(0);
    expect(batch.escalationActiveResultCount).toBe(0);
  });

  it("empty batch — batchHash and batchId are valid non-empty strings", () => {
    const contract = createWatchdogEscalationPipelineConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([]);

    expect(batch.batchHash).toBeTruthy();
    expect(batch.batchId).toBeTruthy();
  });

  it("batchId differs from batchHash", () => {
    const contract = createWatchdogEscalationPipelineConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([makeResult()]);

    expect(batch.batchId).not.toBe(batch.batchHash);
  });

  it("escalationActiveResultCount counts CRITICAL/FAILED (escalationActive=true) results", () => {
    const contract = createWatchdogEscalationPipelineConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([
      makeResult("CRITICAL", "FAILED", 0),
      makeResult("HEALTHY", "COMPLETED", 1),
      makeResult("CRITICAL", "FAILED", 2),
    ]);

    expect(batch.escalationActiveResultCount).toBe(2);
  });

  it("escalationActiveResultCount is 0 for all healthy/nominal results", () => {
    const contract = createWatchdogEscalationPipelineConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([
      makeResult("HEALTHY", "COMPLETED", 0),
      makeResult("HEALTHY", "COMPLETED", 1),
    ]);

    expect(batch.escalationActiveResultCount).toBe(0);
  });

  it("dominantTokenBudget is the max estimatedTokens across results", () => {
    const contract = createWatchdogEscalationPipelineConsumerPipelineBatchContract({ now: fixedNow() });
    const results = [makeResult("HEALTHY", "COMPLETED", 0), makeResult("CRITICAL", "FAILED", 1)];
    const batch = contract.batch(results);

    const expected = Math.max(
      ...results.map((r) => r.consumerPackage.typedContextPackage.estimatedTokens),
    );
    expect(batch.dominantTokenBudget).toBe(expected);
  });

  it("is deterministic — same results yield same batchHash", () => {
    const contract = createWatchdogEscalationPipelineConsumerPipelineBatchContract({ now: fixedNow() });
    const results = [makeResult("HEALTHY", "COMPLETED", 0)];
    const b1 = contract.batch(results);
    const b2 = contract.batch(results);

    expect(b1.batchHash).toBe(b2.batchHash);
    expect(b1.batchId).toBe(b2.batchId);
  });

  it("totalResults matches input length", () => {
    const contract = createWatchdogEscalationPipelineConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([
      makeResult("HEALTHY", "COMPLETED", 0),
      makeResult("CRITICAL", "FAILED", 1),
      makeResult("DEGRADED", "RUNNING", 2),
    ]);

    expect(batch.totalResults).toBe(3);
  });

  it("results array is preserved in batch output", () => {
    const contract = createWatchdogEscalationPipelineConsumerPipelineBatchContract({ now: fixedNow() });
    const results = [makeResult("HEALTHY", "COMPLETED", 0), makeResult("CRITICAL", "FAILED", 1)];
    const batch = contract.batch(results);

    expect(batch.results).toHaveLength(2);
    expect(batch.results[0].pipelineResult.escalationActive).toBe(false);
    expect(batch.results[1].pipelineResult.escalationActive).toBe(true);
  });

  it("createdAt matches injected now", () => {
    const ts = "2026-03-24T12:00:00.000Z";
    const contract = createWatchdogEscalationPipelineConsumerPipelineBatchContract({ now: fixedNow(ts) });
    const batch = contract.batch([]);

    expect(batch.createdAt).toBe(ts);
  });

  it("single CRITICAL/FAILED result — escalationActiveResultCount is 1", () => {
    const contract = createWatchdogEscalationPipelineConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([makeResult("CRITICAL", "FAILED", 0)]);

    expect(batch.escalationActiveResultCount).toBe(1);
  });

  it("direct instantiation works identically to factory", () => {
    const now = fixedNow();
    const direct = new WatchdogEscalationPipelineConsumerPipelineBatchContract({ now });
    const via = createWatchdogEscalationPipelineConsumerPipelineBatchContract({ now });

    const results = [makeResult("HEALTHY", "COMPLETED", 0)];
    const b1 = direct.batch(results);
    const b2 = via.batch(results);

    expect(b1.batchHash).toBe(b2.batchHash);
  });
});
