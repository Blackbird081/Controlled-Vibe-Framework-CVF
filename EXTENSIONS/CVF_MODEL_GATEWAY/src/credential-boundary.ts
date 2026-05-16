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
    return reference.envNames.map((name) => this.env[name]).find((value) => Boolean(value));
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
