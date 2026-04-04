/**
 * WatchdogEscalationPipelineContract — Tests (W3-T5 / CP1)
 * ==========================================================
 * GC-024: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   WatchdogEscalationPipelineContract.execute:
 *     - NOMINAL obs + COMPLETED exec → CLEAR escalation, escalationActive false
 *     - CRITICAL obs → ESCALATE escalation, escalationActive true
 *     - DEGRADED obs → MONITOR escalation, escalationActive false
 *     - FAILED exec → ESCALATE escalation (CRITICAL watchdog status)
 *     - per-request policy override (strictMode) respected
 *     - contract-level default policy applied when no per-request policy
 *     - resultId and pipelineHash are deterministic for same input
 *     - pulse, alertLog, escalationDecision, escalationLog all populated
 *     - escalationActive mirrors escalationLog.escalationActive
 *     - dominantAction mirrors escalationLog.dominantAction
 *     - createdAt set on result
 *     - factory createWatchdogEscalationPipelineContract returns working instance
 */

import { describe, it, expect } from "vitest";
import {
  WatchdogEscalationPipelineContract,
  createWatchdogEscalationPipelineContract,
} from "../src/watchdog.escalation.pipeline.contract";
import type {
  WatchdogEscalationPipelineRequest,
} from "../src/watchdog.escalation.pipeline.contract";
import type { WatchdogEscalationPolicy } from "../src/watchdog.escalation.contract";
import type {
  WatchdogObservabilityInput,
  WatchdogExecutionInput,
} from "../src/watchdog.pulse.contract";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T06:00:00.000Z";
const fixedNow = () => FIXED_NOW;

const NOMINAL_OBS: WatchdogObservabilityInput = {
  snapshotId: "snap-1",
  dominantHealth: "HEALTHY",
  criticalCount: 0,
  degradedCount: 0,
};

const COMPLETED_EXEC: WatchdogExecutionInput = {
  summaryId: "sum-1",
  dominantStatus: "COMPLETED",
  failedCount: 0,
  runningCount: 0,
};

const CRITICAL_OBS: WatchdogObservabilityInput = {
  snapshotId: "snap-crit",
  dominantHealth: "CRITICAL",
  criticalCount: 3,
  degradedCount: 1,
};

const DEGRADED_OBS: WatchdogObservabilityInput = {
  snapshotId: "snap-deg",
  dominantHealth: "DEGRADED",
  criticalCount: 0,
  degradedCount: 2,
};

const FAILED_EXEC: WatchdogExecutionInput = {
  summaryId: "sum-fail",
  dominantStatus: "FAILED",
  failedCount: 2,
  runningCount: 0,
};

function makeContract(
  policy?: WatchdogEscalationPolicy,
) {
  return new WatchdogEscalationPipelineContract({ now: fixedNow, policy });
}

function makeRequest(
  obs: WatchdogObservabilityInput = NOMINAL_OBS,
  exec: WatchdogExecutionInput = COMPLETED_EXEC,
  policy?: WatchdogEscalationPipelineRequest["policy"],
): WatchdogEscalationPipelineRequest {
  return { observabilityInput: obs, executionInput: exec, policy };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("WatchdogEscalationPipelineContract.execute", () => {
  it("NOMINAL obs + COMPLETED exec → CLEAR escalation, escalationActive false", () => {
    const contract = makeContract();
    const result = contract.execute(makeRequest());
    expect(result.pulse.watchdogStatus).toBe("NOMINAL");
    expect(result.escalationDecision.action).toBe("CLEAR");
    expect(result.escalationActive).toBe(false);
    expect(result.dominantAction).toBe("CLEAR");
  });

  it("CRITICAL obs → ESCALATE escalation, escalationActive true", () => {
    const contract = makeContract();
    const result = contract.execute(makeRequest(CRITICAL_OBS, COMPLETED_EXEC));
    expect(result.pulse.watchdogStatus).toBe("CRITICAL");
    expect(result.alertLog.alertActive).toBe(true);
    expect(result.escalationDecision.action).toBe("ESCALATE");
    expect(result.escalationActive).toBe(true);
    expect(result.dominantAction).toBe("ESCALATE");
  });

  it("DEGRADED obs → WARNING pulse → MONITOR escalation, escalationActive false", () => {
    const contract = makeContract();
    const result = contract.execute(makeRequest(DEGRADED_OBS, COMPLETED_EXEC));
    expect(result.pulse.watchdogStatus).toBe("WARNING");
    expect(result.alertLog.alertActive).toBe(true);
    expect(result.escalationDecision.action).toBe("MONITOR");
    expect(result.escalationActive).toBe(false);
  });

  it("FAILED exec → CRITICAL watchdog status → ESCALATE escalation", () => {
    const contract = makeContract();
    const result = contract.execute(makeRequest(NOMINAL_OBS, FAILED_EXEC));
    expect(result.pulse.watchdogStatus).toBe("CRITICAL");
    expect(result.escalationDecision.action).toBe("ESCALATE");
    expect(result.escalationActive).toBe(true);
  });

  it("per-request strictMode policy → ESCALATE on any active alert", () => {
    const contract = makeContract();
    const result = contract.execute(
      makeRequest(DEGRADED_OBS, COMPLETED_EXEC, { strictMode: true }),
    );
    expect(result.escalationDecision.action).toBe("ESCALATE");
    expect(result.escalationActive).toBe(true);
  });

  it("contract-level default policy applies when no per-request policy", () => {
    const contract = makeContract({ strictMode: true });
    const result = contract.execute(makeRequest(DEGRADED_OBS, COMPLETED_EXEC));
    expect(result.escalationDecision.action).toBe("ESCALATE");
    expect(result.escalationActive).toBe(true);
  });

  it("per-request policy takes precedence over contract-level default", () => {
    const contract = makeContract({ strictMode: true });
    const result = contract.execute(
      makeRequest(NOMINAL_OBS, COMPLETED_EXEC, { strictMode: false }),
    );
    // NOMINAL obs + COMPLETED exec → CLEAR (no active alert regardless of strictMode)
    expect(result.escalationDecision.action).toBe("CLEAR");
    expect(result.escalationActive).toBe(false);
  });

  it("resultId and pipelineHash are deterministic for same input", () => {
    const contract = makeContract();
    const req = makeRequest(CRITICAL_OBS, COMPLETED_EXEC);
    const r1 = contract.execute(req);
    const r2 = contract.execute(req);
    expect(r1.resultId).toBe(r2.resultId);
    expect(r1.pipelineHash).toBe(r2.pipelineHash);
  });

  it("all pipeline stages populated on result", () => {
    const contract = makeContract();
    const result = contract.execute(makeRequest());
    expect(result.pulse).toBeDefined();
    expect(result.alertLog).toBeDefined();
    expect(result.escalationDecision).toBeDefined();
    expect(result.escalationLog).toBeDefined();
    expect(result.pulse.pulseHash).toBeTruthy();
    expect(result.alertLog.logHash).toBeTruthy();
    expect(result.escalationDecision.decisionHash).toBeTruthy();
    expect(result.escalationLog.logHash).toBeTruthy();
  });

  it("escalationActive mirrors escalationLog.escalationActive", () => {
    const contract = makeContract();
    const result = contract.execute(makeRequest(CRITICAL_OBS, COMPLETED_EXEC));
    expect(result.escalationActive).toBe(result.escalationLog.escalationActive);
  });

  it("dominantAction mirrors escalationLog.dominantAction", () => {
    const contract = makeContract();
    const result = contract.execute(makeRequest(CRITICAL_OBS, COMPLETED_EXEC));
    expect(result.dominantAction).toBe(result.escalationLog.dominantAction);
  });

  it("createdAt is set on result", () => {
    const contract = makeContract();
    const result = contract.execute(makeRequest());
    expect(result.createdAt).toBe(FIXED_NOW);
  });
});

// ─── createWatchdogEscalationPipelineContract factory ─────────────────────────

describe("createWatchdogEscalationPipelineContract", () => {
  it("returns a working instance with no dependencies", () => {
    const contract = createWatchdogEscalationPipelineContract();
    const result = contract.execute(makeRequest());
    expect(result.resultId).toBeTruthy();
    expect(result.pipelineHash).toBeTruthy();
  });

  it("accepts policy dependency", () => {
    const contract = createWatchdogEscalationPipelineContract({
      policy: { strictMode: true },
      now: fixedNow,
    });
    const result = contract.execute(makeRequest(DEGRADED_OBS, COMPLETED_EXEC));
    expect(result.escalationDecision.action).toBe("ESCALATE");
  });
});
