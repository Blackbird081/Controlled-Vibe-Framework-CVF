import { beforeEach, describe, expect, it } from 'vitest'
import { ContextFreezer } from '../core/context.freezer.js'
import { CrossExtensionReplayBridge } from '../core/cross.extension.replay.js'
import { ExecutionSnapshot } from '../core/execution.snapshot.js'
import type {
    CrossExtensionReplayInput,
    LegacyExecutionAuditRecord,
} from '../types/index.js'

function makeFileHashes(overrides: Record<string, string> = {}) {
    return {
        'src/policy.ts': 'hash-policy',
        'src/runtime.ts': 'hash-runtime',
        'docs/trace.md': 'hash-trace',
        ...overrides,
    }
}

function makeAuditRecord(
    overrides: Partial<LegacyExecutionAuditRecord> = {}
): LegacyExecutionAuditRecord {
    return {
        proposalId: 'proposal-audit-001',
        policyVersion: 'v1.7.1-local',
        policyHash: 'policy-hash-001',
        decision: 'approved',
        timestamp: 1709798400000,
        resumeContext: {
            sessionId: 'session-audit-001',
            checkpointedAt: 1709798300000,
            lastResumedAt: 1709798350000,
            resumeCount: 1,
            resumeAuthorized: true,
        },
        ...overrides,
    }
}

function makeReplayInput(
    overrides: Partial<CrossExtensionReplayInput> = {}
): CrossExtensionReplayInput {
    return {
        auditRecord: makeAuditRecord(),
        replaySeed: {
            role: 'developer',
            mode: 'SAFE',
            fileHashes: makeFileHashes(),
            policyVersion: 'v1.7.1-local',
            envMeta: {
                sourceExtension: 'CVF_v1.7.1_SAFETY_RUNTIME',
                replayTarget: 'CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY',
            },
            riskHash: 'risk-audit-001',
            mutationFingerprint: 'resume-journal-approved',
            snapshotId: 'checkpoint-session-audit-001',
        },
        currentFileHashes: makeFileHashes(),
        ...overrides,
    }
}

describe('CVF v1.9 cross-extension audit replay conformance', () => {
    let snapshots: ExecutionSnapshot
    let freezer: ContextFreezer
    let bridge: CrossExtensionReplayBridge

    beforeEach(() => {
        snapshots = new ExecutionSnapshot()
        freezer = new ContextFreezer()
        snapshots._clearAll()
        freezer._clearAll()
        bridge = new CrossExtensionReplayBridge(snapshots, freezer)
    })

    it('replays a v1.7.1 authorized audit record exactly when context is unchanged', () => {
        const result = bridge.replayFromLegacyAudit(makeReplayInput())

        expect(result.executionId).toBe('legacy-proposal-audit-001-1709798400000')
        expect(result.sourceProposalId).toBe('proposal-audit-001')
        expect(result.replay.status).toBe('EXACT')
        expect(result.replay.matches).toBe(true)
        expect(result.replay.contextDrift).toHaveLength(0)
    })

    it('reports drift when cross-extension replay context changes', () => {
        const result = bridge.replayFromLegacyAudit(
            makeReplayInput({
                currentFileHashes: makeFileHashes({ 'src/runtime.ts': 'hash-runtime-drifted' }),
            })
        )

        expect(result.replay.status).toBe('DRIFT')
        expect(result.replay.contextDrift).toContain('src/runtime.ts')
        expect(result.replay.matches).toBe(true)
    })

    it('fails closed for unauthorized resume audit linkage', () => {
        expect(() =>
            bridge.replayFromLegacyAudit(
                makeReplayInput({
                    auditRecord: makeAuditRecord({
                        resumeContext: {
                            sessionId: 'session-audit-unauthorized',
                            checkpointedAt: 1709798300000,
                            lastResumedAt: 1709798350000,
                            resumeCount: 1,
                            resumeAuthorized: false,
                        },
                    }),
                })
            )
        ).toThrow('unauthorized resume audit cannot seed replay')
    })
})
