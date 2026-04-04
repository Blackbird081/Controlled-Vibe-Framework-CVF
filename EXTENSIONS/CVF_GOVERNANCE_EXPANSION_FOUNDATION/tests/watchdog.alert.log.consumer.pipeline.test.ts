import { describe, it, expect } from "vitest";
import {
  WatchdogAlertLogConsumerPipelineContract,
  createWatchdogAlertLogConsumerPipelineContract,
} from "../src/watchdog.alert.log.consumer.pipeline.contract";
import type {
  WatchdogAlertLogConsumerPipelineRequest,
} from "../src/watchdog.alert.log.consumer.pipeline.contract";
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
    statusRationale: `Status=${status}. Test pulse index=${idx}.`,
    pulseHash: `hash-pulse-${status}-${idx}`,
  };
}

function makeRequest(
  status: WatchdogStatus,
  count = 1,
  overrides: Partial<WatchdogAlertLogConsumerPipelineRequest> = {},
): WatchdogAlertLogConsumerPipelineRequest {
  return {
    pulses: Array.from({ length: count }, (_, i) => makePulse(status, i)),
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("WatchdogAlertLogConsumerPipelineContract", () => {
  it("is instantiable via factory", () => {
    const contract = createWatchdogAlertLogConsumerPipelineContract();
    expect(contract).toBeInstanceOf(WatchdogAlertLogConsumerPipelineContract);
  });

  it("CRITICAL status emits critical warning", () => {
    const contract = createWatchdogAlertLogConsumerPipelineContract({ now: fixedNow });
    const result = contract.execute(makeRequest("CRITICAL"));
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toBe("[watchdog] critical alert — immediate escalation required");
  });

  it("WARNING status emits warning alert message", () => {
    const contract = createWatchdogAlertLogConsumerPipelineContract({ now: fixedNow });
    const result = contract.execute(makeRequest("WARNING"));
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toBe("[watchdog] warning alert — watchdog alert log review required");
  });

  it("NOMINAL status emits no warnings", () => {
    const contract = createWatchdogAlertLogConsumerPipelineContract({ now: fixedNow });
    const result = contract.execute(makeRequest("NOMINAL"));
    expect(result.warnings).toHaveLength(0);
  });

  it("UNKNOWN status emits no warnings", () => {
    const contract = createWatchdogAlertLogConsumerPipelineContract({ now: fixedNow });
    const result = contract.execute(makeRequest("UNKNOWN"));
    expect(result.warnings).toHaveLength(0);
  });

  it("alertLog.dominantStatus matches input pulses", () => {
    const contract = createWatchdogAlertLogConsumerPipelineContract({ now: fixedNow });
    const result = contract.execute(makeRequest("CRITICAL", 3));
    expect(result.alertLog.dominantStatus).toBe("CRITICAL");
  });

  it("alertLog.alertActive is true for CRITICAL", () => {
    const contract = createWatchdogAlertLogConsumerPipelineContract({ now: fixedNow });
    const result = contract.execute(makeRequest("CRITICAL"));
    expect(result.alertLog.alertActive).toBe(true);
  });

  it("alertLog.alertActive is true for WARNING", () => {
    const contract = createWatchdogAlertLogConsumerPipelineContract({ now: fixedNow });
    const result = contract.execute(makeRequest("WARNING"));
    expect(result.alertLog.alertActive).toBe(true);
  });

  it("alertLog.alertActive is false for NOMINAL", () => {
    const contract = createWatchdogAlertLogConsumerPipelineContract({ now: fixedNow });
    const result = contract.execute(makeRequest("NOMINAL"));
    expect(result.alertLog.alertActive).toBe(false);
  });

  it("query contains dominantStatus and is within 120 chars", () => {
    const contract = createWatchdogAlertLogConsumerPipelineContract({ now: fixedNow });
    const result = contract.execute(makeRequest("WARNING", 2));
    expect(result.consumerPackage.query).toContain("WARNING");
    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
  });

  it("contextId equals alertLog.logId", () => {
    const contract = createWatchdogAlertLogConsumerPipelineContract({ now: fixedNow });
    const result = contract.execute(makeRequest("NOMINAL"));
    expect(result.consumerPackage.contextId).toBe(result.alertLog.logId);
  });

  it("resultId differs from pipelineHash", () => {
    const contract = createWatchdogAlertLogConsumerPipelineContract({ now: fixedNow });
    const result = contract.execute(makeRequest("NOMINAL"));
    expect(result.resultId).not.toBe(result.pipelineHash);
  });

  it("createdAt matches injected now", () => {
    const contract = createWatchdogAlertLogConsumerPipelineContract({ now: fixedNow });
    const result = contract.execute(makeRequest("CRITICAL"));
    expect(result.createdAt).toBe(FIXED_NOW);
  });

  it("consumerId is passed through when provided", () => {
    const contract = createWatchdogAlertLogConsumerPipelineContract({ now: fixedNow });
    const result = contract.execute(
      makeRequest("NOMINAL", 1, { consumerId: "consumer-watchdog-001" }),
    );
    expect(result.consumerId).toBe("consumer-watchdog-001");
  });

  it("consumerId is undefined when not provided", () => {
    const contract = createWatchdogAlertLogConsumerPipelineContract({ now: fixedNow });
    const result = contract.execute(makeRequest("WARNING"));
    expect(result.consumerId).toBeUndefined();
  });

  it("two identical requests produce the same pipelineHash (determinism)", () => {
    const contract = createWatchdogAlertLogConsumerPipelineContract({ now: fixedNow });
    const r1 = contract.execute(makeRequest("CRITICAL", 2));
    const r2 = contract.execute(makeRequest("CRITICAL", 2));
    expect(r1.pipelineHash).toBe(r2.pipelineHash);
    expect(r1.resultId).toBe(r2.resultId);
  });

  it("different statuses produce different pipelineHashes", () => {
    const contract = createWatchdogAlertLogConsumerPipelineContract({ now: fixedNow });
    const rCritical = contract.execute(makeRequest("CRITICAL"));
    const rNominal = contract.execute(makeRequest("NOMINAL"));
    expect(rCritical.pipelineHash).not.toBe(rNominal.pipelineHash);
  });

  it("empty pulses produce valid result with UNKNOWN dominantStatus", () => {
    const contract = createWatchdogAlertLogConsumerPipelineContract({ now: fixedNow });
    const result = contract.execute({ pulses: [] });
    expect(result.alertLog.dominantStatus).toBe("UNKNOWN");
    expect(result.alertLog.totalPulses).toBe(0);
    expect(result.warnings).toHaveLength(0);
    expect(typeof result.pipelineHash).toBe("string");
    expect(result.pipelineHash.length).toBeGreaterThan(0);
  });

  it("totalPulses on alertLog matches pulses input length", () => {
    const contract = createWatchdogAlertLogConsumerPipelineContract({ now: fixedNow });
    const result = contract.execute(makeRequest("NOMINAL", 5));
    expect(result.alertLog.totalPulses).toBe(5);
  });

  it("consumerPackage has estimatedTokens >= 0", () => {
    const contract = createWatchdogAlertLogConsumerPipelineContract({ now: fixedNow });
    const result = contract.execute(makeRequest("WARNING"));
    expect(result.consumerPackage.typedContextPackage.estimatedTokens).toBeGreaterThanOrEqual(0);
  });
});
