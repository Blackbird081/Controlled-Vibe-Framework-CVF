import { describe, it, expect } from "vitest";
import {
  ExecutionPipelineConsumerPipelineContract,
  createExecutionPipelineConsumerPipelineContract,
} from "../src/execution.pipeline.consumer.pipeline.contract";
import type { ExecutionPipelineConsumerPipelineRequest } from "../src/execution.pipeline.consumer.pipeline.contract";
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
    summary: "Test policy gate result",
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

function makeRequest(
  gateEntries: PolicyGateEntry[] = [],
  overrides: Partial<ExecutionPipelineConsumerPipelineRequest> = {},
): ExecutionPipelineConsumerPipelineRequest {
  return { bridgeReceipt: makeBridgeReceipt(gateEntries), ...overrides };
}

function makeFailedExecuteTask() {
  return (entry: PolicyGateEntry, sandbox: boolean): RuntimeExecutionRecord => ({
    assignmentId: entry.assignmentId,
    taskId: entry.taskId,
    gateDecision: entry.gateDecision,
    // Return DELEGATED_TO_SANDBOX for sandbox calls so CommandRuntime keeps sandboxedCount
    status: sandbox ? "DELEGATED_TO_SANDBOX" : "EXECUTION_FAILED",
    executionHash: "test-hash",
    notes: sandbox ? "sandboxed" : "forced failure for test",
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ExecutionPipelineConsumerPipelineContract", () => {
  it("returns a result with all required fields for an empty pipeline", () => {
    const contract = createExecutionPipelineConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.resultId).toBeTruthy();
    expect(result.createdAt).toBe("2026-03-25T10:00:00.000Z");
    expect(result.pipelineReceipt).toBeDefined();
    expect(result.pipelineReceipt.totalEntries).toBe(0);
    expect(result.consumerPackage).toBeDefined();
    expect(result.pipelineHash).toBeTruthy();
    expect(result.warnings).toEqual([]);
  });

  it("derives query: [pipeline] failed:N sandboxed:N total:N", () => {
    const contract = createExecutionPipelineConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([makePolicyGateEntry("allow")]));

    expect(result.consumerPackage.query).toBe("[pipeline] failed:0 sandboxed:0 total:1");
  });

  it("query is bounded at 120 chars", () => {
    const contract = createExecutionPipelineConsumerPipelineContract({ now: fixedNow() });
    const manyEntries = Array.from({ length: 9999 }, (_, i) => makePolicyGateEntry("allow", `assign-${i}`));
    const result = contract.execute(makeRequest(manyEntries));

    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
  });

  it("contextId on consumerPackage equals pipelineReceipt.pipelineReceiptId", () => {
    const contract = createExecutionPipelineConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.consumerPackage.contextId).toBe(result.pipelineReceipt.pipelineReceiptId);
  });

  it("allow entry produces executedCount=1 and no warnings", () => {
    const contract = createExecutionPipelineConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([makePolicyGateEntry("allow")]));

    expect(result.pipelineReceipt.executedCount).toBe(1);
    expect(result.pipelineReceipt.failedCount).toBe(0);
    expect(result.warnings).toEqual([]);
  });

  it("sandbox entry produces sandboxedCount=1 and sandboxed warning", () => {
    const contract = createExecutionPipelineConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([makePolicyGateEntry("sandbox")]));

    expect(result.pipelineReceipt.sandboxedCount).toBe(1);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[pipeline] sandboxed executions present");
    expect(result.warnings[0]).toContain("review required");
  });

  it("deny entry produces skippedCount=1 and no warnings", () => {
    const contract = createExecutionPipelineConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([makePolicyGateEntry("deny")]));

    expect(result.pipelineReceipt.skippedCount).toBe(1);
    expect(result.warnings).toEqual([]);
  });

  it("failed execution (injected executor) produces failedCount=1 and failure warning", () => {
    const contract = createExecutionPipelineConsumerPipelineContract({
      now: fixedNow(),
      pipelineContractDeps: {
        commandRuntimeDependencies: { executeTask: makeFailedExecuteTask() },
      },
    });
    const result = contract.execute(makeRequest([makePolicyGateEntry("allow")]));

    expect(result.pipelineReceipt.failedCount).toBe(1);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[pipeline] execution failures detected");
    expect(result.warnings[0]).toContain("review pipeline receipt");
  });

  it("both failures and sandboxed entries produce both warnings", () => {
    const contract = createExecutionPipelineConsumerPipelineContract({
      now: fixedNow(),
      pipelineContractDeps: {
        commandRuntimeDependencies: { executeTask: makeFailedExecuteTask() },
      },
    });
    const result = contract.execute(makeRequest([
      makePolicyGateEntry("allow", "assign-001"),
      makePolicyGateEntry("sandbox", "assign-002"),
    ]));

    expect(result.pipelineReceipt.failedCount).toBe(1);
    expect(result.pipelineReceipt.sandboxedCount).toBe(1);
    expect(result.warnings).toHaveLength(2);
  });

  it("consumerId is preserved when provided", () => {
    const contract = createExecutionPipelineConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([], { consumerId: "consumer-xyz" }));

    expect(result.consumerId).toBe("consumer-xyz");
  });

  it("consumerId is undefined when not provided", () => {
    const contract = createExecutionPipelineConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.consumerId).toBeUndefined();
  });

  it("resultId differs from pipelineHash", () => {
    const contract = createExecutionPipelineConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.resultId).not.toBe(result.pipelineHash);
  });

  it("consumerPackage contains estimatedTokens", () => {
    const contract = createExecutionPipelineConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(typeof result.consumerPackage.typedContextPackage.estimatedTokens).toBe("number");
  });

  it("is deterministic — same input produces identical hashes", () => {
    const contract = createExecutionPipelineConsumerPipelineContract({ now: fixedNow() });
    const r1 = contract.execute(makeRequest());
    const r2 = contract.execute(makeRequest());

    expect(r1.pipelineHash).toBe(r2.pipelineHash);
    expect(r1.resultId).toBe(r2.resultId);
    expect(r1.pipelineReceipt.pipelineHash).toBe(r2.pipelineReceipt.pipelineHash);
  });

  it("different gate entries produce different hashes", () => {
    const contract = createExecutionPipelineConsumerPipelineContract({ now: fixedNow() });
    const r1 = contract.execute(makeRequest([]));
    const r2 = contract.execute(makeRequest([makePolicyGateEntry("allow")]));

    expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
  });

  it("factory function creates a working contract", () => {
    const contract = createExecutionPipelineConsumerPipelineContract({ now: fixedNow() });
    expect(contract).toBeInstanceOf(ExecutionPipelineConsumerPipelineContract);
    const result = contract.execute(makeRequest());
    expect(result.pipelineHash).toBeTruthy();
  });

  it("direct instantiation works identically to factory", () => {
    const now = fixedNow();
    const direct = new ExecutionPipelineConsumerPipelineContract({ now });
    const via = createExecutionPipelineConsumerPipelineContract({ now });

    const r1 = direct.execute(makeRequest());
    const r2 = via.execute(makeRequest());

    expect(r1.pipelineHash).toBe(r2.pipelineHash);
  });

  it("pipelineReceipt.pipelineStages contains at least the core stages", () => {
    const contract = createExecutionPipelineConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([makePolicyGateEntry("allow")]));

    expect(result.pipelineReceipt.pipelineStages.length).toBeGreaterThanOrEqual(3);
  });
});
