import { beforeEach, describe, expect, it } from 'vitest'
import { ContextFreezer } from '../core/context.freezer.js'
import { ReplayEngine } from '../core/execution.replay.js'
import { ExecutionSnapshot } from '../core/execution.snapshot.js'

function makeFileHashes(overrides: Record<string, string> = {}) {
    return {
        'src/app.ts': 'hash-app',
        'src/config.ts': 'hash-config',
        'README.md': 'hash-readme',
        ...overrides,
    }
}

describe('CVF v1.9 replay conformance', () => {
    let snapshots: ExecutionSnapshot
    let freezer: ContextFreezer
    let engine: ReplayEngine

    beforeEach(() => {
        snapshots = new ExecutionSnapshot()
        freezer = new ContextFreezer()
        snapshots._clearAll()
        freezer._clearAll()
        engine = new ReplayEngine(snapshots, freezer)
    })

    function setupExecution(executionId: string) {
        const frozenContextHash = freezer.freeze(executionId, makeFileHashes(), 'v1.0')
        return snapshots.capture({
            executionId,
            role: 'developer',
            mode: 'SAFE',
            frozenContextHash,
            riskHash: 'risk001',
            mutationFingerprint: 'mut001',
            snapshotId: 'snap001',
        })
    }

    it('replays exactly when context is unchanged', () => {
        const record = setupExecution('exec-replay-conformance-1')
        const result = engine.replay(record.executionId, { currentFileHashes: makeFileHashes() })

        expect(result.status).toBe('EXACT')
        expect(result.matches).toBe(true)
        expect(result.contextDrift).toHaveLength(0)
        expect(result.originalCommitHash).toBe(result.replayCommitHash)
    })

    it('reports drift when replay context changed', () => {
        setupExecution('exec-replay-conformance-2')
        const result = engine.replay('exec-replay-conformance-2', {
            currentFileHashes: makeFileHashes({ 'src/config.ts': 'changed-hash' }),
        })

        expect(result.status).toBe('DRIFT')
        expect(result.matches).toBe(true)
        expect(result.contextDrift).toContain('src/config.ts')
    })

    it('fails closed for unknown execution records', () => {
        const result = engine.replay('missing-execution', { currentFileHashes: makeFileHashes() })

        expect(result.status).toBe('FAILED')
        expect(result.matches).toBe(false)
        expect(result.originalCommitHash).toBe('')
        expect(result.replayCommitHash).toBe('')
    })
})
