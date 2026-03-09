export type Domain =
  | "finance"
  | "privacy"
  | "code_security"
  | "communication"
  | "data"
  | "infrastructure"
  | "general";

export type EnforcementLevel = "HARD_BLOCK" | "HUMAN_IN_THE_LOOP" | "LOG_ONLY";

export type RiskLevel = "R0" | "R1" | "R2" | "R3";

export interface IntentResult {
  domain: Domain;
  action: string;
  object: string;
  limits: Record<string, unknown>;
  requireApproval: boolean;
  confidence: number;
  rawVibe: string;
}

export interface GovernanceRule {
  id: string;
  domain: Domain;
  enforcement: EnforcementLevel;
  condition: string;
  parameters: Record<string, unknown>;
  riskLevel: RiskLevel;
}

export interface RuntimeConstraint {
  constraintId: string;
  ruleId: string;
  type: "threshold" | "whitelist" | "blacklist" | "approval_gate" | "rate_limit";
  field: string;
  value: unknown;
  enforcement: EnforcementLevel;
  injectable: boolean;
}

export interface ValidatedIntent {
  intent: IntentResult;
  rules: GovernanceRule[];
  constraints: RuntimeConstraint[];
  timestamp: number;
  pipelineVersion: string;
  valid: boolean;
  errors: string[];
}

export interface DomainDefinition {
  domain: Domain;
  keywords: string[];
  actions: string[];
  defaultRisk: RiskLevel;
  defaultEnforcement: EnforcementLevel;
}
