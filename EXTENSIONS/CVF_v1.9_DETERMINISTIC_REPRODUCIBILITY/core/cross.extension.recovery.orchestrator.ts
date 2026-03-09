import type {
    CrossExtensionRemediationAdapter,
    CrossExtensionRecoveryInput,
    CrossExtensionRecoveryResult,
    CrossExtensionRemediationExecution,
    CrossExtensionRemediationPolicy,
} from '../types/index.js'
import { ContextFreezer } from './context.freezer.js'
import { ExecutionSnapshot } from './execution.snapshot.js'
import { CrossExtensionWorkflowResumeBridge } from './cross.extension.workflow.resume.js'

export class CrossExtensionRecoveryOrchestrator {
    private workflowBridge: CrossExtensionWorkflowResumeBridge

    constructor(snapshots?: ExecutionSnapshot, freezer?: ContextFreezer) {
        this.workflowBridge = new CrossExtensionWorkflowResumeBridge(snapshots, freezer)
    }

    resumeOrRecover(input: CrossExtensionRecoveryInput): CrossExtensionRecoveryResult {
        if (input.rollbackRecord) {
            this.assertRollbackAlignment(input)
            return {
                action: 'ROLLBACK_REQUIRED',
                sourceProposalId: input.auditRecord.proposalId,
                resumed: false,
                rollbackRecord: input.rollbackRecord,
                remediation: this.buildRemediation('ROLLBACK_REQUIRED'),
            }
        }

        if (input.failureSignal) {
            const action = this.mapFailureAction(input.failureSignal.kind)
            return {
                action,
                sourceProposalId: input.auditRecord.proposalId,
                resumed: false,
                failureSignal: input.failureSignal,
                remediation: this.buildRemediation(action),
            }
        }

        return {
            action: 'RESUMED',
            sourceProposalId: input.auditRecord.proposalId,
            resumed: true,
            workflow: this.workflowBridge.resumeWorkflow(input),
            remediation: this.buildRemediation('RESUMED'),
        }
    }

    executeRemediation(
        result: CrossExtensionRecoveryResult,
        adapter?: CrossExtensionRemediationAdapter
    ): CrossExtensionRemediationExecution {
        switch (result.action) {
            case 'RESUMED':
                return this.runAutomatedSteps(
                    result,
                    [
                        'persist_resume_evidence',
                        'schedule_deterministic_replay_verification',
                        'mark_trace_ready_for_append',
                    ],
                    adapter
                )
            case 'INTERRUPTED':
                return this.runAutomatedSteps(
                    result,
                    [
                        'verify_checkpoint_integrity',
                        'prepare_retry_from_latest_checkpoint',
                        'mark_runtime_recovery_pending',
                    ],
                    adapter
                )
            case 'ROLLBACK_REQUIRED':
            case 'REFUSED':
            case 'ABORTED':
                return {
                    automated: false,
                    blocked: true,
                    executedSteps: [],
                    blockedReason: 'Human approval required before remediation can execute.',
                }
        }
    }

    private runAutomatedSteps(
        result: CrossExtensionRecoveryResult,
        steps: string[],
        adapter?: CrossExtensionRemediationAdapter
    ): CrossExtensionRemediationExecution {
        const adapterReceipts = adapter
            ? steps.map(step =>
                adapter.execute(step, {
                    action: result.action,
                    sourceProposalId: result.sourceProposalId,
                })
            )
            : undefined

        return {
                    automated: true,
                    blocked: false,
                    executedSteps: steps,
                    adapterReceipts,
                }
    }

    private assertRollbackAlignment(input: CrossExtensionRecoveryInput) {
        if (!input.rollbackRecord) {
            return
        }

        if (input.rollbackRecord.snapshotId !== input.replaySeed.snapshotId) {
            throw new Error(
                '[CVF v1.9] CrossExtensionRecoveryOrchestrator: rollback snapshot mismatch'
            )
        }
    }

    private mapFailureAction(
        kind: CrossExtensionRecoveryInput['failureSignal'] extends infer T
            ? T extends { kind: infer K }
                ? K
                : never
            : never
    ): CrossExtensionRecoveryResult['action'] {
        switch (kind) {
            case 'RUNTIME_INTERRUPTION':
                return 'INTERRUPTED'
            case 'POLICY_REFUSAL':
                return 'REFUSED'
            case 'SYSTEM_ABORT':
                return 'ABORTED'
            default:
                throw new Error('[CVF v1.9] CrossExtensionRecoveryOrchestrator: unknown failure signal')
        }
    }

    private buildRemediation(
        action: CrossExtensionRecoveryResult['action']
    ): CrossExtensionRemediationPolicy {
        switch (action) {
            case 'RESUMED':
                return {
                    severity: 'INFO',
                    requiresHumanApproval: false,
                    nextStep: 'Continue deterministic replay verification and capture release trace.',
                    playbook: [
                        'persist resumed workflow evidence',
                        'run deterministic replay verification',
                        'append trace and test log entries',
                    ],
                }
            case 'ROLLBACK_REQUIRED':
                return {
                    severity: 'CRITICAL',
                    requiresHumanApproval: true,
                    nextStep: 'Hold resume path and review rollback evidence before any retry.',
                    playbook: [
                        'freeze affected workflow',
                        'review rollback record and snapshot linkage',
                        'require human approval before new execution attempt',
                    ],
                }
            case 'INTERRUPTED':
                return {
                    severity: 'WARN',
                    requiresHumanApproval: false,
                    nextStep: 'Restore execution environment and retry from the latest valid checkpoint.',
                    playbook: [
                        'stabilize runtime dependency or process boundary',
                        'verify checkpoint integrity',
                        'retry from last valid checkpoint with fresh trace entry',
                    ],
                }
            case 'REFUSED':
                return {
                    severity: 'WARN',
                    requiresHumanApproval: true,
                    nextStep: 'Route to policy review instead of retrying execution.',
                    playbook: [
                        'preserve refusal evidence',
                        'request policy or approval review',
                        'do not retry until policy state changes',
                    ],
                }
            case 'ABORTED':
                return {
                    severity: 'CRITICAL',
                    requiresHumanApproval: true,
                    nextStep: 'Treat as system-stop event and investigate kernel integrity before restart.',
                    playbook: [
                        'halt downstream automation',
                        'investigate abort root cause and integrity signals',
                        'require human sign-off before system restart',
                    ],
                }
        }
    }
}
