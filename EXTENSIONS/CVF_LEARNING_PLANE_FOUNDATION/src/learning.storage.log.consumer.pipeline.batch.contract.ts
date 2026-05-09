import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type {
  LearningStorageLogConsumerPipelineResult,
} from "./learning.storage.log.consumer.pipeline.contract";
import type { LearningRecordType } from "./learning.storage.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LearningStorageLogConsumerPipelineBatchResult {
  batchId: string;
  createdAt: string;
  totalLogs: number;
  totalRecords: number;
  overallDominantRecordType: LearningRecordType | null;
  dominantTokenBudget: number;
  results: LearningStorageLogConsumerPipelineResult[];
  batchHash: string;
}

export interface LearningStorageLogConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Dominant Record Type Logic ───────────────────────────────────────────────

// Frequency-based: most common type across all logs
const RECORD_TYPE_ORDER: LearningRecordType[] = [
  "FEEDBACK_LEDGER",
  "TRUTH_MODEL",
  "EVALUATION_RESULT",
  "THRESHOLD_ASSESSMENT",
  "GOVERNANCE_SIGNAL",
  "REINJECTION_RESULT",
  "LOOP_SUMMARY",
];

function computeOverallDominantRecordType(
  results: LearningStorageLogConsumerPipelineResult[],
): LearningRecordType | null {
  if (results.length === 0) return null;

  const typeCounts: Record<string, number> = {};

  for (const result of results) {
    if (result.dominantRecordType !== null) {
      const type = result.dominantRecordType;
      typeCounts[type] = (typeCounts[type] ?? 0) + 1;
    }
  }

  if (Object.keys(typeCounts).length === 0) return null;

  let maxCount = 0;
  let dominantType: LearningRecordType | null = null;

  for (const rt of RECORD_TYPE_ORDER) {
    const count = typeCounts[rt] ?? 0;
    if (count > maxCount) {
      maxCount = count;
      dominantType = rt;
    }
  }

  return dominantType;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * LearningStorageLogConsumerPipelineBatchContract (W4-T24 CP2 — Fast Lane GC-021)
 * --------------------------------------------------------------------------------
 * Aggregates multiple LearningStorageLogConsumerPipelineResult records into a batch.
 *
 * Aggregation:
 *   totalLogs = count of results
 *   totalRecords = sum(result.log.totalRecords)
 *   overallDominantRecordType = most frequent type across all logs
 *   dominantTokenBudget = max(result.consumerPackage.typedContextPackage.estimatedTokens)
 */
export class LearningStorageLogConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: LearningStorageLogConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: LearningStorageLogConsumerPipelineResult[],
  ): LearningStorageLogConsumerPipelineBatchResult {
    const createdAt = this.now();
    const totalLogs = results.length;

    const totalRecords = results.reduce(
      (sum, r) => sum + r.log.totalRecords,
      0,
    );

    const overallDominantRecordType = computeOverallDominantRecordType(results);

    const dominantTokenBudget =
      totalLogs === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const batchHash = computeDeterministicHash(
      "w4-t24-cp2-learning-storage-log-consumer-pipeline-batch",
      `totalLogs=${totalLogs}:totalRecords=${totalRecords}`,
      `overallType=${overallDominantRecordType ?? "none"}`,
      `dominantTokenBudget=${dominantTokenBudget}`,
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w4-t24-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      totalLogs,
      totalRecords,
      overallDominantRecordType,
      dominantTokenBudget,
      results,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createLearningStorageLogConsumerPipelineBatchContract(
  dependencies?: LearningStorageLogConsumerPipelineBatchContractDependencies,
): LearningStorageLogConsumerPipelineBatchContract {
  return new LearningStorageLogConsumerPipelineBatchContract(dependencies);
}
