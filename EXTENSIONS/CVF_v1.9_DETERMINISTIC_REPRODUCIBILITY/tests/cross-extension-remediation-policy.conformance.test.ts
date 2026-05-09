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
        'src/remediation.ts': 'hash-remediation',
        'src/runtime.ts': 'hash-runtime',
    }
}

function makeCheckpoint(
    overrides: Partial<LegacyLifecycleCheckpoint> = {}
): LegacyLifecycleCheckpoint {
    return {
        proposalId: 'proposal-remediation-001',
        state: 'validated',
        policyVersion: 'v1.7.1-local',
        policyHash: 'policy-hash-remediation-001',
        simulateOnly: false,
        checkpointedAt: 1709798300000,
        sessionId: 'remediation-session-001',
        resumeToken: 'resume-token-remediation-001',
        resumeCount: 0,
        ...overrides,
    }
}

function makeAuditRecord(
    overrides: Partial<LegacyExecutionAuditRecord> = {}
): LegacyExecutionAuditRecord {
    return {
        proposalId: 'proposal-remediation-001',
        policyVersion: 'v1.7.1-local',
        policyHash: 'policy-hash-remediation-001',
        decision: 'approved',
        timestamp: 1709798400000,
        resumeContext: {
            sessionId: 'remediation-session-001',
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
                remediationMode: 'playbook-policy',
            },
            riskHash: 'risk-remediation-001',
            mutationFingerprint: 'remediation-policy',
            snapshotId: 'snapshot-remediation-001',
        },
        currentFileHashes: makeFileHashes(),
        sessionId: 'remediation-session-001',
        resumeToken: 'resume-token-remediation-001',
        ...overrides,
    }
}

describe('CVF v1.9 cross-extension remediation policy conformance', () => {
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

    it('attaches an informational remediation plan to successful resume', () => {
        const result = orchestrator.resumeOrRecover(makeInput())

        expect(result.action).toBe('RESUMED')
        expect(result.remediation?.severity).toBe('INFO')
        expect(result.remediation?.requiresHumanApproval).toBe(false)
        expect(result.remediation?.playbook).toContain('run deterministic replay verification')
    })

    it('attaches a critical human-gated remediation plan to rollback-required outcomes', () => {
        const result = orchestrator.resumeOrRecover(
            makeInput({
                rollbackRecord: {
                    executionId: 'exec-remediation-001',
                    snapshotId: 'snapshot-remediation-001',
                    restoredAt: 1709798500000,
                    stateHash: 'state-hash-remediation-001',
                },
            })
        )

        expect(result.action).toBe('ROLLBACK_REQUIRED')
        expect(result.remediation?.severity).toBe('CRITICAL')
        expect(result.remediation?.requiresHumanApproval).toBe(true)
        expect(result.remediation?.nextStep).toContain('Hold resume path')
    })

    it('attaches a refusal-specific remediation plan for policy refusal outcomes', () => {
        const result = orchestrator.resumeOrRecover(
            makeInput({
                failureSignal: {
                    kind: 'POLICY_REFUSAL',
                    reason: 'approval denied',
                    phase: 'RISK_ASSESSMENT',
                },
            })
        )

        expect(result.action).toBe('REFUSED')
        expect(result.remediation?.severity).toBe('WARN')
        expect(result.remediation?.requiresHumanApproval).toBe(true)
        expect(result.remediation?.playbook).toContain('do not retry until policy state changes')
    })
})
