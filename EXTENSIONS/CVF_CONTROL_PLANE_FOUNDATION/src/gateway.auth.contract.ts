import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type AuthStatus = "AUTHENTICATED" | "DENIED" | "EXPIRED" | "REVOKED";

export interface GatewayCredentials {
  token: string;
  expiresAt?: string; // ISO timestamp; absent = no expiry
  revoked?: boolean;
}

export interface GatewayAuthRequest {
  tenantId: string;
  credentials: GatewayCredentials;
  scope: string[];
  requestedAt?: string;
}

export interface GatewayAuthResult {
  resultId: string;
  evaluatedAt: string;
  tenantId: string;
  authenticated: boolean;
  authStatus: AuthStatus;
  scopeGranted: string[];
  authHash: string;
}

export interface GatewayAuthContractDependencies {
  now?: () => string;
}

// --- Auth evaluation logic ---

function evaluateAuthStatus(
  credentials: GatewayCredentials,
  now: string,
): AuthStatus {
  if (credentials.revoked) return "REVOKED";
  if (
    credentials.expiresAt &&
    new Date(credentials.expiresAt) <= new Date(now)
  ) {
    return "EXPIRED";
  }
  if (!credentials.token || credentials.token.trim().length === 0) {
    return "DENIED";
  }
  return "AUTHENTICATED";
}

// --- Contract ---

export class GatewayAuthContract {
  private readonly now: () => string;

  constructor(dependencies: GatewayAuthContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  evaluate(request: GatewayAuthRequest): GatewayAuthResult {
    const evaluatedAt = this.now();

    const authStatus = evaluateAuthStatus(request.credentials, evaluatedAt);
    const authenticated = authStatus === "AUTHENTICATED";
    const scopeGranted = authenticated ? request.scope : [];

    const authHash = computeDeterministicHash(
      "w1-t8-cp1-gateway-auth",
      `${evaluatedAt}:${request.tenantId}`,
      `status:${authStatus}`,
      `scope:${scopeGranted.join(",")}`,
    );

    const resultId = computeDeterministicHash(
      "w1-t8-cp1-result-id",
      authHash,
      evaluatedAt,
    );

    return {
      resultId,
      evaluatedAt,
      tenantId: request.tenantId,
      authenticated,
      authStatus,
      scopeGranted,
      authHash,
    };
  }
}

export function createGatewayAuthContract(
  dependencies?: GatewayAuthContractDependencies,
): GatewayAuthContract {
  return new GatewayAuthContract(dependencies);
}
