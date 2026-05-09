/**
 * Mutation Budget Guard — Prevents excessive changes per session
 * @module guards/mutation-budget.guard
 */
import type { Guard, GuardRequestContext, GuardResult, CVFRiskLevel } from './types.js';
export declare const DEFAULT_MUTATION_BUDGETS: Record<CVFRiskLevel, number>;
export declare const ESCALATION_THRESHOLD = 0.8;
export declare class MutationBudgetGuard implements Guard {
    id: string;
    name: string;
    description: string;
    priority: number;
    enabled: boolean;
    evaluate(context: GuardRequestContext): GuardResult;
}
//# sourceMappingURL=mutation-budget.guard.d.ts.map