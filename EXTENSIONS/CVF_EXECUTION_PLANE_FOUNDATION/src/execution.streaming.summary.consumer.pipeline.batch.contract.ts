import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type {
  StreamingExecutionSummaryConsumerPipelineResult,
} from "./execution.streaming.summary.consumer.pipeline.contract";
import type { StreamingChunkStatus } from "./execution.streaming.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StreamingExecutionSummaryConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  totalResults: number;
  failedResultCount: number;
  skippedResultCount: number;
  dominantTokenBudget: number;
  batchHash: string;
  results: StreamingExecutionSummaryConsumerPipelineResult[];
}

export interface StreamingExecutionSummaryConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * StreamingExecutionSummaryConsumerPipelineBatchContract (W2-T19 CP2)
 * -------------------------------------------------------------------
 * Fast Lane (GC-021) — aggregates StreamingExecutionSummaryConsumerPipelineResult[]
 * into a governed batch record.
 *
 * - failedResultCount  = results where dominantChunkStatus === "FAILED"
 * - skippedResultCount = results where dominantChunkStatus === "SKIPPED"
 * - dominantTokenBudget = Math.max(estimatedTokens); 0 for empty batch
 * - batchId ≠ batchHash (batchId derived from batchHash only)
 */
export class StreamingExecutionSummaryConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: StreamingExecutionSummaryConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: StreamingExecutionSummaryConsumerPipelineResult[],
  ): StreamingExecutionSummaryConsumerPipelineBatch {
    const createdAt = this.now();

    const failedResultCount = results.filter(
      (r) => r.streamingSummary.dominantChunkStatus === ("FAILED" as StreamingChunkStatus),
    ).length;

    const skippedResultCount = results.filter(
      (r) => r.streamingSummary.dominantChunkStatus === ("SKIPPED" as StreamingChunkStatus),
    ).length;

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map((r) => r.consumerPackage.typedContextPackage.estimatedTokens),
          );

    const pipelineHashes = results.map((r) => r.pipelineHash);

    const batchHash = computeDeterministicHash(
      "w2-t19-cp2-streaming-summary-consumer-pipeline-batch",
      createdAt,
      ...pipelineHashes,
    );

    const batchId = computeDeterministicHash(
      "w2-t19-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      totalResults: results.length,
      failedResultCount,
      skippedResultCount,
      dominantTokenBudget,
      batchHash,
      results,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createStreamingExecutionSummaryConsumerPipelineBatchContract(
  dependencies?: StreamingExecutionSummaryConsumerPipelineBatchContractDependencies,
): StreamingExecutionSummaryConsumerPipelineBatchContract {
  return new StreamingExecutionSummaryConsumerPipelineBatchContract(dependencies);
}
