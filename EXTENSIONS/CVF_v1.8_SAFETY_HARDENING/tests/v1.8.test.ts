// CVF v1.8 — Full Test Suite
// Tests phase enforcement, risk lock, mutation budget, escalation, rollback, drift monitor

import { describe, it, expect, beforeEach } from 'vitest'
import { LifecycleController } from '../core/lifecycle/lifecycle.controller.js'
import { ExecutionContextStore } from '../core/lifecycle/execution.context.js'
import { PhaseGuard, PhaseViolationError } from '../core/lifecycle/phase.guard.js'
import { generateExecutionId, isValidExecutionId } from '../core/lifecycle/execution.id.js'
import { RiskScorer, scoreToRiskLevel, computeRiskScore } from '../core/risk/risk.scorer.js'
import { RiskLock } from '../core/risk/risk.lock.js'
import { getSeverity } from '../core/risk/severity.matrix.js'
import { MutationBudgetEnforcer, BudgetExceededError } from '../core/mutation/mutation.budget.js'
import { SnapshotEnforcer } from '../core/mutation/snapshot.enforcer.js'
import { RollbackManager, computeCommitHash } from '../core/rollback/rollback.manager.js'
import { EscalationController, EscalationViolationError } from '../core/governance/escalation.controller.js'
import { AnomalyDetector } from '../core/anomaly/anomaly.detector.js'
import { DriftMonitor, computeStabilityIndex } from '../core/anomaly/behavior.drift.monitor.js'
import type { RiskDimensions, ExecutionMetrics } from '../types/index.js'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeDeps() {
    const contextStore = new ExecutionContextStore()
    const riskLock = new RiskLock()
    const snapshotEnforcer = new SnapshotEnforcer()
    const escalation = new EscalationController()
    return {
        contextStore,
        phaseGuard: new PhaseGuard(),
        riskScorer: new RiskScorer(),
        riskLock,
        escalation,
        budgetEnforcer: new MutationBudgetEnforcer(),
        snapshotEnforcer,
        rollbackManager: new RollbackManager(snapshotEnforcer),
        anomalyDetector: new AnomalyDetector(),
    }
}

function makeSafeDimensions(): RiskDimensions {
    return { impact: 1, scope: 1, uncertainty: 1, reversibility: -2 }  // score = -1 → R0
}

function makeElevatedDimensions(): RiskDimensions {
    return { impact: 2, scope: 2, uncertainty: 2, reversibility: 0 }  // score = 8 → R2
}

function makeCriticalDimensions(): RiskDimensions {
    return { impact: 4, scope: 3, uncertainty: 1, reversibility: 2 }  // score = 14 → R3
}

function makeHardStopDimensions(): RiskDimensions {
    return { impact: 5, scope: 4, uncertainty: 1, reversibility: 2 }  // score = 22 → R3+
}

// ─── Risk Scorer ─────────────────────────────────────────────────────────────

describe('RiskScorer — core formula', () => {
    it('computes score correctly: (I×S×U)+R', () => {
        expect(computeRiskScore({ impact: 2, scope: 2, uncertainty: 2, reversibility: 0 })).toBe(8)
        expect(computeRiskScore({ impact: 1, scope: 1, uncertainty: 1, reversibility: -2 })).toBe(-1)
        expect(computeRiskScore({ impact: 5, scope: 5, uncertainty: 5, reversibility: 2 })).toBe(127)
    })

    it('clamps dimensions to valid ranges', () => {
        // impact > 5 → clamped to 5
        expect(computeRiskScore({ impact: 10, scope: 5, uncertainty: 5, reversibility: 2 })).toBe(127)
        // reversibility < -2 → clamped to -2
        expect(computeRiskScore({ impact: 1, scope: 1, uncertainty: 1, reversibility: -5 })).toBe(-1)
    })

    it('maps scores to correct R-levels', () => {
        expect(scoreToRiskLevel(-2)).toBe('R0')
        expect(scoreToRiskLevel(0)).toBe('R0')
        expect(scoreToRiskLevel(2)).toBe('R0')
        expect(scoreToRiskLevel(3)).toBe('R1')
        expect(scoreToRiskLevel(5)).toBe('R1')
        expect(scoreToRiskLevel(6)).toBe('R2')
        expect(scoreToRiskLevel(10)).toBe('R2')
        expect(scoreToRiskLevel(11)).toBe('R3')
        expect(scoreToRiskLevel(15)).toBe('R3')
        expect(scoreToRiskLevel(16)).toBe('R3+')
        expect(scoreToRiskLevel(200)).toBe('R3+')
    })

    it('produces a hash in risk object', () => {
        const scorer = new RiskScorer()
        const risk = scorer.score('test-exec', { impact: 2, scope: 2, uncertainty: 2, reversibility: 0 })
        expect(risk.hash).toHaveLength(16)
        expect(risk.locked).toBe(false)
    })
})

// ─── Risk Lock ───────────────────────────────────────────────────────────────

describe('RiskLock — immutability enforcement', () => {
    let riskLock: RiskLock

    beforeEach(() => {
        riskLock = new RiskLock()
    })

    it('locks a risk object successfully', () => {
        const scorer = new RiskScorer()
        const risk = scorer.score('exec-001', makeSafeDimensions())
        const locked = riskLock.lock({ ...risk, locked: true })
        expect(locked.locked).toBe(true)
        expect(Object.isFrozen(locked)).toBe(true)
    })

    it('throws if same executionId is locked twice (AI cannot re-assess)', () => {
        const scorer = new RiskScorer()
        const risk = scorer.score('exec-002', makeSafeDimensions())
        riskLock.lock({ ...risk, locked: true })
        expect(() => riskLock.lock({ ...risk, locked: true })).toThrow('already locked')
    })

    it('retrieves locked risk by executionId', () => {
        const scorer = new RiskScorer()
        const risk = scorer.score('exec-003', makeSafeDimensions())
        riskLock.lock({ ...risk, locked: true })
        const retrieved = riskLock.get('exec-003')
        expect(retrieved.executionId).toBe('exec-003')
    })

    it('throws if no locked risk found', () => {
        expect(() => riskLock.get('no-such-exec')).toThrow('No locked risk found')
    })

    it('has() reflects lock state', () => {
        const scorer = new RiskScorer()
        const risk = scorer.score('exec-004', makeSafeDimensions())
        expect(riskLock.has('exec-004')).toBe(false)
        riskLock.lock({ ...risk, locked: true })
        expect(riskLock.has('exec-004')).toBe(true)
    })
})

// ─── Severity Matrix ─────────────────────────────────────────────────────────

describe('Severity Matrix', () => {
    it('R0 → escalation 0, autoApprove, no human required', () => {
        const s = getSeverity('R0')
        expect(s.escalation).toBe(0)
        expect(s.autoApprove).toBe(true)
        expect(s.hardStop).toBe(false)
    })

    it('R2 → escalation 1, requireHuman', () => {
        const s = getSeverity('R2')
        expect(s.escalation).toBe(1)
        expect(s.requireHuman).toBe(true)
        expect(s.hardStop).toBe(false)
    })

    it('R3+ → escalation 3, hardStop', () => {
        const s = getSeverity('R3+')
        expect(s.escalation).toBe(3)
        expect(s.hardStop).toBe(true)
    })
})

// ─── Phase Guard ─────────────────────────────────────────────────────────────

describe('PhaseGuard — transition enforcement', () => {
    let guard: PhaseGuard

    beforeEach(() => { guard = new PhaseGuard() })

    it('allows valid transitions', () => {
        expect(() => guard.validateTransition('exec-1', 'INTENT', 'ANALYSIS')).not.toThrow()
        expect(() => guard.validateTransition('exec-1', 'ANALYSIS', 'RISK_ASSESSMENT')).not.toThrow()
        expect(() => guard.validateTransition('exec-1', 'VERIFICATION', 'COMMIT')).not.toThrow()
        expect(() => guard.validateTransition('exec-1', 'VERIFICATION', 'ROLLBACK')).not.toThrow()
    })

    it('throws PhaseViolationError for invalid transitions', () => {
        expect(() => guard.validateTransition('exec-1', 'INTENT', 'MUTATION_SANDBOX'))
            .toThrow(/PHASE VIOLATION/)
        expect(() => guard.validateTransition('exec-1', 'ANALYSIS', 'COMMIT'))
            .toThrow(/PHASE VIOLATION/)
        expect(() => guard.validateTransition('exec-1', 'COMMIT', 'ANALYSIS'))
            .toThrow(/PHASE VIOLATION/)
    })

    it('correctly identifies terminal phases', () => {
        expect(guard.isTerminal('COMMIT')).toBe(true)
        expect(guard.isTerminal('ROLLBACK')).toBe(true)
        expect(guard.isTerminal('ABORTED')).toBe(true)
        expect(guard.isTerminal('INTENT')).toBe(false)
    })

    it('returns allowed next phases list', () => {
        expect(guard.allowedNextPhases('VERIFICATION')).toEqual(['COMMIT', 'ROLLBACK'])
    })
})

describe('ExecutionId utilities', () => {
    it('generates valid execution IDs', () => {
        const id = generateExecutionId()
        expect(id.startsWith('cvf-exec-')).toBe(true)
        expect(isValidExecutionId(id)).toBe(true)
    })

    it('rejects invalid execution IDs', () => {
        expect(isValidExecutionId('exec-123')).toBe(false)
        expect(isValidExecutionId('cvf-exec-INVALID')).toBe(false)
    })
})

// ─── Mutation Budget ─────────────────────────────────────────────────────────

describe('MutationBudgetEnforcer', () => {
    let enforcer: MutationBudgetEnforcer

    beforeEach(() => { enforcer = new MutationBudgetEnforcer() })

    it('allows mutations within SAFE budget (2 files, 50 lines)', () => {
        const budget = { mode: 'SAFE' as const, maxFiles: 2, maxLines: 50, usedFiles: 0, usedLines: 0 }
        expect(() => enforcer.validate('exec-1', budget, 2, 50)).not.toThrow()
        expect(() => enforcer.validate('exec-1', budget, 1, 30)).not.toThrow()
    })

    it('throws BudgetExceededError when exceeding file limit', () => {
        const budget = { mode: 'SAFE' as const, maxFiles: 2, maxLines: 50, usedFiles: 1, usedLines: 0 }
        expect(() => enforcer.validate('exec-1', budget, 2, 10)).toThrow(BudgetExceededError)
    })

    it('throws BudgetExceededError when exceeding line limit', () => {
        const budget = { mode: 'SAFE' as const, maxFiles: 2, maxLines: 50, usedFiles: 0, usedLines: 40 }
        expect(() => enforcer.validate('exec-1', budget, 1, 20)).toThrow(BudgetExceededError)
    })

    it('correctly returns budget per mode', () => {
        expect(enforcer.budgetForMode('SAFE')).toMatchObject({ maxFiles: 2, maxLines: 50 })
        expect(enforcer.budgetForMode('BALANCED')).toMatchObject({ maxFiles: 5, maxLines: 150 })
        expect(enforcer.budgetForMode('CREATIVE')).toMatchObject({ maxFiles: 10, maxLines: 300 })
    })

    it('computes remaining capacity', () => {
        const remaining = enforcer.remainingCapacity({
            mode: 'BALANCED',
            maxFiles: 5,
            maxLines: 150,
            usedFiles: 2,
            usedLines: 30,
        })
        expect(remaining).toEqual({ files: 3, lines: 120 })
    })
})

// ─── Escalation Controller ───────────────────────────────────────────────────

describe('EscalationController — Governance Brain', () => {
    let escalation: EscalationController

    beforeEach(() => {
        escalation = new EscalationController()
        escalation._clearAll()
    })

    it('R0 and R1 → no throw, returns escalation level 0', () => {
        expect(escalation.evaluate('exec-1', 'R0')).toBe(0)
        expect(escalation.evaluate('exec-2', 'R1')).toBe(0)
    })

    it('R2 → throws EscalationViolationError (requires human)', () => {
        expect(() => escalation.evaluate('exec-3', 'R2')).toThrow(EscalationViolationError)
    })

    it('R3 → throws EscalationViolationError (requires human)', () => {
        expect(() => escalation.evaluate('exec-4', 'R3')).toThrow(EscalationViolationError)
    })

    it('R3+ → throws with hard stop message', () => {
        expect(() => escalation.evaluate('exec-5', 'R3+')).toThrow(/HARD STOP/)
    })

    it('logs events for all evaluations', () => {
        try { escalation.evaluate('exec-6', 'R0') } catch { /* ignore */ }
        try { escalation.evaluate('exec-7', 'R3+') } catch { /* ignore */ }
        const events = escalation.getEvents()
        expect(events.length).toBeGreaterThanOrEqual(2)
    })

    it('escalateAnomaly throws and can filter events by executionId', () => {
        expect(() => escalation.escalateAnomaly('exec-anomaly', 'unexpected tool call'))
            .toThrow(EscalationViolationError)
        const filtered = escalation.getEvents('exec-anomaly')
        expect(filtered).toHaveLength(1)
        expect(filtered[0]!.reason).toContain('ANOMALY')
    })
})

// ─── Anomaly Detector ────────────────────────────────────────────────────────

describe('AnomalyDetector', () => {
    let detector: AnomalyDetector

    beforeEach(() => { detector = new AnomalyDetector() })

    it('detects mutation intent in ANALYSIS phase', () => {
        const flags = detector.scan('exec-1', '```diff\n-old\n+new', 'ANALYSIS')
        expect(flags.length).toBeGreaterThan(0)
        expect(flags[0]!.code).toBe('MUTATION_IN_ANALYSIS')
    })

    it('allows normal analysis output in ANALYSIS phase', () => {
        const flags = detector.scan('exec-1', 'The file reads the config from disk.', 'ANALYSIS')
        expect(flags).toHaveLength(0)
    })

    it('detects reasoning in MUTATION_SANDBOX phase', () => {
        const flags = detector.scan('exec-1', "Let me think about this differently...", 'MUTATION_SANDBOX')
        expect(flags.length).toBeGreaterThan(0)
        expect(flags[0]!.code).toBe('REASONING_IN_MUTATION')
    })

    it('allows clean mutation output in MUTATION_SANDBOX', () => {
        const flags = detector.scan('exec-1', 'Applied changes to config.ts', 'MUTATION_SANDBOX')
        expect(flags).toHaveLength(0)
    })

    it('isClean returns false when anomalies detected', () => {
        expect(detector.isClean('exec-1', '```diff\n-old', 'ANALYSIS')).toBe(false)
    })

    it('flags overly verbose risk assessment output', () => {
        const flags = detector.scan('exec-verbose', 'x'.repeat(2100), 'RISK_ASSESSMENT')
        expect(flags).toHaveLength(1)
        expect(flags[0]!.code).toBe('VERBOSE_RISK')
    })
})

// ─── Drift Monitor + Stability Index ────────────────────────────────────────

describe('DriftMonitor + Stability Index', () => {
    let monitor: DriftMonitor

    beforeEach(() => {
        monitor = new DriftMonitor()
        monitor._clearAll()
    })

    it('returns 100 stability index with no history', () => {
        const report = monitor.getStabilityReport()
        expect(report.index).toBe(100)
        expect(report.forcedSafeMode).toBe(false)
        expect(report.creativeDisabled).toBe(false)
    })

    it('calculates correct stability index', () => {
        const metrics: ExecutionMetrics[] = [
            { executionId: '1', rollback: false, anomalyCount: 0, riskEscalated: false, mutationSize: 0, driftScore: 0 },
            { executionId: '2', rollback: false, anomalyCount: 0, riskEscalated: false, mutationSize: 0, driftScore: 0 },
        ]
        const index = computeStabilityIndex(metrics)
        expect(index).toBe(100)
    })

    it('forces SAFE mode when index < 70 (high rollback + anomaly rates)', () => {
        const badMetrics: ExecutionMetrics[] = Array.from({ length: 10 }, (_, i) => ({
            executionId: `exec-${i}`,
            rollback: true,
            anomalyCount: 3,
            riskEscalated: true,
            mutationSize: 500,
            driftScore: 1,
        }))
        const index = computeStabilityIndex(badMetrics)
        expect(index).toBeLessThan(70)
    })

    it('records executions and tracks history', () => {
        const m: ExecutionMetrics = { executionId: 'exec-x', rollback: false, anomalyCount: 0, riskEscalated: false, mutationSize: 5, driftScore: 0 }
        monitor.record(m)
        expect(monitor.getHistory()).toHaveLength(1)
    })

    it('computeDriftScore returns 0 when older window does not exist', () => {
        monitor.record({ executionId: 'a', rollback: false, anomalyCount: 0, riskEscalated: false, mutationSize: 1, driftScore: 0 })
        monitor.record({ executionId: 'b', rollback: true, anomalyCount: 1, riskEscalated: false, mutationSize: 2, driftScore: 0 })
        expect(monitor.computeDriftScore()).toBe(0)
    })

    it('computeDriftScore increases when recent behavior degrades', () => {
        const baseline: ExecutionMetrics = { executionId: 'base', rollback: false, anomalyCount: 0, riskEscalated: false, mutationSize: 1, driftScore: 0 }
        monitor.record(baseline)
        for (let i = 0; i < 5; i++) {
            monitor.record({
                executionId: `recent-${i}`,
                rollback: true,
                anomalyCount: 2,
                riskEscalated: true,
                mutationSize: 100,
                driftScore: 0,
            })
        }
        expect(monitor.computeDriftScore()).toBeGreaterThan(0)
    })
})

// ─── Lifecycle Controller — Full Integration ──────────────────────────────────

describe('LifecycleController — Full 7-Phase Integration', () => {
    let controller: LifecycleController
    let deps: ReturnType<typeof makeDeps>

    beforeEach(() => {
        deps = makeDeps()
        controller = new LifecycleController(deps)
        deps.riskLock._clearAll()
        deps.contextStore._clearAll()
        deps.snapshotEnforcer._clearAll()
        deps.escalation._clearAll()
    })

    it('runs complete SAFE execution (R0 risk) successfully', () => {
        // INTENT
        const ctx = controller.startIntent('developer', 'SAFE')
        expect(ctx.currentPhase).toBe('INTENT')
        expect(ctx.role).toBe('developer')

        // ANALYSIS
        const afterAnalysis = controller.runAnalysis(ctx.executionId, 'Reading config file...')
        expect(afterAnalysis.currentPhase).toBe('ANALYSIS')

        // RISK_ASSESSMENT (R0 — auto approve, should not throw)
        const afterRisk = controller.assessRisk(ctx.executionId, makeSafeDimensions())
        expect(afterRisk.currentPhase).toBe('RISK_ASSESSMENT')
        expect(afterRisk.riskObject?.level).toBe('R0')

        // PLANNING
        const plan = { files: ['config.ts'], estimatedLines: 5, diff: '+const x = 1' }
        const afterPlan = controller.validatePlan(ctx.executionId, plan)
        expect(afterPlan.currentPhase).toBe('PLANNING')

        // MUTATION_SANDBOX
        const result = controller.applyMutation(ctx.executionId, plan, { file: 'config.ts', content: 'old' })
        expect(result.applied).toBe(true)
        expect(result.fingerprint).toHaveLength(16)

        // VERIFICATION
        const afterVerify = controller.verify(ctx.executionId, result)
        expect(afterVerify.currentPhase).toBe('VERIFICATION')

        // COMMIT
        const commit = controller.commit(ctx.executionId, result.fingerprint)
        expect(commit.commitHash).toHaveLength(32)
        expect(commit.executionId).toBe(ctx.executionId)

        const finalCtx = controller.getContext(ctx.executionId)
        expect(finalCtx.currentPhase).toBe('COMMIT')
    })

    it('aborts on phase violation (skip ANALYSIS)', () => {
        const ctx = controller.startIntent('developer', 'SAFE')
        expect(() => controller.assessRisk(ctx.executionId, makeSafeDimensions()))
            .toThrow(PhaseViolationError)
    })

    it('aborts on mutation intent detected in ANALYSIS', () => {
        const ctx = controller.startIntent('developer', 'SAFE')
        expect(() => controller.runAnalysis(ctx.executionId, '```diff\n-old\n+new'))
            .toThrow(/ANALYSIS ANOMALY/)
        expect(controller.getContext(ctx.executionId).currentPhase).toBe('ABORTED')
    })

    it('aborts on budget exceeded in PLANNING', () => {
        const ctx = controller.startIntent('developer', 'SAFE')
        controller.runAnalysis(ctx.executionId, 'Reading files...')
        controller.assessRisk(ctx.executionId, makeSafeDimensions())

        // Plan exceeds SAFE budget (2 files max)
        const bigPlan = { files: ['a.ts', 'b.ts', 'c.ts'], estimatedLines: 10, diff: 'big' }
        expect(() => controller.validatePlan(ctx.executionId, bigPlan)).toThrow(BudgetExceededError)
    })

    it('blocks commit if anomaly flags are present', () => {
        // Need to advance through phases then add anomaly before commit
        const ctx = controller.startIntent('developer', 'SAFE')
        controller.runAnalysis(ctx.executionId, 'Reading...')
        controller.assessRisk(ctx.executionId, makeSafeDimensions())
        const plan = { files: ['a.ts'], estimatedLines: 5, diff: 'diff' }
        controller.validatePlan(ctx.executionId, plan)
        const result = controller.applyMutation(ctx.executionId, plan, { before: 'state' })
        controller.verify(ctx.executionId, result)
        // Now add anomaly flag AFTER verification (simulates late detection)
        deps.contextStore.addAnomalyFlag(ctx.executionId, 'LATE_ANOMALY')

        expect(() => controller.commit(ctx.executionId, result.fingerprint))
            .toThrow(/COMMIT BLOCKED: anomaly flags/)
    })

    it('force rollback works and advances to ROLLBACK phase', () => {
        const ctx = controller.startIntent('developer', 'SAFE')
        controller.runAnalysis(ctx.executionId, 'Reading...')
        controller.assessRisk(ctx.executionId, makeSafeDimensions())
        const plan = { files: ['a.ts'], estimatedLines: 5, diff: 'diff' }
        controller.validatePlan(ctx.executionId, plan)
        controller.applyMutation(ctx.executionId, plan, { before: 'state' })

        controller.forceRollback(ctx.executionId)
        expect(controller.getContext(ctx.executionId).currentPhase).toBe('ROLLBACK')
    })

    it('escalates R2 risk and throws (human in loop required)', () => {
        const ctx = controller.startIntent('developer', 'BALANCED')
        controller.runAnalysis(ctx.executionId, 'Reading...')
        expect(() => controller.assessRisk(ctx.executionId, makeElevatedDimensions()))
            .toThrow(EscalationViolationError)
    })

    it('hard stops on R3+ risk', () => {
        const ctx = controller.startIntent('developer', 'CREATIVE')
        controller.runAnalysis(ctx.executionId, 'Reading...')
        expect(() => controller.assessRisk(ctx.executionId, makeHardStopDimensions()))
            .toThrow(/HARD STOP/)
    })

    it('verification failure rolls back when mutation is not applied', () => {
        const ctx = controller.startIntent('developer', 'SAFE')
        controller.runAnalysis(ctx.executionId, 'Reading...')
        controller.assessRisk(ctx.executionId, makeSafeDimensions())
        const plan = { files: ['a.ts'], estimatedLines: 5, diff: 'diff' }
        controller.validatePlan(ctx.executionId, plan)
        controller.applyMutation(ctx.executionId, plan, { before: 'state' })
        expect(() =>
            controller.verify(ctx.executionId, {
                applied: false,
                fingerprint: 'fp',
                snapshotId: 'snap-1',
            })
        ).toThrow(/mutation not applied/)
        expect(controller.getContext(ctx.executionId).currentPhase).toBe('ROLLBACK')
    })

    it('verification anomaly path triggers rollback when detector flags output', () => {
        const deps = makeDeps()
        deps.contextStore._clearAll()
        deps.snapshotEnforcer._clearAll()
        deps.escalation._clearAll()
        deps.riskLock._clearAll()
        deps.anomalyDetector.scan = (_executionId, _output, phase) =>
            phase === 'VERIFICATION'
                ? [{
                    code: 'VERIFICATION_ANOMALY',
                    message: 'forced anomaly',
                    phase: 'VERIFICATION',
                    timestamp: Date.now(),
                }]
                : []

        const c = new LifecycleController(deps)
        const ctx = c.startIntent('developer', 'SAFE')
        c.runAnalysis(ctx.executionId, 'Reading...')
        c.assessRisk(ctx.executionId, makeSafeDimensions())
        const plan = { files: ['a.ts'], estimatedLines: 5, diff: 'diff' }
        c.validatePlan(ctx.executionId, plan)
        const result = c.applyMutation(ctx.executionId, plan, { before: 'state' })

        expect(() => c.verify(ctx.executionId, result, 'trigger')).toThrow(/VERIFICATION FAILED/)
        expect(c.getContext(ctx.executionId).currentPhase).toBe('ROLLBACK')
    })

    it('blocks commit when risk object is missing', () => {
        const ctx = controller.startIntent('developer', 'SAFE')
        deps.contextStore.advancePhase(ctx.executionId, 'ANALYSIS')
        deps.contextStore.advancePhase(ctx.executionId, 'RISK_ASSESSMENT')
        deps.contextStore.advancePhase(ctx.executionId, 'PLANNING')
        deps.contextStore.advancePhase(ctx.executionId, 'MUTATION_SANDBOX')
        deps.contextStore.advancePhase(ctx.executionId, 'VERIFICATION')
        expect(() => controller.commit(ctx.executionId, 'fingerprint')).toThrow(/no risk object/)
    })

    it('blocks commit when snapshot is missing', () => {
        const ctx = controller.startIntent('developer', 'SAFE')
        const risk = deps.riskScorer.score(ctx.executionId, makeSafeDimensions())
        deps.contextStore.setRisk(ctx.executionId, risk)
        deps.contextStore.advancePhase(ctx.executionId, 'ANALYSIS')
        deps.contextStore.advancePhase(ctx.executionId, 'RISK_ASSESSMENT')
        deps.contextStore.advancePhase(ctx.executionId, 'PLANNING')
        deps.contextStore.advancePhase(ctx.executionId, 'MUTATION_SANDBOX')
        deps.contextStore.advancePhase(ctx.executionId, 'VERIFICATION')
        expect(() => controller.commit(ctx.executionId, 'fingerprint')).toThrow(/no snapshot/)
    })
})

// ─── Commit Hash Determinism ──────────────────────────────────────────────────

describe('Commit Hash — determinism guarantee', () => {
    it('same inputs always produce same hash', () => {
        const h1 = computeCommitHash('exec-1', 'risk-abc', 'mut-xyz', 'snap-123')
        const h2 = computeCommitHash('exec-1', 'risk-abc', 'mut-xyz', 'snap-123')
        expect(h1).toBe(h2)
    })

    it('different inputs produce different hashes', () => {
        const h1 = computeCommitHash('exec-1', 'risk-abc', 'mut-xyz', 'snap-123')
        const h2 = computeCommitHash('exec-1', 'risk-abc', 'mut-XYZ', 'snap-123')
        expect(h1).not.toBe(h2)
    })
})

describe('SnapshotEnforcer + RollbackManager utilities', () => {
    it('SnapshotEnforcer throws when snapshot is missing', () => {
        const enforcer = new SnapshotEnforcer()
        enforcer._clearAll()
        expect(() => enforcer.get('missing-exec')).toThrow('No snapshot found')
    })

    it('RollbackManager tracks rollback status and records', () => {
        const enforcer = new SnapshotEnforcer()
        enforcer._clearAll()
        enforcer.capture('rb-1', { before: 'state' })
        const manager = new RollbackManager(enforcer)
        manager._clearAll()

        const restored = manager.restore('rb-1')
        expect(manager.wasRolledBack('rb-1')).toBe(true)
        expect(manager.getRollbackRecord('rb-1')?.snapshotId).toBe(restored.snapshotId)

        manager._clearAll()
        expect(manager.wasRolledBack('rb-1')).toBe(false)
    })

    it('SnapshotEnforcer supports has() and rejects duplicate capture', () => {
        const enforcer = new SnapshotEnforcer()
        enforcer._clearAll()
        expect(enforcer.has('dup-1')).toBe(false)
        enforcer.capture('dup-1', { x: 1 })
        expect(enforcer.has('dup-1')).toBe(true)
        expect(() => enforcer.capture('dup-1', { x: 2 })).toThrow('Snapshot already exists')
    })

    it('RollbackManager can be constructed without explicit enforcer', () => {
        const manager = new RollbackManager()
        expect(manager.wasRolledBack('non-existent')).toBe(false)
    })
})
