import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { LearningStorageConsumerPipelineResult } from "./learning.storage.consumer.pipeline.contract";
import type { LearningRecordType } from "./learning.storage.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LearningStorageConsumerPipelineBatchResult {
  batchId: string;
  createdAt: string;
  totalResults: number;
  dominantTokenBudget: number;
  totalPayloadSize: number;
  recordTypeCounts: Record<LearningRecordType, number>;
  batchHash: string;
}

export interface LearningStorageConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * LearningStorageConsumerPipelineBatchContract (W4-T16 CP2 — Fast Lane GC-021)
 * -----------------------------------------------------------------------------
 * Aggregates multiple LearningStorageConsumerPipelineResult instances.
 *
 * Aggregation:
 *   dominantTokenBudget = max(result.consumerPackage.typedContextPackage.estimatedTokens)
 *   totalPayloadSize = sum(result.storageRecord.payloadSize)
 *   recordTypeCounts = count by recordType
 *
 * Empty batch: dominantTokenBudget = 0, totalPayloadSize = 0, valid hash
 */
export class LearningStorageConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: LearningStorageConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  execute(
    results: LearningStorageConsumerPipelineResult[],
  ): LearningStorageConsumerPipelineBatchResult {
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

    const totalPayloadSize = results.reduce(
      (sum, r) => sum + r.storageRecord.payloadSize,
      0,
    );

    const recordTypeCounts: Record<LearningRecordType, number> = {
      FEEDBACK_LEDGER: 0,
      TRUTH_MODEL: 0,
      EVALUATION_RESULT: 0,
      THRESHOLD_ASSESSMENT: 0,
      GOVERNANCE_SIGNAL: 0,
      REINJECTION_RESULT: 0,
      LOOP_SUMMARY: 0,
    };

    results.forEach((r) => {
      recordTypeCounts[r.storageRecord.recordType]++;
    });

    const batchHash = computeDeterministicHash(
      "w4-t16-cp2-learning-storage-consumer-pipeline-batch",
      `total:${totalResults}:dominant:${dominantTokenBudget}`,
      `payloadSize:${totalPayloadSize}`,
      Object.entries(recordTypeCounts)
        .map(([type, count]) => `${type}:${count}`)
        .join(":"),
      results.map((r) => r.pipelineHash).join(":"),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w4-t16-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      totalResults,
      dominantTokenBudget,
      totalPayloadSize,
      recordTypeCounts,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createLearningStorageConsumerPipelineBatchContract(
  dependencies?: LearningStorageConsumerPipelineBatchContractDependencies,
): LearningStorageConsumerPipelineBatchContract {
  return new LearningStorageConsumerPipelineBatchContract(dependencies);
}
