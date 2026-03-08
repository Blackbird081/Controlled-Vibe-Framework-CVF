import { beforeEach, describe, expect, it } from 'vitest'
import { ContextFreezer } from '../core/context.freezer.js'
import { CrossExtensionRecoveryOrchestrator } from '../core/cross.extension.recovery.orchestrator.js'
import { ExecutionSnapshot } from '../core/execution.snapshot.js'
import type {
    CrossExtensionRecoveryInput,
    LegacyExecutionAuditRecord,
    LegacyLifecycleCheckpoint,
    LegacyRollbackRecord,
} from '../types/index.js'

function makeFileHashes(overrides: Record<string, string> = {}) {
    return {
        'src/policy.ts': 'hash-policy',
        'src/recovery.ts': 'hash-recovery',
        'src/runtime.ts': 'hash-runtime',
        ...overrides,
    }
}

function makeCheckpoint(
    overrides: Partial<LegacyLifecycleCheckpoint> = {}
): LegacyLifecycleCheckpoint {
    return {
        proposalId: 'proposal-recovery-001',
        state: 'validated',
        policyVersion: 'v1.7.1-local',
        policyHash: 'policy-hash-recovery-001',
        simulateOnly: false,
        checkpointedAt: 1709798300000,
        sessionId: 'recovery-session-001',
        resumeToken: 'resume-token-recovery-001',
        resumeCount: 2,
        lastResumedAt: 1709798350000,
        ...overrides,
    }
}

function makeAuditRecord(
    overrides: Partial<LegacyExecutionAuditRecord> = {}
): LegacyExecutionAuditRecord {
    return {
        proposalId: 'proposal-recovery-001',
        policyVersion: 'v1.7.1-local',
        policyHash: 'policy-hash-recovery-001',
        decision: 'approved',
        timestamp: 1709798400000,
        resumeContext: {
            sessionId: 'recovery-session-001',
            checkpointedAt: 1709798300000,
            lastResumedAt: 1709798350000,
            resumeCount: 2,
            resumeAuthorized: true,
        },
        ...overrides,
    }
}

function makeRollbackRecord(
    overrides: Partial<LegacyRollbackRecord> = {}
): LegacyRollbackRecord {
    return {
        executionId: 'exec-recovery-001',
        snapshotId: 'snapshot-recovery-001',
        restoredAt: 1709798500000,
        stateHash: 'state-hash-recovery-001',
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
                recoveryBridge: 'v1.8->v1.9',
            },
            riskHash: 'risk-recovery-001',
            mutationFingerprint: 'recovery-resume-approved',
            snapshotId: 'snapshot-recovery-001',
        },
        currentFileHashes: makeFileHashes(),
        sessionId: 'recovery-session-001',
        resumeToken: 'resume-token-recovery-001',
        ...overrides,
    }
}

describe('CVF v1.9 cross-extension recovery orchestration conformance', () => {
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

    it('resumes workflow when no rollback record is present', () => {
        const result = orchestrator.resumeOrRecover(makeInput())

        expect(result.action).toBe('RESUMED')
        expect(result.resumed).toBe(true)
        expect(result.workflow?.replay.status).toBe('EXACT')
    })

    it('returns rollback-required when a matching v1.8 rollback record exists', () => {
        const result = orchestrator.resumeOrRecover(
            makeInput({ rollbackRecord: makeRollbackRecord() })
        )

        expect(result.action).toBe('ROLLBACK_REQUIRED')
        expect(result.resumed).toBe(false)
        expect(result.rollbackRecord?.snapshotId).toBe('snapshot-recovery-001')
    })

    it('fails closed when rollback snapshot does not match replay seed snapshot', () => {
        expect(() =>
            orchestrator.resumeOrRecover(
                makeInput({
                    rollbackRecord: makeRollbackRecord({ snapshotId: 'snapshot-mismatch-001' }),
                })
            )
        ).toThrow('rollback snapshot mismatch')
    })
})
