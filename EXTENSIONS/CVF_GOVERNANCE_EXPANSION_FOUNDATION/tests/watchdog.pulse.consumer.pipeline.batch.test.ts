import { describe, it, expect } from "vitest";
import {
  WatchdogPulseConsumerPipelineBatchContract,
  createWatchdogPulseConsumerPipelineBatchContract,
} from "../src/watchdog.pulse.consumer.pipeline.batch.contract";
import { createWatchdogPulseConsumerPipelineContract } from "../src/watchdog.pulse.consumer.pipeline.contract";
import type { WatchdogPulseConsumerPipelineResult } from "../src/watchdog.pulse.consumer.pipeline.contract";
import type {
  WatchdogObservabilityInput,
  WatchdogExecutionInput,
} from "../src/watchdog.pulse.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIXED_TS = "2026-03-25T10:00:00.000Z";

function fixedNow(ts = FIXED_TS): () => string {
  return () => ts;
}

function makeResult(
  dominantHealth: WatchdogObservabilityInput["dominantHealth"] = "HEALTHY",
  dominantStatus: WatchdogExecutionInput["dominantStatus"] = "COMPLETED",
  criticalCount = 0,
  failedCount = 0,
): WatchdogPulseConsumerPipelineResult {
  const contract = createWatchdogPulseConsumerPipelineContract({ now: fixedNow() });
  return contract.execute({
    observabilityInput: {
      snapshotId: "snap-001",
      dominantHealth,
      criticalCount,
      degradedCount: 0,
    },
    executionInput: {
      summaryId: "sum-001",
      dominantStatus,
      failedCount,
      runningCount: 0,
    },
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("WatchdogPulseConsumerPipelineBatchContract", () => {
  it("batch returns a batch with batchId, batchHash, and totalResults", () => {
    const contract = createWatchdogPulseConsumerPipelineBatchContract({ now: fixedNow() });
    const result = contract.batch([makeResult()]);

    expect(result.batchId).toBeTruthy();
    expect(result.batchHash).toBeTruthy();
    expect(result.totalResults).toBe(1);
  });

  it("batchId differs from batchHash", () => {
    const contract = createWatchdogPulseConsumerPipelineBatchContract({ now: fixedNow() });
    const result = contract.batch([makeResult()]);

    expect(result.batchId).not.toBe(result.batchHash);
  });

  it("empty batch has totalResults 0 and dominantTokenBudget 0", () => {
    const contract = createWatchdogPulseConsumerPipelineBatchContract({ now: fixedNow() });
    const result = contract.batch([]);

    expect(result.totalResults).toBe(0);
    expect(result.dominantTokenBudget).toBe(0);
  });

  it("empty batch still has valid batchId and batchHash", () => {
    const contract = createWatchdogPulseConsumerPipelineBatchContract({ now: fixedNow() });
    const result = contract.batch([]);

    expect(result.batchId).toBeTruthy();
    expect(result.batchHash).toBeTruthy();
  });

  it("dominantTokenBudget is the max estimatedTokens across results", () => {
    const contract = createWatchdogPulseConsumerPipelineBatchContract({ now: fixedNow() });
    const r1 = makeResult("HEALTHY", "COMPLETED");
    const r2 = makeResult("CRITICAL", "FAILED", 1, 1);
    const batch = contract.batch([r1, r2]);

    const expected = Math.max(
      r1.consumerPackage.typedContextPackage.estimatedTokens,
      r2.consumerPackage.typedContextPackage.estimatedTokens,
    );
    expect(batch.dominantTokenBudget).toBe(expected);
  });

  it("criticalPulseCount counts results where pulse.watchdogStatus === CRITICAL", () => {
    const contract = createWatchdogPulseConsumerPipelineBatchContract({ now: fixedNow() });
    const r1 = makeResult("CRITICAL", "COMPLETED", 1);
    const r2 = makeResult("HEALTHY", "COMPLETED");
    const r3 = makeResult("CRITICAL", "FAILED", 1, 1);
    const batch = contract.batch([r1, r2, r3]);

    expect(batch.criticalPulseCount).toBe(2);
  });

  it("criticalPulseCount is 0 when no CRITICAL results", () => {
    const contract = createWatchdogPulseConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([makeResult("HEALTHY"), makeResult("DEGRADED", "COMPLETED")]);

    expect(batch.criticalPulseCount).toBe(0);
  });

  it("createdAt is set from injected now()", () => {
    const contract = createWatchdogPulseConsumerPipelineBatchContract({ now: fixedNow() });
    const result = contract.batch([makeResult()]);

    expect(result.createdAt).toBe(FIXED_TS);
  });

  it("results array is preserved in the batch", () => {
    const contract = createWatchdogPulseConsumerPipelineBatchContract({ now: fixedNow() });
    const r = makeResult();
    const batch = contract.batch([r]);

    expect(batch.results).toHaveLength(1);
    expect(batch.results[0]).toBe(r);
  });

  it("is deterministic — same results produce identical batchHash", () => {
    const contract = createWatchdogPulseConsumerPipelineBatchContract({ now: fixedNow() });
    const r = makeResult("CRITICAL", "FAILED", 1, 1);
    const b1 = contract.batch([r]);
    const b2 = contract.batch([r]);

    expect(b1.batchHash).toBe(b2.batchHash);
    expect(b1.batchId).toBe(b2.batchId);
  });

  it("different result sets produce different batchHash", () => {
    const contract = createWatchdogPulseConsumerPipelineBatchContract({ now: fixedNow() });
    const b1 = contract.batch([makeResult("HEALTHY")]);
    const b2 = contract.batch([makeResult("CRITICAL", "FAILED", 1, 1)]);

    expect(b1.batchHash).not.toBe(b2.batchHash);
  });

  it("factory creates a working contract", () => {
    const contract = createWatchdogPulseConsumerPipelineBatchContract({ now: fixedNow() });
    expect(contract).toBeInstanceOf(WatchdogPulseConsumerPipelineBatchContract);
    expect(contract.batch([]).batchHash).toBeTruthy();
  });

  it("direct instantiation and factory produce equivalent results", () => {
    const r = makeResult();
    const direct = new WatchdogPulseConsumerPipelineBatchContract({ now: fixedNow() });
    const factory = createWatchdogPulseConsumerPipelineBatchContract({ now: fixedNow() });

    expect(direct.batch([r]).batchHash).toBe(factory.batch([r]).batchHash);
  });
});
