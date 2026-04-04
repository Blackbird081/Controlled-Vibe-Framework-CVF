/**
 * LPF Evaluation Engine — Dedicated Tests (W6-T12)
 * ==================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   EvaluationEngineContract.evaluate:
 *     - INCONCLUSIVE when confidenceLevel < 0.3
 *     - INCONCLUSIVE when healthTrajectory === "UNKNOWN" (even with high confidence)
 *     - FAIL when currentHealthSignal === "CRITICAL" (confidence sufficient)
 *     - FAIL when dominantPattern === "REJECT" (confidence sufficient, no critical signal)
 *     - WARN when currentHealthSignal === "DEGRADED"
 *     - WARN when dominantPattern === "ESCALATE"
 *     - WARN when healthTrajectory === "DEGRADING"
 *     - PASS when all signals are healthy
 *     - severity CRITICAL for FAIL with CRITICAL health
 *     - severity HIGH for FAIL without CRITICAL health (REJECT pattern)
 *     - severity HIGH for WARN with DEGRADING trajectory
 *     - severity MEDIUM for WARN without DEGRADING trajectory
 *     - severity LOW for PASS with confidenceLevel < 0.5
 *     - severity NONE for PASS with confidenceLevel >= 0.5
 *     - severity LOW for INCONCLUSIVE
 *     - rationale contains verdict keyword
 *     - sourceTruthModelId and sourceTruthModelVersion propagated
 *     - confidenceLevel propagated to result
 *     - custom evaluateModel override is respected
 *     - evaluationHash and resultId are deterministic
 *     - evaluatedAt is set to injected now()
 *     - factory createEvaluationEngineContract returns working instance
 *
 *   EvaluationThresholdContract.assess:
 *     - empty input → INSUFFICIENT_DATA, all counts zero
 *     - all INCONCLUSIVE → INSUFFICIENT_DATA
 *     - any FAIL → FAILING
 *     - FAIL dominates over WARN (both present)
 *     - any WARN (no FAIL) → WARNING
 *     - all PASS → PASSING
 *     - counts each verdict correctly
 *     - summary contains overallStatus and breakdown
 *     - summary for empty indicates no results
 *     - assessmentHash and assessmentId are deterministic
 *     - assessedAt is set to injected now()
 *     - factory createEvaluationThresholdContract returns working instance
 */

import { describe, it, expect } from "vitest";

import {
  EvaluationEngineContract,
  createEvaluationEngineContract,
} from "../src/evaluation.engine.contract";
import type { EvaluationResult } from "../src/evaluation.engine.contract";

import {
  EvaluationThresholdContract,
  createEvaluationThresholdContract,
} from "../src/evaluation.threshold.contract";

import type { TruthModel } from "../src/truth.model.contract";
import type { DominantPattern, HealthSignal } from "../src/pattern.detection.contract";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-23T17:00:00.000Z";
const fixedNow = () => FIXED_NOW;

let _modelSeq = 0;
function makeModel(overrides: Partial<TruthModel> = {}): TruthModel {
  const n = ++_modelSeq;
  return {
    modelId: `model-${n}`,
    createdAt: FIXED_NOW,
    version: 1,
    totalInsightsProcessed: overrides.totalInsightsProcessed ?? 10,
    dominantPattern: (overrides.dominantPattern as DominantPattern) ?? "ACCEPT",
    currentHealthSignal: (overrides.currentHealthSignal as HealthSignal) ?? "HEALTHY",
    healthTrajectory: overrides.healthTrajectory ?? "STABLE",
    confidenceLevel: overrides.confidenceLevel ?? 0.8,
    patternHistory: overrides.patternHistory ?? [],
    modelHash: overrides.modelHash ?? `hash-model-${n}`,
    ...overrides,
  };
}

let _resultSeq = 0;
function makeResult(verdict: EvaluationResult["verdict"]): EvaluationResult {
  const n = ++_resultSeq;
  return {
    resultId: `result-${n}`,
    evaluatedAt: FIXED_NOW,
    sourceTruthModelId: `model-${n}`,
    sourceTruthModelVersion: 1,
    verdict,
    severity: "NONE",
    confidenceLevel: 0.8,
    rationale: `verdict=${verdict}`,
    evaluationHash: `hash-result-${n}`,
  };
}

// ─── EvaluationEngineContract ─────────────────────────────────────────────────

describe("EvaluationEngineContract.evaluate", () => {
  const contract = new EvaluationEngineContract({ now: fixedNow });

  describe("verdict derivation", () => {
    it("INCONCLUSIVE when confidenceLevel < 0.3 (healthTrajectory STABLE)", () => {
      const model = makeModel({ confidenceLevel: 0.2, healthTrajectory: "STABLE" });
      expect(contract.evaluate(model).verdict).toBe("INCONCLUSIVE");
    });

    it("INCONCLUSIVE when healthTrajectory is UNKNOWN (even with high confidence)", () => {
      const model = makeModel({ confidenceLevel: 0.9, healthTrajectory: "UNKNOWN" });
      expect(contract.evaluate(model).verdict).toBe("INCONCLUSIVE");
    });

    it("INCONCLUSIVE takes priority over FAIL (low confidence + CRITICAL health)", () => {
      const model = makeModel({
        confidenceLevel: 0.1,
        currentHealthSignal: "CRITICAL",
        healthTrajectory: "STABLE",
      });
      expect(contract.evaluate(model).verdict).toBe("INCONCLUSIVE");
    });

    it("FAIL when currentHealthSignal is CRITICAL (confidence sufficient)", () => {
      const model = makeModel({ currentHealthSignal: "CRITICAL", confidenceLevel: 0.8, healthTrajectory: "STABLE" });
      expect(contract.evaluate(model).verdict).toBe("FAIL");
    });

    it("FAIL when dominantPattern is REJECT (no critical health)", () => {
      const model = makeModel({ dominantPattern: "REJECT", confidenceLevel: 0.8, healthTrajectory: "STABLE" });
      expect(contract.evaluate(model).verdict).toBe("FAIL");
    });

    it("WARN when currentHealthSignal is DEGRADED (confidence sufficient)", () => {
      const model = makeModel({ currentHealthSignal: "DEGRADED", confidenceLevel: 0.8, healthTrajectory: "STABLE" });
      expect(contract.evaluate(model).verdict).toBe("WARN");
    });

    it("WARN when dominantPattern is ESCALATE", () => {
      const model = makeModel({ dominantPattern: "ESCALATE", confidenceLevel: 0.8, healthTrajectory: "STABLE" });
      expect(contract.evaluate(model).verdict).toBe("WARN");
    });

    it("WARN when healthTrajectory is DEGRADING", () => {
      const model = makeModel({
        dominantPattern: "ACCEPT",
        currentHealthSignal: "HEALTHY",
        confidenceLevel: 0.8,
        healthTrajectory: "DEGRADING",
      });
      expect(contract.evaluate(model).verdict).toBe("WARN");
    });

    it("PASS when all signals are healthy", () => {
      const model = makeModel({
        dominantPattern: "ACCEPT",
        currentHealthSignal: "HEALTHY",
        healthTrajectory: "STABLE",
        confidenceLevel: 0.8,
      });
      expect(contract.evaluate(model).verdict).toBe("PASS");
    });
  });

  describe("severity derivation", () => {
    it("CRITICAL for FAIL when currentHealthSignal is CRITICAL", () => {
      const model = makeModel({ currentHealthSignal: "CRITICAL", confidenceLevel: 0.8, healthTrajectory: "STABLE" });
      expect(contract.evaluate(model).severity).toBe("CRITICAL");
    });

    it("HIGH for FAIL when dominantPattern is REJECT (not CRITICAL health)", () => {
      const model = makeModel({ dominantPattern: "REJECT", currentHealthSignal: "HEALTHY", confidenceLevel: 0.8, healthTrajectory: "STABLE" });
      expect(contract.evaluate(model).severity).toBe("HIGH");
    });

    it("HIGH for WARN when healthTrajectory is DEGRADING", () => {
      const model = makeModel({
        currentHealthSignal: "HEALTHY",
        dominantPattern: "ACCEPT",
        healthTrajectory: "DEGRADING",
        confidenceLevel: 0.8,
      });
      expect(contract.evaluate(model).severity).toBe("HIGH");
    });

    it("MEDIUM for WARN without DEGRADING trajectory (DEGRADED health)", () => {
      const model = makeModel({ currentHealthSignal: "DEGRADED", confidenceLevel: 0.8, healthTrajectory: "STABLE" });
      expect(contract.evaluate(model).severity).toBe("MEDIUM");
    });

    it("MEDIUM for WARN without DEGRADING trajectory (ESCALATE pattern)", () => {
      const model = makeModel({ dominantPattern: "ESCALATE", confidenceLevel: 0.8, healthTrajectory: "STABLE" });
      expect(contract.evaluate(model).severity).toBe("MEDIUM");
    });

    it("LOW for PASS when confidenceLevel < 0.5", () => {
      const model = makeModel({
        confidenceLevel: 0.45,
        healthTrajectory: "STABLE",
        currentHealthSignal: "HEALTHY",
        dominantPattern: "ACCEPT",
      });
      expect(contract.evaluate(model).verdict).toBe("PASS");
      expect(contract.evaluate(model).severity).toBe("LOW");
    });

    it("NONE for PASS when confidenceLevel >= 0.5", () => {
      const model = makeModel({ confidenceLevel: 0.8, healthTrajectory: "STABLE", currentHealthSignal: "HEALTHY", dominantPattern: "ACCEPT" });
      expect(contract.evaluate(model).severity).toBe("NONE");
    });

    it("LOW for INCONCLUSIVE", () => {
      const model = makeModel({ confidenceLevel: 0.1, healthTrajectory: "STABLE" });
      expect(contract.evaluate(model).severity).toBe("LOW");
    });
  });

  it("rationale contains verdict keyword for FAIL", () => {
    const model = makeModel({ currentHealthSignal: "CRITICAL", confidenceLevel: 0.8, healthTrajectory: "STABLE" });
    expect(contract.evaluate(model).rationale).toContain("FAIL");
  });

  it("rationale contains verdict keyword for PASS", () => {
    const model = makeModel({ confidenceLevel: 0.8, healthTrajectory: "STABLE", currentHealthSignal: "HEALTHY", dominantPattern: "ACCEPT" });
    expect(contract.evaluate(model).rationale).toContain("PASS");
  });

  it("sourceTruthModelId and sourceTruthModelVersion propagated", () => {
    const model = makeModel({ confidenceLevel: 0.8, healthTrajectory: "STABLE" });
    const result = contract.evaluate(model);
    expect(result.sourceTruthModelId).toBe(model.modelId);
    expect(result.sourceTruthModelVersion).toBe(model.version);
  });

  it("confidenceLevel propagated to result", () => {
    const model = makeModel({ confidenceLevel: 0.72, healthTrajectory: "STABLE" });
    expect(contract.evaluate(model).confidenceLevel).toBe(0.72);
  });

  it("custom evaluateModel override is respected", () => {
    const custom = new EvaluationEngineContract({
      now: fixedNow,
      evaluateModel: () => "WARN",
    });
    const model = makeModel({ confidenceLevel: 0.9, healthTrajectory: "STABLE", currentHealthSignal: "HEALTHY" });
    expect(custom.evaluate(model).verdict).toBe("WARN");
  });

  it("evaluationHash and resultId are deterministic for same inputs and timestamp", () => {
    const model = makeModel({ confidenceLevel: 0.8, healthTrajectory: "STABLE" });
    const r1 = contract.evaluate(model);
    const r2 = contract.evaluate(model);
    expect(r1.evaluationHash).toBe(r2.evaluationHash);
    expect(r1.resultId).toBe(r2.resultId);
  });

  it("evaluatedAt is set to injected now()", () => {
    const model = makeModel();
    expect(contract.evaluate(model).evaluatedAt).toBe(FIXED_NOW);
  });

  it("factory createEvaluationEngineContract returns working instance", () => {
    const c = createEvaluationEngineContract({ now: fixedNow });
    const model = makeModel({ confidenceLevel: 0.8, healthTrajectory: "STABLE", currentHealthSignal: "HEALTHY", dominantPattern: "ACCEPT" });
    const result = c.evaluate(model);
    expect(result.verdict).toBe("PASS");
    expect(result.evaluatedAt).toBe(FIXED_NOW);
  });
});

// ─── EvaluationThresholdContract ─────────────────────────────────────────────

describe("EvaluationThresholdContract.assess", () => {
  const contract = new EvaluationThresholdContract({ now: fixedNow });

  it("empty input → INSUFFICIENT_DATA, all counts zero", () => {
    const result = contract.assess([]);
    expect(result.totalVerdicts).toBe(0);
    expect(result.overallStatus).toBe("INSUFFICIENT_DATA");
    expect(result.passCount).toBe(0);
    expect(result.warnCount).toBe(0);
    expect(result.failCount).toBe(0);
    expect(result.inconclusiveCount).toBe(0);
  });

  it("all INCONCLUSIVE → INSUFFICIENT_DATA", () => {
    const results = [makeResult("INCONCLUSIVE"), makeResult("INCONCLUSIVE")];
    expect(contract.assess(results).overallStatus).toBe("INSUFFICIENT_DATA");
  });

  it("any FAIL → FAILING", () => {
    const results = [makeResult("PASS"), makeResult("PASS"), makeResult("FAIL")];
    expect(contract.assess(results).overallStatus).toBe("FAILING");
  });

  it("FAIL dominates over WARN when both present", () => {
    const results = [makeResult("WARN"), makeResult("WARN"), makeResult("FAIL")];
    expect(contract.assess(results).overallStatus).toBe("FAILING");
  });

  it("any WARN (no FAIL) → WARNING", () => {
    const results = [makeResult("PASS"), makeResult("WARN")];
    expect(contract.assess(results).overallStatus).toBe("WARNING");
  });

  it("all PASS → PASSING", () => {
    const results = [makeResult("PASS"), makeResult("PASS"), makeResult("PASS")];
    expect(contract.assess(results).overallStatus).toBe("PASSING");
  });

  it("counts each verdict correctly", () => {
    const results = [
      makeResult("PASS"),
      makeResult("WARN"),
      makeResult("WARN"),
      makeResult("FAIL"),
      makeResult("INCONCLUSIVE"),
    ];
    const assessment = contract.assess(results);
    expect(assessment.totalVerdicts).toBe(5);
    expect(assessment.passCount).toBe(1);
    expect(assessment.warnCount).toBe(2);
    expect(assessment.failCount).toBe(1);
    expect(assessment.inconclusiveCount).toBe(1);
  });

  it("summary for empty indicates no results", () => {
    expect(contract.assess([]).summary).toContain("no evaluation results");
  });

  it("summary for FAILING contains failCount and FAILING keyword", () => {
    const results = [makeResult("FAIL"), makeResult("PASS")];
    const summary = contract.assess(results).summary;
    expect(summary).toContain("FAILING");
    expect(summary).toContain("1");
  });

  it("summary for WARNING contains warnCount and WARNING keyword", () => {
    const results = [makeResult("WARN")];
    const summary = contract.assess(results).summary;
    expect(summary).toContain("WARNING");
  });

  it("summary for PASSING contains passCount and PASSING keyword", () => {
    const results = [makeResult("PASS"), makeResult("PASS")];
    const summary = contract.assess(results).summary;
    expect(summary).toContain("PASSING");
    expect(summary).toContain("2");
  });

  it("assessmentHash and assessmentId are deterministic for same inputs and timestamp", () => {
    const results = [makeResult("PASS"), makeResult("WARN")];
    const r1 = contract.assess(results);
    const r2 = contract.assess(results);
    expect(r1.assessmentHash).toBe(r2.assessmentHash);
    expect(r1.assessmentId).toBe(r2.assessmentId);
  });

  it("assessedAt is set to injected now()", () => {
    expect(contract.assess([]).assessedAt).toBe(FIXED_NOW);
  });

  it("factory createEvaluationThresholdContract returns working instance", () => {
    const c = createEvaluationThresholdContract({ now: fixedNow });
    const result = c.assess([]);
    expect(result.overallStatus).toBe("INSUFFICIENT_DATA");
    expect(result.assessedAt).toBe(FIXED_NOW);
  });
});
