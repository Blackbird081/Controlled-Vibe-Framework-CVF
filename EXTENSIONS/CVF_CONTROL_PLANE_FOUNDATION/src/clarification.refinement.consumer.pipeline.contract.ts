import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  ClarificationRefinementContract,
  createClarificationRefinementContract,
} from "./clarification.refinement.contract";
import type {
  ClarificationAnswer,
  RefinedIntakeRequest,
  ClarificationRefinementContractDependencies,
} from "./clarification.refinement.contract";
import type { ReversePromptPacket } from "./reverse.prompting.contract";
import {
  ControlPlaneConsumerPipelineContract,
  createControlPlaneConsumerPipelineContract,
} from "./consumer.pipeline.contract";
import type {
  ControlPlaneConsumerPackage,
  ControlPlaneConsumerPipelineContractDependencies,
} from "./consumer.pipeline.contract";
import type { SegmentTypeConstraints } from "./context.packager.contract";
import type { RankableKnowledgeItem, ScoringWeights } from "./knowledge.ranking.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClarificationRefinementConsumerPipelineRequest {
  packet: ReversePromptPacket;
  answers: ClarificationAnswer[];
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
}

export interface ClarificationRefinementConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  refinedRequest: RefinedIntakeRequest;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
}

export interface ClarificationRefinementConsumerPipelineContractDependencies {
  now?: () => string;
  refinementContractDeps?: ClarificationRefinementContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Query Derivation ─────────────────────────────────────────────────────────

function deriveClarificationRefinementQuery(
  refinedRequest: RefinedIntakeRequest,
): string {
  const raw = `clarification-refinement:confidence:${refinedRequest.confidenceBoost.toFixed(2)}:answered:${refinedRequest.answeredCount}`;
  return raw.slice(0, 120);
}

// ─── Warning Builder ──────────────────────────────────────────────────────────

function buildClarificationRefinementWarnings(
  refinedRequest: RefinedIntakeRequest,
): string[] {
  if (refinedRequest.confidenceBoost === 0) {
    return [
      "[clarification] no answers applied — refinement yielded no confidence boost",
    ];
  }
  if (refinedRequest.confidenceBoost < 0.5) {
    return [
      "[clarification] low confidence refinement — insufficient answers applied",
    ];
  }
  return [];
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * ClarificationRefinementConsumerPipelineContract (W1-T21 CP1 — Full Lane GC-019)
 * -------------------------------------------------------------------------
 * CPF-internal consumer bridge from ClarificationRefinementContract to CPF.
 *
 * Internal chain (single execute call):
 *   ClarificationRefinementContract.refine(packet, answers) → RefinedIntakeRequest
 *   ControlPlaneConsumerPipelineContract.execute(…)         → ControlPlaneConsumerPackage
 *   → ClarificationRefinementConsumerPipelineResult
 *
 * query     = "clarification-refinement:confidence:${confidenceBoost.toFixed(2)}:answered:${answeredCount}" (≤120 chars)
 * contextId = refinedRequest.refinedId
 * Determinism: all sub-contracts share the same injected now().
 * Warnings:
 *   confidenceBoost === 0           → "[clarification] no answers applied — refinement yielded no confidence boost"
 *   0 < confidenceBoost < 0.5      → "[clarification] low confidence refinement — insufficient answers applied"
 *   confidenceBoost >= 0.5         → no warning
 */
export class ClarificationRefinementConsumerPipelineContract {
  private readonly now: () => string;
  private readonly refinementContract: ClarificationRefinementContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: ClarificationRefinementConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.refinementContract = createClarificationRefinementContract({
      ...dependencies.refinementContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: ClarificationRefinementConsumerPipelineRequest,
  ): ClarificationRefinementConsumerPipelineResult {
    const createdAt = this.now();

    // Step 1: refine → RefinedIntakeRequest
    const refinedRequest: RefinedIntakeRequest =
      this.refinementContract.refine(request.packet, request.answers);

    // Step 2: derive query and build consumer package
    const query = deriveClarificationRefinementQuery(refinedRequest);
    const consumerPackage: ControlPlaneConsumerPackage =
      this.consumerPipeline.execute({
        rankingRequest: {
          query,
          contextId: refinedRequest.refinedId,
          candidateItems: request.candidateItems ?? [],
          scoringWeights: request.scoringWeights,
        },
        segmentTypeConstraints: request.segmentTypeConstraints,
      });

    // Step 3: build warnings based on confidenceBoost
    const warnings = buildClarificationRefinementWarnings(refinedRequest);

    // Step 4: deterministic hash + resultId
    const pipelineHash = computeDeterministicHash(
      "w1-t21-cp1-clarification-refinement-consumer-pipeline",
      refinedRequest.refinedId,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w1-t21-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      consumerId: request.consumerId,
      refinedRequest,
      consumerPackage,
      pipelineHash,
      warnings,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createClarificationRefinementConsumerPipelineContract(
  dependencies?: ClarificationRefinementConsumerPipelineContractDependencies,
): ClarificationRefinementConsumerPipelineContract {
  return new ClarificationRefinementConsumerPipelineContract(dependencies);
}
