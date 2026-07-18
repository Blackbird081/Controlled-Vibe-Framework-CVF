// CVF MAO-T1 - Event Ledger Contract
//
// Implements the append-only event/state ledger defined by
// docs/reference/multi_agent_orchestration/CVF_MAO_RUNTIME_FOUNDATION_CONTRACT.md
// ("Task Lifecycle State Transition Table", "Terminal Outcome Propagation").
// Per the contract's Storage And Retention Decision, this ledger is the sole
// execution truth; it is never rewritten and never a workspace projection.
// Local execution-plane module only; no provider, queue, or runtime caller.

import { computeDeterministicHash } from "../../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { MaoTaskGraph } from "./task.graph.contract";
import { verifyAuthorityEnvelope } from "./task.graph.contract";

// --- Types (mirror CVF_MAO_RUNTIME_FOUNDATION_SCHEMA.json eventLedgerEntry) ---

export type MaoTaskState =
  | "planned"
  | "admitted"
  | "running"
  | "succeeded"
  | "rejected"
  | "blocked"
  | "cancelled"
  | "timed_out"
  | "exhausted"
  | "failed";

export const MAO_TERMINAL_STATES: ReadonlySet<MaoTaskState> = new Set([
  "succeeded",
  "rejected",
  "cancelled",
  "exhausted",
  "failed",
]);

/** `blocked` and `timed_out` are recoverable non-terminal holds, not final outcomes. */
export function isTerminalState(state: MaoTaskState): boolean {
  return MAO_TERMINAL_STATES.has(state);
}

export type MaoEventType =
  | "GRAPH_COMPILED"
  | "TASK_ADMITTED"
  | "INVOCATION_STARTED"
  | "INVOCATION_COMPLETED"
  | "REVIEW_RECORDED"
  | "TASK_TRANSITIONED"
  | "CANCEL_REQUESTED"
  | "CANCEL_ACCEPTED"
  | "TIMEOUT_DETECTED"
  | "ORPHAN_RECOVERY_ACTION"
  | "INTEGRATION_RECORDED";

export interface MaoEventLedgerEntry {
  eventId: string;
  taskGraphId: string;
  taskId: string;
  eventType: MaoEventType;
  occurredAt: string;
  resultingState: MaoTaskState;
  sequence: number;
  idempotencyKey: string | null;
}

export interface MaoAppendEventInput {
  taskGraphId: string;
  taskId: string;
  eventType: MaoEventType;
  resultingState: MaoTaskState;
  occurredAt: string;
  /**
   * Optional caller-supplied idempotency key (per the contract's Idempotency,
   * Retry, Cancel, And Recovery section). When two appends carry the same
   * non-null idempotencyKey, the second is rejected as DUPLICATE_EVENT_ID
   * instead of being recorded a second time, even though the ledger's
   * internal eventId/sequence would otherwise differ.
   */
  idempotencyKey?: string;
}

export type MaoLedgerAppendFailureReason =
  | "AUTHORITY_HASH_MISMATCH"
  | "UNKNOWN_TASK_ID"
  | "DUPLICATE_EVENT_ID"
  | "INVALID_STATE_TRANSITION"
  | "GRAPH_ID_MISMATCH";

export interface MaoLedgerAppendSuccess {
  ok: true;
  entry: MaoEventLedgerEntry;
}

export interface MaoLedgerAppendFailure {
  ok: false;
  reason: MaoLedgerAppendFailureReason;
  detail: string;
}

export type MaoLedgerAppendResult = MaoLedgerAppendSuccess | MaoLedgerAppendFailure;

/**
 * Task Lifecycle State Transition Table, transcribed exactly from
 * CVF_MAO_RUNTIME_FOUNDATION_CONTRACT.md. Each entry lists the resultingState
 * values that are reachable from a given current state. `null` current state
 * means "no prior event for this task" (the task's first recorded state).
 * `__initial__` also allows a direct move to `blocked`: an event-less task
 * defaults to `planned` in the read model (read.model.contract.ts), and the
 * contract's "any non-terminal | blocked | budget exhaustion or
 * human-checkpoint gate is pending" row must reach a task that has not yet
 * received its first event, such as a dependent blocked by a sibling's
 * terminal outcome before the dependent itself ever ran.
 */
const ALLOWED_TRANSITIONS: Record<MaoTaskState | "__initial__", ReadonlySet<MaoTaskState>> = {
  __initial__: new Set(["planned", "blocked"]),
  planned: new Set(["admitted", "blocked"]),
  admitted: new Set(["running", "blocked"]),
  running: new Set(["succeeded", "rejected", "blocked", "cancelled", "timed_out", "exhausted", "failed"]),
  timed_out: new Set(["running", "blocked"]),
  blocked: new Set(["planned", "admitted", "running", "blocked"]),
  succeeded: new Set([]),
  rejected: new Set([]),
  cancelled: new Set([]),
  exhausted: new Set([]),
  failed: new Set([]),
};

/**
 * Terminal Outcome Propagation table, transcribed exactly from the contract.
 * Maps a terminal outcome to the state its required descendants must move to.
 */
const TERMINAL_DESCENDANT_PROPAGATION: Record<string, MaoTaskState> = {
  succeeded: "planned", // dependents become dependency-ready; represented as remaining/entering `planned`.
  rejected: "blocked",
  cancelled: "blocked",
  timed_out: "blocked",
  exhausted: "blocked",
  failed: "blocked",
};

export function descendantPropagationFor(outcome: MaoTaskState): MaoTaskState {
  return TERMINAL_DESCENDANT_PROPAGATION[outcome] ?? "blocked";
}

function isAllowedTransition(from: MaoTaskState | null, to: MaoTaskState): boolean {
  const key = from ?? "__initial__";
  return ALLOWED_TRANSITIONS[key].has(to);
}

/**
 * Append-only, in-memory event ledger. Entries are never mutated or removed
 * once appended (`getEntries()` returns a frozen defensive copy). This is
 * the ledger's core invariant per the contract's Storage And Retention
 * Decision: "Execution truth ... never the workspace generated state".
 */
export class MaoEventLedger {
  private readonly entries: MaoEventLedgerEntry[] = [];
  private readonly seenEventIds = new Set<string>();
  private readonly seenIdempotencyKeys = new Set<string>();
  private readonly currentStateByTask = new Map<string, MaoTaskState>();
  private readonly graph: MaoTaskGraph;
  private sequenceCounter = 0;

  constructor(graph: MaoTaskGraph) {
    if (!verifyAuthorityEnvelope(graph.authorityEnvelope)) {
      throw new Error("MaoEventLedger: refusing to attach to a graph with a corrupted authorityHash");
    }
    this.graph = graph;
  }

  /**
   * Append one event after verifying: the graph identity matches, the task
   * exists in the compiled graph, the caller-supplied idempotencyKey (if
   * any) has not been seen before (duplicate-event protection per the
   * contract's Idempotency, Retry, Cancel, And Recovery section - a retried
   * submission with the same key returns DUPLICATE_EVENT_ID instead of being
   * recorded twice), and the requested state transition is allowed from the
   * task's current state per the Task Lifecycle State Transition Table.
   * Authority is re-verified on every append so a graph whose authority was
   * tampered with after compilation is rejected before any event is
   * recorded (Threat And Failure Model: "Stale authority hash").
   */
  append(input: MaoAppendEventInput): MaoLedgerAppendResult {
    if (!verifyAuthorityEnvelope(this.graph.authorityEnvelope)) {
      return { ok: false, reason: "AUTHORITY_HASH_MISMATCH", detail: "ledger's bound graph authority no longer verifies" };
    }

    if (input.taskGraphId !== this.graph.taskGraphId) {
      return {
        ok: false,
        reason: "GRAPH_ID_MISMATCH",
        detail: `event graph ${input.taskGraphId} does not match ledger graph ${this.graph.taskGraphId}`,
      };
    }

    const taskExists = this.graph.tasks.some((task) => task.taskId === input.taskId);
    if (!taskExists) {
      return { ok: false, reason: "UNKNOWN_TASK_ID", detail: `task ${input.taskId} is not declared in the compiled graph` };
    }

    if (input.idempotencyKey && this.seenIdempotencyKeys.has(input.idempotencyKey)) {
      return {
        ok: false,
        reason: "DUPLICATE_EVENT_ID",
        detail: `idempotencyKey ${input.idempotencyKey} was already appended; duplicate submission rejected`,
      };
    }

    const currentState = this.currentStateByTask.get(input.taskId) ?? null;
    if (!isAllowedTransition(currentState, input.resultingState)) {
      return {
        ok: false,
        reason: "INVALID_STATE_TRANSITION",
        detail: `task ${input.taskId} cannot move from ${currentState ?? "(none)"} to ${input.resultingState}`,
      };
    }

    this.sequenceCounter += 1;
    const eventId = computeDeterministicHash(
      "mao-t1-event-id",
      this.graph.taskGraphId,
      input.taskId,
      input.eventType,
      input.resultingState,
      String(this.sequenceCounter),
    );

    const entry: MaoEventLedgerEntry = {
      eventId,
      taskGraphId: input.taskGraphId,
      taskId: input.taskId,
      eventType: input.eventType,
      occurredAt: input.occurredAt,
      resultingState: input.resultingState,
      sequence: this.sequenceCounter,
      idempotencyKey: input.idempotencyKey ?? null,
    };

    this.entries.push(Object.freeze(entry));
    this.seenEventIds.add(eventId);
    if (input.idempotencyKey) this.seenIdempotencyKeys.add(input.idempotencyKey);
    this.currentStateByTask.set(input.taskId, input.resultingState);

    return { ok: true, entry };
  }

  /**
   * Append terminal-outcome propagation events for every direct dependent of
   * a task that has just reached a terminal state, per the Terminal Outcome
   * Propagation table. Independent siblings (tasks that do not depend on the
   * terminal task) are left untouched, matching the contract's "independent
   * siblings may continue" rule.
   */
  propagateTerminalOutcome(
    taskGraphId: string,
    terminalTaskId: string,
    outcome: MaoTaskState,
    dependents: string[],
    occurredAt: string,
  ): MaoLedgerAppendResult[] {
    const propagatedState = descendantPropagationFor(outcome);
    return dependents.map((dependentTaskId) =>
      this.append({
        taskGraphId,
        taskId: dependentTaskId,
        eventType: "TASK_TRANSITIONED",
        resultingState: propagatedState,
        occurredAt,
      }),
    );
  }

  getEntries(): readonly MaoEventLedgerEntry[] {
    return Object.freeze([...this.entries]);
  }

  getCurrentState(taskId: string): MaoTaskState | null {
    return this.currentStateByTask.get(taskId) ?? null;
  }

  getGraphId(): string {
    return this.graph.taskGraphId;
  }
}
