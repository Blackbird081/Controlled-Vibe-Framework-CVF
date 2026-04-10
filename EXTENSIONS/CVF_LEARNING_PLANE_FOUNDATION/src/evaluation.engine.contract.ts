import type { TruthModel } from "./truth.model.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type EvaluationVerdict = "PASS" | "WARN" | "FAIL" | "INCONCLUSIVE";

export type EvaluationSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE";

export interface EvaluationResult {
  resultId: string;
  evaluatedAt: string;
  sourceTruthModelId: string;
  sourceTruthModelVersion: number;
  verdict: EvaluationVerdict;
  severity: EvaluationSeverity;
  confidenceLevel: number;
  rationale: string;
  evaluationHash: string;
}

export interface EvaluationEngineContractDependencies {
  evaluateModel?: (model: TruthModel) => EvaluationVerdict;
  now?: () => string;
}

// --- Verdict Derivation ---

function defaultEvaluateModel(model: TruthModel): EvaluationVerdict {
  // 1. INCONCLUSIVE — insufficient data
  if (model.confidenceLevel < 0.3 || model.healthTrajectory === "UNKNOWN") {
    return "INCONCLUSIVE";
  }
  // 2. FAIL — critical signals
  if (
    model.currentHealthSignal === "CRITICAL" ||
    model.dominantPattern === "REJECT"
  ) {
    return "FAIL";
  }
  // 3. WARN — degraded signals
  if (
    model.currentHealthSignal === "DEGRADED" ||
    model.dominantPattern === "ESCALATE" ||
    model.healthTrajectory === "DEGRADING"
  ) {
    return "WARN";
  }
  // 4. PASS
  return "PASS";
}

// --- Severity Derivation ---

function deriveSeverity(
  verdict: EvaluationVerdict,
  model: TruthModel,
): EvaluationSeverity {
  if (verdict === "INCONCLUSIVE") return "LOW";
  if (verdict === "FAIL") {
    return model.currentHealthSignal === "CRITICAL" ? "CRITICAL" : "HIGH";
  }
  if (verdict === "WARN") {
    return model.healthTrajectory === "DEGRADING" ? "HIGH" : "MEDIUM";
  }
  // PASS
  return model.confidenceLevel < 0.5 ? "LOW" : "NONE";
}

// --- Rationale Building ---

function buildRationale(verdict: EvaluationVerdict, model: TruthModel): string {
  switch (verdict) {
    case "INCONCLUSIVE":
      if (model.healthTrajectory === "UNKNOWN") {
        return (
          `Inconclusive — health trajectory unknown (fewer than 2 insights processed). ` +
          `Cannot reliably evaluate learning-plane state.`
        );
      }
      return (
        `Inconclusive — insufficient data (confidence: ${(model.confidenceLevel * 100).toFixed(0)}%, ` +
        `${model.totalInsightsProcessed} insight(s) processed). ` +
        `Minimum 3 insights required for reliable evaluation.`
      );
    case "FAIL":
      if (model.currentHealthSignal === "CRITICAL") {
        return (
          `Evaluation FAILED — current health signal is CRITICAL. ` +
          `Immediate governance intervention required.`
        );
      }
      return (
        `Evaluation FAILED — dominant pattern is REJECT. ` +
        `Execution is consistently failing at a fundamental level. Full replanning required.`
      );
    case "WARN":
      if (model.currentHealthSignal === "DEGRADED") {
        return (
          `Evaluation WARNING — current health signal is DEGRADED. ` +
          `Monitor for further deterioration and consider governance review.`
        );
      }
      if (model.dominantPattern === "ESCALATE") {
        return (
          `Evaluation WARNING — dominant pattern is ESCALATE. ` +
          `Execution consistently requires escalation. Review dispatch and policy configurations.`
        );
      }
      return (
        `Evaluation WARNING — health trajectory is DEGRADING ` +
        `(from ${model.patternHistory[0]?.healthSignal ?? "unknown"} toward worse). ` +
        `System is trending toward worse health. Early intervention recommended.`
      );
    case "PASS":
      return (
        `Evaluation PASSED — health: ${model.currentHealthSignal}, ` +
        `trajectory: ${model.healthTrajectory}, ` +
        `dominant pattern: ${model.dominantPattern}, ` +
        `confidence: ${(model.confidenceLevel * 100).toFixed(0)}%.`
      );
  }
}

// --- Contract ---

export class EvaluationEngineContract {
  private readonly evaluateModel: (model: TruthModel) => EvaluationVerdict;
  private readonly now: () => string;

  constructor(dependencies: EvaluationEngineContractDependencies = {}) {
    this.evaluateModel =
      dependencies.evaluateModel ?? defaultEvaluateModel;
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  evaluate(model: TruthModel): EvaluationResult {
    const evaluatedAt = this.now();
    const verdict = this.evaluateModel(model);
    const severity = deriveSeverity(verdict, model);
    const rationale = buildRationale(verdict, model);

    const evaluationHash = computeDeterministicHash(
      "w4-t3-cp1-evaluation-engine",
      `${evaluatedAt}:${model.modelId}:v${model.version}`,
      `verdict:${verdict}:severity:${severity}`,
      `confidence:${model.confidenceLevel.toFixed(2)}:health:${model.currentHealthSignal}`,
    );

    const resultId = computeDeterministicHash(
      "w4-t3-cp1-result-id",
      evaluationHash,
      evaluatedAt,
    );

    return {
      resultId,
      evaluatedAt,
      sourceTruthModelId: model.modelId,
      sourceTruthModelVersion: model.version,
      verdict,
      severity,
      confidenceLevel: model.confidenceLevel,
      rationale,
      evaluationHash,
    };
  }
}

export function createEvaluationEngineContract(
  dependencies?: EvaluationEngineContractDependencies,
): EvaluationEngineContract {
  return new EvaluationEngineContract(dependencies);
}
