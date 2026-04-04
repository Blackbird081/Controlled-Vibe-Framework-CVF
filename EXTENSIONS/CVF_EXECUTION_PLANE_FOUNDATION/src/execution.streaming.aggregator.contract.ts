import type { StreamingExecutionChunk, StreamingChunkStatus } from "./execution.streaming.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface StreamingExecutionSummary {
  summaryId: string;
  createdAt: string;
  totalChunks: number;
  streamedCount: number;
  skippedCount: number;
  failedCount: number;
  dominantChunkStatus: StreamingChunkStatus;
  aggregatorHash: string;
}

export interface StreamingExecutionAggregatorContractDependencies {
  now?: () => string;
}

// --- Dominant status resolution (severity-first) ---

function resolveDominantStatus(
  failedCount: number,
  skippedCount: number,
  streamedCount: number,
): StreamingChunkStatus {
  if (failedCount > 0) return "FAILED";
  if (skippedCount > 0) return "SKIPPED";
  return "STREAMED";
}

// --- Contract ---

export class StreamingExecutionAggregatorContract {
  private readonly now: () => string;

  constructor(dependencies: StreamingExecutionAggregatorContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  aggregate(chunks: StreamingExecutionChunk[]): StreamingExecutionSummary {
    const createdAt = this.now();
    const streamedCount = chunks.filter((c) => c.chunkStatus === "STREAMED").length;
    const skippedCount = chunks.filter((c) => c.chunkStatus === "SKIPPED").length;
    const failedCount = chunks.filter((c) => c.chunkStatus === "FAILED").length;
    const dominantChunkStatus = resolveDominantStatus(failedCount, skippedCount, streamedCount);

    const aggregatorHash = computeDeterministicHash(
      "w6-t1-cp2-streaming-aggregator",
      `${createdAt}:total:${chunks.length}`,
      `streamed:${streamedCount}:skipped:${skippedCount}:failed:${failedCount}`,
      `dominant:${dominantChunkStatus}`,
    );

    const summaryId = computeDeterministicHash(
      "w6-t1-cp2-summary-id",
      aggregatorHash,
      createdAt,
    );

    return {
      summaryId,
      createdAt,
      totalChunks: chunks.length,
      streamedCount,
      skippedCount,
      failedCount,
      dominantChunkStatus,
      aggregatorHash,
    };
  }
}

export function createStreamingExecutionAggregatorContract(
  dependencies?: StreamingExecutionAggregatorContractDependencies,
): StreamingExecutionAggregatorContract {
  return new StreamingExecutionAggregatorContract(dependencies);
}
