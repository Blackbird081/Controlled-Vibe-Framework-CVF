import { describe, it, expect } from "vitest";
import {
  WatchdogEscalationPipelineConsumerPipelineContract,
  createWatchdogEscalationPipelineConsumerPipelineContract,
} from "../src/watchdog.escalation.pipeline.consumer.pipeline.contract";
import type { WatchdogEscalationPipelineConsumerPipelineRequest } from "../src/watchdog.escalation.pipeline.consumer.pipeline.contract";
import type { WatchdogObservabilityInput, WatchdogExecutionInput } from "../src/watchdog.pulse.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeObsInput(
  overrides: Partial<WatchdogObservabilityInput> = {},
): WatchdogObservabilityInput {
  return {
    snapshotId: "snap-001",
    dominantHealth: "HEALTHY",
    criticalCount: 0,
    degradedCount: 0,
    ...overrides,
  };
}

function makeExecInput(
  overrides: Partial<WatchdogExecutionInput> = {},
): WatchdogExecutionInput {
  return {
    summaryId: "exec-001",
    dominantStatus: "COMPLETED",
    failedCount: 0,
    runningCount: 0,
    ...overrides,
  };
}

function makeRequest(
  overrides: Partial<WatchdogEscalationPipelineConsumerPipelineRequest> = {},
): WatchdogEscalationPipelineConsumerPipelineRequest {
  return {
    observabilityInput: makeObsInput(),
    executionInput: makeExecInput(),
    ...overrides,
  };
}

function fixedNow(ts = "2026-03-24T10:00:00.000Z"): () => string {
  return () => ts;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("WatchdogEscalationPipelineConsumerPipelineContract", () => {
  it("is instantiable via factory", () => {
    const contract = createWatchdogEscalationPipelineConsumerPipelineContract({ now: fixedNow() });
    expect(contract).toBeInstanceOf(WatchdogEscalationPipelineConsumerPipelineContract);
  });

  it("returns all required fields for healthy pipeline (no warnings)", () => {
    const contract = createWatchdogEscalationPipelineConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.resultId).toBeTruthy();
    expect(result.createdAt).toBe("2026-03-24T10:00:00.000Z");
    expect(result.pipelineResult).toBeDefined();
    expect(result.pipelineResult.pipelineHash).toBeTruthy();
    expect(result.consumerPackage).toBeDefined();
    expect(result.pipelineHash).toBeTruthy();
    expect(result.warnings).toEqual([]);
  });

  it("critical health status triggers ESCALATE warning — immediate pipeline intervention", () => {
    const contract = createWatchdogEscalationPipelineConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest({
      observabilityInput: makeObsInput({ dominantHealth: "CRITICAL", criticalCount: 1 }),
      executionInput: makeExecInput({ dominantStatus: "FAILED", failedCount: 1 }),
    }));

    expect(result.pipelineResult.escalationActive).toBe(true);
    expect(result.pipelineResult.dominantAction).toBe("ESCALATE");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[watchdog-escalation-pipeline] active escalation");
    expect(result.warnings[0]).toContain("immediate pipeline intervention required");
  });

  it("degraded health status may trigger MONITOR warning", () => {
    const contract = createWatchdogEscalationPipelineConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest({
      observabilityInput: makeObsInput({ dominantHealth: "DEGRADED", degradedCount: 1 }),
    }));

    if (result.pipelineResult.dominantAction === "MONITOR") {
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain("[watchdog-escalation-pipeline] monitor active");
      expect(result.warnings[0]).toContain("pipeline monitoring in progress");
    } else {
      expect(result.warnings).toEqual([]);
    }
  });

  it("healthy pipeline produces no warnings", () => {
    const contract = createWatchdogEscalationPipelineConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest({
      observabilityInput: makeObsInput({ dominantHealth: "HEALTHY", criticalCount: 0 }),
      executionInput: makeExecInput({ dominantStatus: "COMPLETED", failedCount: 0 }),
    }));

    if (result.pipelineResult.dominantAction === "CLEAR") {
      expect(result.warnings).toEqual([]);
    }
  });

  it("query is derived from escalationLog.summary (sliced to 120)", () => {
    const contract = createWatchdogEscalationPipelineConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.consumerPackage.query).toBe(
      result.pipelineResult.escalationLog.summary.slice(0, 120),
    );
    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
  });

  it("contextId on consumerPackage equals pipelineResult.resultId", () => {
    const contract = createWatchdogEscalationPipelineConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.consumerPackage.contextId).toBe(result.pipelineResult.resultId);
  });

  it("pipelineResult contains full escalation pipeline chain", () => {
    const contract = createWatchdogEscalationPipelineConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.pipelineResult.pulse).toBeDefined();
    expect(result.pipelineResult.alertLog).toBeDefined();
    expect(result.pipelineResult.escalationDecision).toBeDefined();
    expect(result.pipelineResult.escalationLog).toBeDefined();
  });

  it("consumerId is preserved when provided", () => {
    const contract = createWatchdogEscalationPipelineConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest({ consumerId: "consumer-abc" }));

    expect(result.consumerId).toBe("consumer-abc");
  });

  it("consumerId is undefined when not provided", () => {
    const contract = createWatchdogEscalationPipelineConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.consumerId).toBeUndefined();
  });

  it("resultId differs from pipelineHash", () => {
    const contract = createWatchdogEscalationPipelineConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.resultId).not.toBe(result.pipelineHash);
  });

  it("consumerPackage contains estimatedTokens", () => {
    const contract = createWatchdogEscalationPipelineConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(typeof result.consumerPackage.typedContextPackage.estimatedTokens).toBe("number");
  });

  it("is deterministic — same input produces identical hashes", () => {
    const contract = createWatchdogEscalationPipelineConsumerPipelineContract({ now: fixedNow() });
    const r1 = contract.execute(makeRequest());
    const r2 = contract.execute(makeRequest());

    expect(r1.pipelineHash).toBe(r2.pipelineHash);
    expect(r1.resultId).toBe(r2.resultId);
    expect(r1.pipelineResult.pipelineHash).toBe(r2.pipelineResult.pipelineHash);
  });

  it("different health status produces different pipelineHash", () => {
    const contract = createWatchdogEscalationPipelineConsumerPipelineContract({ now: fixedNow() });
    const r1 = contract.execute(makeRequest({
      observabilityInput: makeObsInput({ dominantHealth: "HEALTHY", criticalCount: 0 }),
    }));
    const r2 = contract.execute(makeRequest({
      observabilityInput: makeObsInput({ dominantHealth: "CRITICAL", criticalCount: 1 }),
    }));

    expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
  });

  it("pipelineResult.escalationActive matches escalationLog.escalationActive", () => {
    const contract = createWatchdogEscalationPipelineConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest({
      observabilityInput: makeObsInput({ dominantHealth: "CRITICAL", criticalCount: 1 }),
      executionInput: makeExecInput({ dominantStatus: "FAILED", failedCount: 1 }),
    }));

    expect(result.pipelineResult.escalationActive).toBe(
      result.pipelineResult.escalationLog.escalationActive,
    );
  });

  it("direct instantiation works identically to factory", () => {
    const now = fixedNow();
    const direct = new WatchdogEscalationPipelineConsumerPipelineContract({ now });
    const via = createWatchdogEscalationPipelineConsumerPipelineContract({ now });

    const r1 = direct.execute(makeRequest());
    const r2 = via.execute(makeRequest());

    expect(r1.pipelineHash).toBe(r2.pipelineHash);
  });

  it("createdAt matches injected now", () => {
    const ts = "2026-03-24T12:00:00.000Z";
    const contract = createWatchdogEscalationPipelineConsumerPipelineContract({ now: fixedNow(ts) });
    const result = contract.execute(makeRequest());

    expect(result.createdAt).toBe(ts);
  });
});
