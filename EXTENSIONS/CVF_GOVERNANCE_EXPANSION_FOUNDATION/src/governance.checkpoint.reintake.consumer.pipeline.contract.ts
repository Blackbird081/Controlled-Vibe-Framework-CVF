import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  GovernanceCheckpointReintakeContract,
  createGovernanceCheckpointReintakeContract,
} from "./governance.checkpoint.reintake.contract";
import type {
  CheckpointReintakeRequest,
  ReintakeTrigger,
  GovernanceCheckpointReintakeContractDependencies,
} from "./governance.checkpoint.reintake.contract";
import type { GovernanceCheckpointDecision } from "./governance.checkpoint.contract";
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

export interface GovernanceCheckpointReintakeConsumerPipelineRequest {
  decision: GovernanceCheckpointDecision;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface GovernanceCheckpointReintakeConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  reintakeRequest: CheckpointReintakeRequest;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
}

export interface GovernanceCheckpointReintakeConsumerPipelineContractDependencies {
  now?: () => string;
  reintakeContractDeps?: GovernanceCheckpointReintakeContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Query Derivation ─────────────────────────────────────────────────────────

function deriveReintakeQuery(reintakeRequest: CheckpointReintakeRequest): string {
  return `${reintakeRequest.reintakeTrigger}:scope:${reintakeRequest.reintakeScope}:src:${reintakeRequest.sourceCheckpointId}`.slice(0, 120);
}

// ─── Warning Builder ──────────────────────────────────────────────────────────

function buildReintakeWarnings(trigger: ReintakeTrigger): string[] {
  if (trigger === "ESCALATION_REQUIRED") {
    return ["[reintake] governance escalation required — immediate control re-intake triggered"];
  }
  if (trigger === "HALT_REVIEW_PENDING") {
    return ["[reintake] governance halt — deferred control re-intake pending review"];
  }
  return [];
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * GovernanceCheckpointReintakeConsumerPipelineContract (W3-T8)
 * ------------------------------------------------------------
 * Cross-plane consumer bridge: GEF → CPF.
 *
 * Internal chain (single execute call):
 *   GovernanceCheckpointReintakeContract.reintake(decision)  → CheckpointReintakeRequest
 *   ControlPlaneConsumerPipelineContract.execute(...)         → ControlPlaneConsumerPackage
 *   → GovernanceCheckpointReintakeConsumerPipelineResult
 *
 * Determinism: all sub-contracts share the same injected now().
 * Warnings: ESCALATION_REQUIRED → immediate re-intake triggered;
 *           HALT_REVIEW_PENDING → deferred re-intake pending review.
 */
export class GovernanceCheckpointReintakeConsumerPipelineContract {
  private readonly now: () => string;
  private readonly reintakeContract: GovernanceCheckpointReintakeContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: GovernanceCheckpointReintakeConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.reintakeContract = createGovernanceCheckpointReintakeContract({
      ...dependencies.reintakeContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: GovernanceCheckpointReintakeConsumerPipelineRequest,
  ): GovernanceCheckpointReintakeConsumerPipelineResult {
    const createdAt = this.now();

    // Step 1: derive reintake request from checkpoint decision
    const reintakeRequest: CheckpointReintakeRequest =
      this.reintakeContract.reintake(request.decision);

    // Step 2: derive query and build consumer package
    const query = deriveReintakeQuery(reintakeRequest);
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

    // Step 3: build warnings based on reintake trigger
    const warnings = buildReintakeWarnings(reintakeRequest.reintakeTrigger);

    // Step 4: deterministic hash + resultId
    const pipelineHash = computeDeterministicHash(
      "w3-t8-cp1-reintake-consumer-pipeline",
      reintakeRequest.reintakeHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w3-t8-cp1-result-id",
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

export function createGovernanceCheckpointReintakeConsumerPipelineContract(
  dependencies?: GovernanceCheckpointReintakeConsumerPipelineContractDependencies,
): GovernanceCheckpointReintakeConsumerPipelineContract {
  return new GovernanceCheckpointReintakeConsumerPipelineContract(dependencies);
}
