import { AgentRole, IdentityVerification, PermissionGrant, TrustLevel, CredentialType } from "./types";
import { AgentRegistry, resetAgentCounter } from "./agent.registry";
import { CredentialStore, resetCredCounter } from "./credential.store";

export { resetAgentCounter, resetCredCounter };

const TRUST_ORDER: Record<TrustLevel, number> = {
  untrusted: 0, basic: 1, verified: 2, elevated: 3, full: 4,
};

export class IdentityManager {
  private registry: AgentRegistry;
  private credentials: CredentialStore;
  private permissions: PermissionGrant[] = [];

  constructor() {
    this.registry = new AgentRegistry();
    this.credentials = new CredentialStore();
  }

  registerAgent(opts: { name: string; role: AgentRole; domains?: string[]; capabilities?: string[] }) {
    const agent = this.registry.register(opts);
    const cred = this.credentials.issue(agent.agentId, "token");
    return { agent, credential: cred };
  }

  verify(agentId: string, credentialValue: string): IdentityVerification {
    const agent = this.registry.get(agentId);
    if (!agent) {
      return { agentId, verified: false, trustLevel: "untrusted", reason: "Agent not found", verifiedAt: Date.now() };
    }

    if (agent.status !== "active") {
      return { agentId, verified: false, trustLevel: "untrusted", reason: `Agent status: ${agent.status}`, verifiedAt: Date.now() };
    }

    const credResult = this.credentials.validateByValue(credentialValue);
    if (!credResult.valid) {
      return { agentId, verified: false, trustLevel: "untrusted", reason: credResult.reason, verifiedAt: Date.now() };
    }

    if (credResult.credential!.agentId !== agentId) {
      return { agentId, verified: false, trustLevel: "untrusted", reason: "Credential does not belong to agent", verifiedAt: Date.now() };
    }

    this.registry.touch(agentId);

    return {
      agentId,
      verified: true,
      trustLevel: agent.trustLevel,
      credential: credResult.credential,
      reason: "Verified",
      verifiedAt: Date.now(),
    };
  }

  grantPermission(agentId: string, domain: string, actions: string[], grantedBy: string): PermissionGrant | undefined {
    const agent = this.registry.get(agentId);
    if (!agent) return undefined;

    const grant: PermissionGrant = {
      agentId,
      domain,
      actions,
      grantedBy,
      grantedAt: Date.now(),
    };
    this.permissions.push(grant);
    return grant;
  }

  getPermissions(agentId: string): PermissionGrant[] {
    return this.permissions.filter((p) => p.agentId === agentId);
  }

  hasPermission(agentId: string, domain: string, action: string): boolean {
    return this.permissions.some(
      (p) => p.agentId === agentId && p.domain === domain && p.actions.includes(action)
    );
  }

  checkAccess(agentId: string, requiredTrust: TrustLevel): { allowed: boolean; reason: string } {
    const agent = this.registry.get(agentId);
    if (!agent) return { allowed: false, reason: "Agent not found" };
    if (agent.status !== "active") return { allowed: false, reason: `Agent status: ${agent.status}` };

    const agentLevel = TRUST_ORDER[agent.trustLevel];
    const required = TRUST_ORDER[requiredTrust];

    if (agentLevel < required) {
      return { allowed: false, reason: `Trust level ${agent.trustLevel} < required ${requiredTrust}` };
    }
    return { allowed: true, reason: "Access granted" };
  }

  suspendAgent(agentId: string): boolean {
    const updated = this.registry.updateStatus(agentId, "suspended");
    if (updated) this.credentials.revokeAllForAgent(agentId);
    return updated;
  }

  revokeAgent(agentId: string): boolean {
    const updated = this.registry.updateStatus(agentId, "revoked");
    if (updated) this.credentials.revokeAllForAgent(agentId);
    return updated;
  }

  reissueCredential(agentId: string, type: CredentialType = "token") {
    const agent = this.registry.get(agentId);
    if (!agent || agent.status !== "active") return undefined;
    this.credentials.revokeAllForAgent(agentId);
    return this.credentials.issue(agentId, type);
  }

  getRegistry(): AgentRegistry {
    return this.registry;
  }

  getCredentialStore(): CredentialStore {
    return this.credentials;
  }
}
