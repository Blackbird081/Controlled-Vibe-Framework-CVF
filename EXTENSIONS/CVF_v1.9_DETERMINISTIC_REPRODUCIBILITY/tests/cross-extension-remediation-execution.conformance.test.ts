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
        'src/remediation-exec.ts': 'hash-remediation-exec',
        'src/runtime.ts': 'hash-runtime',
    }
}

function makeCheckpoint(
    overrides: Partial<LegacyLifecycleCheckpoint> = {}
): LegacyLifecycleCheckpoint {
    return {
        proposalId: 'proposal-remediation-exec-001',
        state: 'validated',
        policyVersion: 'v1.7.1-local',
        policyHash: 'policy-hash-remediation-exec-001',
        simulateOnly: false,
        checkpointedAt: 1709798300000,
        sessionId: 'remediation-exec-session-001',
        resumeToken: 'resume-token-remediation-exec-001',
        resumeCount: 0,
        ...overrides,
    }
}

function makeAuditRecord(
    overrides: Partial<LegacyExecutionAuditRecord> = {}
): LegacyExecutionAuditRecord {
    return {
        proposalId: 'proposal-remediation-exec-001',
        policyVersion: 'v1.7.1-local',
        policyHash: 'policy-hash-remediation-exec-001',
        decision: 'approved',
        timestamp: 1709798400000,
        resumeContext: {
            sessionId: 'remediation-exec-session-001',
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
                remediationMode: 'execution',
            },
            riskHash: 'risk-remediation-exec-001',
            mutationFingerprint: 'remediation-execution',
            snapshotId: 'snapshot-remediation-exec-001',
        },
        currentFileHashes: makeFileHashes(),
        sessionId: 'remediation-exec-session-001',
        resumeToken: 'resume-token-remediation-exec-001',
        ...overrides,
    }
}

describe('CVF v1.9 cross-extension remediation execution conformance', () => {
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

    it('executes automated remediation steps for resumed outcomes', () => {
        const result = orchestrator.resumeOrRecover(makeInput())
        const execution = orchestrator.executeRemediation(result)

        expect(result.action).toBe('RESUMED')
        expect(execution.automated).toBe(true)
        expect(execution.blocked).toBe(false)
        expect(execution.executedSteps).toContain('persist_resume_evidence')
    })

    it('executes automated remediation steps for interrupted outcomes', () => {
        const result = orchestrator.resumeOrRecover(
            makeInput({
                failureSignal: {
                    kind: 'RUNTIME_INTERRUPTION',
                    reason: 'worker crashed',
                    phase: 'VERIFICATION',
                },
            })
        )
        const execution = orchestrator.executeRemediation(result)

        expect(result.action).toBe('INTERRUPTED')
        expect(execution.automated).toBe(true)
        expect(execution.executedSteps).toContain('prepare_retry_from_latest_checkpoint')
    })

    it('fails closed for human-gated rollback-required remediation', () => {
        const result = orchestrator.resumeOrRecover(
            makeInput({
                rollbackRecord: {
                    executionId: 'exec-remediation-exec-001',
                    snapshotId: 'snapshot-remediation-exec-001',
                    restoredAt: 1709798500000,
                    stateHash: 'state-hash-remediation-exec-001',
                },
            })
        )
        const execution = orchestrator.executeRemediation(result)

        expect(result.action).toBe('ROLLBACK_REQUIRED')
        expect(execution.automated).toBe(false)
        expect(execution.blocked).toBe(true)
        expect(execution.blockedReason).toContain('Human approval required')
    })
})
