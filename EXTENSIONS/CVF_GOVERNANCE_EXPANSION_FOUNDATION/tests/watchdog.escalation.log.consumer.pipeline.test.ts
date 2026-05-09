import { describe, it, expect } from "vitest";
import {
  WatchdogEscalationLogConsumerPipelineContract,
  createWatchdogEscalationLogConsumerPipelineContract,
} from "../src/watchdog.escalation.log.consumer.pipeline.contract";
import type { WatchdogEscalationLogConsumerPipelineRequest } from "../src/watchdog.escalation.log.consumer.pipeline.contract";
import type { WatchdogEscalationDecision } from "../src/watchdog.escalation.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDecision(
  action: WatchdogEscalationDecision["action"] = "CLEAR",
  id = "decision-001",
): WatchdogEscalationDecision {
  return {
    decisionId: id,
    decidedAt: "2026-03-24T10:00:00.000Z",
    sourceLogId: "log-001",
    action,
    rationale: "test rationale",
    dominantStatus: action === "ESCALATE" ? "CRITICAL" : action === "MONITOR" ? "WARNING" : "NOMINAL",
    criticalCount: action === "ESCALATE" ? 1 : 0,
    warningCount: action === "MONITOR" ? 1 : 0,
    alertWasActive: action !== "CLEAR",
    decisionHash: `hash-${id}`,
  };
}

function makeRequest(
  decisions: WatchdogEscalationDecision[] = [makeDecision("CLEAR")],
  overrides: Partial<WatchdogEscalationLogConsumerPipelineRequest> = {},
): WatchdogEscalationLogConsumerPipelineRequest {
  return { decisions, ...overrides };
}

function fixedNow(ts = "2026-03-24T10:00:00.000Z"): () => string {
  return () => ts;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("WatchdogEscalationLogConsumerPipelineContract", () => {
  it("is instantiable via factory", () => {
    const contract = createWatchdogEscalationLogConsumerPipelineContract({ now: fixedNow() });
    expect(contract).toBeInstanceOf(WatchdogEscalationLogConsumerPipelineContract);
  });

  it("returns all required fields for CLEAR-only decisions (no warnings)", () => {
    const contract = createWatchdogEscalationLogConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.resultId).toBeTruthy();
    expect(result.createdAt).toBe("2026-03-24T10:00:00.000Z");
    expect(result.escalationLog).toBeDefined();
    expect(result.escalationLog.dominantAction).toBe("CLEAR");
    expect(result.consumerPackage).toBeDefined();
    expect(result.pipelineHash).toBeTruthy();
    expect(result.warnings).toEqual([]);
  });

  it("ESCALATE decision produces warning — immediate watchdog intervention", () => {
    const contract = createWatchdogEscalationLogConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([makeDecision("ESCALATE")]));

    expect(result.escalationLog.dominantAction).toBe("ESCALATE");
    expect(result.escalationLog.escalationActive).toBe(true);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[watchdog-escalation] active escalation");
    expect(result.warnings[0]).toContain("immediate watchdog intervention required");
  });

  it("MONITOR decision produces warning — watchdog monitoring in progress", () => {
    const contract = createWatchdogEscalationLogConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([makeDecision("MONITOR")]));

    expect(result.escalationLog.dominantAction).toBe("MONITOR");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[watchdog-escalation] monitor active");
    expect(result.warnings[0]).toContain("watchdog monitoring in progress");
  });

  it("CLEAR-only decisions produce no warnings", () => {
    const contract = createWatchdogEscalationLogConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([makeDecision("CLEAR")]));

    expect(result.warnings).toEqual([]);
  });

  it("mixed ESCALATE + CLEAR — ESCALATE dominates (severity-first)", () => {
    const contract = createWatchdogEscalationLogConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([
      makeDecision("CLEAR", "d-1"),
      makeDecision("ESCALATE", "d-2"),
    ]));

    expect(result.escalationLog.dominantAction).toBe("ESCALATE");
    expect(result.warnings[0]).toContain("[watchdog-escalation] active escalation");
  });

  it("query is derived from escalationLog.summary (sliced to 120)", () => {
    const contract = createWatchdogEscalationLogConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([makeDecision("CLEAR")]));

    expect(result.consumerPackage.query).toBe(
      result.escalationLog.summary.slice(0, 120),
    );
    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
  });

  it("contextId on consumerPackage equals escalationLog.logId", () => {
    const contract = createWatchdogEscalationLogConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.consumerPackage.contextId).toBe(result.escalationLog.logId);
  });

  it("empty decisions produce CLEAR dominant and no warnings", () => {
    const contract = createWatchdogEscalationLogConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([]));

    expect(result.escalationLog.totalDecisions).toBe(0);
    expect(result.escalationLog.dominantAction).toBe("CLEAR");
    expect(result.escalationLog.escalationActive).toBe(false);
    expect(result.warnings).toEqual([]);
    expect(result.pipelineHash).toBeTruthy();
  });

  it("consumerId is preserved when provided", () => {
    const contract = createWatchdogEscalationLogConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([makeDecision()], { consumerId: "consumer-xyz" }));

    expect(result.consumerId).toBe("consumer-xyz");
  });

  it("consumerId is undefined when not provided", () => {
    const contract = createWatchdogEscalationLogConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.consumerId).toBeUndefined();
  });

  it("resultId differs from pipelineHash", () => {
    const contract = createWatchdogEscalationLogConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.resultId).not.toBe(result.pipelineHash);
  });

  it("consumerPackage contains estimatedTokens", () => {
    const contract = createWatchdogEscalationLogConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(typeof result.consumerPackage.typedContextPackage.estimatedTokens).toBe("number");
  });

  it("is deterministic — same input produces identical hashes", () => {
    const contract = createWatchdogEscalationLogConsumerPipelineContract({ now: fixedNow() });
    const r1 = contract.execute(makeRequest());
    const r2 = contract.execute(makeRequest());

    expect(r1.pipelineHash).toBe(r2.pipelineHash);
    expect(r1.resultId).toBe(r2.resultId);
    expect(r1.escalationLog.logHash).toBe(r2.escalationLog.logHash);
  });

  it("different action produces different pipelineHash", () => {
    const contract = createWatchdogEscalationLogConsumerPipelineContract({ now: fixedNow() });
    const r1 = contract.execute(makeRequest([makeDecision("CLEAR")]));
    const r2 = contract.execute(makeRequest([makeDecision("ESCALATE")]));

    expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
  });

  it("escalationLog.escalateCount matches ESCALATE decisions", () => {
    const contract = createWatchdogEscalationLogConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([
      makeDecision("ESCALATE", "d-1"),
      makeDecision("CLEAR", "d-2"),
      makeDecision("ESCALATE", "d-3"),
    ]));

    expect(result.escalationLog.escalateCount).toBe(2);
  });

  it("direct instantiation works identically to factory", () => {
    const now = fixedNow();
    const direct = new WatchdogEscalationLogConsumerPipelineContract({ now });
    const via = createWatchdogEscalationLogConsumerPipelineContract({ now });

    const r1 = direct.execute(makeRequest());
    const r2 = via.execute(makeRequest());

    expect(r1.pipelineHash).toBe(r2.pipelineHash);
  });

  it("createdAt matches injected now", () => {
    const ts = "2026-03-24T12:00:00.000Z";
    const contract = createWatchdogEscalationLogConsumerPipelineContract({ now: fixedNow(ts) });
    const result = contract.execute(makeRequest());

    expect(result.createdAt).toBe(ts);
  });
});
