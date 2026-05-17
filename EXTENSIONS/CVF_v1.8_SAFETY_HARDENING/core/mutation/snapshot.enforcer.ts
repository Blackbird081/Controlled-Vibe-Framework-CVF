// CVF v1.8 — Snapshot Enforcer
// Mandatory: every execution that enters MUTATION_SANDBOX must have a snapshot.

import { createHash, randomUUID } from 'crypto'

export interface Snapshot {
    snapshotId: string
    executionId: string
    timestamp: number
    stateHash: string
    /** Opaque blob representing the pre-mutation state (file content, env, etc.) */
    stateData: Record<string, unknown>
}

const _snapshots = new Map<string, Snapshot>()

export class SnapshotEnforcer {
    /**
     * Create a snapshot before mutation. Returns snapshotId.
     * Throws if snapshot for this executionId already exists.
     */
    capture(executionId: string, stateData: Record<string, unknown>): Snapshot {
        if (_snapshots.has(executionId)) {
            throw new Error(
                `[CVF v1.8] SnapshotEnforcer: Snapshot already exists for executionId=${executionId}`
            )
        }

        const stateHash = createHash('sha256')
            .update(JSON.stringify(stateData))
            .digest('hex')
            .slice(0, 16)

        const snapshot: Snapshot = {
            snapshotId: `snap-${randomUUID().replace(/-/g, '').slice(0, 8)}`,
            executionId,
            timestamp: Date.now(),
            stateHash,
            stateData,
        }

        _snapshots.set(executionId, snapshot)
        return snapshot
    }

    /**
     * Retrieve a snapshot. Throws if none exists.
     */
    get(executionId: string): Snapshot {
        const snap = _snapshots.get(executionId)
        if (!snap) {
            throw new Error(
                `[CVF v1.8] SnapshotEnforcer: No snapshot found for executionId=${executionId}. ` +
                'Snapshot is mandatory before MUTATION_SANDBOX.'
            )
        }
        return snap
    }

    has(executionId: string): boolean {
        return _snapshots.has(executionId)
    }

    /** For testing only */
    _clearAll(): void {
        _snapshots.clear()
    }
}
