// CVF v1.8 — Execution Context Store
// Manages the mutable ExecutionContext per executionId.
// Once committed/rolled back/aborted, context is frozen.

import type {
    ExecutionContext,
    ExecutionPhase,
    ExecutionMode,
    MutationBudget,
    RiskObject,
} from '../../types/index.js'
import { generateExecutionId } from './execution.id.js'

const BUDGET_BY_MODE: Record<ExecutionMode, Pick<MutationBudget, 'maxFiles' | 'maxLines'>> = {
    SAFE: { maxFiles: 2, maxLines: 50 },
    BALANCED: { maxFiles: 5, maxLines: 150 },
    CREATIVE: { maxFiles: 10, maxLines: 300 },
}

const _contexts = new Map<string, ExecutionContext>()

export class ExecutionContextStore {
    /**
     * Creates a new ExecutionContext at INTENT phase.
     * Role and mode are locked from this point.
     */
    create(role: string, mode: ExecutionMode): ExecutionContext {
        const executionId = generateExecutionId()
        const budget = BUDGET_BY_MODE[mode]

        const ctx: ExecutionContext = {
            executionId,
            role,
            mode,
            currentPhase: 'INTENT',
            riskObject: null,
            mutationBudget: {
                ...budget,
                mode,
                usedFiles: 0,
                usedLines: 0,
            },
            snapshotId: null,
            anomalyFlags: [],
            escalationLevel: 0,
        }

        _contexts.set(executionId, ctx)
        return ctx
    }

    get(executionId: string): ExecutionContext {
        const ctx = _contexts.get(executionId)
        if (!ctx) {
            throw new Error(`[CVF v1.8] ExecutionContext not found: executionId=${executionId}`)
        }
        return ctx
    }

    advancePhase(executionId: string, nextPhase: ExecutionPhase): ExecutionContext {
        const ctx = this.get(executionId)
        const updated: ExecutionContext = { ...ctx, currentPhase: nextPhase }
        _contexts.set(executionId, updated)
        return updated
    }

    setRisk(executionId: string, risk: Readonly<RiskObject>): void {
        const ctx = this.get(executionId)
        _contexts.set(executionId, { ...ctx, riskObject: risk })
    }

    setSnapshot(executionId: string, snapshotId: string): void {
        const ctx = this.get(executionId)
        _contexts.set(executionId, { ...ctx, snapshotId })
    }

    addAnomalyFlag(executionId: string, flag: string): void {
        const ctx = this.get(executionId)
        _contexts.set(executionId, { ...ctx, anomalyFlags: [...ctx.anomalyFlags, flag] })
    }

    setEscalationLevel(executionId: string, level: 0 | 1 | 2 | 3): void {
        const ctx = this.get(executionId)
        _contexts.set(executionId, { ...ctx, escalationLevel: level })
    }

    trackMutation(executionId: string, files: number, lines: number): void {
        const ctx = this.get(executionId)
        _contexts.set(executionId, {
            ...ctx,
            mutationBudget: {
                ...ctx.mutationBudget,
                usedFiles: ctx.mutationBudget.usedFiles + files,
                usedLines: ctx.mutationBudget.usedLines + lines,
            },
        })
    }

    /** For testing only */
    _clearAll(): void {
        _contexts.clear()
    }
}
