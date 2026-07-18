// CVF MAO-T6 - Lifecycle Controller Contract
//
// Implements deterministic timeout, heartbeat (liveness-only), cooperative
// cancel, retry classification, duplicate protection, and orphan recovery
// defined by
// docs/reference/multi_agent_orchestration/CVF_MAO_RUNTIME_FOUNDATION_CONTRACT.md
// ("Idempotency, Retry, Cancel, And Recovery", "Cost / Token / Latency
// Controls") and the MAO-T0 Threat And Failure Model. Local execution-plane
// module only; no provider, real wall-clock, queue, UI, or runtime caller.

import type { MaoDiagnosticClass } from "./delegation.adapter.contract";

// --- Deterministic clock ---

/**
 * Deterministic clock for lifecycle testing. startIso is the initial time;
 * advance(ms) moves the clock forward by the given milliseconds. This
 * allows timeout, heartbeat-staleness, and orphan-recovery tests to run
 * deterministically without real wall-clock or setTimeout.
 */
export interface MaoDeterministicClock {
  now(): string;
  elapsedMs(since: string): number;
  advance(ms: number): void;
}

export function createDeterministicClock(startIso: string): MaoDeterministicClock {
  let current = new Date(startIso).getTime();
  return {
    now(): string {
      return new Date(current).toISOString();
    },
    elapsedMs(since: string): number {
      return current - new Date(since).getTime();
    },
    advance(ms: number): void {
      current += ms;
    },
  };
}

// --- Timeout detection ---

/**
 * Result of a timeout check. timedOut is true when the elapsed time since
 * startedAt exceeds ceilingMs. ceilingMs of null means no timeout ceiling
 * is configured (never times out).
 */
export type MaoTimeoutResult =
  | { readonly timedOut: false }
  | { readonly timedOut: true; readonly elapsedMs: number; readonly ceilingMs: number };

export function detectTimeout(
  startedAt: string,
  ceilingMs: number | null,
  clock: MaoDeterministicClock,
): MaoTimeoutResult {
  if (ceilingMs === null) return { timedOut: false };
  const elapsed = clock.elapsedMs(startedAt);
  if (elapsed > ceilingMs) {
    return { timedOut: true, elapsedMs: elapsed, ceilingMs };
  }
  return { timedOut: false };
}

// --- Heartbeat ---

/**
 * Heartbeat record. Per the contract: "Heartbeat proves liveness only. It
 * cannot renew authority, extend budget, or imply useful progress." The
 * livenessOnly field is an invariant marker; all heartbeat records carry
 * the literal `true`.
 */
export interface MaoHeartbeatRecord {
  readonly taskId: string;
  readonly lastHeartbeatAt: string;
  readonly livenessOnly: true;
}

export function recordHeartbeat(taskId: string, clock: MaoDeterministicClock): MaoHeartbeatRecord {
  return { taskId, lastHeartbeatAt: clock.now(), livenessOnly: true };
}

/**
 * Returns true when the elapsed time since the last heartbeat exceeds
 * maxSilenceMs. A missing record (never had a heartbeat) is always stale.
 */
export function isHeartbeatStale(
  record: MaoHeartbeatRecord | null,
  maxSilenceMs: number,
  clock: MaoDeterministicClock,
): boolean {
  if (!record) return true;
  return clock.elapsedMs(record.lastHeartbeatAt) > maxSilenceMs;
}

// --- Cancel ---

export type MaoCancelState = "NONE" | "REQUESTED" | "ACCEPTED";

/**
 * Cancel tracker for a single task. Per the contract: "Cancellation is
 * idempotent and blocks further child admission once accepted." Once
 * accepted, no new children may start for this task.
 */
export interface MaoCancelTracker {
  readonly taskId: string;
  readonly state: MaoCancelState;
  readonly requestedAt: string | null;
  readonly acceptedAt: string | null;
  readonly blocksNewChildren: boolean;
}

export function createCancelTracker(taskId: string): MaoCancelTracker {
  return { taskId, state: "NONE", requestedAt: null, acceptedAt: null, blocksNewChildren: false };
}

export function requestCancel(tracker: MaoCancelTracker, clock: MaoDeterministicClock): MaoCancelTracker {
  if (tracker.state !== "NONE") return tracker;
  return { ...tracker, state: "REQUESTED", requestedAt: clock.now(), blocksNewChildren: true };
}

export function acceptCancel(tracker: MaoCancelTracker, clock: MaoDeterministicClock): MaoCancelTracker {
  if (tracker.state !== "REQUESTED") return tracker;
  return { ...tracker, state: "ACCEPTED", acceptedAt: clock.now(), blocksNewChildren: true };
}

/** Returns true when a new child invocation may start for this tracker's task. */
export function mayStartNewChild(tracker: MaoCancelTracker): boolean {
  return !tracker.blocksNewChildren;
}

// --- Retry classification ---

export type MaoRetryClass = "RETRYABLE" | "NON_RETRYABLE";

/**
 * Classify a diagnostic class as retryable or non-retryable per the
 * contract's Idempotency, Retry, Cancel, And Recovery section.
 * Retryable: transport interruption, provider transient, safe timeout.
 * Non-retryable: authority rejection, approval denial, invalid output,
 * scope breach, ambiguous side effect.
 */
export function classifyRetry(diagnostic: MaoDiagnosticClass): MaoRetryClass {
  switch (diagnostic) {
    case "RETRYABLE_TRANSPORT_INTERRUPTION":
    case "RETRYABLE_PROVIDER_TRANSIENT":
    case "RETRYABLE_SAFE_TIMEOUT":
      return "RETRYABLE";
    default:
      return "NON_RETRYABLE";
  }
}

// --- Duplicate protection ---

/**
 * In-memory idempotency guard. A key that has been `seen` and `record`-ed
 * cannot be executed again. Per the contract: "Duplicate invocation returns
 * the existing receipt or a conflict; it does not execute twice."
 */
export interface MaoIdempotencyGuard {
  seen(key: string): boolean;
  record(key: string): void;
  claim(key: string): boolean;
}

export function createIdempotencyGuard(): MaoIdempotencyGuard {
  const keys = new Set<string>();
  return {
    seen(key: string): boolean { return keys.has(key); },
    record(key: string): void {
      if (key.trim().length === 0) throw new Error("idempotency key must be non-empty");
      keys.add(key);
    },
    claim(key: string): boolean {
      if (key.trim().length === 0 || keys.has(key)) return false;
      keys.add(key);
      return true;
    },
  };
}

// --- Orphan recovery ---

export type MaoOrphanClassification = "RESUMABLE" | "SAFE_RETRY" | "ESCALATE";

/**
 * A record of a single invocation attempt, used by orphan recovery to
 * decide whether the attempt can be resumed, safely retried, or must be
 * escalated.
 */
export interface MaoAttemptRecord {
  readonly attemptId: string;
  readonly taskId: string;
  readonly startedAt: string;
  readonly completedAt: string | null;
  readonly diagnosticClass: MaoDiagnosticClass | null;
  readonly lastHeartbeatAt: string | null;
}

/**
 * Classify an orphaned (non-terminal, non-completed) attempt per the
 * contract's Idempotency, Retry, Cancel, And Recovery section:
 *
 * - RESUMABLE: still within the silence window (last signal is recent).
 * - SAFE_RETRY: stale (exceeded silence window) and diagnostic is
 *   retryable per classifyRetry.
 * - ESCALATE: stale with no diagnostic, or with a non-retryable
 *   diagnostic. Orphan recovery never infers success from silence.
 */
export function classifyOrphan(
  attempt: MaoAttemptRecord,
  maxSilenceMs: number,
  clock: MaoDeterministicClock,
): MaoOrphanClassification {
  if (attempt.completedAt !== null) return "ESCALATE";

  const lastSignal = attempt.lastHeartbeatAt ?? attempt.startedAt;
  const silent = clock.elapsedMs(lastSignal) > maxSilenceMs;

  if (!silent) return "RESUMABLE";

  if (attempt.diagnosticClass) {
    const retryClass = classifyRetry(attempt.diagnosticClass);
    if (retryClass === "RETRYABLE") return "SAFE_RETRY";
  }

  return "ESCALATE";
}

// --- Lifecycle controller ---

/**
 * Aggregate lifecycle controller that bundles the deterministic clock,
 * idempotency guard, cancel trackers, and heartbeat records into one
 * testable object. The controller owns no real wall-clock, no network,
 * and no durable storage.
 */
export class MaoLifecycleController {
  readonly clock: MaoDeterministicClock;
  private readonly idempotencyGuard: MaoIdempotencyGuard;
  private readonly cancelTrackers: Map<string, MaoCancelTracker>;
  private readonly heartbeatRecords: Map<string, MaoHeartbeatRecord>;

  constructor(startIso: string) {
    this.clock = createDeterministicClock(startIso);
    this.idempotencyGuard = createIdempotencyGuard();
    this.cancelTrackers = new Map();
    this.heartbeatRecords = new Map();
  }

  /** Check whether a task started at startedAt has exceeded its timeout ceiling. */
  checkTimeout(startedAt: string, ceilingMs: number | null): MaoTimeoutResult {
    return detectTimeout(startedAt, ceilingMs, this.clock);
  }

  /** Record a heartbeat for a task. Returns the heartbeat record. */
  heartbeat(taskId: string): MaoHeartbeatRecord {
    const record = recordHeartbeat(taskId, this.clock);
    this.heartbeatRecords.set(taskId, record);
    return record;
  }

  /** Check whether a task's heartbeat is stale (never recorded or exceeded maxSilenceMs). */
  isHeartbeatStale(taskId: string, maxSilenceMs: number): boolean {
    return isHeartbeatStale(this.heartbeatRecords.get(taskId) ?? null, maxSilenceMs, this.clock);
  }

  /** Get or create a cancel tracker for a task. */
  getCancelTracker(taskId: string): MaoCancelTracker {
    let tracker = this.cancelTrackers.get(taskId);
    if (!tracker) {
      tracker = createCancelTracker(taskId);
      this.cancelTrackers.set(taskId, tracker);
    }
    return tracker;
  }

  /** Request cancellation for a task. Idempotent after first request. */
  requestCancel(taskId: string): MaoCancelTracker {
    const tracker = this.getCancelTracker(taskId);
    const updated = requestCancel(tracker, this.clock);
    this.cancelTrackers.set(taskId, updated);
    return updated;
  }

  /** Accept cancellation for a task. Only valid when state is REQUESTED. */
  acceptCancel(taskId: string): MaoCancelTracker {
    const tracker = this.getCancelTracker(taskId);
    const updated = acceptCancel(tracker, this.clock);
    this.cancelTrackers.set(taskId, updated);
    return updated;
  }

  /** Check whether a new child invocation may start for this task. */
  mayStartNewChild(taskId: string): boolean {
    return mayStartNewChild(this.getCancelTracker(taskId));
  }

  /** Classify a diagnostic as RETRYABLE or NON_RETRYABLE. */
  classifyRetry(diagnostic: MaoDiagnosticClass): MaoRetryClass {
    return classifyRetry(diagnostic);
  }

  /** Check whether this idempotency key has already been used. */
  isDuplicate(idempotencyKey: string): boolean {
    return this.idempotencyGuard.seen(idempotencyKey);
  }

  /** Record an idempotency key as used. */
  recordInvocation(idempotencyKey: string): void {
    this.idempotencyGuard.record(idempotencyKey);
  }

  /** Atomically claim an idempotency key; only the first caller succeeds. */
  claimInvocation(idempotencyKey: string): boolean {
    return this.idempotencyGuard.claim(idempotencyKey);
  }

  /** Classify an orphaned attempt. */
  classifyOrphan(attempt: MaoAttemptRecord, maxSilenceMs: number): MaoOrphanClassification {
    return classifyOrphan(attempt, maxSilenceMs, this.clock);
  }

  /** Advance the deterministic clock by ms milliseconds. */
  advanceClock(ms: number): void {
    this.clock.advance(ms);
  }
}
