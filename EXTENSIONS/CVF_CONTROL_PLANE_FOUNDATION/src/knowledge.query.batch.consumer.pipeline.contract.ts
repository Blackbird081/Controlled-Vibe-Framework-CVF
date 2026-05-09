import type { KnowledgeQueryBatch } from "./knowledge.query.batch.contract";
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

export interface KnowledgeQueryBatchConsumerPipelineRequest {
  knowledgeQueryBatch: KnowledgeQueryBatch;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface KnowledgeQueryBatchConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  knowledgeQueryBatch: KnowledgeQueryBatch;
  consumerPackage: ControlPlaneConsumerPackage;
  query: string;
  contextId: string;
  warnings: string[];
  consumerId: string | undefined;
  pipelineHash: string;
}

export interface KnowledgeQueryBatchConsumerPipelineContractDependencies {
  now?: () => string;
}

// --- Contract ---

export class KnowledgeQueryBatchConsumerPipelineContract {
  private readonly consumerPipelineContract: ControlPlaneConsumerPipelineContract;
  private readonly now: () => string;

  constructor(dependencies: KnowledgeQueryBatchConsumerPipelineContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    const consumerDeps: ControlPlaneConsumerPipelineContractDependencies = {
      now: this.now,
    };
    this.consumerPipelineContract = createControlPlaneConsumerPipelineContract(consumerDeps);
  }

  execute(
    request: KnowledgeQueryBatchConsumerPipelineRequest,
  ): KnowledgeQueryBatchConsumerPipelineResult {
    const createdAt = this.now();
    const { knowledgeQueryBatch } = request;

    // Derive query
    const query = (
      `[knowledge-query-batch] queries:${knowledgeQueryBatch.totalQueries} ` +
      `found:${knowledgeQueryBatch.totalItemsFound} ` +
      `withResults:${knowledgeQueryBatch.queriesWithResults} ` +
      `empty:${knowledgeQueryBatch.emptyQueryCount}`
    ).slice(0, 120);

    // Extract contextId
    const contextId = knowledgeQueryBatch.batchId;

    // Build warnings (severity-ordered)
    const warnings: string[] = [];
    if (knowledgeQueryBatch.totalQueries === 0) {
      warnings.push("WARNING_EMPTY_BATCH");
    }
    if (knowledgeQueryBatch.totalItemsFound === 0 && knowledgeQueryBatch.totalQueries > 0) {
      warnings.push("WARNING_NO_RESULTS");
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
      "w2-t37-cp1-knowledge-query-batch-consumer-pipeline",
      knowledgeQueryBatch.batchHash,
      consumerPackage.pipelineHash,
      `queries=${knowledgeQueryBatch.totalQueries}`,
      `found=${knowledgeQueryBatch.totalItemsFound}`,
      `warnings=${warnings.length}`,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w2-t37-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      knowledgeQueryBatch,
      consumerPackage,
      query,
      contextId,
      warnings,
      consumerId: request.consumerId,
      pipelineHash,
    };
  }
}

export function createKnowledgeQueryBatchConsumerPipelineContract(
  dependencies?: KnowledgeQueryBatchConsumerPipelineContractDependencies,
): KnowledgeQueryBatchConsumerPipelineContract {
  return new KnowledgeQueryBatchConsumerPipelineContract(dependencies);
}
