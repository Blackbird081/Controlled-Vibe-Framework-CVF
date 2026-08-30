// CVF MAO-OA-T3 - Operational Worker Launcher And Liveness Wiring
//
// Bounded composition of durable run state, provider-neutral adapter,
// lifecycle control, and atomic delegation. Deterministic reconciliation
// helpers live in operational.worker.launcher.reconciliation.ts.
//
// Canonical semantics and review history:
// docs/reference/multi_agent_orchestration/CVF_MAO_RUNTIME_FOUNDATION_CONTRACT.md
// docs/reviews/CVF_BRIGADE_EARTR_LOCAL_RECONCILIATION_AND_ABSORPTION_CLOSURE_2026-08-29.md

import type { MaoFileRunStore, MaoDurableRunStoreFailure } from "./durable.run.store";
import type {
  MaoInvocationRequest,
  MaoInvocationResult,
  MaoInvocationRejectionReason,
} from "./delegation.adapter.contract";
import type { MaoLifecycleController, MaoTimeoutResult } from "./lifecycle.controller.contract";
import type { MaoEventLedgerEntry, MaoTaskState } from "./event.ledger.contract";
import type { MaoTaskGraph } from "./task.graph.contract";
import type {
  MaoDelegationAbortCascadeReceipt,
  MaoDelegationCompletionReceipt,
  MaoDelegationJoinPolicy,
  MaoDelegationReservationReceipt,
  MaoDelegationReservationRequest,
} from "./atomic.delegation.lifecycle.coordinator";
import type { MaoDurableDelegationPort } from "./durable.delegation.ledger.store";

import { currentStateOf, findTask, hasIdempotencyKeyPrefix, latestEventFor, latestInvocationStartedAt, milestoneIdempotencyKey, reconcileOutcomeFor, reconcileOutcomeForAttempt, terminalEventOwnedByAttempt } from "./operational.worker.launcher.reconciliation";

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
  /** Enables durable atomic child-capacity reservation when a delegation port is injected. */
  delegation?: {
    parentTaskId: string;
    depth: number;
    reservationKey: string;
    joinPolicy?: MaoDelegationJoinPolicy;
  };
}

export type MaoOperationalLaunchFailureReason =
  | "DURABLE_STORE_REJECTED"
  | "UNKNOWN_OR_NON_RUNNABLE_TASK"
  | "CANCELLATION_BLOCKS_NEW_CHILD"
  | "DELEGATION_RESERVATION_REJECTED"
  | "DELEGATION_PORT_FAILED"
  | "DELEGATION_SETTLEMENT_PENDING"
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
  reservationReceipt?: MaoDelegationReservationReceipt;
  completionReceipt?: MaoDelegationCompletionReceipt;
}

export interface MaoOperationalLaunchSuccess {
  ok: true;
  /** True only when this call replayed a receipt for an already-launched idempotency key rather than calling the adapter again. */
  replayed: boolean;
  invocationResult: Extract<MaoInvocationResult, { ok: true }>;
  durableEvidence: readonly MaoEventLedgerEntry[];
  reservationReceipt?: MaoDelegationReservationReceipt;
  completionReceipt?: MaoDelegationCompletionReceipt;
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
  | "LIFECYCLE_MILESTONE_PERSISTENCE_FAILED"
  | "DURABLE_ABORT_PERSISTENCE_FAILED";

export interface MaoOperationalCancelFailure {
  ok: false;
  reason: MaoOperationalCancelFailureReason;
  detail: string;
}

export interface MaoOperationalCancelRequestSuccess {
  ok: true;
  blocksNewChildren: true;
  cascadeReceipt?: MaoDelegationAbortCascadeReceipt;
}

export interface MaoOperationalCancelAcceptSuccess {
  ok: true;
  /** True only when the task was already durably cancelled before this call (idempotent no-op). */
  alreadyCancelled: boolean;
  entry: MaoEventLedgerEntry | null;
}

export type MaoOperationalCancelRequestResult = MaoOperationalCancelFailure | MaoOperationalCancelRequestSuccess;
export type MaoOperationalCancelAcceptResult = MaoOperationalCancelFailure | MaoOperationalCancelAcceptSuccess;

export type MaoOperationalReconcileFailureReason = "DURABLE_STORE_REJECTED" | "DELEGATION_PORT_FAILED";

export interface MaoOperationalReconcileFailure {
  ok: false;
  reason: MaoOperationalReconcileFailureReason;
  detail: string;
}

export interface MaoOperationalReconcileSuccess {
  ok: true;
  /** True when a durably-terminal task's still-open reservation was durably settled by this call. */
  reconciled: boolean;
  completionReceipt?: MaoDelegationCompletionReceipt;
  /**
   * Present and true ONLY when a caller-supplied `launchIdempotencyKey` was
   * rejected because it does not match the reservation's own durably bound
   * launch identity (requirement 2/3). `reconciled` is always `false` in
   * this case and capacity is left untouched - this is a typed, explicit
   * signal distinguishing "wrong/stale/unrelated caller identity" from the
   * ordinary "nothing to reconcile yet" case.
   */
  identityMismatch?: true;
}

export type MaoOperationalReconcileResult = MaoOperationalReconcileFailure | MaoOperationalReconcileSuccess;

/**
 * Discriminated outcome of attempting a durable delegation settlement.
 * `settled` is the only case in which a caller may treat the delegation
 * side of a launch as durably closed:
 *  - `notApplicable`: there was no reservation to settle (no `delegation`
 *    metadata on this launch, or no port injected) - not a failure.
 *  - `settled`: the durable port confirmed the settlement (fresh or
 *    replayed) and returned a receipt.
 *  - `pending`: a reservation exists but durable settlement did not
 *    confirm - either the port call itself failed (`DELEGATION_PORT_FAILED`,
 *    carrying the port's own failure reason/detail) or the port succeeded
 *    at the transport level but the coordinator rejected the settlement
 *    (`reason` carries the coordinator's own rejection reason, e.g.
 *    `UNKNOWN_RESERVATION`). Either way the underlying durable run may
 *    already be terminal; `reconcileDelegation` is the recovery path.
 */
type DurableSettlementOutcome =
  | { kind: "notApplicable" }
  | { kind: "settled"; receipt: MaoDelegationCompletionReceipt }
  | { kind: "pending"; reason: string; detail: string };

// --- Deterministic per-milestone idempotency key derivation ---

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
  private readonly delegationPort: MaoDurableDelegationPort | null;

  constructor(
    store: MaoFileRunStore,
    adapter: MaoOperationalAdapterPort,
    lifecycle: MaoLifecycleController,
    delegationPort: MaoDurableDelegationPort | null = null,
  ) {
    this.store = store;
    this.adapter = adapter;
    this.lifecycle = lifecycle;
    this.delegationPort = delegationPort;
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

    // Durable reservation is awaited BEFORE the adapter is ever invoked
    // (requirement 2): a rejected or failed reservation attempt must never
    // reach the adapter.
    let reservationReceipt: MaoDelegationReservationReceipt | undefined;
    if (request.delegation) {
      if (!this.delegationPort) {
        return {
          ok: false,
          reason: "DELEGATION_RESERVATION_REJECTED",
          detail: "delegation metadata requires an injected durable delegation port",
          durableEvidence: [],
        };
      }
      const durableReservation = await this.delegationPort.reserveDurable(request.taskGraphId, {
        taskGraphId: request.taskGraphId,
        parentTaskId: request.delegation.parentTaskId,
        childTaskId: request.taskId,
        depth: request.delegation.depth,
        reservationKey: request.delegation.reservationKey,
        authorityHash: graph.authorityEnvelope.authorityHash,
        invocationBudgetCeiling: graph.authorityEnvelope.budget.maxInvocations,
        // Durably bind the launch identity to the reservation at the
        // reservation boundary itself (requirement 1), so recovery can
        // later VERIFY a caller-supplied launchIdempotencyKey against what
        // was actually reserved, rather than merely trusting it.
        launchIdempotencyKey: request.launchIdempotencyKey,
        joinPolicy: request.delegation.joinPolicy,
      });
      if (!durableReservation.ok) {
        return {
          ok: false,
          reason: "DELEGATION_PORT_FAILED",
          detail: `${durableReservation.reason}: ${durableReservation.detail}`,
          durableEvidence: [],
        };
      }
      if (!durableReservation.result.ok) {
        return {
          ok: false,
          reason: "DELEGATION_RESERVATION_REJECTED",
          detail: `${durableReservation.result.reason}: ${durableReservation.result.detail}`,
          durableEvidence: [],
        };
      }
      reservationReceipt = durableReservation.result.receipt;
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
        return this.releaseAfterLaunchFailure(plannedAppend, durableEvidence, reservationReceipt, request.taskGraphId);
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
      return this.releaseAfterLaunchFailure(admittedAppend, durableEvidence, reservationReceipt, request.taskGraphId);
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
      // Requirement 5 (adapter-rejection recovery path): the settlement
      // outcome is captured but ADAPTER_REJECTED remains the reported
      // reason regardless of whether the durable release itself confirmed,
      // because the adapter rejection is the actual, more specific cause of
      // this failure; reconcileDelegation recovers a `pending` release the
      // same way it recovers a crash after INVOCATION_COMPLETED.
      const settlementOutcome = await this.settleReservationDurable(request.taskGraphId, reservationReceipt, "rejected");
      return {
        ok: false,
        reason: "ADAPTER_REJECTED",
        detail: invocationResult.detail,
        adapterRejectionReason: invocationResult.reason,
        durableEvidence,
        ...this.settlementReceiptFields(reservationReceipt, settlementOutcome),
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
      return this.releaseAfterLaunchFailure(runningAppend, durableEvidence, reservationReceipt, request.taskGraphId);
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
      return this.releaseAfterLaunchFailure(succeededAppend, durableEvidence, reservationReceipt, request.taskGraphId);
    }
    durableEvidence.push(succeededAppend.appendedEntry);

    // Durable settlement is awaited BEFORE launch() returns its terminal
    // success (requirement 3). A crash between the INVOCATION_COMPLETED
    // append above and this settlement is exactly the window
    // reconcileDelegation() (requirement 4) is built to recover from.
    const settlementOutcome = await this.settleReservationDurable(request.taskGraphId, reservationReceipt, "succeeded");

    // Requirement 2: launch() must never report ok:true for a DELEGATED
    // launch (reservationReceipt present) without a durable completion
    // receipt. The durable run itself already succeeded (INVOCATION_STARTED
    // and INVOCATION_COMPLETED are both durably appended above), so this is
    // not a run failure - it is specifically an unconfirmed delegation
    // settlement, reported as its own failure reason so the caller can
    // drive reconcileDelegation() rather than believe the delegation side
    // is closed.
    if (reservationReceipt && settlementOutcome.kind !== "settled") {
      const pendingDetail =
        settlementOutcome.kind === "pending"
          ? `${settlementOutcome.reason}: ${settlementOutcome.detail}`
          : "durable settlement was not attempted";
      return {
        ok: false,
        reason: "DELEGATION_SETTLEMENT_PENDING",
        detail: `task ${request.taskId} durably succeeded but delegation settlement is unconfirmed: ${pendingDetail}`,
        durableEvidence,
        reservationReceipt,
        completionReceipt: undefined,
      };
    }

    return {
      ok: true,
      replayed: invocationResult.replayed,
      invocationResult,
      durableEvidence,
      ...this.settlementReceiptFields(reservationReceipt, settlementOutcome),
    };
  }

  /**
   * Recover-and-reconcile (requirement 4, extended per reviewer
   * RETURN_FOR_REWORK / RETURN_FOR_REWORK_R4): resume the durable run and,
   * for the given task, durably close a still-open reservation using ONLY
   * durable evidence, so a restarted worker process can recover any
   * dangling reservation before resuming new work. This is the sole public
   * recovery path; callers - including tests - must drive recovery through
   * this method, never through the delegation port's `settleDurable`
   * directly.
   *
   * Two independent evidence sources decide WHICH outcome to attempt:
   *
   * 1. Terminal task state (`reconcileOutcomeFor`): the run reached a
   *    durably TERMINAL state for `taskId`. Covers the success-path crash
   *    window between INVOCATION_COMPLETED and durable settlement.
   * 2. Attempt-scoped evidence (`reconcileOutcomeForAttempt`), used ONLY
   *    when the caller supplies `launchIdempotencyKey`: covers the
   *    adapter-rejection window and the post-reservation
   *    run-store-failure window.
   *
   * Neither evidence source is, by itself, authorization to settle
   * (requirement 2). When `launchIdempotencyKey` is supplied, the actual
   * settlement attempt is gated by the durable store's own identity
   * verification: `settleDurable` is called with `expectedIdentity`
   * (`{ launchIdempotencyKey, childTaskId: taskId }`), which the store
   * checks against the reservation's OWN durably persisted launch identity
   * (requirement 1) BEFORE any state changes. A wrong, stale, or unrelated
   * `launchIdempotencyKey` - or a `taskId`/`reservationKey` pair that does
   * not actually belong together - fails this check with
   * `IDENTITY_MISMATCH`; this method then returns
   * `{ ok: true, reconciled: false, identityMismatch: true }` and changes
   * NOTHING: capacity remains reserved (requirement 2/3). When no
   * `launchIdempotencyKey` is supplied, recovery is limited to the
   * terminal-state path only (which needs no caller-supplied identity to
   * verify, since it is driven entirely by the task's own durable state)
   * and no unverified settlement is ever attempted.
   *
   * A reservation that is not open, or neither evidence source yielding an
   * outcome, is reported as `reconciled: false` without any write.
   * Idempotent: a repeated call after successful reconciliation finds the
   * reservation already closed (`isReservationOpen` returns `open: false`)
   * and is a safe no-op.
   */
  async reconcileDelegation(
    taskGraphId: string,
    taskId: string,
    reservationKey: string,
    launchIdempotencyKey?: string,
  ): Promise<MaoOperationalReconcileResult> {
    if (!this.delegationPort) {
      return { ok: true, reconciled: false };
    }

    const resumed = await this.store.resumeRun(taskGraphId);
    if (!resumed.ok) {
      return { ok: false, reason: "DURABLE_STORE_REJECTED", detail: `${resumed.reason}: ${resumed.detail}` };
    }

    const latestEvent = latestEventFor(resumed.events, taskId);
    const currentState = latestEvent?.resultingState ?? null;
    const terminalOutcome = currentState === null ? null : reconcileOutcomeFor(currentState);

    // Requirement 2 (reviewer FINAL STABILIZATION PACKET, closing the R6
    // gap): resolving childTaskId alone is insufficient to prove terminal
    // evidence belongs to the OPEN reservation being recovered - two
    // different launch attempts can share the same taskId, e.g. reservation
    // OLD (task-a/launch-old) is still open while a LATER, different
    // attempt NEW (task-a/launch-new) is the one that actually reached the
    // durably terminal state. The R6 fix for this (`launchIdempotencyKeyOfEvent`,
    // reversing an event's own idempotencyKey by splitting at the first
    // "::") was itself unsound: a real launchIdempotencyKey containing "::"
    // (e.g. "launch-old::different-attempt") would be misread as merely its
    // own prefix before the first "::", producing a false match against an
    // unrelated reservation bound to that prefix. There is no reverse-
    // parsing here any more. `terminalEventOwnedByAttempt` instead proves
    // ownership by FULL, EXACT comparison against the one and only
    // correctly-encoded milestone key a genuine attempt with the
    // reservation's own bound launchIdempotencyKey would have produced -
    // per eventType (INVOCATION_COMPLETED compared directly; TIMEOUT_DETECTED
    // and CANCEL_ACCEPTED proven through their own preceding
    // INVOCATION_STARTED event, located by `sequence`, never by array
    // position). If ownership cannot be proven, recovery fails closed with
    // no settlement - it never falls back to trusting taskId-only aggregate
    // state.
    if (terminalOutcome !== null) {
      const openCheck = await this.delegationPort.isReservationOpen(taskGraphId, reservationKey);
      if (!openCheck.ok) {
        return { ok: false, reason: "DELEGATION_PORT_FAILED", detail: `${openCheck.reason}: ${openCheck.detail}` };
      }
      if (!openCheck.open) {
        return { ok: true, reconciled: false };
      }

      const identityLookup = await this.delegationPort.getReservationIdentity(taskGraphId, reservationKey);
      if (!identityLookup.ok) {
        return { ok: false, reason: "DELEGATION_PORT_FAILED", detail: `${identityLookup.reason}: ${identityLookup.detail}` };
      }
      if (
        identityLookup.identity === null ||
        identityLookup.identity.childTaskId !== taskId ||
        !terminalEventOwnedByAttempt(resumed.events, taskId, identityLookup.identity.launchIdempotencyKey)
      ) {
        // Either the reservation does not belong to this task, or the
        // terminal evidence cannot be PROVEN to belong to the exact launch
        // attempt this reservation was opened for. Either way, a terminal
        // outcome must never provide the settlement for a reservation it
        // cannot be proven to belong to. Typed mismatch, no write, capacity
        // remains reserved.
        return { ok: true, reconciled: false, identityMismatch: true };
      }

      const settled = await this.delegationPort.settleDurable(taskGraphId, reservationKey, terminalOutcome, identityLookup.identity);
      if (!settled.ok) {
        return { ok: false, reason: "DELEGATION_PORT_FAILED", detail: `${settled.reason}: ${settled.detail}` };
      }
      if (!settled.result.ok) {
        if (settled.result.reason === "IDENTITY_MISMATCH") {
          return { ok: true, reconciled: false, identityMismatch: true };
        }
        return { ok: false, reason: "DELEGATION_PORT_FAILED", detail: `${settled.result.reason}: ${settled.result.detail}` };
      }
      return { ok: true, reconciled: true, completionReceipt: settled.result.receipt };
    }

    // No terminal state. Recovery is only possible when the caller names
    // the exact attempt it asserts will not proceed further, AND that
    // assertion is verified against the reservation's own durably bound
    // identity before anything settles (requirement 1/2/3).
    if (launchIdempotencyKey === undefined) {
      return { ok: true, reconciled: false };
    }

    const attemptOutcome = reconcileOutcomeForAttempt(resumed.events, taskId, launchIdempotencyKey);
    if (attemptOutcome === null) {
      return { ok: true, reconciled: false };
    }

    const openCheck = await this.delegationPort.isReservationOpen(taskGraphId, reservationKey);
    if (!openCheck.ok) {
      return { ok: false, reason: "DELEGATION_PORT_FAILED", detail: `${openCheck.reason}: ${openCheck.detail}` };
    }
    if (!openCheck.open) {
      return { ok: true, reconciled: false };
    }

    const settled = await this.delegationPort.settleDurable(taskGraphId, reservationKey, attemptOutcome, {
      launchIdempotencyKey,
      childTaskId: taskId,
    });
    if (!settled.ok) {
      return { ok: false, reason: "DELEGATION_PORT_FAILED", detail: `${settled.reason}: ${settled.detail}` };
    }
    if (!settled.result.ok) {
      if (settled.result.reason === "IDENTITY_MISMATCH") {
        // Requirement 2/3: a wrong/stale/unrelated caller-supplied identity
        // must return a typed mismatch result and leave capacity reserved
        // - never imply outcome=failed by mere absence of contrary
        // evidence. No write occurred; the reservation remains open.
        return { ok: true, reconciled: false, identityMismatch: true };
      }
      return { ok: false, reason: "DELEGATION_PORT_FAILED", detail: `${settled.result.reason}: ${settled.result.detail}` };
    }

    return { ok: true, reconciled: true, completionReceipt: settled.result.receipt };
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
   * durable milestone). The abort cascade itself is now durable: it is
   * awaited through the injected delegation port before this call resolves,
   * and a durable persistence failure is reported as a typed failure
   * (`DURABLE_ABORT_PERSISTENCE_FAILED`) rather than as success - the
   * in-memory `mayStartNewChild` block is real for this process instance,
   * but it is not durable proof the abort survived a restart, and a
   * restarted launcher replaying the durable delegation ledger would not
   * see an abort that failed to persist (requirement 6).
   */
  async requestCancellation(taskGraphId: string, taskId: string): Promise<MaoOperationalCancelRequestResult> {
    this.lifecycle.requestCancel(taskId);
    if (!this.lifecycle.mayStartNewChild(taskId)) {
      let cascadeReceipt: MaoDelegationAbortCascadeReceipt | undefined;
      if (this.delegationPort) {
        const durableCascade = await this.delegationPort.abortCascadeDurable(taskGraphId, taskId);
        if (!durableCascade.ok) {
          return {
            ok: false,
            reason: "DURABLE_ABORT_PERSISTENCE_FAILED",
            detail: `${durableCascade.reason}: ${durableCascade.detail}`,
          };
        }
        cascadeReceipt = durableCascade.receipt;
      }
      return {
        ok: true,
        blocksNewChildren: true,
        cascadeReceipt,
      };
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

  /**
   * Attempt a durable settlement and report which of the three
   * `DurableSettlementOutcome` cases actually happened. Never throws for a
   * typed port failure (`IO_FAILURE`, `CONCURRENT_WRITE_LOST_RACE`, etc.) or
   * a coordinator-level rejection (`UNKNOWN_RESERVATION`): both surface as
   * `pending` so the caller can decide how to fail closed rather than
   * silently discarding the outcome.
   *
   * Requirement 1 (reviewer RETURN_FOR_REWORK R5): this inline launcher
   * settlement now passes `expectedIdentity` sourced directly from the
   * reservation receipt this same `launch()` call durably obtained moments
   * earlier - `reservation.launchIdempotencyKey` and
   * `reservation.childTaskId` are exactly the identity this reservation is
   * bound to, so this settlement is inherently self-consistent (the
   * launcher is closing the exact reservation it just opened), and passing
   * that identity through the now-required port parameter makes that
   * self-consistency verified by the store, not merely assumed by this
   * method.
   */
  private async settleReservationDurable(
    taskGraphId: string,
    reservation: MaoDelegationReservationReceipt | undefined,
    outcome: "succeeded" | "failed" | "rejected",
  ): Promise<DurableSettlementOutcome> {
    if (!reservation || !this.delegationPort) return { kind: "notApplicable" };
    const settled = await this.delegationPort.settleDurable(taskGraphId, reservation.reservationKey, outcome, {
      launchIdempotencyKey: reservation.launchIdempotencyKey,
      childTaskId: reservation.childTaskId,
    });
    if (!settled.ok) {
      return { kind: "pending", reason: settled.reason, detail: settled.detail };
    }
    if (!settled.result.ok) {
      return { kind: "pending", reason: settled.result.reason, detail: settled.result.detail };
    }
    return { kind: "settled", receipt: settled.result.receipt };
  }

  /**
   * Turn a `DurableSettlementOutcome` into the `reservationReceipt` /
   * `completionReceipt` pair the public result shapes carry, plus whether
   * this outcome durably closed the delegation side (`settled` or
   * `notApplicable` - both are fine to report as launch success/failure
   * proceeding normally; only `pending` must block an `ok: true` launch
   * result, per requirement 2).
   */
  private settlementReceiptFields(
    reservation: MaoDelegationReservationReceipt | undefined,
    outcome: DurableSettlementOutcome,
  ): {
    reservationReceipt: MaoDelegationReservationReceipt | undefined;
    completionReceipt: MaoDelegationCompletionReceipt | undefined;
  } {
    return {
      reservationReceipt: reservation,
      completionReceipt: outcome.kind === "settled" ? outcome.receipt : undefined,
    };
  }

  private async releaseAfterLaunchFailure(
    failure: MaoDurableRunStoreFailure,
    priorEvidence: readonly MaoEventLedgerEntry[],
    reservation: MaoDelegationReservationReceipt | undefined,
    taskGraphId: string,
  ): Promise<MaoOperationalLaunchFailure> {
    // A pre-dispatch/run-store failure (e.g. the durable event append
    // itself was rejected) still attempts to durably release any
    // reservation already taken, but this path's own failure reason
    // (DURABLE_STORE_REJECTED) takes precedence in the returned result even
    // if the settlement attempt itself also could not be confirmed; the
    // caller has durableEvidence and reservationReceipt to drive
    // reconcileDelegation regardless of which failure is reported.
    const settlementOutcome = await this.settleReservationDurable(taskGraphId, reservation, "failed");
    return {
      ...this.storeFailureAsLaunchFailure(failure, priorEvidence),
      ...this.settlementReceiptFields(reservation, settlementOutcome),
    };
  }
}
