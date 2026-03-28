import type { ContextBuildBatch } from "./context.build.batch.contract";
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

export interface ContextBuildBatchConsumerPipelineRequest {
  contextBuildBatch: ContextBuildBatch;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface ContextBuildBatchConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  contextBuildBatch: ContextBuildBatch;
  consumerPackage: ControlPlaneConsumerPackage;
  query: string;
  contextId: string;
  warnings: string[];
  consumerId: string | undefined;
  pipelineHash: string;
}

export interface ContextBuildBatchConsumerPipelineContractDependencies {
  now?: () => string;
}

// --- Contract ---

export class ContextBuildBatchConsumerPipelineContract {
  private readonly consumerPipelineContract: ControlPlaneConsumerPipelineContract;
  private readonly now: () => string;

  constructor(dependencies: ContextBuildBatchConsumerPipelineContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    const consumerDeps: ControlPlaneConsumerPipelineContractDependencies = {
      now: this.now,
    };
    this.consumerPipelineContract = createControlPlaneConsumerPipelineContract(consumerDeps);
  }

  execute(
    request: ContextBuildBatchConsumerPipelineRequest,
  ): ContextBuildBatchConsumerPipelineResult {
    const createdAt = this.now();
    const { contextBuildBatch } = request;

    // Derive query
    const query = (
      `[context-build-batch] packages:${contextBuildBatch.totalPackages} ` +
      `segments:${contextBuildBatch.totalSegments} ` +
      `avg:${contextBuildBatch.avgSegmentsPerPackage}`
    ).slice(0, 120);

    // Extract contextId
    const contextId = contextBuildBatch.batchId;

    // Build warnings (severity-ordered)
    const warnings: string[] = [];
    if (contextBuildBatch.totalPackages === 0) {
      warnings.push("WARNING_EMPTY_BATCH");
    }
    if (contextBuildBatch.totalSegments === 0 && contextBuildBatch.totalPackages > 0) {
      warnings.push("WARNING_NO_SEGMENTS");
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
      "w2-t36-cp1-context-build-batch-consumer-pipeline",
      contextBuildBatch.batchHash,
      consumerPackage.pipelineHash,
      `packages=${contextBuildBatch.totalPackages}`,
      `segments=${contextBuildBatch.totalSegments}`,
      `warnings=${warnings.length}`,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w2-t36-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      contextBuildBatch,
      consumerPackage,
      query,
      contextId,
      warnings,
      consumerId: request.consumerId,
      pipelineHash,
    };
  }
}

export function createContextBuildBatchConsumerPipelineContract(
  dependencies?: ContextBuildBatchConsumerPipelineContractDependencies,
): ContextBuildBatchConsumerPipelineContract {
  return new ContextBuildBatchConsumerPipelineContract(dependencies);
}
