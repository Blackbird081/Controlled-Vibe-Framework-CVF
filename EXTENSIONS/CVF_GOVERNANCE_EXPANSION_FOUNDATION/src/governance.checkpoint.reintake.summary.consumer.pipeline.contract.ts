import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  GovernanceCheckpointReintakeSummaryContract,
  createGovernanceCheckpointReintakeSummaryContract,
} from "./governance.checkpoint.reintake.summary.contract";
import type {
  CheckpointReintakeSummary,
  GovernanceCheckpointReintakeSummaryContractDependencies,
} from "./governance.checkpoint.reintake.summary.contract";
import type { CheckpointReintakeRequest, ReintakeScope } from "./governance.checkpoint.reintake.contract";
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

export interface GovernanceCheckpointReintakeSummaryConsumerPipelineRequest {
  requests: CheckpointReintakeRequest[];
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface GovernanceCheckpointReintakeSummaryConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  reintakeSummary: CheckpointReintakeSummary;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
}

export interface GovernanceCheckpointReintakeSummaryConsumerPipelineContractDependencies {
  now?: () => string;
  summaryContractDeps?: GovernanceCheckpointReintakeSummaryContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Query Derivation ─────────────────────────────────────────────────────────

function deriveReintakeSummaryQuery(summary: CheckpointReintakeSummary): string {
  const raw = `[reintake-summary] ${summary.dominantScope} — ${summary.totalRequests} request(s)`;
  return raw.slice(0, 120);
}

// ─── Warning Builder ──────────────────────────────────────────────────────────

function buildReintakeSummaryWarnings(dominantScope: ReintakeScope): string[] {
  if (dominantScope === "IMMEDIATE") {
    return ["[governance-reintake-summary] dominant scope IMMEDIATE — immediate reintake required"];
  }
  if (dominantScope === "DEFERRED") {
    return ["[governance-reintake-summary] dominant scope DEFERRED — deferred reintake scheduled"];
  }
  return [];
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * GovernanceCheckpointReintakeSummaryConsumerPipelineContract (W3-T15 CP1)
 * -------------------------------------------------------------------------
 * Cross-plane consumer bridge: GEF → CPF (checkpoint reintake summary).
 *
 * Internal chain (single execute call):
 *   GovernanceCheckpointReintakeSummaryContract.summarize(requests) → CheckpointReintakeSummary
 *   query = `[reintake-summary] ${dominantScope} — ${totalRequests} request(s)`.slice(0, 120)
 *   contextId = summary.summaryId
 *   ControlPlaneConsumerPipelineContract.execute({rankingRequest: {query, contextId, ...}})
 *   → ControlPlaneConsumerPackage
 *   → GovernanceCheckpointReintakeSummaryConsumerPipelineResult
 *
 * Determinism: all sub-contracts share the same injected now().
 * Warnings: IMMEDIATE → immediate reintake required; DEFERRED → deferred reintake scheduled.
 * Gap closed: W6-T5 CP2 implied — CheckpointReintakeSummary had no governed consumer-visible enriched output path.
 */
export class GovernanceCheckpointReintakeSummaryConsumerPipelineContract {
  private readonly now: () => string;
  private readonly summaryContract: GovernanceCheckpointReintakeSummaryContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: GovernanceCheckpointReintakeSummaryConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.summaryContract = createGovernanceCheckpointReintakeSummaryContract({
      ...dependencies.summaryContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: GovernanceCheckpointReintakeSummaryConsumerPipelineRequest,
  ): GovernanceCheckpointReintakeSummaryConsumerPipelineResult {
    const createdAt = this.now();

    // Step 1: summarize reintake requests → CheckpointReintakeSummary
    const reintakeSummary: CheckpointReintakeSummary =
      this.summaryContract.summarize(request.requests);

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

    // Step 3: build warnings based on dominantScope
    const warnings = buildReintakeSummaryWarnings(reintakeSummary.dominantScope);

    // Step 4: deterministic hash + resultId
    const pipelineHash = computeDeterministicHash(
      "w3-t15-cp1-checkpoint-reintake-summary-consumer-pipeline",
      reintakeSummary.summaryHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w3-t15-cp1-result-id",
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

export function createGovernanceCheckpointReintakeSummaryConsumerPipelineContract(
  dependencies?: GovernanceCheckpointReintakeSummaryConsumerPipelineContractDependencies,
): GovernanceCheckpointReintakeSummaryConsumerPipelineContract {
  return new GovernanceCheckpointReintakeSummaryConsumerPipelineContract(dependencies);
}
