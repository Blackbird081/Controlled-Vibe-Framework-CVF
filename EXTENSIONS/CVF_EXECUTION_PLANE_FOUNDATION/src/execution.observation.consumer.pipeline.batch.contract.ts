import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type {
  ExecutionObservationConsumerPipelineResult,
} from "./execution.observation.consumer.pipeline.contract";
import type { OutcomeClass } from "./execution.observer.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExecutionObservationConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  totalResults: number;
  failedResultCount: number;
  gatedResultCount: number;
  dominantTokenBudget: number;
  batchHash: string;
  results: ExecutionObservationConsumerPipelineResult[];
}

export interface ExecutionObservationConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * ExecutionObservationConsumerPipelineBatchContract (W2-T20 CP2)
 * --------------------------------------------------------------
 * Fast Lane (GC-021) — aggregates ExecutionObservationConsumerPipelineResult[]
 * into a governed batch record.
 *
 * - failedResultCount  = results where outcomeClass === "FAILED"
 * - gatedResultCount   = results where outcomeClass === "GATED"
 * - dominantTokenBudget = Math.max(typedContextPackage.estimatedTokens); 0 for empty
 * - batchId ≠ batchHash (batchId derived from batchHash only)
 */
export class ExecutionObservationConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: ExecutionObservationConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: ExecutionObservationConsumerPipelineResult[],
  ): ExecutionObservationConsumerPipelineBatch {
    const createdAt = this.now();

    const failedResultCount = results.filter(
      (r) => r.observation.outcomeClass === ("FAILED" as OutcomeClass),
    ).length;

    const gatedResultCount = results.filter(
      (r) => r.observation.outcomeClass === ("GATED" as OutcomeClass),
    ).length;

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map((r) => r.consumerPackage.typedContextPackage.estimatedTokens),
          );

    const pipelineHashes = results.map((r) => r.pipelineHash);

    const batchHash = computeDeterministicHash(
      "w2-t20-cp2-execution-observation-consumer-pipeline-batch",
      createdAt,
      ...pipelineHashes,
    );

    const batchId = computeDeterministicHash(
      "w2-t20-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      totalResults: results.length,
      failedResultCount,
      gatedResultCount,
      dominantTokenBudget,
      batchHash,
      results,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createExecutionObservationConsumerPipelineBatchContract(
  dependencies?: ExecutionObservationConsumerPipelineBatchContractDependencies,
): ExecutionObservationConsumerPipelineBatchContract {
  return new ExecutionObservationConsumerPipelineBatchContract(dependencies);
}
