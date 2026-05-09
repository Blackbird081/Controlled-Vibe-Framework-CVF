import { describe, it, expect } from "vitest";
import {
  WatchdogEscalationLogConsumerPipelineBatchContract,
  createWatchdogEscalationLogConsumerPipelineBatchContract,
} from "../src/watchdog.escalation.log.consumer.pipeline.batch.contract";
import { createWatchdogEscalationLogConsumerPipelineContract } from "../src/watchdog.escalation.log.consumer.pipeline.contract";
import type { WatchdogEscalationLogConsumerPipelineResult } from "../src/watchdog.escalation.log.consumer.pipeline.contract";
import type { WatchdogEscalationDecision } from "../src/watchdog.escalation.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDecision(
  action: WatchdogEscalationDecision["action"] = "CLEAR",
  id = "d-001",
): WatchdogEscalationDecision {
  return {
    decisionId: id,
    decidedAt: "2026-03-24T10:00:00.000Z",
    sourceLogId: "log-001",
    action,
    rationale: "test",
    dominantStatus: action === "ESCALATE" ? "CRITICAL" : action === "MONITOR" ? "WARNING" : "NOMINAL",
    criticalCount: action === "ESCALATE" ? 1 : 0,
    warningCount: action === "MONITOR" ? 1 : 0,
    alertWasActive: action !== "CLEAR",
    decisionHash: `hash-${id}`,
  };
}

function makeResult(
  action: WatchdogEscalationDecision["action"] = "CLEAR",
  index = 0,
): WatchdogEscalationLogConsumerPipelineResult {
  const ts = `2026-03-24T10:0${index}:00.000Z`;
  const contract = createWatchdogEscalationLogConsumerPipelineContract({ now: () => ts });
  return contract.execute({ decisions: [makeDecision(action, `d-${index}`)] });
}

function fixedNow(ts = "2026-03-24T10:00:00.000Z"): () => string {
  return () => ts;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("WatchdogEscalationLogConsumerPipelineBatchContract", () => {
  it("is instantiable via factory", () => {
    const contract = createWatchdogEscalationLogConsumerPipelineBatchContract({ now: fixedNow() });
    expect(contract).toBeInstanceOf(WatchdogEscalationLogConsumerPipelineBatchContract);
  });

  it("empty batch — dominantTokenBudget is 0, totalResults is 0", () => {
    const contract = createWatchdogEscalationLogConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([]);

    expect(batch.dominantTokenBudget).toBe(0);
    expect(batch.totalResults).toBe(0);
    expect(batch.escalationActiveResultCount).toBe(0);
  });

  it("empty batch — batchHash and batchId are valid non-empty strings", () => {
    const contract = createWatchdogEscalationLogConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([]);

    expect(batch.batchHash).toBeTruthy();
    expect(batch.batchId).toBeTruthy();
  });

  it("batchId differs from batchHash", () => {
    const contract = createWatchdogEscalationLogConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([makeResult()]);

    expect(batch.batchId).not.toBe(batch.batchHash);
  });

  it("escalationActiveResultCount counts ESCALATE results correctly", () => {
    const contract = createWatchdogEscalationLogConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([
      makeResult("ESCALATE", 0),
      makeResult("CLEAR", 1),
      makeResult("ESCALATE", 2),
    ]);

    expect(batch.escalationActiveResultCount).toBe(2);
  });

  it("escalationActiveResultCount is 0 for all CLEAR results", () => {
    const contract = createWatchdogEscalationLogConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([
      makeResult("CLEAR", 0),
      makeResult("CLEAR", 1),
    ]);

    expect(batch.escalationActiveResultCount).toBe(0);
  });

  it("MONITOR result does not count as escalationActive (only ESCALATE does)", () => {
    const contract = createWatchdogEscalationLogConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([makeResult("MONITOR", 0)]);

    expect(batch.escalationActiveResultCount).toBe(0);
  });

  it("dominantTokenBudget is the max estimatedTokens across results", () => {
    const contract = createWatchdogEscalationLogConsumerPipelineBatchContract({ now: fixedNow() });
    const results = [makeResult("CLEAR", 0), makeResult("ESCALATE", 1)];
    const batch = contract.batch(results);

    const expected = Math.max(
      ...results.map((r) => r.consumerPackage.typedContextPackage.estimatedTokens),
    );
    expect(batch.dominantTokenBudget).toBe(expected);
  });

  it("is deterministic — same results yield same batchHash", () => {
    const contract = createWatchdogEscalationLogConsumerPipelineBatchContract({ now: fixedNow() });
    const results = [makeResult("CLEAR", 0)];
    const b1 = contract.batch(results);
    const b2 = contract.batch(results);

    expect(b1.batchHash).toBe(b2.batchHash);
    expect(b1.batchId).toBe(b2.batchId);
  });

  it("totalResults matches input length", () => {
    const contract = createWatchdogEscalationLogConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([makeResult("CLEAR", 0), makeResult("ESCALATE", 1), makeResult("MONITOR", 2)]);

    expect(batch.totalResults).toBe(3);
  });

  it("results array is preserved in batch output", () => {
    const contract = createWatchdogEscalationLogConsumerPipelineBatchContract({ now: fixedNow() });
    const results = [makeResult("CLEAR", 0), makeResult("ESCALATE", 1)];
    const batch = contract.batch(results);

    expect(batch.results).toHaveLength(2);
    expect(batch.results[0].escalationLog.dominantAction).toBe("CLEAR");
    expect(batch.results[1].escalationLog.dominantAction).toBe("ESCALATE");
  });

  it("createdAt matches injected now", () => {
    const ts = "2026-03-24T12:00:00.000Z";
    const contract = createWatchdogEscalationLogConsumerPipelineBatchContract({ now: fixedNow(ts) });
    const batch = contract.batch([]);

    expect(batch.createdAt).toBe(ts);
  });
});
