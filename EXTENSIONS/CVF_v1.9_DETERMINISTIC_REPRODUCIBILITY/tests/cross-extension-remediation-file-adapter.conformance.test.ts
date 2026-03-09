import { existsSync, mkdtempSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ContextFreezer } from '../core/context.freezer.js'
import {
    FileBackedRemediationAdapter,
    InMemoryRemediationAdapter,
} from '../core/cross.extension.remediation.adapter.js'
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
        'src/runtime.ts': 'hash-runtime',
        'src/remediation-file-adapter.ts': 'hash-remediation-file-adapter',
    }
}

function makeCheckpoint(
    overrides: Partial<LegacyLifecycleCheckpoint> = {}
): LegacyLifecycleCheckpoint {
    return {
        proposalId: 'proposal-remediation-file-adapter-001',
        state: 'validated',
        policyVersion: 'v1.7.1-local',
        policyHash: 'policy-hash-remediation-file-adapter-001',
        simulateOnly: false,
        checkpointedAt: 1709799300000,
        sessionId: 'remediation-file-adapter-session-001',
        resumeToken: 'resume-token-remediation-file-adapter-001',
        resumeCount: 0,
        ...overrides,
    }
}

function makeAuditRecord(
    overrides: Partial<LegacyExecutionAuditRecord> = {}
): LegacyExecutionAuditRecord {
    return {
        proposalId: 'proposal-remediation-file-adapter-001',
        policyVersion: 'v1.7.1-local',
        policyHash: 'policy-hash-remediation-file-adapter-001',
        decision: 'approved',
        timestamp: 1709799400000,
        resumeContext: {
            sessionId: 'remediation-file-adapter-session-001',
            checkpointedAt: 1709799300000,
            lastResumedAt: 1709799350000,
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
                remediationMode: 'file-backed',
            },
            riskHash: 'risk-remediation-file-adapter-001',
            mutationFingerprint: 'remediation-file-adapter',
            snapshotId: 'snapshot-remediation-file-adapter-001',
        },
        currentFileHashes: makeFileHashes(),
        sessionId: 'remediation-file-adapter-session-001',
        resumeToken: 'resume-token-remediation-file-adapter-001',
        ...overrides,
    }
}

describe('CVF v1.9 cross-extension remediation file-backed adapter conformance', () => {
    let snapshots: ExecutionSnapshot
    let freezer: ContextFreezer
    let orchestrator: CrossExtensionRecoveryOrchestrator
    let tempDir: string
    let artifactPath: string

    beforeEach(() => {
        snapshots = new ExecutionSnapshot()
        freezer = new ContextFreezer()
        snapshots._clearAll()
        freezer._clearAll()
        orchestrator = new CrossExtensionRecoveryOrchestrator(snapshots, freezer)
        tempDir = mkdtempSync(join(tmpdir(), 'cvf-remediation-file-adapter-'))
        artifactPath = join(tempDir, 'receipts.json')
    })

    afterEach(async () => {
        await rm(tempDir, { recursive: true, force: true })
    })

    it('persists resumed remediation receipts into a file-backed artifact', () => {
        const adapter = new FileBackedRemediationAdapter(artifactPath)
        const result = orchestrator.resumeOrRecover(makeInput())
        const execution = orchestrator.executeRemediation(result, adapter)
        const artifact = adapter.readArtifact()

        expect(execution.blocked).toBe(false)
        expect(execution.adapterReceipts).toHaveLength(3)
        expect(existsSync(artifactPath)).toBe(true)
        expect(artifact.receiptCount).toBe(3)
        expect(artifact.receipts.map(receipt => receipt.step)).toEqual([
            'persist_resume_evidence',
            'schedule_deterministic_replay_verification',
            'mark_trace_ready_for_append',
        ])
        expect(artifact.receipts[0]?.action).toBe('RESUMED')
    })

    it('appends interrupted remediation receipts without losing prior runtime artifacts', () => {
        const adapter = new FileBackedRemediationAdapter(artifactPath)

        orchestrator.executeRemediation(orchestrator.resumeOrRecover(makeInput()), adapter)
        orchestrator.executeRemediation(
            orchestrator.resumeOrRecover(
                makeInput({
                    failureSignal: {
                        kind: 'RUNTIME_INTERRUPTION',
                        reason: 'worker stopped responding',
                        phase: 'REPLAY',
                    },
                })
            ),
            adapter
        )

        const artifact = adapter.readArtifact()
        expect(artifact.receiptCount).toBe(6)
        expect(artifact.receipts.slice(0, 3).every(receipt => receipt.action === 'RESUMED')).toBe(true)
        expect(artifact.receipts.slice(3).every(receipt => receipt.action === 'INTERRUPTED')).toBe(true)
    })

    it('keeps rollback-required remediation blocked and leaves the file-backed artifact untouched', () => {
        const adapter = new FileBackedRemediationAdapter(artifactPath)
        const controlAdapter = new InMemoryRemediationAdapter()
        const result = orchestrator.resumeOrRecover(
            makeInput({
                rollbackRecord: {
                    executionId: 'exec-remediation-file-adapter-001',
                    snapshotId: 'snapshot-remediation-file-adapter-001',
                    restoredAt: 1709799500000,
                    stateHash: 'state-hash-remediation-file-adapter-001',
                },
            })
        )
        const execution = orchestrator.executeRemediation(result, adapter)

        orchestrator.executeRemediation(result, controlAdapter)

        expect(execution.blocked).toBe(true)
        expect(existsSync(artifactPath)).toBe(false)
        expect(adapter.listReceipts()).toHaveLength(0)
        expect(controlAdapter.listReceipts()).toHaveLength(0)
    })
})
