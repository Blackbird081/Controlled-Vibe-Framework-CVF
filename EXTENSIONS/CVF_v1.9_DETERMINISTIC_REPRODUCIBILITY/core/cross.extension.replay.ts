import type {
    CrossExtensionReplayInput,
    CrossExtensionReplayResult,
    LegacyExecutionAuditRecord,
} from '../types/index.js'
import { ContextFreezer } from './context.freezer.js'
import { ReplayEngine } from './execution.replay.js'
import { ExecutionSnapshot } from './execution.snapshot.js'

export class CrossExtensionReplayBridge {
    private snapshots: ExecutionSnapshot
    private freezer: ContextFreezer
    private engine: ReplayEngine

    constructor(snapshots?: ExecutionSnapshot, freezer?: ContextFreezer) {
        this.snapshots = snapshots ?? new ExecutionSnapshot()
        this.freezer = freezer ?? new ContextFreezer()
        this.engine = new ReplayEngine(this.snapshots, this.freezer)
    }

    replayFromLegacyAudit(input: CrossExtensionReplayInput): CrossExtensionReplayResult {
        this.assertReplayable(input.auditRecord)

        const executionId =
            input.replaySeed.executionId ?? this.buildExecutionId(input.auditRecord)

        if (!this.freezer.has(executionId)) {
            this.freezer.freeze(
                executionId,
                input.replaySeed.fileHashes,
                input.replaySeed.policyVersion,
                input.replaySeed.envMeta ?? {}
            )
        }

        if (!this.snapshots.has(executionId)) {
            const frozenContextHash = this.freezer.computeHashForSnapshot(
                this.freezer.get(executionId)
            )

            this.snapshots.capture({
                executionId,
                role: input.replaySeed.role,
                mode: input.replaySeed.mode,
                frozenContextHash,
                riskHash: input.replaySeed.riskHash,
                mutationFingerprint: input.replaySeed.mutationFingerprint,
                snapshotId: input.replaySeed.snapshotId,
            })
        }

        return {
            executionId,
            sourceProposalId: input.auditRecord.proposalId,
            replay: this.engine.replay(executionId, {
                currentFileHashes: input.currentFileHashes,
                currentRiskScore: input.currentRiskScore,
            }),
        }
    }

    private assertReplayable(record: LegacyExecutionAuditRecord) {
        if (record.decision === 'pending') {
            throw new Error('[CVF v1.9] CrossExtensionReplayBridge: pending audit records are not replayable')
        }

        if (record.resumeContext && !record.resumeContext.resumeAuthorized) {
            throw new Error(
                '[CVF v1.9] CrossExtensionReplayBridge: unauthorized resume audit cannot seed replay'
            )
        }
    }

    private buildExecutionId(record: LegacyExecutionAuditRecord): string {
        return `legacy-${record.proposalId}-${record.timestamp}`
    }
}
