// CVF BRIGADE-MAO-R1 - Atomic Delegation Lifecycle Coordinator
//
// Provider-free runtime composition for the existing MAO launcher. It binds
// reservation, abort admission closure, leaf-first cascade, exactly-once
// release, and per-parent completion serialization into one state owner.
// Receipts are metadata only; this module starts no process, provider, queue,
// network call, or background runtime.
//
// Rework (reviewer RETURN_FOR_REWORK): reservation receipts now bind an
// authorityHash and invocation-budget ceiling (requirement 9); parent
// continuation ("wake") is a durable, one-shot boundary that once fired
// rejects any further reservation for that parent, even if admission was
// never explicitly closed by an abort (requirement 8); and every join-policy
// input (contributing settlement sequences, budget ceiling, wake decision)
// is retained on the coordinator so a durable store can persist it verbatim
// (requirement 7).
//
// Rework R4 (reviewer RETURN_FOR_REWORK): a reservation now durably binds
// the LAUNCH IDENTITY that requested it - `launchIdempotencyKey` - alongside
// `childTaskId` and `reservationKey` (requirement 1). This is what lets a
// recovery caller be VERIFIED rather than merely trusted: `settle` accepts
// an optional `expectedLaunchIdempotencyKey`/`expectedTaskId` pair and, when
// supplied, refuses to settle (returns `IDENTITY_MISMATCH`, changes no
// state) unless both match the reservation's own durably bound values. Prior
// to this, recovery trusted whatever key/taskId a caller supplied with no
// cross-check against what was actually reserved (requirement 2's defect).
//
// Rework R5 (reviewer RETURN_FOR_REWORK): R4 left two gaps. First, the
// launcher's OWN inline settlement calls (after a genuine successful/
// rejected launch it just performed) never passed `expectedIdentity` at
// all, even though `MaoDelegationReservationReceipt` already carries every
// field needed. Second, and more serious: `reconcileDelegation`'s
// terminal-task-state recovery path settled using the CALLER-SUPPLIED
// `reservationKey` with NO verification that the terminal task and that
// reservation actually belong together - a terminal task A's outcome could
// settle an unrelated task B's still-open reservation if a caller passed
// A's taskId alongside B's reservationKey. `getReservationIdentity` below
// closes this: any caller settling on behalf of a specific task must first
// resolve the reservation's own durable identity and verify
// `childTaskId === thatTask` BEFORE calling `settle`, never infer identity
// from its own arguments unchecked.
//
// Rework R6 (reviewer RETURN_FOR_REWORK): R5 left two further gaps. First,
// `settle`'s `expectedIdentity` was still OPTIONAL on this public method -
// nothing in the type system or the runtime stopped an external caller from
// invoking `settle(reservationKey, outcome)` with no identity at all and
// settling completely unverified, even though every runtime consumer (the
// durable port, the launcher) had by then been updated to always pass one.
// `settle` now REQUIRES `expectedIdentity`; there is no overload, default,
// or code path on this public method that settles without it. The one
// legitimately trusted internal caller - `abortCascade`, settling its own
// cascade of reservations it just closed admission for and enumerated
// itself, never from caller-supplied identity - now goes through a private
// `settleTrusted` that is not reachable from outside this class. Second,
// verifying only `childTaskId` was insufficient to distinguish a genuinely
// DIFFERENT launch attempt for the SAME task: a reservation opened for
// `task-a` under `launch-old`, still open, could be settled by terminal
// evidence that actually belongs to a LATER, different attempt
// `task-a`/`launch-new` for the same taskId, because `childTaskId` alone
// cannot tell the two attempts apart. `expectedIdentity` was already a full
// `{ launchIdempotencyKey, childTaskId }` pair and `settle` already compared
// both fields - the gap was entirely on the CALLER side (the launcher),
// which resolved only `childTaskId` before settling in one recovery path;
// see the launcher's own R6 note for that fix. This module's contribution to
// closing it is simply making the existing full-pair check unconditional by
// making `expectedIdentity` required.

export interface MaoAtomicDelegationPolicy {
  globalMaxChildren: number;
  parentMaxChildren: number;
  maxDepth: number;
}

/**
 * A parent's join policy: how many contributing child settlements are
 * required before the parent may be woken. `ALL_CHILDREN` (the default) only
 * wakes once every reserved-and-not-yet-settled child under the parent has
 * settled; `FIRST_SETTLEMENT` wakes on the first child settlement regardless
 * of siblings still in flight.
 */
export type MaoDelegationJoinPolicy = "ALL_CHILDREN" | "FIRST_SETTLEMENT";

export interface MaoDelegationReservationRequest {
  taskGraphId: string;
  parentTaskId: string;
  childTaskId: string;
  depth: number;
  reservationKey: string;
  /** Authority envelope hash the reservation is bound to (requirement 9). */
  authorityHash: string;
  /** Declared invocation-budget ceiling this reservation counts against (requirement 9). */
  invocationBudgetCeiling: number;
  /**
   * The launch attempt identity requesting this reservation, durably bound
   * alongside `childTaskId` and `reservationKey` (requirement 1). This is
   * the identity `settle`'s optional identity check verifies against, so a
   * recovery caller cannot settle a reservation it did not actually launch
   * by merely asserting a plausible-looking key.
   */
  launchIdempotencyKey: string;
  joinPolicy?: MaoDelegationJoinPolicy;
}

export type MaoDelegationReservationFailureReason =
  | "PARENT_ADMISSION_CLOSED"
  | "PARENT_ALREADY_WOKEN"
  | "GLOBAL_CAPACITY_EXHAUSTED"
  | "PARENT_CAPACITY_EXHAUSTED"
  | "DEPTH_EXCEEDED"
  | "INVOCATION_BUDGET_EXHAUSTED"
  | "AUTHORITY_HASH_CONFLICT"
  | "RESERVATION_KEY_CONFLICT";

export interface MaoDelegationReservationReceipt {
  reservationKey: string;
  taskGraphId: string;
  parentTaskId: string;
  childTaskId: string;
  depth: number;
  authorityHash: string;
  invocationBudgetCeiling: number;
  invocationBudgetConsumedAfter: number;
  launchIdempotencyKey: string;
  globalActiveAfter: number;
  parentActiveAfter: number;
  replayed: boolean;
}

export type MaoDelegationReservationResult =
  | { ok: true; receipt: MaoDelegationReservationReceipt }
  | { ok: false; reason: MaoDelegationReservationFailureReason; detail: string };

export type MaoDelegationSettlementOutcome = "succeeded" | "failed" | "cancelled" | "timed_out" | "rejected";

export interface MaoDelegationCompletionReceipt {
  reservationKey: string;
  parentTaskId: string;
  childTaskId: string;
  outcome: MaoDelegationSettlementOutcome;
  parentCompletionSequence: number;
  joinPolicy: MaoDelegationJoinPolicy;
  contributingSequences: readonly number[];
  globalActiveAfter: number;
  parentActiveAfter: number;
  released: boolean;
  wakeParent: boolean;
  replayed: boolean;
}

export type MaoDelegationSettlementFailureReason = "UNKNOWN_RESERVATION" | "IDENTITY_MISMATCH";

export type MaoDelegationSettlementResult =
  | { ok: true; receipt: MaoDelegationCompletionReceipt }
  | { ok: false; reason: MaoDelegationSettlementFailureReason; detail: string };

/**
 * Identity a settle caller may optionally assert to verify against the
 * reservation's own durably bound identity (requirement 1/2). When supplied,
 * `settle` refuses (returns `IDENTITY_MISMATCH`, changes no state) unless
 * BOTH `launchIdempotencyKey` and `childTaskId` match what was actually
 * reserved. Omitting this parameter preserves the original unverified
 * behavior for internal/replay callers that already know the reservation is
 * theirs (e.g. `abortCascade`'s own cascade settlement, and ledger replay
 * re-applying a persisted SETTLE entry that already recorded a verified
 * outcome once).
 */
export interface MaoDelegationSettlementIdentity {
  launchIdempotencyKey: string;
  childTaskId: string;
}

export interface MaoDelegationAbortCascadeReceipt {
  parentTaskId: string;
  admissionClosed: true;
  releasedLeafFirst: readonly string[];
  completions: readonly MaoDelegationCompletionReceipt[];
}

interface ActiveReservation extends MaoDelegationReservationRequest {
  released: boolean;
  joinPolicy: MaoDelegationJoinPolicy;
}

function sameReservation(a: ActiveReservation, b: MaoDelegationReservationRequest): boolean {
  return (
    a.taskGraphId === b.taskGraphId &&
    a.parentTaskId === b.parentTaskId &&
    a.childTaskId === b.childTaskId &&
    a.depth === b.depth &&
    a.reservationKey === b.reservationKey &&
    a.launchIdempotencyKey === b.launchIdempotencyKey
  );
}

/**
 * One synchronous state owner makes capacity check + increment indivisible in
 * the JavaScript execution model. Every release is keyed and memoized, so a
 * retry cannot free capacity twice or wake a parent twice.
 */
export class MaoAtomicDelegationLifecycleCoordinator {
  private readonly policy: MaoAtomicDelegationPolicy;
  private readonly reservations = new Map<string, ActiveReservation>();
  private readonly completions = new Map<string, MaoDelegationCompletionReceipt>();
  private readonly closedParents = new Set<string>();
  private readonly wokenParents = new Set<string>();
  private readonly activeByParent = new Map<string, number>();
  private readonly completionSequenceByParent = new Map<string, number>();
  private readonly contributingSequencesByParent = new Map<string, number[]>();
  private readonly invocationBudgetConsumedByAuthority = new Map<string, number>();
  private readonly authorityHashByReservationKey = new Map<string, string>();
  private globalActive = 0;

  constructor(policy: MaoAtomicDelegationPolicy) {
    if (
      !Number.isInteger(policy.globalMaxChildren) ||
      !Number.isInteger(policy.parentMaxChildren) ||
      !Number.isInteger(policy.maxDepth) ||
      policy.globalMaxChildren < 1 ||
      policy.parentMaxChildren < 1 ||
      policy.maxDepth < 1
    ) {
      throw new Error("delegation policy ceilings must be positive integers");
    }
    this.policy = { ...policy };
  }

  reserve(request: MaoDelegationReservationRequest): MaoDelegationReservationResult {
    const joinPolicy = request.joinPolicy ?? "ALL_CHILDREN";
    const existing = this.reservations.get(request.reservationKey);
    if (existing) {
      if (!sameReservation(existing, request)) {
        return {
          ok: false,
          reason: "RESERVATION_KEY_CONFLICT",
          detail: `reservationKey ${request.reservationKey} is already bound to another delegation`,
        };
      }
      return {
        ok: true,
        receipt: this.reservationReceipt(existing, true),
      };
    }

    // An explicitly closed parent (abort cascade) reports the more specific
    // PARENT_ADMISSION_CLOSED diagnostic even when that same cascade's
    // settlement also happened to fire the parent's continuation wake (e.g.
    // the last active child being cancelled). Checked first so admission
    // closure - the invariant I-3 boundary - is always the reported reason
    // for a parent that was actually aborted.
    if (this.closedParents.has(request.parentTaskId)) {
      return {
        ok: false,
        reason: "PARENT_ADMISSION_CLOSED",
        detail: `parent ${request.parentTaskId} closed child admission before reservation`,
      };
    }
    // A reservation for a parent whose join policy already fired a wake
    // through NORMAL settlement (no abort) is rejected too (requirement 8):
    // the parent continuation decided with the sibling set known at wake
    // time, and a late reservation must not be able to reopen that
    // decision.
    if (this.wokenParents.has(request.parentTaskId)) {
      return {
        ok: false,
        reason: "PARENT_ALREADY_WOKEN",
        detail: `parent ${request.parentTaskId} continuation already fired; no new child may be reserved`,
      };
    }
    if (request.depth > this.policy.maxDepth) {
      return { ok: false, reason: "DEPTH_EXCEEDED", detail: `depth ${request.depth} exceeds ${this.policy.maxDepth}` };
    }

    const existingAuthorityHash = this.authorityHashByReservationKey.get(request.taskGraphId);
    if (existingAuthorityHash && existingAuthorityHash !== request.authorityHash) {
      return {
        ok: false,
        reason: "AUTHORITY_HASH_CONFLICT",
        detail: `taskGraphId ${request.taskGraphId} is already bound to a different authorityHash`,
      };
    }

    const budgetConsumed = this.invocationBudgetConsumedByAuthority.get(request.authorityHash) ?? 0;
    if (budgetConsumed >= request.invocationBudgetCeiling) {
      return {
        ok: false,
        reason: "INVOCATION_BUDGET_EXHAUSTED",
        detail: `authority ${request.authorityHash} consumed ${budgetConsumed} of ${request.invocationBudgetCeiling} invocations`,
      };
    }

    if (this.globalActive >= this.policy.globalMaxChildren) {
      return {
        ok: false,
        reason: "GLOBAL_CAPACITY_EXHAUSTED",
        detail: `global active child count ${this.globalActive} reached ${this.policy.globalMaxChildren}`,
      };
    }
    const parentActive = this.activeByParent.get(request.parentTaskId) ?? 0;
    if (parentActive >= this.policy.parentMaxChildren) {
      return {
        ok: false,
        reason: "PARENT_CAPACITY_EXHAUSTED",
        detail: `parent ${request.parentTaskId} active child count ${parentActive} reached ${this.policy.parentMaxChildren}`,
      };
    }

    const reservation: ActiveReservation = { ...request, joinPolicy, released: false };
    this.reservations.set(request.reservationKey, reservation);
    this.globalActive += 1;
    this.activeByParent.set(request.parentTaskId, parentActive + 1);
    this.invocationBudgetConsumedByAuthority.set(request.authorityHash, budgetConsumed + 1);
    this.authorityHashByReservationKey.set(request.taskGraphId, request.authorityHash);
    return { ok: true, receipt: this.reservationReceipt(reservation, false) };
  }

  /**
   * Public settlement entry point. `expectedIdentity` is REQUIRED (reviewer
   * RETURN_FOR_REWORK R6, requirement 1) - there is no public, exported way
   * to settle a reservation on this class without stating and verifying an
   * identity. The one trusted internal caller that settles without a
   * caller-supplied identity to check (`abortCascade`, settling reservations
   * it just closed admission for and enumerated itself) uses the private
   * `settleTrusted` below instead, which is not reachable from outside this
   * class.
   */
  settle(
    reservationKey: string,
    outcome: MaoDelegationSettlementOutcome,
    expectedIdentity: MaoDelegationSettlementIdentity,
  ): MaoDelegationSettlementResult {
    // Defense-in-depth runtime guard (requirement 1): TypeScript makes
    // `expectedIdentity` a compile-time-required argument, but a caller
    // that bypasses the type system (`as any`, plain JS, a stale compiled
    // build) could still invoke this with `undefined`/`null`/a malformed
    // value. `settleInternal` below treats a falsy `expectedIdentity` as
    // "perform no verification" - correct for `settleTrusted`'s internal,
    // self-verified `null` call, but NOT correct for this public method,
    // which must never settle without a checked identity. Fail closed with
    // a typed `IDENTITY_MISMATCH` (this class has no separate
    // "missing identity" reason; the store layer, one level up, reports
    // the more specific `MISSING_IDENTITY` for exactly this case) rather
    // than silently falling through to `settleInternal`'s unverified path.
    if (
      expectedIdentity === undefined ||
      expectedIdentity === null ||
      typeof expectedIdentity.launchIdempotencyKey !== "string" ||
      typeof expectedIdentity.childTaskId !== "string"
    ) {
      return {
        ok: false,
        reason: "IDENTITY_MISMATCH",
        detail: `settle requires a valid expectedIdentity (launchIdempotencyKey and childTaskId) for reservation ${reservationKey}; none was supplied`,
      };
    }
    return this.settleInternal(reservationKey, outcome, expectedIdentity);
  }

  /**
   * Internal settlement engine shared by the public, identity-verified
   * `settle` and the private, self-trusted `settleTrusted` used by
   * `abortCascade`. `expectedIdentity: null` performs NO verification (only
   * `settleTrusted` may pass `null`); a non-null identity is checked in
   * full against the reservation's own durably bound
   * `launchIdempotencyKey`/`childTaskId` pair BEFORE any other check,
   * including the replay short-circuit below, so a caller asserting a
   * wrong/stale/unrelated identity is refused even for a reservationKey
   * whose settlement already happened - it can never learn (via a
   * successful-looking replayed receipt) that some OTHER attempt's
   * settlement went through. Verifying the FULL pair (not just
   * `childTaskId`) is what distinguishes a genuinely different launch
   * attempt for the SAME taskId (requirement 2/3): a reservation bound to
   * `launch-old` for `task-a` cannot be settled by an identity naming
   * `task-a`/`launch-new`, even though `childTaskId` alone would match.
   */
  private settleInternal(
    reservationKey: string,
    outcome: MaoDelegationSettlementOutcome,
    expectedIdentity: MaoDelegationSettlementIdentity | null,
  ): MaoDelegationSettlementResult {
    const reservation = this.reservations.get(reservationKey);

    if (expectedIdentity && reservation) {
      if (
        reservation.launchIdempotencyKey !== expectedIdentity.launchIdempotencyKey ||
        reservation.childTaskId !== expectedIdentity.childTaskId
      ) {
        return {
          ok: false,
          reason: "IDENTITY_MISMATCH",
          detail: `reservation ${reservationKey} is bound to launchIdempotencyKey=${reservation.launchIdempotencyKey}/childTaskId=${reservation.childTaskId}, not the asserted launchIdempotencyKey=${expectedIdentity.launchIdempotencyKey}/childTaskId=${expectedIdentity.childTaskId}`,
        };
      }
    }

    const prior = this.completions.get(reservationKey);
    if (prior) return { ok: true, receipt: { ...prior, replayed: true } };

    if (!reservation) {
      return { ok: false, reason: "UNKNOWN_RESERVATION", detail: `reservation ${reservationKey} does not exist` };
    }

    if (!reservation.released) {
      reservation.released = true;
      this.globalActive -= 1;
      const parentActive = (this.activeByParent.get(reservation.parentTaskId) ?? 1) - 1;
      this.activeByParent.set(reservation.parentTaskId, parentActive);
    }

    const parentSequence = (this.completionSequenceByParent.get(reservation.parentTaskId) ?? 0) + 1;
    this.completionSequenceByParent.set(reservation.parentTaskId, parentSequence);
    const contributing = this.contributingSequencesByParent.get(reservation.parentTaskId) ?? [];
    contributing.push(parentSequence);
    this.contributingSequencesByParent.set(reservation.parentTaskId, contributing);

    const parentActiveAfter = this.activeByParent.get(reservation.parentTaskId) ?? 0;
    const alreadyWoken = this.wokenParents.has(reservation.parentTaskId);
    const wakeParent =
      !alreadyWoken &&
      (reservation.joinPolicy === "FIRST_SETTLEMENT" ? true : parentActiveAfter === 0);
    if (wakeParent) {
      this.wokenParents.add(reservation.parentTaskId);
    }

    const receipt: MaoDelegationCompletionReceipt = {
      reservationKey,
      parentTaskId: reservation.parentTaskId,
      childTaskId: reservation.childTaskId,
      outcome,
      parentCompletionSequence: parentSequence,
      joinPolicy: reservation.joinPolicy,
      contributingSequences: [...contributing],
      globalActiveAfter: this.globalActive,
      parentActiveAfter,
      released: true,
      wakeParent,
      replayed: false,
    };
    this.completions.set(reservationKey, receipt);
    return { ok: true, receipt };
  }

  /**
   * Trusted internal settlement, reachable only from within this class
   * (private - never exported, never callable from outside). Used by
   * `abortCascade` to settle the reservations IT just closed admission for
   * and enumerated itself from its own internal map - not a caller-supplied
   * identity to verify, because there is no external caller assertion
   * involved at all. This is the ONLY place in this class that settles
   * without a checked identity; every public/external path goes through
   * `settle`, which requires one.
   */
  private settleTrusted(reservationKey: string, outcome: MaoDelegationSettlementOutcome): MaoDelegationSettlementResult {
    return this.settleInternal(reservationKey, outcome, null);
  }

  abortCascade(parentTaskId: string): MaoDelegationAbortCascadeReceipt {
    // Admission closes before descendants are enumerated or released.
    this.closedParents.add(parentTaskId);
    const active = [...this.reservations.values()]
      .filter((reservation) => !reservation.released && this.isDescendantOf(reservation, parentTaskId))
      .sort((a, b) => b.depth - a.depth || a.childTaskId.localeCompare(b.childTaskId));
    const completions: MaoDelegationCompletionReceipt[] = [];
    for (const reservation of active) {
      const result = this.settleTrusted(reservation.reservationKey, "cancelled");
      if (result.ok) completions.push(result.receipt);
    }
    return {
      parentTaskId,
      admissionClosed: true,
      releasedLeafFirst: active.map((reservation) => reservation.childTaskId),
      completions,
    };
  }

  /** True once this parent's join policy has fired its one continuation wake (requirement 8). */
  isParentWoken(parentTaskId: string): boolean {
    return this.wokenParents.has(parentTaskId);
  }

  /**
   * Read-only lookup of a reservation's own durably bound identity
   * (`childTaskId`/`launchIdempotencyKey`), without settling it (reviewer
   * RETURN_FOR_REWORK R5, requirement 2). A caller that wants to settle a
   * reservation on behalf of a task it did NOT itself launch (e.g. terminal-
   * state recovery, which only knows a task's own outcome, not which
   * reservationKey belongs to it) must first resolve this identity and
   * verify `childTaskId` matches the task it is recovering, then pass the
   * resolved identity back into `settle`'s `expectedIdentity` - never settle
   * using an identity merely assumed from the caller's own task argument.
   * Returns `null` for an unknown reservationKey (nothing to verify against;
   * `settle` will separately report `UNKNOWN_RESERVATION`).
   */
  getReservationIdentity(reservationKey: string): MaoDelegationSettlementIdentity | null {
    const reservation = this.reservations.get(reservationKey);
    if (!reservation) return null;
    return { launchIdempotencyKey: reservation.launchIdempotencyKey, childTaskId: reservation.childTaskId };
  }

  snapshot(): Readonly<{
    globalActive: number;
    activeByParent: Readonly<Record<string, number>>;
    closedParents: readonly string[];
    wokenParents: readonly string[];
  }> {
    return Object.freeze({
      globalActive: this.globalActive,
      activeByParent: Object.freeze(Object.fromEntries(this.activeByParent)),
      closedParents: Object.freeze([...this.closedParents].sort()),
      wokenParents: Object.freeze([...this.wokenParents].sort()),
    });
  }

  private reservationReceipt(reservation: ActiveReservation, replayed: boolean): MaoDelegationReservationReceipt {
    return {
      reservationKey: reservation.reservationKey,
      taskGraphId: reservation.taskGraphId,
      parentTaskId: reservation.parentTaskId,
      childTaskId: reservation.childTaskId,
      depth: reservation.depth,
      authorityHash: reservation.authorityHash,
      invocationBudgetCeiling: reservation.invocationBudgetCeiling,
      invocationBudgetConsumedAfter: this.invocationBudgetConsumedByAuthority.get(reservation.authorityHash) ?? 0,
      launchIdempotencyKey: reservation.launchIdempotencyKey,
      globalActiveAfter: this.globalActive,
      parentActiveAfter: this.activeByParent.get(reservation.parentTaskId) ?? 0,
      replayed,
    };
  }

  private isDescendantOf(reservation: ActiveReservation, parentTaskId: string): boolean {
    if (reservation.parentTaskId === parentTaskId) return true;
    let current = reservation.parentTaskId;
    const seen = new Set<string>();
    while (!seen.has(current)) {
      seen.add(current);
      const ancestor = [...this.reservations.values()].find(
        (candidate) => !candidate.released && candidate.childTaskId === current,
      );
      if (!ancestor) return false;
      if (ancestor.parentTaskId === parentTaskId) return true;
      current = ancestor.parentTaskId;
    }
    return false;
  }
}
