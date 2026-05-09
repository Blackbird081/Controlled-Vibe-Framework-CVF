/**
 * Mutation Budget Guard — Prevents excessive changes per session
 * @module guards/mutation-budget.guard
 */
export const DEFAULT_MUTATION_BUDGETS = {
    R0: 50,
    R1: 20,
    R2: 10,
    R3: 3,
};
export const ESCALATION_THRESHOLD = 0.8;
export class MutationBudgetGuard {
    id = 'mutation_budget';
    name = 'Mutation Budget Guard';
    description = 'Enforces mutation budget limits to prevent excessive changes.';
    priority = 40;
    enabled = true;
    evaluate(context) {
        const timestamp = new Date().toISOString();
        const budget = context.mutationBudget ?? DEFAULT_MUTATION_BUDGETS[context.riskLevel] ?? 20;
        const count = context.mutationCount ?? 0;
        if (count > budget) {
            return {
                guardId: this.id,
                decision: 'BLOCK',
                severity: 'ERROR',
                reason: `Mutation count (${count}) exceeds budget (${budget}) for risk level "${context.riskLevel}".`,
                agentGuidance: `You have made ${count} changes but the budget for risk level ${context.riskLevel} is only ${budget}. Stop making changes and request a budget increase from the human operator, or commit your current work and start a new session.`,
                suggestedAction: 'stop_and_request_budget_increase',
                timestamp,
                metadata: { mutationCount: count, mutationBudget: budget, riskLevel: context.riskLevel },
            };
        }
        if (count > budget * ESCALATION_THRESHOLD) {
            const pct = Math.round((count / budget) * 100);
            return {
                guardId: this.id,
                decision: 'ESCALATE',
                severity: 'WARN',
                reason: `Mutation count (${count}) is at ${pct}% of budget (${budget}). Approaching limit.`,
                agentGuidance: `You have used ${pct}% of your mutation budget (${count}/${budget}). Prioritize your remaining changes carefully. Consider committing current work before proceeding.`,
                suggestedAction: 'prioritize_remaining_changes',
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
//# sourceMappingURL=mutation-budget.guard.js.map