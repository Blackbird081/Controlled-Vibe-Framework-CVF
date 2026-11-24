import { MaoFileRunStore } from '../../../../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/durable.run.store';
import { milestoneIdempotencyKey } from '../../../../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/operational.worker.launcher.reconciliation';

/** Milestone suffix of the terminal event that records a provider attempt refused before any provider call. */
export const DENIED_NO_CALL_MILESTONE = 'DENIED_NO_CALL';

/**
 * Best-effort terminal event for a task whose provider attempt was refused before any provider call: a ledger-verified,
 * settled denial, or a Web admission refusal that ran after INVOCATION_STARTED. The launcher has already committed that start,
 * so the task is `running` and `running -> rejected` is the valid transition. Without this event the durable run keeps the
 * task `running` forever. Returns false on any failure and never throws, so the caller's outcome never depends on it.
 *
 * Callers must use it ONLY for provably no-call outcomes. Unknown outcomes, timeouts and provider errors keep `running` by design,
 * because the provider may have run.
 */
export async function recordDeniedNoCallTerminal(input: {
    durableRunPath: string;
    taskGraphId: string;
    taskId: string;
    launchIdempotencyKey: string;
}): Promise<boolean> {
    try {
        const appended = await new MaoFileRunStore(input.durableRunPath).appendEvent(input.taskGraphId, {
            taskGraphId: input.taskGraphId,
            taskId: input.taskId,
            eventType: 'TASK_TRANSITIONED',
            resultingState: 'rejected',
            occurredAt: new Date().toISOString(),
            idempotencyKey: milestoneIdempotencyKey(input.launchIdempotencyKey, DENIED_NO_CALL_MILESTONE),
        });
        return appended.ok;
    } catch {
        return false;
    }
}
