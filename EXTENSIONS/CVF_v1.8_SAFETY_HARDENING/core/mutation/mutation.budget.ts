// CVF v1.8 — Mutation Budget Enforcer
// Guards that file and line budgets are not exceeded.

import type { MutationBudget, ExecutionMode } from '../../types/index.js'

export class BudgetExceededError extends Error {
    constructor(
        public readonly executionId: string,
        public readonly dimension: 'files' | 'lines',
        public readonly used: number,
        public readonly max: number
    ) {
        super(
            `[CVF v1.8] BUDGET EXCEEDED: executionId=${executionId} ` +
            `${dimension}: used=${used} max=${max}. Mutation rejected.`
        )
        this.name = 'BudgetExceededError'
    }
}

export class MutationBudgetEnforcer {
    /**
     * Validate a proposed mutation against the current budget.
     * Throws BudgetExceededError if plan exceeds limits.
     */
    validate(
        executionId: string,
        budget: MutationBudget,
        proposedFiles: number,
        proposedLines: number
    ): void {
        const totalFiles = budget.usedFiles + proposedFiles
        const totalLines = budget.usedLines + proposedLines

        if (totalFiles > budget.maxFiles) {
            throw new BudgetExceededError(executionId, 'files', totalFiles, budget.maxFiles)
        }

        if (totalLines > budget.maxLines) {
            throw new BudgetExceededError(executionId, 'lines', totalLines, budget.maxLines)
        }
    }

    /**
     * Returns budget for a given mode.
     */
    budgetForMode(mode: ExecutionMode): Pick<MutationBudget, 'maxFiles' | 'maxLines'> {
        const budgets: Record<ExecutionMode, Pick<MutationBudget, 'maxFiles' | 'maxLines'>> = {
            SAFE: { maxFiles: 2, maxLines: 50 },
            BALANCED: { maxFiles: 5, maxLines: 150 },
            CREATIVE: { maxFiles: 10, maxLines: 300 },
        }
        return budgets[mode]
    }

    remainingCapacity(budget: MutationBudget): { files: number; lines: number } {
        return {
            files: budget.maxFiles - budget.usedFiles,
            lines: budget.maxLines - budget.usedLines,
        }
    }
}
