import type { TypedContextPackage } from "./context.packager.contract";
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

export interface ContextPackagerConsumerPipelineRequest {
  typedContextPackage: TypedContextPackage;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface ContextPackagerConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  typedContextPackage: TypedContextPackage;
  consumerPackage: ControlPlaneConsumerPackage;
  query: string;
  contextId: string;
  distinctTypeCount: number;
  warnings: string[];
  consumerId: string | undefined;
  pipelineHash: string;
}

export interface ContextPackagerConsumerPipelineContractDependencies {
  now?: () => string;
}

// --- Helpers ---

function countDistinctTypes(pkg: TypedContextPackage): number {
  return Object.values(pkg.perTypeTokens).filter((t) => t > 0).length;
}

// --- Contract ---

export class ContextPackagerConsumerPipelineContract {
  private readonly consumerPipelineContract: ControlPlaneConsumerPipelineContract;
  private readonly now: () => string;

  constructor(dependencies: ContextPackagerConsumerPipelineContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    const consumerDeps: ControlPlaneConsumerPipelineContractDependencies = {
      now: this.now,
    };
    this.consumerPipelineContract = createControlPlaneConsumerPipelineContract(consumerDeps);
  }

  execute(
    request: ContextPackagerConsumerPipelineRequest,
  ): ContextPackagerConsumerPipelineResult {
    const createdAt = this.now();
    const { typedContextPackage } = request;

    const distinctTypeCount = countDistinctTypes(typedContextPackage);

    // Derive query
    const query =
      `ContextPackager: segments=${typedContextPackage.totalSegments}, ` +
      `tokens=${typedContextPackage.estimatedTokens}, ` +
      `types=${distinctTypeCount}`;

    // Extract contextId
    const contextId = typedContextPackage.contextId;

    // Build warnings (severity-ordered)
    const warnings: string[] = [];
    if (typedContextPackage.totalSegments === 0) {
      warnings.push("WARNING_NO_SEGMENTS");
    }
    if (typedContextPackage.estimatedTokens === 0) {
      warnings.push("WARNING_TOKEN_BUDGET_ZERO");
    }
    if (typedContextPackage.perTypeTokens.KNOWLEDGE === 0) {
      warnings.push("WARNING_NO_KNOWLEDGE_TOKENS");
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
      "w2-t35-cp1-context-packager-consumer-pipeline",
      typedContextPackage.packageHash,
      consumerPackage.pipelineHash,
      `segments=${typedContextPackage.totalSegments}`,
      `tokens=${typedContextPackage.estimatedTokens}`,
      `types=${distinctTypeCount}`,
      `warnings=${warnings.length}`,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w2-t35-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      typedContextPackage,
      consumerPackage,
      query,
      contextId,
      distinctTypeCount,
      warnings,
      consumerId: request.consumerId,
      pipelineHash,
    };
  }
}

export function createContextPackagerConsumerPipelineContract(
  dependencies?: ContextPackagerConsumerPipelineContractDependencies,
): ContextPackagerConsumerPipelineContract {
  return new ContextPackagerConsumerPipelineContract(dependencies);
}
