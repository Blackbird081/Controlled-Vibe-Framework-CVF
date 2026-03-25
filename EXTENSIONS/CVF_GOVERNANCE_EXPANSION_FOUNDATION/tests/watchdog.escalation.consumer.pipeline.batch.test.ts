import { describe, it, expect } from "vitest";
import {
  WatchdogEscalationConsumerPipelineBatchContract,
  createWatchdogEscalationConsumerPipelineBatchContract,
} from "../src/watchdog.escalation.consumer.pipeline.batch.contract";
import { createWatchdogEscalationConsumerPipelineContract } from "../src/watchdog.escalation.consumer.pipeline.contract";
import type { WatchdogEscalationConsumerPipelineResult } from "../src/watchdog.escalation.consumer.pipeline.contract";
import type { WatchdogAlertLog } from "../src/watchdog.alert.log.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fixedNow(ts = "2026-03-25T10:00:00.000Z"): () => string {
  return () => ts;
}

function makeAlertLog(
  scenario: "ESCALATE" | "MONITOR" | "CLEAR",
  id = "log-001",
): WatchdogAlertLog {
  if (scenario === "ESCALATE") {
    return {
      logId: id,
      createdAt: "2026-03-25T10:00:00.000Z",
      totalPulses: 5,
      criticalCount: 1,
      warningCount: 0,
      nominalCount: 4,
      unknownCount: 0,
      dominantStatus: "CRITICAL",
      alertActive: true,
      summary: `critical alert ${id}`,
      logHash: `loghash-${id}`,
    };
  }
  if (scenario === "MONITOR") {
    return {
      logId: id,
      createdAt: "2026-03-25T10:00:00.000Z",
      totalPulses: 5,
      criticalCount: 0,
      warningCount: 2,
      nominalCount: 3,
      unknownCount: 0,
      dominantStatus: "WARNING",
      alertActive: true,
      summary: `warning alert ${id}`,
      logHash: `loghash-${id}`,
    };
  }
  return {
    logId: id,
    createdAt: "2026-03-25T10:00:00.000Z",
    totalPulses: 5,
    criticalCount: 0,
    warningCount: 0,
    nominalCount: 5,
    unknownCount: 0,
    dominantStatus: "NOMINAL",
    alertActive: false,
    summary: `all nominal ${id}`,
    logHash: `loghash-${id}`,
  };
}

function makeResult(
  scenario: "ESCALATE" | "MONITOR" | "CLEAR",
  id = "log-001",
): WatchdogEscalationConsumerPipelineResult {
  const contract = createWatchdogEscalationConsumerPipelineContract({ now: fixedNow() });
  return contract.execute({ alertLog: makeAlertLog(scenario, id) });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("WatchdogEscalationConsumerPipelineBatchContract", () => {
  it("batches an empty array correctly", () => {
    const contract = createWatchdogEscalationConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([]);

    expect(batch.totalResults).toBe(0);
    expect(batch.dominantTokenBudget).toBe(0);
    expect(batch.escalationActiveCount).toBe(0);
    expect(batch.batchHash).toBeTruthy();
    expect(batch.batchId).toBeTruthy();
    expect(batch.results).toEqual([]);
  });

  it("counts escalationActiveCount from results with action ESCALATE", () => {
    const contract = createWatchdogEscalationConsumerPipelineBatchContract({ now: fixedNow() });
    const r1 = makeResult("ESCALATE", "l-001");
    const r2 = makeResult("ESCALATE", "l-002");
    const r3 = makeResult("MONITOR", "l-003");
    const batch = contract.batch([r1, r2, r3]);

    expect(batch.escalationActiveCount).toBe(2);
    expect(batch.totalResults).toBe(3);
  });

  it("MONITOR and CLEAR results do not increment escalationActiveCount", () => {
    const contract = createWatchdogEscalationConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([
      makeResult("MONITOR", "l-001"),
      makeResult("CLEAR", "l-002"),
    ]);

    expect(batch.escalationActiveCount).toBe(0);
    expect(batch.totalResults).toBe(2);
  });

  it("dominantTokenBudget is max estimatedTokens across results", () => {
    const contract = createWatchdogEscalationConsumerPipelineBatchContract({ now: fixedNow() });
    const r1 = makeResult("ESCALATE", "l-001");
    const r2 = makeResult("MONITOR", "l-002");
    const batch = contract.batch([r1, r2]);

    const expectedMax = Math.max(
      r1.consumerPackage.typedContextPackage.estimatedTokens,
      r2.consumerPackage.typedContextPackage.estimatedTokens,
    );
    expect(batch.dominantTokenBudget).toBe(expectedMax);
  });

  it("dominantTokenBudget is 0 for empty batch", () => {
    const contract = createWatchdogEscalationConsumerPipelineBatchContract({ now: fixedNow() });
    expect(contract.batch([]).dominantTokenBudget).toBe(0);
  });

  it("batchId differs from batchHash", () => {
    const contract = createWatchdogEscalationConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([makeResult("ESCALATE")]);

    expect(batch.batchId).not.toBe(batch.batchHash);
  });

  it("results are preserved in output batch", () => {
    const contract = createWatchdogEscalationConsumerPipelineBatchContract({ now: fixedNow() });
    const r1 = makeResult("ESCALATE", "l-001");
    const r2 = makeResult("MONITOR", "l-002");
    const batch = contract.batch([r1, r2]);

    expect(batch.results).toHaveLength(2);
    expect(batch.results[0].resultId).toBe(r1.resultId);
    expect(batch.results[1].resultId).toBe(r2.resultId);
  });

  it("is deterministic — same inputs produce identical batch hashes", () => {
    const contract = createWatchdogEscalationConsumerPipelineBatchContract({ now: fixedNow() });
    const r1 = makeResult("ESCALATE");
    const b1 = contract.batch([r1]);
    const b2 = contract.batch([r1]);

    expect(b1.batchHash).toBe(b2.batchHash);
    expect(b1.batchId).toBe(b2.batchId);
  });

  it("different results produce different batchHash", () => {
    const contract = createWatchdogEscalationConsumerPipelineBatchContract({ now: fixedNow() });
    const b1 = contract.batch([makeResult("ESCALATE", "l-001")]);
    const b2 = contract.batch([makeResult("CLEAR", "l-002")]);

    expect(b1.batchHash).not.toBe(b2.batchHash);
  });

  it("factory creates a working contract", () => {
    const contract = createWatchdogEscalationConsumerPipelineBatchContract({ now: fixedNow() });
    expect(contract).toBeInstanceOf(WatchdogEscalationConsumerPipelineBatchContract);
    expect(contract.batch([makeResult("MONITOR")]).batchHash).toBeTruthy();
  });

  it("createdAt is set from injected now()", () => {
    const contract = createWatchdogEscalationConsumerPipelineBatchContract({ now: fixedNow() });
    expect(contract.batch([makeResult("CLEAR")]).createdAt).toBe("2026-03-25T10:00:00.000Z");
  });

  it("mixed ESCALATE and non-ESCALATE results are counted correctly", () => {
    const contract = createWatchdogEscalationConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([
      makeResult("ESCALATE", "l-001"),
      makeResult("MONITOR", "l-002"),
      makeResult("CLEAR", "l-003"),
    ]);

    expect(batch.escalationActiveCount).toBe(1);
    expect(batch.totalResults).toBe(3);
  });

  it("single result batch has correct shape", () => {
    const contract = createWatchdogEscalationConsumerPipelineBatchContract({ now: fixedNow() });
    const r1 = makeResult("ESCALATE", "l-001");
    const batch = contract.batch([r1]);

    expect(batch.totalResults).toBe(1);
    expect(batch.escalationActiveCount).toBe(1);
    expect(batch.batchHash).toBeTruthy();
    expect(batch.batchId).toBeTruthy();
    expect(batch.dominantTokenBudget).toBeGreaterThanOrEqual(0);
  });
});
