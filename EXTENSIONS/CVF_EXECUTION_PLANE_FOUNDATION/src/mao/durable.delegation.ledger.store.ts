// CVF BRIGADE-MAO-R1 - Durable Delegation Ledger Store
//
// File-backed reserve/settle/abort-cascade transactions. Persistence and
// lock primitives live in durable.delegation.ledger.persistence.ts; this
// facade owns replay, coordinator composition, and the public store/port.
// The rejected force-unlock designs (`forceUnlockAbandonedLedger`, then
// `offlineForceUnlockAbandonedLedger`) remain removed from runtime code.
//
// MANUAL RECOVERY: after independently proving every writer has stopped, an
// operator may delete the affected `<ledger-snapshot-file>.lock` with OS
// tooling. Runtime code never force-unlocks or steals a stale lock.
//
// Canonical semantics and review history:
// docs/reference/multi_agent_orchestration/CVF_MAO_ATOMIC_DELEGATION_LIFECYCLE_COMPOSITION_STANDARD.md
// docs/reviews/CVF_BRIGADE_EARTR_LOCAL_RECONCILIATION_AND_ABSORPTION_CLOSURE_2026-08-29.md

import { mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";

import {
  MaoAtomicDelegationLifecycleCoordinator,
  type MaoAtomicDelegationPolicy,
  type MaoDelegationAbortCascadeReceipt,
  type MaoDelegationJoinPolicy,
  type MaoDelegationReservationReceipt,
  type MaoDelegationReservationRequest,
  type MaoDelegationReservationResult,
  type MaoDelegationSettlementIdentity,
  type MaoDelegationSettlementOutcome,
  type MaoDelegationSettlementResult,
} from "./atomic.delegation.lifecycle.coordinator";

import { acquireLock, atomicWriteJson, describeError, exclusiveCreateJson, isPersistedEntryShape, isPersistedPolicyShape, readSnapshotFile, releaseLock } from "./durable.delegation.ledger.persistence";
export { MAO_DELEGATION_LOCK_STALE_AFTER_MS, acquireLock, readLockFileContent, releaseLock, writeLockFileContentForTest } from "./durable.delegation.ledger.persistence";
export type { LockAcquireFailureReason, LockAcquireResult, LockFileContent, LockReleaseResult } from "./durable.delegation.ledger.persistence";

// --- Async durable-delegation port (requirements 1-3) ---

/**
 * Narrow async port MaoOperationalWorkerLauncher depends on. Any durable (or
 * durable-equivalent) implementation satisfying this shape can be injected;
 * MaoFileDelegationLedgerStore is the only current implementation. Declared
 * structurally, not as an abstract base class, so the launcher's dependency
 * direction stays on this interface rather than the concrete file-backed
 * store.
 */
export interface MaoDurableDelegationPort {
  reserveDurable(
    ledgerId: string,
    request: MaoDelegationReservationRequest,
  ): Promise<
    | { ok: true; result: MaoDelegationReservationResult; snapshot: MaoDelegationLedgerSnapshot }
    | MaoDelegationLedgerStoreFailure
  >;
  /**
   * `expectedIdentity` is REQUIRED (reviewer RETURN_FOR_REWORK R5,
   * requirement 1): every runtime consumer of this port must state which
   * launch attempt it believes it is settling, verified against the
   * reservation's own durably persisted identity BEFORE any settlement is
   * applied. A mismatch returns `IDENTITY_MISMATCH` and leaves capacity
   * reserved. There is no way to call this port method without supplying an
   * identity to check - the R4 design made this optional, which let two
   * launcher call sites (inline settlement, and reconcileDelegation's
   * terminal-state path) settle without ever verifying anything. The
   * coordinator's own lower-level `settle` method still accepts an optional
   * identity, reserved for ledger replay re-applying an already-verified
   * persisted entry - but this PORT boundary, the one runtime consumers
   * actually call, requires it unconditionally.
   */
  settleDurable(
    ledgerId: string,
    reservationKey: string,
    outcome: MaoDelegationSettlementOutcome,
    expectedIdentity: MaoDelegationSettlementIdentity,
  ): Promise<
    | { ok: true; result: MaoDelegationSettlementResult; snapshot: MaoDelegationLedgerSnapshot }
    | MaoDelegationLedgerStoreFailure
  >;
  abortCascadeDurable(
    ledgerId: string,
    parentTaskId: string,
  ): Promise<
    | { ok: true; receipt: MaoDelegationAbortCascadeReceipt; snapshot: MaoDelegationLedgerSnapshot }
    | MaoDelegationLedgerStoreFailure
  >;
  /**
   * Read-only recovery query: is this reservationKey durably reserved but
   * not yet durably settled? Used by the launcher's recover-and-reconcile
   * path (requirement 4) to detect a durable run that reached a terminal
   * task state while its delegation reservation is still open.
   */
  isReservationOpen(
    ledgerId: string,
    reservationKey: string,
  ): Promise<{ ok: true; open: boolean } | MaoDelegationLedgerStoreFailure>;
  /**
   * Read-only lookup of a reservation's own durably bound identity, without
   * settling it (requirement 2). Callers that need to settle on behalf of a
   * specific task but only hold a `reservationKey` from an external
   * argument - never one they themselves just reserved - MUST resolve this
   * first, verify it actually names the task they intend to recover, and
   * only then pass it as `expectedIdentity` to `settleDurable`. Returns
   * `identity: null` for an unknown/never-reserved key.
   */
  getReservationIdentity(
    ledgerId: string,
    reservationKey: string,
  ): Promise<{ ok: true; identity: MaoDelegationSettlementIdentity | null } | MaoDelegationLedgerStoreFailure>;
}

// --- Types ---

export const MAO_DELEGATION_LEDGER_SNAPSHOT_SCHEMA_VERSION = "mao-delegation-ledger-snapshot.v3";

export type MaoDelegationLedgerOperation = "RESERVE" | "SETTLE" | "ABORT_CASCADE";

/**
 * One durable, ordered log entry. Only the request/outcome that produced a
 * successful state transition is persisted; a call that fails validation
 * (e.g. GLOBAL_CAPACITY_EXHAUSTED) changes no counter and is not logged,
 * mirroring the in-memory coordinator's own "failed reservation changes no
 * counter" invariant (I-1).
 */
export interface MaoDelegationLedgerEntry {
  sequence: number;
  operation: MaoDelegationLedgerOperation;
  taskGraphId: string;
  parentTaskId: string;
  childTaskId: string | null;
  reservationKey: string | null;
  depth: number | null;
  authorityHash: string | null;
  invocationBudgetCeiling: number | null;
  joinPolicy: MaoDelegationJoinPolicy | null;
  outcome: MaoDelegationSettlementOutcome | null;
  /** True exactly on the entry whose settlement fired the parent's one continuation wake (requirement 7). */
  wakeParent: boolean | null;
  /**
   * The launch attempt identity that requested this reservation, durably
   * bound at the reservation boundary alongside `childTaskId` and
   * `reservationKey` (schema v3, requirement 1). Always non-null on a
   * `RESERVE` entry; carried through on the matching `SETTLE`/cascade-SETTLE
   * entries for audit purposes but not required there (a settlement's
   * identity is verified against its own RESERVE entry, not re-asserted).
   */
  launchIdempotencyKey: string | null;
  recordedAt: string;
}

export interface MaoDelegationLedgerSnapshot {
  schemaVersion: string;
  policy: MaoAtomicDelegationPolicy;
  entries: readonly MaoDelegationLedgerEntry[];
}

export type MaoDelegationLedgerStoreFailureReason =
  | "LEDGER_ALREADY_EXISTS"
  | "LEDGER_NOT_FOUND"
  | "INVALID_SNAPSHOT_JSON"
  | "SNAPSHOT_SCHEMA_MISMATCH"
  | "POLICY_MISMATCH"
  | "REPLAY_REJECTED"
  | "CONCURRENT_WRITE_LOST_RACE"
  | "LOCK_HELD_PAST_STALE_THRESHOLD"
  | "MISSING_IDENTITY"
  | "IO_FAILURE";

export interface MaoDelegationLedgerStoreFailure {
  ok: false;
  reason: MaoDelegationLedgerStoreFailureReason;
  detail: string;
}

export interface MaoDelegationLedgerCreateSuccess {
  ok: true;
  snapshot: MaoDelegationLedgerSnapshot;
}

export interface MaoDelegationLedgerReplaySuccess {
  ok: true;
  coordinator: MaoAtomicDelegationLifecycleCoordinator;
  entries: readonly MaoDelegationLedgerEntry[];
}

function failure(reason: MaoDelegationLedgerStoreFailureReason, detail: string): MaoDelegationLedgerStoreFailure {
  return { ok: false, reason, detail };
}

/** Deterministic, path-safe file identity for a delegation ledger ID. */
function snapshotFileNameFor(ledgerId: string): string {
  const digest = createHash("sha256").update(ledgerId, "utf8").digest("hex");
  return `delegation-${digest}.json`;
}

/**
 * Deterministic lockfile path for one (rootDirectory, ledgerId) pair.
 * Exported only so deterministic tests can exercise `acquireLock` /
 * `releaseLock` directly against the exact path this store's own
 * `withCas` uses, without depending on the class's private path-building
 * logic. Not a second lock-path convention - it is the same one
 * `lockPathFor` computes internally.
 */
export function delegationLockFilePathFor(rootDirectory: string, ledgerId: string): string {
  return join(rootDirectory, `${snapshotFileNameFor(ledgerId)}.lock`);
}

/** Bounded retry count for acquiring the per-ledger lockfile before failing closed. */
/** Base backoff between lock-acquire retries, in milliseconds (grows, capped, per attempt - see acquireLock). */
/** Ceiling on the per-attempt backoff delay so retries stay frequent even after many attempts. */
/**
 * A lockfile older than this is presumed abandoned by a crashed holder
 * (this store never intentionally holds the lock across an await boundary
 * other than its own read-modify-write body) and a new acquirer may steal
 * it rather than waiting forever. Exported so deterministic tests of the
 * stale-takeover path can compute a guaranteed-stale `acquiredAtMs` without
 * duplicating or guessing this threshold.
 */

/**
 * Durable, replayable, file-backed log of delegation coordinator operations
 * for one ledger identity (typically one task-graph run). Replay
 * reconstructs an `MaoAtomicDelegationLifecycleCoordinator` by re-invoking
 * `reserve` / `settle` / `abortCascade` in persisted order against a fresh
 * in-memory coordinator, so the in-memory engine remains the single owner of
 * reservation/settlement semantics; this store only makes its operation
 * history crash-durable, replayable, and safe under concurrent writers
 * (requirements 5, 6).
 *
 * Two independent concurrency guards apply to every write path
 * (reserve/settle/abortCascade):
 *
 * 1. In-process serialization: all calls against the same `ledgerId` from
 *    this store instance are chained onto one promise queue, so
 *    `Promise.all([store.reserve(...), store.reserve(...)])` against the
 *    same ledger never interleaves two read-modify-write cycles.
 * 2. Cross-instance filesystem mutex: a per-ledger lockfile
 *    (`<snapshot>.json.lock`) is exclusively created (OS-level `O_EXCL`,
 *    atomic) before the load-replay-mutate-write cycle begins and released
 *    only after the write commits, guarded by an opaque per-acquisition
 *    ownership token (see `acquireLock`/`releaseLock`) so a stale-lock
 *    takeover by one holder can never be undone by a different holder's
 *    late release. This is what makes two SEPARATE store instances
 *    (simulating two processes) safe against the same file: the second
 *    blocks on the lockfile rather than racing a read-modify-write against
 *    the first.
 */
export class MaoFileDelegationLedgerStore implements MaoDurableDelegationPort {
  private readonly rootDirectory: string;
  private readonly writeQueueByLedgerId = new Map<string, Promise<unknown>>();

  constructor(rootDirectory: string) {
    if (typeof rootDirectory !== "string" || rootDirectory.trim().length === 0) {
      throw new Error("MaoFileDelegationLedgerStore: rootDirectory must be a non-empty string");
    }
    this.rootDirectory = rootDirectory;
  }

  private snapshotPathFor(ledgerId: string): string {
    return join(this.rootDirectory, snapshotFileNameFor(ledgerId));
  }

  private lockPathFor(ledgerId: string): string {
    return `${this.snapshotPathFor(ledgerId)}.lock`;
  }

  /**
   * Chain `task` onto this ledgerId's in-process queue so no two
   * transactions against the same ledger from this store instance ever
   * overlap. The queue itself never rejects (a failed task's rejection is
   * caught and does not poison later queued tasks), and each caller still
   * receives its own task's real result/rejection.
   */
  private enqueue<T>(ledgerId: string, task: () => Promise<T>): Promise<T> {
    const previous = this.writeQueueByLedgerId.get(ledgerId) ?? Promise.resolve();
    const runAfterPrevious = previous.then(task, task);
    this.writeQueueByLedgerId.set(
      ledgerId,
      runAfterPrevious.then(
        () => undefined,
        () => undefined,
      ),
    );
    return runAfterPrevious;
  }

  /** Create a new, empty durable ledger bound to one fixed policy. Never overwrites an existing ledger. */
  async createLedger(
    ledgerId: string,
    policy: MaoAtomicDelegationPolicy,
  ): Promise<MaoDelegationLedgerCreateSuccess | MaoDelegationLedgerStoreFailure> {
    return this.enqueue(ledgerId, async () => {
      const targetPath = this.snapshotPathFor(ledgerId);

      try {
        await mkdir(this.rootDirectory, { recursive: true });
      } catch (error) {
        return failure("IO_FAILURE", `failed to create root directory: ${describeError(error)}`);
      }

      const existing = await readSnapshotFile(targetPath);
      if (existing.status === "present") {
        return failure("LEDGER_ALREADY_EXISTS", "a delegation ledger snapshot already exists for this ledgerId");
      }
      if (existing.status === "io_error") {
        return failure("IO_FAILURE", `failed to probe existing delegation ledger: ${existing.detail}`);
      }

      const snapshot: MaoDelegationLedgerSnapshot = {
        schemaVersion: MAO_DELEGATION_LEDGER_SNAPSHOT_SCHEMA_VERSION,
        policy: { ...policy },
        entries: [],
      };

      // First-writer-wins: use the exclusive-create flag so a second
      // concurrent createLedger for the same ledgerId cannot silently
      // overwrite the first.
      const writeResult = await exclusiveCreateJson(targetPath, snapshot);
      if (!writeResult.ok) {
        if (writeResult.reason === "EXISTS") {
          return failure("LEDGER_ALREADY_EXISTS", "a delegation ledger snapshot already exists for this ledgerId");
        }
        return failure("IO_FAILURE", `failed to write initial delegation ledger snapshot: ${writeResult.detail}`);
      }

      return { ok: true, snapshot };
    });
  }

  /**
   * Pure read-plus-replay: load every persisted entry and rebuild a fresh
   * coordinator by re-issuing each recorded operation in order. This is the
   * crash/restart recovery path: it never trusts in-memory state and never
   * writes. Not queued (read-only), so it may run concurrently with queued
   * writes; it always reads whatever is currently committed on disk.
   */
  async replay(ledgerId: string): Promise<MaoDelegationLedgerReplaySuccess | MaoDelegationLedgerStoreFailure> {
    const loaded = await this.loadSnapshot(ledgerId);
    if (!loaded.ok) return loaded;
    return this.replayFromSnapshot(loaded.snapshot);
  }

  private replayFromSnapshot(
    snapshot: MaoDelegationLedgerSnapshot,
  ): MaoDelegationLedgerReplaySuccess | MaoDelegationLedgerStoreFailure {
    const coordinator = new MaoAtomicDelegationLifecycleCoordinator(snapshot.policy);
    for (const entry of snapshot.entries) {
      const replayResult = applyEntryToCoordinator(coordinator, entry);
      if (!replayResult.ok) {
        return failure(
          "REPLAY_REJECTED",
          `replay of persisted delegation entry at sequence ${entry.sequence} failed: ${replayResult.detail}`,
        );
      }
    }
    return { ok: true, coordinator, entries: snapshot.entries };
  }

  /** Read-only recovery query used by the launcher's reconcile path (requirement 4). */
  async isReservationOpen(
    ledgerId: string,
    reservationKey: string,
  ): Promise<{ ok: true; open: boolean } | MaoDelegationLedgerStoreFailure> {
    const loaded = await this.loadSnapshot(ledgerId);
    if (!loaded.ok) return loaded;
    const reserved = loaded.snapshot.entries.some(
      (entry) => entry.operation === "RESERVE" && entry.reservationKey === reservationKey,
    );
    const settled = loaded.snapshot.entries.some(
      (entry) => entry.operation === "SETTLE" && entry.reservationKey === reservationKey,
    );
    return { ok: true, open: reserved && !settled };
  }

  /**
   * Read-only lookup of a reservation's durably bound identity
   * (requirement 2). Never settles; a caller must resolve this, verify it,
   * and only then pass it to `settleDurable`.
   */
  async getReservationIdentity(
    ledgerId: string,
    reservationKey: string,
  ): Promise<{ ok: true; identity: MaoDelegationSettlementIdentity | null } | MaoDelegationLedgerStoreFailure> {
    const loaded = await this.loadSnapshot(ledgerId);
    if (!loaded.ok) return loaded;
    const reservationEntry = loaded.snapshot.entries.find(
      (entry) => entry.operation === "RESERVE" && entry.reservationKey === reservationKey,
    );
    if (!reservationEntry || reservationEntry.launchIdempotencyKey === null || reservationEntry.childTaskId === null) {
      return { ok: true, identity: null };
    }
    return {
      ok: true,
      identity: { launchIdempotencyKey: reservationEntry.launchIdempotencyKey, childTaskId: reservationEntry.childTaskId },
    };
  }

  /** Async port method name for `reserve` (requirement 1-3 launcher wiring). */
  async reserveDurable(
    ledgerId: string,
    request: MaoDelegationReservationRequest,
  ): Promise<
    | { ok: true; result: MaoDelegationReservationResult; snapshot: MaoDelegationLedgerSnapshot }
    | MaoDelegationLedgerStoreFailure
  > {
    return this.reserve(ledgerId, request);
  }

  /**
   * Async port method name for `settle` (requirement 1-3 launcher wiring).
   * `expectedIdentity` is REQUIRED here (requirement 1) - this is the port
   * boundary every runtime consumer calls through, and it must never be
   * possible to settle without stating and verifying an identity. As of
   * R6, `settle` (below) enforces the identical requirement itself (both
   * the public store method and the underlying coordinator's public
   * `settle` now require identity unconditionally), so this method's own
   * runtime guard is now defense-in-depth duplicating that check one layer
   * earlier, not the only thing enforcing it. Ledger replay's internal
   * re-application of already-persisted, already-verified entries
   * (`applyEntryToCoordinator` below) passes the persisted entry's own
   * identity straight through the coordinator's `settle`, and is not a
   * runtime consumer of this port either.
   */
  async settleDurable(
    ledgerId: string,
    reservationKey: string,
    outcome: MaoDelegationSettlementOutcome,
    expectedIdentity: MaoDelegationSettlementIdentity,
  ): Promise<
    | { ok: true; result: MaoDelegationSettlementResult; snapshot: MaoDelegationLedgerSnapshot }
    | MaoDelegationLedgerStoreFailure
  > {
    // Defense-in-depth runtime guard (requirement 1): TypeScript makes
    // `expectedIdentity` a compile-time-required argument, but a caller
    // that bypasses the type system (`as any`, plain JS, a stale compiled
    // build) could still invoke this with `undefined`. Fail closed with a
    // typed result rather than silently falling through to the
    // coordinator's own optional-identity path, which would settle
    // unverified.
    if (
      expectedIdentity === undefined ||
      expectedIdentity === null ||
      typeof expectedIdentity.launchIdempotencyKey !== "string" ||
      typeof expectedIdentity.childTaskId !== "string"
    ) {
      return failure(
        "MISSING_IDENTITY",
        `settleDurable requires expectedIdentity (launchIdempotencyKey and childTaskId) for reservation ${reservationKey}; none was supplied`,
      );
    }
    return this.settle(ledgerId, reservationKey, outcome, expectedIdentity);
  }

  /** Async port method name for `abortCascade` (requirement 1-3 launcher wiring). */
  async abortCascadeDurable(
    ledgerId: string,
    parentTaskId: string,
  ): Promise<
    | { ok: true; receipt: MaoDelegationAbortCascadeReceipt; snapshot: MaoDelegationLedgerSnapshot }
    | MaoDelegationLedgerStoreFailure
  > {
    return this.abortCascade(ledgerId, parentTaskId);
  }

  /**
   * Reserve durably: replay to a fresh coordinator, attempt the reservation
   * against it, and persist the new entry only when the reservation
   * succeeded and was not itself a replay of an existing reservationKey.
   * A rejected reservation is returned as-is and changes no durable state,
   * matching the in-memory coordinator's own "failed reservation changes no
   * counter" invariant. Serialized per-ledgerId (requirement 5) and
   * lock-guarded against a second store instance racing the same file
   * (requirement 6).
   */
  async reserve(
    ledgerId: string,
    request: MaoDelegationReservationRequest,
  ): Promise<
    | { ok: true; result: MaoDelegationReservationResult; snapshot: MaoDelegationLedgerSnapshot }
    | MaoDelegationLedgerStoreFailure
  > {
    return this.enqueue(ledgerId, () =>
      this.withCas(ledgerId, (loadedSnapshot, coordinator) => {
        const alreadyReserved = loadedSnapshot.entries.some(
          (entry) => entry.operation === "RESERVE" && entry.reservationKey === request.reservationKey,
        );

        const result = coordinator.reserve(request);
        if (!result.ok || alreadyReserved) {
          return { newEntries: [], response: { ok: true, result, snapshot: loadedSnapshot } };
        }

        const entry: MaoDelegationLedgerEntry = {
          sequence: loadedSnapshot.entries.length + 1,
          operation: "RESERVE",
          taskGraphId: request.taskGraphId,
          parentTaskId: request.parentTaskId,
          childTaskId: request.childTaskId,
          reservationKey: request.reservationKey,
          depth: request.depth,
          authorityHash: request.authorityHash,
          invocationBudgetCeiling: request.invocationBudgetCeiling,
          joinPolicy: request.joinPolicy ?? "ALL_CHILDREN",
          outcome: null,
          wakeParent: null,
          launchIdempotencyKey: request.launchIdempotencyKey,
          recordedAt: new Date().toISOString(),
        };

        return {
          newEntries: [entry],
          response: (newSnapshot: MaoDelegationLedgerSnapshot) => ({ ok: true, result, snapshot: newSnapshot }),
        };
      }),
    );
  }

  /**
   * Settle durably: replay, attempt settlement, and persist the SETTLE entry
   * only on a first-time (non-replayed) settlement. Serialized and
   * lock-guarded identically to `reserve`.
   *
   * `expectedIdentity` is REQUIRED (reviewer RETURN_FOR_REWORK R6,
   * requirement 1): this is a PUBLIC method on this class, reachable by any
   * holder of a store instance independent of the narrower
   * `MaoDurableDelegationPort` interface, so it must carry the same
   * guarantee `settleDurable` does rather than relying on the port boundary
   * alone to enforce it. It is verified against the reservation's OWN
   * durably persisted `launchIdempotencyKey` and `childTaskId` before any
   * state change: a mismatch returns `IDENTITY_MISMATCH` and writes nothing,
   * leaving the reservation's capacity untouched. This is what stops
   * recovery-by-arbitrary-caller-assertion - a wrong, stale, or unrelated
   * caller-supplied identity can never settle a reservation it did not
   * actually create. There is no overload or default that settles without
   * one; `settleDurable` (the port method) and this method now share the
   * identical unconditional requirement.
   */
  async settle(
    ledgerId: string,
    reservationKey: string,
    outcome: MaoDelegationSettlementOutcome,
    expectedIdentity: MaoDelegationSettlementIdentity,
  ): Promise<
    | { ok: true; result: MaoDelegationSettlementResult; snapshot: MaoDelegationLedgerSnapshot }
    | MaoDelegationLedgerStoreFailure
  > {
    // Defense-in-depth runtime guard, identical to `settleDurable`'s (a
    // type-bypassing caller could still invoke this with `undefined`).
    if (
      expectedIdentity === undefined ||
      expectedIdentity === null ||
      typeof expectedIdentity.launchIdempotencyKey !== "string" ||
      typeof expectedIdentity.childTaskId !== "string"
    ) {
      return failure(
        "MISSING_IDENTITY",
        `settle requires expectedIdentity (launchIdempotencyKey and childTaskId) for reservation ${reservationKey}; none was supplied`,
      );
    }
    return this.enqueue(ledgerId, () =>
      this.withCas(ledgerId, (loadedSnapshot, coordinator) => {
        const alreadySettled = loadedSnapshot.entries.some(
          (entry) => entry.operation === "SETTLE" && entry.reservationKey === reservationKey,
        );

        const result = coordinator.settle(reservationKey, outcome, expectedIdentity);
        if (!result.ok || alreadySettled) {
          return { newEntries: [], response: { ok: true, result, snapshot: loadedSnapshot } };
        }

        const reservationEntry = loadedSnapshot.entries.find(
          (entry) => entry.operation === "RESERVE" && entry.reservationKey === reservationKey,
        );

        const entry: MaoDelegationLedgerEntry = {
          sequence: loadedSnapshot.entries.length + 1,
          operation: "SETTLE",
          taskGraphId: reservationEntry?.taskGraphId ?? result.receipt.reservationKey,
          parentTaskId: result.receipt.parentTaskId,
          childTaskId: result.receipt.childTaskId,
          reservationKey,
          depth: reservationEntry?.depth ?? null,
          authorityHash: reservationEntry?.authorityHash ?? null,
          invocationBudgetCeiling: reservationEntry?.invocationBudgetCeiling ?? null,
          joinPolicy: result.receipt.joinPolicy,
          outcome,
          wakeParent: result.receipt.wakeParent,
          launchIdempotencyKey: reservationEntry?.launchIdempotencyKey ?? null,
          recordedAt: new Date().toISOString(),
        };

        return {
          newEntries: [entry],
          response: (newSnapshot: MaoDelegationLedgerSnapshot) => ({ ok: true, result, snapshot: newSnapshot }),
        };
      }),
    );
  }

  /**
   * Abort-cascade durably: replay, run the cascade against the fresh
   * coordinator (which itself closes admission before enumerating and
   * settles descendants leaf-first), then persist exactly one ABORT_CASCADE
   * boundary entry plus the settlement entries the cascade produced.
   * Serialized and lock-guarded identically to `reserve`/`settle`.
   */
  async abortCascade(
    ledgerId: string,
    parentTaskId: string,
  ): Promise<
    | { ok: true; receipt: MaoDelegationAbortCascadeReceipt; snapshot: MaoDelegationLedgerSnapshot }
    | MaoDelegationLedgerStoreFailure
  > {
    return this.enqueue(ledgerId, () =>
      this.withCas(ledgerId, (loadedSnapshot, coordinator) => {
        const alreadyClosed = coordinator.snapshot().closedParents.includes(parentTaskId);
        const receipt = coordinator.abortCascade(parentTaskId);

        if (alreadyClosed) {
          return { newEntries: [], response: { ok: true, receipt, snapshot: loadedSnapshot } };
        }

        const newEntries: MaoDelegationLedgerEntry[] = [];
        let nextSequence = loadedSnapshot.entries.length + 1;

        newEntries.push({
          sequence: nextSequence,
          operation: "ABORT_CASCADE",
          taskGraphId: findTaskGraphIdFor(loadedSnapshot.entries, parentTaskId),
          parentTaskId,
          childTaskId: null,
          reservationKey: null,
          depth: null,
          authorityHash: null,
          invocationBudgetCeiling: null,
          joinPolicy: null,
          outcome: null,
          wakeParent: null,
          launchIdempotencyKey: null,
          recordedAt: new Date().toISOString(),
        });
        nextSequence += 1;

        for (const completion of receipt.completions) {
          const reservationEntry = loadedSnapshot.entries.find(
            (entry) => entry.operation === "RESERVE" && entry.reservationKey === completion.reservationKey,
          );
          newEntries.push({
            sequence: nextSequence,
            operation: "SETTLE",
            taskGraphId: reservationEntry?.taskGraphId ?? findTaskGraphIdFor(loadedSnapshot.entries, parentTaskId),
            parentTaskId: completion.parentTaskId,
            childTaskId: completion.childTaskId,
            reservationKey: completion.reservationKey,
            depth: reservationEntry?.depth ?? null,
            authorityHash: reservationEntry?.authorityHash ?? null,
            invocationBudgetCeiling: reservationEntry?.invocationBudgetCeiling ?? null,
            joinPolicy: completion.joinPolicy,
            outcome: completion.outcome,
            wakeParent: completion.wakeParent,
            launchIdempotencyKey: reservationEntry?.launchIdempotencyKey ?? null,
            recordedAt: new Date().toISOString(),
          });
          nextSequence += 1;
        }

        return {
          newEntries,
          response: (newSnapshot: MaoDelegationLedgerSnapshot) => ({ ok: true, receipt, snapshot: newSnapshot }),
        };
      }),
    );
  }

  /**
   * Shared locked transaction body for reserve/settle/abortCascade. Acquires
   * this ledger's lockfile (see `acquireLock`) for the duration of one
   * load-replay-mutate-write cycle, so no other holder (in this process or
   * any other) can be mid-transaction against the same file concurrently.
   * `mutate` receives the freshly loaded snapshot and a coordinator replayed
   * from it, and returns either a no-op response (nothing to persist) or a
   * set of new entries plus a response factory that receives the final
   * persisted snapshot. Because the lock is held for the whole cycle, the
   * write itself needs no separate version check - by the time this method
   * reads the snapshot, no concurrent writer can commit a change before this
   * transaction's own write, so there is nothing to retry against.
   */
  private async withCas<TResponse>(
    ledgerId: string,
    mutate: (
      snapshot: MaoDelegationLedgerSnapshot,
      coordinator: MaoAtomicDelegationLifecycleCoordinator,
    ) =>
      | { newEntries: []; response: TResponse }
      | { newEntries: MaoDelegationLedgerEntry[]; response: (newSnapshot: MaoDelegationLedgerSnapshot) => TResponse },
  ): Promise<TResponse | MaoDelegationLedgerStoreFailure> {
    const lockPath = this.lockPathFor(ledgerId);
    const targetPath = this.snapshotPathFor(ledgerId);

    const lockResult = await acquireLock(lockPath);
    if (!lockResult.ok) {
      const mappedReason = lockResult.reason === "LOCK_HELD_PAST_STALE_THRESHOLD" ? "LOCK_HELD_PAST_STALE_THRESHOLD" : "CONCURRENT_WRITE_LOST_RACE";
      return failure(mappedReason, lockResult.detail);
    }
    const ownerToken = lockResult.token;

    try {
      const loaded = await this.loadSnapshot(ledgerId);
      if (!loaded.ok) return loaded;

      const replayed = this.replayFromSnapshot(loaded.snapshot);
      if (!replayed.ok) return replayed;

      const outcome = mutate(loaded.snapshot, replayed.coordinator);
      if (outcome.newEntries.length === 0) {
        return outcome.response as TResponse;
      }

      const newSnapshot: MaoDelegationLedgerSnapshot = {
        schemaVersion: MAO_DELEGATION_LEDGER_SNAPSHOT_SCHEMA_VERSION,
        policy: loaded.snapshot.policy,
        entries: [...loaded.snapshot.entries, ...outcome.newEntries],
      };

      // The lock held above is the sole concurrency guard for this write: no
      // other holder of this same lockfile can be mid-transaction while we
      // hold it, on the same machine/filesystem this store targets, so a
      // plain atomic temp-write-then-rename is safe here without a separate
      // version check.
      const writeResult = await atomicWriteJson(targetPath, newSnapshot);
      if (!writeResult.ok) {
        return failure("IO_FAILURE", writeResult.detail);
      }
      return (outcome.response as (newSnapshot: MaoDelegationLedgerSnapshot) => TResponse)(newSnapshot);
    } finally {
      await releaseLock(lockPath, ownerToken);
    }
  }

  private async loadSnapshot(
    ledgerId: string,
  ): Promise<{ ok: true; snapshot: MaoDelegationLedgerSnapshot } | MaoDelegationLedgerStoreFailure> {
    const targetPath = this.snapshotPathFor(ledgerId);
    const read = await readSnapshotFile(targetPath);

    if (read.status === "absent") {
      return failure("LEDGER_NOT_FOUND", "no delegation ledger snapshot exists for this ledgerId");
    }
    if (read.status === "io_error") {
      return failure("IO_FAILURE", `failed to read delegation ledger snapshot: ${read.detail}`);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(read.raw);
    } catch {
      return failure("INVALID_SNAPSHOT_JSON", "persisted delegation ledger snapshot is not valid JSON");
    }

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("schemaVersion" in parsed) ||
      !("policy" in parsed) ||
      !("entries" in parsed)
    ) {
      return failure("INVALID_SNAPSHOT_JSON", "persisted delegation ledger snapshot is missing required fields");
    }

    const candidate = parsed as { schemaVersion: unknown; policy: unknown; entries: unknown };
    if (candidate.schemaVersion !== MAO_DELEGATION_LEDGER_SNAPSHOT_SCHEMA_VERSION) {
      return failure(
        "SNAPSHOT_SCHEMA_MISMATCH",
        `persisted schemaVersion does not match expected ${MAO_DELEGATION_LEDGER_SNAPSHOT_SCHEMA_VERSION}`,
      );
    }
    if (!isPersistedPolicyShape(candidate.policy)) {
      return failure("INVALID_SNAPSHOT_JSON", "persisted policy is missing required fields");
    }
    if (!Array.isArray(candidate.entries)) {
      return failure("INVALID_SNAPSHOT_JSON", "persisted entries field is not an array");
    }
    for (let i = 0; i < candidate.entries.length; i += 1) {
      const item = candidate.entries[i];
      if (!isPersistedEntryShape(item)) {
        return failure("INVALID_SNAPSHOT_JSON", `persisted delegation entry at index ${i} is missing required fields`);
      }
      if (item.sequence !== i + 1) {
        return failure(
          "REPLAY_REJECTED",
          `expected contiguous sequence starting at 1; entry at index ${i} has sequence ${String(item.sequence)}`,
        );
      }
    }

    return {
      ok: true,
      snapshot: {
        schemaVersion: candidate.schemaVersion,
        policy: candidate.policy,
        entries: candidate.entries as MaoDelegationLedgerEntry[],
      },
    };
  }
}

/**
 * Re-issue exactly one persisted entry against a coordinator being rebuilt
 * by replay. Every op here is expected to succeed because it already
 * succeeded once against an equivalent starting state; a rejection here
 * means the persisted log itself is inconsistent with the fixed policy.
 */
function applyEntryToCoordinator(
  coordinator: MaoAtomicDelegationLifecycleCoordinator,
  entry: MaoDelegationLedgerEntry,
): { ok: true } | { ok: false; detail: string } {
  if (entry.operation === "RESERVE") {
    if (
      entry.childTaskId === null ||
      entry.reservationKey === null ||
      entry.depth === null ||
      entry.authorityHash === null ||
      entry.invocationBudgetCeiling === null ||
      entry.launchIdempotencyKey === null
    ) {
      return { ok: false, detail: `RESERVE entry at sequence ${entry.sequence} is missing required fields` };
    }
    const result = coordinator.reserve({
      taskGraphId: entry.taskGraphId,
      parentTaskId: entry.parentTaskId,
      childTaskId: entry.childTaskId,
      depth: entry.depth,
      reservationKey: entry.reservationKey,
      authorityHash: entry.authorityHash,
      invocationBudgetCeiling: entry.invocationBudgetCeiling,
      launchIdempotencyKey: entry.launchIdempotencyKey,
      joinPolicy: entry.joinPolicy ?? "ALL_CHILDREN",
    });
    if (!result.ok) {
      return { ok: false, detail: `replayed RESERVE was rejected: ${result.reason} - ${result.detail}` };
    }
    return { ok: true };
  }

  if (entry.operation === "SETTLE") {
    // Requirement 1 (reviewer RETURN_FOR_REWORK R6): the coordinator's
    // `settle` now REQUIRES an identity - there is no unverified public
    // overload left to fall back on for replay. This is not a weakening:
    // the persisted entry itself already carries the exact
    // launchIdempotencyKey/childTaskId the ORIGINAL settlement was verified
    // against (schema v3; populated on every SETTLE entry this store
    // writes, including cascade-produced ones - see `settle`/`abortCascade`
    // above), so replay passes that same already-verified identity straight
    // through rather than trusting the reservationKey/outcome pair alone.
    if (
      entry.reservationKey === null ||
      entry.outcome === null ||
      entry.launchIdempotencyKey === null ||
      entry.childTaskId === null
    ) {
      return { ok: false, detail: `SETTLE entry at sequence ${entry.sequence} is missing required fields` };
    }
    const result = coordinator.settle(entry.reservationKey, entry.outcome, {
      launchIdempotencyKey: entry.launchIdempotencyKey,
      childTaskId: entry.childTaskId,
    });
    if (!result.ok) {
      return { ok: false, detail: `replayed SETTLE was rejected: ${result.reason} - ${result.detail}` };
    }
    return { ok: true };
  }

  // ABORT_CASCADE: the coordinator itself performs close-admission-before-
  // enumeration and leaf-first settlement; the entries that follow this one
  // in the log are the individually-persisted SETTLE results of that same
  // cascade, so replaying this op only needs to close admission here.
  coordinator.abortCascade(entry.parentTaskId);
  return { ok: true };
}

function findTaskGraphIdFor(entries: readonly MaoDelegationLedgerEntry[], parentTaskId: string): string {
  const owning = entries.find((entry) => entry.parentTaskId === parentTaskId || entry.childTaskId === parentTaskId);
  return owning?.taskGraphId ?? "";
}
