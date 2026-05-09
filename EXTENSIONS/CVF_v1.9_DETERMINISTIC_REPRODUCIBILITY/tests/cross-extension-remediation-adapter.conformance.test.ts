import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryRemediationAdapter } from '../core/cross.extension.remediation.adapter.js'
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
        'src/remediation-adapter.ts': 'hash-remediation-adapter',
        'src/runtime.ts': 'hash-runtime',
    }
}

function makeCheckpoint(
    overrides: Partial<LegacyLifecycleCheckpoint> = {}
): LegacyLifecycleCheckpoint {
    return {
        proposalId: 'proposal-remediation-adapter-001',
        state: 'validated',
        policyVersion: 'v1.7.1-local',
        policyHash: 'policy-hash-remediation-adapter-001',
        simulateOnly: false,
        checkpointedAt: 1709798300000,
        sessionId: 'remediation-adapter-session-001',
        resumeToken: 'resume-token-remediation-adapter-001',
        resumeCount: 0,
        ...overrides,
    }
}

function makeAuditRecord(
    overrides: Partial<LegacyExecutionAuditRecord> = {}
): LegacyExecutionAuditRecord {
    return {
        proposalId: 'proposal-remediation-adapter-001',
        policyVersion: 'v1.7.1-local',
        policyHash: 'policy-hash-remediation-adapter-001',
        decision: 'approved',
        timestamp: 1709798400000,
        resumeContext: {
            sessionId: 'remediation-adapter-session-001',
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
                remediationMode: 'adapter',
            },
            riskHash: 'risk-remediation-adapter-001',
            mutationFingerprint: 'remediation-adapter',
            snapshotId: 'snapshot-remediation-adapter-001',
        },
        currentFileHashes: makeFileHashes(),
        sessionId: 'remediation-adapter-session-001',
        resumeToken: 'resume-token-remediation-adapter-001',
        ...overrides,
    }
}

describe('CVF v1.9 cross-extension remediation adapter conformance', () => {
    let snapshots: ExecutionSnapshot
    let freezer: ContextFreezer
    let orchestrator: CrossExtensionRecoveryOrchestrator
    let adapter: InMemoryRemediationAdapter

    beforeEach(() => {
        snapshots = new ExecutionSnapshot()
        freezer = new ContextFreezer()
        snapshots._clearAll()
        freezer._clearAll()
        orchestrator = new CrossExtensionRecoveryOrchestrator(snapshots, freezer)
        adapter = new InMemoryRemediationAdapter()
    })

    it('emits adapter receipts for resumed remediation steps', () => {
        const result = orchestrator.resumeOrRecover(makeInput())
        const execution = orchestrator.executeRemediation(result, adapter)

        expect(execution.blocked).toBe(false)
        expect(execution.adapterReceipts).toEqual([
            'RESUMED:proposal-remediation-adapter-001:persist_resume_evidence',
            'RESUMED:proposal-remediation-adapter-001:schedule_deterministic_replay_verification',
            'RESUMED:proposal-remediation-adapter-001:mark_trace_ready_for_append',
        ])
        expect(adapter.listReceipts()).toHaveLength(3)
    })

    it('emits adapter receipts for interrupted remediation steps', () => {
        const result = orchestrator.resumeOrRecover(
            makeInput({
                failureSignal: {
                    kind: 'RUNTIME_INTERRUPTION',
                    reason: 'worker crashed',
                    phase: 'VERIFICATION',
                },
            })
        )
        const execution = orchestrator.executeRemediation(result, adapter)

        expect(execution.blocked).toBe(false)
        expect(execution.adapterReceipts?.[0]).toContain('INTERRUPTED:proposal-remediation-adapter-001')
        expect(adapter.listReceipts()).toHaveLength(3)
    })

    it('keeps human-gated rollback-required remediation blocked even when an adapter is present', () => {
        const result = orchestrator.resumeOrRecover(
            makeInput({
                rollbackRecord: {
                    executionId: 'exec-remediation-adapter-001',
                    snapshotId: 'snapshot-remediation-adapter-001',
                    restoredAt: 1709798500000,
                    stateHash: 'state-hash-remediation-adapter-001',
                },
            })
        )
        const execution = orchestrator.executeRemediation(result, adapter)

        expect(execution.blocked).toBe(true)
        expect(execution.adapterReceipts).toBeUndefined()
        expect(adapter.listReceipts()).toHaveLength(0)
    })
})
