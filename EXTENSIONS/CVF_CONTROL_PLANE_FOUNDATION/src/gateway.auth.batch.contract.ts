import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type {
  AuthStatus,
  GatewayAuthRequest,
  GatewayAuthResult,
} from "./gateway.auth.contract";
import { GatewayAuthContract } from "./gateway.auth.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GatewayAuthBatchDominantStatus = AuthStatus | "EMPTY";

export interface GatewayAuthBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalRequests: number;
  authenticatedCount: number;
  deniedCount: number;
  expiredCount: number;
  revokedCount: number;
  dominantAuthStatus: GatewayAuthBatchDominantStatus;
  results: GatewayAuthResult[];
}

export interface GatewayAuthBatchContractDependencies {
  now?: () => string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_PRECEDENCE: Record<AuthStatus, number> = {
  REVOKED: 4,
  EXPIRED: 3,
  DENIED: 2,
  AUTHENTICATED: 1,
};

function resolveDominantAuthStatus(
  authenticatedCount: number,
  deniedCount: number,
  expiredCount: number,
  revokedCount: number,
): GatewayAuthBatchDominantStatus {
  const total =
    authenticatedCount + deniedCount + expiredCount + revokedCount;
  if (total === 0) return "EMPTY";

  const candidates: Array<{ status: AuthStatus; count: number }> = [
    { status: "AUTHENTICATED", count: authenticatedCount },
    { status: "DENIED", count: deniedCount },
    { status: "EXPIRED", count: expiredCount },
    { status: "REVOKED", count: revokedCount },
  ];

  return candidates.reduce((best, candidate) => {
    if (candidate.count > best.count) return candidate;
    if (
      candidate.count === best.count &&
      STATUS_PRECEDENCE[candidate.status] > STATUS_PRECEDENCE[best.status]
    )
      return candidate;
    return best;
  }).status;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * GatewayAuthBatchContract (W22-T1 CP1 — Full Lane GC-019)
 * ---------------------------------------------------------
 * Batches GatewayAuthRequest[] through GatewayAuthContract.evaluate() into a
 * governed batch summary.
 *
 * Fields:
 *   authenticatedCount   = count of results where authStatus === "AUTHENTICATED"
 *   deniedCount          = count of results where authStatus === "DENIED"
 *   expiredCount         = count of results where authStatus === "EXPIRED"
 *   revokedCount         = count of results where authStatus === "REVOKED"
 *   dominantAuthStatus   = status with highest count; tie-broken by precedence
 *                          (REVOKED > EXPIRED > DENIED > AUTHENTICATED)
 *                          "EMPTY" when batch is empty
 *   batchHash            = hash of all authHashes + createdAt
 *   batchId              = hash(batchHash) — distinct from batchHash
 *   results              = full GatewayAuthResult[] in input order
 */
export class GatewayAuthBatchContract {
  private readonly now: () => string;

  constructor(dependencies: GatewayAuthBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    requests: GatewayAuthRequest[],
    auth: GatewayAuthContract,
  ): GatewayAuthBatch {
    const createdAt = this.now();
    const results: GatewayAuthResult[] = [];

    for (const request of requests) {
      results.push(auth.evaluate(request));
    }

    const authenticatedCount = results.filter(
      (r) => r.authStatus === "AUTHENTICATED",
    ).length;
    const deniedCount = results.filter(
      (r) => r.authStatus === "DENIED",
    ).length;
    const expiredCount = results.filter(
      (r) => r.authStatus === "EXPIRED",
    ).length;
    const revokedCount = results.filter(
      (r) => r.authStatus === "REVOKED",
    ).length;

    const dominantAuthStatus = resolveDominantAuthStatus(
      authenticatedCount,
      deniedCount,
      expiredCount,
      revokedCount,
    );

    const batchHash = computeDeterministicHash(
      "w22-t1-cp1-gateway-auth-batch",
      ...results.map((r) => r.authHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w22-t1-cp1-gateway-auth-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalRequests: requests.length,
      authenticatedCount,
      deniedCount,
      expiredCount,
      revokedCount,
      dominantAuthStatus,
      results,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createGatewayAuthBatchContract(
  dependencies?: GatewayAuthBatchContractDependencies,
): GatewayAuthBatchContract {
  return new GatewayAuthBatchContract(dependencies);
}
