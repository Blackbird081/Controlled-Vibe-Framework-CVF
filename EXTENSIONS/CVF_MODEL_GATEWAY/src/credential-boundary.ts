import { createHash } from "node:crypto";

export interface CredentialReference {
  providerId: string;
  keyId: string;
  envNames: string[];
}

export interface CredentialMetadata {
  providerId: string;
  keyId: string;
  available: boolean;
  source: "env";
  fingerprint?: string;
  redactedValue?: string;
}

export class CredentialBoundary {
  constructor(private readonly env: Record<string, string | undefined> = process.env) {}

  resolveMetadata(reference: CredentialReference): CredentialMetadata {
    const secret = this.resolveSecret(reference);
    return {
      providerId: reference.providerId,
      keyId: reference.keyId,
      available: Boolean(secret),
      source: "env",
      fingerprint: secret ? fingerprintSecret(secret) : undefined,
      redactedValue: secret ? redactSecret(secret) : undefined,
    };
  }

  resolveSecretForRuntime(reference: CredentialReference): string | undefined {
    return this.resolveSecret(reference);
  }

  private resolveSecret(reference: CredentialReference): string | undefined {
    return reference.envNames
      .map((name) => this.env[name])
      .find((value): value is string => typeof value === "string" && value.trim().length > 0);
  }
}

export function fingerprintSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex").slice(0, 12);
}

export function redactSecret(secret: string): string {
  if (secret.length <= 8) {
    return "[REDACTED]";
  }
  return `${secret.slice(0, 4)}...${secret.slice(-4)}`;
}

/** Native subscription availability is server-observed, never an API secret. */
export interface NativeSubscriptionCredentialReference { source: 'native_subscription'; providerId: 'claude' }
export type BridgeCredentialReference = CredentialReference | NativeSubscriptionCredentialReference;
export type BridgeCredentialMetadata = CredentialMetadata | { source: 'native_subscription'; providerId: 'claude'; available: boolean; executionSurface: 'claude_cli_subscription' };
export type NativeSubscriptionCredentialResolver = (reference: NativeSubscriptionCredentialReference, options: { signal?: AbortSignal; timeoutMs: number }) => Promise<BridgeCredentialMetadata>;
