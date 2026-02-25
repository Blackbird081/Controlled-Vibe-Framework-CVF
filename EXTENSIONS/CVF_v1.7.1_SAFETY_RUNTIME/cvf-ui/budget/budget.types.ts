export type BudgetScope =
  | "EXECUTION"
  | "USER_DAILY"
  | "ORG_MONTHLY"
  | "SESSION_LOOP";

export interface BudgetPolicy {
  scope: BudgetScope;
  hardLimitUsd: number;
  softLimitUsd?: number;
  maxTokens?: number;
}

export interface BudgetCheckInput {
  userId: string;
  role: string;
  estimatedCostUsd: number;
  estimatedTokens: number;
  sessionId?: string;
}

export interface BudgetCheckResult {
  allowed: boolean;
  reason?: string;
  remainingUsd?: number;
}