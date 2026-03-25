import { describe, it, expect } from "vitest";
import {
  WatchdogPulseConsumerPipelineContract,
  createWatchdogPulseConsumerPipelineContract,
} from "../src/watchdog.pulse.consumer.pipeline.contract";
import type { WatchdogPulseConsumerPipelineRequest } from "../src/watchdog.pulse.consumer.pipeline.contract";
import type {
  WatchdogObservabilityInput,
  WatchdogExecutionInput,
} from "../src/watchdog.pulse.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIXED_TS = "2026-03-25T10:00:00.000Z";

function fixedNow(ts = FIXED_TS): () => string {
  return () => ts;
}

function makeObs(
  dominantHealth: WatchdogObservabilityInput["dominantHealth"] = "HEALTHY",
  criticalCount = 0,
  degradedCount = 0,
): WatchdogObservabilityInput {
  return {
    snapshotId: "snap-001",
    dominantHealth,
    criticalCount,
    degradedCount,
  };
}

function makeExec(
  dominantStatus: WatchdogExecutionInput["dominantStatus"] = "COMPLETED",
  failedCount = 0,
  runningCount = 0,
): WatchdogExecutionInput {
  return {
    summaryId: "sum-001",
    dominantStatus,
    failedCount,
    runningCount,
  };
}

function makeRequest(
  obs: WatchdogObservabilityInput = makeObs(),
  exec: WatchdogExecutionInput = makeExec(),
): WatchdogPulseConsumerPipelineRequest {
  return { observabilityInput: obs, executionInput: exec };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("WatchdogPulseConsumerPipelineContract", () => {
  it("execute returns a result with resultId, pipelineHash, and pulse", () => {
    const contract = createWatchdogPulseConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.resultId).toBeTruthy();
    expect(result.pipelineHash).toBeTruthy();
    expect(result.pulse).toBeDefined();
  });

  it("pulse.watchdogStatus is NOMINAL for healthy+completed inputs", () => {
    const contract = createWatchdogPulseConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest(makeObs("HEALTHY"), makeExec("COMPLETED")));

    expect(result.pulse.watchdogStatus).toBe("NOMINAL");
  });

  it("pulse.watchdogStatus is CRITICAL when obsHealth is CRITICAL", () => {
    const contract = createWatchdogPulseConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest(makeObs("CRITICAL", 1), makeExec("RUNNING")));

    expect(result.pulse.watchdogStatus).toBe("CRITICAL");
  });

  it("pulse.watchdogStatus is WARNING when obsHealth is DEGRADED", () => {
    const contract = createWatchdogPulseConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest(makeObs("DEGRADED", 0, 1), makeExec("COMPLETED")));

    expect(result.pulse.watchdogStatus).toBe("WARNING");
  });

  it("pulse.watchdogStatus is CRITICAL when exec dominantStatus is FAILED", () => {
    const contract = createWatchdogPulseConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest(makeObs("HEALTHY"), makeExec("FAILED", 1)));

    expect(result.pulse.watchdogStatus).toBe("CRITICAL");
  });

  it("query contains [watchdog-pulse] with status, obs health, and exec status", () => {
    const contract = createWatchdogPulseConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest(makeObs("HEALTHY"), makeExec("COMPLETED")));

    const query = result.consumerPackage.typedContextPackage.query;
    expect(query).toMatch(/^\[watchdog-pulse\] status:NOMINAL obs:HEALTHY exec:COMPLETED/);
  });

  it("query for CRITICAL status contains status:CRITICAL obs:CRITICAL", () => {
    const contract = createWatchdogPulseConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest(makeObs("CRITICAL", 1), makeExec("COMPLETED")));

    const query = result.consumerPackage.typedContextPackage.query;
    expect(query).toContain("status:CRITICAL");
    expect(query).toContain("obs:CRITICAL");
  });

  it("query for WARNING status contains status:WARNING obs:DEGRADED", () => {
    const contract = createWatchdogPulseConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest(makeObs("DEGRADED", 0, 1), makeExec("COMPLETED")));

    const query = result.consumerPackage.typedContextPackage.query;
    expect(query).toContain("status:WARNING");
    expect(query).toContain("obs:DEGRADED");
  });

  it("query is sliced to max 120 characters", () => {
    const contract = createWatchdogPulseConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest(makeObs("CRITICAL", 1), makeExec("FAILED", 1)));

    expect(result.consumerPackage.typedContextPackage.query.length).toBeLessThanOrEqual(120);
  });

  it("contextId is pulse.pulseId", () => {
    const contract = createWatchdogPulseConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.consumerPackage.typedContextPackage.contextId).toBe(result.pulse.pulseId);
  });

  it("CRITICAL watchdogStatus produces critical warning", () => {
    const contract = createWatchdogPulseConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest(makeObs("CRITICAL", 1), makeExec("COMPLETED")));

    expect(result.warnings).toContain(
      "[watchdog-pulse] critical pulse detected — immediate governance review required",
    );
  });

  it("WARNING watchdogStatus produces warning pulse warning", () => {
    const contract = createWatchdogPulseConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest(makeObs("DEGRADED", 0, 1), makeExec("COMPLETED")));

    expect(result.warnings).toContain(
      "[watchdog-pulse] warning pulse detected — system health degraded",
    );
  });

  it("NOMINAL watchdogStatus produces no warnings", () => {
    const contract = createWatchdogPulseConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest(makeObs("HEALTHY"), makeExec("COMPLETED")));

    expect(result.warnings).toHaveLength(0);
  });

  it("resultId differs from pipelineHash", () => {
    const contract = createWatchdogPulseConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.resultId).not.toBe(result.pipelineHash);
  });

  it("estimatedTokens is present and positive", () => {
    const contract = createWatchdogPulseConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest(makeObs("CRITICAL", 1), makeExec("FAILED", 1)));

    expect(result.consumerPackage.typedContextPackage.estimatedTokens).toBeGreaterThan(0);
  });

  it("consumerId is propagated when set", () => {
    const contract = createWatchdogPulseConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute({ ...makeRequest(), consumerId: "gov-consumer-007" });

    expect(result.consumerId).toBe("gov-consumer-007");
  });

  it("consumerId is undefined when not set", () => {
    const contract = createWatchdogPulseConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.consumerId).toBeUndefined();
  });

  it("createdAt is set from injected now()", () => {
    const contract = createWatchdogPulseConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.createdAt).toBe(FIXED_TS);
  });

  it("is deterministic — same inputs produce identical pipelineHash", () => {
    const contract = createWatchdogPulseConsumerPipelineContract({ now: fixedNow() });
    const r1 = contract.execute(makeRequest(makeObs("CRITICAL", 1), makeExec("FAILED", 1)));
    const r2 = contract.execute(makeRequest(makeObs("CRITICAL", 1), makeExec("FAILED", 1)));

    expect(r1.pipelineHash).toBe(r2.pipelineHash);
    expect(r1.resultId).toBe(r2.resultId);
  });

  it("different inputs produce different pipelineHash", () => {
    const contract = createWatchdogPulseConsumerPipelineContract({ now: fixedNow() });
    const r1 = contract.execute(makeRequest(makeObs("HEALTHY"), makeExec("COMPLETED")));
    const r2 = contract.execute(makeRequest(makeObs("CRITICAL", 1), makeExec("FAILED", 1)));

    expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
  });

  it("factory creates a working contract", () => {
    const contract = createWatchdogPulseConsumerPipelineContract({ now: fixedNow() });
    expect(contract).toBeInstanceOf(WatchdogPulseConsumerPipelineContract);
    expect(contract.execute(makeRequest()).pipelineHash).toBeTruthy();
  });

  it("direct instantiation and factory produce equivalent results", () => {
    const obs = makeObs("WARNING" as WatchdogObservabilityInput["dominantHealth"]);
    const exec = makeExec("RUNNING");
    const direct = new WatchdogPulseConsumerPipelineContract({ now: fixedNow() });
    const factory = createWatchdogPulseConsumerPipelineContract({ now: fixedNow() });

    expect(direct.execute({ observabilityInput: obs, executionInput: exec }).pipelineHash).toBe(
      factory.execute({ observabilityInput: obs, executionInput: exec }).pipelineHash,
    );
  });
});
