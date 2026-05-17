export type AgentRole = "executor" | "reviewer" | "planner" | "monitor" | "admin";
export type AgentStatus = "active" | "suspended" | "revoked" | "pending";
export type TrustLevel = "untrusted" | "basic" | "verified" | "elevated" | "full";
export type CredentialType = "api_key" | "token" | "certificate" | "signature";

export interface AgentIdentity {
  agentId: string;
  name: string;
  role: AgentRole;
  status: AgentStatus;
  trustLevel: TrustLevel;
  domains: string[];
  capabilities: string[];
  registeredAt: number;
  lastActiveAt: number;
  metadata: Record<string, unknown>;
}

export interface AgentCredential {
  id: string;
  agentId: string;
  type: CredentialType;
  value: string;
  issuedAt: number;
  expiresAt: number;
  revoked: boolean;
}

export interface IdentityVerification {
  agentId: string;
  verified: boolean;
  trustLevel: TrustLevel;
  credential?: AgentCredential;
  reason: string;
  verifiedAt: number;
}

export interface PermissionGrant {
  agentId: string;
  domain: string;
  actions: string[];
  grantedBy: string;
  grantedAt: number;
  expiresAt?: number;
}
