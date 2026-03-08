import { beforeEach, describe, expect, it } from 'vitest'
import { ContextFreezer } from '../core/context.freezer.js'
import { CrossExtensionWorkflowResumeBridge } from '../core/cross.extension.workflow.resume.js'
import { ExecutionSnapshot } from '../core/execution.snapshot.js'
import type {
    CrossExtensionWorkflowResumeInput,
    LegacyExecutionAuditRecord,
    LegacyLifecycleCheckpoint,
} from '../types/index.js'

function makeFileHashes(overrides: Record<string, string> = {}) {
    return {
        'src/policy.ts': 'hash-policy',
        'src/workflow.ts': 'hash-workflow',
        'src/runtime.ts': 'hash-runtime',
        ...overrides,
    }
}

function makeCheckpoint(
    overrides: Partial<LegacyLifecycleCheckpoint> = {}
): LegacyLifecycleCheckpoint {
    return {
        proposalId: 'proposal-workflow-001',
        state: 'validated',
        policyVersion: 'v1.7.1-local',
        policyHash: 'policy-hash-workflow-001',
        simulateOnly: false,
        checkpointedAt: 1709798300000,
        sessionId: 'workflow-session-001',
        resumeToken: 'resume-token-001',
        resumeCount: 1,
        lastResumedAt: 1709798350000,
        ...overrides,
    }
}

function makeAuditRecord(
    overrides: Partial<LegacyExecutionAuditRecord> = {}
): LegacyExecutionAuditRecord {
    return {
        proposalId: 'proposal-workflow-001',
        policyVersion: 'v1.7.1-local',
        policyHash: 'policy-hash-workflow-001',
        decision: 'approved',
        timestamp: 1709798400000,
        resumeContext: {
            sessionId: 'workflow-session-001',
            checkpointedAt: 1709798300000,
            lastResumedAt: 1709798350000,
            resumeCount: 1,
            resumeAuthorized: true,
        },
        ...overrides,
    }
}

function makeInput(
    overrides: Partial<CrossExtensionWorkflowResumeInput> = {}
): CrossExtensionWorkflowResumeInput {
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
                bridgeMode: 'cross-extension-workflow-resume',
            },
            riskHash: 'risk-workflow-001',
            mutationFingerprint: 'workflow-resume-approved',
            snapshotId: 'checkpoint-workflow-001',
        },
        currentFileHashes: makeFileHashes(),
        sessionId: 'workflow-session-001',
        resumeToken: 'resume-token-001',
        ...overrides,
    }
}

describe('CVF v1.9 cross-extension workflow resume conformance', () => {
    let snapshots: ExecutionSnapshot
    let freezer: ContextFreezer
    let bridge: CrossExtensionWorkflowResumeBridge

    beforeEach(() => {
        snapshots = new ExecutionSnapshot()
        freezer = new ContextFreezer()
        snapshots._clearAll()
        freezer._clearAll()
        bridge = new CrossExtensionWorkflowResumeBridge(snapshots, freezer)
    })

    it('resumes a validated v1.7.1 checkpoint into v1.9 replay when session and token match', () => {
        const result = bridge.resumeWorkflow(makeInput())

        expect(result.resumed).toBe(true)
        expect(result.resumeCount).toBe(2)
        expect(result.checkpointState).toBe('validated')
        expect(result.sessionId).toBe('workflow-session-001')
        expect(result.replay.status).toBe('EXACT')
    })

    it('fails closed when cross-extension resume token does not match the checkpoint', () => {
        expect(() =>
            bridge.resumeWorkflow(makeInput({ resumeToken: 'resume-token-wrong' }))
        ).toThrow('resume token mismatch')
    })

    it('fails closed when checkpoint is not in resumable validated state', () => {
        expect(() =>
            bridge.resumeWorkflow(makeInput({ checkpoint: makeCheckpoint({ state: 'approved' }) }))
        ).toThrow('checkpoint state approved is not resumable')
    })
})
