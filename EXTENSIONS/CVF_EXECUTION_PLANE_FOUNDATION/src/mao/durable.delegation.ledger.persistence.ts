// Filesystem persistence and lock ownership helpers for the durable delegation ledger.
// Split from durable.delegation.ledger.store.ts under GC-023; behavior and
// public exports remain owned by the store module's facade.

import { readFile, rename, unlink, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";

import type { MaoAtomicDelegationPolicy } from "./atomic.delegation.lifecycle.coordinator";
import type { MaoDelegationLedgerEntry } from "./durable.delegation.ledger.store";

const MAX_LOCK_ACQUIRE_ATTEMPTS = 200;
const LOCK_ACQUIRE_RETRY_BASE_DELAY_MS = 2;
const LOCK_ACQUIRE_RETRY_MAX_DELAY_MS = 25;
export const MAO_DELEGATION_LOCK_STALE_AFTER_MS = 10_000;
const LOCK_STALE_AFTER_MS = MAO_DELEGATION_LOCK_STALE_AFTER_MS;

export type SnapshotReadResult =
  | { status: "present"; raw: string }
  | { status: "absent" }
  | { status: "io_error"; detail: string };

export async function readSnapshotFile(targetPath: string): Promise<SnapshotReadResult> {
  try {
    const raw = await readFile(targetPath, "utf8");
    return { status: "present", raw };
  } catch (error) {
    if (isNodeErrnoException(error) && error.code === "ENOENT") {
      return { status: "absent" };
    }
    return { status: "io_error", detail: describeError(error) };
  }
}

export type LockAcquireFailureReason = "HELD_BY_OTHER" | "LOCK_HELD_PAST_STALE_THRESHOLD" | "IO_FAILURE";
export type LockAcquireResult = { ok: true; token: string } | { ok: false; reason: LockAcquireFailureReason; detail: string };
export type LockReleaseResult = { ok: true } | { ok: false; detail: string };

export interface LockFileContent {
  token: string;
  acquiredAtMs: number;
}

function isLockFileContent(value: unknown): value is LockFileContent {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { token?: unknown }).token === "string" &&
    Number.isFinite((value as { acquiredAtMs?: unknown }).acquiredAtMs)
  );
}

/**
 * Read the current lockfile's raw `{ token, acquiredAtMs }` content, or
 * `null` if absent/unreadable. Exported for deterministic ownership tests
 * (to seed a stale lockfile with a known token, and to assert which token
 * ultimately holds the lock); production code only ever needs the token
 * comparison already encapsulated in `acquireLock`/`releaseLock`.
 */
export async function readLockFileContent(lockPath: string): Promise<LockFileContent | null> {
  const read = await readSnapshotFile(lockPath);
  if (read.status !== "present") return null;
  try {
    const parsed = JSON.parse(read.raw) as unknown;
    return isLockFileContent(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Directly write a lockfile with the given content, bypassing the
 * exclusive-create race. Exported only for deterministic test setup (to
 * seed a specific, already-stale lock as if a prior holder had crashed);
 * production code always acquires through `acquireLock`.
 */
export async function writeLockFileContentForTest(lockPath: string, content: LockFileContent): Promise<void> {
  await writeFile(lockPath, JSON.stringify(content), "utf8");
}

/**
 * Acquire a real cross-process/cross-instance mutex for one ledgerId by
 * exclusively creating `lockPath` (Node's `wx` flag maps to the OS-level
 * `O_EXCL` create primitive - the one genuinely atomic single-syscall
 * primitive available here: it can never observe a stale state and act on
 * it, because there is no separate observe step). A caller that loses the
 * race retries with linear backoff.
 *
 * This function performs NO automatic stale-lock takeover (see the module
 * header's Rework R3 note for why: any takeover requires a
 * read-then-conditionally-delete sequence, which cannot be made atomic with
 * Node's fs API and was the exact defect the reviewer required removed).
 * Once a lock has been held longer than
 * `MAO_DELEGATION_LOCK_STALE_AFTER_MS`, every subsequent `acquireLock` call
 * against it fails closed with `LOCK_HELD_PAST_STALE_THRESHOLD` instead of
 * retrying or stealing, PERMANENTLY (this module offers no programmatic
 * recovery function at all - see the module header's Rework R5 note for why
 * and for the manual, human-supervised recovery procedure).
 *
 * The lockfile content is `{ token, acquiredAtMs }`. `token` remains useful
 * as a defensive, non-load-bearing sanity check in `releaseLock` (a caller
 * bug guard), and `acquiredAtMs` is what `LOCK_HELD_PAST_STALE_THRESHOLD`
 * is computed from.
 */
export async function acquireLock(lockPath: string): Promise<LockAcquireResult> {
  for (let attempt = 0; attempt < MAX_LOCK_ACQUIRE_ATTEMPTS; attempt += 1) {
    const token = randomBytes(16).toString("hex");
    const content: LockFileContent = { token, acquiredAtMs: Date.now() };
    try {
      await writeFile(lockPath, JSON.stringify(content), { encoding: "utf8", flag: "wx" });
      return { ok: true, token };
    } catch (error) {
      if (!isNodeErrnoException(error) || error.code !== "EEXIST") {
        return { ok: false, reason: "IO_FAILURE", detail: `failed to create lockfile: ${describeError(error)}` };
      }
      const holderIsStale = await isLockStale(lockPath);
      if (holderIsStale) {
        return {
          ok: false,
          reason: "LOCK_HELD_PAST_STALE_THRESHOLD",
          detail: `delegation ledger lock at ${lockPath} has been held past the ${MAO_DELEGATION_LOCK_STALE_AFTER_MS}ms stale threshold; automatic takeover is disabled and this library exposes no programmatic recovery - after independently confirming no process still holds it, an operator must manually delete this lockfile from the filesystem`,
        };
      }
      const delayMs = Math.min(LOCK_ACQUIRE_RETRY_MAX_DELAY_MS, LOCK_ACQUIRE_RETRY_BASE_DELAY_MS + attempt);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return {
    ok: false,
    reason: "HELD_BY_OTHER",
    detail: `failed to acquire delegation ledger lock after ${MAX_LOCK_ACQUIRE_ATTEMPTS} attempts (held by another writer)`,
  };
}

/** True if the on-disk lock is present and older than the stale threshold. Read-only; performs no action. */
async function isLockStale(lockPath: string): Promise<boolean> {
  const content = await readLockFileContent(lockPath);
  if (content === null) return false;
  return Date.now() - content.acquiredAtMs > LOCK_STALE_AFTER_MS;
}

/**
 * Release `lockPath`. The only legitimate caller of this function for a
 * given lockfile is the single acquisition that itself won the
 * exclusive-create in `acquireLock` for that path: with automatic stale
 * takeover removed, no second logical holder can ever exist for the same
 * lockfile while the first is still active, so there is no cross-holder
 * race left for a token check to defend against. The token comparison below
 * is kept only as a defensive, best-effort sanity assertion against a
 * caller bug (e.g. releasing with the wrong token by mistake); a mismatch
 * or an already-absent file are both treated as a no-op rather than a hard
 * failure, since this function's contract is "this lock is no longer held
 * by me" and both cases satisfy that trivially.
 */
export async function releaseLock(lockPath: string, ownerToken: string): Promise<LockReleaseResult> {
  const content = await readLockFileContent(lockPath);
  if (content === null) {
    return { ok: true };
  }
  if (content.token !== ownerToken) {
    return { ok: true };
  }
  try {
    await unlink(lockPath);
    return { ok: true };
  } catch (error) {
    if (isNodeErrnoException(error) && error.code === "ENOENT") {
      return { ok: true };
    }
    return { ok: false, detail: `failed to release lockfile: ${describeError(error)}` };
  }
}

type ExclusiveCreateResult =
  | { ok: true }
  | { ok: false; reason: "EXISTS"; detail: string }
  | { ok: false; reason: "IO_FAILURE"; detail: string };

/** Atomically create a file only if it does not already exist, using the OS-level exclusive-create flag. */
export async function exclusiveCreateJson(targetPath: string, value: unknown): Promise<ExclusiveCreateResult> {
  try {
    await writeFile(targetPath, JSON.stringify(value, null, 2), { encoding: "utf8", flag: "wx" });
    return { ok: true };
  } catch (error) {
    if (isNodeErrnoException(error) && error.code === "EEXIST") {
      return { ok: false, reason: "EXISTS", detail: "target file already exists" };
    }
    return { ok: false, reason: "IO_FAILURE", detail: describeError(error) };
  }
}

type AtomicWriteResult = { ok: true } | { ok: false; detail: string };

/** Bounded retry count for a rename that fails with a transient sharing violation (Windows only). */
const MAX_RENAME_RETRY_ATTEMPTS = 5;

function isTransientRenameError(error: unknown): boolean {
  // Windows NTFS can reject a rename-over-existing-file with EPERM or EBUSY
  // when another process briefly holds a read handle on the target - e.g. a
  // concurrent readSnapshotFile() call from a reader, or another writer's
  // own temp-file cleanup. The per-ledger lockfile mutex already serializes
  // every WRITER against this path, but a concurrent reader (replay(),
  // isReservationOpen()) is intentionally not lock-guarded, so this
  // transient-rename retry remains the correct defense for that read/write
  // overlap. POSIX rename is atomic and does not have this failure mode, so
  // this retry is a no-op there (the error codes below simply never occur).
  return isNodeErrnoException(error) && (error.code === "EPERM" || error.code === "EBUSY");
}

export async function atomicWriteJson(targetPath: string, value: unknown): Promise<AtomicWriteResult> {
  const tempSuffix = randomBytes(8).toString("hex");
  const tempPath = `${targetPath}.tmp-${tempSuffix}`;

  try {
    await writeFile(tempPath, JSON.stringify(value, null, 2), "utf8");
  } catch (error) {
    await bestEffortCleanup(tempPath);
    return { ok: false, detail: `temp write failed: ${describeError(error)}` };
  }

  for (let attempt = 0; attempt < MAX_RENAME_RETRY_ATTEMPTS; attempt += 1) {
    try {
      await rename(tempPath, targetPath);
      return { ok: true };
    } catch (error) {
      if (isTransientRenameError(error) && attempt < MAX_RENAME_RETRY_ATTEMPTS - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1 + attempt * 2));
        continue;
      }
      await bestEffortCleanup(tempPath);
      return { ok: false, detail: `atomic rename failed: ${describeError(error)}` };
    }
  }

  await bestEffortCleanup(tempPath);
  return { ok: false, detail: `atomic rename failed after ${MAX_RENAME_RETRY_ATTEMPTS} attempts` };
}

async function bestEffortCleanup(tempPath: string): Promise<void> {
  try {
    await unlink(tempPath);
  } catch {
    // Best-effort only: cleanup failure must never mask the original error.
  }
}

function isNodeErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isPersistedPolicyShape(value: unknown): value is MaoAtomicDelegationPolicy {
  if (!isRecord(value)) return false;
  return (
    Number.isInteger(value.globalMaxChildren) &&
    Number.isInteger(value.parentMaxChildren) &&
    Number.isInteger(value.maxDepth)
  );
}

export function isPersistedEntryShape(value: unknown): value is MaoDelegationLedgerEntry {
  if (!isRecord(value)) return false;
  return (
    Number.isInteger(value.sequence) &&
    typeof value.operation === "string" &&
    typeof value.taskGraphId === "string" &&
    typeof value.parentTaskId === "string" &&
    (value.childTaskId === null || typeof value.childTaskId === "string") &&
    (value.reservationKey === null || typeof value.reservationKey === "string") &&
    (value.depth === null || Number.isInteger(value.depth)) &&
    (value.authorityHash === null || typeof value.authorityHash === "string") &&
    (value.invocationBudgetCeiling === null || Number.isInteger(value.invocationBudgetCeiling)) &&
    (value.joinPolicy === null || typeof value.joinPolicy === "string") &&
    (value.outcome === null || typeof value.outcome === "string") &&
    (value.wakeParent === null || typeof value.wakeParent === "boolean") &&
    (value.launchIdempotencyKey === null || typeof value.launchIdempotencyKey === "string") &&
    typeof value.recordedAt === "string"
  );
}

export function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "unknown filesystem error";
}
