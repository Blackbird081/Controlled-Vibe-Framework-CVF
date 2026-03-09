/**
 * Mutation Budget Guard — Track IV Phase A.1
 *
 * Enforces mutation budget limits per request.
 * Prevents agents from making excessive changes in a single action.
 *
 * Rules:
 *   - If mutationCount exceeds mutationBudget → BLOCK
 *   - If mutationCount > 80% of budget → ESCALATE (warning)
 *   - If no budget specified → use default based on risk level
 */

import {
  Guard,
  GuardRequestContext,
  GuardResult,
  CVFRiskLevel,
} from '../guard.runtime.types.js';

const DEFAULT_MUTATION_BUDGETS: Record<CVFRiskLevel, number> = {
  R0: 50,
  R1: 20,
  R2: 10,
  R3: 3,
};

const ESCALATION_THRESHOLD = 0.8;

export class MutationBudgetGuard implements Guard {
  id = 'mutation_budget';
  name = 'Mutation Budget Guard';
  description = 'Enforces mutation budget limits to prevent excessive changes.';
  priority = 40;
  enabled = true;

  evaluate(context: GuardRequestContext): GuardResult {
    const timestamp = new Date().toISOString();
    const budget = context.mutationBudget ?? DEFAULT_MUTATION_BUDGETS[context.riskLevel] ?? 20;
    const count = context.mutationCount ?? 0;

    if (count > budget) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: `Mutation count (${count}) exceeds budget (${budget}) for risk level "${context.riskLevel}".`,
        timestamp,
        metadata: { mutationCount: count, mutationBudget: budget, riskLevel: context.riskLevel },
      };
    }

    if (count > budget * ESCALATION_THRESHOLD) {
      return {
        guardId: this.id,
        decision: 'ESCALATE',
        severity: 'WARN',
        reason: `Mutation count (${count}) is at ${Math.round((count / budget) * 100)}% of budget (${budget}). Approaching limit.`,
        timestamp,
        metadata: { mutationCount: count, mutationBudget: budget, usage: count / budget },
      };
    }

    return {
      guardId: this.id,
      decision: 'ALLOW',
      severity: 'INFO',
      reason: `Mutation count (${count}) within budget (${budget}).`,
      timestamp,
    };
  }
}

export { DEFAULT_MUTATION_BUDGETS, ESCALATION_THRESHOLD };
