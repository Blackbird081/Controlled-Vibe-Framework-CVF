import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type {
  GatewayAuthLogConsumerPipelineResult,
} from "./gateway.auth.log.consumer.pipeline.contract";
import type { AuthStatus } from "./gateway.auth.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GatewayAuthLogConsumerPipelineBatchResult {
  batchId: string;
  createdAt: string;
  totalLogs: number;
  totalRequests: number;
  overallDominantStatus: AuthStatus;
  dominantTokenBudget: number;
  results: GatewayAuthLogConsumerPipelineResult[];
  batchHash: string;
}

export interface GatewayAuthLogConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Dominant Status Logic ────────────────────────────────────────────────────

// Frequency-based: most common status wins
const STATUS_ORDER: AuthStatus[] = [
  "DENIED",
  "REVOKED",
  "EXPIRED",
  "AUTHENTICATED",
];

function computeOverallDominantStatus(
  results: GatewayAuthLogConsumerPipelineResult[],
): AuthStatus {
  if (results.length === 0) return "DENIED";

  const statusCounts: Record<string, number> = {};

  for (const result of results) {
    const status = result.dominantStatus;
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;
  }

  let maxCount = 0;
  let dominantStatus: AuthStatus = "DENIED";

  for (const status of STATUS_ORDER) {
    const count = statusCounts[status] ?? 0;
    if (count > maxCount) {
      maxCount = count;
      dominantStatus = status;
    }
  }

  return dominantStatus;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * GatewayAuthLogConsumerPipelineBatchContract (W1-T23 CP2 — Fast Lane GC-021)
 * ----------------------------------------------------------------------------
 * Aggregates multiple GatewayAuthLogConsumerPipelineResult records into a batch.
 *
 * Aggregation:
 *   totalLogs = count of results
 *   totalRequests = sum(result.log.totalRequests)
 *   overallDominantStatus = most frequent status across all logs
 *   dominantTokenBudget = max(result.consumerPackage.typedContextPackage.estimatedTokens)
 */
export class GatewayAuthLogConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: GatewayAuthLogConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: GatewayAuthLogConsumerPipelineResult[],
  ): GatewayAuthLogConsumerPipelineBatchResult {
    const createdAt = this.now();
    const totalLogs = results.length;

    const totalRequests = results.reduce(
      (sum, r) => sum + r.log.totalRequests,
      0,
    );

    const overallDominantStatus = computeOverallDominantStatus(results);

    const dominantTokenBudget =
      totalLogs === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const batchHash = computeDeterministicHash(
      "w1-t23-cp2-gateway-auth-log-consumer-pipeline-batch",
      `totalLogs=${totalLogs}:totalRequests=${totalRequests}`,
      `overallStatus=${overallDominantStatus}`,
      `dominantTokenBudget=${dominantTokenBudget}`,
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w1-t23-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      totalLogs,
      totalRequests,
      overallDominantStatus,
      dominantTokenBudget,
      results,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createGatewayAuthLogConsumerPipelineBatchContract(
  dependencies?: GatewayAuthLogConsumerPipelineBatchContractDependencies,
): GatewayAuthLogConsumerPipelineBatchContract {
  return new GatewayAuthLogConsumerPipelineBatchContract(dependencies);
}
