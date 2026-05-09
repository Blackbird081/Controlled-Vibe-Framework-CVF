import type {
    CrossExtensionWorkflowResumeInput,
    CrossExtensionWorkflowResumeResult,
    LegacyLifecycleCheckpoint,
} from '../types/index.js'
import { CrossExtensionReplayBridge } from './cross.extension.replay.js'
import { ContextFreezer } from './context.freezer.js'
import { ExecutionSnapshot } from './execution.snapshot.js'

export class CrossExtensionWorkflowResumeBridge {
    private replayBridge: CrossExtensionReplayBridge

    constructor(snapshots?: ExecutionSnapshot, freezer?: ContextFreezer) {
        this.replayBridge = new CrossExtensionReplayBridge(snapshots, freezer)
    }

    resumeWorkflow(input: CrossExtensionWorkflowResumeInput): CrossExtensionWorkflowResumeResult {
        this.assertCheckpointReady(input.checkpoint)
        this.assertResumeAccess(input.checkpoint, input.sessionId, input.resumeToken)

        const replayResult = this.replayBridge.replayFromLegacyAudit(input)
        return {
            ...replayResult,
            resumed: true,
            resumeCount: input.checkpoint.resumeCount + 1,
            checkpointState: input.checkpoint.state,
            sessionId: input.checkpoint.sessionId,
        }
    }

    private assertCheckpointReady(checkpoint: LegacyLifecycleCheckpoint) {
        if (checkpoint.state !== 'validated') {
            throw new Error(
                `[CVF v1.9] CrossExtensionWorkflowResumeBridge: checkpoint state ${checkpoint.state} is not resumable`
            )
        }

        if (checkpoint.simulateOnly) {
            throw new Error(
                '[CVF v1.9] CrossExtensionWorkflowResumeBridge: simulateOnly checkpoints do not seed cross-extension workflow resume'
            )
        }
    }

    private assertResumeAccess(
        checkpoint: LegacyLifecycleCheckpoint,
        sessionId?: string,
        resumeToken?: string
    ) {
        if (resumeToken && resumeToken !== checkpoint.resumeToken) {
            throw new Error(
                '[CVF v1.9] CrossExtensionWorkflowResumeBridge: resume token mismatch'
            )
        }

        if (checkpoint.sessionId && sessionId && sessionId !== checkpoint.sessionId) {
            throw new Error(
                '[CVF v1.9] CrossExtensionWorkflowResumeBridge: resume session mismatch'
            )
        }
    }
}
