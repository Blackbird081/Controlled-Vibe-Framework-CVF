export type RiskLevel = "R0" | "R1" | "R2" | "R3";
export type Verdict = "ALLOW" | "WARN" | "ESCALATE" | "BLOCK";

export interface SessionSnapshot {
  sessionId: string;
  agentId: string;
  actionCount: number;
  cumulativeRisk: number;
  highestRisk: RiskLevel;
  verdictCounts: Record<Verdict, number>;
  domainBreakdown: Record<string, number>;
  startedAt: number;
  endedAt?: number;
}

export interface GovernanceMetrics {
  totalSessions: number;
  totalActions: number;
  totalBlocks: number;
  totalEscalations: number;
  avgRiskScore: number;
  riskDistribution: Record<RiskLevel, number>;
  verdictDistribution: Record<Verdict, number>;
  domainActivity: Record<string, number>;
  topViolations: Array<{ rule: string; count: number }>;
}

export interface CanvasReport {
  title: string;
  generatedAt: number;
  metrics: GovernanceMetrics;
  sessions: SessionSnapshot[];
  textReport: string;
  markdownReport: string;
}

export interface CanvasConfig {
  title: string;
  includeSessionDetails: boolean;
  maxTopViolations: number;
  riskBarWidth: number;
}

export const DEFAULT_CANVAS_CONFIG: CanvasConfig = {
  title: "CVF Governance Canvas",
  includeSessionDetails: true,
  maxTopViolations: 10,
  riskBarWidth: 20,
};
