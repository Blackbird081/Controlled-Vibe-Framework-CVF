/**
 * ExecutionAuditSummaryContract — Tests (W6-T9)
 * ===============================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   summarize:
 *     - empty input → SUCCESS dominant, NONE risk, zero counts
 *     - counts by outcomeClass correct
 *     - totalEntries/totalExecuted/totalFailed summed across observations
 *     - averageConfidence rounded to 4 dp
 *     - dominantOutcome severity-first: FAILED > GATED > SANDBOXED > PARTIAL > SUCCESS
 *     - overallRisk HIGH when any FAILED observation
 *     - overallRisk HIGH when totalFailed > 0 even if outcomeClass not FAILED
 *     - overallRisk MEDIUM when GATED or SANDBOXED (no failures)
 *     - overallRisk LOW when PARTIAL only
 *     - overallRisk NONE when all SUCCESS
 *     - auditSummary string non-empty and contains key fields
 *     - summaryId and auditHash are deterministic
 *     - createdAt is set
 *
 *   factory:
 *     - createExecutionAuditSummaryContract returns working instance
 */

import { describe, it, expect } from "vitest";
import {
  ExecutionAuditSummaryContract,
  createExecutionAuditSummaryContract,
} from "../src/execution.audit.summary.contract";
import type { ExecutionObservation, OutcomeClass } from "../src/execution.observer.contract";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-23T14:00:00.000Z";
const fixedNow = () => FIXED_NOW;

let _seq = 0;
function makeObs(
  outcomeClass: OutcomeClass,
  overrides: Partial<ExecutionObservation> = {},
): ExecutionObservation {
  const id = `obs-${++_seq}`;
  return {
    observationId: id,
    createdAt: FIXED_NOW,
    sourcePipelineId: `pipe-${id}`,
    outcomeClass,
    confidenceSignal: overrides.confidenceSignal ?? 1.0,
    totalEntries: overrides.totalEntries ?? 4,
    executedCount: overrides.executedCount ?? 4,
    failedCount: overrides.failedCount ?? 0,
    sandboxedCount: overrides.sandboxedCount ?? 0,
    skippedCount: overrides.skippedCount ?? 0,
    notes: overrides.notes ?? [],
    observationHash: overrides.observationHash ?? `hash-${id}`,
  };
}

function makeContract() {
  return new ExecutionAuditSummaryContract({ now: fixedNow });
}

// ─── summarize ────────────────────────────────────────────────────────────────

describe("ExecutionAuditSummaryContract.summarize", () => {
  it("empty input → SUCCESS dominant, NONE risk, all zeros", () => {
    const result = makeContract().summarize([]);
    expect(result.totalObservations).toBe(0);
    expect(result.dominantOutcome).toBe("SUCCESS");
    expect(result.overallRisk).toBe("NONE");
    expect(result.successCount).toBe(0);
    expect(result.failedCount).toBe(0);
    expect(result.averageConfidence).toBe(0);
    expect(result.totalEntries).toBe(0);
    expect(result.totalExecuted).toBe(0);
    expect(result.totalFailed).toBe(0);
  });

  it("counts each outcomeClass correctly", () => {
    const obs = [
      makeObs("SUCCESS"),
      makeObs("SUCCESS"),
      makeObs("PARTIAL"),
      makeObs("FAILED"),
      makeObs("GATED"),
      makeObs("SANDBOXED"),
    ];
    const result = makeContract().summarize(obs);
    expect(result.successCount).toBe(2);
    expect(result.partialCount).toBe(1);
    expect(result.failedCount).toBe(1);
    expect(result.gatedCount).toBe(1);
    expect(result.sandboxedCount).toBe(1);
    expect(result.totalObservations).toBe(6);
  });

  it("totalEntries, totalExecuted, totalFailed summed across observations", () => {
    const obs = [
      makeObs("SUCCESS", { totalEntries: 10, executedCount: 10, failedCount: 0 }),
      makeObs("PARTIAL", { totalEntries: 5,  executedCount: 3,  failedCount: 1 }),
    ];
    const result = makeContract().summarize(obs);
    expect(result.totalEntries).toBe(15);
    expect(result.totalExecuted).toBe(13);
    expect(result.totalFailed).toBe(1);
  });

  it("averageConfidence rounded to 4 decimal places", () => {
    const obs = [
      makeObs("SUCCESS",   { confidenceSignal: 1.0 }),
      makeObs("PARTIAL",   { confidenceSignal: 0.5 }),
      makeObs("SANDBOXED", { confidenceSignal: 0.5 }),
    ];
    const result = makeContract().summarize(obs);
    // (1.0 + 0.5 + 0.5) / 3 = 0.6667
    expect(result.averageConfidence).toBeCloseTo(0.6667, 3);
  });

  it("averageConfidence of single SUCCESS (confidence=1.0) is 1.0", () => {
    const result = makeContract().summarize([makeObs("SUCCESS", { confidenceSignal: 1.0 })]);
    expect(result.averageConfidence).toBe(1.0);
  });

  describe("dominantOutcome severity-first", () => {
    it("FAILED dominates even when outnumbered", () => {
      const obs = [
        makeObs("SUCCESS"),
        makeObs("SUCCESS"),
        makeObs("SUCCESS"),
        makeObs("FAILED"),
      ];
      expect(makeContract().summarize(obs).dominantOutcome).toBe("FAILED");
    });

    it("GATED dominates over SANDBOXED, PARTIAL, SUCCESS", () => {
      const obs = [makeObs("SUCCESS"), makeObs("SANDBOXED"), makeObs("PARTIAL"), makeObs("GATED")];
      expect(makeContract().summarize(obs).dominantOutcome).toBe("GATED");
    });

    it("SANDBOXED dominates over PARTIAL and SUCCESS", () => {
      const obs = [makeObs("SUCCESS"), makeObs("PARTIAL"), makeObs("SANDBOXED")];
      expect(makeContract().summarize(obs).dominantOutcome).toBe("SANDBOXED");
    });

    it("PARTIAL dominates over SUCCESS", () => {
      const obs = [makeObs("SUCCESS"), makeObs("PARTIAL")];
      expect(makeContract().summarize(obs).dominantOutcome).toBe("PARTIAL");
    });

    it("all SUCCESS → dominantOutcome SUCCESS", () => {
      const obs = [makeObs("SUCCESS"), makeObs("SUCCESS")];
      expect(makeContract().summarize(obs).dominantOutcome).toBe("SUCCESS");
    });
  });

  describe("overallRisk derivation", () => {
    it("HIGH when any FAILED outcomeClass", () => {
      const obs = [makeObs("SUCCESS"), makeObs("FAILED")];
      expect(makeContract().summarize(obs).overallRisk).toBe("HIGH");
    });

    it("HIGH when totalFailed > 0 even if no FAILED outcomeClass observations", () => {
      // observation is PARTIAL but has failedCount > 0
      const obs = [makeObs("PARTIAL", { failedCount: 2 })];
      const result = makeContract().summarize(obs);
      expect(result.totalFailed).toBe(2);
      expect(result.overallRisk).toBe("HIGH");
    });

    it("MEDIUM when GATED present (no failures)", () => {
      const obs = [makeObs("SUCCESS"), makeObs("GATED")];
      expect(makeContract().summarize(obs).overallRisk).toBe("MEDIUM");
    });

    it("MEDIUM when SANDBOXED present (no failures)", () => {
      const obs = [makeObs("SUCCESS"), makeObs("SANDBOXED")];
      expect(makeContract().summarize(obs).overallRisk).toBe("MEDIUM");
    });

    it("LOW when PARTIAL only (no failures, gates, sandboxes)", () => {
      const obs = [makeObs("SUCCESS"), makeObs("PARTIAL", { failedCount: 0 })];
      expect(makeContract().summarize(obs).overallRisk).toBe("LOW");
    });

    it("NONE when all SUCCESS", () => {
      const obs = [makeObs("SUCCESS"), makeObs("SUCCESS")];
      expect(makeContract().summarize(obs).overallRisk).toBe("NONE");
    });
  });

  it("auditSummary is non-empty for non-empty input", () => {
    const result = makeContract().summarize([makeObs("SUCCESS")]);
    expect(result.auditSummary.length).toBeGreaterThan(0);
    expect(result.auditSummary).toContain("SUCCESS");
  });

  it("auditSummary for empty input indicates no observations", () => {
    const result = makeContract().summarize([]);
    expect(result.auditSummary).toContain("No");
  });

  it("summaryId and auditHash are deterministic for same input", () => {
    const obs = [makeObs("SUCCESS", { confidenceSignal: 0.9 })];
    const contract = makeContract();
    const r1 = contract.summarize(obs);
    // Reset seq to reproduce same observationHash
    const obs2 = [{ ...obs[0] }];
    const r2 = contract.summarize(obs2);
    expect(r1.auditHash).toBe(r2.auditHash);
    expect(r1.summaryId).toBe(r2.summaryId);
  });

  it("createdAt is set on result", () => {
    const result = makeContract().summarize([]);
    expect(result.createdAt).toBe(FIXED_NOW);
  });
});

// ─── Factory ──────────────────────────────────────────────────────────────────

describe("createExecutionAuditSummaryContract", () => {
  it("returns a working instance with default engine", () => {
    const contract = createExecutionAuditSummaryContract();
    const result = contract.summarize([]);
    expect(result.totalObservations).toBe(0);
    expect(result.dominantOutcome).toBe("SUCCESS");
  });

  it("accepts now dependency", () => {
    const contract = createExecutionAuditSummaryContract({ now: fixedNow });
    const result = contract.summarize([]);
    expect(result.createdAt).toBe(FIXED_NOW);
  });
});
