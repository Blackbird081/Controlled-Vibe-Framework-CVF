import { describe, it, expect } from "vitest";
import {
  RagContextEngineConvergenceBatchContract,
  createRagContextEngineConvergenceBatchContract,
} from "../src/rag.context.engine.convergence.batch.contract";
import { createRagContextEngineConvergenceContract } from "../src/rag.context.engine.convergence.contract";

const FIXED_NOW = "2026-03-29T12:00:00.000Z";
const fixedNow = () => FIXED_NOW;

function makeReport(ts = FIXED_NOW) {
  const contract = createRagContextEngineConvergenceContract({ now: () => ts });
  return contract.generateConvergenceReport();
}

const contract = new RagContextEngineConvergenceBatchContract({ now: fixedNow });

// ─── Empty batch ─────────────────────────────────────────────────────────────

describe("RagContextEngineConvergenceBatchContract.batch (empty)", () => {
  const result = contract.batch([]);

  it("totalResults = 0", () => {
    expect(result.totalResults).toBe(0);
  });

  it("dominantSurfaceCount = 0", () => {
    expect(result.dominantSurfaceCount).toBe(0);
  });

  it("totalFixedInputCount = 0", () => {
    expect(result.totalFixedInputCount).toBe(0);
  });

  it("totalInScopeCount = 0", () => {
    expect(result.totalInScopeCount).toBe(0);
  });

  it("results is empty array", () => {
    expect(result.results).toHaveLength(0);
  });

  it("batchHash is truthy", () => {
    expect(result.batchHash.length).toBeGreaterThan(0);
  });

  it("batchId is truthy", () => {
    expect(result.batchId.length).toBeGreaterThan(0);
  });

  it("batchId !== batchHash", () => {
    expect(result.batchId).not.toBe(result.batchHash);
  });

  it("createdAt set to injected now()", () => {
    expect(result.createdAt).toBe(FIXED_NOW);
  });
});

// ─── Single-report batch ─────────────────────────────────────────────────────

describe("RagContextEngineConvergenceBatchContract.batch (single report)", () => {
  const report = makeReport();
  const result = contract.batch([report]);

  it("totalResults = 1", () => {
    expect(result.totalResults).toBe(1);
  });

  it("dominantSurfaceCount = 43 (all surfaces from single report)", () => {
    expect(result.dominantSurfaceCount).toBe(43);
  });

  it("totalFixedInputCount = 40", () => {
    expect(result.totalFixedInputCount).toBe(40);
  });

  it("totalInScopeCount = 3", () => {
    expect(result.totalInScopeCount).toBe(3);
  });

  it("results contains the provided report", () => {
    expect(result.results[0]).toBe(report);
  });

  it("batchId !== batchHash", () => {
    expect(result.batchId).not.toBe(result.batchHash);
  });
});

// ─── Multi-report batch ──────────────────────────────────────────────────────

describe("RagContextEngineConvergenceBatchContract.batch (two reports)", () => {
  const r1 = makeReport("2026-03-29T11:00:00.000Z");
  const r2 = makeReport("2026-03-29T12:00:00.000Z");
  const result = contract.batch([r1, r2]);

  it("totalResults = 2", () => {
    expect(result.totalResults).toBe(2);
  });

  it("dominantSurfaceCount = 43 (same surface count across both reports)", () => {
    expect(result.dominantSurfaceCount).toBe(43);
  });

  it("totalFixedInputCount = 80 (40 per report)", () => {
    expect(result.totalFixedInputCount).toBe(80);
  });

  it("totalInScopeCount = 6 (3 per report)", () => {
    expect(result.totalInScopeCount).toBe(6);
  });

  it("results length matches input length", () => {
    expect(result.results).toHaveLength(2);
  });
});

// ─── Determinism ─────────────────────────────────────────────────────────────

describe("RagContextEngineConvergenceBatchContract.batch — determinism", () => {
  const report = makeReport();

  it("batchHash is deterministic for same input and timestamp", () => {
    const b1 = contract.batch([report]);
    const b2 = contract.batch([report]);
    expect(b1.batchHash).toBe(b2.batchHash);
  });

  it("batchId is deterministic for same input and timestamp", () => {
    const b1 = contract.batch([report]);
    const b2 = contract.batch([report]);
    expect(b1.batchId).toBe(b2.batchId);
  });

  it("different report hashes produce different batchHash", () => {
    const r2 = makeReport("2026-03-29T15:00:00.000Z");
    const b1 = contract.batch([report]);
    const b2 = contract.batch([r2]);
    expect(b1.batchHash).not.toBe(b2.batchHash);
  });
});

// ─── Factory ─────────────────────────────────────────────────────────────────

describe("createRagContextEngineConvergenceBatchContract", () => {
  it("returns a working instance", () => {
    const c = createRagContextEngineConvergenceBatchContract({ now: fixedNow });
    const report = makeReport();
    const result = c.batch([report]);
    expect(result.totalResults).toBe(1);
    expect(result.dominantSurfaceCount).toBe(43);
    expect(result.totalFixedInputCount).toBe(40);
    expect(result.totalInScopeCount).toBe(3);
    expect(result.createdAt).toBe(FIXED_NOW);
  });
});
