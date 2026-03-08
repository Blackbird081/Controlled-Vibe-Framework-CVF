import { beforeEach, describe, expect, it } from 'vitest'
import { ContextFreezer } from '../core/context.freezer.js'
import { CrossExtensionRecoveryOrchestrator } from '../core/cross.extension.recovery.orchestrator.js'
import { ExecutionSnapshot } from '../core/execution.snapshot.js'
import type {
    CrossExtensionRecoveryInput,
    LegacyExecutionAuditRecord,
    LegacyLifecycleCheckpoint,
} from '../types/index.js'

function makeFileHashes() {
    return {
        'src/policy.ts': 'hash-policy',
        'src/orchestrator.ts': 'hash-orchestrator',
        'src/runtime.ts': 'hash-runtime',
    }
}

function makeCheckpoint(
    overrides: Partial<LegacyLifecycleCheckpoint> = {}
): LegacyLifecycleCheckpoint {
    return {
        proposalId: 'proposal-failure-001',
        state: 'validated',
        policyVersion: 'v1.7.1-local',
        policyHash: 'policy-hash-failure-001',
        simulateOnly: false,
        checkpointedAt: 1709798300000,
        sessionId: 'failure-session-001',
        resumeToken: 'resume-token-failure-001',
        resumeCount: 0,
        ...overrides,
    }
}

function makeAuditRecord(
    overrides: Partial<LegacyExecutionAuditRecord> = {}
): LegacyExecutionAuditRecord {
    return {
        proposalId: 'proposal-failure-001',
        policyVersion: 'v1.7.1-local',
        policyHash: 'policy-hash-failure-001',
        decision: 'approved',
        timestamp: 1709798400000,
        resumeContext: {
            sessionId: 'failure-session-001',
            checkpointedAt: 1709798300000,
            lastResumedAt: 1709798350000,
            resumeCount: 0,
            resumeAuthorized: true,
        },
        ...overrides,
    }
}

function makeInput(
    overrides: Partial<CrossExtensionRecoveryInput> = {}
): CrossExtensionRecoveryInput {
    return {
        checkpoint: makeCheckpoint(),
        auditRecord: makeAuditRecord(),
        replaySeed: {
            role: 'developer',
            mode: 'SAFE',
            fileHashes: makeFileHashes(),
            policyVersion: 'v1.7.1-local',
            envMeta: {
                sourceExtension: 'CVF_v1.7.1_SAFETY_RUNTIME',
                orchestratorMode: 'failure-classification',
            },
            riskHash: 'risk-failure-001',
            mutationFingerprint: 'failure-classification',
            snapshotId: 'snapshot-failure-001',
        },
        currentFileHashes: makeFileHashes(),
        sessionId: 'failure-session-001',
        resumeToken: 'resume-token-failure-001',
        ...overrides,
    }
}

describe('CVF v1.9 cross-extension failure classification conformance', () => {
    let snapshots: ExecutionSnapshot
    let freezer: ContextFreezer
    let orchestrator: CrossExtensionRecoveryOrchestrator

    beforeEach(() => {
        snapshots = new ExecutionSnapshot()
        freezer = new ContextFreezer()
        snapshots._clearAll()
        freezer._clearAll()
        orchestrator = new CrossExtensionRecoveryOrchestrator(snapshots, freezer)
    })

    it('classifies runtime interruption without resuming workflow', () => {
        const result = orchestrator.resumeOrRecover(
            makeInput({
                failureSignal: {
                    kind: 'RUNTIME_INTERRUPTION',
                    reason: 'process crashed before replay',
                    phase: 'VERIFICATION',
                },
            })
        )

        expect(result.action).toBe('INTERRUPTED')
        expect(result.resumed).toBe(false)
        expect(result.failureSignal?.phase).toBe('VERIFICATION')
    })

    it('classifies policy refusal without attempting resume', () => {
        const result = orchestrator.resumeOrRecover(
            makeInput({
                failureSignal: {
                    kind: 'POLICY_REFUSAL',
                    reason: 'human approval denied',
                    phase: 'RISK_ASSESSMENT',
                },
            })
        )

        expect(result.action).toBe('REFUSED')
        expect(result.resumed).toBe(false)
        expect(result.workflow).toBeUndefined()
    })

    it('classifies system abort without attempting resume', () => {
        const result = orchestrator.resumeOrRecover(
            makeInput({
                failureSignal: {
                    kind: 'SYSTEM_ABORT',
                    reason: 'kernel hard stop',
                    phase: 'ANALYSIS',
                },
            })
        )

        expect(result.action).toBe('ABORTED')
        expect(result.resumed).toBe(false)
        expect(result.failureSignal?.reason).toContain('hard stop')
    })
})
