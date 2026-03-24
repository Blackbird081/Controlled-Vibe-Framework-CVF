import { describe, it, expect } from "vitest";
import {
  WatchdogAlertLogConsumerPipelineBatchContract,
  createWatchdogAlertLogConsumerPipelineBatchContract,
} from "../src/watchdog.alert.log.consumer.pipeline.batch.contract";
import {
  createWatchdogAlertLogConsumerPipelineContract,
} from "../src/watchdog.alert.log.consumer.pipeline.contract";
import type { WatchdogAlertLogConsumerPipelineResult } from "../src/watchdog.alert.log.consumer.pipeline.contract";
import type { WatchdogPulse, WatchdogStatus } from "../src/watchdog.pulse.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T10:00:00.000Z";

function fixedNow(): string {
  return FIXED_NOW;
}

function makePulse(status: WatchdogStatus, idx = 0): WatchdogPulse {
  return {
    pulseId: `pulse-${status}-${idx}`,
    issuedAt: FIXED_NOW,
    sourceObservabilitySnapshotId: `obs-snap-${status}-${idx}`,
    sourceExecutionSummaryId: `exec-sum-${status}-${idx}`,
    watchdogStatus: status,
    statusRationale: `Status=${status}. Batch test pulse index=${idx}.`,
    pulseHash: `hash-pulse-${status}-${idx}`,
  };
}

function makeResult(status: WatchdogStatus): WatchdogAlertLogConsumerPipelineResult {
  const contract = createWatchdogAlertLogConsumerPipelineContract({ now: fixedNow });
  return contract.execute({ pulses: [makePulse(status)] });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("WatchdogAlertLogConsumerPipelineBatchContract", () => {
  it("is instantiable via factory", () => {
    const contract = createWatchdogAlertLogConsumerPipelineBatchContract();
    expect(contract).toBeInstanceOf(WatchdogAlertLogConsumerPipelineBatchContract);
  });

  it("empty batch returns totalResults=0 and dominantTokenBudget=0", () => {
    const contract = createWatchdogAlertLogConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([]);
    expect(batch.totalResults).toBe(0);
    expect(batch.dominantTokenBudget).toBe(0);
    expect(batch.criticalAlertResultCount).toBe(0);
    expect(batch.warningAlertResultCount).toBe(0);
  });

  it("empty batch still produces valid batchHash and batchId", () => {
    const contract = createWatchdogAlertLogConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([]);
    expect(typeof batch.batchHash).toBe("string");
    expect(batch.batchHash.length).toBeGreaterThan(0);
    expect(typeof batch.batchId).toBe("string");
    expect(batch.batchId.length).toBeGreaterThan(0);
  });

  it("batchId differs from batchHash", () => {
    const contract = createWatchdogAlertLogConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([makeResult("CRITICAL")]);
    expect(batch.batchId).not.toBe(batch.batchHash);
  });

  it("criticalAlertResultCount counts CRITICAL results correctly", () => {
    const contract = createWatchdogAlertLogConsumerPipelineBatchContract({ now: fixedNow });
    const results = [makeResult("CRITICAL"), makeResult("CRITICAL"), makeResult("WARNING")];
    const batch = contract.batch(results);
    expect(batch.criticalAlertResultCount).toBe(2);
  });

  it("warningAlertResultCount counts WARNING results correctly", () => {
    const contract = createWatchdogAlertLogConsumerPipelineBatchContract({ now: fixedNow });
    const results = [makeResult("WARNING"), makeResult("NOMINAL")];
    const batch = contract.batch(results);
    expect(batch.warningAlertResultCount).toBe(1);
  });

  it("NOMINAL and UNKNOWN results do not affect critical or warning counts", () => {
    const contract = createWatchdogAlertLogConsumerPipelineBatchContract({ now: fixedNow });
    const results = [makeResult("NOMINAL"), makeResult("UNKNOWN")];
    const batch = contract.batch(results);
    expect(batch.criticalAlertResultCount).toBe(0);
    expect(batch.warningAlertResultCount).toBe(0);
  });

  it("totalResults matches input length", () => {
    const contract = createWatchdogAlertLogConsumerPipelineBatchContract({ now: fixedNow });
    const results = [makeResult("CRITICAL"), makeResult("WARNING"), makeResult("NOMINAL")];
    const batch = contract.batch(results);
    expect(batch.totalResults).toBe(3);
  });

  it("dominantTokenBudget is max of estimatedTokens across results", () => {
    const contract = createWatchdogAlertLogConsumerPipelineBatchContract({ now: fixedNow });
    const results = [makeResult("CRITICAL"), makeResult("WARNING")];
    const expected = Math.max(
      ...results.map((r) => r.consumerPackage.typedContextPackage.estimatedTokens),
    );
    const batch = contract.batch(results);
    expect(batch.dominantTokenBudget).toBe(expected);
  });

  it("two identical batches produce the same batchHash (determinism)", () => {
    const contract = createWatchdogAlertLogConsumerPipelineBatchContract({ now: fixedNow });
    const results = [makeResult("CRITICAL"), makeResult("WARNING")];
    const b1 = contract.batch(results);
    const b2 = contract.batch(results);
    expect(b1.batchHash).toBe(b2.batchHash);
    expect(b1.batchId).toBe(b2.batchId);
  });

  it("createdAt matches injected now", () => {
    const contract = createWatchdogAlertLogConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([makeResult("NOMINAL")]);
    expect(batch.createdAt).toBe(FIXED_NOW);
  });

  it("results array is preserved in batch output", () => {
    const contract = createWatchdogAlertLogConsumerPipelineBatchContract({ now: fixedNow });
    const results = [makeResult("CRITICAL")];
    const batch = contract.batch(results);
    expect(batch.results).toHaveLength(1);
    expect(batch.results[0].alertLog.dominantStatus).toBe("CRITICAL");
  });

  it("different result sets produce different batchHashes", () => {
    const contract = createWatchdogAlertLogConsumerPipelineBatchContract({ now: fixedNow });
    const b1 = contract.batch([makeResult("CRITICAL")]);
    const b2 = contract.batch([makeResult("NOMINAL")]);
    expect(b1.batchHash).not.toBe(b2.batchHash);
  });
});
