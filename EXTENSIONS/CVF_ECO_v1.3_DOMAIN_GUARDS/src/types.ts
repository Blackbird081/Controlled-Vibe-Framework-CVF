export type GuardDomain = "finance" | "privacy" | "code_security";

export type GuardVerdict = "ALLOW" | "BLOCK" | "ESCALATE" | "WARN";

export interface GuardRequest {
  domain: GuardDomain;
  action: string;
  target: string;
  params: Record<string, unknown>;
  agentId?: string;
  timestamp?: number;
}

export interface GuardResult {
  verdict: GuardVerdict;
  domain: GuardDomain;
  violations: Violation[];
  warnings: string[];
  metadata: Record<string, unknown>;
}

export interface Violation {
  rule: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
}

export interface DomainGuard {
  domain: GuardDomain;
  evaluate(request: GuardRequest): GuardResult;
}

export interface GuardConfig {
  finance: FinanceGuardConfig;
  privacy: PrivacyGuardConfig;
  codeSecurity: CodeSecurityGuardConfig;
}

export interface FinanceGuardConfig {
  maxTransactionAmount: number;
  dailyLimit: number;
  requireInvoiceAbove: number;
  blockedRecipients: string[];
  currency: string;
}

export interface PrivacyGuardConfig {
  protectedFields: string[];
  allowedExportScopes: string[];
  requireAnonymization: boolean;
  maxDataRetentionDays: number;
  blockedExternalDomains: string[];
}

export interface CodeSecurityGuardConfig {
  blockedCommands: string[];
  blockedPatterns: string[];
  allowedPackageManagers: string[];
  requireCodeReview: boolean;
  maxFileOperationsPerMinute: number;
}
