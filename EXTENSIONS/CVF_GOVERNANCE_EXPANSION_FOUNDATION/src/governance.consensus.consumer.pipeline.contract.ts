import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  GovernanceConsensusContract,
  createGovernanceConsensusContract,
} from "./governance.consensus.contract";
import type {
  ConsensusDecision,
  ConsensusVerdict,
  GovernanceConsensusContractDependencies,
} from "./governance.consensus.contract";
import type { GovernanceAuditSignal } from "./governance.audit.signal.contract";
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

export interface GovernanceConsensusConsumerPipelineRequest {
  signals: GovernanceAuditSignal[];
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface GovernanceConsensusConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  consensusDecision: ConsensusDecision;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
}

export interface GovernanceConsensusConsumerPipelineContractDependencies {
  now?: () => string;
  consensusContractDeps?: GovernanceConsensusContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Query Derivation ─────────────────────────────────────────────────────────

function deriveConsensusQuery(decision: ConsensusDecision): string {
  const raw = `${decision.verdict} consensus — score: ${decision.consensusScore}, critical: ${decision.criticalCount}/${decision.totalSignals}`;
  return raw.slice(0, 120);
}

// ─── Warning Builder ──────────────────────────────────────────────────────────

function buildConsensusWarnings(verdict: ConsensusVerdict): string[] {
  if (verdict === "ESCALATE") {
    return ["[consensus] escalation verdict — governance review required"];
  }
  if (verdict === "PAUSE") {
    return ["[consensus] pause verdict — audit recommended"];
  }
  return [];
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * GovernanceConsensusConsumerPipelineContract (W3-T6)
 * ---------------------------------------------------
 * Cross-plane consumer bridge: GEF → CPF.
 *
 * Internal chain (single execute call):
 *   GovernanceConsensusContract.decide(signals)         → ConsensusDecision
 *   ControlPlaneConsumerPipelineContract.execute(...)   → ControlPlaneConsumerPackage
 *   → GovernanceConsensusConsumerPipelineResult
 *
 * Determinism: all sub-contracts share the same injected now().
 * Warnings: ESCALATE → governance review required; PAUSE → audit recommended.
 */
export class GovernanceConsensusConsumerPipelineContract {
  private readonly now: () => string;
  private readonly consensusContract: GovernanceConsensusContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: GovernanceConsensusConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.consensusContract = createGovernanceConsensusContract({
      ...dependencies.consensusContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: GovernanceConsensusConsumerPipelineRequest,
  ): GovernanceConsensusConsumerPipelineResult {
    const createdAt = this.now();

    // Step 1: derive consensus decision from audit signals
    const consensusDecision: ConsensusDecision = this.consensusContract.decide(
      request.signals,
    );

    // Step 2: derive query and build consumer package
    const query = deriveConsensusQuery(consensusDecision);
    const consumerPackage: ControlPlaneConsumerPackage =
      this.consumerPipeline.execute({
        rankingRequest: {
          query,
          contextId: consensusDecision.decisionId,
          candidateItems: request.candidateItems ?? [],
          scoringWeights: request.scoringWeights,
        },
        segmentTypeConstraints: request.segmentTypeConstraints,
      });

    // Step 3: build warnings based on verdict
    const warnings = buildConsensusWarnings(consensusDecision.verdict);

    // Step 4: deterministic hash + resultId
    const pipelineHash = computeDeterministicHash(
      "w3-t6-cp1-consensus-consumer-pipeline",
      consensusDecision.decisionHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w3-t6-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      consumerId: request.consumerId,
      consensusDecision,
      consumerPackage,
      pipelineHash,
      warnings,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createGovernanceConsensusConsumerPipelineContract(
  dependencies?: GovernanceConsensusConsumerPipelineContractDependencies,
): GovernanceConsensusConsumerPipelineContract {
  return new GovernanceConsensusConsumerPipelineContract(dependencies);
}
