import { mkdtempSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ContextFreezer } from '../core/context.freezer.js'
import { FileBackedRemediationAdapter } from '../core/cross.extension.remediation.adapter.js'
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
        'src/remediation-export.ts': 'hash-remediation-export',
    }
}

function makeCheckpoint(
    overrides: Partial<LegacyLifecycleCheckpoint> = {}
): LegacyLifecycleCheckpoint {
    return {
        proposalId: 'proposal-remediation-export-001',
        state: 'validated',
        policyVersion: 'v1.7.1-local',
        policyHash: 'policy-hash-remediation-export-001',
        simulateOnly: false,
        checkpointedAt: 1709800300000,
        sessionId: 'remediation-export-session-001',
        resumeToken: 'resume-token-remediation-export-001',
        resumeCount: 0,
        ...overrides,
    }
}

function makeAuditRecord(
    overrides: Partial<LegacyExecutionAuditRecord> = {}
): LegacyExecutionAuditRecord {
    return {
        proposalId: 'proposal-remediation-export-001',
        policyVersion: 'v1.7.1-local',
        policyHash: 'policy-hash-remediation-export-001',
        decision: 'approved',
        timestamp: 1709800400000,
        resumeContext: {
            sessionId: 'remediation-export-session-001',
            checkpointedAt: 1709800300000,
            lastResumedAt: 1709800350000,
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
                remediationMode: 'export',
            },
            riskHash: 'risk-remediation-export-001',
            mutationFingerprint: 'remediation-export',
            snapshotId: 'snapshot-remediation-export-001',
        },
        currentFileHashes: makeFileHashes(),
        sessionId: 'remediation-export-session-001',
        resumeToken: 'resume-token-remediation-export-001',
        ...overrides,
    }
}

describe('CVF v1.9 cross-extension remediation export conformance', () => {
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
        tempDir = mkdtempSync(join(tmpdir(), 'cvf-remediation-export-'))
        artifactPath = process.env.CVF_REMEDIATION_ARTIFACT_PATH || join(tempDir, 'receipts.json')
    })

    afterEach(async () => {
        if (!process.env.CVF_REMEDIATION_ARTIFACT_PATH) {
            await rm(tempDir, { recursive: true, force: true })
        }
    })

    it('builds a canonical receipt artifact suitable for markdown export', () => {
        const adapter = new FileBackedRemediationAdapter(artifactPath)

        orchestrator.executeRemediation(orchestrator.resumeOrRecover(makeInput()), adapter)
        orchestrator.executeRemediation(
            orchestrator.resumeOrRecover(
                makeInput({
                    failureSignal: {
                        kind: 'RUNTIME_INTERRUPTION',
                        reason: 'worker restart requested',
                        phase: 'REPLAY',
                    },
                })
            ),
            adapter
        )
        orchestrator.executeRemediation(
            orchestrator.resumeOrRecover(
                makeInput({
                    rollbackRecord: {
                        executionId: 'exec-remediation-export-001',
                        snapshotId: 'snapshot-remediation-export-001',
                        restoredAt: 1709800500000,
                        stateHash: 'state-hash-remediation-export-001',
                    },
                })
            ),
            adapter
        )

        const artifact = adapter.readArtifact()
        expect(artifact.receiptCount).toBe(6)
        expect(artifact.receipts.filter(receipt => receipt.action === 'RESUMED')).toHaveLength(3)
        expect(artifact.receipts.filter(receipt => receipt.action === 'INTERRUPTED')).toHaveLength(3)
        expect(artifact.receipts.every(receipt => receipt.sourceProposalId === 'proposal-remediation-export-001')).toBe(true)
    })
})
