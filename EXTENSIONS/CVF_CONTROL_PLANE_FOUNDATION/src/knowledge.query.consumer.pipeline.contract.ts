import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  KnowledgeQueryContract,
  createKnowledgeQueryContract,
} from "./knowledge.query.contract";
import type {
  KnowledgeQueryRequest,
  KnowledgeResult,
  KnowledgeQueryContractDependencies,
} from "./knowledge.query.contract";
import {
  ControlPlaneConsumerPipelineContract,
  createControlPlaneConsumerPipelineContract,
} from "./consumer.pipeline.contract";
import type {
  ControlPlaneConsumerPackage,
  ControlPlaneConsumerPipelineContractDependencies,
} from "./consumer.pipeline.contract";
import type { SegmentTypeConstraints } from "./context.packager.contract";
import type { ScoringWeights } from "./knowledge.ranking.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KnowledgeQueryConsumerPipelineRequest {
  queryRequest: KnowledgeQueryRequest;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
  scoringWeights?: ScoringWeights;
}

export interface KnowledgeQueryConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  queryResult: KnowledgeResult;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
}

export interface KnowledgeQueryConsumerPipelineContractDependencies {
  now?: () => string;
  queryContractDeps?: KnowledgeQueryContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Query Derivation ─────────────────────────────────────────────────────────

function deriveKnowledgeQueryPipelineQuery(queryResult: KnowledgeResult): string {
  const raw = `knowledge-query:found:${queryResult.totalFound}:threshold:${queryResult.relevanceThreshold.toFixed(2)}`;
  return raw.slice(0, 120);
}

// ─── Warning Builder ──────────────────────────────────────────────────────────

function buildKnowledgeQueryWarnings(queryResult: KnowledgeResult): string[] {
  const warnings: string[] = [];
  if (queryResult.totalFound === 0) {
    warnings.push("[knowledge-query] no results found — query returned empty set");
  }
  if (queryResult.relevanceThreshold === 0.0) {
    warnings.push(
      "[knowledge-query] zero relevance threshold — all items included regardless of quality",
    );
  }
  return warnings;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * KnowledgeQueryConsumerPipelineContract (W1-T22 CP1 — Full Lane GC-019)
 * -------------------------------------------------------------------------
 * CPF-internal consumer bridge from KnowledgeQueryContract to CPF.
 *
 * Internal chain (single execute call):
 *   KnowledgeQueryContract.query(queryRequest)            → KnowledgeResult
 *   ControlPlaneConsumerPipelineContract.execute(…)       → ControlPlaneConsumerPackage
 *   → KnowledgeQueryConsumerPipelineResult
 *
 * query     = "knowledge-query:found:${totalFound}:threshold:${relevanceThreshold.toFixed(2)}" (≤120 chars)
 * contextId = queryResult.contextId
 * Determinism: all sub-contracts share the same injected now().
 * Warnings:
 *   totalFound === 0           → "[knowledge-query] no results found — query returned empty set"
 *   relevanceThreshold === 0.0 → "[knowledge-query] zero relevance threshold — all items included regardless of quality"
 *   (both can apply simultaneously)
 */
export class KnowledgeQueryConsumerPipelineContract {
  private readonly now: () => string;
  private readonly queryContract: KnowledgeQueryContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: KnowledgeQueryConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.queryContract = createKnowledgeQueryContract({
      ...dependencies.queryContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: KnowledgeQueryConsumerPipelineRequest,
  ): KnowledgeQueryConsumerPipelineResult {
    const createdAt = this.now();

    // Step 1: query → KnowledgeResult
    const queryResult: KnowledgeResult =
      this.queryContract.query(request.queryRequest);

    // Step 2: derive pipeline query and build consumer package
    const query = deriveKnowledgeQueryPipelineQuery(queryResult);
    const consumerPackage: ControlPlaneConsumerPackage =
      this.consumerPipeline.execute({
        rankingRequest: {
          query,
          contextId: queryResult.contextId,
          candidateItems: [],
          scoringWeights: request.scoringWeights,
        },
        segmentTypeConstraints: request.segmentTypeConstraints,
      });

    // Step 3: build warnings
    const warnings = buildKnowledgeQueryWarnings(queryResult);

    // Step 4: deterministic hash + resultId
    const pipelineHash = computeDeterministicHash(
      "w1-t22-cp1-knowledge-query-consumer-pipeline",
      queryResult.queryHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w1-t22-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      consumerId: request.consumerId,
      queryResult,
      consumerPackage,
      pipelineHash,
      warnings,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createKnowledgeQueryConsumerPipelineContract(
  dependencies?: KnowledgeQueryConsumerPipelineContractDependencies,
): KnowledgeQueryConsumerPipelineContract {
  return new KnowledgeQueryConsumerPipelineContract(dependencies);
}
