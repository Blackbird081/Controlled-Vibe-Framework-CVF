import type { GatewayAuthResult, AuthStatus } from "./gateway.auth.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Priority ---

// Dominant: frequency-first; ties broken by DENIED > REVOKED > EXPIRED > AUTHENTICATED
const STATUS_PRIORITY: AuthStatus[] = [
  "DENIED",
  "REVOKED",
  "EXPIRED",
  "AUTHENTICATED",
];

// --- Types ---

export interface GatewayAuthLog {
  logId: string;
  createdAt: string;
  totalRequests: number;
  authenticatedCount: number;
  deniedCount: number;
  expiredCount: number;
  revokedCount: number;
  dominantStatus: AuthStatus;
  logHash: string;
}

export interface GatewayAuthLogContractDependencies {
  now?: () => string;
}

// --- Contract ---

export class GatewayAuthLogContract {
  private readonly now: () => string;

  constructor(dependencies: GatewayAuthLogContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  log(results: GatewayAuthResult[]): GatewayAuthLog {
    const createdAt = this.now();

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

    const counts: Record<AuthStatus, number> = {
      AUTHENTICATED: authenticatedCount,
      DENIED: deniedCount,
      EXPIRED: expiredCount,
      REVOKED: revokedCount,
    };

    let dominantStatus: AuthStatus = "DENIED";
    let maxCount = -1;
    for (const s of STATUS_PRIORITY) {
      if (counts[s] > maxCount) {
        maxCount = counts[s];
        dominantStatus = s;
      }
    }

    const logHash = computeDeterministicHash(
      "w1-t8-cp2-auth-log",
      `${createdAt}:total:${results.length}`,
      `authenticated:${authenticatedCount}:denied:${deniedCount}:expired:${expiredCount}:revoked:${revokedCount}`,
      `dominant:${dominantStatus}`,
    );

    const logId = computeDeterministicHash(
      "w1-t8-cp2-log-id",
      logHash,
      createdAt,
    );

    return {
      logId,
      createdAt,
      totalRequests: results.length,
      authenticatedCount,
      deniedCount,
      expiredCount,
      revokedCount,
      dominantStatus,
      logHash,
    };
  }
}

export function createGatewayAuthLogContract(
  dependencies?: GatewayAuthLogContractDependencies,
): GatewayAuthLogContract {
  return new GatewayAuthLogContract(dependencies);
}
