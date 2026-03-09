import { AgentCredential, CredentialType } from "./types";

let credCounter = 0;

function nextCredId(): string {
  credCounter++;
  return `CRED-${String(credCounter).padStart(4, "0")}`;
}

export function resetCredCounter(): void {
  credCounter = 0;
}

function generateValue(type: CredentialType): string {
  const rand = Math.random().toString(36).slice(2, 18);
  switch (type) {
    case "api_key": return `cvf_ak_${rand}`;
    case "token": return `cvf_tk_${rand}`;
    case "certificate": return `cvf_cert_${rand}`;
    case "signature": return `cvf_sig_${rand}`;
  }
}

export class CredentialStore {
  private credentials: Map<string, AgentCredential> = new Map();

  issue(agentId: string, type: CredentialType, ttlMs: number = 3600000): AgentCredential {
    const now = Date.now();
    const cred: AgentCredential = {
      id: nextCredId(),
      agentId,
      type,
      value: generateValue(type),
      issuedAt: now,
      expiresAt: now + ttlMs,
      revoked: false,
    };
    this.credentials.set(cred.id, cred);
    return cred;
  }

  get(credId: string): AgentCredential | undefined {
    return this.credentials.get(credId);
  }

  findByAgent(agentId: string): AgentCredential[] {
    return [...this.credentials.values()].filter((c) => c.agentId === agentId);
  }

  findActiveByAgent(agentId: string): AgentCredential[] {
    const now = Date.now();
    return this.findByAgent(agentId).filter(
      (c) => !c.revoked && c.expiresAt > now
    );
  }

  validate(credId: string): { valid: boolean; reason: string } {
    const cred = this.credentials.get(credId);
    if (!cred) return { valid: false, reason: "Credential not found" };
    if (cred.revoked) return { valid: false, reason: "Credential revoked" };
    if (cred.expiresAt <= Date.now()) return { valid: false, reason: "Credential expired" };
    return { valid: true, reason: "Valid" };
  }

  validateByValue(value: string): { valid: boolean; credential?: AgentCredential; reason: string } {
    const cred = [...this.credentials.values()].find((c) => c.value === value);
    if (!cred) return { valid: false, reason: "Credential not found" };
    if (cred.revoked) return { valid: false, reason: "Credential revoked" };
    if (cred.expiresAt <= Date.now()) return { valid: false, reason: "Credential expired" };
    return { valid: true, credential: cred, reason: "Valid" };
  }

  revoke(credId: string): boolean {
    const cred = this.credentials.get(credId);
    if (!cred) return false;
    cred.revoked = true;
    return true;
  }

  revokeAllForAgent(agentId: string): number {
    let count = 0;
    for (const cred of this.credentials.values()) {
      if (cred.agentId === agentId && !cred.revoked) {
        cred.revoked = true;
        count++;
      }
    }
    return count;
  }

  count(): number {
    return this.credentials.size;
  }

  clear(): void {
    this.credentials.clear();
  }
}
