export type RiskLevel = "R0" | "R1" | "R2" | "R3";

export type EnforcementRecommendation = "ALLOW" | "LOG_ONLY" | "HUMAN_IN_THE_LOOP" | "HARD_BLOCK";

export type RiskDomain =
  | "finance"
  | "privacy"
  | "code_security"
  | "communication"
  | "data"
  | "infrastructure"
  | "general";

export type TargetScope = "internal" | "external" | "unknown";

export interface ActionContext {
  domain: RiskDomain;
  action: string;
  target: string;
  targetScope: TargetScope;
  amount?: number;
  dataClassification?: "public" | "internal" | "confidential" | "restricted";
  agentId?: string;
}

export interface ContextModifiers {
  timeOfDay?: "business_hours" | "after_hours" | "weekend";
  frequency?: number;
  isFirstOccurrence?: boolean;
  hasApproval?: boolean;
  sessionActionCount?: number;
}

export interface BaseRiskScore {
  level: RiskLevel;
  numericScore: number;
  domain: RiskDomain;
  action: string;
  factors: string[];
}

export interface RiskAssessment {
  baseScore: BaseRiskScore;
  contextModifiers: string[];
  finalLevel: RiskLevel;
  finalScore: number;
  enforcement: EnforcementRecommendation;
  timestamp: number;
  reasoning: string[];
}

export interface SessionRisk {
  sessionId: string;
  totalActions: number;
  cumulativeScore: number;
  highestLevel: RiskLevel;
  assessments: RiskAssessment[];
  escalated: boolean;
  startedAt: number;
}
