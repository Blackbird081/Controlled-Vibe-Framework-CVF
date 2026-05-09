import type { ContextPackage, ContextSegmentType } from "./context.build.contract";
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

export interface ContextBuildConsumerPipelineRequest {
  contextPackage: ContextPackage;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface ContextBuildConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  contextPackage: ContextPackage;
  consumerPackage: ControlPlaneConsumerPackage;
  query: string;
  contextId: string;
  warnings: string[];
  consumerId: string | undefined;
  pipelineHash: string;
}

export interface ContextBuildConsumerPipelineContractDependencies {
  now?: () => string;
}

// --- Contract ---

export class ContextBuildConsumerPipelineContract {
  private readonly consumerPipelineContract: ControlPlaneConsumerPipelineContract;
  private readonly now: () => string;

  constructor(dependencies: ContextBuildConsumerPipelineContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    const consumerDeps: ControlPlaneConsumerPipelineContractDependencies = {
      now: this.now,
    };
    this.consumerPipelineContract = createControlPlaneConsumerPipelineContract(consumerDeps);
  }

  execute(request: ContextBuildConsumerPipelineRequest): ContextBuildConsumerPipelineResult {
    const createdAt = this.now();
    const { contextPackage } = request;

    // Derive query
    const query =
      `ContextBuild: segments=${contextPackage.totalSegments}, ` +
      `tokens=${contextPackage.estimatedTokens}, ` +
      `contextId=${contextPackage.contextId}`;

    // Extract contextId
    const contextId = contextPackage.contextId;

    // Build warnings
    const warnings: string[] = [];
    if (contextPackage.totalSegments === 0) {
      warnings.push("WARNING_NO_SEGMENTS");
    }
    const hasKnowledge = contextPackage.segments.some(
      (s) => s.segmentType === "KNOWLEDGE",
    );
    if (!hasKnowledge) {
      warnings.push("WARNING_NO_KNOWLEDGE");
    }
    if (contextPackage.estimatedTokens === 0) {
      warnings.push("WARNING_TOKEN_BUDGET_ZERO");
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

    // Compute pipeline hash
    const pipelineHash = computeDeterministicHash(
      "w2-t32-cp1-context-build-consumer-pipeline",
      contextPackage.packageHash,
      consumerPackage.pipelineHash,
      `segments=${contextPackage.totalSegments}`,
      `tokens=${contextPackage.estimatedTokens}`,
      `warnings=${warnings.length}`,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w2-t32-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      contextPackage,
      consumerPackage,
      query,
      contextId,
      warnings,
      consumerId: request.consumerId,
      pipelineHash,
    };
  }
}

export function createContextBuildConsumerPipelineContract(
  dependencies?: ContextBuildConsumerPipelineContractDependencies,
): ContextBuildConsumerPipelineContract {
  return new ContextBuildConsumerPipelineContract(dependencies);
}
