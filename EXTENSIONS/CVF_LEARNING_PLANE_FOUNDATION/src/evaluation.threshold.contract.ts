import type { EvaluationResult } from "./evaluation.engine.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type OverallStatus =
  | "PASSING"
  | "WARNING"
  | "FAILING"
  | "INSUFFICIENT_DATA";

export interface ThresholdAssessment {
  assessmentId: string;
  assessedAt: string;
  totalVerdicts: number;
  passCount: number;
  warnCount: number;
  failCount: number;
  inconclusiveCount: number;
  overallStatus: OverallStatus;
  summary: string;
  assessmentHash: string;
}

export interface EvaluationThresholdContractDependencies {
  now?: () => string;
}

// --- OverallStatus Derivation ---

function deriveOverallStatus(
  passCount: number,
  warnCount: number,
  failCount: number,
  inconclusiveCount: number,
  total: number,
): OverallStatus {
  if (total === 0 || total === inconclusiveCount) return "INSUFFICIENT_DATA";
  if (failCount > 0) return "FAILING";
  if (warnCount > 0) return "WARNING";
  return "PASSING";
}

// --- Summary Building ---

function buildSummary(
  status: OverallStatus,
  passCount: number,
  warnCount: number,
  failCount: number,
  inconclusiveCount: number,
  total: number,
): string {
  const breakdown = `pass=${passCount}, warn=${warnCount}, fail=${failCount}, inconclusive=${inconclusiveCount}, total=${total}`;
  switch (status) {
    case "INSUFFICIENT_DATA":
      return (
        `Threshold assessment: INSUFFICIENT_DATA — ` +
        (total === 0
          ? `no evaluation results provided.`
          : `all ${total} result(s) are inconclusive. (${breakdown})`)
      );
    case "FAILING":
      return (
        `Threshold assessment: FAILING — ${failCount} of ${total} result(s) failed. ` +
        `Governance intervention required. (${breakdown})`
      );
    case "WARNING":
      return (
        `Threshold assessment: WARNING — ${warnCount} of ${total} result(s) flagged. ` +
        `Review recommended before proceeding. (${breakdown})`
      );
    case "PASSING":
      return (
        `Threshold assessment: PASSING — all ${passCount} result(s) passed. ` +
        `(${breakdown})`
      );
  }
}

// --- Contract ---

export class EvaluationThresholdContract {
  private readonly now: () => string;

  constructor(dependencies: EvaluationThresholdContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  assess(results: EvaluationResult[]): ThresholdAssessment {
    const assessedAt = this.now();

    const passCount = results.filter((r) => r.verdict === "PASS").length;
    const warnCount = results.filter((r) => r.verdict === "WARN").length;
    const failCount = results.filter((r) => r.verdict === "FAIL").length;
    const inconclusiveCount = results.filter(
      (r) => r.verdict === "INCONCLUSIVE",
    ).length;
    const totalVerdicts = results.length;

    const overallStatus = deriveOverallStatus(
      passCount,
      warnCount,
      failCount,
      inconclusiveCount,
      totalVerdicts,
    );

    const summary = buildSummary(
      overallStatus,
      passCount,
      warnCount,
      failCount,
      inconclusiveCount,
      totalVerdicts,
    );

    const assessmentHash = computeDeterministicHash(
      "w4-t3-cp2-evaluation-threshold",
      `${assessedAt}:total=${totalVerdicts}`,
      `pass=${passCount}:warn=${warnCount}:fail=${failCount}:inconclusive=${inconclusiveCount}`,
      `status:${overallStatus}`,
    );

    const assessmentId = computeDeterministicHash(
      "w4-t3-cp2-assessment-id",
      assessmentHash,
      assessedAt,
    );

    return {
      assessmentId,
      assessedAt,
      totalVerdicts,
      passCount,
      warnCount,
      failCount,
      inconclusiveCount,
      overallStatus,
      summary,
      assessmentHash,
    };
  }
}

export function createEvaluationThresholdContract(
  dependencies?: EvaluationThresholdContractDependencies,
): EvaluationThresholdContract {
  return new EvaluationThresholdContract(dependencies);
}
