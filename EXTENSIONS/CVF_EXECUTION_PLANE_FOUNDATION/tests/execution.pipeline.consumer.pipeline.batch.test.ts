import { describe, it, expect } from "vitest";
import {
  ExecutionPipelineConsumerPipelineBatchContract,
  createExecutionPipelineConsumerPipelineBatchContract,
} from "../src/execution.pipeline.consumer.pipeline.batch.contract";
import { createExecutionPipelineConsumerPipelineContract } from "../src/execution.pipeline.consumer.pipeline.contract";
import type { ExecutionPipelineConsumerPipelineResult } from "../src/execution.pipeline.consumer.pipeline.contract";
import type { ExecutionBridgeReceipt } from "../src/execution.bridge.consumer.contract";
import type { PolicyGateEntry, PolicyGateResult } from "../src/policy.gate.contract";
import type { DispatchResult } from "../src/dispatch.contract";
import type { RuntimeExecutionRecord } from "../src/command.runtime.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fixedNow(ts = "2026-03-25T10:00:00.000Z"): () => string {
  return () => ts;
}

function makePolicyGateEntry(
  gateDecision: PolicyGateEntry["gateDecision"],
  id = "assign-001",
): PolicyGateEntry {
  return {
    assignmentId: id,
    taskId: `task-${id}`,
    guardDecision: "ALLOW",
    riskLevel: "R1",
    gateDecision,
    rationale: "test rationale",
  };
}

function makePolicyGateResult(entries: PolicyGateEntry[]): PolicyGateResult {
  return {
    gateId: "gate-001",
    dispatchId: "dispatch-001",
    evaluatedAt: "2026-03-25T10:00:00.000Z",
    entries,
    allowedCount: entries.filter((e) => e.gateDecision === "allow").length,
    deniedCount: entries.filter((e) => e.gateDecision === "deny").length,
    reviewRequiredCount: entries.filter((e) => e.gateDecision === "review").length,
    sandboxedCount: entries.filter((e) => e.gateDecision === "sandbox").length,
    pendingCount: entries.filter((e) => e.gateDecision === "pending").length,
    gateHash: "gate-hash-001",
    summary: "Test",
  };
}

function makeDispatchResult(): DispatchResult {
  return {
    dispatchId: "dispatch-001",
    orchestrationId: "orch-001",
    dispatchedAt: "2026-03-25T10:00:00.000Z",
    entries: [],
    totalDispatched: 0,
    authorizedCount: 0,
    blockedCount: 0,
    escalatedCount: 0,
    dispatchHash: "dispatch-hash-001",
    warnings: [],
  };
}

function makeBridgeReceipt(gateEntries: PolicyGateEntry[] = []): ExecutionBridgeReceipt {
  const policyGateResult = makePolicyGateResult(gateEntries);
  return {
    bridgeReceiptId: "bridge-001",
    createdAt: "2026-03-25T10:00:00.000Z",
    designReceiptId: "design-001",
    orchestrationId: "orch-001",
    dispatchResult: makeDispatchResult(),
    policyGateResult,
    totalAssignments: gateEntries.length,
    authorizedForExecution: policyGateResult.allowedCount,
    requiresReview: policyGateResult.reviewRequiredCount,
    sandboxed: policyGateResult.sandboxedCount,
    blockedFromExecution: policyGateResult.deniedCount,
    pipelineStages: [],
    bridgeHash: "bridge-hash-001",
    warnings: [],
  };
}

function makeResult(
  gateEntries: PolicyGateEntry[] = [],
  executeTask?: (entry: PolicyGateEntry, sandbox: boolean) => RuntimeExecutionRecord,
): ExecutionPipelineConsumerPipelineResult {
  const contract = createExecutionPipelineConsumerPipelineContract({
    now: fixedNow(),
    pipelineContractDeps: executeTask
      ? { commandRuntimeDependencies: { executeTask } }
      : undefined,
  });
  return contract.execute({ bridgeReceipt: makeBridgeReceipt(gateEntries) });
}

function makeFailedTask(): (entry: PolicyGateEntry, sandbox: boolean) => RuntimeExecutionRecord {
  return (entry, sandbox) => ({
    assignmentId: entry.assignmentId,
    taskId: entry.taskId,
    gateDecision: entry.gateDecision,
    status: sandbox ? "DELEGATED_TO_SANDBOX" : "EXECUTION_FAILED",
    executionHash: "test-hash",
    notes: sandbox ? "sandboxed" : "forced failure",
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ExecutionPipelineConsumerPipelineBatchContract", () => {
  it("batches an empty array correctly", () => {
    const contract = createExecutionPipelineConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([]);

    expect(batch.totalResults).toBe(0);
    expect(batch.dominantTokenBudget).toBe(0);
    expect(batch.failedResultCount).toBe(0);
    expect(batch.sandboxedResultCount).toBe(0);
    expect(batch.batchHash).toBeTruthy();
    expect(batch.batchId).toBeTruthy();
    expect(batch.results).toEqual([]);
  });

  it("counts failedResultCount from results with failedCount > 0", () => {
    const contract = createExecutionPipelineConsumerPipelineBatchContract({ now: fixedNow() });
    const r1 = makeResult([makePolicyGateEntry("allow")], makeFailedTask());
    const r2 = makeResult([makePolicyGateEntry("allow")], makeFailedTask());
    const r3 = makeResult([makePolicyGateEntry("allow")]);
    const batch = contract.batch([r1, r2, r3]);

    expect(batch.failedResultCount).toBe(2);
    expect(batch.sandboxedResultCount).toBe(0);
    expect(batch.totalResults).toBe(3);
  });

  it("counts sandboxedResultCount from results with sandboxedCount > 0", () => {
    const contract = createExecutionPipelineConsumerPipelineBatchContract({ now: fixedNow() });
    const r1 = makeResult([makePolicyGateEntry("sandbox")]);
    const r2 = makeResult([makePolicyGateEntry("sandbox")]);
    const r3 = makeResult([makePolicyGateEntry("allow")]);
    const batch = contract.batch([r1, r2, r3]);

    expect(batch.sandboxedResultCount).toBe(2);
    expect(batch.failedResultCount).toBe(0);
  });

  it("dominantTokenBudget is max estimatedTokens across results", () => {
    const contract = createExecutionPipelineConsumerPipelineBatchContract({ now: fixedNow() });
    const r1 = makeResult([makePolicyGateEntry("allow")]);
    const r2 = makeResult([makePolicyGateEntry("sandbox")]);
    const batch = contract.batch([r1, r2]);

    const expectedMax = Math.max(
      r1.consumerPackage.typedContextPackage.estimatedTokens,
      r2.consumerPackage.typedContextPackage.estimatedTokens,
    );
    expect(batch.dominantTokenBudget).toBe(expectedMax);
  });

  it("dominantTokenBudget is 0 for empty batch", () => {
    const contract = createExecutionPipelineConsumerPipelineBatchContract({ now: fixedNow() });
    expect(contract.batch([]).dominantTokenBudget).toBe(0);
  });

  it("batchId differs from batchHash", () => {
    const contract = createExecutionPipelineConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([makeResult()]);

    expect(batch.batchId).not.toBe(batch.batchHash);
  });

  it("results are preserved in output batch", () => {
    const contract = createExecutionPipelineConsumerPipelineBatchContract({ now: fixedNow() });
    const r1 = makeResult([makePolicyGateEntry("allow")]);
    const r2 = makeResult([makePolicyGateEntry("sandbox")]);
    const batch = contract.batch([r1, r2]);

    expect(batch.results).toHaveLength(2);
    expect(batch.results[0].resultId).toBe(r1.resultId);
    expect(batch.results[1].resultId).toBe(r2.resultId);
  });

  it("is deterministic — same inputs produce identical batch hashes", () => {
    const contract = createExecutionPipelineConsumerPipelineBatchContract({ now: fixedNow() });
    const r1 = makeResult();
    const b1 = contract.batch([r1]);
    const b2 = contract.batch([r1]);

    expect(b1.batchHash).toBe(b2.batchHash);
    expect(b1.batchId).toBe(b2.batchId);
  });

  it("different results produce different batchHash", () => {
    const contract = createExecutionPipelineConsumerPipelineBatchContract({ now: fixedNow() });
    const b1 = contract.batch([makeResult()]);
    const b2 = contract.batch([makeResult([makePolicyGateEntry("allow")])]);

    expect(b1.batchHash).not.toBe(b2.batchHash);
  });

  it("factory creates a working contract", () => {
    const contract = createExecutionPipelineConsumerPipelineBatchContract({ now: fixedNow() });
    expect(contract).toBeInstanceOf(ExecutionPipelineConsumerPipelineBatchContract);
    expect(contract.batch([makeResult()]).batchHash).toBeTruthy();
  });

  it("createdAt is set from injected now()", () => {
    const contract = createExecutionPipelineConsumerPipelineBatchContract({ now: fixedNow() });
    expect(contract.batch([makeResult()]).createdAt).toBe("2026-03-25T10:00:00.000Z");
  });

  it("clean results (no failures, no sandbox) do not increment failedResult or sandboxedResult counts", () => {
    const contract = createExecutionPipelineConsumerPipelineBatchContract({ now: fixedNow() });
    const rClean = makeResult([makePolicyGateEntry("allow")]);
    const rSkipped = makeResult([makePolicyGateEntry("deny")]);
    const batch = contract.batch([rClean, rSkipped]);

    expect(batch.failedResultCount).toBe(0);
    expect(batch.sandboxedResultCount).toBe(0);
    expect(batch.totalResults).toBe(2);
  });

  it("mixed failed and sandboxed results are counted independently", () => {
    const contract = createExecutionPipelineConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([
      makeResult([makePolicyGateEntry("allow")], makeFailedTask()),
      makeResult([makePolicyGateEntry("sandbox")]),
      makeResult([makePolicyGateEntry("allow")]),
    ]);

    expect(batch.failedResultCount).toBe(1);
    expect(batch.sandboxedResultCount).toBe(1);
  });
});
