import type { RouteMatchResult, GatewayAction } from "./route.match.contract";
import { RouteMatchLogContract } from "./route.match.log.contract";
import type { RouteMatchLog } from "./route.match.log.contract";
import {
  createDeterministicBatchIdentity,
  resolveDominantByCount,
} from "./batch.contract.shared";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RouteMatchLogBatchDominantAction = GatewayAction | "EMPTY";

export interface RouteMatchLogBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalLogs: number;
  totalRequests: number;
  matchedCount: number;
  unmatchedCount: number;
  forwardCount: number;
  rejectCount: number;
  rerouteCount: number;
  passthroughCount: number;
  overallDominantAction: RouteMatchLogBatchDominantAction;
  logs: RouteMatchLog[];
}

export interface RouteMatchLogBatchContractDependencies {
  now?: () => string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACTION_PRECEDENCE: readonly GatewayAction[] = [
  "REJECT",
  "REROUTE",
  "FORWARD",
  "PASSTHROUGH",
];

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * RouteMatchLogBatchContract (W43-T1 CP1 — Full Lane GC-019)
 * -----------------------------------------------------------
 * Batches multiple RouteMatchResult[] sets through
 * RouteMatchLogContract.log() into a governed batch summary.
 *
 * Fields:
 *   totalLogs              = count of entries
 *   totalRequests          = sum(log.totalRequests) across all logs
 *   matchedCount           = sum(log.matchedCount) across all logs
 *   unmatchedCount         = sum(log.unmatchedCount) across all logs
 *   forwardCount           = sum(log.forwardCount) across all logs
 *   rejectCount            = sum(log.rejectCount) across all logs
 *   rerouteCount           = sum(log.rerouteCount) across all logs
 *   passthroughCount       = sum(log.passthroughCount) across all logs
 *   overallDominantAction  = resolveDominantByCount with precedence
 *                            REJECT > REROUTE > FORWARD > PASSTHROUGH;
 *                            "EMPTY" when all action counts are zero
 *   batchHash              = hash of all logHashes + createdAt
 *   batchId                = hash(batchHash) — distinct from batchHash
 *   logs                   = full RouteMatchLog[] in input order
 */
export class RouteMatchLogBatchContract {
  private readonly now: () => string;

  constructor(dependencies: RouteMatchLogBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    entries: RouteMatchResult[][],
    log: RouteMatchLogContract,
  ): RouteMatchLogBatch {
    const createdAt = this.now();
    const logs: RouteMatchLog[] = entries.map((results) => log.log(results));

    const totalLogs = logs.length;
    const totalRequests = logs.reduce((sum, l) => sum + l.totalRequests, 0);
    const matchedCount = logs.reduce((sum, l) => sum + l.matchedCount, 0);
    const unmatchedCount = logs.reduce((sum, l) => sum + l.unmatchedCount, 0);
    const forwardCount = logs.reduce((sum, l) => sum + l.forwardCount, 0);
    const rejectCount = logs.reduce((sum, l) => sum + l.rejectCount, 0);
    const rerouteCount = logs.reduce((sum, l) => sum + l.rerouteCount, 0);
    const passthroughCount = logs.reduce(
      (sum, l) => sum + l.passthroughCount,
      0,
    );

    const overallDominantAction = resolveDominantByCount<GatewayAction, "EMPTY">(
      {
        REJECT: rejectCount,
        REROUTE: rerouteCount,
        FORWARD: forwardCount,
        PASSTHROUGH: passthroughCount,
      },
      ACTION_PRECEDENCE,
      "EMPTY",
    );

    const { batchHash, batchId } = createDeterministicBatchIdentity({
      batchSeed: "w43-t1-cp1-route-match-log-batch",
      batchIdSeed: "w43-t1-cp1-route-match-log-batch-id",
      hashParts: [...logs.map((l) => l.logHash), createdAt],
    });

    return {
      batchId,
      batchHash,
      createdAt,
      totalLogs,
      totalRequests,
      matchedCount,
      unmatchedCount,
      forwardCount,
      rejectCount,
      rerouteCount,
      passthroughCount,
      overallDominantAction,
      logs,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createRouteMatchLogBatchContract(
  dependencies?: RouteMatchLogBatchContractDependencies,
): RouteMatchLogBatchContract {
  return new RouteMatchLogBatchContract(dependencies);
}
