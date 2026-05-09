import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  KnowledgeRankingContract,
  createKnowledgeRankingContract,
} from "./knowledge.ranking.contract";
import type {
  KnowledgeRankingRequest,
  RankedKnowledgeResult,
  KnowledgeRankingContractDependencies,
} from "./knowledge.ranking.contract";
import {
  ControlPlaneConsumerPipelineContract,
  createControlPlaneConsumerPipelineContract,
} from "./consumer.pipeline.contract";
import type {
  ControlPlaneConsumerPackage,
  ControlPlaneConsumerPipelineContractDependencies,
} from "./consumer.pipeline.contract";
import type { SegmentTypeConstraints } from "./context.packager.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KnowledgeRankingConsumerPipelineRequest {
  rankingRequest: KnowledgeRankingRequest;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface KnowledgeRankingConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  rankedResult: RankedKnowledgeResult;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
}

export interface KnowledgeRankingConsumerPipelineContractDependencies {
  now?: () => string;
  rankingContractDeps?: KnowledgeRankingContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Query Derivation ─────────────────────────────────────────────────────────

function deriveKnowledgeRankingQuery(
  request: KnowledgeRankingRequest,
  result: RankedKnowledgeResult,
): string {
  const raw = `${request.query}:ranked:${result.totalRanked}`;
  return raw.slice(0, 120);
}

// ─── Warning Builder ──────────────────────────────────────────────────────────

function buildKnowledgeRankingWarnings(result: RankedKnowledgeResult): string[] {
  if (result.totalRanked === 0) {
    return ["[knowledge] no ranked items returned — query may need broadening"];
  }
  return [];
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * KnowledgeRankingConsumerPipelineContract (W1-T19 CP1 — Full Lane GC-019)
 * -------------------------------------------------------------------------
 * CPF-internal consumer bridge from KnowledgeRankingContract to CPF.
 *
 * Internal chain (single execute call):
 *   KnowledgeRankingContract.rank(rankingRequest)   → RankedKnowledgeResult
 *   ControlPlaneConsumerPipelineContract.execute(…) → ControlPlaneConsumerPackage
 *   → KnowledgeRankingConsumerPipelineResult
 *
 * query   = "${request.query}:ranked:${totalRanked}" (≤120 chars)
 * contextId = rankedResult.resultId
 * Determinism: all sub-contracts share the same injected now().
 * Warning: totalRanked === 0 → "[knowledge] no ranked items returned — query may need broadening"
 */
export class KnowledgeRankingConsumerPipelineContract {
  private readonly now: () => string;
  private readonly rankingContract: KnowledgeRankingContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: KnowledgeRankingConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.rankingContract = createKnowledgeRankingContract({
      ...dependencies.rankingContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: KnowledgeRankingConsumerPipelineRequest,
  ): KnowledgeRankingConsumerPipelineResult {
    const createdAt = this.now();

    // Step 1: rank candidate knowledge items
    const rankedResult: RankedKnowledgeResult =
      this.rankingContract.rank(request.rankingRequest);

    // Step 2: derive query and build consumer package
    const query = deriveKnowledgeRankingQuery(request.rankingRequest, rankedResult);
    const consumerPackage: ControlPlaneConsumerPackage =
      this.consumerPipeline.execute({
        rankingRequest: {
          query,
          contextId: rankedResult.resultId,
          candidateItems: rankedResult.items,
          scoringWeights: request.rankingRequest.scoringWeights,
        },
        segmentTypeConstraints: request.segmentTypeConstraints,
      });

    // Step 3: build warnings
    const warnings = buildKnowledgeRankingWarnings(rankedResult);

    // Step 4: deterministic hash + resultId
    const pipelineHash = computeDeterministicHash(
      "w1-t19-cp1-knowledge-ranking-consumer-pipeline",
      rankedResult.rankingHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w1-t19-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      consumerId: request.consumerId,
      rankedResult,
      consumerPackage,
      pipelineHash,
      warnings,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createKnowledgeRankingConsumerPipelineContract(
  dependencies?: KnowledgeRankingConsumerPipelineContractDependencies,
): KnowledgeRankingConsumerPipelineContract {
  return new KnowledgeRankingConsumerPipelineContract(dependencies);
}
