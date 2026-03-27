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
