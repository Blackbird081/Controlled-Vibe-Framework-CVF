import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  GovernanceCheckpointContract,
  createGovernanceCheckpointContract,
} from "./governance.checkpoint.contract";
import type {
  GovernanceCheckpointDecision,
  CheckpointAction,
  GovernanceCheckpointContractDependencies,
} from "./governance.checkpoint.contract";
import type { GovernanceConsensusSummary } from "./governance.consensus.summary.contract";
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

export interface GovernanceCheckpointConsumerPipelineRequest {
  summary: GovernanceConsensusSummary;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface GovernanceCheckpointConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  checkpointDecision: GovernanceCheckpointDecision;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
}

export interface GovernanceCheckpointConsumerPipelineContractDependencies {
  now?: () => string;
  checkpointContractDeps?: GovernanceCheckpointContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Query Derivation ─────────────────────────────────────────────────────────

function deriveCheckpointQuery(decision: GovernanceCheckpointDecision): string {
  return decision.checkpointRationale.slice(0, 120);
}

// ─── Warning Builder ──────────────────────────────────────────────────────────

function buildCheckpointWarnings(action: CheckpointAction): string[] {
  if (action === "ESCALATE") {
    return ["[checkpoint] escalate decision — immediate escalation required"];
  }
  if (action === "HALT") {
    return ["[checkpoint] halt decision — execution must halt pending review"];
  }
  return [];
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * GovernanceCheckpointConsumerPipelineContract (W3-T7)
 * -----------------------------------------------------
 * Cross-plane consumer bridge: GEF → CPF.
 *
 * Internal chain (single execute call):
 *   GovernanceCheckpointContract.checkpoint(summary)   → GovernanceCheckpointDecision
 *   ControlPlaneConsumerPipelineContract.execute(...)  → ControlPlaneConsumerPackage
 *   → GovernanceCheckpointConsumerPipelineResult
 *
 * Determinism: all sub-contracts share the same injected now().
 * Warnings: ESCALATE → immediate escalation required; HALT → halt pending review.
 */
export class GovernanceCheckpointConsumerPipelineContract {
  private readonly now: () => string;
  private readonly checkpointContract: GovernanceCheckpointContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: GovernanceCheckpointConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.checkpointContract = createGovernanceCheckpointContract({
      ...dependencies.checkpointContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: GovernanceCheckpointConsumerPipelineRequest,
  ): GovernanceCheckpointConsumerPipelineResult {
    const createdAt = this.now();

    // Step 1: derive checkpoint decision from consensus summary
    const checkpointDecision: GovernanceCheckpointDecision =
      this.checkpointContract.checkpoint(request.summary);

    // Step 2: derive query and build consumer package
    const query = deriveCheckpointQuery(checkpointDecision);
    const consumerPackage: ControlPlaneConsumerPackage =
      this.consumerPipeline.execute({
        rankingRequest: {
          query,
          contextId: checkpointDecision.checkpointId,
          candidateItems: request.candidateItems ?? [],
          scoringWeights: request.scoringWeights,
        },
        segmentTypeConstraints: request.segmentTypeConstraints,
      });

    // Step 3: build warnings based on checkpoint action
    const warnings = buildCheckpointWarnings(checkpointDecision.checkpointAction);

    // Step 4: deterministic hash + resultId
    const pipelineHash = computeDeterministicHash(
      "w3-t7-cp1-checkpoint-consumer-pipeline",
      checkpointDecision.checkpointHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w3-t7-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      consumerId: request.consumerId,
      checkpointDecision,
      consumerPackage,
      pipelineHash,
      warnings,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createGovernanceCheckpointConsumerPipelineContract(
  dependencies?: GovernanceCheckpointConsumerPipelineContractDependencies,
): GovernanceCheckpointConsumerPipelineContract {
  return new GovernanceCheckpointConsumerPipelineContract(dependencies);
}
