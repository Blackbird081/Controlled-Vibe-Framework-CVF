import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  GatewayAuthLogContract,
  createGatewayAuthLogContract,
} from "./gateway.auth.log.contract";
import type {
  GatewayAuthLogContractDependencies,
  GatewayAuthLog,
} from "./gateway.auth.log.contract";
import type { GatewayAuthResult, AuthStatus } from "./gateway.auth.contract";
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

const WARNING_NO_REQUESTS =
  "[gateway-auth-log] no requests — log contains zero auth requests";
const WARNING_HIGH_DENIAL_RATE =
  "[gateway-auth-log] high denial rate — denied requests exceed 30% of total";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GatewayAuthLogConsumerPipelineRequest {
  results: GatewayAuthResult[];
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface GatewayAuthLogConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  log: GatewayAuthLog;
  dominantStatus: AuthStatus;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
  consumerId: string | undefined;
}

export interface GatewayAuthLogConsumerPipelineContractDependencies {
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * GatewayAuthLogConsumerPipelineContract (W1-T23 CP1 — Full Lane)
 * ----------------------------------------------------------------
 * Bridges GatewayAuthLogContract into CPF consumer pipeline.
 *
 * Query format: "GatewayAuthLog: {totalRequests} requests, status={dominantStatus}"
 * contextId: log.logId
 *
 * Warnings:
 *   - totalRequests === 0 → WARNING_NO_REQUESTS
 *   - deniedCount / totalRequests > 0.3 → WARNING_HIGH_DENIAL_RATE
 */
export class GatewayAuthLogConsumerPipelineContract {
  private readonly now: () => string;
  private readonly logContract: GatewayAuthLogContract;
  private readonly consumerPipelineContract: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: GatewayAuthLogConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());

    const logDeps: GatewayAuthLogContractDependencies = {
      now: this.now,
    };
    this.logContract = createGatewayAuthLogContract(logDeps);

    const consumerDeps: ControlPlaneConsumerPipelineContractDependencies = {
      now: this.now,
    };
    this.consumerPipelineContract = createControlPlaneConsumerPipelineContract(consumerDeps);
  }

  execute(
    request: GatewayAuthLogConsumerPipelineRequest,
  ): GatewayAuthLogConsumerPipelineResult {
    const createdAt = this.now();

    // Create log
    const log = this.logContract.log(request.results);

    const dominantStatus = log.dominantStatus;

    // Derive query
    const query = `GatewayAuthLog: ${log.totalRequests} requests, status=${dominantStatus}`.slice(0, 120);

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
      warnings.push(WARNING_NO_REQUESTS);
    }
    if (log.totalRequests > 0 && log.deniedCount / log.totalRequests > 0.3) {
      warnings.push(WARNING_HIGH_DENIAL_RATE);
    }

    // Compute pipeline hash
    const pipelineHash = computeDeterministicHash(
      "w1-t23-cp1-gateway-auth-log-consumer-pipeline",
      log.logHash,
      consumerPackage.pipelineHash,
      `warnings=${warnings.length}`,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w1-t23-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      log,
      dominantStatus,
      consumerPackage,
      pipelineHash,
      warnings,
      consumerId: request.consumerId,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createGatewayAuthLogConsumerPipelineContract(
  dependencies?: GatewayAuthLogConsumerPipelineContractDependencies,
): GatewayAuthLogConsumerPipelineContract {
  return new GatewayAuthLogConsumerPipelineContract(dependencies);
}
