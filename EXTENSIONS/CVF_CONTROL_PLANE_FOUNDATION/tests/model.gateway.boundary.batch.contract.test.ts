/**
 * CPF Model Gateway Boundary Batch Contract — Dedicated Tests (W39-T1 CP1)
 * =========================================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 * GC-024: partition entry added to CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json.
 *
 * Coverage:
 *   ModelGatewayBoundaryBatchContract.batch (empty):
 *     - totalResults = 0
 *     - dominantSurfaceCount = 0
 *     - totalFixedInputCount = 0
 *     - totalInScopeCount = 0
 *     - results is empty array
 *     - batchHash is truthy
 *     - batchId is truthy
 *     - batchId !== batchHash
 *     - createdAt set to injected now()
 *
 *   ModelGatewayBoundaryBatchContract.batch (single report):
 *     - totalResults = 1
 *     - dominantSurfaceCount = 20 (18 FIXED_INPUT + 2 IN_SCOPE)
 *     - totalFixedInputCount = 18
 *     - totalInScopeCount = 2
 *     - results contains the provided report
 *     - batchId !== batchHash
 *     - createdAt matches injected now()
 *
 *   ModelGatewayBoundaryBatchContract.batch (two reports):
 *     - totalResults = 2
 *     - dominantSurfaceCount = 20 (same surface count both reports)
 *     - totalFixedInputCount = 36 (18 per report)
 *     - totalInScopeCount = 4 (2 per report)
 *     - results length matches input
 *     - batchId !== batchHash
 *
 *   ModelGatewayBoundaryBatchContract.batch — determinism:
 *     - batchHash deterministic for same input and timestamp
 *     - batchId deterministic for same input and timestamp
 *     - different reportHashes produce different batchHash
 *     - different timestamps produce different batchHash
 *
 *   Factory:
 *     - createModelGatewayBoundaryBatchContract returns working instance
 */

import { describe, it, expect } from "vitest";
import {
  ModelGatewayBoundaryBatchContract,
  createModelGatewayBoundaryBatchContract,
} from "../src/model.gateway.boundary.batch.contract";
import { createModelGatewayBoundaryContract } from "../src/model.gateway.boundary.contract";

const FIXED_NOW = "2026-04-05T00:00:00.000Z";
const fixedNow = () => FIXED_NOW;

function makeReport(ts = FIXED_NOW) {
  const contract = createModelGatewayBoundaryContract({ now: () => ts });
  return contract.generateBoundaryReport();
}

const contract = new ModelGatewayBoundaryBatchContract({ now: fixedNow });

// ─── Empty batch ──────────────────────────────────────────────────────────────

describe("ModelGatewayBoundaryBatchContract.batch (empty)", () => {
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

// ─── Single-report batch ──────────────────────────────────────────────────────

describe("ModelGatewayBoundaryBatchContract.batch (single report)", () => {
  const report = makeReport();
  const result = contract.batch([report]);

  it("totalResults = 1", () => {
    expect(result.totalResults).toBe(1);
  });

  it("dominantSurfaceCount = 20 (18 FIXED_INPUT + 2 IN_SCOPE)", () => {
    expect(result.dominantSurfaceCount).toBe(20);
  });

  it("totalFixedInputCount = 18", () => {
    expect(result.totalFixedInputCount).toBe(18);
  });

  it("totalInScopeCount = 2", () => {
    expect(result.totalInScopeCount).toBe(2);
  });

  it("results contains the provided report", () => {
    expect(result.results[0]).toBe(report);
  });

  it("batchId !== batchHash", () => {
    expect(result.batchId).not.toBe(result.batchHash);
  });

  it("createdAt matches injected now()", () => {
    expect(result.createdAt).toBe(FIXED_NOW);
  });
});

// ─── Multi-report batch ───────────────────────────────────────────────────────

describe("ModelGatewayBoundaryBatchContract.batch (two reports)", () => {
  const r1 = makeReport("2026-04-05T01:00:00.000Z");
  const r2 = makeReport("2026-04-05T02:00:00.000Z");
  const result = contract.batch([r1, r2]);

  it("totalResults = 2", () => {
    expect(result.totalResults).toBe(2);
  });

  it("dominantSurfaceCount = 20 (same surface count across both reports)", () => {
    expect(result.dominantSurfaceCount).toBe(20);
  });

  it("totalFixedInputCount = 36 (18 per report)", () => {
    expect(result.totalFixedInputCount).toBe(36);
  });

  it("totalInScopeCount = 4 (2 per report)", () => {
    expect(result.totalInScopeCount).toBe(4);
  });

  it("results length matches input length", () => {
    expect(result.results).toHaveLength(2);
  });

  it("batchId !== batchHash", () => {
    expect(result.batchId).not.toBe(result.batchHash);
  });
});

// ─── Determinism ──────────────────────────────────────────────────────────────

describe("ModelGatewayBoundaryBatchContract.batch — determinism", () => {
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
    const r2 = makeReport("2026-04-05T06:00:00.000Z");
    const b1 = contract.batch([report]);
    const b2 = contract.batch([r2]);
    expect(b1.batchHash).not.toBe(b2.batchHash);
  });

  it("different timestamps produce different batchHash", () => {
    const contract2 = new ModelGatewayBoundaryBatchContract({
      now: () => "2026-04-05T12:00:00.000Z",
    });
    const b1 = contract.batch([report]);
    const b2 = contract2.batch([report]);
    expect(b1.batchHash).not.toBe(b2.batchHash);
  });
});

// ─── Factory ──────────────────────────────────────────────────────────────────

describe("createModelGatewayBoundaryBatchContract", () => {
  it("returns a working instance", () => {
    const c = createModelGatewayBoundaryBatchContract({ now: fixedNow });
    const report = makeReport();
    const result = c.batch([report]);
    expect(result.totalResults).toBe(1);
    expect(result.dominantSurfaceCount).toBe(20);
    expect(result.totalFixedInputCount).toBe(18);
    expect(result.totalInScopeCount).toBe(2);
    expect(result.createdAt).toBe(FIXED_NOW);
  });
});
