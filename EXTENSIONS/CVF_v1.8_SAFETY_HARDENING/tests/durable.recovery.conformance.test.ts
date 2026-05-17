import { describe, it, expect, beforeEach } from 'vitest'
import { LifecycleController } from '../core/lifecycle/lifecycle.controller.js'
import { ExecutionContextStore } from '../core/lifecycle/execution.context.js'
import { PhaseGuard } from '../core/lifecycle/phase.guard.js'
import { RiskScorer } from '../core/risk/risk.scorer.js'
import { RiskLock } from '../core/risk/risk.lock.js'
import { EscalationController } from '../core/governance/escalation.controller.js'
import { MutationBudgetEnforcer } from '../core/mutation/mutation.budget.js'
import { SnapshotEnforcer } from '../core/mutation/snapshot.enforcer.js'
import { RollbackManager } from '../core/rollback/rollback.manager.js'
import { AnomalyDetector } from '../core/anomaly/anomaly.detector.js'
import type { RiskDimensions } from '../types/index.js'

function makeDeps() {
    const contextStore = new ExecutionContextStore()
    const riskLock = new RiskLock()
    const snapshotEnforcer = new SnapshotEnforcer()
    const escalation = new EscalationController()
    const rollbackManager = new RollbackManager(snapshotEnforcer)
    const anomalyDetector = new AnomalyDetector()

    return {
        contextStore,
        phaseGuard: new PhaseGuard(),
        riskScorer: new RiskScorer(),
        riskLock,
        escalation,
        budgetEnforcer: new MutationBudgetEnforcer(),
        snapshotEnforcer,
        rollbackManager,
        anomalyDetector,
    }
}

function makeSafeDimensions(): RiskDimensions {
    return { impact: 1, scope: 1, uncertainty: 1, reversibility: -2 }
}

function advanceToMutation(controller: LifecycleController, executionId: string) {
    controller.runAnalysis(executionId, 'Reading...')
    controller.assessRisk(executionId, makeSafeDimensions())
    const plan = { files: ['a.ts'], estimatedLines: 5, diff: 'diff' }
    controller.validatePlan(executionId, plan)
    return controller.applyMutation(executionId, plan, { before: 'state' })
}

describe('CVF v1.8 durable recovery conformance', () => {
    beforeEach(() => {
        const deps = makeDeps()
        deps.contextStore._clearAll()
        deps.snapshotEnforcer._clearAll()
        deps.rollbackManager._clearAll()
        deps.escalation._clearAll()
        deps.riskLock._clearAll()
    })

    it('records rollback state when verification flags an anomaly', () => {
        const deps = makeDeps()
        deps.anomalyDetector.scan = (_executionId, _output, phase) =>
            phase === 'VERIFICATION'
                ? [{
                    code: 'VERIFICATION_ANOMALY',
                    message: 'forced anomaly',
                    phase: 'VERIFICATION',
                    timestamp: Date.now(),
                }]
                : []

        const controller = new LifecycleController(deps)
        const ctx = controller.startIntent('developer', 'SAFE')
        const result = advanceToMutation(controller, ctx.executionId)

        expect(() => controller.verify(ctx.executionId, result, 'trigger')).toThrow(/Rolled back/)
        expect(controller.getContext(ctx.executionId).currentPhase).toBe('ROLLBACK')
        expect(deps.rollbackManager.wasRolledBack(ctx.executionId)).toBe(true)
        expect(deps.rollbackManager.getRollbackRecord(ctx.executionId)?.snapshotId).toBe(result.snapshotId)
    })

    it('records rollback state when verification fails because mutation was not applied', () => {
        const deps = makeDeps()
        const controller = new LifecycleController(deps)
        const ctx = controller.startIntent('developer', 'SAFE')
        advanceToMutation(controller, ctx.executionId)

        expect(() =>
            controller.verify(ctx.executionId, {
                applied: false,
                fingerprint: 'fp',
                snapshotId: 'snap-1',
            })
        ).toThrow(/mutation not applied/)
        expect(controller.getContext(ctx.executionId).currentPhase).toBe('ROLLBACK')
        expect(deps.rollbackManager.wasRolledBack(ctx.executionId)).toBe(true)
    })

    it('force rollback records recovery state and preserves the captured snapshot reference', () => {
        const deps = makeDeps()
        const controller = new LifecycleController(deps)
        const ctx = controller.startIntent('developer', 'SAFE')
        const result = advanceToMutation(controller, ctx.executionId)

        controller.forceRollback(ctx.executionId)

        expect(controller.getContext(ctx.executionId).currentPhase).toBe('ROLLBACK')
        expect(deps.rollbackManager.wasRolledBack(ctx.executionId)).toBe(true)
        expect(deps.rollbackManager.getRollbackRecord(ctx.executionId)?.snapshotId).toBe(result.snapshotId)
    })
})
