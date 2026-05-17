// CVF v1.8 — Lifecycle Controller
// Main orchestrator of the 7-phase execution state machine.
// AI is an untrusted executor. Kernel is the trusted authority.

import type {
    ExecutionContext,
    ExecutionMode,
    RiskDimensions,
    MutationPlan,
    MutationResult,
    CommitRecord,
} from '../../types/index.js'
import { ExecutionContextStore } from './execution.context.js'
import { PhaseGuard, PhaseViolationError } from './phase.guard.js'
import { RiskScorer } from '../risk/risk.scorer.js'
import { RiskLock } from '../risk/risk.lock.js'
import { EscalationController } from '../governance/escalation.controller.js'
import { MutationBudgetEnforcer, BudgetExceededError } from '../mutation/mutation.budget.js'
import { SnapshotEnforcer } from '../mutation/snapshot.enforcer.js'
import { RollbackManager, computeCommitHash } from '../rollback/rollback.manager.js'
import { AnomalyDetector } from '../anomaly/anomaly.detector.js'
import { createHash } from 'crypto'

export interface LifecycleControllerDeps {
    contextStore?: ExecutionContextStore
    phaseGuard?: PhaseGuard
    riskScorer?: RiskScorer
    riskLock?: RiskLock
    escalation?: EscalationController
    budgetEnforcer?: MutationBudgetEnforcer
    snapshotEnforcer?: SnapshotEnforcer
    rollbackManager?: RollbackManager
    anomalyDetector?: AnomalyDetector
}

export class LifecycleController {
    private ctx: ExecutionContextStore
    private guard: PhaseGuard
    private riskScorer: RiskScorer
    private riskLock: RiskLock
    private escalation: EscalationController
    private budget: MutationBudgetEnforcer
    private snapshots: SnapshotEnforcer
    private rollback: RollbackManager
    private anomaly: AnomalyDetector

    constructor(deps: LifecycleControllerDeps = {}) {
        this.ctx = deps.contextStore ?? new ExecutionContextStore()
        this.guard = deps.phaseGuard ?? new PhaseGuard()
        this.riskScorer = deps.riskScorer ?? new RiskScorer()
        this.riskLock = deps.riskLock ?? new RiskLock()
        this.escalation = deps.escalation ?? new EscalationController()
        this.budget = deps.budgetEnforcer ?? new MutationBudgetEnforcer()
        this.snapshots = deps.snapshotEnforcer ?? new SnapshotEnforcer()
        this.rollback = deps.rollbackManager ?? new RollbackManager(this.snapshots)
        this.anomaly = deps.anomalyDetector ?? new AnomalyDetector()
    }

    // ─── Phase 1: INTENT ─────────────────────────────────────────────────────────

    /**
     * Start a new execution. Role and mode are locked from this point.
     * Returns the executionId for all subsequent calls.
     */
    startIntent(role: string, mode: ExecutionMode): ExecutionContext {
        return this.ctx.create(role, mode)
    }

    // ─── Phase 2: ANALYSIS ───────────────────────────────────────────────────────

    /**
     * Advance to ANALYSIS. Scan AI output for early mutation intent.
     * Throws PhaseViolationError if called out of order.
     * Throws if anomalies detected.
     */
    runAnalysis(executionId: string, aiOutput: string): ExecutionContext {
        const context = this.ctx.get(executionId)
        this.guard.validateTransition(executionId, context.currentPhase, 'ANALYSIS')

        const flags = this.anomaly.scan(executionId, aiOutput, 'ANALYSIS')
        if (flags.length > 0) {
            this.ctx.addAnomalyFlag(executionId, flags[0]!.code)
            this.ctx.advancePhase(executionId, 'ABORTED')
            throw new Error(
                `[CVF v1.8] ANALYSIS ANOMALY: ${flags[0]!.message}. Execution aborted.`
            )
        }

        return this.ctx.advancePhase(executionId, 'ANALYSIS')
    }

    // ─── Phase 3: RISK_ASSESSMENT ────────────────────────────────────────────────

    /**
     * Compute and lock risk. After this, risk cannot change.
     * Escalates if risk level requires approval or is critical.
     */
    assessRisk(executionId: string, dimensions: RiskDimensions): ExecutionContext {
        const context = this.ctx.get(executionId)
        this.guard.validateTransition(executionId, context.currentPhase, 'RISK_ASSESSMENT')

        const rawRisk = this.riskScorer.score(executionId, dimensions)
        const lockedRisk = this.riskLock.lock({ ...rawRisk, locked: true })

        this.ctx.setRisk(executionId, lockedRisk)
        this.ctx.advancePhase(executionId, 'RISK_ASSESSMENT')

        // Escalate — throws if L2+ (require human approval) or L3 (hard stop)
        const escalationLevel = this.escalation.evaluate(executionId, lockedRisk.level)
        this.ctx.setEscalationLevel(executionId, escalationLevel as 0 | 1 | 2 | 3)

        return this.ctx.get(executionId)
    }

    // ─── Phase 4: PLANNING ───────────────────────────────────────────────────────

    /**
     * Validate mutation plan against budget before any mutation occurs.
     * Throws BudgetExceededError if plan exceeds mode limits.
     */
    validatePlan(executionId: string, plan: MutationPlan): ExecutionContext {
        const context = this.ctx.get(executionId)
        this.guard.validateTransition(executionId, context.currentPhase, 'PLANNING')

        this.budget.validate(
            executionId,
            context.mutationBudget,
            plan.files.length,
            plan.estimatedLines
        )

        return this.ctx.advancePhase(executionId, 'PLANNING')
    }

    // ─── Phase 5: MUTATION_SANDBOX ───────────────────────────────────────────────

    /**
     * Apply pre-approved mutation in isolated sandbox.
     * Mandatory snapshot taken before any changes.
     * AI cannot change plan at this point.
     */
    applyMutation(
        executionId: string,
        plan: MutationPlan,
        currentState: Record<string, unknown>
    ): MutationResult {
        const context = this.ctx.get(executionId)
        this.guard.validateTransition(executionId, context.currentPhase, 'MUTATION_SANDBOX')

        // Mandatory snapshot
        const snapshot = this.snapshots.capture(executionId, currentState)
        this.ctx.setSnapshot(executionId, snapshot.snapshotId)

        // Track mutation usage
        this.ctx.trackMutation(executionId, plan.files.length, plan.estimatedLines)

        // Compute deterministic fingerprint
        const fingerprint = createHash('sha256')
            .update(JSON.stringify({ files: plan.files, lines: plan.estimatedLines, diff: plan.diff }))
            .digest('hex')
            .slice(0, 16)

        this.ctx.advancePhase(executionId, 'MUTATION_SANDBOX')

        return {
            applied: true,
            fingerprint,
            snapshotId: snapshot.snapshotId,
        }
    }

    // ─── Phase 6: VERIFICATION ───────────────────────────────────────────────────

    /**
     * Verify the mutation result.
     * On failure: automatically rolls back and throws.
     */
    verify(
        executionId: string,
        mutationResult: MutationResult,
        aiOutput?: string
    ): ExecutionContext {
        const context = this.ctx.get(executionId)
        this.guard.validateTransition(executionId, context.currentPhase, 'VERIFICATION')

        this.ctx.advancePhase(executionId, 'VERIFICATION')

        // Anomaly check in verification output
        if (aiOutput) {
            const flags = this.anomaly.scan(executionId, aiOutput, 'VERIFICATION')
            if (flags.length > 0) {
                // Auto-rollback
                this.rollback.restore(executionId)
                this.ctx.addAnomalyFlag(executionId, flags[0]!.code)
                this.ctx.advancePhase(executionId, 'ROLLBACK')
                throw new Error(
                    `[CVF v1.8] VERIFICATION FAILED: ${flags[0]!.message}. Rolled back.`
                )
            }
        }

        // Check mutation was actually applied
        if (!mutationResult.applied) {
            this.rollback.restore(executionId)
            this.ctx.advancePhase(executionId, 'ROLLBACK')
            throw new Error(`[CVF v1.8] VERIFICATION FAILED: mutation not applied. Rolled back.`)
        }

        return this.ctx.get(executionId)
    }

    // ─── Phase 7: COMMIT ─────────────────────────────────────────────────────────

    /**
     * Commit the execution. Returns a deterministic CommitRecord.
     * Only allowed if no anomaly flags, risk unchanged, budget not exceeded.
     */
    commit(executionId: string, mutationFingerprint: string): CommitRecord {
        const context = this.ctx.get(executionId)
        this.guard.validateTransition(executionId, context.currentPhase, 'COMMIT')

        if (context.anomalyFlags.length > 0) {
            throw new Error(
                `[CVF v1.8] COMMIT BLOCKED: anomaly flags present: ${context.anomalyFlags.join(', ')}`
            )
        }

        if (!context.riskObject) {
            throw new Error(`[CVF v1.8] COMMIT BLOCKED: no risk object (RISK_ASSESSMENT was skipped)`)
        }

        if (!context.snapshotId) {
            throw new Error(`[CVF v1.8] COMMIT BLOCKED: no snapshot (MUTATION_SANDBOX was skipped)`)
        }

        const commitHash = computeCommitHash(
            executionId,
            context.riskObject.hash,
            mutationFingerprint,
            context.snapshotId
        )

        this.ctx.advancePhase(executionId, 'COMMIT')

        return {
            executionId,
            commitHash,
            riskHash: context.riskObject.hash,
            mutationFingerprint,
            snapshotId: context.snapshotId,
            timestamp: Date.now(),
        }
    }

    // ─── Emergency Rollback ───────────────────────────────────────────────────────

    /**
     * Force a rollback at any point. Marks execution as ROLLBACK.
     */
    forceRollback(executionId: string): void {
        const context = this.ctx.get(executionId)
        if (context.snapshotId) {
            this.rollback.restore(executionId)
        }
        this.ctx.advancePhase(executionId, 'ROLLBACK')
    }

    getContext(executionId: string): ExecutionContext {
        return this.ctx.get(executionId)
    }
}
