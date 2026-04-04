import type { StreamingExecutionConsumerPipelineResult } from "./streaming.execution.consumer.pipeline.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface StreamingExecutionConsumerPipelineBatchResult {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalChunks: number;
  totalStreamed: number;
  totalSkipped: number;
  totalFailed: number;
  dominantTokenBudget: number;
  results: StreamingExecutionConsumerPipelineResult[];
}

export interface StreamingExecutionConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// --- Contract ---

export class StreamingExecutionConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: StreamingExecutionConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: StreamingExecutionConsumerPipelineResult[],
  ): StreamingExecutionConsumerPipelineBatchResult {
    const createdAt = this.now();

    const totalChunks = results.reduce(
      (sum, r) => sum + r.streamingChunks.length,
      0,
    );
    const totalStreamed = results.reduce(
      (sum, r) => sum + r.streamingChunks.filter(c => c.chunkStatus === "STREAMED").length,
      0,
    );
    const totalSkipped = results.reduce(
      (sum, r) => sum + r.streamingChunks.filter(c => c.chunkStatus === "SKIPPED").length,
      0,
    );
    const totalFailed = results.reduce(
      (sum, r) => sum + r.streamingChunks.filter(c => c.chunkStatus === "FAILED").length,
      0,
    );

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const batchHash = computeDeterministicHash(
      "w2-t29-cp2-streaming-execution-consumer-batch",
      `totalChunks=${totalChunks}`,
      `totalStreamed=${totalStreamed}`,
      `totalSkipped=${totalSkipped}`,
      `totalFailed=${totalFailed}`,
      `dominantTokenBudget=${dominantTokenBudget}`,
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w2-t29-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalChunks,
      totalStreamed,
      totalSkipped,
      totalFailed,
      dominantTokenBudget,
      results,
    };
  }
}

export function createStreamingExecutionConsumerPipelineBatchContract(
  dependencies?: StreamingExecutionConsumerPipelineBatchContractDependencies,
): StreamingExecutionConsumerPipelineBatchContract {
  return new StreamingExecutionConsumerPipelineBatchContract(dependencies);
}
