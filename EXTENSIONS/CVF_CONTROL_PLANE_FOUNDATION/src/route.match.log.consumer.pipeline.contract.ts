import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  RouteMatchLogContract,
  createRouteMatchLogContract,
} from "./route.match.log.contract";
import type {
  RouteMatchLogContractDependencies,
  RouteMatchLog,
} from "./route.match.log.contract";
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

// ─── Warning constants ────────────────────────────────────────────────────────

const WARNING_NO_MATCHES =
  "[route-match-log] no matches — log contains zero route matches";
const WARNING_HIGH_MISMATCH_RATE =
  "[route-match-log] high mismatch rate — unmatched requests exceed 30% of total";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RouteMatchLogConsumerPipelineRequest {
  results: RouteMatchResult[];
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface RouteMatchLogConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  log: RouteMatchLog;
  dominantAction: GatewayAction;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
  consumerId: string | undefined;
}

export interface RouteMatchLogConsumerPipelineContractDependencies {
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * RouteMatchLogConsumerPipelineContract (W1-T25 CP1 — Full Lane)
 * ---------------------------------------------------------------
 * Bridges RouteMatchLogContract into CPF consumer pipeline.
 *
 * Query format: "RouteMatchLog: {totalMatches} matches, action={dominantAction}, mismatches={mismatchCount}"
 * contextId: log.logId
 *
 * Warnings:
 *   - totalRequests === 0 → WARNING_NO_MATCHES
 *   - unmatchedCount / totalRequests > 0.3 → WARNING_HIGH_MISMATCH_RATE
 */
export class RouteMatchLogConsumerPipelineContract {
  private readonly now: () => string;
  private readonly logContract: RouteMatchLogContract;
  private readonly consumerPipelineContract: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: RouteMatchLogConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());

    const logDeps: RouteMatchLogContractDependencies = {
      now: this.now,
    };
    this.logContract = createRouteMatchLogContract(logDeps);

    const consumerDeps: ControlPlaneConsumerPipelineContractDependencies = {
      now: this.now,
    };
    this.consumerPipelineContract = createControlPlaneConsumerPipelineContract(consumerDeps);
  }

  execute(
    request: RouteMatchLogConsumerPipelineRequest,
  ): RouteMatchLogConsumerPipelineResult {
    const createdAt = this.now();

    // Create log
    const log = this.logContract.log(request.results);

    const dominantAction = log.dominantAction;

    // Derive query
    const query = `RouteMatchLog: ${log.matchedCount} matches, action=${dominantAction}, mismatches=${log.unmatchedCount}`.slice(0, 120);

    // Build consumer package
    const consumerPackage = this.consumerPipelineContract.execute({
      rankingRequest: {
        query,
        contextId: log.logId,
        candidateItems: request.candidateItems ?? [],
        scoringWeights: request.scoringWeights,
      },
      segmentTypeConstraints: request.segmentTypeConstraints,
    });

    // Compute warnings
    const warnings: string[] = [];
    if (log.totalRequests === 0) {
      warnings.push(WARNING_NO_MATCHES);
    }
    if (log.totalRequests > 0 && log.unmatchedCount / log.totalRequests > 0.3) {
      warnings.push(WARNING_HIGH_MISMATCH_RATE);
    }

    // Compute pipeline hash
    const pipelineHash = computeDeterministicHash(
      "w1-t25-cp1-route-match-log-consumer-pipeline",
      log.logHash,
      consumerPackage.pipelineHash,
      `warnings=${warnings.length}`,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w1-t25-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      log,
      dominantAction,
      consumerPackage,
      pipelineHash,
      warnings,
      consumerId: request.consumerId,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createRouteMatchLogConsumerPipelineContract(
  dependencies?: RouteMatchLogConsumerPipelineContractDependencies,
): RouteMatchLogConsumerPipelineContract {
  return new RouteMatchLogConsumerPipelineContract(dependencies);
}
