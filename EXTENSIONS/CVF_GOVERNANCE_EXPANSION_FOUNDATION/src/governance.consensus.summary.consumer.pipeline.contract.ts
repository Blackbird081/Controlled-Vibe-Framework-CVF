import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  GovernanceConsensusSummaryContract,
  createGovernanceConsensusSummaryContract,
} from "./governance.consensus.summary.contract";
import type {
  GovernanceConsensusSummary,
  GovernanceConsensusSummaryContractDependencies,
} from "./governance.consensus.summary.contract";
import type {
  ConsensusDecision,
  ConsensusVerdict,
} from "./governance.consensus.contract";
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

export interface GovernanceConsensusSummaryConsumerPipelineRequest {
  decisions: ConsensusDecision[];
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface GovernanceConsensusSummaryConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  consensusSummary: GovernanceConsensusSummary;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
}

export interface GovernanceConsensusSummaryConsumerPipelineContractDependencies {
  now?: () => string;
  summaryContractDeps?: GovernanceConsensusSummaryContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Query Derivation ─────────────────────────────────────────────────────────

function deriveConsensusSummaryQuery(summary: GovernanceConsensusSummary): string {
  const raw = `[consensus] ${summary.dominantVerdict} — ${summary.totalDecisions} decision(s)`;
  return raw.slice(0, 120);
}

// ─── Warning Builder ──────────────────────────────────────────────────────────

function buildConsensusSummaryWarnings(dominantVerdict: ConsensusVerdict): string[] {
  if (dominantVerdict === "ESCALATE") {
    return ["[governance-consensus] dominant verdict ESCALATE — immediate governance escalation required"];
  }
  if (dominantVerdict === "PAUSE") {
    return ["[governance-consensus] dominant verdict PAUSE — governance pause required"];
  }
  return [];
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * GovernanceConsensusSummaryConsumerPipelineContract (W3-T13 CP1)
 * ---------------------------------------------------------------
 * Cross-plane consumer bridge: GEF → CPF (consensus summary).
 *
 * Internal chain (single execute call):
 *   GovernanceConsensusSummaryContract.summarize(decisions) → GovernanceConsensusSummary
 *   query = `[consensus] ${dominantVerdict} — ${totalDecisions} decision(s)`.slice(0, 120)
 *   contextId = summary.summaryId
 *   ControlPlaneConsumerPipelineContract.execute({rankingRequest: {query, contextId, ...}})
 *   → ControlPlaneConsumerPackage
 *   → GovernanceConsensusSummaryConsumerPipelineResult
 *
 * Determinism: all sub-contracts share the same injected now().
 * Warnings: ESCALATE → immediate governance escalation; PAUSE → governance pause required.
 * Gap closed: W3-T4 CP2 implied — GovernanceConsensusSummary had no governed consumer-visible enriched output path.
 */
export class GovernanceConsensusSummaryConsumerPipelineContract {
  private readonly now: () => string;
  private readonly summaryContract: GovernanceConsensusSummaryContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: GovernanceConsensusSummaryConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.summaryContract = createGovernanceConsensusSummaryContract({
      ...dependencies.summaryContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: GovernanceConsensusSummaryConsumerPipelineRequest,
  ): GovernanceConsensusSummaryConsumerPipelineResult {
    const createdAt = this.now();

    // Step 1: summarize decisions → GovernanceConsensusSummary
    const consensusSummary: GovernanceConsensusSummary =
      this.summaryContract.summarize(request.decisions);

    // Step 2: derive query and build consumer package
    const query = deriveConsensusSummaryQuery(consensusSummary);
    const consumerPackage: ControlPlaneConsumerPackage =
      this.consumerPipeline.execute({
        rankingRequest: {
          query,
          contextId: consensusSummary.summaryId,
          candidateItems: request.candidateItems ?? [],
          scoringWeights: request.scoringWeights,
        },
        segmentTypeConstraints: request.segmentTypeConstraints,
      });

    // Step 3: build warnings based on dominantVerdict
    const warnings = buildConsensusSummaryWarnings(consensusSummary.dominantVerdict);

    // Step 4: deterministic hash + resultId
    const pipelineHash = computeDeterministicHash(
      "w3-t13-cp1-consensus-summary-consumer-pipeline",
      consensusSummary.summaryHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w3-t13-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      consumerId: request.consumerId,
      consensusSummary,
      consumerPackage,
      pipelineHash,
      warnings,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createGovernanceConsensusSummaryConsumerPipelineContract(
  dependencies?: GovernanceConsensusSummaryConsumerPipelineContractDependencies,
): GovernanceConsensusSummaryConsumerPipelineContract {
  return new GovernanceConsensusSummaryConsumerPipelineContract(dependencies);
}
