import type { RouteMatchResult, GatewayAction } from "./route.match.contract";
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

export interface RouteMatchConsumerPipelineRequest {
  routeMatchResult: RouteMatchResult;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface RouteMatchConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  routeMatchResult: RouteMatchResult;
  consumerPackage: ControlPlaneConsumerPackage;
  query: string;
  contextId: string;
  warnings: string[];
  consumerId: string | undefined;
  pipelineHash: string;
}

export interface RouteMatchConsumerPipelineContractDependencies {
  now?: () => string;
}

// --- Contract ---

export class RouteMatchConsumerPipelineContract {
  private readonly consumerPipelineContract: ControlPlaneConsumerPipelineContract;
  private readonly now: () => string;

  constructor(
    dependencies: RouteMatchConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    const consumerDeps: ControlPlaneConsumerPipelineContractDependencies = {
      now: this.now,
    };
    this.consumerPipelineContract = createControlPlaneConsumerPipelineContract(consumerDeps);
  }

  execute(
    request: RouteMatchConsumerPipelineRequest,
  ): RouteMatchConsumerPipelineResult {
    const createdAt = this.now();
    const { routeMatchResult } = request;

    // Derive query from route match result
    const action = routeMatchResult.gatewayAction;
    const matched = routeMatchResult.matched ? "yes" : "no";
    const pattern = routeMatchResult.matchedPattern ?? "none";
    const query = `RouteMatch: action=${action}, matched=${matched}, pattern=${pattern}`;

    // Extract contextId
    const contextId = routeMatchResult.matchId;

    // Build warnings
    const warnings: string[] = [];
    if (!routeMatchResult.matched) {
      warnings.push("WARNING_NO_MATCH");
    }
    if (routeMatchResult.gatewayAction === "REJECT") {
      warnings.push("WARNING_REJECTED");
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
      "w1-t30-cp1-route-match-consumer-pipeline",
      routeMatchResult.matchHash,
      consumerPackage.pipelineHash,
      `warnings=${warnings.length}`,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w1-t30-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      routeMatchResult,
      consumerPackage,
      query,
      contextId,
      warnings,
      consumerId: request.consumerId,
      pipelineHash,
    };
  }
}

export function createRouteMatchConsumerPipelineContract(
  dependencies?: RouteMatchConsumerPipelineContractDependencies,
): RouteMatchConsumerPipelineContract {
  return new RouteMatchConsumerPipelineContract(dependencies);
}
