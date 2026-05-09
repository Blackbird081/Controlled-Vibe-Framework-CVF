import { describe, it, expect } from "vitest";
import {
  CommandRuntimeBatchContract,
  createCommandRuntimeBatchContract,
} from "../src/command.runtime.batch.contract";
import type { PolicyGateResult, PolicyGateEntry, PolicyGateDecision } from "../src/policy.gate.contract";

// --- Helpers ---

function makeEntry(
  assignmentId: string,
  taskId: string,
  gateDecision: PolicyGateDecision,
): PolicyGateEntry {
  return {
    assignmentId,
    taskId,
    guardDecision: "ALLOW",
    riskLevel: "LOW",
    gateDecision,
    rationale: `Gate decision: ${gateDecision}`,
  };
}

function makePolicyGateResult(
  gateId: string,
  entries: PolicyGateEntry[],
): PolicyGateResult {
  return {
    gateId,
    dispatchId: `dispatch-${gateId}`,
    evaluatedAt: "2026-04-05T00:00:00.000Z",
    entries,
    allowedCount: entries.filter((e) => e.gateDecision === "allow").length,
    deniedCount: entries.filter((e) => e.gateDecision === "deny").length,
    reviewRequiredCount: entries.filter((e) => e.gateDecision === "review").length,
    sandboxedCount: entries.filter((e) => e.gateDecision === "sandbox").length,
    pendingCount: entries.filter((e) => e.gateDecision === "pending").length,
    gateHash: `gate-hash-${gateId}`,
    summary: `Gate result for ${gateId}`,
  };
}

// --- Tests ---

describe("W51-T1 CP1 — CommandRuntimeBatchContract", () => {
  describe("empty batch", () => {
    it("returns dominantStatus NONE for empty input", () => {
      const contract = new CommandRuntimeBatchContract();
      const result = contract.batch([]);
      expect(result.dominantStatus).toBe("NONE");
    });

    it("returns zero counts for empty input", () => {
      const contract = new CommandRuntimeBatchContract();
      const result = contract.batch([]);
      expect(result.totalExecuted).toBe(0);
      expect(result.totalSandboxed).toBe(0);
      expect(result.totalSkipped).toBe(0);
      expect(result.totalFailed).toBe(0);
      expect(result.totalRecords).toBe(0);
      expect(result.warnedCount).toBe(0);
    });

    it("returns empty results array for empty input", () => {
      const contract = new CommandRuntimeBatchContract();
      const result = contract.batch([]);
      expect(result.results).toEqual([]);
    });
  });

  describe("FULLY_EXECUTED status", () => {
    it("returns FULLY_EXECUTED when all entries are allowed", () => {
      const contract = new CommandRuntimeBatchContract({
        now: () => "2026-04-05T00:00:00.000Z",
      });
      const gateResult = makePolicyGateResult("gate-1", [
        makeEntry("a-1", "t-1", "allow"),
        makeEntry("a-2", "t-2", "allow"),
      ]);
      const result = contract.batch([{ policyGateResult: gateResult }]);
      expect(result.dominantStatus).toBe("FULLY_EXECUTED");
    });

    it("returns FULLY_EXECUTED with correct counts for all-allow entries", () => {
      const contract = new CommandRuntimeBatchContract({
        now: () => "2026-04-05T00:00:00.000Z",
      });
      const gateResult = makePolicyGateResult("gate-1", [
        makeEntry("a-1", "t-1", "allow"),
        makeEntry("a-2", "t-2", "allow"),
      ]);
      const result = contract.batch([{ policyGateResult: gateResult }]);
      expect(result.totalExecuted).toBe(2);
      expect(result.totalSandboxed).toBe(0);
      expect(result.totalSkipped).toBe(0);
      expect(result.totalFailed).toBe(0);
    });
  });

  describe("FULLY_BLOCKED status", () => {
    it("returns FULLY_BLOCKED when all entries are denied", () => {
      const contract = new CommandRuntimeBatchContract({
        now: () => "2026-04-05T00:00:00.000Z",
      });
      const gateResult = makePolicyGateResult("gate-2", [
        makeEntry("a-1", "t-1", "deny"),
        makeEntry("a-2", "t-2", "deny"),
      ]);
      const result = contract.batch([{ policyGateResult: gateResult }]);
      expect(result.dominantStatus).toBe("FULLY_BLOCKED");
    });

    it("returns FULLY_BLOCKED when all entries are sandboxed", () => {
      const contract = new CommandRuntimeBatchContract({
        now: () => "2026-04-05T00:00:00.000Z",
      });
      const gateResult = makePolicyGateResult("gate-3", [
        makeEntry("a-1", "t-1", "sandbox"),
        makeEntry("a-2", "t-2", "sandbox"),
      ]);
      const result = contract.batch([{ policyGateResult: gateResult }]);
      expect(result.dominantStatus).toBe("FULLY_BLOCKED");
    });

    it("returns FULLY_BLOCKED when all entries are review", () => {
      const contract = new CommandRuntimeBatchContract({
        now: () => "2026-04-05T00:00:00.000Z",
      });
      const gateResult = makePolicyGateResult("gate-4", [
        makeEntry("a-1", "t-1", "review"),
      ]);
      const result = contract.batch([{ policyGateResult: gateResult }]);
      expect(result.dominantStatus).toBe("FULLY_BLOCKED");
    });

    it("returns FULLY_BLOCKED when all entries are pending", () => {
      const contract = new CommandRuntimeBatchContract({
        now: () => "2026-04-05T00:00:00.000Z",
      });
      const gateResult = makePolicyGateResult("gate-5", [
        makeEntry("a-1", "t-1", "pending"),
      ]);
      const result = contract.batch([{ policyGateResult: gateResult }]);
      expect(result.dominantStatus).toBe("FULLY_BLOCKED");
    });

    it("counts skipped correctly for denied entries", () => {
      const contract = new CommandRuntimeBatchContract({
        now: () => "2026-04-05T00:00:00.000Z",
      });
      const gateResult = makePolicyGateResult("gate-6", [
        makeEntry("a-1", "t-1", "deny"),
        makeEntry("a-2", "t-2", "deny"),
        makeEntry("a-3", "t-3", "deny"),
      ]);
      const result = contract.batch([{ policyGateResult: gateResult }]);
      expect(result.totalSkipped).toBe(3);
      expect(result.totalExecuted).toBe(0);
    });
  });

  describe("PARTIALLY_EXECUTED status", () => {
    it("returns PARTIALLY_EXECUTED when mix of allow and deny", () => {
      const contract = new CommandRuntimeBatchContract({
        now: () => "2026-04-05T00:00:00.000Z",
      });
      const gateResult = makePolicyGateResult("gate-7", [
        makeEntry("a-1", "t-1", "allow"),
        makeEntry("a-2", "t-2", "deny"),
      ]);
      const result = contract.batch([{ policyGateResult: gateResult }]);
      expect(result.dominantStatus).toBe("PARTIALLY_EXECUTED");
    });

    it("returns PARTIALLY_EXECUTED when mix of allow and sandbox", () => {
      const contract = new CommandRuntimeBatchContract({
        now: () => "2026-04-05T00:00:00.000Z",
      });
      const gateResult = makePolicyGateResult("gate-8", [
        makeEntry("a-1", "t-1", "allow"),
        makeEntry("a-2", "t-2", "sandbox"),
      ]);
      const result = contract.batch([{ policyGateResult: gateResult }]);
      expect(result.dominantStatus).toBe("PARTIALLY_EXECUTED");
    });

    it("returns PARTIALLY_EXECUTED when mix of allow and review", () => {
      const contract = new CommandRuntimeBatchContract({
        now: () => "2026-04-05T00:00:00.000Z",
      });
      const gateResult = makePolicyGateResult("gate-9", [
        makeEntry("a-1", "t-1", "allow"),
        makeEntry("a-2", "t-2", "review"),
      ]);
      const result = contract.batch([{ policyGateResult: gateResult }]);
      expect(result.dominantStatus).toBe("PARTIALLY_EXECUTED");
    });

    it("returns correct counts for mixed batch", () => {
      const contract = new CommandRuntimeBatchContract({
        now: () => "2026-04-05T00:00:00.000Z",
      });
      const gateResult = makePolicyGateResult("gate-10", [
        makeEntry("a-1", "t-1", "allow"),
        makeEntry("a-2", "t-2", "sandbox"),
        makeEntry("a-3", "t-3", "deny"),
        makeEntry("a-4", "t-4", "review"),
      ]);
      const result = contract.batch([{ policyGateResult: gateResult }]);
      expect(result.totalExecuted).toBe(1);
      expect(result.totalSandboxed).toBe(1);
      expect(result.totalSkipped).toBe(2);
    });
  });

  describe("aggregate counts (multi-input)", () => {
    it("aggregates totalExecuted across multiple inputs", () => {
      const contract = new CommandRuntimeBatchContract({
        now: () => "2026-04-05T00:00:00.000Z",
      });
      const gate1 = makePolicyGateResult("gate-A", [
        makeEntry("a-1", "t-1", "allow"),
        makeEntry("a-2", "t-2", "allow"),
      ]);
      const gate2 = makePolicyGateResult("gate-B", [
        makeEntry("b-1", "t-3", "allow"),
      ]);
      const result = contract.batch([
        { policyGateResult: gate1 },
        { policyGateResult: gate2 },
      ]);
      expect(result.totalExecuted).toBe(3);
      expect(result.results).toHaveLength(2);
    });

    it("aggregates totalRecords = sum of records.length across inputs", () => {
      const contract = new CommandRuntimeBatchContract({
        now: () => "2026-04-05T00:00:00.000Z",
      });
      const gate1 = makePolicyGateResult("gate-C", [
        makeEntry("c-1", "t-1", "allow"),
        makeEntry("c-2", "t-2", "deny"),
      ]);
      const gate2 = makePolicyGateResult("gate-D", [
        makeEntry("d-1", "t-3", "sandbox"),
        makeEntry("d-2", "t-4", "review"),
        makeEntry("d-3", "t-5", "allow"),
      ]);
      const result = contract.batch([
        { policyGateResult: gate1 },
        { policyGateResult: gate2 },
      ]);
      expect(result.totalRecords).toBe(5);
    });

    it("warnedCount = 0 when no results have failedCount > 0", () => {
      const contract = new CommandRuntimeBatchContract({
        now: () => "2026-04-05T00:00:00.000Z",
      });
      const gate1 = makePolicyGateResult("gate-E", [
        makeEntry("e-1", "t-1", "allow"),
      ]);
      const gate2 = makePolicyGateResult("gate-F", [
        makeEntry("f-1", "t-2", "deny"),
      ]);
      const result = contract.batch([
        { policyGateResult: gate1 },
        { policyGateResult: gate2 },
      ]);
      expect(result.warnedCount).toBe(0);
    });
  });

  describe("determinism", () => {
    it("produces identical batchHash for identical inputs", () => {
      const contract = new CommandRuntimeBatchContract({
        now: () => "2026-04-05T12:00:00.000Z",
      });
      const gate = makePolicyGateResult("gate-DET", [
        makeEntry("det-1", "t-1", "allow"),
      ]);
      const r1 = contract.batch([{ policyGateResult: gate }]);
      const r2 = contract.batch([{ policyGateResult: gate }]);
      expect(r1.batchHash).toBe(r2.batchHash);
    });

    it("produces identical batchId for identical inputs", () => {
      const contract = new CommandRuntimeBatchContract({
        now: () => "2026-04-05T12:00:00.000Z",
      });
      const gate = makePolicyGateResult("gate-DET2", [
        makeEntry("det-2", "t-2", "deny"),
      ]);
      const r1 = contract.batch([{ policyGateResult: gate }]);
      const r2 = contract.batch([{ policyGateResult: gate }]);
      expect(r1.batchId).toBe(r2.batchId);
    });

    it("batchId !== batchHash", () => {
      const contract = new CommandRuntimeBatchContract({
        now: () => "2026-04-05T12:00:00.000Z",
      });
      const gate = makePolicyGateResult("gate-DIFF", [
        makeEntry("diff-1", "t-1", "allow"),
      ]);
      const result = contract.batch([{ policyGateResult: gate }]);
      expect(result.batchId).not.toBe(result.batchHash);
    });

    it("different timestamps produce different batchHash", () => {
      let ts = "2026-04-05T10:00:00.000Z";
      const contract = new CommandRuntimeBatchContract({
        now: () => ts,
      });
      const gate = makePolicyGateResult("gate-TS", [
        makeEntry("ts-1", "t-1", "allow"),
      ]);
      const r1 = contract.batch([{ policyGateResult: gate }]);
      ts = "2026-04-05T11:00:00.000Z";
      const r2 = contract.batch([{ policyGateResult: gate }]);
      expect(r1.batchHash).not.toBe(r2.batchHash);
    });
  });

  describe("factory", () => {
    it("creates CommandRuntimeBatchContract via factory function", () => {
      const contract = createCommandRuntimeBatchContract();
      expect(contract).toBeInstanceOf(CommandRuntimeBatchContract);
    });

    it("factory-created contract produces valid batch result", () => {
      const contract = createCommandRuntimeBatchContract({
        now: () => "2026-04-05T00:00:00.000Z",
      });
      const gate = makePolicyGateResult("gate-FAC", [
        makeEntry("fac-1", "t-1", "allow"),
      ]);
      const result = contract.batch([{ policyGateResult: gate }]);
      expect(result.dominantStatus).toBe("FULLY_EXECUTED");
      expect(result.totalExecuted).toBe(1);
    });
  });
});
