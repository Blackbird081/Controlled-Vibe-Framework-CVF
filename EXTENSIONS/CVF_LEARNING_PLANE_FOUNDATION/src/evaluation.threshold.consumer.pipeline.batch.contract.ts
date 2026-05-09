import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { EvaluationThresholdConsumerPipelineResult } from "./evaluation.threshold.consumer.pipeline.contract";
import type { OverallStatus } from "./evaluation.threshold.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EvaluationThresholdConsumerPipelineBatchResult {
  batchId: string;
  createdAt: string;
  totalResults: number;
  dominantTokenBudget: number;
  totalAssessments: number;
  dominantStatus: OverallStatus;
  totalVerdicts: number;
  verdictTotals: {
    passCount: number;
    warnCount: number;
    failCount: number;
    inconclusiveCount: number;
  };
  statusDistribution: {
    passing: number;
    warning: number;
    failing: number;
    insufficientData: number;
  };
  batchHash: string;
}

export interface EvaluationThresholdConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Dominant Status Logic ────────────────────────────────────────────────────
// Severity-first: FAILING > WARNING > INSUFFICIENT_DATA > PASSING

const STATUS_PRIORITY: OverallStatus[] = [
  "FAILING",
  "WARNING",
  "INSUFFICIENT_DATA",
  "PASSING",
];

function computeDominantStatus(results: EvaluationThresholdConsumerPipelineResult[]): OverallStatus {
  if (results.length === 0) return "INSUFFICIENT_DATA";
  const statusSet = new Set(results.map((r) => r.assessment.overallStatus));
  for (const status of STATUS_PRIORITY) {
    if (statusSet.has(status)) return status;
  }
  return "INSUFFICIENT_DATA";
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * EvaluationThresholdConsumerPipelineBatchContract (W4-T20 CP2 — Fast Lane GC-021)
 * ----------------------------------------------------------------------------------
 * Aggregates multiple EvaluationThresholdConsumerPipelineResult instances.
 */
export class EvaluationThresholdConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: EvaluationThresholdConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  execute(
    results: EvaluationThresholdConsumerPipelineResult[],
  ): EvaluationThresholdConsumerPipelineBatchResult {
    const createdAt = this.now();
    const totalResults = results.length;

    const dominantTokenBudget =
      totalResults === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const totalAssessments = totalResults;

    const dominantStatus = computeDominantStatus(results);

    const totalVerdicts = results.reduce(
      (sum, r) => sum + r.assessment.totalVerdicts,
      0,
    );

    const verdictTotals = {
      passCount: results.reduce((sum, r) => sum + r.assessment.passCount, 0),
      warnCount: results.reduce((sum, r) => sum + r.assessment.warnCount, 0),
      failCount: results.reduce((sum, r) => sum + r.assessment.failCount, 0),
      inconclusiveCount: results.reduce((sum, r) => sum + r.assessment.inconclusiveCount, 0),
    };

    const statusDistribution = {
      passing: results.filter((r) => r.assessment.overallStatus === "PASSING").length,
      warning: results.filter((r) => r.assessment.overallStatus === "WARNING").length,
      failing: results.filter((r) => r.assessment.overallStatus === "FAILING").length,
      insufficientData: results.filter((r) => r.assessment.overallStatus === "INSUFFICIENT_DATA").length,
    };

    const batchHash = computeDeterministicHash(
      "w4-t20-cp2-evaluation-threshold-consumer-pipeline-batch",
      `total:${totalResults}:dominant:${dominantTokenBudget}`,
      `assessments:${totalAssessments}:status:${dominantStatus}:verdicts:${totalVerdicts}`,
      `pass:${verdictTotals.passCount}:warn:${verdictTotals.warnCount}:fail:${verdictTotals.failCount}:inconclusive:${verdictTotals.inconclusiveCount}`,
      results.map((r) => r.pipelineHash).join(":"),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w4-t20-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      totalResults,
      dominantTokenBudget,
      totalAssessments,
      dominantStatus,
      totalVerdicts,
      verdictTotals,
      statusDistribution,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createEvaluationThresholdConsumerPipelineBatchContract(
  dependencies?: EvaluationThresholdConsumerPipelineBatchContractDependencies,
): EvaluationThresholdConsumerPipelineBatchContract {
  return new EvaluationThresholdConsumerPipelineBatchContract(dependencies);
}
