import type { GatewayAuthResult, AuthStatus } from "./gateway.auth.contract";
import { GatewayAuthLogContract } from "./gateway.auth.log.contract";
import type { GatewayAuthLog } from "./gateway.auth.log.contract";
import {
  createDeterministicBatchIdentity,
  resolveDominantByCount,
} from "./batch.contract.shared";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GatewayAuthLogBatchDominantStatus = AuthStatus | "EMPTY";

export interface GatewayAuthLogBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalLogs: number;
  totalRequests: number;
  authenticatedCount: number;
  deniedCount: number;
  expiredCount: number;
  revokedCount: number;
  dominantAuthStatus: GatewayAuthLogBatchDominantStatus;
  logs: GatewayAuthLog[];
}

export interface GatewayAuthLogBatchContractDependencies {
  now?: () => string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveDominantAuthStatus(
  authenticatedCount: number,
  deniedCount: number,
  expiredCount: number,
  revokedCount: number,
): GatewayAuthLogBatchDominantStatus {
  return resolveDominantByCount<AuthStatus, "EMPTY">(
    {
      REVOKED: revokedCount,
      EXPIRED: expiredCount,
      DENIED: deniedCount,
      AUTHENTICATED: authenticatedCount,
    },
    ["REVOKED", "EXPIRED", "DENIED", "AUTHENTICATED"],
    "EMPTY",
  );
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * GatewayAuthLogBatchContract (W41-T1 CP1 — Full Lane GC-019)
 * -------------------------------------------------------------
 * Batches multiple GatewayAuthResult[] sets through GatewayAuthLogContract.log()
 * into a governed batch summary.
 *
 * Fields:
 *   totalLogs            = count of entries
 *   totalRequests        = sum(log.totalRequests) across all logs
 *   authenticatedCount   = sum(log.authenticatedCount) across all logs
 *   deniedCount          = sum(log.deniedCount) across all logs
 *   expiredCount         = sum(log.expiredCount) across all logs
 *   revokedCount         = sum(log.revokedCount) across all logs
 *   dominantAuthStatus   = status with highest aggregate count; tie-broken by
 *                          precedence (REVOKED > EXPIRED > DENIED > AUTHENTICATED)
 *                          "EMPTY" when all counts are zero
 *   batchHash            = hash of all logHashes + createdAt
 *   batchId              = hash(batchHash) — distinct from batchHash
 *   logs                 = full GatewayAuthLog[] in input order
 */
export class GatewayAuthLogBatchContract {
  private readonly now: () => string;

  constructor(dependencies: GatewayAuthLogBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    entries: GatewayAuthResult[][],
    log: GatewayAuthLogContract,
  ): GatewayAuthLogBatch {
    const createdAt = this.now();
    const logs: GatewayAuthLog[] = entries.map((results) => log.log(results));

    const totalLogs = logs.length;
    const totalRequests = logs.reduce((sum, l) => sum + l.totalRequests, 0);
    const authenticatedCount = logs.reduce(
      (sum, l) => sum + l.authenticatedCount,
      0,
    );
    const deniedCount = logs.reduce((sum, l) => sum + l.deniedCount, 0);
    const expiredCount = logs.reduce((sum, l) => sum + l.expiredCount, 0);
    const revokedCount = logs.reduce((sum, l) => sum + l.revokedCount, 0);

    const dominantAuthStatus = resolveDominantAuthStatus(
      authenticatedCount,
      deniedCount,
      expiredCount,
      revokedCount,
    );

    const { batchHash, batchId } = createDeterministicBatchIdentity({
      batchSeed: "w41-t1-cp1-gateway-auth-log-batch",
      batchIdSeed: "w41-t1-cp1-gateway-auth-log-batch-id",
      hashParts: [...logs.map((l) => l.logHash), createdAt],
    });

    return {
      batchId,
      batchHash,
      createdAt,
      totalLogs,
      totalRequests,
      authenticatedCount,
      deniedCount,
      expiredCount,
      revokedCount,
      dominantAuthStatus,
      logs,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createGatewayAuthLogBatchContract(
  dependencies?: GatewayAuthLogBatchContractDependencies,
): GatewayAuthLogBatchContract {
  return new GatewayAuthLogBatchContract(dependencies);
}
