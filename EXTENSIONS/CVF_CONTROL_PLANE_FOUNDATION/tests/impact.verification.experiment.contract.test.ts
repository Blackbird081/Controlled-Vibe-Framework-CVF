import { describe, expect, it } from "vitest";
import {
  FIXED_VERIFIER_BUNDLE,
  VERIFICATION_EXPERIMENT_CASES,
  buildVerificationExperimentReceipt,
  executeVerificationRun,
  selectVerifiers,
  type VerificationCase,
} from "../src/impact.verification.experiment.contract";

describe("ACEL G6 impact-derived verification experiment", () => {
  it("defines exactly eight versioned cases", () => {
    expect(VERIFICATION_EXPERIMENT_CASES).toHaveLength(8);
    expect(new Set(VERIFICATION_EXPERIMENT_CASES.map((item) => item.caseId)).size).toBe(8);
  });

  it("fixed policy always selects the complete bundle", () => {
    for (const item of VERIFICATION_EXPERIMENT_CASES) {
      expect(selectVerifiers(item, "FIXED_BUNDLE").selected).toEqual(FIXED_VERIFIER_BUNDLE);
    }
  });

  it.each([
    ["docs-baseline", ["baseline-safety", "docs-governance"]],
    ["ts-contract", ["baseline-safety", "focused-tests", "typescript-typecheck"]],
    ["ts-test", ["baseline-safety", "focused-tests"]],
    ["checker-source", ["baseline-safety", "checker-tests", "docs-governance"]],
    ["session-state", ["active-session", "baseline-safety"]],
    ["provider-adapter", ["baseline-safety", "focused-tests", "provider-contract", "typescript-typecheck"]],
  ])("derives the closed verifier set for %s", (caseId, expected) => {
    const item = VERIFICATION_EXPERIMENT_CASES.find((candidate) => candidate.caseId === caseId)!;
    expect(selectVerifiers(item, "IMPACT_DERIVED").selected).toEqual(expected);
  });

  it("fails closed to the fixed bundle for unknown impact", () => {
    const item = VERIFICATION_EXPERIMENT_CASES.find((candidate) => candidate.caseId === "unknown-owner")!;
    expect(selectVerifiers(item, "IMPACT_DERIVED")).toEqual({
      selected: FIXED_VERIFIER_BUNDLE,
      fallbackReason: "UNKNOWN_IMPACT_FAIL_CLOSED",
    });
  });

  it("detects every seeded regression under both policies", () => {
    for (const item of VERIFICATION_EXPERIMENT_CASES) {
      for (const policy of ["FIXED_BUNDLE", "IMPACT_DERIVED"] as const) {
        const record = executeVerificationRun(item, policy, 1);
        expect(record.missedRegressionIds).toEqual([]);
        expect(record.detectedRegressionIds).toHaveLength(item.seededRegressions.length);
        expect(record.admitted).toBe(true);
      }
    }
  });

  it("reduces deterministic cost for at least one known-impact case", () => {
    const reductions = VERIFICATION_EXPERIMENT_CASES
      .filter((item) => !item.impactClasses.includes("UNKNOWN"))
      .map((item) => ({
        fixed: executeVerificationRun(item, "FIXED_BUNDLE", 1).deterministicCostUnits,
        impact: executeVerificationRun(item, "IMPACT_DERIVED", 1).deterministicCostUnits,
      }));
    expect(reductions.some((row) => row.impact < row.fixed)).toBe(true);
    expect(reductions.every((row) => row.impact <= row.fixed)).toBe(true);
  });

  it("does not admit a plan that misses a seeded regression", () => {
    const impossible: VerificationCase = {
      caseId: "negative-missed-regression",
      changedPaths: ["docs/example.md"],
      impactClasses: ["DOCUMENTATION"],
      seededRegressions: [{ id: "requires-provider", detectedBy: ["provider-contract"] }],
      authority: "LOCAL_HERMETIC_EXPERIMENT_ONLY",
    };
    const record = executeVerificationRun(impossible, "IMPACT_DERIVED", 1);
    expect(record.admitted).toBe(false);
    expect(record.missedRegressionIds).toEqual(["requires-provider"]);
  });

  it("produces exactly 32 unique admitted records", () => {
    const receipt = buildVerificationExperimentReceipt();
    expect(receipt.totalRuns).toBe(32);
    expect(receipt.uniqueRunKeys).toBe(32);
    expect(receipt.records.every((record) => record.admitted)).toBe(true);
    expect(receipt.aggregate.every((row) => row.missedRegressionCount === 0)).toBe(true);
  });

  it("is byte-stable for identical inputs", () => {
    expect(JSON.stringify(buildVerificationExperimentReceipt())).toBe(
      JSON.stringify(buildVerificationExperimentReceipt()),
    );
  });

  it("preserves the local-only authority envelope", () => {
    expect(buildVerificationExperimentReceipt().records.every((record) => record.authorityPreserved)).toBe(true);
  });
});
