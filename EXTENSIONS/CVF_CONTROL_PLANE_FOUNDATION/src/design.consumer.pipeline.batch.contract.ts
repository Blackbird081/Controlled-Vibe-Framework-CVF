import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type {
  DesignConsumerPipelineResult,
} from "./design.consumer.pipeline.contract";
import type { DesignTaskPhase, DesignTaskRisk } from "./design.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DesignConsumerPipelineBatchResult {
  batchId: string;
  createdAt: string;
  totalPlans: number;
  totalTasks: number;
  overallDominantPhase: DesignTaskPhase;
  overallDominantRisk: DesignTaskRisk;
  dominantTokenBudget: number;
  results: DesignConsumerPipelineResult[];
  batchHash: string;
}

export interface DesignConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Dominant Phase Logic ─────────────────────────────────────────────────────

// Frequency-based: most common phase wins; ties broken by REVIEW > BUILD > DESIGN
const PHASE_ORDER: DesignTaskPhase[] = ["REVIEW", "BUILD", "DESIGN"];

function computeOverallDominantPhase(
  results: DesignConsumerPipelineResult[],
): DesignTaskPhase {
  if (results.length === 0) return "DESIGN";

  const phaseCounts: Record<string, number> = {};

  for (const result of results) {
    const phase = result.dominantPhase;
    phaseCounts[phase] = (phaseCounts[phase] ?? 0) + 1;
  }

  let maxCount = 0;
  let dominantPhase: DesignTaskPhase = "DESIGN";

  for (const phase of PHASE_ORDER) {
    const count = phaseCounts[phase] ?? 0;
    if (count > maxCount) {
      maxCount = count;
      dominantPhase = phase;
    }
  }

  return dominantPhase;
}

// ─── Dominant Risk Logic ──────────────────────────────────────────────────────

// Frequency-based: most common risk wins; ties broken by R3 > R2 > R1 > R0
const RISK_ORDER: DesignTaskRisk[] = ["R3", "R2", "R1", "R0"];

function computeOverallDominantRisk(
  results: DesignConsumerPipelineResult[],
): DesignTaskRisk {
  if (results.length === 0) return "R0";

  const riskCounts: Record<string, number> = {};

  for (const result of results) {
    const risk = result.dominantRisk;
    riskCounts[risk] = (riskCounts[risk] ?? 0) + 1;
  }

  let maxCount = 0;
  let dominantRisk: DesignTaskRisk = "R0";

  for (const risk of RISK_ORDER) {
    const count = riskCounts[risk] ?? 0;
    if (count > maxCount) {
      maxCount = count;
      dominantRisk = risk;
    }
  }

  return dominantRisk;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * DesignConsumerPipelineBatchContract (W2-T26 CP2 — Fast Lane GC-021)
 * --------------------------------------------------------------------
 * Aggregates multiple DesignConsumerPipelineResult records into a batch.
 *
 * Aggregation:
 *   totalPlans = count of results
 *   totalTasks = sum(result.designPlan.totalTasks)
 *   overallDominantPhase = most frequent phase across all plans
 *   overallDominantRisk = most frequent risk across all plans
 *   dominantTokenBudget = max(result.consumerPackage.typedContextPackage.estimatedTokens)
 */
export class DesignConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: DesignConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: DesignConsumerPipelineResult[],
  ): DesignConsumerPipelineBatchResult {
    const createdAt = this.now();
    const totalPlans = results.length;

    const totalTasks = results.reduce(
      (sum, r) => sum + r.designPlan.totalTasks,
      0,
    );

    const overallDominantPhase = computeOverallDominantPhase(results);
    const overallDominantRisk = computeOverallDominantRisk(results);

    const dominantTokenBudget =
      totalPlans === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const batchHash = computeDeterministicHash(
      "w2-t26-cp2-design-consumer-pipeline-batch",
      `totalPlans=${totalPlans}:totalTasks=${totalTasks}`,
      `overallPhase=${overallDominantPhase}:overallRisk=${overallDominantRisk}`,
      `dominantTokenBudget=${dominantTokenBudget}`,
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w2-t26-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      totalPlans,
      totalTasks,
      overallDominantPhase,
      overallDominantRisk,
      dominantTokenBudget,
      results,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createDesignConsumerPipelineBatchContract(
  dependencies?: DesignConsumerPipelineBatchContractDependencies,
): DesignConsumerPipelineBatchContract {
  return new DesignConsumerPipelineBatchContract(dependencies);
}
