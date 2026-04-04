import { describe, it, expect } from "vitest";
import {
  GovernanceCheckpointLogConsumerPipelineContract,
  createGovernanceCheckpointLogConsumerPipelineContract,
} from "../src/governance.checkpoint.log.consumer.pipeline.contract";
import type { GovernanceCheckpointLogConsumerPipelineRequest } from "../src/governance.checkpoint.log.consumer.pipeline.contract";
import type { GovernanceCheckpointDecision } from "../src/governance.checkpoint.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDecision(
  action: GovernanceCheckpointDecision["checkpointAction"] = "PROCEED",
  id = "checkpoint-001",
): GovernanceCheckpointDecision {
  return {
    checkpointId: id,
    generatedAt: "2026-03-24T10:00:00.000Z",
    sourceConsensusSummaryId: `summary-${id}`,
    checkpointAction: action,
    checkpointRationale: `rationale-${action}`,
    dominantVerdictRef: action === "ESCALATE" ? "ESCALATE" : action === "HALT" ? "PAUSE" : "PROCEED",
    totalDecisionsRef: 3,
    checkpointHash: `hash-${id}`,
  };
}

function makeRequest(
  decisions: GovernanceCheckpointDecision[] = [makeDecision("PROCEED")],
  overrides: Partial<GovernanceCheckpointLogConsumerPipelineRequest> = {},
): GovernanceCheckpointLogConsumerPipelineRequest {
  return { decisions, ...overrides };
}

function fixedNow(ts = "2026-03-24T10:00:00.000Z"): () => string {
  return () => ts;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GovernanceCheckpointLogConsumerPipelineContract", () => {
  it("is instantiable via factory", () => {
    const contract = createGovernanceCheckpointLogConsumerPipelineContract({ now: fixedNow() });
    expect(contract).toBeInstanceOf(GovernanceCheckpointLogConsumerPipelineContract);
  });

  it("returns all required fields for PROCEED decisions (no warnings)", () => {
    const contract = createGovernanceCheckpointLogConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([makeDecision("PROCEED")]));

    expect(result.resultId).toBeTruthy();
    expect(result.createdAt).toBe("2026-03-24T10:00:00.000Z");
    expect(result.checkpointLog).toBeDefined();
    expect(result.checkpointLog.dominantCheckpointAction).toBe("PROCEED");
    expect(result.consumerPackage).toBeDefined();
    expect(result.pipelineHash).toBeTruthy();
    expect(result.warnings).toEqual([]);
  });

  it("ESCALATE dominant action produces warning — immediate checkpoint escalation required", () => {
    const contract = createGovernanceCheckpointLogConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([
      makeDecision("ESCALATE", "d-1"),
      makeDecision("ESCALATE", "d-2"),
      makeDecision("PROCEED", "d-3"),
    ]));

    expect(result.checkpointLog.dominantCheckpointAction).toBe("ESCALATE");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[governance-checkpoint-log] dominant action ESCALATE");
    expect(result.warnings[0]).toContain("immediate checkpoint escalation required");
  });

  it("HALT dominant action produces warning — checkpoint halt required", () => {
    const contract = createGovernanceCheckpointLogConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([
      makeDecision("HALT", "d-1"),
      makeDecision("HALT", "d-2"),
      makeDecision("PROCEED", "d-3"),
    ]));

    expect(result.checkpointLog.dominantCheckpointAction).toBe("HALT");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[governance-checkpoint-log] dominant action HALT");
    expect(result.warnings[0]).toContain("checkpoint halt required");
  });

  it("PROCEED-only decisions produce no warnings", () => {
    const contract = createGovernanceCheckpointLogConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([
      makeDecision("PROCEED", "d-1"),
      makeDecision("PROCEED", "d-2"),
    ]));

    expect(result.checkpointLog.dominantCheckpointAction).toBe("PROCEED");
    expect(result.warnings).toEqual([]);
  });

  it("ESCALATE takes priority over HALT (severity-first)", () => {
    const contract = createGovernanceCheckpointLogConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([
      makeDecision("HALT", "d-1"),
      makeDecision("ESCALATE", "d-2"),
      makeDecision("PROCEED", "d-3"),
    ]));

    expect(result.checkpointLog.dominantCheckpointAction).toBe("ESCALATE");
    expect(result.warnings[0]).toContain("ESCALATE");
  });

  it("query is derived from dominantCheckpointAction and totalCheckpoints (sliced to 120)", () => {
    const contract = createGovernanceCheckpointLogConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([makeDecision("PROCEED")]));

    expect(result.consumerPackage.query).toContain("[checkpoint-log]");
    expect(result.consumerPackage.query).toContain("PROCEED");
    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
  });

  it("contextId on consumerPackage equals checkpointLog.logId", () => {
    const contract = createGovernanceCheckpointLogConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.consumerPackage.contextId).toBe(result.checkpointLog.logId);
  });

  it("checkpointLog reflects correct counts", () => {
    const contract = createGovernanceCheckpointLogConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([
      makeDecision("ESCALATE", "d-1"),
      makeDecision("HALT", "d-2"),
      makeDecision("PROCEED", "d-3"),
    ]));

    expect(result.checkpointLog.totalCheckpoints).toBe(3);
    expect(result.checkpointLog.escalateCount).toBe(1);
    expect(result.checkpointLog.haltCount).toBe(1);
    expect(result.checkpointLog.proceedCount).toBe(1);
  });

  it("consumerId is preserved when provided", () => {
    const contract = createGovernanceCheckpointLogConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([makeDecision()], { consumerId: "consumer-abc" }));

    expect(result.consumerId).toBe("consumer-abc");
  });

  it("consumerId is undefined when not provided", () => {
    const contract = createGovernanceCheckpointLogConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.consumerId).toBeUndefined();
  });

  it("resultId differs from pipelineHash", () => {
    const contract = createGovernanceCheckpointLogConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.resultId).not.toBe(result.pipelineHash);
  });

  it("consumerPackage contains estimatedTokens", () => {
    const contract = createGovernanceCheckpointLogConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(typeof result.consumerPackage.typedContextPackage.estimatedTokens).toBe("number");
  });

  it("is deterministic — same input produces identical hashes", () => {
    const contract = createGovernanceCheckpointLogConsumerPipelineContract({ now: fixedNow() });
    const r1 = contract.execute(makeRequest([makeDecision("PROCEED")]));
    const r2 = contract.execute(makeRequest([makeDecision("PROCEED")]));

    expect(r1.pipelineHash).toBe(r2.pipelineHash);
    expect(r1.resultId).toBe(r2.resultId);
    expect(r1.checkpointLog.logHash).toBe(r2.checkpointLog.logHash);
  });

  it("different action produces different pipelineHash", () => {
    const contract = createGovernanceCheckpointLogConsumerPipelineContract({ now: fixedNow() });
    const r1 = contract.execute(makeRequest([makeDecision("PROCEED", "d-1")]));
    const r2 = contract.execute(makeRequest([makeDecision("ESCALATE", "d-1")]));

    expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
  });

  it("direct instantiation works identically to factory", () => {
    const now = fixedNow();
    const direct = new GovernanceCheckpointLogConsumerPipelineContract({ now });
    const via = createGovernanceCheckpointLogConsumerPipelineContract({ now });

    const r1 = direct.execute(makeRequest());
    const r2 = via.execute(makeRequest());

    expect(r1.pipelineHash).toBe(r2.pipelineHash);
  });

  it("createdAt matches injected now", () => {
    const ts = "2026-03-24T12:00:00.000Z";
    const contract = createGovernanceCheckpointLogConsumerPipelineContract({ now: fixedNow(ts) });
    const result = contract.execute(makeRequest());

    expect(result.createdAt).toBe(ts);
  });
});
