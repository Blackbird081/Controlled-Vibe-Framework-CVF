import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ContextFreezer } from '../core/context.freezer.js'
import { CrossExtensionRecoveryOrchestrator } from '../core/cross.extension.recovery.orchestrator.js'
import { ReleaseEvidenceRemediationAdapter } from '../core/cross.extension.remediation.adapter.js'
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
        'src/release-adapter.ts': 'hash-release-adapter',
    }
}

function makeCheckpoint(
    overrides: Partial<LegacyLifecycleCheckpoint> = {}
): LegacyLifecycleCheckpoint {
    return {
        proposalId: 'proposal-remediation-release-adapter-001',
        state: 'validated',
        policyVersion: 'v1.7.1-local',
        policyHash: 'policy-hash-remediation-release-adapter-001',
        simulateOnly: false,
        checkpointedAt: 1709801300000,
        sessionId: 'remediation-release-adapter-session-001',
        resumeToken: 'resume-token-remediation-release-adapter-001',
        resumeCount: 0,
        ...overrides,
    }
}

function makeAuditRecord(
    overrides: Partial<LegacyExecutionAuditRecord> = {}
): LegacyExecutionAuditRecord {
    return {
        proposalId: 'proposal-remediation-release-adapter-001',
        policyVersion: 'v1.7.1-local',
        policyHash: 'policy-hash-remediation-release-adapter-001',
        decision: 'approved',
        timestamp: 1709801400000,
        resumeContext: {
            sessionId: 'remediation-release-adapter-session-001',
            checkpointedAt: 1709801300000,
            lastResumedAt: 1709801350000,
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
                remediationMode: 'release-adapter',
            },
            riskHash: 'risk-remediation-release-adapter-001',
            mutationFingerprint: 'remediation-release-adapter',
            snapshotId: 'snapshot-remediation-release-adapter-001',
        },
        currentFileHashes: makeFileHashes(),
        sessionId: 'remediation-release-adapter-session-001',
        resumeToken: 'resume-token-remediation-release-adapter-001',
        ...overrides,
    }
}

describe('CVF v1.9 cross-extension remediation release adapter conformance', () => {
    let snapshots: ExecutionSnapshot
    let freezer: ContextFreezer
    let orchestrator: CrossExtensionRecoveryOrchestrator
    let tempDir: string
    let artifactPath: string
    let markdownPath: string

    beforeEach(() => {
        snapshots = new ExecutionSnapshot()
        freezer = new ContextFreezer()
        snapshots._clearAll()
        freezer._clearAll()
        orchestrator = new CrossExtensionRecoveryOrchestrator(snapshots, freezer)
        tempDir = mkdtempSync(join(tmpdir(), 'cvf-remediation-release-adapter-'))
        artifactPath = join(tempDir, 'receipts.json')
        markdownPath = join(tempDir, 'receipts.md')
    })

    afterEach(async () => {
        await rm(tempDir, { recursive: true, force: true })
    })

    it('writes both machine-readable and markdown remediation evidence for resumed outcomes', () => {
        const adapter = new ReleaseEvidenceRemediationAdapter(artifactPath, markdownPath)
        const result = orchestrator.resumeOrRecover(makeInput())
        const execution = orchestrator.executeRemediation(result, adapter)
        const markdown = readFileSync(markdownPath, 'utf-8')

        expect(execution.blocked).toBe(false)
        expect(execution.adapterReceipts).toHaveLength(3)
        expect(existsSync(artifactPath)).toBe(true)
        expect(existsSync(markdownPath)).toBe(true)
        expect(markdown).toContain('## Action Summary')
        expect(markdown).toContain('- RESUMED: `3`')
    })

    it('updates markdown evidence after interrupted remediation without losing prior receipts', () => {
        const adapter = new ReleaseEvidenceRemediationAdapter(artifactPath, markdownPath)

        orchestrator.executeRemediation(orchestrator.resumeOrRecover(makeInput()), adapter)
        orchestrator.executeRemediation(
            orchestrator.resumeOrRecover(
                makeInput({
                    failureSignal: {
                        kind: 'RUNTIME_INTERRUPTION',
                        reason: 'worker paused for recovery',
                        phase: 'REPLAY',
                    },
                })
            ),
            adapter
        )

        const markdown = readFileSync(markdownPath, 'utf-8')
        expect(markdown).toContain('- INTERRUPTED: `3`')
        expect(markdown).toContain('- RESUMED: `3`')
        expect(markdown).toContain('proposal-remediation-release-adapter-001')
    })

    it('keeps release evidence absent for rollback-required outcomes', () => {
        const adapter = new ReleaseEvidenceRemediationAdapter(artifactPath, markdownPath)
        const result = orchestrator.resumeOrRecover(
            makeInput({
                rollbackRecord: {
                    executionId: 'exec-remediation-release-adapter-001',
                    snapshotId: 'snapshot-remediation-release-adapter-001',
                    restoredAt: 1709801500000,
                    stateHash: 'state-hash-remediation-release-adapter-001',
                },
            })
        )
        const execution = orchestrator.executeRemediation(result, adapter)

        expect(execution.blocked).toBe(true)
        expect(existsSync(artifactPath)).toBe(false)
        expect(existsSync(markdownPath)).toBe(false)
    })
})
