import type { RetrievalResultSurface } from "./retrieval.contract";
import {
  ControlPlaneConsumerPipelineContract,
  createControlPlaneConsumerPipelineContract,
} from "./consumer.pipeline.contract";
import type {
  ControlPlaneConsumerPackage,
  ControlPlaneConsumerPipelineContractDependencies,
} from "./consumer.pipeline.contract";
import type { RankableKnowledgeItem, ScoringWeights } from "./knowledge.ranking.contract";
import type { SegmentTypeConstraints } from "./context.packager.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface RetrievalConsumerPipelineRequest {
  retrievalResult: RetrievalResultSurface;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface RetrievalConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  retrievalResult: RetrievalResultSurface;
  consumerPackage: ControlPlaneConsumerPackage;
  query: string;
  contextId: string;
  warnings: string[];
  consumerId: string | undefined;
  pipelineHash: string;
}

export interface RetrievalConsumerPipelineContractDependencies {
  now?: () => string;
}

// --- Helpers ---

function deriveContextId(result: RetrievalResultSurface): string {
  return computeDeterministicHash(
    "retrieval-ctx-id",
    result.query,
    String(result.chunkCount),
    String(result.totalCandidates),
  );
}

// --- Contract ---

export class RetrievalConsumerPipelineContract {
  private readonly consumerPipelineContract: ControlPlaneConsumerPipelineContract;
  private readonly now: () => string;

  constructor(dependencies: RetrievalConsumerPipelineContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    const consumerDeps: ControlPlaneConsumerPipelineContractDependencies = {
      now: this.now,
    };
    this.consumerPipelineContract = createControlPlaneConsumerPipelineContract(consumerDeps);
  }

  execute(
    request: RetrievalConsumerPipelineRequest,
  ): RetrievalConsumerPipelineResult {
    const createdAt = this.now();
    const { retrievalResult } = request;

    // Derive contextId (no natural ID field on RetrievalResultSurface)
    const contextId = deriveContextId(retrievalResult);

    // Derive query
    const query = (
      `[retrieval] ${retrievalResult.query.slice(0, 40)} ` +
      `chunks:${retrievalResult.chunkCount} ` +
      `candidates:${retrievalResult.totalCandidates}`
    ).slice(0, 120);

    // Build warnings (severity-ordered)
    const warnings: string[] = [];
    if (retrievalResult.chunkCount === 0) {
      warnings.push("WARNING_NO_CHUNKS");
    }
    if (retrievalResult.tiersSearched.length === 0) {
      warnings.push("WARNING_NO_TIERS_SEARCHED");
    }

    // Build consumer package
    const consumerPackage = this.consumerPipelineContract.execute({
      rankingRequest: {
        query,
        contextId,
        candidateItems: request.candidateItems ?? [],
        scoringWeights: request.scoringWeights,
      },
      segmentTypeConstraints: request.segmentTypeConstraints,
    });

    // Compute hashes
    const pipelineHash = computeDeterministicHash(
      "w2-t38-cp1-retrieval-consumer-pipeline",
      contextId,
      consumerPackage.pipelineHash,
      `chunks=${retrievalResult.chunkCount}`,
      `candidates=${retrievalResult.totalCandidates}`,
      `warnings=${warnings.length}`,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w2-t38-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      retrievalResult,
      consumerPackage,
      query,
      contextId,
      warnings,
      consumerId: request.consumerId,
      pipelineHash,
    };
  }
}

export function createRetrievalConsumerPipelineContract(
  dependencies?: RetrievalConsumerPipelineContractDependencies,
): RetrievalConsumerPipelineContract {
  return new RetrievalConsumerPipelineContract(dependencies);
}
