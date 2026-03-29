import { describe, it, expect } from "vitest";
import {
  TaskMarketplaceBatchContract,
  createTaskMarketplaceBatchContract,
} from "../src/task.marketplace.batch.contract";
import type { TaskAllocationRecord } from "../src/task.marketplace.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeRecord(
  overrides: Partial<TaskAllocationRecord> = {},
): TaskAllocationRecord {
  return {
    recordId: "rec-001",
    allocatedAt: "2026-03-29T00:00:00.000Z",
    requestId: "req-001",
    agentId: "agent-001",
    allocationDecision: "ASSIGN",
    assignedPriorityCeiling: "critical",
    rationale: "TRUSTED agent — capacity unconstrained — ASSIGN at priority ceiling critical",
    allocationHash: "hash-001",
    ...overrides,
  };
}

const FIXED_NOW = "2026-03-29T12:00:00.000Z";

function makeContract() {
  return new TaskMarketplaceBatchContract({ now: () => FIXED_NOW });
}

// ─── Empty batch ──────────────────────────────────────────────────────────────

describe("TaskMarketplaceBatchContract — empty batch", () => {
  it("returns totalRecords 0 for empty input", () => {
    const result = makeContract().batch([]);
    expect(result.totalRecords).toBe(0);
  });

  it("returns all decision counts 0 for empty input", () => {
    const result = makeContract().batch([]);
    expect(result.assignCount).toBe(0);
    expect(result.deferCount).toBe(0);
    expect(result.rejectCount).toBe(0);
  });

  it("returns dominantPriorityCeiling 'none' for empty batch", () => {
    const result = makeContract().batch([]);
    expect(result.dominantPriorityCeiling).toBe("none");
  });

  it("returns a non-empty batchHash for empty batch", () => {
    const result = makeContract().batch([]);
    expect(typeof result.batchHash).toBe("string");
    expect(result.batchHash.length).toBeGreaterThan(0);
  });

  it("returns a non-empty batchId for empty batch", () => {
    const result = makeContract().batch([]);
    expect(typeof result.batchId).toBe("string");
    expect(result.batchId.length).toBeGreaterThan(0);
  });
});

// ─── Decision counts ──────────────────────────────────────────────────────────

describe("TaskMarketplaceBatchContract — decision counts", () => {
  it("counts ASSIGN records correctly", () => {
    const records = [
      makeRecord({ allocationHash: "h1", allocationDecision: "ASSIGN" }),
      makeRecord({ allocationHash: "h2", allocationDecision: "ASSIGN" }),
      makeRecord({ allocationHash: "h3", allocationDecision: "DEFER" }),
    ];
    const result = makeContract().batch(records);
    expect(result.assignCount).toBe(2);
  });

  it("counts DEFER records correctly", () => {
    const records = [
      makeRecord({ allocationHash: "h1", allocationDecision: "DEFER", assignedPriorityCeiling: "high" }),
      makeRecord({ allocationHash: "h2", allocationDecision: "ASSIGN" }),
    ];
    const result = makeContract().batch(records);
    expect(result.deferCount).toBe(1);
  });

  it("counts REJECT records correctly", () => {
    const records = [
      makeRecord({ allocationHash: "h1", allocationDecision: "REJECT", assignedPriorityCeiling: "none" }),
      makeRecord({ allocationHash: "h2", allocationDecision: "REJECT", assignedPriorityCeiling: "none" }),
    ];
    const result = makeContract().batch(records);
    expect(result.rejectCount).toBe(2);
  });

  it("counts all three decisions in a mixed batch", () => {
    const records = [
      makeRecord({ allocationHash: "h1", allocationDecision: "ASSIGN" }),
      makeRecord({ allocationHash: "h2", allocationDecision: "DEFER", assignedPriorityCeiling: "high" }),
      makeRecord({ allocationHash: "h3", allocationDecision: "REJECT", assignedPriorityCeiling: "none" }),
    ];
    const result = makeContract().batch(records);
    expect(result.assignCount).toBe(1);
    expect(result.deferCount).toBe(1);
    expect(result.rejectCount).toBe(1);
    expect(result.totalRecords).toBe(3);
  });
});

// ─── dominantPriorityCeiling ──────────────────────────────────────────────────

describe("TaskMarketplaceBatchContract — dominantPriorityCeiling", () => {
  it("returns 'critical' when any ASSIGN record has critical ceiling", () => {
    const records = [
      makeRecord({ allocationHash: "h1", allocationDecision: "ASSIGN", assignedPriorityCeiling: "critical" }),
      makeRecord({ allocationHash: "h2", allocationDecision: "ASSIGN", assignedPriorityCeiling: "high" }),
    ];
    expect(makeContract().batch(records).dominantPriorityCeiling).toBe("critical");
  });

  it("returns 'high' when highest ASSIGN ceiling is high", () => {
    const records = [
      makeRecord({ allocationHash: "h1", allocationDecision: "ASSIGN", assignedPriorityCeiling: "high" }),
      makeRecord({ allocationHash: "h2", allocationDecision: "ASSIGN", assignedPriorityCeiling: "medium" }),
    ];
    expect(makeContract().batch(records).dominantPriorityCeiling).toBe("high");
  });

  it("returns 'medium' when all ASSIGN records have medium ceiling", () => {
    const records = [
      makeRecord({ allocationHash: "h1", allocationDecision: "ASSIGN", assignedPriorityCeiling: "medium" }),
    ];
    expect(makeContract().batch(records).dominantPriorityCeiling).toBe("medium");
  });

  it("returns 'none' when no ASSIGN records exist (all DEFER)", () => {
    const records = [
      makeRecord({ allocationHash: "h1", allocationDecision: "DEFER", assignedPriorityCeiling: "high" }),
      makeRecord({ allocationHash: "h2", allocationDecision: "DEFER", assignedPriorityCeiling: "medium" }),
    ];
    expect(makeContract().batch(records).dominantPriorityCeiling).toBe("none");
  });

  it("returns 'none' when no ASSIGN records exist (all REJECT)", () => {
    const records = [
      makeRecord({ allocationHash: "h1", allocationDecision: "REJECT", assignedPriorityCeiling: "none" }),
    ];
    expect(makeContract().batch(records).dominantPriorityCeiling).toBe("none");
  });

  it("ignores DEFER/REJECT ceilings when computing dominantPriorityCeiling", () => {
    const records = [
      makeRecord({ allocationHash: "h1", allocationDecision: "ASSIGN", assignedPriorityCeiling: "medium" }),
      makeRecord({ allocationHash: "h2", allocationDecision: "DEFER", assignedPriorityCeiling: "critical" }),
    ];
    expect(makeContract().batch(records).dominantPriorityCeiling).toBe("medium");
  });
});

// ─── Determinism ──────────────────────────────────────────────────────────────

describe("TaskMarketplaceBatchContract — determinism", () => {
  it("produces identical batchHash for identical inputs", () => {
    const records = [
      makeRecord({ allocationHash: "h1" }),
      makeRecord({ allocationHash: "h2", allocationDecision: "DEFER", assignedPriorityCeiling: "high" }),
    ];
    const r1 = makeContract().batch(records);
    const r2 = makeContract().batch(records);
    expect(r1.batchHash).toBe(r2.batchHash);
  });

  it("produces identical batchId for identical inputs", () => {
    const records = [makeRecord({ allocationHash: "h1" })];
    const r1 = makeContract().batch(records);
    const r2 = makeContract().batch(records);
    expect(r1.batchId).toBe(r2.batchId);
  });

  it("batchId differs from batchHash", () => {
    const result = makeContract().batch([makeRecord({ allocationHash: "h1" })]);
    expect(result.batchId).not.toBe(result.batchHash);
  });

  it("different allocationHash inputs produce different batchHash", () => {
    const r1 = makeContract().batch([makeRecord({ allocationHash: "h1" })]);
    const r2 = makeContract().batch([makeRecord({ allocationHash: "h2" })]);
    expect(r1.batchHash).not.toBe(r2.batchHash);
  });

  it("different timestamps produce different batchHash", () => {
    const records = [makeRecord({ allocationHash: "h1" })];
    const c1 = new TaskMarketplaceBatchContract({ now: () => "2026-03-29T10:00:00.000Z" });
    const c2 = new TaskMarketplaceBatchContract({ now: () => "2026-03-29T11:00:00.000Z" });
    expect(c1.batch(records).batchHash).not.toBe(c2.batch(records).batchHash);
  });
});

// ─── createdAt ────────────────────────────────────────────────────────────────

describe("TaskMarketplaceBatchContract — createdAt", () => {
  it("uses injected timestamp", () => {
    const result = makeContract().batch([]);
    expect(result.createdAt).toBe(FIXED_NOW);
  });

  it("falls back to real timestamp when no dependency injected", () => {
    const contract = new TaskMarketplaceBatchContract();
    const before = new Date().toISOString();
    const result = contract.batch([]);
    const after = new Date().toISOString();
    expect(result.createdAt >= before).toBe(true);
    expect(result.createdAt <= after).toBe(true);
  });
});

// ─── Factory ──────────────────────────────────────────────────────────────────

describe("createTaskMarketplaceBatchContract — factory", () => {
  it("returns a TaskMarketplaceBatchContract instance", () => {
    const contract = createTaskMarketplaceBatchContract();
    expect(contract).toBeInstanceOf(TaskMarketplaceBatchContract);
  });

  it("factory result batches correctly", () => {
    const contract = createTaskMarketplaceBatchContract({ now: () => FIXED_NOW });
    const result = contract.batch([makeRecord({ allocationHash: "h1" })]);
    expect(result.totalRecords).toBe(1);
  });
});
