export type EnforcementLevel = "HARD_BLOCK" | "HUMAN_IN_THE_LOOP" | "LOG_ONLY" | "REJECT_AND_RETRY";

export type PolicyDomain =
  | "finance"
  | "privacy"
  | "code_security"
  | "communication"
  | "data"
  | "infrastructure"
  | "quality"
  | "transparency"
  | "budget"
  | "general";

export type PolicyStatus = "draft" | "active" | "deprecated" | "archived";

export interface PolicyRule {
  id: string;
  intentDomain: PolicyDomain;
  actionTrigger: string;
  constraints: Record<string, unknown>;
  enforcement: EnforcementLevel;
  description: string;
}

export interface PolicyDocument {
  id: string;
  name: string;
  version: number;
  status: PolicyStatus;
  createdAt: number;
  updatedAt: number;
  sourceVibes: string[];
  rules: PolicyRule[];
  metadata: PolicyMetadata;
}

export interface PolicyMetadata {
  author: string;
  templateId?: string;
  tags: string[];
  scope: "global" | "domain" | "agent" | "task";
}

export interface PolicyConflict {
  ruleA: PolicyRule;
  ruleB: PolicyRule;
  conflictType: "contradiction" | "overlap" | "subsumption";
  description: string;
}

export interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  domain: PolicyDomain;
  rules: Omit<PolicyRule, "id">[];
  parameters: TemplateParameter[];
}

export interface TemplateParameter {
  name: string;
  type: "number" | "string" | "boolean" | "string[]";
  defaultValue: unknown;
  description: string;
}

export interface SerializedPolicy {
  schema: string;
  version: number;
  governance_rules: SerializedRule[];
  metadata: Record<string, unknown>;
}

export interface SerializedRule {
  intent_domain: string;
  action_trigger: string;
  constraints: Record<string, unknown>;
  enforcement: string;
}
