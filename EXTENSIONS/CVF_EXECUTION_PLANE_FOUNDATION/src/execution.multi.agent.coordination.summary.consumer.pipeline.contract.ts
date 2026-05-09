import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  MultiAgentCoordinationSummaryContract,
  createMultiAgentCoordinationSummaryContract,
} from "./execution.multi.agent.coordination.summary.contract";
import type {
  MultiAgentCoordinationSummary,
  MultiAgentCoordinationSummaryContractDependencies,
} from "./execution.multi.agent.coordination.summary.contract";
import type {
  CoordinationStatus,
  MultiAgentCoordinationResult,
} from "./execution.multi.agent.coordination.contract";
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

export interface MultiAgentCoordinationSummaryConsumerPipelineRequest {
  coordinationResults: MultiAgentCoordinationResult[];
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface MultiAgentCoordinationSummaryConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  coordinationSummary: MultiAgentCoordinationSummary;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
}

export interface MultiAgentCoordinationSummaryConsumerPipelineContractDependencies {
  now?: () => string;
  coordinationSummaryContractDeps?: MultiAgentCoordinationSummaryContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Warning Builder ──────────────────────────────────────────────────────────

function buildCoordinationWarnings(dominantStatus: CoordinationStatus): string[] {
  if (dominantStatus === "FAILED") {
    return ["[coordination] failed agent coordination detected — review agent dependencies"];
  }
  if (dominantStatus === "PARTIAL") {
    return ["[coordination] partial agent coordination — some agents did not complete"];
  }
  return [];
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * MultiAgentCoordinationSummaryConsumerPipelineContract (W2-T18 CP1)
 * -------------------------------------------------------------------
 * Cross-plane consumer bridge: EPF → CPF.
 *
 * Internal chain (single execute call):
 *   MultiAgentCoordinationSummaryContract.summarize(coordinationResults) → MultiAgentCoordinationSummary
 *   query = `${dominantStatus}:coordinations:${totalCoordinations}:failed:${failedCount}`.slice(0, 120)
 *   contextId = summary.summaryId
 *   ControlPlaneConsumerPipelineContract.execute({rankingRequest: {query, contextId, ...}})
 *   → ControlPlaneConsumerPackage
 *   → MultiAgentCoordinationSummaryConsumerPipelineResult
 *
 * Determinism: all sub-contracts share the same injected now().
 * Warnings: FAILED → failed agent coordination; PARTIAL → partial coordination.
 */
export class MultiAgentCoordinationSummaryConsumerPipelineContract {
  private readonly now: () => string;
  private readonly coordinationSummaryContract: MultiAgentCoordinationSummaryContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: MultiAgentCoordinationSummaryConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.coordinationSummaryContract = createMultiAgentCoordinationSummaryContract({
      ...dependencies.coordinationSummaryContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: MultiAgentCoordinationSummaryConsumerPipelineRequest,
  ): MultiAgentCoordinationSummaryConsumerPipelineResult {
    const createdAt = this.now();

    // Step 1: summarize coordination results → MultiAgentCoordinationSummary
    const coordinationSummary: MultiAgentCoordinationSummary =
      this.coordinationSummaryContract.summarize(request.coordinationResults);

    // Step 2: derive query from dominantStatus + totalCoordinations + failedCount
    const query =
      `${coordinationSummary.dominantStatus}:coordinations:${coordinationSummary.totalCoordinations}:failed:${coordinationSummary.failedCount}`.slice(
        0,
        120,
      );

    const consumerPackage: ControlPlaneConsumerPackage =
      this.consumerPipeline.execute({
        rankingRequest: {
          query,
          contextId: coordinationSummary.summaryId,
          candidateItems: request.candidateItems ?? [],
          scoringWeights: request.scoringWeights,
        },
        segmentTypeConstraints: request.segmentTypeConstraints,
      });

    // Step 3: build warnings based on dominantStatus
    const warnings = buildCoordinationWarnings(coordinationSummary.dominantStatus);

    // Step 4: deterministic hash + resultId
    const pipelineHash = computeDeterministicHash(
      "w2-t18-cp1-multiagent-coordination-summary-consumer-pipeline",
      coordinationSummary.summaryHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w2-t18-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      consumerId: request.consumerId,
      coordinationSummary,
      consumerPackage,
      pipelineHash,
      warnings,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createMultiAgentCoordinationSummaryConsumerPipelineContract(
  dependencies?: MultiAgentCoordinationSummaryConsumerPipelineContractDependencies,
): MultiAgentCoordinationSummaryConsumerPipelineContract {
  return new MultiAgentCoordinationSummaryConsumerPipelineContract(dependencies);
}
