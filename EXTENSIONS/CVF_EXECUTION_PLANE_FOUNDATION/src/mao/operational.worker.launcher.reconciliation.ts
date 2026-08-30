// Deterministic event-evidence and reconciliation helpers for
// MaoOperationalWorkerLauncher. Split under GC-023 without changing behavior.

import type { MaoEventLedgerEntry, MaoTaskState } from "./event.ledger.contract";
import type { MaoTaskGraph } from "./task.graph.contract";
import type { MaoDelegationCompletionReceipt } from "./atomic.delegation.lifecycle.coordinator";

export function milestoneIdempotencyKey(launchIdempotencyKey: string, milestone: string): string {
  return `${launchIdempotencyKey}::${milestone}`;
}

export function findTask(graph: MaoTaskGraph, taskId: string) {
  return graph.tasks.find((task) => task.taskId === taskId) ?? null;
}

export function latestInvocationStartedAt(events: readonly MaoEventLedgerEntry[], taskId: string): string | null {
  let latest: string | null = null;
  for (const event of events) {
    if (event.taskId === taskId && event.eventType === "INVOCATION_STARTED") {
      latest = event.occurredAt;
    }
  }
  return latest;
}

export function currentStateOf(events: readonly MaoEventLedgerEntry[], taskId: string): MaoTaskState | null {
  let state: MaoTaskState | null = null;
  for (const event of events) {
    if (event.taskId === taskId) state = event.resultingState;
  }
  return state;
}

/**
 * The single durable event with the highest `sequence` among `taskId`'s
 * events - i.e. the one that most recently set `taskId`'s state to its
 * CURRENT value - or `null` if the task has no durable events at all.
 * Distinct from `currentStateOf`: this returns the EVENT (carrying its own
 * `idempotencyKey` and `sequence`), not just the resulting state, because
 * requirement 2 (reviewer RETURN_FOR_REWORK R6/final stabilization) needs to
 * know WHICH launch attempt produced that state, not merely what the state
 * is. Compares `.sequence` explicitly rather than trusting iteration/array
 * order, per the reviewer's instruction to use sequence ordering, not
 * array-position assumptions (`resumeRun` happens to already return events
 * in persisted/contiguous-sequence order, but this function does not rely
 * on that guarantee).
 */
export function latestEventFor(events: readonly MaoEventLedgerEntry[], taskId: string): MaoEventLedgerEntry | null {
  let latest: MaoEventLedgerEntry | null = null;
  for (const event of events) {
    if (event.taskId !== taskId) continue;
    if (latest === null || event.sequence > latest.sequence) latest = event;
  }
  return latest;
}

/**
 * Latest (by durable `sequence`, never by array position) event for
 * `taskId` whose `eventType` is `INVOCATION_STARTED`, at or before
 * `beforeSequence` when supplied. Used to locate the specific invocation
 * attempt a later TIMEOUT_DETECTED/CANCEL_ACCEPTED event belongs to.
 */
function latestInvocationStartedEventBefore(
  events: readonly MaoEventLedgerEntry[],
  taskId: string,
  beforeSequence: number,
): MaoEventLedgerEntry | null {
  let latest: MaoEventLedgerEntry | null = null;
  for (const event of events) {
    if (event.taskId !== taskId) continue;
    if (event.eventType !== "INVOCATION_STARTED") continue;
    if (event.sequence >= beforeSequence) continue;
    if (latest === null || event.sequence > latest.sequence) latest = event;
  }
  return latest;
}

/**
 * Unambiguously proves or disproves that `taskId`'s CURRENT durably terminal
 * event was produced by the exact attempt identified by
 * `reservationLaunchIdempotencyKey` (reviewer FINAL STABILIZATION PACKET,
 * requirement 1/2). This REPLACES the prior `launchIdempotencyKeyOfEvent`
 * approach, which recovered an attempt identity by splitting a durable
 * event's `idempotencyKey` string at the first `"::"` - lossy and exploitable
 * whenever a real `launchIdempotencyKey` itself contains `"::"` (e.g.
 * `"launch-old::different-attempt"` would have been misread as merely
 * `"launch-old"`, falsely matching a reservation actually bound to
 * `"launch-old"`). There is no reverse-parsing here at all: every check
 * below is a FULL, EXACT equality comparison against the one and only
 * correctly-encoded key `milestoneIdempotencyKey` would have produced for
 * the CANDIDATE identity, never a substring or prefix decision.
 *
 * Selects the task's latest event by `sequence` (never by array position -
 * `resumeRun` returns events in persisted order, but this function does not
 * rely on that; it always compares `.sequence` explicitly) and, per that
 * event's own `eventType`, proves ownership against the EXACT milestone key
 * a genuine attempt with `reservationLaunchIdempotencyKey` would have
 * produced:
 *
 *  - `INVOCATION_COMPLETED` (durable "succeeded"): the event's own
 *    `idempotencyKey` must equal
 *    `milestoneIdempotencyKey(reservationLaunchIdempotencyKey, "INVOCATION_COMPLETED")`.
 *  - `TIMEOUT_DETECTED` / `CANCEL_ACCEPTED` (durable "timed_out"/"cancelled"):
 *    neither of these milestones is itself keyed by the invocation attempt
 *    (see `recordTimeout`/`requestCancellation` above - their own
 *    `idempotencyKey` is derived from `taskId`/`taskGraphId`, not from any
 *    `launchIdempotencyKey`), so ownership is proven instead through the
 *    latest preceding `INVOCATION_STARTED` event for the same task (by
 *    `sequence`, strictly before the terminal event's own `sequence`): that
 *    event's `idempotencyKey` must equal
 *    `milestoneIdempotencyKey(reservationLaunchIdempotencyKey, "INVOCATION_STARTED")`.
 *  - Any other terminal event shape (should not occur for events this
 *    launcher itself writes, but is not assumed): unknown/unprovable,
 *    fails closed.
 *
 * Any failure to prove ownership - no terminal event, no preceding
 * INVOCATION_STARTED where one is required, a key that does not match
 * exactly - returns `false`. This function never returns `true` on
 * anything less than an exact full-string match.
 */
export function terminalEventOwnedByAttempt(
  events: readonly MaoEventLedgerEntry[],
  taskId: string,
  reservationLaunchIdempotencyKey: string,
): boolean {
  const terminalEvent = latestEventFor(events, taskId);
  if (terminalEvent === null) return false;

  if (terminalEvent.eventType === "INVOCATION_COMPLETED") {
    return terminalEvent.idempotencyKey === milestoneIdempotencyKey(reservationLaunchIdempotencyKey, "INVOCATION_COMPLETED");
  }

  if (terminalEvent.eventType === "TIMEOUT_DETECTED" || terminalEvent.eventType === "CANCEL_ACCEPTED") {
    const invocationStarted = latestInvocationStartedEventBefore(events, taskId, terminalEvent.sequence);
    if (invocationStarted === null) return false;
    return invocationStarted.idempotencyKey === milestoneIdempotencyKey(reservationLaunchIdempotencyKey, "INVOCATION_STARTED");
  }

  return false;
}

export function hasIdempotencyKeyPrefix(events: readonly MaoEventLedgerEntry[], taskId: string, launchIdempotencyKey: string): boolean {
  const admittedKey = milestoneIdempotencyKey(launchIdempotencyKey, "TASK_ADMITTED");
  return events.some((event) => event.taskId === taskId && event.idempotencyKey === admittedKey);
}

/** Maps a durably-terminal task state to the delegation settlement outcome recover-and-reconcile should record. */
export function reconcileOutcomeFor(state: MaoTaskState): MaoDelegationCompletionReceipt["outcome"] | null {
  switch (state) {
    case "succeeded":
      return "succeeded";
    case "failed":
    case "exhausted":
      return "failed";
    case "rejected":
      return "rejected";
    case "cancelled":
      return "cancelled";
    case "timed_out":
      return "timed_out";
    default:
      return null;
  }
}

/**
 * Classify which settlement outcome durable evidence supports for one
 * specific launch attempt (`launchIdempotencyKey`), used by
 * `reconcileDelegation` to recover the adapter-rejection and
 * post-reservation run-store-failure windows - neither of which leaves the
 * task in a durably TERMINAL state (`reconcileOutcomeFor` alone cannot see
 * them).
 *
 * IMPORTANT (reviewer RETURN_FOR_REWORK, requirement 2): this function's
 * return value is evidence for WHICH outcome to record - it is never, by
 * itself, authorization to settle. The actual settlement in
 * `reconcileDelegation` is gated by the durable store's own identity
 * verification (`settle`'s `expectedIdentity`, checked against the
 * reservation's durably bound `launchIdempotencyKey`/`childTaskId`), which
 * fails closed on `IDENTITY_MISMATCH` regardless of what this function
 * returns. A wrong, stale, or unrelated `launchIdempotencyKey` therefore
 * cannot settle a reservation it did not create, even though this function
 * would happily classify "no forward-progress evidence" as `"failed"` for
 * that same wrong key (because a task the wrong key never touched
 * trivially has no forward-progress events either) - the identity check at
 * the settlement boundary is what actually prevents that from mattering.
 *
 *  - If an `ADAPTER_REJECTED`-keyed event exists for this task, the
 *    reservation recovers as "rejected".
 *  - Otherwise, if an `INVOCATION_STARTED` or `INVOCATION_COMPLETED`-keyed
 *    event exists for this attempt, the attempt reached real execution and
 *    may still be genuinely in flight; this function reports `null` (defer
 *    to `reconcileOutcomeFor`'s terminal-state check instead) rather than
 *    risk releasing a still-running invocation.
 *  - Otherwise, the reservation recovers as "failed".
 */
export function reconcileOutcomeForAttempt(
  events: readonly MaoEventLedgerEntry[],
  taskId: string,
  launchIdempotencyKey: string,
): MaoDelegationCompletionReceipt["outcome"] | null {
  const forThisTask = events.filter((event) => event.taskId === taskId);
  const adapterRejectedKey = milestoneIdempotencyKey(launchIdempotencyKey, "ADAPTER_REJECTED");
  const hasAdapterRejected = forThisTask.some((event) => event.idempotencyKey === adapterRejectedKey);
  if (hasAdapterRejected) {
    return "rejected";
  }

  const invocationStartedKey = milestoneIdempotencyKey(launchIdempotencyKey, "INVOCATION_STARTED");
  const invocationCompletedKey = milestoneIdempotencyKey(launchIdempotencyKey, "INVOCATION_COMPLETED");
  const hasForwardProgress = forThisTask.some(
    (event) => event.idempotencyKey === invocationStartedKey || event.idempotencyKey === invocationCompletedKey,
  );
  if (hasForwardProgress) {
    return null;
  }

  return "failed";
}
