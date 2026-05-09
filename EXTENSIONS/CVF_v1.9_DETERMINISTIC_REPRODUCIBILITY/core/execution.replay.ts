// CVF v1.9 — Replay Engine
// Replays any recorded execution for audit purposes.
// Replay is read-only — it does NOT re-apply mutations.
//
// Purpose: verify that the same inputs would produce the same commitHash.
// If context has drifted, replay reports DRIFT status.

import type { ReplayResult, ReplayStatus } from '../types/index.js'
import { ExecutionSnapshot } from './execution.snapshot.js'
import { ContextFreezer } from './context.freezer.js'
import { computeDeterministicHash } from './deterministic.hash.js'

export interface ReplayInput {
    /** Current file hashes at replay time */
    currentFileHashes: Record<string, string>
    /** Current risk score at replay time (for drift detection) */
    currentRiskScore?: number
}

export class ReplayEngine {
    private snapshots: ExecutionSnapshot
    private freezer: ContextFreezer

    constructor(snapshots?: ExecutionSnapshot, freezer?: ContextFreezer) {
        this.snapshots = snapshots ?? new ExecutionSnapshot()
        this.freezer = freezer ?? new ContextFreezer()
    }

    /**
     * Replay a past execution.
     * Returns a ReplayResult — never throws (errors become FAILED status).
     */
    replay(executionId: string, input: ReplayInput): ReplayResult {
        const replayedAt = Date.now()

        try {
            const record = this.snapshots.get(executionId)
            const contextDrift = this.freezer.detectDrift(executionId, input.currentFileHashes)

            // Recompute the commit hash using the SAME components as original
            // (mutationFingerprint and snapshotId don't change — they're from the record)
            const replayCommitHash = computeDeterministicHash(
                record.executionId,
                record.riskHash,
                record.mutationFingerprint,
                record.snapshotId
            )

            const matches = replayCommitHash === record.commitHash
            const riskDrift = Math.abs((input.currentRiskScore ?? 0) - 0) // 0 = baseline if not provided

            let status: ReplayStatus
            if (!matches || contextDrift.length > 0) {
                status = 'DRIFT'
            } else {
                status = 'EXACT'
            }

            return {
                originalExecutionId: executionId,
                replayedAt,
                status,
                matches,
                contextDrift,
                riskDrift: input.currentRiskScore !== undefined ? riskDrift : 0,
                originalCommitHash: record.commitHash,
                replayCommitHash,
            }
        } catch (err) {
            return {
                originalExecutionId: executionId,
                replayedAt,
                status: 'FAILED',
                matches: false,
                contextDrift: [],
                riskDrift: 0,
                originalCommitHash: '',
                replayCommitHash: '',
            }
        }
    }
}
