import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  StreamingExecutionAggregatorContract,
  createStreamingExecutionAggregatorContract,
} from "./execution.streaming.aggregator.contract";
import type {
  StreamingExecutionSummary,
  StreamingExecutionAggregatorContractDependencies,
} from "./execution.streaming.aggregator.contract";
import type { StreamingChunkStatus } from "./execution.streaming.contract";
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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StreamingExecutionSummaryConsumerPipelineRequest {
  chunks: StreamingExecutionChunk[];
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface StreamingExecutionSummaryConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  streamingSummary: StreamingExecutionSummary;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
}

export interface StreamingExecutionSummaryConsumerPipelineContractDependencies {
  now?: () => string;
  aggregatorContractDeps?: StreamingExecutionAggregatorContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Warning Builder ──────────────────────────────────────────────────────────

function buildStreamingWarnings(dominantChunkStatus: StreamingChunkStatus): string[] {
  if (dominantChunkStatus === "FAILED") {
    return ["[streaming] failed execution chunks — review execution pipeline"];
  }
  if (dominantChunkStatus === "SKIPPED") {
    return ["[streaming] skipped execution chunks — review execution policy"];
  }
  return [];
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * StreamingExecutionSummaryConsumerPipelineContract (W2-T19 CP1)
 * ---------------------------------------------------------------
 * Cross-plane consumer bridge: EPF → CPF.
 *
 * Internal chain (single execute call):
 *   StreamingExecutionAggregatorContract.aggregate(chunks) → StreamingExecutionSummary
 *   query = `${dominantChunkStatus}:streaming:${totalChunks}:failed:${failedCount}`.slice(0, 120)
 *   contextId = summary.summaryId
 *   ControlPlaneConsumerPipelineContract.execute({rankingRequest: {query, contextId, ...}})
 *   → ControlPlaneConsumerPackage
 *   → StreamingExecutionSummaryConsumerPipelineResult
 *
 * Determinism: all sub-contracts share the same injected now().
 * Warnings: FAILED → review execution pipeline; SKIPPED → review execution policy.
 */
export class StreamingExecutionSummaryConsumerPipelineContract {
  private readonly now: () => string;
  private readonly aggregatorContract: StreamingExecutionAggregatorContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: StreamingExecutionSummaryConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.aggregatorContract = createStreamingExecutionAggregatorContract({
      ...dependencies.aggregatorContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: StreamingExecutionSummaryConsumerPipelineRequest,
  ): StreamingExecutionSummaryConsumerPipelineResult {
    const createdAt = this.now();

    // Step 1: aggregate chunks → StreamingExecutionSummary
    const streamingSummary: StreamingExecutionSummary =
      this.aggregatorContract.aggregate(request.chunks);

    // Step 2: derive query from dominantChunkStatus + counts
    const query =
      `${streamingSummary.dominantChunkStatus}:streaming:${streamingSummary.totalChunks}:failed:${streamingSummary.failedCount}`.slice(0, 120);

    const consumerPackage: ControlPlaneConsumerPackage =
      this.consumerPipeline.execute({
        rankingRequest: {
          query,
          contextId: streamingSummary.summaryId,
          candidateItems: request.candidateItems ?? [],
          scoringWeights: request.scoringWeights,
        },
        segmentTypeConstraints: request.segmentTypeConstraints,
      });

    // Step 3: build warnings based on dominantChunkStatus
    const warnings = buildStreamingWarnings(streamingSummary.dominantChunkStatus);

    // Step 4: deterministic hash + resultId
    const pipelineHash = computeDeterministicHash(
      "w2-t19-cp1-streaming-execution-summary-consumer-pipeline",
      streamingSummary.aggregatorHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w2-t19-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      consumerId: request.consumerId,
      streamingSummary,
      consumerPackage,
      pipelineHash,
      warnings,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createStreamingExecutionSummaryConsumerPipelineContract(
  dependencies?: StreamingExecutionSummaryConsumerPipelineContractDependencies,
): StreamingExecutionSummaryConsumerPipelineContract {
  return new StreamingExecutionSummaryConsumerPipelineContract(dependencies);
}
