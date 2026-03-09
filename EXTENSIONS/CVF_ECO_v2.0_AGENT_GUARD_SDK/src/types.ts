export type GovernanceDomain = "finance" | "privacy" | "code_security" | "communication" | "data" | "infrastructure" | "general";

export type ActionVerdict = "ALLOW" | "WARN" | "ESCALATE" | "BLOCK";

export type RiskLevel = "R0" | "R1" | "R2" | "R3";

export interface AgentAction {
  agentId: string;
  action: string;
  target: string;
  domain: GovernanceDomain;
  params: Record<string, unknown>;
  timestamp?: number;
}

export interface GovernanceDecision {
  action: AgentAction;
  verdict: ActionVerdict;
  riskLevel: RiskLevel;
  riskScore: number;
  violations: ViolationDetail[];
  warnings: string[];
  reasoning: string[];
  policyMatches: string[];
  timestamp: number;
  durationMs: number;
}

export interface ViolationDetail {
  rule: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  domain: GovernanceDomain;
}

export interface AgentSession {
  sessionId: string;
  agentId: string;
  startedAt: number;
  decisions: GovernanceDecision[];
  cumulativeRisk: number;
  highestRisk: RiskLevel;
  actionCount: number;
}

export interface SDKConfig {
  enableRiskScoring: boolean;
  enableDomainGuards: boolean;
  enablePolicyCheck: boolean;
  enableAuditLog: boolean;
  maxSessionActions: number;
  autoEscalateAtRisk: RiskLevel;
}

export const DEFAULT_SDK_CONFIG: SDKConfig = {
  enableRiskScoring: true,
  enableDomainGuards: true,
  enablePolicyCheck: true,
  enableAuditLog: true,
  maxSessionActions: 100,
  autoEscalateAtRisk: "R3",
};

export interface AuditEntry {
  id: string;
  sessionId: string;
  decision: GovernanceDecision;
  timestamp: number;
}
