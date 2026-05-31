import {
  CONTEXT_BUDGET_POLICY_VERSION,
  type ContextTaskClass,
  getContextBudget,
  resolveTaskClass,
} from "./context-budget-policy.js";

export const CONTEXT_BUDGET_GUARD_VERSION = "cvf.contextBudgetGuard.cbg1.v1";

export type ContextBudgetGuardDisposition = "PASS" | "ESCALATE";

export interface ContextBudgetGuardResult {
  contractVersion: typeof CONTEXT_BUDGET_GUARD_VERSION;
  policyVersion: typeof CONTEXT_BUDGET_POLICY_VERSION;
  taskClass: ContextTaskClass;
  budgetTokens: number;
  estimatedTokens: number;
  withinBudget: boolean;
  disposition: ContextBudgetGuardDisposition;
  escalationReason: string | null;
  advisoryNote: string;
  runtimeExecutionAuthorized: false;
}

/**
 * Checks estimated context token usage against the policy budget for the
 * given role's task class.
 *
 * Disposition PASS: within budget — proceed.
 * Disposition ESCALATE: over budget — caller should surface to human or narrow
 * task scope before proceeding (advisory signal; does not auto-block execution).
 *
 * When estimatedTokens is 0, the check is considered PASS (no estimate available).
 */
export function checkContextBudgetGuard(
  role: string,
  estimatedTokens: number,
): ContextBudgetGuardResult {
  const taskClass = resolveTaskClass(role);
  const policy = getContextBudget(taskClass);
  const withinBudget = estimatedTokens === 0 || estimatedTokens <= policy.budgetTokens;
  const disposition: ContextBudgetGuardDisposition = withinBudget ? "PASS" : "ESCALATE";

  const escalationReason = withinBudget
    ? null
    : `Context estimate (${estimatedTokens} tokens) exceeds advisory budget (${policy.budgetTokens} tokens) for ${taskClass} task class. Narrow task scope or split into smaller tasks per CVF context management advisory (LHW18 T3 P2).`;

  const advisoryNote = withinBudget
    ? `Context within budget for ${taskClass} (${estimatedTokens}/${policy.budgetTokens} tokens). Proceed.`
    : `Context OVER budget for ${taskClass} (${estimatedTokens}/${policy.budgetTokens} tokens). Escalate to human or reduce scope before execution.`;

  return {
    contractVersion: CONTEXT_BUDGET_GUARD_VERSION,
    policyVersion: CONTEXT_BUDGET_POLICY_VERSION,
    taskClass,
    budgetTokens: policy.budgetTokens,
    estimatedTokens,
    withinBudget,
    disposition,
    escalationReason,
    advisoryNote,
    runtimeExecutionAuthorized: false,
  };
}

/**
 * Convenience overload: resolve task class from role string, then check.
 * Equivalent to checkContextBudgetGuard(role, estimatedTokens).
 */
export function checkContextBudgetGuardForTaskClass(
  taskClass: ContextTaskClass,
  estimatedTokens: number,
): ContextBudgetGuardResult {
  const policy = getContextBudget(taskClass);
  const withinBudget = estimatedTokens === 0 || estimatedTokens <= policy.budgetTokens;
  const disposition: ContextBudgetGuardDisposition = withinBudget ? "PASS" : "ESCALATE";

  const escalationReason = withinBudget
    ? null
    : `Context estimate (${estimatedTokens} tokens) exceeds advisory budget (${policy.budgetTokens} tokens) for ${taskClass} task class.`;

  const advisoryNote = withinBudget
    ? `Context within budget for ${taskClass} (${estimatedTokens}/${policy.budgetTokens} tokens). Proceed.`
    : `Context OVER budget for ${taskClass} (${estimatedTokens}/${policy.budgetTokens} tokens). Escalate or reduce scope.`;

  return {
    contractVersion: CONTEXT_BUDGET_GUARD_VERSION,
    policyVersion: CONTEXT_BUDGET_POLICY_VERSION,
    taskClass,
    budgetTokens: policy.budgetTokens,
    estimatedTokens,
    withinBudget,
    disposition,
    escalationReason,
    advisoryNote,
    runtimeExecutionAuthorized: false,
  };
}
