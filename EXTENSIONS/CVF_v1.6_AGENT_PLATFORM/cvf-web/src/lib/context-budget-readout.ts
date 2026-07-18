import {
  CONTEXT_BUDGET_POLICY_VERSION,
  type ContextTaskClass,
  getContextBudget,
  resolveTaskClass,
} from 'cvf-learning-plane-foundation';

export const CONTEXT_BUDGET_READOUT_VERSION =
  "cvf.contextBudgetReadout.cbp1.v1";

export interface ContextBudgetReadout {
  contractVersion: typeof CONTEXT_BUDGET_READOUT_VERSION;
  policyVersion: typeof CONTEXT_BUDGET_POLICY_VERSION;
  taskClass: ContextTaskClass;
  budgetTokens: number;
  withinBudget: boolean;
  advisoryNote: string;
  runtimeExecutionAuthorized: false;
}

export function buildContextBudgetReadout(
  role: string,
  estimatedContextTokens?: number,
): ContextBudgetReadout {
  const taskClass = resolveTaskClass(role);
  const policy = getContextBudget(taskClass);
  const tokens = estimatedContextTokens ?? 0;
  const withinBudget = tokens === 0 || tokens <= policy.budgetTokens;

  return {
    contractVersion: CONTEXT_BUDGET_READOUT_VERSION,
    policyVersion: CONTEXT_BUDGET_POLICY_VERSION,
    taskClass,
    budgetTokens: policy.budgetTokens,
    withinBudget,
    advisoryNote: withinBudget
      ? `Context within budget for ${taskClass} task class (${tokens}/${policy.budgetTokens} tokens).`
      : `Context exceeds advisory budget for ${taskClass} task class (${tokens}/${policy.budgetTokens} tokens). Consider narrowing task scope per CVF context management advisory.`,
    runtimeExecutionAuthorized: false,
  };
}
