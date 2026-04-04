import { describe, it, expect } from "vitest";
import {
  PolicyGateConsumerPipelineBatchContract,
  createPolicyGateConsumerPipelineBatchContract,
} from "../src/policy.gate.consumer.pipeline.batch.contract";
import { createPolicyGateConsumerPipelineContract } from "../src/policy.gate.consumer.pipeline.contract";
import type { PolicyGateConsumerPipelineResult } from "../src/policy.gate.consumer.pipeline.contract";
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

function makeResult(
  entries: { assignmentId: string; taskId: string; guardDecision: GuardDecision; riskLevel: string }[] = [],
): PolicyGateConsumerPipelineResult {
  const contract = createPolicyGateConsumerPipelineContract({ now: fixedNow() });
  return contract.execute({ dispatchResult: makeDispatchResult(entries) });
}

function blockEntry(id = "assign-001") {
  return { assignmentId: id, taskId: `task-${id}`, guardDecision: "BLOCK" as GuardDecision, riskLevel: "R3" };
}

function escalateEntry(id = "assign-001") {
  return { assignmentId: id, taskId: `task-${id}`, guardDecision: "ESCALATE" as GuardDecision, riskLevel: "R2" };
}

function allowEntry(id = "assign-001") {
  return { assignmentId: id, taskId: `task-${id}`, guardDecision: "ALLOW" as GuardDecision, riskLevel: "R1" };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("PolicyGateConsumerPipelineBatchContract", () => {
  it("batches an empty array correctly", () => {
    const contract = createPolicyGateConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([]);

    expect(batch.totalResults).toBe(0);
    expect(batch.dominantTokenBudget).toBe(0);
    expect(batch.deniedResultCount).toBe(0);
    expect(batch.reviewResultCount).toBe(0);
    expect(batch.batchHash).toBeTruthy();
    expect(batch.batchId).toBeTruthy();
    expect(batch.results).toEqual([]);
  });

  it("counts deniedResultCount from results with deniedCount > 0", () => {
    const contract = createPolicyGateConsumerPipelineBatchContract({ now: fixedNow() });
    const r1 = makeResult([blockEntry("a-001")]);
    const r2 = makeResult([blockEntry("a-002")]);
    const r3 = makeResult([allowEntry("a-003")]);
    const batch = contract.batch([r1, r2, r3]);

    expect(batch.deniedResultCount).toBe(2);
    expect(batch.reviewResultCount).toBe(0);
    expect(batch.totalResults).toBe(3);
  });

  it("counts reviewResultCount from results with reviewRequiredCount > 0", () => {
    const contract = createPolicyGateConsumerPipelineBatchContract({ now: fixedNow() });
    const r1 = makeResult([escalateEntry("a-001")]);
    const r2 = makeResult([escalateEntry("a-002")]);
    const r3 = makeResult([allowEntry("a-003")]);
    const batch = contract.batch([r1, r2, r3]);

    expect(batch.reviewResultCount).toBe(2);
    expect(batch.deniedResultCount).toBe(0);
  });

  it("dominantTokenBudget is max estimatedTokens across results", () => {
    const contract = createPolicyGateConsumerPipelineBatchContract({ now: fixedNow() });
    const r1 = makeResult([allowEntry()]);
    const r2 = makeResult([blockEntry()]);
    const batch = contract.batch([r1, r2]);

    const expectedMax = Math.max(
      r1.consumerPackage.typedContextPackage.estimatedTokens,
      r2.consumerPackage.typedContextPackage.estimatedTokens,
    );
    expect(batch.dominantTokenBudget).toBe(expectedMax);
  });

  it("dominantTokenBudget is 0 for empty batch", () => {
    const contract = createPolicyGateConsumerPipelineBatchContract({ now: fixedNow() });
    expect(contract.batch([]).dominantTokenBudget).toBe(0);
  });

  it("batchId differs from batchHash", () => {
    const contract = createPolicyGateConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([makeResult()]);

    expect(batch.batchId).not.toBe(batch.batchHash);
  });

  it("results are preserved in output batch", () => {
    const contract = createPolicyGateConsumerPipelineBatchContract({ now: fixedNow() });
    const r1 = makeResult([allowEntry("a-001")]);
    const r2 = makeResult([blockEntry("a-002")]);
    const batch = contract.batch([r1, r2]);

    expect(batch.results).toHaveLength(2);
    expect(batch.results[0].resultId).toBe(r1.resultId);
    expect(batch.results[1].resultId).toBe(r2.resultId);
  });

  it("is deterministic — same inputs produce identical batch hashes", () => {
    const contract = createPolicyGateConsumerPipelineBatchContract({ now: fixedNow() });
    const r1 = makeResult();
    const b1 = contract.batch([r1]);
    const b2 = contract.batch([r1]);

    expect(b1.batchHash).toBe(b2.batchHash);
    expect(b1.batchId).toBe(b2.batchId);
  });

  it("different results produce different batchHash", () => {
    const contract = createPolicyGateConsumerPipelineBatchContract({ now: fixedNow() });
    const b1 = contract.batch([makeResult()]);
    const b2 = contract.batch([makeResult([allowEntry()])]);

    expect(b1.batchHash).not.toBe(b2.batchHash);
  });

  it("factory creates a working contract", () => {
    const contract = createPolicyGateConsumerPipelineBatchContract({ now: fixedNow() });
    expect(contract).toBeInstanceOf(PolicyGateConsumerPipelineBatchContract);
    expect(contract.batch([makeResult()]).batchHash).toBeTruthy();
  });

  it("createdAt is set from injected now()", () => {
    const contract = createPolicyGateConsumerPipelineBatchContract({ now: fixedNow() });
    expect(contract.batch([makeResult()]).createdAt).toBe(FIXED_TS);
  });

  it("clean results (no denials, no reviews) do not increment deniedResult or reviewResult counts", () => {
    const contract = createPolicyGateConsumerPipelineBatchContract({ now: fixedNow() });
    const rClean = makeResult([allowEntry("a-001", )]);
    const rSandbox = makeResult([{ assignmentId: "a-002", taskId: "task-a-002", guardDecision: "ALLOW" as GuardDecision, riskLevel: "R3" }]);
    const batch = contract.batch([rClean, rSandbox]);

    expect(batch.deniedResultCount).toBe(0);
    expect(batch.reviewResultCount).toBe(0);
    expect(batch.totalResults).toBe(2);
  });

  it("mixed denied and review results are counted independently", () => {
    const contract = createPolicyGateConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([
      makeResult([blockEntry("a-001")]),
      makeResult([escalateEntry("a-002")]),
      makeResult([allowEntry("a-003")]),
    ]);

    expect(batch.deniedResultCount).toBe(1);
    expect(batch.reviewResultCount).toBe(1);
  });
});
