import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  KnowledgeRankingContract,
  createKnowledgeRankingContract,
} from "./knowledge.ranking.contract";
import type {
  KnowledgeRankingRequest,
  KnowledgeRankingContractDependencies,
  RankedKnowledgeResult,
} from "./knowledge.ranking.contract";
import {
  ContextPackagerContract,
  createContextPackagerContract,
} from "./context.packager.contract";
import type {
  SegmentTypeConstraints,
  TypedContextPackage,
  ContextPackagerContractDependencies,
} from "./context.packager.contract";

// --- Types ---

export interface ControlPlaneConsumerRequest {
  rankingRequest: KnowledgeRankingRequest;
  segmentTypeConstraints?: SegmentTypeConstraints;
  maxTokens?: number;
}

export interface ControlPlaneConsumerPackage {
  packageId: string;
  createdAt: string;
  contextId: string;
  query: string;
  rankedKnowledgeResult: RankedKnowledgeResult;
  typedContextPackage: TypedContextPackage;
  pipelineHash: string;
}

export interface ControlPlaneConsumerPipelineContractDependencies {
  now?: () => string;
  rankingContractDeps?: KnowledgeRankingContractDependencies;
  packagerContractDeps?: ContextPackagerContractDependencies;
}

// --- Contract ---

export class ControlPlaneConsumerPipelineContract {
  private readonly now: () => string;
  private readonly rankingContract: KnowledgeRankingContract;
  private readonly packagerContract: ContextPackagerContract;

  constructor(
    dependencies: ControlPlaneConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    const subNow = dependencies.now;
    this.rankingContract = createKnowledgeRankingContract({
      ...dependencies.rankingContractDeps,
      ...(subNow ? { now: subNow } : {}),
    });
    this.packagerContract = createContextPackagerContract({
      ...dependencies.packagerContractDeps,
      ...(subNow ? { now: subNow } : {}),
    });
  }

  execute(request: ControlPlaneConsumerRequest): ControlPlaneConsumerPackage {
    const { rankingRequest, segmentTypeConstraints, maxTokens } = request;

    const rankedKnowledgeResult: RankedKnowledgeResult =
      this.rankingContract.rank(rankingRequest);

    const typedContextPackage: TypedContextPackage = this.packagerContract.pack({
      query: rankingRequest.query,
      contextId: rankingRequest.contextId,
      knowledgeItems: rankedKnowledgeResult.items,
      segmentTypeConstraints,
      maxTokens,
    });

    const createdAt = this.now();

    const pipelineHash = computeDeterministicHash(
      "w1-t13-cp1-consumer-pipeline",
      rankedKnowledgeResult.rankingHash,
      typedContextPackage.packageHash,
      createdAt,
    );

    const packageId = computeDeterministicHash(
      "w1-t13-cp1-consumer-package-id",
      pipelineHash,
      rankingRequest.contextId,
    );

    return {
      packageId,
      createdAt,
      contextId: rankingRequest.contextId,
      query: rankingRequest.query,
      rankedKnowledgeResult,
      typedContextPackage,
      pipelineHash,
    };
  }
}

export function createControlPlaneConsumerPipelineContract(
  dependencies?: ControlPlaneConsumerPipelineContractDependencies,
): ControlPlaneConsumerPipelineContract {
  return new ControlPlaneConsumerPipelineContract(dependencies);
}
