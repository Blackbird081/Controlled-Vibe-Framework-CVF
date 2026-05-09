import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  ExecutionReintakeSummaryContract,
  createExecutionReintakeSummaryContract,
} from "./execution.reintake.summary.contract";
import type {
  ExecutionReintakeSummary,
  ExecutionReintakeSummaryContractDependencies,
} from "./execution.reintake.summary.contract";
import type { ReintakeAction } from "./execution.reintake.contract";
import type { FeedbackResolutionSummary } from "./feedback.resolution.contract";
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

export interface ExecutionReintakeSummaryConsumerPipelineRequest {
  resolutionSummaries: FeedbackResolutionSummary[];
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface ExecutionReintakeSummaryConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  reintakeSummary: ExecutionReintakeSummary;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
}

export interface ExecutionReintakeSummaryConsumerPipelineContractDependencies {
  now?: () => string;
  summaryContractDeps?: ExecutionReintakeSummaryContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Query Derivation ─────────────────────────────────────────────────────────

function deriveReintakeSummaryQuery(summary: ExecutionReintakeSummary): string {
  const raw = `[reintake-summary] ${summary.dominantReintakeAction} — ${summary.totalRequests} request(s)`;
  return raw.slice(0, 120);
}

// ─── Warning Builder ──────────────────────────────────────────────────────────

function buildReintakeSummaryWarnings(dominantAction: ReintakeAction): string[] {
  if (dominantAction === "REPLAN") {
    return ["[execution-reintake-summary] dominant action REPLAN — full replanning required"];
  }
  if (dominantAction === "RETRY") {
    return ["[execution-reintake-summary] dominant action RETRY — retry queued"];
  }
  return [];
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * ExecutionReintakeSummaryConsumerPipelineContract (W2-T17 CP1)
 * --------------------------------------------------------------
 * Cross-plane consumer bridge: EPF → CPF (execution reintake summary).
 *
 * Internal chain (single execute call):
 *   ExecutionReintakeSummaryContract.summarize(resolutionSummaries) → ExecutionReintakeSummary
 *   query = `[reintake-summary] ${dominantReintakeAction} — ${totalRequests} request(s)`.slice(0, 120)
 *   contextId = summary.summaryId
 *   ControlPlaneConsumerPipelineContract.execute({rankingRequest: {query, contextId, ...}})
 *   → ControlPlaneConsumerPackage
 *   → ExecutionReintakeSummaryConsumerPipelineResult
 *
 * Determinism: all sub-contracts share the same injected now().
 * Warnings: REPLAN → full replanning required; RETRY → retry queued.
 * Gap closed: ExecutionReintakeSummaryContract had no governed consumer-visible enriched output path.
 */
export class ExecutionReintakeSummaryConsumerPipelineContract {
  private readonly now: () => string;
  private readonly summaryContract: ExecutionReintakeSummaryContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: ExecutionReintakeSummaryConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.summaryContract = createExecutionReintakeSummaryContract({
      ...dependencies.summaryContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: ExecutionReintakeSummaryConsumerPipelineRequest,
  ): ExecutionReintakeSummaryConsumerPipelineResult {
    const createdAt = this.now();

    // Step 1: summarize resolution summaries → ExecutionReintakeSummary
    const reintakeSummary: ExecutionReintakeSummary =
      this.summaryContract.summarize(request.resolutionSummaries);

    // Step 2: derive query and build consumer package
    const query = deriveReintakeSummaryQuery(reintakeSummary);
    const consumerPackage: ControlPlaneConsumerPackage =
      this.consumerPipeline.execute({
        rankingRequest: {
          query,
          contextId: reintakeSummary.summaryId,
          candidateItems: request.candidateItems ?? [],
          scoringWeights: request.scoringWeights,
        },
        segmentTypeConstraints: request.segmentTypeConstraints,
      });

    // Step 3: build warnings based on dominantReintakeAction
    const warnings = buildReintakeSummaryWarnings(reintakeSummary.dominantReintakeAction);

    // Step 4: deterministic hash + resultId
    const pipelineHash = computeDeterministicHash(
      "w2-t17-cp1-execution-reintake-summary-consumer-pipeline",
      reintakeSummary.summaryHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w2-t17-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      consumerId: request.consumerId,
      reintakeSummary,
      consumerPackage,
      pipelineHash,
      warnings,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createExecutionReintakeSummaryConsumerPipelineContract(
  dependencies?: ExecutionReintakeSummaryConsumerPipelineContractDependencies,
): ExecutionReintakeSummaryConsumerPipelineContract {
  return new ExecutionReintakeSummaryConsumerPipelineContract(dependencies);
}
