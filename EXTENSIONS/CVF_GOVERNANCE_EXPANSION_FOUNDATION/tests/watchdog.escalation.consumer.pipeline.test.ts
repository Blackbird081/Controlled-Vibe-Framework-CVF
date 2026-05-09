import { describe, it, expect } from "vitest";
import {
  WatchdogEscalationConsumerPipelineContract,
  createWatchdogEscalationConsumerPipelineContract,
} from "../src/watchdog.escalation.consumer.pipeline.contract";
import type { WatchdogEscalationConsumerPipelineRequest } from "../src/watchdog.escalation.consumer.pipeline.contract";
import type { WatchdogAlertLog } from "../src/watchdog.alert.log.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIXED_TS = "2026-03-25T10:00:00.000Z";

function fixedNow(ts = FIXED_TS): () => string {
  return () => ts;
}

/**
 * Builds a WatchdogAlertLog that produces the desired escalation action:
 *   ESCALATE → alertActive=true, CRITICAL dominant, criticalCount=1
 *   MONITOR  → alertActive=true, WARNING dominant, warningCount=1
 *   CLEAR    → alertActive=false, NOMINAL dominant
 */
function makeAlertLog(
  expectedAction: "ESCALATE" | "MONITOR" | "CLEAR",
  id = "log-001",
): WatchdogAlertLog {
  const isEscalate = expectedAction === "ESCALATE";
  const isMonitor = expectedAction === "MONITOR";
  return {
    logId: id,
    createdAt: FIXED_TS,
    totalPulses: 1,
    criticalCount: isEscalate ? 1 : 0,
    warningCount: isMonitor ? 1 : 0,
    nominalCount: expectedAction === "CLEAR" ? 1 : 0,
    unknownCount: 0,
    dominantStatus: isEscalate ? "CRITICAL" : isMonitor ? "WARNING" : "NOMINAL",
    alertActive: expectedAction !== "CLEAR",
    summary: `test log for ${expectedAction}`,
    logHash: `hash-${id}`,
  };
}

function makeRequest(
  expectedAction: "ESCALATE" | "MONITOR" | "CLEAR" = "CLEAR",
  id = "log-001",
): WatchdogEscalationConsumerPipelineRequest {
  return { alertLog: makeAlertLog(expectedAction, id) };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("WatchdogEscalationConsumerPipelineContract", () => {
  it("execute returns a result with resultId, pipelineHash, and escalationDecision", () => {
    const contract = createWatchdogEscalationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest("CLEAR"));

    expect(result.resultId).toBeTruthy();
    expect(result.pipelineHash).toBeTruthy();
    expect(result.escalationDecision).toBeDefined();
    expect(result.escalationDecision.action).toBe("CLEAR");
  });

  it("query contains [watchdog-escalation] prefix with action and dominant status", () => {
    const contract = createWatchdogEscalationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest("CLEAR"));

    const query = result.consumerPackage.typedContextPackage.query;
    expect(query).toMatch(/^\[watchdog-escalation\] action:CLEAR dominant:NOMINAL/);
  });

  it("query for ESCALATE action contains action:ESCALATE dominant:CRITICAL", () => {
    const contract = createWatchdogEscalationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest("ESCALATE"));

    const query = result.consumerPackage.typedContextPackage.query;
    expect(query).toContain("action:ESCALATE");
    expect(query).toContain("dominant:CRITICAL");
  });

  it("query for MONITOR action contains action:MONITOR dominant:WARNING", () => {
    const contract = createWatchdogEscalationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest("MONITOR"));

    const query = result.consumerPackage.typedContextPackage.query;
    expect(query).toContain("action:MONITOR");
    expect(query).toContain("dominant:WARNING");
  });

  it("query is sliced to max 120 characters", () => {
    const contract = createWatchdogEscalationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest("ESCALATE"));

    expect(result.consumerPackage.typedContextPackage.query.length).toBeLessThanOrEqual(120);
  });

  it("contextId is escalationDecision.decisionId", () => {
    const contract = createWatchdogEscalationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest("ESCALATE"));

    expect(result.consumerPackage.typedContextPackage.contextId).toBe(
      result.escalationDecision.decisionId,
    );
  });

  it("ESCALATE action produces escalation warning", () => {
    const contract = createWatchdogEscalationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest("ESCALATE"));

    expect(result.warnings).toContain(
      "[watchdog] escalation triggered — immediate governance checkpoint required",
    );
  });

  it("MONITOR action produces no warnings", () => {
    const contract = createWatchdogEscalationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest("MONITOR"));

    expect(result.warnings).toHaveLength(0);
  });

  it("CLEAR action produces no warnings", () => {
    const contract = createWatchdogEscalationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest("CLEAR"));

    expect(result.warnings).toHaveLength(0);
  });

  it("resultId differs from pipelineHash", () => {
    const contract = createWatchdogEscalationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest("CLEAR"));

    expect(result.resultId).not.toBe(result.pipelineHash);
  });

  it("estimatedTokens is present and positive", () => {
    const contract = createWatchdogEscalationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest("ESCALATE"));

    expect(result.consumerPackage.typedContextPackage.estimatedTokens).toBeGreaterThan(0);
  });

  it("consumerId is propagated when set", () => {
    const contract = createWatchdogEscalationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute({ ...makeRequest("CLEAR"), consumerId: "gov-consumer-001" });

    expect(result.consumerId).toBe("gov-consumer-001");
  });

  it("consumerId is undefined when not set", () => {
    const contract = createWatchdogEscalationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest("CLEAR"));

    expect(result.consumerId).toBeUndefined();
  });

  it("createdAt is set from injected now()", () => {
    const contract = createWatchdogEscalationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest("CLEAR"));

    expect(result.createdAt).toBe(FIXED_TS);
  });

  it("is deterministic — same inputs produce identical pipelineHash", () => {
    const contract = createWatchdogEscalationConsumerPipelineContract({ now: fixedNow() });
    const r1 = contract.execute(makeRequest("ESCALATE"));
    const r2 = contract.execute(makeRequest("ESCALATE"));

    expect(r1.pipelineHash).toBe(r2.pipelineHash);
    expect(r1.resultId).toBe(r2.resultId);
  });

  it("different alert log inputs produce different pipelineHash", () => {
    const contract = createWatchdogEscalationConsumerPipelineContract({ now: fixedNow() });
    const r1 = contract.execute(makeRequest("CLEAR", "log-001"));
    const r2 = contract.execute(makeRequest("ESCALATE", "log-002"));

    expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
  });

  it("factory creates a working contract", () => {
    const contract = createWatchdogEscalationConsumerPipelineContract({ now: fixedNow() });
    expect(contract).toBeInstanceOf(WatchdogEscalationConsumerPipelineContract);
    expect(contract.execute(makeRequest("CLEAR")).pipelineHash).toBeTruthy();
  });

  it("direct instantiation and factory produce equivalent results", () => {
    const alertLog = makeAlertLog("MONITOR");
    const direct = new WatchdogEscalationConsumerPipelineContract({ now: fixedNow() });
    const factory = createWatchdogEscalationConsumerPipelineContract({ now: fixedNow() });

    expect(direct.execute({ alertLog }).pipelineHash).toBe(
      factory.execute({ alertLog }).pipelineHash,
    );
  });

  it("escalationDecision.alertWasActive is false for CLEAR action", () => {
    const contract = createWatchdogEscalationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest("CLEAR"));

    expect(result.escalationDecision.alertWasActive).toBe(false);
  });

  it("escalationDecision.alertWasActive is true for ESCALATE action", () => {
    const contract = createWatchdogEscalationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest("ESCALATE"));

    expect(result.escalationDecision.alertWasActive).toBe(true);
  });
});
