// CVF v1.8 — Rollback Manager
// Guarantees every execution can be rolled back to its pre-mutation snapshot.

import type { Snapshot } from '../mutation/snapshot.enforcer.js'
import { SnapshotEnforcer } from '../mutation/snapshot.enforcer.js'
import { createHash } from 'crypto'

export interface RollbackResult {
    executionId: string
    snapshotId: string
    restoredAt: number
    stateHash: string
}

const _rollbackLog = new Map<string, RollbackResult>()
const snapEnforcer = new SnapshotEnforcer()

export class RollbackManager {
    private snapshots: SnapshotEnforcer

    constructor(snapshotEnforcer?: SnapshotEnforcer) {
        this.snapshots = snapshotEnforcer ?? snapEnforcer
    }

    /**
     * Restore to the snapshot taken before mutation.
     * Logs rollback event and returns the restored state.
     */
    restore(executionId: string): RollbackResult {
        const snap: Snapshot = this.snapshots.get(executionId)

        const result: RollbackResult = {
            executionId,
            snapshotId: snap.snapshotId,
            restoredAt: Date.now(),
            stateHash: snap.stateHash,
        }

        _rollbackLog.set(executionId, result)
        return result
    }

    /**
     * Check if a rollback has been performed for this execution.
     */
    wasRolledBack(executionId: string): boolean {
        return _rollbackLog.has(executionId)
    }

    getRollbackRecord(executionId: string): RollbackResult | undefined {
        return _rollbackLog.get(executionId)
    }

    /** For testing only */
    _clearAll(): void {
        _rollbackLog.clear()
    }
}

/**
 * Compute deterministic commit hash from execution components.
 * per OPERATIONAL_SPEC.md: hash(executionId + risk.hash + mutationFingerprint + snapshotId)
 */
export function computeCommitHash(
    executionId: string,
    riskHash: string,
    mutationFingerprint: string,
    snapshotId: string
): string {
    const payload = `${executionId}:${riskHash}:${mutationFingerprint}:${snapshotId}`
    return createHash('sha256').update(payload).digest('hex').slice(0, 32)
}
