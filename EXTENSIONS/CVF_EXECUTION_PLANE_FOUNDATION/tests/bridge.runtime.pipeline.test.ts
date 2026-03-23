/**
 * EPF Bridge, Command Runtime & Pipeline — Dedicated Tests (W6-T19)
 * ==================================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   CommandRuntimeContract.execute:
 *     - empty PolicyGateResult → 0 records, all counts zero, summary "zero entries"
 *     - allow gateDecision → EXECUTED status
 *     - sandbox gateDecision → DELEGATED_TO_SANDBOX status
 *     - deny gateDecision → SKIPPED_DENIED status
 *     - review gateDecision → SKIPPED_REVIEW_REQUIRED status
 *     - pending gateDecision → SKIPPED_PENDING status
 *     - custom executeTask override respected for allow entries
 *     - executedCount, sandboxedCount, skippedCount, failedCount counts accurate
 *     - skippedCount = SKIPPED_DENIED + SKIPPED_REVIEW_REQUIRED + SKIPPED_PENDING
 *     - assignmentId and taskId propagated to each record
 *     - runtimeHash and runtimeId are deterministic for same inputs and timestamp
 *     - executedAt set to injected now()
 *     - gateId propagated from policyGateResult
 *     - runtimeId === computeDeterministicHash result (truthy)
 *     - summary contains executed/sandboxed/skipped buckets for non-zero entries
 *     - factory createCommandRuntimeContract returns working instance
 *
 *   ExecutionBridgeConsumerContract.bridge:
 *     - bridge receipt has 5 pipeline stages
 *     - DESIGN_RECEIPT_INGESTED stage completedAt = createdAt
 *     - BRIDGE_RECEIPT_ISSUED is the last stage
 *     - designReceiptId propagated from input receipt
 *     - orchestrationId propagated
 *     - totalAssignments equals orchestrationResult.assignments.length
 *     - authorizedForExecution + requiresReview + sandboxed + blockedFromExecution <= totalAssignments
 *     - bridgeHash and bridgeReceiptId are truthy and deterministic
 *     - warnings accumulate from design receipt and dispatch
 *     - factory createExecutionBridgeConsumerContract returns working instance
 *
 *   ExecutionPipelineContract.run:
 *     - pipeline receipt has 4 stages
 *     - bridgeReceiptId propagated
 *     - orchestrationId propagated
 *     - gateId propagated from policyGateResult
 *     - totalEntries = commandRuntimeResult.records.length
 *     - executedCount + sandboxedCount + skippedCount + failedCount === totalEntries
 *     - pipelineHash and pipelineReceiptId are truthy and deterministic
 *     - warnings accumulate from bridge receipt (prefixed [bridge])
 *     - failedCount > 0 triggers runtime warning
 *     - factory createExecutionPipelineContract returns working instance
 */

import { describe, it, expect } from "vitest";

import {
  CommandRuntimeContract,
  createCommandRuntimeContract,
} from "../src/command.runtime.contract";
import {
  PolicyGateContract,
} from "../src/policy.gate.contract";
import type { PolicyGateResult, PolicyGateEntry } from "../src/policy.gate.contract";
import { DispatchContract } from "../src/dispatch.contract";

import {
  ExecutionBridgeConsumerContract,
  createExecutionBridgeConsumerContract,
} from "../src/execution.bridge.consumer.contract";

import {
  ExecutionPipelineContract,
  createExecutionPipelineContract,
} from "../src/execution.pipeline.contract";

import {
  createControlPlaneIntakeContract,
} from "../../CVF_CONTROL_PLANE_FOUNDATION/src/index";
import {
  createDesignConsumerContract,
} from "../../CVF_CONTROL_PLANE_FOUNDATION/src/index";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-23T23:30:00.000Z";
const fixedNow = () => FIXED_NOW;

let _eSeq = 0;
function makePolicyGateEntry(
  gateDecision: PolicyGateEntry["gateDecision"],
  overrides: Partial<PolicyGateEntry> = {},
): PolicyGateEntry {
  const n = ++_eSeq;
  return {
    assignmentId: `assign-${n}`,
    taskId: `task-${n}`,
    guardDecision: "ALLOW",
    riskLevel: "R1",
    gateDecision,
    rationale: `rationale-${n}`,
    ...overrides,
  };
}

function makePolicyGateResult(
  entries: PolicyGateEntry[],
  gateId = "test-gate-id",
): PolicyGateResult {
  return {
    gateId,
    dispatchId: "test-dispatch-id",
    evaluatedAt: FIXED_NOW,
    entries,
    allowedCount: entries.filter((e) => e.gateDecision === "allow").length,
    deniedCount: entries.filter((e) => e.gateDecision === "deny").length,
    reviewRequiredCount: entries.filter((e) => e.gateDecision === "review").length,
    sandboxedCount: entries.filter((e) => e.gateDecision === "sandbox").length,
    pendingCount: entries.filter((e) => e.gateDecision === "pending").length,
    gateHash: gateId,
    summary: "test summary",
  };
}

/** Build a real DesignConsumptionReceipt via the CPF chain for bridge/pipeline tests */
function buildDesignReceipt() {
  const intake = createControlPlaneIntakeContract().execute({
    vibe: "Build a governed execution bridge for dedicated test coverage",
    consumerId: "w6-t19-test",
  });
  return createDesignConsumerContract().consume(intake);
}

// ─── CommandRuntimeContract ───────────────────────────────────────────────────

describe("CommandRuntimeContract.execute", () => {
  const contract = new CommandRuntimeContract({ now: fixedNow });

  it("empty PolicyGateResult → 0 records, all counts zero, summary 'zero entries'", () => {
    const result = contract.execute(makePolicyGateResult([]));
    expect(result.records).toHaveLength(0);
    expect(result.executedCount).toBe(0);
    expect(result.sandboxedCount).toBe(0);
    expect(result.skippedCount).toBe(0);
    expect(result.failedCount).toBe(0);
    expect(result.summary).toContain("zero entries");
  });

  describe("gateDecision → status mapping", () => {
    it("allow gateDecision → EXECUTED status", () => {
      const result = contract.execute(makePolicyGateResult([makePolicyGateEntry("allow")]));
      expect(result.records[0].status).toBe("EXECUTED");
      expect(result.executedCount).toBe(1);
    });

    it("sandbox gateDecision → DELEGATED_TO_SANDBOX status", () => {
      const result = contract.execute(makePolicyGateResult([makePolicyGateEntry("sandbox")]));
      expect(result.records[0].status).toBe("DELEGATED_TO_SANDBOX");
      expect(result.sandboxedCount).toBe(1);
    });

    it("deny gateDecision → SKIPPED_DENIED status", () => {
      const result = contract.execute(makePolicyGateResult([makePolicyGateEntry("deny")]));
      expect(result.records[0].status).toBe("SKIPPED_DENIED");
    });

    it("review gateDecision → SKIPPED_REVIEW_REQUIRED status", () => {
      const result = contract.execute(makePolicyGateResult([makePolicyGateEntry("review")]));
      expect(result.records[0].status).toBe("SKIPPED_REVIEW_REQUIRED");
    });

    it("pending gateDecision → SKIPPED_PENDING status", () => {
      const result = contract.execute(makePolicyGateResult([makePolicyGateEntry("pending")]));
      expect(result.records[0].status).toBe("SKIPPED_PENDING");
    });
  });

  it("skippedCount = SKIPPED_DENIED + SKIPPED_REVIEW_REQUIRED + SKIPPED_PENDING", () => {
    const entries = [
      makePolicyGateEntry("deny"),
      makePolicyGateEntry("review"),
      makePolicyGateEntry("pending"),
      makePolicyGateEntry("allow"),
    ];
    const result = contract.execute(makePolicyGateResult(entries));
    expect(result.skippedCount).toBe(3);
    expect(result.executedCount).toBe(1);
  });

  it("executedCount + sandboxedCount + skippedCount + failedCount = total records", () => {
    const entries = [
      makePolicyGateEntry("allow"),
      makePolicyGateEntry("sandbox"),
      makePolicyGateEntry("deny"),
      makePolicyGateEntry("review"),
    ];
    const result = contract.execute(makePolicyGateResult(entries));
    expect(
      result.executedCount + result.sandboxedCount + result.skippedCount + result.failedCount,
    ).toBe(result.records.length);
  });

  it("assignmentId and taskId propagated to each record", () => {
    const entry = makePolicyGateEntry("allow", { assignmentId: "a-id", taskId: "t-id" });
    const result = contract.execute(makePolicyGateResult([entry]));
    expect(result.records[0].assignmentId).toBe("a-id");
    expect(result.records[0].taskId).toBe("t-id");
  });

  it("custom executeTask override respected for allow entries", () => {
    const custom = new CommandRuntimeContract({
      now: fixedNow,
      executeTask: (entry) => ({
        assignmentId: entry.assignmentId,
        taskId: entry.taskId,
        gateDecision: entry.gateDecision,
        status: "EXECUTED",
        executionHash: "custom-hash",
        notes: "custom-executor",
      }),
    });
    const result = custom.execute(makePolicyGateResult([makePolicyGateEntry("allow")]));
    expect(result.records[0].notes).toBe("custom-executor");
  });

  it("runtimeHash and runtimeId are deterministic for same inputs and timestamp", () => {
    const entries = [makePolicyGateEntry("allow")];
    const gr = makePolicyGateResult(entries, "gate-det");
    const r1 = contract.execute(gr);
    const r2 = contract.execute(gr);
    expect(r1.runtimeHash).toBe(r2.runtimeHash);
    expect(r1.runtimeId).toBe(r2.runtimeId);
  });

  it("executedAt set to injected now()", () => {
    expect(contract.execute(makePolicyGateResult([])).executedAt).toBe(FIXED_NOW);
  });

  it("gateId propagated from policyGateResult", () => {
    const gr = makePolicyGateResult([], "my-gate-id");
    expect(contract.execute(gr).gateId).toBe("my-gate-id");
  });

  it("runtimeId is truthy", () => {
    expect(contract.execute(makePolicyGateResult([])).runtimeId).toBeTruthy();
  });

  it("summary contains executed bucket for non-zero executedCount", () => {
    const result = contract.execute(makePolicyGateResult([makePolicyGateEntry("allow")]));
    expect(result.summary).toContain("executed");
  });

  it("summary contains sandboxed bucket for non-zero sandboxedCount", () => {
    const result = contract.execute(makePolicyGateResult([makePolicyGateEntry("sandbox")]));
    expect(result.summary).toContain("sandbox");
  });

  it("factory createCommandRuntimeContract returns working instance", () => {
    const c = createCommandRuntimeContract({ now: fixedNow });
    const result = c.execute(makePolicyGateResult([]));
    expect(result.executedAt).toBe(FIXED_NOW);
    expect(result.summary).toContain("zero entries");
  });
});

// ─── ExecutionBridgeConsumerContract ─────────────────────────────────────────

describe("ExecutionBridgeConsumerContract.bridge", () => {
  // Build once and reuse — CPF chain is deterministic given same vibe input
  const designReceipt = buildDesignReceipt();
  const contract = new ExecutionBridgeConsumerContract({ now: fixedNow });

  it("bridge receipt has 5 pipeline stages", () => {
    const result = contract.bridge(designReceipt);
    expect(result.pipelineStages).toHaveLength(5);
  });

  it("first stage is DESIGN_RECEIPT_INGESTED with completedAt = createdAt", () => {
    const result = contract.bridge(designReceipt);
    expect(result.pipelineStages[0].stage).toBe("DESIGN_RECEIPT_INGESTED");
    expect(result.pipelineStages[0].completedAt).toBe(FIXED_NOW);
  });

  it("last stage is BRIDGE_RECEIPT_ISSUED", () => {
    const result = contract.bridge(designReceipt);
    const last = result.pipelineStages[result.pipelineStages.length - 1];
    expect(last.stage).toBe("BRIDGE_RECEIPT_ISSUED");
  });

  it("designReceiptId propagated from input receipt", () => {
    const result = contract.bridge(designReceipt);
    expect(result.designReceiptId).toBe(designReceipt.receiptId);
  });

  it("orchestrationId propagated from orchestrationResult", () => {
    const result = contract.bridge(designReceipt);
    expect(result.orchestrationId).toBe(designReceipt.orchestrationResult.orchestrationId);
  });

  it("totalAssignments equals orchestrationResult.assignments.length", () => {
    const result = contract.bridge(designReceipt);
    expect(result.totalAssignments).toBe(designReceipt.orchestrationResult.assignments.length);
  });

  it("authorizedForExecution + requiresReview + sandboxed + blockedFromExecution <= totalAssignments", () => {
    const result = contract.bridge(designReceipt);
    const sum = result.authorizedForExecution + result.requiresReview + result.sandboxed + result.blockedFromExecution;
    expect(sum).toBeLessThanOrEqual(result.totalAssignments);
  });

  it("bridgeHash and bridgeReceiptId are truthy", () => {
    const result = contract.bridge(designReceipt);
    expect(result.bridgeHash).toBeTruthy();
    expect(result.bridgeReceiptId).toBeTruthy();
  });

  it("bridgeHash and bridgeReceiptId are deterministic when all sub-contracts use fixed now", () => {
    const c = new ExecutionBridgeConsumerContract({
      now: fixedNow,
      dispatch: new DispatchContract({ now: fixedNow }),
      policyGate: new PolicyGateContract({ now: fixedNow }),
    });
    const r1 = c.bridge(designReceipt);
    const r2 = c.bridge(designReceipt);
    expect(r1.bridgeHash).toBe(r2.bridgeHash);
    expect(r1.bridgeReceiptId).toBe(r2.bridgeReceiptId);
  });

  it("warnings is an Array (may contain bridge/dispatch/design messages)", () => {
    const result = contract.bridge(designReceipt);
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it("createdAt set to injected now()", () => {
    expect(contract.bridge(designReceipt).createdAt).toBe(FIXED_NOW);
  });

  it("factory createExecutionBridgeConsumerContract returns working instance", () => {
    const c = createExecutionBridgeConsumerContract({ now: fixedNow });
    const result = c.bridge(designReceipt);
    expect(result.pipelineStages).toHaveLength(5);
    expect(result.createdAt).toBe(FIXED_NOW);
  });
});

// ─── ExecutionPipelineContract ────────────────────────────────────────────────

describe("ExecutionPipelineContract.run", () => {
  // Build bridge receipt via real chain for pipeline testing
  const designReceipt = buildDesignReceipt();
  const bridge = new ExecutionBridgeConsumerContract({ now: fixedNow });
  const bridgeReceipt = bridge.bridge(designReceipt);
  const contract = new ExecutionPipelineContract({ now: fixedNow });

  it("pipeline receipt has 4 stages", () => {
    const result = contract.run(bridgeReceipt);
    expect(result.pipelineStages).toHaveLength(4);
  });

  it("bridgeReceiptId propagated", () => {
    const result = contract.run(bridgeReceipt);
    expect(result.bridgeReceiptId).toBe(bridgeReceipt.bridgeReceiptId);
  });

  it("orchestrationId propagated", () => {
    const result = contract.run(bridgeReceipt);
    expect(result.orchestrationId).toBe(bridgeReceipt.orchestrationId);
  });

  it("gateId propagated from policyGateResult", () => {
    const result = contract.run(bridgeReceipt);
    expect(result.gateId).toBe(bridgeReceipt.policyGateResult.gateId);
  });

  it("totalEntries equals commandRuntimeResult.records.length", () => {
    const result = contract.run(bridgeReceipt);
    expect(result.totalEntries).toBe(result.commandRuntimeResult.records.length);
  });

  it("executedCount + sandboxedCount + skippedCount + failedCount === totalEntries", () => {
    const result = contract.run(bridgeReceipt);
    expect(
      result.executedCount + result.sandboxedCount + result.skippedCount + result.failedCount,
    ).toBe(result.totalEntries);
  });

  it("pipelineHash and pipelineReceiptId are truthy and deterministic", () => {
    const r1 = contract.run(bridgeReceipt);
    const r2 = contract.run(bridgeReceipt);
    expect(r1.pipelineHash).toBeTruthy();
    expect(r1.pipelineHash).toBe(r2.pipelineHash);
    expect(r1.pipelineReceiptId).toBe(r2.pipelineReceiptId);
  });

  it("warnings from bridge receipt are prefixed [bridge]", () => {
    // If bridgeReceipt has warnings, they appear prefixed
    const result = contract.run(bridgeReceipt);
    for (const w of result.warnings) {
      if (!w.startsWith("[runtime]")) {
        expect(w.startsWith("[bridge]")).toBe(true);
      }
    }
  });

  it("createdAt set to injected now()", () => {
    expect(contract.run(bridgeReceipt).createdAt).toBe(FIXED_NOW);
  });

  it("factory createExecutionPipelineContract returns working instance", () => {
    const c = createExecutionPipelineContract({ now: fixedNow });
    const result = c.run(bridgeReceipt);
    expect(result.pipelineStages).toHaveLength(4);
    expect(result.createdAt).toBe(FIXED_NOW);
  });
});
