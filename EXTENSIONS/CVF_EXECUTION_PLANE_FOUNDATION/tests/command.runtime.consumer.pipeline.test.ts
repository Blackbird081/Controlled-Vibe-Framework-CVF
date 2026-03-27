import { describe, it, expect } from "vitest";
import {
  CommandRuntimeConsumerPipelineContract,
  createCommandRuntimeConsumerPipelineContract,
} from "../src/command.runtime.consumer.pipeline.contract";
import type { CommandRuntimeConsumerPipelineRequest } from "../src/command.runtime.consumer.pipeline.contract";
import type { PolicyGateResult, PolicyGateEntry } from "../src/policy.gate.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIXED_TS = "2026-03-27T11:00:00.000Z";

function fixedNow(ts = FIXED_TS): () => string {
  return () => ts;
}

function makeGateEntry(
  assignmentId: string,
  gateDecision: "allow" | "deny" | "review" | "sandbox" | "pending",
): PolicyGateEntry {
  return {
    assignmentId,
    taskId: `task-${assignmentId}`,
    guardDecision: "ALLOW",
    riskLevel: "R1",
    gateDecision,
    rationale: `Test rationale for ${gateDecision}`,
  };
}

function makePolicyGateResult(entries: PolicyGateEntry[] = []): PolicyGateResult {
  const allowedCount = entries.filter((e) => e.gateDecision === "allow").length;
  const deniedCount = entries.filter((e) => e.gateDecision === "deny").length;
  const reviewRequiredCount = entries.filter((e) => e.gateDecision === "review").length;
  const sandboxedCount = entries.filter((e) => e.gateDecision === "sandbox").length;
  const pendingCount = entries.filter((e) => e.gateDecision === "pending").length;

  return {
    gateId: "gate-001",
    dispatchId: "dispatch-001",
    evaluatedAt: FIXED_TS,
    entries,
    allowedCount,
    deniedCount,
    reviewRequiredCount,
    sandboxedCount,
    pendingCount,
    gateHash: "gate-hash-001",
    summary: `Policy gate result: ${entries.length} entries evaluated.`,
  };
}

function makeRequest(
  entries: PolicyGateEntry[] = [],
  overrides: Partial<CommandRuntimeConsumerPipelineRequest> = {},
): CommandRuntimeConsumerPipelineRequest {
  return { policyGateResult: makePolicyGateResult(entries), ...overrides };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("CommandRuntimeConsumerPipelineContract", () => {

  // ── Instantiation ──────────────────────────────────────────────────────────

  describe("instantiation", () => {
    it("should instantiate with no dependencies", () => {
      const contract = new CommandRuntimeConsumerPipelineContract();
      expect(contract).toBeDefined();
    });

    it("should instantiate via factory function", () => {
      const contract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      expect(contract).toBeDefined();
    });

    it("should instantiate with custom now function", () => {
      const contract = new CommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest());
      expect(result.createdAt).toBe(FIXED_TS);
    });
  });

  // ── Output shape ───────────────────────────────────────────────────────────

  describe("output shape", () => {
    it("should return a defined result", () => {
      const contract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest());
      expect(result).toBeDefined();
    });

    it("should have a non-empty resultId", () => {
      const contract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest());
      expect(result.resultId).toBeTruthy();
    });

    it("should have createdAt matching the fixed timestamp", () => {
      const contract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest());
      expect(result.createdAt).toBe(FIXED_TS);
    });

    it("should have a runtimeResult", () => {
      const contract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest());
      expect(result.runtimeResult).toBeDefined();
    });

    it("should have a consumerPackage", () => {
      const contract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest());
      expect(result.consumerPackage).toBeDefined();
    });

    it("should have a non-empty pipelineHash", () => {
      const contract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest());
      expect(result.pipelineHash).toBeTruthy();
    });

    it("should have a warnings array", () => {
      const contract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest());
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  // ── consumerId propagation ─────────────────────────────────────────────────

  describe("consumerId propagation", () => {
    it("should propagate consumerId when provided", () => {
      const contract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest([], { consumerId: "consumer-abc" }));
      expect(result.consumerId).toBe("consumer-abc");
    });

    it("should have undefined consumerId when not provided", () => {
      const contract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest());
      expect(result.consumerId).toBeUndefined();
    });

    it("should propagate empty string consumerId", () => {
      const contract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest([], { consumerId: "" }));
      expect(result.consumerId).toBe("");
    });
  });

  // ── Deterministic hashing ──────────────────────────────────────────────────

  describe("deterministic hashing", () => {
    it("should produce the same resultId for identical inputs", () => {
      const contract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const r1 = contract.execute(makeRequest());
      const r2 = contract.execute(makeRequest());
      expect(r1.resultId).toBe(r2.resultId);
    });

    it("should produce different resultId for different gate results", () => {
      const contract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const r1 = contract.execute(makeRequest([makeGateEntry("a1", "allow")]));
      const r2 = contract.execute(makeRequest([makeGateEntry("a2", "allow")]));
      expect(r1.resultId).not.toBe(r2.resultId);
    });

    it("pipelineHash should differ from resultId", () => {
      const contract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest());
      expect(result.pipelineHash).not.toBe(result.resultId);
    });

    it("should produce the same pipelineHash for identical inputs", () => {
      const contract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const r1 = contract.execute(makeRequest());
      const r2 = contract.execute(makeRequest());
      expect(r1.pipelineHash).toBe(r2.pipelineHash);
    });
  });

  // ── Query derivation ───────────────────────────────────────────────────────

  describe("query derivation", () => {
    it("should derive query from runtimeResult.summary", () => {
      const contract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest());
      expect(result.consumerPackage.query).toContain("Command runtime");
    });

    it("should cap query at 120 characters", () => {
      const contract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const manyEntries = Array.from({ length: 100 }, (_, i) => makeGateEntry(`a${i}`, "allow"));
      const result = contract.execute(makeRequest(manyEntries));
      expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
    });

    it("should handle empty gate result", () => {
      const contract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest());
      expect(result.consumerPackage.query).toContain("zero entries");
    });
  });

  // ── Warning messages ───────────────────────────────────────────────────────

  describe("warning messages", () => {
    it("should produce no warnings for successful execution", () => {
      const contract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest([makeGateEntry("a1", "allow")]));
      expect(result.warnings).toHaveLength(0);
    });

    it("should add sandbox warning when sandboxedCount > 0", () => {
      const contract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest([makeGateEntry("a1", "sandbox")]));
      expect(result.warnings).toContain(
        "[command-runtime] sandbox delegation detected — R3 risk level tasks isolated",
      );
    });

    it("should produce no warnings for skipped tasks", () => {
      const contract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest([makeGateEntry("a1", "deny")]));
      expect(result.warnings).toHaveLength(0);
    });

    it("should produce no warnings for review required tasks", () => {
      const contract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest([makeGateEntry("a1", "review")]));
      expect(result.warnings).toHaveLength(0);
    });

    it("should produce no warnings for pending tasks", () => {
      const contract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest([makeGateEntry("a1", "pending")]));
      expect(result.warnings).toHaveLength(0);
    });
  });

  // ── runtimeResult propagation ──────────────────────────────────────────────

  describe("runtimeResult propagation", () => {
    it("should have executedCount matching allowed entries", () => {
      const contract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest([
        makeGateEntry("a1", "allow"),
        makeGateEntry("a2", "allow"),
      ]));
      expect(result.runtimeResult.executedCount).toBe(2);
    });

    it("should have sandboxedCount matching sandbox entries", () => {
      const contract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest([
        makeGateEntry("a1", "sandbox"),
        makeGateEntry("a2", "sandbox"),
      ]));
      expect(result.runtimeResult.sandboxedCount).toBe(2);
    });

    it("should have skippedCount matching denied/review/pending entries", () => {
      const contract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest([
        makeGateEntry("a1", "deny"),
        makeGateEntry("a2", "review"),
        makeGateEntry("a3", "pending"),
      ]));
      expect(result.runtimeResult.skippedCount).toBe(3);
    });

    it("should have failedCount of 0 for successful execution", () => {
      const contract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest([makeGateEntry("a1", "allow")]));
      expect(result.runtimeResult.failedCount).toBe(0);
    });

    it("should have a non-empty runtimeId", () => {
      const contract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest());
      expect(result.runtimeResult.runtimeId).toBeTruthy();
    });

    it("should have a non-empty runtimeHash", () => {
      const contract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest());
      expect(result.runtimeResult.runtimeHash).toBeTruthy();
    });

    it("should have gateId matching the input gate result", () => {
      const contract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest());
      expect(result.runtimeResult.gateId).toBe("gate-001");
    });
  });

  // ── consumerPackage shape ──────────────────────────────────────────────────

  describe("consumerPackage shape", () => {
    it("should have a packageId", () => {
      const contract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest());
      expect(result.consumerPackage.packageId).toBeTruthy();
    });

    it("should have contextId set to runtimeResult.runtimeId", () => {
      const contract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest());
      expect(result.consumerPackage.contextId).toBe(result.runtimeResult.runtimeId);
    });

    it("should have a non-empty pipelineHash in the consumerPackage", () => {
      const contract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest());
      expect(result.consumerPackage.pipelineHash).toBeTruthy();
    });

    it("should have a query derived from runtimeResult.summary", () => {
      const contract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest());
      expect(result.consumerPackage.query).toContain("Command runtime");
    });
  });

  // ── Mixed gate decisions ───────────────────────────────────────────────────

  describe("mixed gate decisions", () => {
    it("should handle mixed allow/sandbox/deny entries", () => {
      const contract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest([
        makeGateEntry("a1", "allow"),
        makeGateEntry("a2", "sandbox"),
        makeGateEntry("a3", "deny"),
      ]));
      expect(result.runtimeResult.executedCount).toBe(1);
      expect(result.runtimeResult.sandboxedCount).toBe(1);
      expect(result.runtimeResult.skippedCount).toBe(1);
    });

    it("should produce sandbox warning for mixed entries with sandbox", () => {
      const contract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest([
        makeGateEntry("a1", "allow"),
        makeGateEntry("a2", "sandbox"),
      ]));
      expect(result.warnings).toContain(
        "[command-runtime] sandbox delegation detected — R3 risk level tasks isolated",
      );
    });

    it("should have correct counts for all gate decision types", () => {
      const contract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest([
        makeGateEntry("a1", "allow"),
        makeGateEntry("a2", "sandbox"),
        makeGateEntry("a3", "deny"),
        makeGateEntry("a4", "review"),
        makeGateEntry("a5", "pending"),
      ]));
      expect(result.runtimeResult.executedCount).toBe(1);
      expect(result.runtimeResult.sandboxedCount).toBe(1);
      expect(result.runtimeResult.skippedCount).toBe(3);
      expect(result.runtimeResult.failedCount).toBe(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// BATCH CONTRACT TESTS (W2-T25 CP2)
// ═══════════════════════════════════════════════════════════════════════════════

import {
  CommandRuntimeConsumerPipelineBatchContract,
  createCommandRuntimeConsumerPipelineBatchContract,
} from "../src/command.runtime.consumer.pipeline.batch.contract";
import type { CommandRuntimeConsumerPipelineResult } from "../src/command.runtime.consumer.pipeline.contract";

describe("CommandRuntimeConsumerPipelineBatchContract", () => {

  // ── Instantiation ──────────────────────────────────────────────────────────

  describe("instantiation", () => {
    it("should instantiate with no dependencies", () => {
      const contract = new CommandRuntimeConsumerPipelineBatchContract();
      expect(contract).toBeDefined();
    });

    it("should instantiate via factory function", () => {
      const contract = createCommandRuntimeConsumerPipelineBatchContract({ now: fixedNow() });
      expect(contract).toBeDefined();
    });

    it("should instantiate with custom now function", () => {
      const contract = new CommandRuntimeConsumerPipelineBatchContract({ now: fixedNow() });
      const pipelineContract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const result = pipelineContract.execute(makeRequest());
      const batchResult = contract.execute([result]);
      expect(batchResult.createdAt).toBe(FIXED_TS);
    });
  });

  // ── Output shape ───────────────────────────────────────────────────────────

  describe("output shape", () => {
    it("should return a defined result", () => {
      const contract = createCommandRuntimeConsumerPipelineBatchContract({ now: fixedNow() });
      const result = contract.execute([]);
      expect(result).toBeDefined();
    });

    it("should have a non-empty batchId", () => {
      const contract = createCommandRuntimeConsumerPipelineBatchContract({ now: fixedNow() });
      const result = contract.execute([]);
      expect(result.batchId).toBeTruthy();
    });

    it("should have createdAt matching the fixed timestamp", () => {
      const contract = createCommandRuntimeConsumerPipelineBatchContract({ now: fixedNow() });
      const result = contract.execute([]);
      expect(result.createdAt).toBe(FIXED_TS);
    });

    it("should have a non-empty batchHash", () => {
      const contract = createCommandRuntimeConsumerPipelineBatchContract({ now: fixedNow() });
      const result = contract.execute([]);
      expect(result.batchHash).toBeTruthy();
    });

    it("batchHash should differ from batchId", () => {
      const contract = createCommandRuntimeConsumerPipelineBatchContract({ now: fixedNow() });
      const result = contract.execute([]);
      expect(result.batchHash).not.toBe(result.batchId);
    });
  });

  // ── Empty batch ────────────────────────────────────────────────────────────

  describe("empty batch", () => {
    it("should handle empty batch", () => {
      const contract = createCommandRuntimeConsumerPipelineBatchContract({ now: fixedNow() });
      const result = contract.execute([]);
      expect(result.totalResults).toBe(0);
    });

    it("should have dominantTokenBudget of 0 for empty batch", () => {
      const contract = createCommandRuntimeConsumerPipelineBatchContract({ now: fixedNow() });
      const result = contract.execute([]);
      expect(result.dominantTokenBudget).toBe(0);
    });

    it("should have all counts at 0 for empty batch", () => {
      const contract = createCommandRuntimeConsumerPipelineBatchContract({ now: fixedNow() });
      const result = contract.execute([]);
      expect(result.executedCount).toBe(0);
      expect(result.sandboxedCount).toBe(0);
      expect(result.skippedCount).toBe(0);
      expect(result.failedCount).toBe(0);
    });

    it("should produce valid hash for empty batch", () => {
      const contract = createCommandRuntimeConsumerPipelineBatchContract({ now: fixedNow() });
      const result = contract.execute([]);
      expect(result.batchHash).toBeTruthy();
    });
  });

  // ── Single result ──────────────────────────────────────────────────────────

  describe("single result", () => {
    it("should handle single result", () => {
      const pipelineContract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const pipelineResult = pipelineContract.execute(makeRequest([makeGateEntry("a1", "allow")]));
      const batchContract = createCommandRuntimeConsumerPipelineBatchContract({ now: fixedNow() });
      const batchResult = batchContract.execute([pipelineResult]);
      expect(batchResult.totalResults).toBe(1);
    });

    it("should have dominantTokenBudget from single result", () => {
      const pipelineContract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const pipelineResult = pipelineContract.execute(makeRequest([makeGateEntry("a1", "allow")]));
      const batchContract = createCommandRuntimeConsumerPipelineBatchContract({ now: fixedNow() });
      const batchResult = batchContract.execute([pipelineResult]);
      expect(batchResult.dominantTokenBudget).toBe(pipelineResult.consumerPackage.typedContextPackage.estimatedTokens);
    });

    it("should have executedCount from single result", () => {
      const pipelineContract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const pipelineResult = pipelineContract.execute(makeRequest([makeGateEntry("a1", "allow")]));
      const batchContract = createCommandRuntimeConsumerPipelineBatchContract({ now: fixedNow() });
      const batchResult = batchContract.execute([pipelineResult]);
      expect(batchResult.executedCount).toBe(1);
    });
  });

  // ── Multiple results ───────────────────────────────────────────────────────

  describe("multiple results", () => {
    it("should handle multiple results", () => {
      const pipelineContract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const r1 = pipelineContract.execute(makeRequest([makeGateEntry("a1", "allow")]));
      const r2 = pipelineContract.execute(makeRequest([makeGateEntry("a2", "allow")]));
      const batchContract = createCommandRuntimeConsumerPipelineBatchContract({ now: fixedNow() });
      const batchResult = batchContract.execute([r1, r2]);
      expect(batchResult.totalResults).toBe(2);
    });

    it("should compute dominantTokenBudget as max across results", () => {
      const pipelineContract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const r1 = pipelineContract.execute(makeRequest([makeGateEntry("a1", "allow")]));
      const r2 = pipelineContract.execute(makeRequest([makeGateEntry("a2", "allow")]));
      const batchContract = createCommandRuntimeConsumerPipelineBatchContract({ now: fixedNow() });
      const batchResult = batchContract.execute([r1, r2]);
      const expectedMax = Math.max(
        r1.consumerPackage.typedContextPackage.estimatedTokens,
        r2.consumerPackage.typedContextPackage.estimatedTokens,
      );
      expect(batchResult.dominantTokenBudget).toBe(expectedMax);
    });

    it("should sum executedCount across results", () => {
      const pipelineContract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const r1 = pipelineContract.execute(makeRequest([makeGateEntry("a1", "allow"), makeGateEntry("a2", "allow")]));
      const r2 = pipelineContract.execute(makeRequest([makeGateEntry("a3", "allow")]));
      const batchContract = createCommandRuntimeConsumerPipelineBatchContract({ now: fixedNow() });
      const batchResult = batchContract.execute([r1, r2]);
      expect(batchResult.executedCount).toBe(3);
    });

    it("should sum sandboxedCount across results", () => {
      const pipelineContract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const r1 = pipelineContract.execute(makeRequest([makeGateEntry("a1", "sandbox")]));
      const r2 = pipelineContract.execute(makeRequest([makeGateEntry("a2", "sandbox")]));
      const batchContract = createCommandRuntimeConsumerPipelineBatchContract({ now: fixedNow() });
      const batchResult = batchContract.execute([r1, r2]);
      expect(batchResult.sandboxedCount).toBe(2);
    });

    it("should sum skippedCount across results", () => {
      const pipelineContract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const r1 = pipelineContract.execute(makeRequest([makeGateEntry("a1", "deny")]));
      const r2 = pipelineContract.execute(makeRequest([makeGateEntry("a2", "review")]));
      const batchContract = createCommandRuntimeConsumerPipelineBatchContract({ now: fixedNow() });
      const batchResult = batchContract.execute([r1, r2]);
      expect(batchResult.skippedCount).toBe(2);
    });

    it("should sum failedCount across results", () => {
      const pipelineContract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const r1 = pipelineContract.execute(makeRequest([makeGateEntry("a1", "allow")]));
      const r2 = pipelineContract.execute(makeRequest([makeGateEntry("a2", "allow")]));
      const batchContract = createCommandRuntimeConsumerPipelineBatchContract({ now: fixedNow() });
      const batchResult = batchContract.execute([r1, r2]);
      expect(batchResult.failedCount).toBe(0);
    });
  });

  // ── Deterministic hashing ──────────────────────────────────────────────────

  describe("deterministic hashing", () => {
    it("should produce the same batchId for identical inputs", () => {
      const pipelineContract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const r1 = pipelineContract.execute(makeRequest([makeGateEntry("a1", "allow")]));
      const batchContract = createCommandRuntimeConsumerPipelineBatchContract({ now: fixedNow() });
      const b1 = batchContract.execute([r1]);
      const b2 = batchContract.execute([r1]);
      expect(b1.batchId).toBe(b2.batchId);
    });

    it("should produce different batchId for different inputs", () => {
      const pipelineContract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const r1 = pipelineContract.execute(makeRequest([makeGateEntry("a1", "allow")]));
      const r2 = pipelineContract.execute(makeRequest([makeGateEntry("a2", "allow")]));
      const batchContract = createCommandRuntimeConsumerPipelineBatchContract({ now: fixedNow() });
      const b1 = batchContract.execute([r1]);
      const b2 = batchContract.execute([r2]);
      expect(b1.batchId).not.toBe(b2.batchId);
    });

    it("should produce the same batchHash for identical inputs", () => {
      const pipelineContract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const r1 = pipelineContract.execute(makeRequest([makeGateEntry("a1", "allow")]));
      const batchContract = createCommandRuntimeConsumerPipelineBatchContract({ now: fixedNow() });
      const b1 = batchContract.execute([r1]);
      const b2 = batchContract.execute([r1]);
      expect(b1.batchHash).toBe(b2.batchHash);
    });
  });

  // ── Mixed execution counts ─────────────────────────────────────────────────

  describe("mixed execution counts", () => {
    it("should aggregate mixed execution counts correctly", () => {
      const pipelineContract = createCommandRuntimeConsumerPipelineContract({ now: fixedNow() });
      const r1 = pipelineContract.execute(makeRequest([
        makeGateEntry("a1", "allow"),
        makeGateEntry("a2", "sandbox"),
      ]));
      const r2 = pipelineContract.execute(makeRequest([
        makeGateEntry("a3", "deny"),
        makeGateEntry("a4", "allow"),
      ]));
      const batchContract = createCommandRuntimeConsumerPipelineBatchContract({ now: fixedNow() });
      const batchResult = batchContract.execute([r1, r2]);
      expect(batchResult.executedCount).toBe(2);
      expect(batchResult.sandboxedCount).toBe(1);
      expect(batchResult.skippedCount).toBe(1);
      expect(batchResult.failedCount).toBe(0);
    });
  });
});
