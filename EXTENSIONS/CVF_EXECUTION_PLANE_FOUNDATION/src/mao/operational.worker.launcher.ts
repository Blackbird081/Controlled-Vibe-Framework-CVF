// CVF MAO-OA-T3 - Operational Worker Launcher And Liveness Wiring
//
// Implements one bounded local composition owner that resumes an accepted
// MAO-OA-T2 durable run, invokes the existing MAO-T3 fake/local delegation
// adapter exactly once per launch idempotency key, and uses the existing
// MAO-T6 lifecycle controller for heartbeat/timeout/cancellation, per
// docs/reference/multi_agent_orchestration/CVF_MAO_RUNTIME_FOUNDATION_CONTRACT.md
// and
// docs/work_orders/CVF_AGENT_WORK_ORDER_MAO_OA_T3_OPERATIONAL_WORKER_LAUNCHER_AND_LIVENESS_WIRING_2026-07-17.md.
//
// This module owns launch/heartbeat/timeout/cancel composition only. It does
// not implement a second durable store, adapter, or lifecycle owner, does
// not import the control-plane provider router, and makes no real
// provider/network/process/queue call. Local execution-plane module only;
// no CLI/MCP/UI/runtime caller.

import type { MaoFileRunStore, MaoDurableRunStoreFailure } from "./durable.run.store";
import type {
  MaoInvocationRequest,
  MaoInvocationResult,
  MaoInvocationRejectionReason,
} from "./delegation.adapter.contract";
import type { MaoLifecycleController, MaoTimeoutResult } from "./lifecycle.controller.contract";
import type { MaoEventLedgerEntry, MaoTaskState } from "./event.ledger.contract";
import type { MaoTaskGraph } from "./task.graph.contract";

// --- Types ---

/**
 * Minimal structural port for the existing MAO-T3 adapter's `invoke` shape.
 * Declared here (not re-exported as a second adapter owner) so tests can
 * exercise call-count behavior against any object satisfying this shape,
 * including the real `MaoDelegationAdapter`.
 */
export interface MaoOperationalAdapterPort {
  invoke(request: MaoInvocationRequest): MaoInvocationResult;
}

export interface MaoOperationalLaunchRequest {
  taskGraphId: string;
  taskId: string;
  admission: MaoInvocationRequest["admission"];
  capability: MaoInvocationRequest["capability"];
  inputManifest: string[];
  /** Caller-supplied key binding this launch attempt; deterministically derives every durable milestone's idempotency key for this attempt. */
  launchIdempotencyKey: string;
  timeoutCeilingMs?: number | null;
}

export type MaoOperationalLaunchFailureReason =
  | "DURABLE_STORE_REJECTED"
  | "UNKNOWN_OR_NON_RUNNABLE_TASK"
  | "CANCELLATION_BLOCKS_NEW_CHILD"
  | "DUPLICATE_LAUNCH_ADAPTER_NOT_CALLED"
  | "ADAPTER_REJECTED"
  | "LIFECYCLE_MILESTONE_PERSISTENCE_FAILED";

export interface MaoOperationalLaunchFailure {
  ok: false;
  reason: MaoOperationalLaunchFailureReason;
  detail: string;
  /** Present only when reason is ADAPTER_REJECTED; carries the adapter's own diagnostic verbatim. */
  adapterRejectionReason?: MaoInvocationRejectionReason;
  /** Durable milestones written before this failure was detected, if any. */
  durableEvidence: readonly MaoEventLedgerEntry[];
}

export interface MaoOperationalLaunchSuccess {
  ok: true;
  /** True only when this call replayed a receipt for an already-launched idempotency key rather than calling the adapter again. */
  replayed: boolean;
  invocationResult: Extract<MaoInvocationResult, { ok: true }>;
  durableEvidence: readonly MaoEventLedgerEntry[];
}

export type MaoOperationalLaunchResult = MaoOperationalLaunchFailure | MaoOperationalLaunchSuccess;

export interface MaoOperationalHeartbeatFailure {
  ok: false;
  reason: "DURABLE_STORE_REJECTED" | "UNKNOWN_TASK";
  detail: string;
}

export interface MaoOperationalHeartbeatSuccess {
  ok: true;
  taskId: string;
  lastHeartbeatAt: string;
  livenessOnly: true;
}

export type MaoOperationalHeartbeatResult = MaoOperationalHeartbeatFailure | MaoOperationalHeartbeatSuccess;

export type MaoOperationalTimeoutFailureReason =
  | "DURABLE_STORE_REJECTED"
  | "NO_RUNNING_INVOCATION_FOUND"
  | "ALREADY_TERMINAL"
  | "LIFECYCLE_MILESTONE_PERSISTENCE_FAILED";

export interface MaoOperationalTimeoutFailure {
  ok: false;
  reason: MaoOperationalTimeoutFailureReason;
  detail: string;
}

export interface MaoOperationalTimeoutNotYetResult {
  ok: true;
  timedOut: false;
}

export interface MaoOperationalTimeoutDetectedResult {
  ok: true;
  timedOut: true;
  entry: MaoEventLedgerEntry;
}

export type MaoOperationalTimeoutResult =
  | MaoOperationalTimeoutFailure
  | MaoOperationalTimeoutNotYetResult
  | MaoOperationalTimeoutDetectedResult;

export type MaoOperationalCancelFailureReason =
  | "DURABLE_STORE_REJECTED"
  | "UNKNOWN_TASK"
  | "NO_CANCEL_REQUEST_PENDING"
  | "TASK_NOT_RUNNING"
  | "LIFECYCLE_MILESTONE_PERSISTENCE_FAILED";

export interface MaoOperationalCancelFailure {
  ok: false;
  reason: MaoOperationalCancelFailureReason;
  detail: string;
}

export interface MaoOperationalCancelRequestSuccess {
  ok: true;
  blocksNewChildren: true;
}

export interface MaoOperationalCancelAcceptSuccess {
  ok: true;
  /** True only when the task was already durably cancelled before this call (idempotent no-op). */
  alreadyCancelled: boolean;
  entry: MaoEventLedgerEntry | null;
}

export type MaoOperationalCancelRequestResult = MaoOperationalCancelFailure | MaoOperationalCancelRequestSuccess;
export type MaoOperationalCancelAcceptResult = MaoOperationalCancelFailure | MaoOperationalCancelAcceptSuccess;

// --- Deterministic per-milestone idempotency key derivation ---

function milestoneIdempotencyKey(launchIdempotencyKey: string, milestone: string): string {
  return `${launchIdempotencyKey}::${milestone}`;
}

function findTask(graph: MaoTaskGraph, taskId: string) {
  return graph.tasks.find((task) => task.taskId === taskId) ?? null;
}

function latestInvocationStartedAt(events: readonly MaoEventLedgerEntry[], taskId: string): string | null {
  let latest: string | null = null;
  for (const event of events) {
    if (event.taskId === taskId && event.eventType === "INVOCATION_STARTED") {
      latest = event.occurredAt;
    }
  }
  return latest;
}

function currentStateOf(events: readonly MaoEventLedgerEntry[], taskId: string): MaoTaskState | null {
  let state: MaoTaskState | null = null;
  for (const event of events) {
    if (event.taskId === taskId) state = event.resultingState;
  }
  return state;
}

function hasIdempotencyKeyPrefix(events: readonly MaoEventLedgerEntry[], taskId: string, launchIdempotencyKey: string): boolean {
  const admittedKey = milestoneIdempotencyKey(launchIdempotencyKey, "TASK_ADMITTED");
  return events.some((event) => event.taskId === taskId && event.idempotencyKey === admittedKey);
}

/**
 * Bounded operational worker launcher. Composes the existing MAO-OA-T2
 * durable store, MAO-T3 fake/local delegation adapter, and MAO-T6 lifecycle
 * controller behind explicit constructor-injected dependencies. Holds no
 * global/singleton state; every method call re-resumes the durable run
 * before deciding, so this class is safe to reconstruct against the same
 * root/store between calls (durable restart proof).
 */
export class MaoOperationalWorkerLauncher {
  private readonly store: MaoFileRunStore;
  private readonly adapter: MaoOperationalAdapterPort;
  private readonly lifecycle: MaoLifecycleController;

  constructor(store: MaoFileRunStore, adapter: MaoOperationalAdapterPort, lifecycle: MaoLifecycleController) {
    this.store = store;
    this.adapter = adapter;
    this.lifecycle = lifecycle;
  }

  /**
   * Resume the durable run, admit the task, call the adapter exactly once
   * per launchIdempotencyKey, and persist admitted/running/terminal
   * milestones. See Required Launcher Behavior in the governing work order
   * for the exact sequence and failure vocabulary.
   */
  async launch(request: MaoOperationalLaunchRequest): Promise<MaoOperationalLaunchResult> {
    const resumed = await this.store.resumeRun(request.taskGraphId);
    if (!resumed.ok) {
      return this.storeFailureAsLaunchFailure(resumed);
    }

    const { graph, events } = resumed;
    const task = findTask(graph, request.taskId);
    if (!task) {
      return {
        ok: false,
        reason: "UNKNOWN_OR_NON_RUNNABLE_TASK",
        detail: `task ${request.taskId} is not declared in the resumed graph`,
        durableEvidence: [],
      };
    }

    // Duplicate-launch protection: a launch idempotency key that already
    // produced a durable TASK_ADMITTED milestone must not call the adapter
    // a second time, regardless of in-memory lifecycle guard state (which
    // does not survive launcher reconstruction across a restart) and
    // regardless of the task's current terminal/non-terminal durable state.
    // This check runs before the runnable-state check below so a repeated
    // launch key against an already-terminal (e.g. succeeded) task is
    // reported as a duplicate, not as a generic non-runnable rejection.
    if (hasIdempotencyKeyPrefix(events, request.taskId, request.launchIdempotencyKey)) {
      const existingReceipt = this.lifecycle.isDuplicate(request.launchIdempotencyKey);
      if (!existingReceipt) this.lifecycle.recordInvocation(request.launchIdempotencyKey);
      return {
        ok: false,
        reason: "DUPLICATE_LAUNCH_ADAPTER_NOT_CALLED",
        detail: `launchIdempotencyKey ${request.launchIdempotencyKey} already admitted task ${request.taskId}; adapter is not called again`,
        durableEvidence: events.filter((event) => event.taskId === request.taskId),
      };
    }

    const currentState = currentStateOf(events, request.taskId);
    if (currentState !== null && currentState !== "planned" && currentState !== "blocked") {
      return {
        ok: false,
        reason: "UNKNOWN_OR_NON_RUNNABLE_TASK",
        detail: `task ${request.taskId} is not runnable from durable state ${currentState}`,
        durableEvidence: [],
      };
    }

    if (!this.lifecycle.mayStartNewChild(request.taskId)) {
      const blockedAppend = await this.store.appendEvent(request.taskGraphId, {
        taskGraphId: request.taskGraphId,
        taskId: request.taskId,
        eventType: "TASK_TRANSITIONED",
        resultingState: "blocked",
        occurredAt: this.lifecycle.clock.now(),
        idempotencyKey: milestoneIdempotencyKey(request.launchIdempotencyKey, "CANCELLATION_BLOCKED"),
      });
      return {
        ok: false,
        reason: "CANCELLATION_BLOCKS_NEW_CHILD",
        detail: `task ${request.taskId} cancellation has been accepted; no new child may start`,
        durableEvidence: blockedAppend.ok ? [blockedAppend.appendedEntry] : [],
      };
    }

    const durableEvidence: MaoEventLedgerEntry[] = [];

    // A task with no prior durable event has no recorded `planned` state to
    // transition out of (event.ledger.contract.ts's ALLOWED_TRANSITIONS only
    // permits `(none) -> planned` or `(none) -> blocked`, never a direct
    // `(none) -> admitted`). Record the implicit initial `planned` state
    // explicitly before admitting, using the same GRAPH_COMPILED/planned
    // convention the MAO-OA-T2 durable store tests already establish, so the
    // ledger's transition table is satisfied without reimplementing or
    // bypassing it.
    if (currentState === null) {
      const plannedAppend = await this.store.appendEvent(request.taskGraphId, {
        taskGraphId: request.taskGraphId,
        taskId: request.taskId,
        eventType: "GRAPH_COMPILED",
        resultingState: "planned",
        occurredAt: this.lifecycle.clock.now(),
        idempotencyKey: milestoneIdempotencyKey(request.launchIdempotencyKey, "TASK_PLANNED"),
      });
      if (!plannedAppend.ok) {
        return this.storeFailureAsLaunchFailure(plannedAppend, durableEvidence);
      }
      durableEvidence.push(plannedAppend.appendedEntry);
    }

    const admittedAppend = await this.store.appendEvent(request.taskGraphId, {
      taskGraphId: request.taskGraphId,
      taskId: request.taskId,
      eventType: "TASK_ADMITTED",
      resultingState: "admitted",
      occurredAt: this.lifecycle.clock.now(),
      idempotencyKey: milestoneIdempotencyKey(request.launchIdempotencyKey, "TASK_ADMITTED"),
    });
    if (!admittedAppend.ok) {
      return this.storeFailureAsLaunchFailure(admittedAppend, durableEvidence);
    }
    durableEvidence.push(admittedAppend.appendedEntry);
    this.lifecycle.recordInvocation(request.launchIdempotencyKey);

    const invocationResult = this.adapter.invoke({
      graph,
      admission: request.admission,
      taskId: request.taskId,
      capability: request.capability,
      inputManifest: request.inputManifest,
      idempotencyKey: request.launchIdempotencyKey,
      startedAt: this.lifecycle.clock.now(),
    });

    if (!invocationResult.ok) {
      const blockedAppend = await this.store.appendEvent(request.taskGraphId, {
        taskGraphId: request.taskGraphId,
        taskId: request.taskId,
        eventType: "TASK_TRANSITIONED",
        resultingState: "blocked",
        occurredAt: this.lifecycle.clock.now(),
        idempotencyKey: milestoneIdempotencyKey(request.launchIdempotencyKey, "ADAPTER_REJECTED"),
      });
      if (blockedAppend.ok) durableEvidence.push(blockedAppend.appendedEntry);
      return {
        ok: false,
        reason: "ADAPTER_REJECTED",
        detail: invocationResult.detail,
        adapterRejectionReason: invocationResult.reason,
        durableEvidence,
      };
    }

    const runningAppend = await this.store.appendEvent(request.taskGraphId, {
      taskGraphId: request.taskGraphId,
      taskId: request.taskId,
      eventType: "INVOCATION_STARTED",
      resultingState: "running",
      occurredAt: invocationResult.receipt.startedAt,
      idempotencyKey: milestoneIdempotencyKey(request.launchIdempotencyKey, "INVOCATION_STARTED"),
    });
    if (!runningAppend.ok) {
      return this.storeFailureAsLaunchFailure(runningAppend, durableEvidence);
    }
    durableEvidence.push(runningAppend.appendedEntry);

    const succeededAppend = await this.store.appendEvent(request.taskGraphId, {
      taskGraphId: request.taskGraphId,
      taskId: request.taskId,
      eventType: "INVOCATION_COMPLETED",
      resultingState: "succeeded",
      occurredAt: this.lifecycle.clock.now(),
      idempotencyKey: milestoneIdempotencyKey(request.launchIdempotencyKey, "INVOCATION_COMPLETED"),
    });
    if (!succeededAppend.ok) {
      return this.storeFailureAsLaunchFailure(succeededAppend, durableEvidence);
    }
    durableEvidence.push(succeededAppend.appendedEntry);

    return { ok: true, replayed: invocationResult.replayed, invocationResult, durableEvidence };
  }

  /**
   * Liveness-only heartbeat. Validates the durable graph/task, records a
   * lifecycle-controller heartbeat, and returns its record. Writes no
   * durable event, per the contract's "Heartbeat proves liveness only".
   */
  async heartbeat(taskGraphId: string, taskId: string): Promise<MaoOperationalHeartbeatResult> {
    const resumed = await this.store.resumeRun(taskGraphId);
    if (!resumed.ok) {
      return { ok: false, reason: "DURABLE_STORE_REJECTED", detail: `${resumed.reason}: ${resumed.detail}` };
    }
    if (!findTask(resumed.graph, taskId)) {
      return { ok: false, reason: "UNKNOWN_TASK", detail: `task ${taskId} is not declared in the resumed graph` };
    }
    const record = this.lifecycle.heartbeat(taskId);
    return { ok: true, taskId: record.taskId, lastHeartbeatAt: record.lastHeartbeatAt, livenessOnly: true };
  }

  /**
   * Deterministic timeout check against the latest durable
   * INVOCATION_STARTED milestone. Writes nothing at or below the ceiling.
   * Writes exactly one TIMEOUT_DETECTED/timed_out milestone the first time
   * the ceiling is strictly exceeded; a repeated call after that milestone
   * already exists fails closed with ALREADY_TERMINAL rather than writing a
   * duplicate event.
   */
  async recordTimeout(taskGraphId: string, taskId: string, ceilingMs: number | null): Promise<MaoOperationalTimeoutResult> {
    const resumed = await this.store.resumeRun(taskGraphId);
    if (!resumed.ok) {
      return { ok: false, reason: "DURABLE_STORE_REJECTED", detail: `${resumed.reason}: ${resumed.detail}` };
    }

    const currentState = currentStateOf(resumed.events, taskId);
    if (currentState === "timed_out") {
      return { ok: false, reason: "ALREADY_TERMINAL", detail: `task ${taskId} is already durably timed_out` };
    }
    if (currentState !== "running") {
      return { ok: false, reason: "NO_RUNNING_INVOCATION_FOUND", detail: `task ${taskId} durable state is ${currentState ?? "(none)"}, not running` };
    }

    const startedAt = latestInvocationStartedAt(resumed.events, taskId);
    if (startedAt === null) {
      return { ok: false, reason: "NO_RUNNING_INVOCATION_FOUND", detail: `no durable INVOCATION_STARTED milestone found for task ${taskId}` };
    }

    const timeoutCheck: MaoTimeoutResult = this.lifecycle.checkTimeout(startedAt, ceilingMs);
    if (!timeoutCheck.timedOut) {
      return { ok: true, timedOut: false };
    }

    const append = await this.store.appendEvent(taskGraphId, {
      taskGraphId,
      taskId,
      eventType: "TIMEOUT_DETECTED",
      resultingState: "timed_out",
      occurredAt: this.lifecycle.clock.now(),
      idempotencyKey: milestoneIdempotencyKey(`${taskId}:${startedAt}`, "TIMEOUT_DETECTED"),
    });
    if (!append.ok) {
      return { ok: false, reason: "LIFECYCLE_MILESTONE_PERSISTENCE_FAILED", detail: `${append.reason}: ${append.detail}` };
    }
    return { ok: true, timedOut: true, entry: append.appendedEntry };
  }

  /**
   * Request cooperative cancellation through the existing lifecycle
   * controller. Blocks new-child admission in that controller instance
   * immediately; writes no durable event by itself (acceptance is the
   * durable milestone).
   */
  requestCancellation(taskId: string): MaoOperationalCancelRequestResult {
    this.lifecycle.requestCancel(taskId);
    if (!this.lifecycle.mayStartNewChild(taskId)) {
      return { ok: true, blocksNewChildren: true };
    }
    return { ok: false, reason: "NO_CANCEL_REQUEST_PENDING", detail: `cancellation request for task ${taskId} did not block new children` };
  }

  /**
   * Idempotent cancellation acceptance. Requires a task that is durably
   * running (or already durably cancelled, which is a no-op replay) and a
   * pending cancel request in the lifecycle controller. Persists exactly one
   * CANCEL_ACCEPTED/cancelled durable milestone the first time; a restarted
   * launcher observing an already-terminal-cancelled durable state returns
   * the existing state without a second append.
   */
  async acceptCancellation(taskGraphId: string, taskId: string): Promise<MaoOperationalCancelAcceptResult> {
    const resumed = await this.store.resumeRun(taskGraphId);
    if (!resumed.ok) {
      return { ok: false, reason: "DURABLE_STORE_REJECTED", detail: `${resumed.reason}: ${resumed.detail}` };
    }

    const currentState = currentStateOf(resumed.events, taskId);
    if (currentState === "cancelled") {
      return { ok: true, alreadyCancelled: true, entry: null };
    }
    if (currentState !== "running") {
      return { ok: false, reason: "TASK_NOT_RUNNING", detail: `task ${taskId} durable state is ${currentState ?? "(none)"}, not running` };
    }

    const tracker = this.lifecycle.getCancelTracker(taskId);
    if (tracker.state === "NONE") {
      return { ok: false, reason: "NO_CANCEL_REQUEST_PENDING", detail: `no cancellation was requested for task ${taskId}` };
    }

    this.lifecycle.acceptCancel(taskId);

    const append = await this.store.appendEvent(taskGraphId, {
      taskGraphId,
      taskId,
      eventType: "CANCEL_ACCEPTED",
      resultingState: "cancelled",
      occurredAt: this.lifecycle.clock.now(),
      idempotencyKey: milestoneIdempotencyKey(`${taskId}:${taskGraphId}`, "CANCEL_ACCEPTED"),
    });
    if (!append.ok) {
      return { ok: false, reason: "LIFECYCLE_MILESTONE_PERSISTENCE_FAILED", detail: `${append.reason}: ${append.detail}` };
    }
    return { ok: true, alreadyCancelled: false, entry: append.appendedEntry };
  }

  private storeFailureAsLaunchFailure(
    failure: MaoDurableRunStoreFailure,
    priorEvidence: readonly MaoEventLedgerEntry[] = [],
  ): MaoOperationalLaunchFailure {
    return {
      ok: false,
      reason: "DURABLE_STORE_REJECTED",
      detail: `${failure.reason}: ${failure.detail}`,
      durableEvidence: priorEvidence,
    };
  }
}
