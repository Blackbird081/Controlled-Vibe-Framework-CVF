import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type {
  GovernanceSignalLogConsumerPipelineResult,
} from "./governance.signal.log.consumer.pipeline.contract";
import type { GovernanceUrgency, GovernanceSignalType } from "./governance.signal.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GovernanceSignalLogConsumerPipelineBatchResult {
  batchId: string;
  createdAt: string;
  totalLogs: number;
  totalSignals: number;
  overallDominantUrgency: GovernanceUrgency;
  overallDominantType: GovernanceSignalType;
  dominantTokenBudget: number;
  results: GovernanceSignalLogConsumerPipelineResult[];
  batchHash: string;
}

export interface GovernanceSignalLogConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Dominant Urgency Logic ───────────────────────────────────────────────────

// Severity-first: CRITICAL > HIGH > NORMAL > LOW
const URGENCY_PRIORITY: Record<GovernanceUrgency, number> = {
  CRITICAL: 4,
  HIGH: 3,
  NORMAL: 2,
  LOW: 1,
};

function computeOverallDominantUrgency(
  results: GovernanceSignalLogConsumerPipelineResult[],
): GovernanceUrgency {
  if (results.length === 0) return "LOW";
  return results.reduce((dominant, r) =>
    URGENCY_PRIORITY[r.dominantUrgency] > URGENCY_PRIORITY[dominant]
      ? r.dominantUrgency
      : dominant,
    results[0].dominantUrgency,
  );
}

// ─── Dominant Type Logic ──────────────────────────────────────────────────────

// Frequency-based: most common type across all logs
const TYPE_PRIORITY: Record<GovernanceSignalType, number> = {
  ESCALATE: 4,
  TRIGGER_REVIEW: 3,
  MONITOR: 2,
  NO_ACTION: 1,
};

function computeOverallDominantType(
  results: GovernanceSignalLogConsumerPipelineResult[],
): GovernanceSignalType {
  if (results.length === 0) return "NO_ACTION";
  
  // Count occurrences of each type
  const typeCounts: Record<GovernanceSignalType, number> = {
    ESCALATE: 0,
    TRIGGER_REVIEW: 0,
    MONITOR: 0,
    NO_ACTION: 0,
  };
  
  for (const result of results) {
    typeCounts[result.log.dominantSignalType]++;
  }
  
  // Find most frequent type; if tie, use priority
  let maxCount = 0;
  let dominantType: GovernanceSignalType = "NO_ACTION";
  
  for (const [type, count] of Object.entries(typeCounts)) {
    const signalType = type as GovernanceSignalType;
    if (count > maxCount || (count === maxCount && TYPE_PRIORITY[signalType] > TYPE_PRIORITY[dominantType])) {
      maxCount = count;
      dominantType = signalType;
    }
  }
  
  return dominantType;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * GovernanceSignalLogConsumerPipelineBatchContract (W4-T22 CP2 — Fast Lane GC-021)
 * ---------------------------------------------------------------------------------
 * Aggregates multiple GovernanceSignalLogConsumerPipelineResult records into a batch.
 *
 * Aggregation:
 *   totalLogs = count of results
 *   totalSignals = sum(result.log.totalSignals)
 *   overallDominantUrgency = most severe urgency (CRITICAL > HIGH > NORMAL > LOW)
 *   overallDominantType = most frequent type across all logs
 *   dominantTokenBudget = max(result.consumerPackage.typedContextPackage.estimatedTokens)
 */
export class GovernanceSignalLogConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: GovernanceSignalLogConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: GovernanceSignalLogConsumerPipelineResult[],
  ): GovernanceSignalLogConsumerPipelineBatchResult {
    const createdAt = this.now();
    const totalLogs = results.length;

    const totalSignals = results.reduce(
      (sum, r) => sum + r.log.totalSignals,
      0,
    );

    const overallDominantUrgency = computeOverallDominantUrgency(results);
    const overallDominantType = computeOverallDominantType(results);

    const dominantTokenBudget =
      totalLogs === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const batchHash = computeDeterministicHash(
      "w4-t22-cp2-governance-signal-log-consumer-pipeline-batch",
      `totalLogs=${totalLogs}:totalSignals=${totalSignals}`,
      `overallUrgency=${overallDominantUrgency}:overallType=${overallDominantType}`,
      `dominantTokenBudget=${dominantTokenBudget}`,
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w4-t22-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      totalLogs,
      totalSignals,
      overallDominantUrgency,
      overallDominantType,
      dominantTokenBudget,
      results,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createGovernanceSignalLogConsumerPipelineBatchContract(
  dependencies?: GovernanceSignalLogConsumerPipelineBatchContractDependencies,
): GovernanceSignalLogConsumerPipelineBatchContract {
  return new GovernanceSignalLogConsumerPipelineBatchContract(dependencies);
}
