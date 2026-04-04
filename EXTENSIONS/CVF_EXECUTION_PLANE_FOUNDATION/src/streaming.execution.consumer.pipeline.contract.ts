import type { StreamingExecutionChunk } from "./execution.streaming.contract";
import {
  ControlPlaneConsumerPipelineContract,
  createControlPlaneConsumerPipelineContract,
} from "../../CVF_CONTROL_PLANE_FOUNDATION/src/consumer.pipeline.contract";
import type {
  ControlPlaneConsumerPackage,
  ControlPlaneConsumerPipelineContractDependencies,
} from "../../CVF_CONTROL_PLANE_FOUNDATION/src/consumer.pipeline.contract";
import type { RankableKnowledgeItem, ScoringWeights } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.ranking.contract";
import type { SegmentTypeConstraints } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/context.packager.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface StreamingExecutionConsumerPipelineRequest {
  streamingChunks: StreamingExecutionChunk[];
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface StreamingExecutionConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  streamingChunks: StreamingExecutionChunk[];
  consumerPackage: ControlPlaneConsumerPackage;
  query: string;
  contextId: string;
  warnings: string[];
  consumerId: string | undefined;
  pipelineHash: string;
}

export interface StreamingExecutionConsumerPipelineContractDependencies {
  now?: () => string;
}

// --- Contract ---

export class StreamingExecutionConsumerPipelineContract {
  private readonly consumerPipelineContract: ControlPlaneConsumerPipelineContract;
  private readonly now: () => string;

  constructor(
    dependencies: StreamingExecutionConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    const consumerDeps: ControlPlaneConsumerPipelineContractDependencies = {
      now: this.now,
    };
    this.consumerPipelineContract = createControlPlaneConsumerPipelineContract(consumerDeps);
  }

  execute(
    request: StreamingExecutionConsumerPipelineRequest,
  ): StreamingExecutionConsumerPipelineResult {
    const createdAt = this.now();
    const { streamingChunks } = request;

    // Derive query from chunk statistics
    const chunkCount = streamingChunks.length;
    const streamedCount = streamingChunks.filter(c => c.chunkStatus === "STREAMED").length;
    const skippedCount = streamingChunks.filter(c => c.chunkStatus === "SKIPPED").length;
    const failedCount = streamingChunks.filter(c => c.chunkStatus === "FAILED").length;
    const query = `StreamingExecution: chunks=${chunkCount}, streamed=${streamedCount}, failed=${failedCount}`;

    // Extract contextId
    const contextId = streamingChunks[0]?.sourceRuntimeId ?? "no-runtime";

    // Build warnings
    const warnings: string[] = [];
    if (failedCount > 0) {
      warnings.push("WARNING_FAILED_CHUNKS");
    }
    if (skippedCount > 0) {
      warnings.push("WARNING_SKIPPED_CHUNKS");
    }
    if (chunkCount === 0) {
      warnings.push("WARNING_NO_CHUNKS");
    }

    // Build consumer package
    const consumerPackage = this.consumerPipelineContract.execute({
      rankingRequest: {
        query,
        contextId,
        candidateItems: request.candidateItems ?? [],
        scoringWeights: request.scoringWeights,
      },
      segmentTypeConstraints: request.segmentTypeConstraints,
    });

    // Preserve per-chunk identity to avoid collisions across distinct chunk sets
    // that happen to share the same runtime and aggregate counts.
    const chunkIdentityHashes = streamingChunks.map((chunk) => chunk.chunkHash);

    // Compute pipeline hash
    const pipelineHash = computeDeterministicHash(
      "w2-t29-cp1-streaming-execution-consumer-pipeline",
      contextId,
      consumerPackage.pipelineHash,
      `chunks=${chunkCount}`,
      `streamed=${streamedCount}`,
      `skipped=${skippedCount}`,
      `failed=${failedCount}`,
      `warnings=${warnings.length}`,
      ...chunkIdentityHashes,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w2-t29-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      streamingChunks,
      consumerPackage,
      query,
      contextId,
      warnings,
      consumerId: request.consumerId,
      pipelineHash,
    };
  }
}

export function createStreamingExecutionConsumerPipelineContract(
  dependencies?: StreamingExecutionConsumerPipelineContractDependencies,
): StreamingExecutionConsumerPipelineContract {
  return new StreamingExecutionConsumerPipelineContract(dependencies);
}
