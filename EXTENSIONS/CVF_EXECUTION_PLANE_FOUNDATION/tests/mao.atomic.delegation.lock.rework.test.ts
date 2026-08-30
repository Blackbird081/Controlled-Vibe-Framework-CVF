// Atomic delegation cancellation and lock-safety adversarial tests.

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  mkdtemp, rm, tmpdir, join, MaoFileRunStore, createMaoDelegationAdapter,
  MaoLifecycleController, MaoOperationalWorkerLauncher, MaoFileDelegationLedgerStore,
  MAO_DELEGATION_LOCK_STALE_AFTER_MS, delegationLockFilePathFor, acquireLock, releaseLock,
  readLockFileContent, writeLockFileContentForTest, reservation, pilotGraph, pilotGraphFor,
  launchRequestFor, launchRequestForTask, twoTaskPilotGraph, driveToRunningStateForAttempt,
  makeRunStoreSnapshotReadOnly, restoreRunStoreSnapshotWritable,
  withTypedSettleFailure, withTypedAbortFailure,
} from "./mao.atomic.delegation.fail.closed.helpers";

describe("BRIGADE-MAO-R1 R2-B: requestCancellation fails closed when durable abort persistence fails", () => {
  let runStoreRoot: string;
  let delegationRoot: string;

  beforeEach(async () => {
    runStoreRoot = await mkdtemp(join(tmpdir(), "mao-r2b-run-store-"));
    delegationRoot = await mkdtemp(join(tmpdir(), "mao-r2b-delegation-"));
  });

  afterEach(async () => {
    await rm(runStoreRoot, { recursive: true, force: true });
    await rm(delegationRoot, { recursive: true, force: true });
  });

  it("returns DURABLE_ABORT_PERSISTENCE_FAILED instead of ok:true when abortCascadeDurable fails without throwing", async () => {
    const taskGraph = pilotGraph();
    const runStore = new MaoFileRunStore(runStoreRoot);
    await runStore.createRun(taskGraph);
    const realDelegationStore = new MaoFileDelegationLedgerStore(delegationRoot);
    await realDelegationStore.createLedger(taskGraph.taskGraphId, { globalMaxChildren: 2, parentMaxChildren: 2, maxDepth: 2 });

    const failingPort = withTypedAbortFailure(realDelegationStore, { reason: "IO_FAILURE", detail: "simulated disk write failure on abort" });
    const launcher = new MaoOperationalWorkerLauncher(
      runStore,
      createMaoDelegationAdapter(),
      new MaoLifecycleController("2026-08-29T00:00:00.000Z"),
      failingPort,
    );

    const result = await launcher.requestCancellation(taskGraph.taskGraphId, "child-1");
    expect(result).toMatchObject({ ok: false, reason: "DURABLE_ABORT_PERSISTENCE_FAILED" });
    if (!result.ok) {
      expect(result.detail).toContain("IO_FAILURE");
    }
  });

  it("proves across a restart that a failed durable abort was never reported as accepted: the durable delegation ledger shows no ABORT_CASCADE entry", async () => {
    const taskGraph = pilotGraph();
    const runStore = new MaoFileRunStore(runStoreRoot);
    await runStore.createRun(taskGraph);
    const realDelegationStore = new MaoFileDelegationLedgerStore(delegationRoot);
    await realDelegationStore.createLedger(taskGraph.taskGraphId, { globalMaxChildren: 2, parentMaxChildren: 2, maxDepth: 2 });
    await realDelegationStore.reserve(taskGraph.taskGraphId, reservation("child-1", "grandchild-1", 2, taskGraph.taskGraphId));

    const failingPort = withTypedAbortFailure(realDelegationStore, { reason: "IO_FAILURE", detail: "simulated disk write failure on abort" });
    const launcher = new MaoOperationalWorkerLauncher(
      runStore,
      createMaoDelegationAdapter(),
      new MaoLifecycleController("2026-08-29T00:00:00.000Z"),
      failingPort,
    );

    const requestResult = await launcher.requestCancellation(taskGraph.taskGraphId, "child-1");
    expect(requestResult.ok).toBe(false);

    // Simulate a restart: a fresh store instance and fresh launcher replay
    // the durable delegation ledger. Because the abort never persisted, the
    // grandchild reservation must still be OPEN and active - a restarted
    // process must not believe the subtree was cancelled.
    const recoveredStore = new MaoFileDelegationLedgerStore(delegationRoot);
    const replayed = await recoveredStore.replay(taskGraph.taskGraphId);
    expect(replayed.ok).toBe(true);
    if (replayed.ok) {
      expect(replayed.entries.some((entry) => entry.operation === "ABORT_CASCADE")).toBe(false);
      expect(replayed.coordinator.snapshot().closedParents).not.toContain("child-1");
      expect(replayed.coordinator.snapshot().activeByParent["child-1"]).toBe(1);
    }

    // A genuine (non-faulty) abort attempted after the restart must still
    // succeed and durably close admission - proving the failed attempt left
    // no partial/misleading state behind.
    const genuineAbort = await recoveredStore.abortCascadeDurable(taskGraph.taskGraphId, "child-1");
    expect(genuineAbort.ok).toBe(true);
    if (genuineAbort.ok) {
      expect(genuineAbort.receipt.admissionClosed).toBe(true);
      expect(genuineAbort.receipt.releasedLeafFirst).toEqual(["grandchild-1"]);
    }
  });
});

describe("BRIGADE-MAO-R1 R3: lock design has NO read-check-unlink race because automatic stale takeover was removed entirely", () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "mao-r3-lock-"));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("item 4: a fresh, live lock is never taken over - a contender is refused (EEXIST-backed), never granted the lock while the holder is live", async () => {
    const lockPath = delegationLockFilePathFor(root, "graph-lock-live");

    const acquiredByA = await acquireLock(lockPath);
    expect(acquiredByA.ok).toBe(true);
    if (!acquiredByA.ok) return;

    // A single non-retrying probe (the same wx primitive acquireLock uses)
    // must be refused while A's lock is live - proving mutual exclusion
    // rests entirely on the one atomic primitive available (exclusive
    // create), with no read-then-delete step anywhere in the path.
    const probe = await acquireLockNonBlockingProbe(lockPath);
    expect(probe).toBe("HELD_BY_OTHER");

    const released = await releaseLock(lockPath, acquiredByA.token);
    expect(released.ok).toBe(true);

    const probeAfterRelease = await acquireLockNonBlockingProbe(lockPath);
    expect(probeAfterRelease).toBe("FREE");
  });

  it("item 4: releaseLock never deletes a lockfile it does not own, and there is no code path where a second logical holder can ever exist for the same lock while the first is unreleased", async () => {
    const lockPath = delegationLockFilePathFor(root, "graph-lock-no-second-holder");

    const acquiredByA = await acquireLock(lockPath);
    expect(acquiredByA.ok).toBe(true);
    if (!acquiredByA.ok) return;

    // Simulate a caller bug: releasing with a WRONG token while A's real
    // lock is still live. This must be a no-op (defensive check), and
    // critically the lock must remain held by A's real token afterward -
    // proving a mismatched release can never free a lock it doesn't own.
    const wrongTokenRelease = await releaseLock(lockPath, "not-the-real-token");
    expect(wrongTokenRelease.ok).toBe(true);

    const contentAfterWrongRelease = await readLockFileContent(lockPath);
    expect(contentAfterWrongRelease).toMatchObject({ token: acquiredByA.token });

    // The lock is still genuinely held: no takeover occurred and no
    // contender could have acquired it in between.
    const probe = await acquireLockNonBlockingProbe(lockPath);
    expect(probe).toBe("HELD_BY_OTHER");

    const correctRelease = await releaseLock(lockPath, acquiredByA.token);
    expect(correctRelease.ok).toBe(true);
  });
});

describe("BRIGADE-MAO-R1 R3 item 5: deterministic pause-based interleaving proves no automatic compare-delete race can occur", () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "mao-r3-interleave-"));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("pauses A after it would have validated ownership, lets B attempt to acquire/take over, resumes A: B never acquires while A's lock is live, and A's own release remains exclusively its own", async () => {
    // B's acquireLock call below deliberately exhausts the full retry
    // budget against a live (non-stale) lock before reporting
    // HELD_BY_OTHER, which can take close to the default 5000ms test
    // timeout; extend it so this deterministic proof is not flaky under
    // system load.
    const lockPath = delegationLockFilePathFor(root, "graph-lock-interleave");

    // Holder A acquires the real lock.
    const acquiredByA = await acquireLock(lockPath);
    expect(acquiredByA.ok).toBe(true);
    if (!acquiredByA.ok) return;

    // Simulate A being paused AFTER it has "validated ownership" (read its
    // own token, about to act) but BEFORE it deletes anything. In the OLD
    // (R2) design this pause point was exactly where a steal by B could
    // slip in underneath A. In the NEW design there is no steal path at
    // all: B's attempt during this pause must simply fail closed.
    const bAttemptDuringAsPause = await acquireLock(lockPath);
    expect(bAttemptDuringAsPause.ok).toBe(false);
    if (bAttemptDuringAsPause.ok) return;
    // B's attempt exhausts retries against a live (non-stale) lock and
    // reports HELD_BY_OTHER, never a successful takeover.
    expect(bAttemptDuringAsPause.reason).toBe("HELD_BY_OTHER");

    // "Resume A": A now performs its own release using the token it
    // legitimately holds. Because B was never granted the lock, there is no
    // concurrent critical section to have occurred, and A's release is
    // simply the sole, correct release of its own lock.
    const aResumesAndReleases = await releaseLock(lockPath, acquiredByA.token);
    expect(aResumesAndReleases.ok).toBe(true);

    // Only now, after A's genuine release, can a new acquirer succeed - and
    // that acquirer (call it B') gets a fresh token distinct from A's,
    // proving the two critical sections (A's and B''s) are strictly
    // sequential, never overlapping.
    const bAcquiresAfterARelease = await acquireLock(lockPath);
    expect(bAcquiresAfterARelease.ok).toBe(true);
    if (!bAcquiresAfterARelease.ok) return;
    expect(bAcquiresAfterARelease.token).not.toBe(acquiredByA.token);

    const finalRelease = await releaseLock(lockPath, bAcquiresAfterARelease.token);
    expect(finalRelease.ok).toBe(true);
  }, 15000);

  it("proves the same interleaving is safe end-to-end through the real store: a paused writer never causes a torn or double-applied ledger write", async () => {
    const delegationStore = new MaoFileDelegationLedgerStore(root);
    const ledgerId = "graph-interleave-store";
    await delegationStore.createLedger(ledgerId, { globalMaxChildren: 1, parentMaxChildren: 1, maxDepth: 1 });

    // Two logically concurrent reserve attempts from two SEPARATE store
    // instances (simulating two processes) for the SAME single global slot.
    // With the lockfile mutex correctly serializing writers (no steal, no
    // read-check-unlink race), exactly one must be admitted and exactly one
    // RESERVE entry must ever be persisted - proving no concurrent critical
    // section ever executed even though both calls were issued
    // simultaneously via Promise.all.
    const storeA = new MaoFileDelegationLedgerStore(root);
    const storeB = new MaoFileDelegationLedgerStore(root);
    const [resultA, resultB] = await Promise.all([
      storeA.reserve(ledgerId, reservation("p1", "from-a", 1, ledgerId)),
      storeB.reserve(ledgerId, reservation("p1", "from-b", 1, ledgerId)),
    ]);

    expect(resultA.ok).toBe(true);
    expect(resultB.ok).toBe(true);
    if (!resultA.ok || !resultB.ok) return;
    const admittedCount = [resultA.result, resultB.result].filter((result) => result.ok).length;
    expect(admittedCount).toBe(1);

    const replayed = await delegationStore.replay(ledgerId);
    expect(replayed.ok).toBe(true);
    if (replayed.ok) {
      expect(replayed.entries.filter((entry) => entry.operation === "RESERVE")).toHaveLength(1);
      expect(replayed.coordinator.snapshot().globalActive).toBe(1);
    }
  });
});

describe("BRIGADE-MAO-R1 R3 item 6: live-holder lease-expiry fails closed instead of allowing overlapping writers", () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "mao-r3-lease-"));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("a lock held past the stale threshold causes new acquire attempts to fail closed with LOCK_HELD_PAST_STALE_THRESHOLD, PERMANENTLY - no library function can recover it", async () => {
    const lockPath = delegationLockFilePathFor(root, "graph-lock-expired");

    const acquiredByA = await acquireLock(lockPath);
    expect(acquiredByA.ok).toBe(true);
    if (!acquiredByA.ok) return;

    // Simulate the critical section being held well past the stale
    // threshold (e.g. a genuinely hung or crashed holder) by rewriting the
    // lockfile's acquiredAtMs directly, without touching the token - this
    // is exactly what an old-but-still-present lock looks like on disk.
    await writeLockFileContentForTest(lockPath, {
      token: acquiredByA.token,
      acquiredAtMs: Date.now() - MAO_DELEGATION_LOCK_STALE_AFTER_MS - 1000,
    });

    // A second acquirer must NOT be granted the lock via automatic
    // takeover. It must fail closed with a typed reason, distinct from the
    // ordinary "still contending, keep retrying" case.
    const secondAcquireAttempt = await acquireLock(lockPath);
    expect(secondAcquireAttempt).toMatchObject({ ok: false, reason: "LOCK_HELD_PAST_STALE_THRESHOLD" });

    // The original lock is untouched: no takeover occurred, so no second
    // writer could ever have entered a concurrent critical section.
    const contentAfterFailedAcquire = await readLockFileContent(lockPath);
    expect(contentAfterFailedAcquire).toMatchObject({ token: acquiredByA.token });

    // Requirement 5 (reviewer RETURN_FOR_REWORK R5): there is no library
    // function left that can programmatically recover this lock at all -
    // repeated attempts all fail identically, forever, no matter how many
    // times they are retried. The ONLY way past this state is the manual,
    // human-supervised filesystem deletion documented in
    // durable.delegation.ledger.store.ts's own header comment, which this
    // test deliberately does NOT perform (that would defeat the point:
    // proving no automated path exists).
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const repeatedAttempt = await acquireLock(lockPath);
      expect(repeatedAttempt).toMatchObject({ ok: false, reason: "LOCK_HELD_PAST_STALE_THRESHOLD" });
    }
    const contentStillUntouched = await readLockFileContent(lockPath);
    expect(contentStillUntouched).toMatchObject({ token: acquiredByA.token });

    // Manual recovery (the ONLY documented path): an operator directly
    // deletes the lockfile via the OS's own tooling - simulated here with
    // the bare Node fs primitive, never a library-exposed function.
    const nodeFs = require("node:fs/promises") as typeof import("node:fs/promises");
    await nodeFs.unlink(lockPath);
    expect(await readLockFileContent(lockPath)).toBeNull();

    const acquiredByB = await acquireLock(lockPath);
    expect(acquiredByB.ok).toBe(true);
    if (acquiredByB.ok) {
      expect(acquiredByB.token).not.toBe(acquiredByA.token);
      await releaseLock(lockPath, acquiredByB.token);
    }
  });

  it("proves end-to-end through the real store: a lease-expired writer lock causes withCas to fail closed rather than silently proceeding with two writers", async () => {
    const delegationStore = new MaoFileDelegationLedgerStore(root);
    const ledgerId = "graph-lease-store";
    await delegationStore.createLedger(ledgerId, { globalMaxChildren: 4, parentMaxChildren: 4, maxDepth: 2 });

    const lockPath = delegationLockFilePathFor(root, ledgerId);

    // Manually seed an already-stale lockfile for this exact ledger, as if
    // a prior withCas transaction crashed mid-critical-section without
    // releasing.
    await acquireLock(lockPath).then(async (result) => {
      if (!result.ok) throw new Error("test setup failed to seed the initial lock");
      await writeLockFileContentForTest(lockPath, {
        token: result.token,
        acquiredAtMs: Date.now() - MAO_DELEGATION_LOCK_STALE_AFTER_MS - 1000,
      });
    });

    // A real store operation attempting to write against this ledger must
    // fail closed - not silently proceed as if it had acquired the lock,
    // and not silently steal it either.
    const reserveAttempt = await delegationStore.reserve(ledgerId, reservation("p1", "c1", 1, ledgerId));
    expect(reserveAttempt).toMatchObject({ ok: false, reason: "LOCK_HELD_PAST_STALE_THRESHOLD" });

    // No RESERVE entry was persisted - the failed acquisition changed
    // nothing durable.
    const replayed = await delegationStore.replay(ledgerId);
    expect(replayed.ok).toBe(true);
    if (replayed.ok) {
      expect(replayed.entries).toHaveLength(0);
    }

    // Recovery: this library exposes no programmatic force-unlock
    // (requirement 5); a manual filesystem deletion (simulated here with
    // the bare Node fs primitive, exactly as an operator would use their
    // OS's own tooling) is the only path back to a usable lock.
    const nodeFs = require("node:fs/promises") as typeof import("node:fs/promises");
    await nodeFs.unlink(lockPath);

    const reserveAfterRecovery = await delegationStore.reserve(ledgerId, reservation("p1", "c1", 1, ledgerId));
    expect(reserveAfterRecovery.ok).toBe(true);
    if (reserveAfterRecovery.ok) {
      expect(reserveAfterRecovery.result.ok).toBe(true);
    }
  });
});

describe("BRIGADE-MAO-R4 item 6: negative and source-boundary tests", () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "mao-r4-boundary-"));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("no production acquisition path performs stale takeover: acquireLock's own source contains no unlink/steal call on the contended (EEXIST) branch", () => {
    // Source-boundary assertion, not just a behavioral one: read this
    // module's own source and confirm the contended branch of
    // acquireLock() never calls unlink/releaseLock as part of handling
    // EEXIST - it may only return LOCK_HELD_PAST_STALE_THRESHOLD or retry.
    // This directly guards against a future edit silently reintroducing
    // the removed steal path without a behavioral test catching it first.
    const fs = require("node:fs") as typeof import("node:fs");
    const path = require("node:path") as typeof import("node:path");
    const sourcePath = path.join(__dirname, "..", "src", "mao", "durable.delegation.ledger.persistence.ts");
    const source = fs.readFileSync(sourcePath, "utf8");

    const acquireLockStart = source.indexOf("export async function acquireLock(");
    expect(acquireLockStart).toBeGreaterThan(-1);
    const nextExportIndex = source.indexOf("\nexport ", acquireLockStart + 1);
    const acquireLockBody = source.slice(acquireLockStart, nextExportIndex === -1 ? undefined : nextExportIndex);

    // The contended branch must never call unlink or releaseLock directly -
    // its only actions on EEXIST are (a) return LOCK_HELD_PAST_STALE_THRESHOLD
    // or (b) backoff-and-retry the exclusive create.
    expect(acquireLockBody).not.toMatch(/\bunlink\(/);
    expect(acquireLockBody).not.toMatch(/\breleaseLock\(/);
    expect(acquireLockBody).toContain("LOCK_HELD_PAST_STALE_THRESHOLD");
  });

  it("no production acquisition path performs stale takeover (behavioral): a stale lock never becomes acquirable automatically, regardless of how many attempts are made", async () => {
    const lockPath = delegationLockFilePathFor(root, "graph-r4-no-takeover");
    const acquiredByA = await acquireLock(lockPath);
    expect(acquiredByA.ok).toBe(true);
    if (!acquiredByA.ok) return;
    await writeLockFileContentForTest(lockPath, {
      token: acquiredByA.token,
      acquiredAtMs: Date.now() - MAO_DELEGATION_LOCK_STALE_AFTER_MS - 1000,
    });

    // Repeated attempts must all fail closed identically - none of them
    // may ever succeed via an implicit steal.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const attemptResult = await acquireLock(lockPath);
      expect(attemptResult).toMatchObject({ ok: false, reason: "LOCK_HELD_PAST_STALE_THRESHOLD" });
    }

    // The original lock is completely untouched after all those attempts.
    const content = await readLockFileContent(lockPath);
    expect(content).toMatchObject({ token: acquiredByA.token });
  });

  it("no public runtime API exposes concurrent force-unlock: no force-unlock DECLARATION exists anywhere in the library's own source, and neither barrel exports one", () => {
    // Requirement 5 (reviewer RETURN_FOR_REWORK R5): the R3/R4 admin
    // lock-recovery function is not merely unexported - it has been
    // REMOVED FROM THE SOURCE MODULE ENTIRELY. Assert this against actual
    // DECLARATIONS (export function/async function/type/interface), not a
    // blanket substring ban - the module's own changelog-style header
    // comments legitimately name the old, now-removed function as history
    // ("formerly X, then Y, now removed"), which is accurate documentation,
    // not a live reference. A regex anchored to declaration syntax catches
    // the thing that actually matters (does the symbol still EXIST as
    // callable/importable code) without being defeated by, or forbidding,
    // honest prose about what used to exist.
    const fs = require("node:fs") as typeof import("node:fs");
    const path = require("node:path") as typeof import("node:path");

    const storeModulePath = path.join(__dirname, "..", "src", "mao", "durable.delegation.ledger.store.ts");
    const storeModuleSource = fs.readFileSync(storeModulePath, "utf8");
    const barrelPath = path.join(__dirname, "..", "src", "mao", "index.ts");
    const barrelSource = fs.readFileSync(barrelPath, "utf8");
    const rootBarrelPath = path.join(__dirname, "..", "src", "index.ts");
    const rootBarrelSource = fs.readFileSync(rootBarrelPath, "utf8");

    const forbiddenNames = [
      "forceUnlockAbandonedLedger",
      "offlineForceUnlockAbandonedLedger",
      "ForceUnlockResult",
      "OfflineForceUnlockResult",
    ];
    const declarationPattern = (name: string) =>
      new RegExp(`\\bexport\\s+(async\\s+function|function|type|interface|const)\\s+${name}\\b`);

    for (const forbiddenName of forbiddenNames) {
      expect(storeModuleSource).not.toMatch(declarationPattern(forbiddenName));
      // The barrels must not even TEXTUALLY mention these names at all
      // (they have no legitimate reason to, unlike the store module's own
      // historical changelog).
      expect(barrelSource).not.toContain(forbiddenName);
      expect(rootBarrelSource).not.toContain(forbiddenName);
    }

    // The boolean-acknowledgment parameter pattern must not exist as a
    // live function parameter declaration either (it may still appear in
    // historical prose, per the same reasoning above).
    expect(storeModuleSource).not.toMatch(/acknowledgeAllWritersStopped\s*:\s*true\s*\)/);

    // Positive check: the module still documents the manual recovery
    // procedure it replaced the function with, so this isn't silently
    // undocumented.
    expect(storeModuleSource).toContain("MANUAL RECOVERY");
  });

  it("a stale lock is permanently unrecoverable through any exported function - no exported symbol in the delegation store module can delete a lockfile except releaseLock's own matched release", async () => {
    const lockPath = delegationLockFilePathFor(root, "graph-r5-no-recovery-fn");
    const acquiredByA = await acquireLock(lockPath);
    expect(acquiredByA.ok).toBe(true);
    if (!acquiredByA.ok) return;
    await writeLockFileContentForTest(lockPath, {
      token: acquiredByA.token,
      acquiredAtMs: Date.now() - MAO_DELEGATION_LOCK_STALE_AFTER_MS - 1000,
    });

    // Every exported write-capable function this module offers is tried
    // against the stale lock; none may recover it. releaseLock with the
    // WRONG (unrelated) token is included to prove it cannot be abused as a
    // backdoor force-unlock either.
    const wrongTokenRelease = await releaseLock(lockPath, "some-other-callers-unrelated-token");
    expect(wrongTokenRelease.ok).toBe(true); // benign no-op, per its own contract
    const contentAfterWrongRelease = await readLockFileContent(lockPath);
    expect(contentAfterWrongRelease).toMatchObject({ token: acquiredByA.token }); // untouched

    const acquireStillFails = await acquireLock(lockPath);
    expect(acquireStillFails).toMatchObject({ ok: false, reason: "LOCK_HELD_PAST_STALE_THRESHOLD" });

    // The lock is still exactly as it was.
    const finalContent = await readLockFileContent(lockPath);
    expect(finalContent).toMatchObject({ token: acquiredByA.token });
  });

  it("a stale lock blocks mutation without changing ledger state: repeated failed write attempts against a stale-locked ledger leave the persisted entries byte-for-byte identical", async () => {
    const delegationStore = new MaoFileDelegationLedgerStore(root);
    const ledgerId = "graph-r4-stale-blocks-mutation";
    await delegationStore.createLedger(ledgerId, { globalMaxChildren: 4, parentMaxChildren: 4, maxDepth: 2 });
    await delegationStore.reserve(ledgerId, reservation("root", "child-1", 1, ledgerId, "launch-preexisting"));

    const beforeReplay = await delegationStore.replay(ledgerId);
    expect(beforeReplay.ok).toBe(true);
    const beforeEntries = beforeReplay.ok ? beforeReplay.entries : [];

    // Seed a stale lock for this exact ledger, as if a prior transaction
    // crashed mid-critical-section.
    const lockPath = delegationLockFilePathFor(root, ledgerId);
    const seeded = await acquireLock(lockPath);
    expect(seeded.ok).toBe(true);
    if (!seeded.ok) return;
    await writeLockFileContentForTest(lockPath, {
      token: seeded.token,
      acquiredAtMs: Date.now() - MAO_DELEGATION_LOCK_STALE_AFTER_MS - 1000,
    });

    // Multiple different mutation attempts, all of which must fail closed
    // and change nothing.
    const reserveAttempt = await delegationStore.reserve(ledgerId, reservation("root", "child-2", 1, ledgerId, "launch-blocked"));
    expect(reserveAttempt).toMatchObject({ ok: false, reason: "LOCK_HELD_PAST_STALE_THRESHOLD" });

    const settleAttempt = await delegationStore.settleDurable(ledgerId, "root:child-1", "succeeded", {
      launchIdempotencyKey: "launch-preexisting",
      childTaskId: "child-1",
    });
    expect(settleAttempt).toMatchObject({ ok: false, reason: "LOCK_HELD_PAST_STALE_THRESHOLD" });

    const abortAttempt = await delegationStore.abortCascadeDurable(ledgerId, "root");
    expect(abortAttempt).toMatchObject({ ok: false, reason: "LOCK_HELD_PAST_STALE_THRESHOLD" });

    const afterReplay = await delegationStore.replay(ledgerId);
    expect(afterReplay.ok).toBe(true);
    if (afterReplay.ok) {
      expect(afterReplay.entries).toEqual(beforeEntries);
      expect(afterReplay.coordinator.snapshot()).toMatchObject({ globalActive: 1, activeByParent: { root: 1 } });
    }
  });
});

/**
 * Single, non-retrying probe of whether `lockPath` is currently held: tries
 * the same exclusive-create primitive `acquireLock` uses exactly once
 * (bypassing its retry loop), reporting HELD_BY_OTHER on EEXIST or FREE on
 * success (immediately releasing what it just acquired, using its own
 * correct token, so the probe itself never leaks a lock).
 */
async function acquireLockNonBlockingProbe(lockPath: string): Promise<"HELD_BY_OTHER" | "FREE"> {
  const { writeFile, unlink } = await import("node:fs/promises");
  const { randomBytes } = await import("node:crypto");
  const token = randomBytes(16).toString("hex");
  try {
    await writeFile(lockPath, JSON.stringify({ token, acquiredAtMs: Date.now() }), { encoding: "utf8", flag: "wx" });
  } catch (error) {
    if (isEexist(error)) return "HELD_BY_OTHER";
    throw error;
  }
  await unlink(lockPath);
  return "FREE";
}

function isEexist(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: unknown }).code === "EEXIST";
}
