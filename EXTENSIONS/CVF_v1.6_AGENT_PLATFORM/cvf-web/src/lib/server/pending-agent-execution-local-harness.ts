import { buildPendingAgentExecutionRuntime } from '../pending-agent-execution-composition';
import type {
    ApprovalRecordLookup,
    GuardPolicySnapshot,
    PendingAgentExecutionImmutablePayload,
    PendingAgentExecutionRecord,
    TerminalTransitionStatus,
} from '../pending-agent-execution';

export interface PendingAgentExecutionLocalHarnessInput {
    dbPath: string;
    pendingExecutionId: string;
    createdAt: string;
    payload: PendingAgentExecutionImmutablePayload;
    actor: PendingAgentExecutionImmutablePayload['binding']['actor'];
    requestId: string;
    now: string;
    lookupApproval: ApprovalRecordLookup;
    currentPolicySnapshot: GuardPolicySnapshot;
    generateClaimId: () => string;
    attemptIndex: number;
    terminalStatus: TerminalTransitionStatus;
    terminalReason: string;
    terminalAt: string;
}

export type PendingAgentExecutionLocalHarnessOutcome =
    | {
        ok: true;
        stage: 'TERMINAL';
        reason: string;
        record: PendingAgentExecutionRecord | null;
    }
    | {
        ok: false;
        stage: 'CONSTRUCT' | 'CREATE' | 'CLAIM' | 'BEGIN' | 'TERMINAL' | 'CLOSE';
        reason: string;
        record: PendingAgentExecutionRecord | null;
    };

export function runPendingAgentExecutionLocalHarness(
    input: PendingAgentExecutionLocalHarnessInput,
): PendingAgentExecutionLocalHarnessOutcome {
    let runtime: ReturnType<typeof buildPendingAgentExecutionRuntime>;
    try {
        runtime = buildPendingAgentExecutionRuntime(input.dbPath);
    } catch {
        return {
            ok: false,
            stage: 'CONSTRUCT',
            reason: 'CONSTRUCTION_FAILED',
            record: null,
        };
    }

    let outcome: PendingAgentExecutionLocalHarnessOutcome;
    try {
        const created = runtime.create(input.pendingExecutionId, input.createdAt, input.payload);
        if (!created.ok) {
            outcome = {
                ok: false,
                stage: 'CREATE',
                reason: created.reason,
                record: created.record,
            };
        } else {
            const claimed = runtime.claim({
                pendingExecutionId: input.pendingExecutionId,
                actor: input.actor,
                requestId: input.requestId,
                now: input.now,
                lookupApproval: input.lookupApproval,
                currentPolicySnapshot: input.currentPolicySnapshot,
                generateClaimId: input.generateClaimId,
            });

            if (!claimed.ok || claimed.grant === null) {
                outcome = {
                    ok: false,
                    stage: 'CLAIM',
                    reason: claimed.reason,
                    record: claimed.record,
                };
            } else {
                const claimId = claimed.grant.claimId;
                const begun = runtime.begin(claimed.grant, input.attemptIndex);
                if (!begun.ok) {
                    outcome = {
                        ok: false,
                        stage: 'BEGIN',
                        reason: begun.reason,
                        record: begun.record,
                    };
                } else {
                    const terminal = runtime.terminal({
                        pendingExecutionId: input.pendingExecutionId,
                        expectedVersion: begun.record.state.recordVersion,
                        claimId,
                        attemptIndex: input.attemptIndex,
                        status: input.terminalStatus,
                        reason: input.terminalReason,
                        at: input.terminalAt,
                    });
                    if (terminal.ok) {
                        outcome = {
                            ok: true,
                            stage: 'TERMINAL',
                            reason: terminal.reason,
                            record: terminal.record,
                        };
                    } else {
                        outcome = {
                            ok: false,
                            stage: 'TERMINAL',
                            reason: terminal.reason,
                            record: terminal.record,
                        };
                    }
                }
            }
        }
    } finally {
        try {
            runtime.close();
        } catch {
            outcome = {
                ok: false,
                stage: 'CLOSE',
                reason: 'CLOSE_FAILED',
                record: null,
            };
        }
    }

    return outcome;
}
