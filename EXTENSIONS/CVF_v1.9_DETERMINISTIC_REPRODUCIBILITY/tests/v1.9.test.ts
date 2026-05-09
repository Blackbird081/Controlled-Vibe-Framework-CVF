// CVF v1.9 — Full Test Suite
// Tests: context freeze, deterministic hash, execution record, replay engine, validator

import { describe, it, expect, beforeEach } from 'vitest'
import { ContextFreezer } from '../core/context.freezer.js'
import { computeDeterministicHash, verifyHash } from '../core/deterministic.hash.js'
import { ExecutionSnapshot } from '../core/execution.snapshot.js'
import { ReplayEngine } from '../core/execution.replay.js'
import { ReplayValidator } from '../core/replay.validator.js'
import type { ExecutionRecord } from '../types/index.js'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeFileHashes(files: Record<string, string> = {}): Record<string, string> {
    return {
        'src/config.ts': 'abc123',
        'src/index.ts': 'def456',
        ...files,
    }
}

function makeRecord(overrides: Partial<ExecutionRecord> = {}): ExecutionRecord {
    const executionId = overrides.executionId ?? 'cvf-exec-test-00000001'
    const riskHash = overrides.riskHash ?? 'risk0001'
    const mutationFingerprint = overrides.mutationFingerprint ?? 'mut00001'
    const snapshotId = overrides.snapshotId ?? 'snap0001'
    const commitHash = computeDeterministicHash(executionId, riskHash, mutationFingerprint, snapshotId)
    return {
        executionId,
        timestamp: Date.now() - 1000,
        role: 'developer',
        mode: 'SAFE',
        frozenContextHash: 'ctx0001',
        riskHash,
        mutationFingerprint,
        snapshotId,
        commitHash,
        ...overrides,
    }
}

// ─── Context Freezer ─────────────────────────────────────────────────────────

describe('ContextFreezer', () => {
    let freezer: ContextFreezer

    beforeEach(() => {
        freezer = new ContextFreezer()
        freezer._clearAll()
    })

    it('produces a stable hash for the same context', () => {
        const h1 = freezer.freeze('exec-1', makeFileHashes(), 'v1.0')
        freezer._clearAll()
        const h2 = freezer.freeze('exec-1', makeFileHashes(), 'v1.0')
        expect(h1).toBe(h2)
    })

    it('produces different hashes for different file content', () => {
        const h1 = freezer.freeze('exec-1', makeFileHashes(), 'v1.0')
        freezer._clearAll()
        const h2 = freezer.freeze('exec-1', makeFileHashes({ 'src/config.ts': 'CHANGED' }), 'v1.0')
        expect(h1).not.toBe(h2)
    })

    it('produces different hashes for different policy versions', () => {
        const h1 = freezer.freeze('exec-1', makeFileHashes(), 'v1.0')
        freezer._clearAll()
        const h2 = freezer.freeze('exec-1', makeFileHashes(), 'v2.0')
        expect(h1).not.toBe(h2)
    })

    it('throws if freezing same executionId twice', () => {
        freezer.freeze('exec-1', makeFileHashes(), 'v1.0')
        expect(() => freezer.freeze('exec-1', makeFileHashes(), 'v1.0')).toThrow('already frozen')
    })

    it('throws if getting non-existent executionId', () => {
        expect(() => freezer.get('no-such-exec')).toThrow('no frozen context')
    })

    it('reports has() and computes hash for retrieved snapshot', () => {
        freezer.freeze('exec-has-1', makeFileHashes(), 'v1.0', { NODE_ENV: 'test' })
        expect(freezer.has('exec-has-1')).toBe(true)
        expect(freezer.has('exec-has-missing')).toBe(false)

        const snapshot = freezer.get('exec-has-1')
        const hash = freezer.computeHashForSnapshot(snapshot)
        expect(hash).toHaveLength(16)
    })

    it('detects context drift — changed file', () => {
        freezer.freeze('exec-1', makeFileHashes(), 'v1.0')
        const drift = freezer.detectDrift('exec-1', makeFileHashes({ 'src/config.ts': 'NEW-HASH' }))
        expect(drift).toContain('src/config.ts')
    })

    it('detects context drift — new file added', () => {
        freezer.freeze('exec-1', makeFileHashes(), 'v1.0')
        const drift = freezer.detectDrift('exec-1', makeFileHashes({ 'src/new-file.ts': 'newhash' }))
        expect(drift).toContain('src/new-file.ts')
    })

    it('returns empty drift when context is identical', () => {
        freezer.freeze('exec-1', makeFileHashes(), 'v1.0')
        const drift = freezer.detectDrift('exec-1', makeFileHashes())
        expect(drift).toHaveLength(0)
    })

    it('hash is deterministic regardless of key insertion order', () => {
        const h1 = freezer.freeze('exec-1', { 'b.ts': 'hash2', 'a.ts': 'hash1' }, 'v1.0')
        freezer._clearAll()
        const h2 = freezer.freeze('exec-1', { 'a.ts': 'hash1', 'b.ts': 'hash2' }, 'v1.0')
        expect(h1).toBe(h2)
    })
})

// ─── Deterministic Hash ───────────────────────────────────────────────────────

describe('computeDeterministicHash', () => {
    it('same inputs always produce same hash', () => {
        const h1 = computeDeterministicHash('exec-1', 'risk-a', 'mut-b', 'snap-c')
        const h2 = computeDeterministicHash('exec-1', 'risk-a', 'mut-b', 'snap-c')
        expect(h1).toBe(h2)
    })

    it('any field difference changes hash (avalanche effect)', () => {
        const base = computeDeterministicHash('exec-1', 'risk-a', 'mut-b', 'snap-c')
        expect(computeDeterministicHash('exec-X', 'risk-a', 'mut-b', 'snap-c')).not.toBe(base)
        expect(computeDeterministicHash('exec-1', 'risk-X', 'mut-b', 'snap-c')).not.toBe(base)
        expect(computeDeterministicHash('exec-1', 'risk-a', 'mut-X', 'snap-c')).not.toBe(base)
        expect(computeDeterministicHash('exec-1', 'risk-a', 'mut-b', 'snap-X')).not.toBe(base)
    })

    it('output is 32 hex characters', () => {
        const h = computeDeterministicHash('exec-1', 'risk-a', 'mut-b', 'snap-c')
        expect(h).toHaveLength(32)
        expect(/^[0-9a-f]+$/.test(h)).toBe(true)
    })
})

describe('verifyHash', () => {
    it('returns true for valid hash', () => {
        const hash = computeDeterministicHash('exec-1', 'r', 'm', 's')
        expect(verifyHash(hash, 'exec-1', 'r', 'm', 's')).toBe(true)
    })

    it('returns false for tampered hash', () => {
        expect(verifyHash('tampered-hash', 'exec-1', 'r', 'm', 's')).toBe(false)
    })
})

// ─── Execution Snapshot ───────────────────────────────────────────────────────

describe('ExecutionSnapshot', () => {
    let store: ExecutionSnapshot

    beforeEach(() => {
        store = new ExecutionSnapshot()
        store._clearAll()
    })

    it('captures a complete 9-field record', () => {
        const record = store.capture({
            executionId: 'exec-1',
            role: 'developer',
            mode: 'SAFE',
            frozenContextHash: 'ctx001',
            riskHash: 'risk001',
            mutationFingerprint: 'mut001',
            snapshotId: 'snap001',
        })

        expect(record.executionId).toBe('exec-1')
        expect(record.role).toBe('developer')
        expect(record.mode).toBe('SAFE')
        expect(record.frozenContextHash).toBe('ctx001')
        expect(record.riskHash).toBe('risk001')
        expect(record.mutationFingerprint).toBe('mut001')
        expect(record.snapshotId).toBe('snap001')
        expect(record.commitHash).toHaveLength(32)
        expect(record.timestamp).toBeGreaterThan(0)
    })

    it('freezes record — fields are immutable', () => {
        const record = store.capture({
            executionId: 'exec-2',
            role: 'admin',
            mode: 'BALANCED',
            frozenContextHash: 'ctx',
            riskHash: 'r',
            mutationFingerprint: 'm',
            snapshotId: 's',
        })
        expect(Object.isFrozen(record)).toBe(true)
        // Attempting to modify should silently fail (strict mode would throw)
        expect(() => {
            ; (record as Record<string, unknown>)['role'] = 'hacker'
        }).toThrow()
    })

    it('throws on duplicate executionId', () => {
        const input = {
            executionId: 'exec-3',
            role: 'dev',
            mode: 'SAFE' as const,
            frozenContextHash: 'c',
            riskHash: 'r',
            mutationFingerprint: 'm',
            snapshotId: 's',
        }
        store.capture(input)
        expect(() => store.capture(input)).toThrow('record already exists')
    })

    it('retrieves stored record', () => {
        store.capture({
            executionId: 'exec-4',
            role: 'dev',
            mode: 'CREATIVE',
            frozenContextHash: 'c',
            riskHash: 'r',
            mutationFingerprint: 'm',
            snapshotId: 's',
        })
        const retrieved = store.get('exec-4')
        expect(retrieved.executionId).toBe('exec-4')
    })

    it('reports has() and listAll() for stored records', () => {
        store.capture({
            executionId: 'exec-5',
            role: 'dev',
            mode: 'SAFE',
            frozenContextHash: 'ctx-5',
            riskHash: 'risk-5',
            mutationFingerprint: 'mut-5',
            snapshotId: 'snap-5',
        })
        expect(store.has('exec-5')).toBe(true)
        expect(store.has('exec-missing')).toBe(false)
        expect(store.listAll()).toContain('exec-5')
    })

    it('throws if record not found', () => {
        expect(() => store.get('no-such')).toThrow('no record')
    })
})

// ─── Replay Engine ───────────────────────────────────────────────────────────

describe('ReplayEngine', () => {
    let snapshots: ExecutionSnapshot
    let freezer: ContextFreezer
    let engine: ReplayEngine

    beforeEach(() => {
        snapshots = new ExecutionSnapshot()
        snapshots._clearAll()
        freezer = new ContextFreezer()
        freezer._clearAll()
        engine = new ReplayEngine(snapshots, freezer)
    })

    function setupExecution(id: string): void {
        freezer.freeze(id, makeFileHashes(), 'v1.0')
        snapshots.capture({
            executionId: id,
            role: 'developer',
            mode: 'SAFE',
            frozenContextHash: 'ctx-hash',
            riskHash: 'risk001',
            mutationFingerprint: 'mut001',
            snapshotId: 'snap001',
        })
    }

    it('returns EXACT when context unchanged', () => {
        setupExecution('exec-replay-1')
        const result = engine.replay('exec-replay-1', { currentFileHashes: makeFileHashes() })
        expect(result.status).toBe('EXACT')
        expect(result.matches).toBe(true)
        expect(result.contextDrift).toHaveLength(0)
    })

    it('returns DRIFT when file content changed', () => {
        setupExecution('exec-replay-2')
        const result = engine.replay('exec-replay-2', {
            currentFileHashes: makeFileHashes({ 'src/config.ts': 'CHANGED' }),
        })
        expect(result.status).toBe('DRIFT')
        expect(result.contextDrift).toContain('src/config.ts')
    })

    it('reports risk drift when currentRiskScore is provided', () => {
        setupExecution('exec-replay-risk')
        const result = engine.replay('exec-replay-risk', {
            currentFileHashes: makeFileHashes(),
            currentRiskScore: 7,
        })
        expect(result.status).toBe('EXACT')
        expect(result.riskDrift).toBe(7)
    })

    it('returns FAILED for unknown executionId', () => {
        const result = engine.replay('no-such-exec', { currentFileHashes: makeFileHashes() })
        expect(result.status).toBe('FAILED')
        expect(result.matches).toBe(false)
    })

    it('provides both original and replay commitHash', () => {
        setupExecution('exec-replay-3')
        const result = engine.replay('exec-replay-3', { currentFileHashes: makeFileHashes() })
        expect(result.originalCommitHash).toHaveLength(32)
        expect(result.replayCommitHash).toHaveLength(32)
        expect(result.originalCommitHash).toBe(result.replayCommitHash)
    })
})

// ─── Replay Validator ────────────────────────────────────────────────────────

describe('ReplayValidator', () => {
    let validator: ReplayValidator

    beforeEach(() => { validator = new ReplayValidator() })

    it('validates a correct record', () => {
        const result = validator.validate(makeRecord())
        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
    })

    it('fails if commitHash is tampered', () => {
        const record = makeRecord({ commitHash: 'tampered-0000000000000000000000000' })
        const result = validator.validate(record)
        expect(result.valid).toBe(false)
        expect(result.errors.some(e => e.includes('commitHash integrity'))).toBe(true)
    })

    it('fails if required field is missing', () => {
        const record = makeRecord({ role: '' })
        const result = validator.validate(record)
        expect(result.valid).toBe(false)
        expect(result.errors.some(e => e.includes('role'))).toBe(true)
    })

    it('fails if mode is invalid', () => {
        const record = makeRecord({ mode: 'TURBO' as 'SAFE' })
        const result = validator.validate(record)
        expect(result.valid).toBe(false)
        expect(result.errors.some(e => e.includes('Invalid mode'))).toBe(true)
    })

    it('fails if timestamp is in the future', () => {
        const record = makeRecord({ timestamp: Date.now() + 5000 })
        const result = validator.validate(record)
        expect(result.valid).toBe(false)
        expect(result.errors.some(e => e.includes('timestamp is in the future'))).toBe(true)
    })

    it('assertValid throws on invalid record', () => {
        const record = makeRecord({ commitHash: 'bad' })
        expect(() => validator.assertValid(record)).toThrow('invalid ExecutionRecord')
    })

    it('assertValid passes on valid record', () => {
        expect(() => validator.assertValid(makeRecord())).not.toThrow()
    })
})
