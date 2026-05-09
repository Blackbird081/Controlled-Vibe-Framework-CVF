import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  ExecutionReintakeContract,
  createExecutionReintakeContract,
} from "./execution.reintake.contract";
import type {
  ExecutionReintakeRequest,
  ReintakeAction,
  ExecutionReintakeContractDependencies,
} from "./execution.reintake.contract";
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

export interface ExecutionReintakeConsumerPipelineRequest {
  resolutionSummary: FeedbackResolutionSummary;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface ExecutionReintakeConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  reintakeRequest: ExecutionReintakeRequest;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
}

export interface ExecutionReintakeConsumerPipelineContractDependencies {
  now?: () => string;
  reintakeContractDeps?: ExecutionReintakeContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Warning Builder ──────────────────────────────────────────────────────────

function buildReintakeWarnings(action: ReintakeAction): string[] {
  if (action === "REPLAN") {
    return ["[reintake] full replanning required — new design authorization needed"];
  }
  if (action === "RETRY") {
    return ["[reintake] execution retry requested — revised orchestration required"];
  }
  return [];
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * ExecutionReintakeConsumerPipelineContract (W2-T12)
 * --------------------------------------------------
 * Cross-plane consumer bridge: EPF → CPF.
 *
 * Internal chain (single execute call):
 *   ExecutionReintakeContract.reinject(summary)         → ExecutionReintakeRequest
 *   ControlPlaneConsumerPipelineContract.execute(...)   → ControlPlaneConsumerPackage
 *   → ExecutionReintakeConsumerPipelineResult
 *
 * Determinism: all sub-contracts share the same injected now().
 * Warnings: REPLAN → full replanning required; RETRY → execution retry requested.
 */
export class ExecutionReintakeConsumerPipelineContract {
  private readonly now: () => string;
  private readonly reintakeContract: ExecutionReintakeContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: ExecutionReintakeConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.reintakeContract = createExecutionReintakeContract({
      ...dependencies.reintakeContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: ExecutionReintakeConsumerPipelineRequest,
  ): ExecutionReintakeConsumerPipelineResult {
    const createdAt = this.now();

    // Step 1: reinject feedback resolution summary → reintake request
    const reintakeRequest: ExecutionReintakeRequest =
      this.reintakeContract.reinject(request.resolutionSummary);

    // Step 2: derive query from reintake vibe and build consumer package
    const query = reintakeRequest.reintakeVibe.slice(0, 120);
    const consumerPackage: ControlPlaneConsumerPackage =
      this.consumerPipeline.execute({
        rankingRequest: {
          query,
          contextId: reintakeRequest.reintakeId,
          candidateItems: request.candidateItems ?? [],
          scoringWeights: request.scoringWeights,
        },
        segmentTypeConstraints: request.segmentTypeConstraints,
      });

    // Step 3: build warnings based on reintake action
    const warnings = buildReintakeWarnings(reintakeRequest.reintakeAction);

    // Step 4: deterministic hash + resultId
    const pipelineHash = computeDeterministicHash(
      "w2-t12-cp1-reintake-consumer-pipeline",
      reintakeRequest.reintakeHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w2-t12-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      consumerId: request.consumerId,
      reintakeRequest,
      consumerPackage,
      pipelineHash,
      warnings,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createExecutionReintakeConsumerPipelineContract(
  dependencies?: ExecutionReintakeConsumerPipelineContractDependencies,
): ExecutionReintakeConsumerPipelineContract {
  return new ExecutionReintakeConsumerPipelineContract(dependencies);
}
