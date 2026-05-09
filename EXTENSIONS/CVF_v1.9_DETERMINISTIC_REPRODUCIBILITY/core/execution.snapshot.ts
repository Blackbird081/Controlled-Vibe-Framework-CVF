// CVF v1.9 — Execution Snapshot
// Builds and stores the immutable ExecutionRecord at COMMIT phase.
// The record has exactly 9 fields — all immutable after creation.

import type { ExecutionRecord } from '../types/index.js'
import { computeDeterministicHash } from './deterministic.hash.js'

const _records = new Map<string, Readonly<ExecutionRecord>>()

export class ExecutionSnapshot {
    /**
     * Capture an immutable ExecutionRecord after a successful COMMIT.
     * All 9 fields are frozen — Object.freeze applied.
     */
    capture(input: {
        executionId: string
        role: string
        mode: 'SAFE' | 'BALANCED' | 'CREATIVE'
        frozenContextHash: string
        riskHash: string
        mutationFingerprint: string
        snapshotId: string
    }): Readonly<ExecutionRecord> {
        if (_records.has(input.executionId)) {
            throw new Error(
                `[CVF v1.9] ExecutionSnapshot: record already exists for executionId=${input.executionId}`
            )
        }

        const commitHash = computeDeterministicHash(
            input.executionId,
            input.riskHash,
            input.mutationFingerprint,
            input.snapshotId
        )

        const record: ExecutionRecord = {
            executionId: input.executionId,
            timestamp: Date.now(),
            role: input.role,
            mode: input.mode,
            frozenContextHash: input.frozenContextHash,
            riskHash: input.riskHash,
            mutationFingerprint: input.mutationFingerprint,
            snapshotId: input.snapshotId,
            commitHash,
        }

        const frozen = Object.freeze(record)
        _records.set(input.executionId, frozen)
        return frozen
    }

    /**
     * Look up a record. Throws if not found.
     */
    get(executionId: string): Readonly<ExecutionRecord> {
        const record = _records.get(executionId)
        if (!record) {
            throw new Error(
                `[CVF v1.9] ExecutionSnapshot: no record for executionId=${executionId}`
            )
        }
        return record
    }

    has(executionId: string): boolean {
        return _records.has(executionId)
    }

    /**
     * List all recorded execution IDs (for audit/browse).
     */
    listAll(): string[] {
        return Array.from(_records.keys())
    }

    /** For testing only */
    _clearAll(): void {
        _records.clear()
    }
}
