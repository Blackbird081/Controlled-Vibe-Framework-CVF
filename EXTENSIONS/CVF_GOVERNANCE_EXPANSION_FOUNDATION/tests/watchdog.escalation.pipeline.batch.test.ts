/**
 * WatchdogEscalationPipelineBatchContract — Tests (W3-T5 / CP2)
 * ================================================================
 * GC-024: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   WatchdogEscalationPipelineBatchContract.aggregate:
 *     - empty batch → totalResults 0, dominantAction CLEAR, escalationActiveCount 0
 *     - single ESCALATE result → dominantAction ESCALATE, escalationActiveCount 1
 *     - single CLEAR result → dominantAction CLEAR, escalationActiveCount 0
 *     - mixed results → severity-first dominant (ESCALATE wins over MONITOR/CLEAR)
 *     - MONITOR wins over CLEAR when no ESCALATE present
 *     - escalationActiveCount correct across mixed active/inactive results
 *     - batchId and batchHash deterministic for same input
 *     - factory createWatchdogEscalationPipelineBatchContract returns working instance
 */

import { describe, it, expect } from "vitest";
import {
  WatchdogEscalationPipelineBatchContract,
  createWatchdogEscalationPipelineBatchContract,
} from "../src/watchdog.escalation.pipeline.batch.contract";
import {
  WatchdogEscalationPipelineContract,
} from "../src/watchdog.escalation.pipeline.contract";
import type {
  WatchdogObservabilityInput,
  WatchdogExecutionInput,
} from "../src/watchdog.pulse.contract";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T06:00:00.000Z";
const fixedNow = () => FIXED_NOW;

const NOMINAL_OBS: WatchdogObservabilityInput = {
  snapshotId: "snap-nom",
  dominantHealth: "HEALTHY",
  criticalCount: 0,
  degradedCount: 0,
};

const CRITICAL_OBS: WatchdogObservabilityInput = {
  snapshotId: "snap-crit",
  dominantHealth: "CRITICAL",
  criticalCount: 2,
  degradedCount: 0,
};

const DEGRADED_OBS: WatchdogObservabilityInput = {
  snapshotId: "snap-deg",
  dominantHealth: "DEGRADED",
  criticalCount: 0,
  degradedCount: 1,
};

const COMPLETED_EXEC: WatchdogExecutionInput = {
  summaryId: "sum-ok",
  dominantStatus: "COMPLETED",
  failedCount: 0,
  runningCount: 0,
};

function makePipelineContract() {
  return new WatchdogEscalationPipelineContract({ now: fixedNow });
}

function makeBatchContract() {
  return new WatchdogEscalationPipelineBatchContract({ now: fixedNow });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("WatchdogEscalationPipelineBatchContract.aggregate", () => {
  it("empty batch → totalResults 0, dominantAction CLEAR, escalationActiveCount 0", () => {
    const contract = makeBatchContract();
    const result = contract.aggregate([]);
    expect(result.totalResults).toBe(0);
    expect(result.dominantAction).toBe("CLEAR");
    expect(result.escalationActiveCount).toBe(0);
    expect(result.results).toHaveLength(0);
  });

  it("single ESCALATE result → dominantAction ESCALATE, escalationActiveCount 1", () => {
    const pipeline = makePipelineContract();
    const contract = makeBatchContract();
    const r = pipeline.execute({ observabilityInput: CRITICAL_OBS, executionInput: COMPLETED_EXEC });
    const batch = contract.aggregate([r]);
    expect(batch.totalResults).toBe(1);
    expect(batch.dominantAction).toBe("ESCALATE");
    expect(batch.escalationActiveCount).toBe(1);
  });

  it("single CLEAR result → dominantAction CLEAR, escalationActiveCount 0", () => {
    const pipeline = makePipelineContract();
    const contract = makeBatchContract();
    const r = pipeline.execute({ observabilityInput: NOMINAL_OBS, executionInput: COMPLETED_EXEC });
    const batch = contract.aggregate([r]);
    expect(batch.dominantAction).toBe("CLEAR");
    expect(batch.escalationActiveCount).toBe(0);
  });

  it("mixed results → severity-first dominant: ESCALATE wins over MONITOR and CLEAR", () => {
    const pipeline = makePipelineContract();
    const contract = makeBatchContract();
    const escalate = pipeline.execute({ observabilityInput: CRITICAL_OBS, executionInput: COMPLETED_EXEC });
    const monitor = pipeline.execute({ observabilityInput: DEGRADED_OBS, executionInput: COMPLETED_EXEC });
    const clear = pipeline.execute({ observabilityInput: NOMINAL_OBS, executionInput: COMPLETED_EXEC });
    const batch = contract.aggregate([clear, monitor, escalate]);
    expect(batch.dominantAction).toBe("ESCALATE");
  });

  it("MONITOR wins over CLEAR when no ESCALATE present", () => {
    const pipeline = makePipelineContract();
    const contract = makeBatchContract();
    const monitor = pipeline.execute({ observabilityInput: DEGRADED_OBS, executionInput: COMPLETED_EXEC });
    const clear = pipeline.execute({ observabilityInput: NOMINAL_OBS, executionInput: COMPLETED_EXEC });
    const batch = contract.aggregate([clear, monitor]);
    expect(batch.dominantAction).toBe("MONITOR");
  });

  it("escalationActiveCount correct across mixed active/inactive results", () => {
    const pipeline = makePipelineContract();
    const contract = makeBatchContract();
    const escalate1 = pipeline.execute({ observabilityInput: CRITICAL_OBS, executionInput: COMPLETED_EXEC });
    const escalate2 = pipeline.execute({ observabilityInput: CRITICAL_OBS, executionInput: COMPLETED_EXEC });
    const clear = pipeline.execute({ observabilityInput: NOMINAL_OBS, executionInput: COMPLETED_EXEC });
    const batch = contract.aggregate([escalate1, clear, escalate2]);
    expect(batch.escalationActiveCount).toBe(2);
    expect(batch.totalResults).toBe(3);
  });

  it("batchId and batchHash are deterministic for same input", () => {
    const pipeline = makePipelineContract();
    const contract = makeBatchContract();
    const r = pipeline.execute({ observabilityInput: CRITICAL_OBS, executionInput: COMPLETED_EXEC });
    const b1 = contract.aggregate([r]);
    const b2 = contract.aggregate([r]);
    expect(b1.batchId).toBe(b2.batchId);
    expect(b1.batchHash).toBe(b2.batchHash);
  });

  it("createdAt is set on batch", () => {
    const contract = makeBatchContract();
    const batch = contract.aggregate([]);
    expect(batch.createdAt).toBe(FIXED_NOW);
  });
});

// ─── createWatchdogEscalationPipelineBatchContract factory ────────────────────

describe("createWatchdogEscalationPipelineBatchContract", () => {
  it("returns a working instance", () => {
    const contract = createWatchdogEscalationPipelineBatchContract();
    const batch = contract.aggregate([]);
    expect(batch.totalResults).toBe(0);
    expect(batch.batchId).toBeTruthy();
  });
});
