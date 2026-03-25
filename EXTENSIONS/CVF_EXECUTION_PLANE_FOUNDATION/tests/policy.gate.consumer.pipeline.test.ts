import { describe, it, expect } from "vitest";
import {
  PolicyGateConsumerPipelineContract,
  createPolicyGateConsumerPipelineContract,
} from "../src/policy.gate.consumer.pipeline.contract";
import type { PolicyGateConsumerPipelineRequest } from "../src/policy.gate.consumer.pipeline.contract";
import type { DispatchResult } from "../src/dispatch.contract";
import type { GuardDecision } from "../../CVF_ECO_v2.5_MCP_SERVER/src/sdk";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIXED_TS = "2026-03-25T10:00:00.000Z";

function fixedNow(ts = FIXED_TS): () => string {
  return () => ts;
}

function makeDispatchResult(
  entries: { assignmentId: string; taskId: string; guardDecision: GuardDecision; riskLevel: string }[] = [],
): DispatchResult {
  const dispatchEntries = entries.map((e) => ({
    assignmentId: e.assignmentId,
    taskId: e.taskId,
    riskLevel: e.riskLevel,
    dispatchedAt: FIXED_TS,
    guardDecision: e.guardDecision,
    pipelineResult: {
      requestId: e.assignmentId,
      finalDecision: e.guardDecision,
      results: [],
      executedAt: FIXED_TS,
      durationMs: 1,
    },
    dispatchAuthorized: e.guardDecision === "ALLOW",
  }));

  return {
    dispatchId: "dispatch-001",
    orchestrationId: "orch-001",
    dispatchedAt: FIXED_TS,
    entries: dispatchEntries as unknown as DispatchResult["entries"],
    totalDispatched: entries.length,
    authorizedCount: entries.filter((e) => e.guardDecision === "ALLOW").length,
    blockedCount: entries.filter((e) => e.guardDecision === "BLOCK").length,
    escalatedCount: entries.filter((e) => e.guardDecision === "ESCALATE").length,
    dispatchHash: "dispatch-hash-001",
    warnings: [],
  };
}

function makeRequest(
  entries: { assignmentId: string; taskId: string; guardDecision: GuardDecision; riskLevel: string }[] = [],
  overrides: Partial<PolicyGateConsumerPipelineRequest> = {},
): PolicyGateConsumerPipelineRequest {
  return { dispatchResult: makeDispatchResult(entries), ...overrides };
}

function allowEntry(id = "assign-001", riskLevel = "R1") {
  return { assignmentId: id, taskId: `task-${id}`, guardDecision: "ALLOW" as GuardDecision, riskLevel };
}

function blockEntry(id = "assign-001", riskLevel = "R3") {
  return { assignmentId: id, taskId: `task-${id}`, guardDecision: "BLOCK" as GuardDecision, riskLevel };
}

function escalateEntry(id = "assign-001", riskLevel = "R2") {
  return { assignmentId: id, taskId: `task-${id}`, guardDecision: "ESCALATE" as GuardDecision, riskLevel };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("PolicyGateConsumerPipelineContract", () => {
  it("returns a result with all required fields for an empty dispatch", () => {
    const contract = createPolicyGateConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.resultId).toBeTruthy();
    expect(result.createdAt).toBe(FIXED_TS);
    expect(result.gateResult).toBeDefined();
    expect(result.gateResult.entries).toHaveLength(0);
    expect(result.consumerPackage).toBeDefined();
    expect(result.pipelineHash).toBeTruthy();
    expect(result.warnings).toEqual([]);
  });

  it("derives query: [policy-gate] denied:N review:N sandbox:N total:N", () => {
    const contract = createPolicyGateConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([allowEntry()]));

    expect(result.consumerPackage.query).toBe("[policy-gate] denied:0 review:0 sandbox:0 total:1");
  });

  it("query is bounded at 120 chars", () => {
    const contract = createPolicyGateConsumerPipelineContract({ now: fixedNow() });
    const manyEntries = Array.from({ length: 9999 }, (_, i) => allowEntry(`assign-${i}`));
    const result = contract.execute(makeRequest(manyEntries));

    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
  });

  it("contextId on consumerPackage equals gateResult.gateId", () => {
    const contract = createPolicyGateConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.consumerPackage.contextId).toBe(result.gateResult.gateId);
  });

  it("ALLOW at R1 produces allowedCount=1 and no warnings", () => {
    const contract = createPolicyGateConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([allowEntry("a-001", "R1")]));

    expect(result.gateResult.allowedCount).toBe(1);
    expect(result.gateResult.deniedCount).toBe(0);
    expect(result.warnings).toEqual([]);
  });

  it("BLOCK entry produces deniedCount=1 and denial warning", () => {
    const contract = createPolicyGateConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([blockEntry()]));

    expect(result.gateResult.deniedCount).toBe(1);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("policy gate denials detected");
    expect(result.warnings[0]).toContain("review required");
  });

  it("ESCALATE entry produces reviewRequiredCount=1 and review warning", () => {
    const contract = createPolicyGateConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([escalateEntry()]));

    expect(result.gateResult.reviewRequiredCount).toBe(1);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("policy gate reviews pending");
    expect(result.warnings[0]).toContain("human review required");
  });

  it("ALLOW at R3 produces sandboxedCount=1 and no warnings", () => {
    const contract = createPolicyGateConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([allowEntry("a-001", "R3")]));

    expect(result.gateResult.sandboxedCount).toBe(1);
    expect(result.warnings).toEqual([]);
  });

  it("ALLOW at R2 produces reviewRequiredCount=1 and review warning", () => {
    const contract = createPolicyGateConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([allowEntry("a-001", "R2")]));

    expect(result.gateResult.reviewRequiredCount).toBe(1);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("policy gate reviews pending");
  });

  it("both BLOCK and ESCALATE entries produce both warnings", () => {
    const contract = createPolicyGateConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([
      blockEntry("a-001"),
      escalateEntry("a-002"),
    ]));

    expect(result.gateResult.deniedCount).toBe(1);
    expect(result.gateResult.reviewRequiredCount).toBe(1);
    expect(result.warnings).toHaveLength(2);
  });

  it("consumerId is preserved when provided", () => {
    const contract = createPolicyGateConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([], { consumerId: "consumer-xyz" }));

    expect(result.consumerId).toBe("consumer-xyz");
  });

  it("consumerId is undefined when not provided", () => {
    const contract = createPolicyGateConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.consumerId).toBeUndefined();
  });

  it("resultId differs from pipelineHash", () => {
    const contract = createPolicyGateConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.resultId).not.toBe(result.pipelineHash);
  });

  it("consumerPackage contains estimatedTokens", () => {
    const contract = createPolicyGateConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(typeof result.consumerPackage.typedContextPackage.estimatedTokens).toBe("number");
  });

  it("is deterministic — same input produces identical hashes", () => {
    const contract = createPolicyGateConsumerPipelineContract({ now: fixedNow() });
    const r1 = contract.execute(makeRequest());
    const r2 = contract.execute(makeRequest());

    expect(r1.pipelineHash).toBe(r2.pipelineHash);
    expect(r1.resultId).toBe(r2.resultId);
    expect(r1.gateResult.gateHash).toBe(r2.gateResult.gateHash);
  });

  it("different dispatch entries produce different hashes", () => {
    const contract = createPolicyGateConsumerPipelineContract({ now: fixedNow() });
    const r1 = contract.execute(makeRequest([]));
    const r2 = contract.execute(makeRequest([allowEntry()]));

    expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
  });

  it("factory function creates a working contract", () => {
    const contract = createPolicyGateConsumerPipelineContract({ now: fixedNow() });
    expect(contract).toBeInstanceOf(PolicyGateConsumerPipelineContract);
    const result = contract.execute(makeRequest());
    expect(result.pipelineHash).toBeTruthy();
  });

  it("direct instantiation works identically to factory", () => {
    const now = fixedNow();
    const direct = new PolicyGateConsumerPipelineContract({ now });
    const via = createPolicyGateConsumerPipelineContract({ now });

    const r1 = direct.execute(makeRequest());
    const r2 = via.execute(makeRequest());

    expect(r1.pipelineHash).toBe(r2.pipelineHash);
  });

  it("gateResult is propagated in full to the result", () => {
    const contract = createPolicyGateConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([allowEntry("a-001", "R1")]));

    expect(result.gateResult.allowedCount).toBe(1);
    expect(result.gateResult.entries).toHaveLength(1);
    expect(result.gateResult.dispatchId).toBe("dispatch-001");
  });
});
