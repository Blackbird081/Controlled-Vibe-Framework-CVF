// Atomic delegation cross-task and cross-attempt identity adversarial tests.

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

describe("BRIGADE-MAO-R1 R5: cross-task terminal recovery cannot settle a different task's reservation", () => {
  let runStoreRoot: string;
  let delegationRoot: string;

  beforeEach(async () => {
    runStoreRoot = await mkdtemp(join(tmpdir(), "mao-r5-cross-task-run-store-"));
    delegationRoot = await mkdtemp(join(tmpdir(), "mao-r5-cross-task-delegation-"));
  });

  afterEach(async () => {
    await rm(runStoreRoot, { recursive: true, force: true });
    await rm(delegationRoot, { recursive: true, force: true });
  });

  it("item 3: a durably-succeeded Task A cannot reconcile/settle Task B's still-open reservation", async () => {
    const taskGraph = twoTaskPilotGraph();
    const runStore = new MaoFileRunStore(runStoreRoot);
    await runStore.createRun(taskGraph);
    const delegationStore = new MaoFileDelegationLedgerStore(delegationRoot);
    await delegationStore.createLedger(taskGraph.taskGraphId, { globalMaxChildren: 4, parentMaxChildren: 4, maxDepth: 2 });

    const launcher = new MaoOperationalWorkerLauncher(
      runStore,
      createMaoDelegationAdapter(),
      new MaoLifecycleController("2026-08-29T03:00:00.000Z"),
      delegationStore,
    );

    // Task B is reserved FIRST, as a genuine sibling still in flight under
    // the same parent, BEFORE Task A settles. This matters: the coordinator
    // wakes a parent (closing it to further reservations, per requirement
    // 8) once its active-child count reaches zero, so Task B's reservation
    // must already be active when Task A settles, or Task A's own
    // settlement would (correctly) close "root" and this test would be
    // exercising parent-admission-closure instead of the intended
    // cross-settlement identity check.
    // Bound to the SAME authorityHash/budget the real graph carries (not the
    // `reservation()` helper's unrelated test defaults), since both
    // reservations share one ledger and the ledger binds its authorityHash
    // on first use.
    const taskBReserve = await delegationStore.reserveDurable(taskGraph.taskGraphId, {
      taskGraphId: taskGraph.taskGraphId,
      parentTaskId: "root",
      childTaskId: "task-b",
      depth: 1,
      reservationKey: "root:task-b",
      authorityHash: taskGraph.authorityEnvelope.authorityHash,
      invocationBudgetCeiling: taskGraph.authorityEnvelope.budget.maxInvocations,
      launchIdempotencyKey: "launch-task-b",
    });
    expect(taskBReserve.ok).toBe(true);
    const openBBeforeAttack = await delegationStore.isReservationOpen(taskGraph.taskGraphId, "root:task-b");
    expect(openBBeforeAttack).toMatchObject({ ok: true, open: true });

    // Task A genuinely, durably succeeds end-to-end through the real
    // launcher/adapter/run-store/delegation-store stack, with Task B still
    // open as its sibling.
    const taskAResult = await launcher.launch(
      launchRequestForTask(taskGraph, "task-a", "launch-task-a", "root:task-a"),
    );
    expect(taskAResult.ok).toBe(true);

    const replayBeforeAttack = await delegationStore.replay(taskGraph.taskGraphId);
    expect(replayBeforeAttack.ok).toBe(true);
    const settleCountBeforeAttack = replayBeforeAttack.ok
      ? replayBeforeAttack.entries.filter((entry) => entry.operation === "SETTLE").length
      : -1;

    // The adversarial call: Task A's own terminal state is used to try to
    // recover/settle Task B's reservationKey. This must fail closed (or
    // return a typed identityMismatch) rather than closing out Task B's
    // capacity using Task A's outcome.
    const attackerLauncher = new MaoOperationalWorkerLauncher(
      new MaoFileRunStore(runStoreRoot),
      createMaoDelegationAdapter(),
      new MaoLifecycleController("2026-08-29T03:30:00.000Z"),
      new MaoFileDelegationLedgerStore(delegationRoot),
    );
    const crossSettleAttempt = await attackerLauncher.reconcileDelegation(
      taskGraph.taskGraphId,
      "task-a",
      "root:task-b",
      "launch-task-a",
    );
    expect(crossSettleAttempt).toMatchObject({ ok: true, reconciled: false, identityMismatch: true });

    // Task B's reservation remains open, completely untouched.
    const openBAfterAttack = await delegationStore.isReservationOpen(taskGraph.taskGraphId, "root:task-b");
    expect(openBAfterAttack).toMatchObject({ ok: true, open: true });

    // No new SETTLE entry was written by the attack (only Task A's own
    // genuine SETTLE, from its real launch(), may exist).
    const replayAfterAttack = await delegationStore.replay(taskGraph.taskGraphId);
    expect(replayAfterAttack.ok).toBe(true);
    if (replayAfterAttack.ok) {
      expect(replayAfterAttack.entries.filter((entry) => entry.operation === "SETTLE")).toHaveLength(
        settleCountBeforeAttack,
      );
    }

    // Task B can still be legitimately settled afterwards with its own,
    // correct identity - the attack did not corrupt its recoverability.
    const legitimateSettleB = await delegationStore.settleDurable(taskGraph.taskGraphId, "root:task-b", "succeeded", {
      launchIdempotencyKey: "launch-task-b",
      childTaskId: "task-b",
    });
    expect(legitimateSettleB.ok).toBe(true);
    if (legitimateSettleB.ok) {
      expect(legitimateSettleB.result).toMatchObject({ ok: true, receipt: { released: true } });
    }
  });
});
describe("BRIGADE-MAO-R1 R6: same-task, cross-attempt terminal recovery cannot consume a different attempt's outcome", () => {
  let runStoreRoot: string;
  let delegationRoot: string;

  beforeEach(async () => {
    runStoreRoot = await mkdtemp(join(tmpdir(), "mao-r6-cross-attempt-run-store-"));
    delegationRoot = await mkdtemp(join(tmpdir(), "mao-r6-cross-attempt-delegation-"));
  });

  afterEach(async () => {
    await rm(runStoreRoot, { recursive: true, force: true });
    await rm(delegationRoot, { recursive: true, force: true });
  });

  it("item 3: reservation OLD (task-a/launch-old) is not consumed by terminal evidence produced by attempt NEW (task-a/launch-new)", async () => {
    const taskGraph = pilotGraphFor("task-a");
    const runStore = new MaoFileRunStore(runStoreRoot);
    await runStore.createRun(taskGraph);
    const delegationStore = new MaoFileDelegationLedgerStore(delegationRoot);
    await delegationStore.createLedger(taskGraph.taskGraphId, { globalMaxChildren: 4, parentMaxChildren: 4, maxDepth: 2 });

    // Reservation OLD: task-a's FIRST attempt reserves under its own
    // reservationKey and is deliberately left open (simulating a crash
    // before this attempt's own settlement, or an attempt that is still
    // believed in-flight by whatever created it).
    const oldReserve = await delegationStore.reserveDurable(taskGraph.taskGraphId, {
      taskGraphId: taskGraph.taskGraphId,
      parentTaskId: "root",
      childTaskId: "task-a",
      depth: 1,
      reservationKey: "root:task-a-old",
      authorityHash: taskGraph.authorityEnvelope.authorityHash,
      invocationBudgetCeiling: taskGraph.authorityEnvelope.budget.maxInvocations,
      launchIdempotencyKey: "launch-old",
    });
    expect(oldReserve.ok).toBe(true);
    const openOldBeforeRecovery = await delegationStore.isReservationOpen(taskGraph.taskGraphId, "root:task-a-old");
    expect(openOldBeforeRecovery).toMatchObject({ ok: true, open: true });

    // Terminal execution NEW: a SEPARATE, LATER launch attempt for the SAME
    // taskId (task-a) - a genuinely different reservationKey, a genuinely
    // different launchIdempotencyKey - runs through the real launcher to a
    // durable terminal (succeeded) state. This is the only durable terminal
    // evidence that exists for task-a; OLD's own attempt never produced
    // any.
    const launcher = new MaoOperationalWorkerLauncher(
      runStore,
      createMaoDelegationAdapter(),
      new MaoLifecycleController("2026-08-29T04:00:00.000Z"),
      delegationStore,
    );
    const newResult = await launcher.launch(
      launchRequestForTask(taskGraph, "task-a", "launch-new", "root:task-a-new"),
    );
    expect(newResult.ok).toBe(true);

    const replayBeforeRecovery = await delegationStore.replay(taskGraph.taskGraphId);
    expect(replayBeforeRecovery.ok).toBe(true);
    const settleCountBeforeRecovery = replayBeforeRecovery.ok
      ? replayBeforeRecovery.entries.filter((entry) => entry.operation === "SETTLE").length
      : -1;

    // The adversarial recovery call: target reservation OLD by its own
    // reservationKey and task-a's taskId (both individually "correct" on
    // their own), with NO launchIdempotencyKey supplied - forcing the
    // terminal-state path, which now must resolve WHICH attempt actually
    // produced task-a's terminal event and refuse to settle OLD with it,
    // because that terminal event belongs to NEW (launch-new), not OLD
    // (launch-old).
    const recoveryLauncher = new MaoOperationalWorkerLauncher(
      new MaoFileRunStore(runStoreRoot),
      createMaoDelegationAdapter(),
      new MaoLifecycleController("2026-08-29T04:30:00.000Z"),
      new MaoFileDelegationLedgerStore(delegationRoot),
    );
    const crossAttemptRecovery = await recoveryLauncher.reconcileDelegation(
      taskGraph.taskGraphId,
      "task-a",
      "root:task-a-old",
    );
    expect(crossAttemptRecovery).toMatchObject({ ok: true, reconciled: false, identityMismatch: true });

    // OLD remains open, completely untouched.
    const openOldAfterRecovery = await delegationStore.isReservationOpen(taskGraph.taskGraphId, "root:task-a-old");
    expect(openOldAfterRecovery).toMatchObject({ ok: true, open: true });

    // No new SETTLE entry was written by the cross-attempt recovery attempt
    // (only NEW's own genuine SETTLE, from its real launch(), may exist).
    const replayAfterRecovery = await delegationStore.replay(taskGraph.taskGraphId);
    expect(replayAfterRecovery.ok).toBe(true);
    if (replayAfterRecovery.ok) {
      expect(replayAfterRecovery.entries.filter((entry) => entry.operation === "SETTLE")).toHaveLength(
        settleCountBeforeRecovery,
      );
    }

    // OLD can still be legitimately settled afterwards with its own,
    // correct identity - the cross-attempt recovery attempt did not corrupt
    // its recoverability.
    const legitimateSettleOld = await delegationStore.settleDurable(taskGraph.taskGraphId, "root:task-a-old", "failed", {
      launchIdempotencyKey: "launch-old",
      childTaskId: "task-a",
    });
    expect(legitimateSettleOld.ok).toBe(true);
    if (legitimateSettleOld.ok) {
      expect(legitimateSettleOld.result).toMatchObject({ ok: true, receipt: { released: true } });
    }
  });
});

describe("BRIGADE-MAO-R1 Final Stabilization: attempt-evidence correlation uses exact comparison, never lossy delimiter parsing", () => {
  let runStoreRoot: string;
  let delegationRoot: string;

  beforeEach(async () => {
    runStoreRoot = await mkdtemp(join(tmpdir(), "mao-final-stab-run-store-"));
    delegationRoot = await mkdtemp(join(tmpdir(), "mao-final-stab-delegation-"));
  });

  afterEach(async () => {
    await rm(runStoreRoot, { recursive: true, force: true });
    await rm(delegationRoot, { recursive: true, force: true });
  });

  it("item 3a: a launchIdempotencyKey of \"launch-old::different-attempt\" cannot spoof a reservation genuinely bound to \"launch-old\"", async () => {
    const taskGraph = pilotGraphFor("task-a");
    const runStore = new MaoFileRunStore(runStoreRoot);
    await runStore.createRun(taskGraph);
    const delegationStore = new MaoFileDelegationLedgerStore(delegationRoot);
    await delegationStore.createLedger(taskGraph.taskGraphId, { globalMaxChildren: 4, parentMaxChildren: 4, maxDepth: 2 });

    // Reservation OLD is genuinely bound to the SHORT key "launch-old" and
    // deliberately left open.
    const oldReserve = await delegationStore.reserveDurable(taskGraph.taskGraphId, {
      taskGraphId: taskGraph.taskGraphId,
      parentTaskId: "root",
      childTaskId: "task-a",
      depth: 1,
      reservationKey: "root:task-a-old",
      authorityHash: taskGraph.authorityEnvelope.authorityHash,
      invocationBudgetCeiling: taskGraph.authorityEnvelope.budget.maxInvocations,
      launchIdempotencyKey: "launch-old",
    });
    expect(oldReserve.ok).toBe(true);

    // Terminal execution NEW genuinely uses the LONGER key
    // "launch-old::different-attempt", which happens to have "launch-old"
    // as a PREFIX before its own first "::". Under the removed lossy
    // parsing (split at the first "::"), this event's recovered identity
    // would have been misread as merely "launch-old" - exactly matching
    // OLD's genuine identity and falsely authorizing settlement. The fixed
    // implementation performs no such parsing at all.
    const launcher = new MaoOperationalWorkerLauncher(
      runStore,
      createMaoDelegationAdapter(),
      new MaoLifecycleController("2026-08-29T05:00:00.000Z"),
      delegationStore,
    );
    const newResult = await launcher.launch(
      launchRequestForTask(taskGraph, "task-a", "launch-old::different-attempt", "root:task-a-new"),
    );
    expect(newResult.ok).toBe(true);

    const replayBeforeAttack = await delegationStore.replay(taskGraph.taskGraphId);
    expect(replayBeforeAttack.ok).toBe(true);
    const settleCountBeforeAttack = replayBeforeAttack.ok
      ? replayBeforeAttack.entries.filter((entry) => entry.operation === "SETTLE").length
      : -1;

    const recoveryLauncher = new MaoOperationalWorkerLauncher(
      new MaoFileRunStore(runStoreRoot),
      createMaoDelegationAdapter(),
      new MaoLifecycleController("2026-08-29T05:30:00.000Z"),
      new MaoFileDelegationLedgerStore(delegationRoot),
    );
    const spoofAttempt = await recoveryLauncher.reconcileDelegation(taskGraph.taskGraphId, "task-a", "root:task-a-old");
    expect(spoofAttempt).toMatchObject({ ok: true, reconciled: false, identityMismatch: true });

    // OLD remains open, untouched; no new SETTLE entry was written by the
    // spoof attempt.
    const openOldAfterAttack = await delegationStore.isReservationOpen(taskGraph.taskGraphId, "root:task-a-old");
    expect(openOldAfterAttack).toMatchObject({ ok: true, open: true });
    const replayAfterAttack = await delegationStore.replay(taskGraph.taskGraphId);
    expect(replayAfterAttack.ok).toBe(true);
    if (replayAfterAttack.ok) {
      expect(replayAfterAttack.entries.filter((entry) => entry.operation === "SETTLE")).toHaveLength(settleCountBeforeAttack);
    }

    // OLD remains genuinely recoverable with its own correct identity.
    const legitimateSettleOld = await delegationStore.settleDurable(taskGraph.taskGraphId, "root:task-a-old", "failed", {
      launchIdempotencyKey: "launch-old",
      childTaskId: "task-a",
    });
    expect(legitimateSettleOld.ok).toBe(true);
    if (legitimateSettleOld.ok) {
      expect(legitimateSettleOld.result).toMatchObject({ ok: true, receipt: { released: true } });
    }
  });

  it("item 3b: a legitimate launchIdempotencyKey that itself contains \"::\" can still recover its OWN reservation", async () => {
    const taskGraph = pilotGraphFor("task-a");
    const runStore = new MaoFileRunStore(runStoreRoot);
    await runStore.createRun(taskGraph);
    const delegationStore = new MaoFileDelegationLedgerStore(delegationRoot);
    await delegationStore.createLedger(taskGraph.taskGraphId, { globalMaxChildren: 4, parentMaxChildren: 4, maxDepth: 2 });

    const complexKey = "launch-with::embedded::separators";

    // Force a genuine dangling-reservation window (mirrors the R4/R5
    // "genuine recovery" tests above): inject a settlement fault so
    // launch()'s own inline settlement fails even though the underlying run
    // durably succeeds, leaving the reservation open for
    // reconcileDelegation to recover. This is the cleanest way to reach the
    // terminal-state path deterministically (launch() otherwise settles a
    // successful delegated run inline, before returning).
    const degradedPort = withTypedSettleFailure(delegationStore, {
      reason: "IO_FAILURE",
      detail: "simulated concurrent disk failure on delegation store",
    });
    const faultyLauncher = new MaoOperationalWorkerLauncher(
      runStore,
      createMaoDelegationAdapter(),
      new MaoLifecycleController("2026-08-29T06:00:00.000Z"),
      degradedPort,
    );

    // Genuine reservation and genuine terminal success, both under the same
    // "::"-containing key. This must recover cleanly through the
    // terminal-state path (no launchIdempotencyKey argument supplied),
    // proving the fix is not merely "always reject a key containing ::" but
    // a real exact-match proof.
    const launched = await faultyLauncher.launch(
      launchRequestForTask(taskGraph, "task-a", complexKey, "root:task-a-complex"),
    );
    expect(launched.ok).toBe(false);

    const openBeforeRecovery = await delegationStore.isReservationOpen(taskGraph.taskGraphId, "root:task-a-complex");
    expect(openBeforeRecovery).toMatchObject({ ok: true, open: true });

    // Recovery through a freshly reconstructed launcher over the real
    // (non-faulty) store, exactly as a restarted process would.
    const recoveryLauncher = new MaoOperationalWorkerLauncher(
      new MaoFileRunStore(runStoreRoot),
      createMaoDelegationAdapter(),
      new MaoLifecycleController("2026-08-29T06:30:00.000Z"),
      new MaoFileDelegationLedgerStore(delegationRoot),
    );
    const recovered = await recoveryLauncher.reconcileDelegation(taskGraph.taskGraphId, "task-a", "root:task-a-complex");
    expect(recovered).toMatchObject({ ok: true, reconciled: true, completionReceipt: { outcome: "succeeded" } });

    const openAfterRecovery = await delegationStore.isReservationOpen(taskGraph.taskGraphId, "root:task-a-complex");
    expect(openAfterRecovery).toMatchObject({ ok: true, open: false });

    // Idempotent repeat: a safe no-op, still exactly one SETTLE entry.
    const idempotentReconcile = await recoveryLauncher.reconcileDelegation(taskGraph.taskGraphId, "task-a", "root:task-a-complex");
    expect(idempotentReconcile).toMatchObject({ ok: true, reconciled: false });
    const finalReplay = await delegationStore.replay(taskGraph.taskGraphId);
    expect(finalReplay.ok).toBe(true);
    if (finalReplay.ok) {
      expect(finalReplay.entries.filter((entry) => entry.operation === "SETTLE")).toHaveLength(1);
    }
  });

  it("item 3c: a durably timed-out attempt settles only its OWN reservation, never a different reservation for the same task", async () => {
    const taskGraph = pilotGraphFor("task-a");
    const runStore = new MaoFileRunStore(runStoreRoot);
    await runStore.createRun(taskGraph);
    const delegationStore = new MaoFileDelegationLedgerStore(delegationRoot);
    await delegationStore.createLedger(taskGraph.taskGraphId, { globalMaxChildren: 4, parentMaxChildren: 4, maxDepth: 2 });

    // Reservation OLD, deliberately left open under "launch-old".
    const oldReserve = await delegationStore.reserveDurable(taskGraph.taskGraphId, {
      taskGraphId: taskGraph.taskGraphId,
      parentTaskId: "root",
      childTaskId: "task-a",
      depth: 1,
      reservationKey: "root:task-a-old",
      authorityHash: taskGraph.authorityEnvelope.authorityHash,
      invocationBudgetCeiling: taskGraph.authorityEnvelope.budget.maxInvocations,
      launchIdempotencyKey: "launch-old",
    });
    expect(oldReserve.ok).toBe(true);

    // Reservation NEW, genuinely reserved and genuinely driven to a durable
    // TIMEOUT_DETECTED/timed_out terminal state under "launch-new".
    const newReserve = await delegationStore.reserveDurable(taskGraph.taskGraphId, {
      taskGraphId: taskGraph.taskGraphId,
      parentTaskId: "root",
      childTaskId: "task-a",
      depth: 1,
      reservationKey: "root:task-a-new",
      authorityHash: taskGraph.authorityEnvelope.authorityHash,
      invocationBudgetCeiling: taskGraph.authorityEnvelope.budget.maxInvocations,
      launchIdempotencyKey: "launch-new",
    });
    expect(newReserve.ok).toBe(true);

    const lifecycle = new MaoLifecycleController("2026-08-29T07:00:00.000Z");
    await driveToRunningStateForAttempt(runStore, taskGraph, "task-a", "launch-new", lifecycle.clock.now());
    const timeoutLauncher = new MaoOperationalWorkerLauncher(runStore, createMaoDelegationAdapter(), lifecycle);
    lifecycle.advanceClock(2000);
    const timeoutResult = await timeoutLauncher.recordTimeout(taskGraph.taskGraphId, "task-a", 1000);
    expect(timeoutResult.ok).toBe(true);
    if (timeoutResult.ok) expect(timeoutResult.timedOut).toBe(true);

    const recoveryLauncher = new MaoOperationalWorkerLauncher(
      new MaoFileRunStore(runStoreRoot),
      createMaoDelegationAdapter(),
      new MaoLifecycleController("2026-08-29T07:30:00.000Z"),
      delegationStore,
    );

    // Attack: recover reservation OLD using task-a's (NEW's) durable
    // timed-out state. Must fail closed - the preceding INVOCATION_STARTED
    // for the timed-out attempt is keyed to "launch-new", not "launch-old".
    const attackOld = await recoveryLauncher.reconcileDelegation(taskGraph.taskGraphId, "task-a", "root:task-a-old");
    expect(attackOld).toMatchObject({ ok: true, reconciled: false, identityMismatch: true });
    const openOldAfterAttack = await delegationStore.isReservationOpen(taskGraph.taskGraphId, "root:task-a-old");
    expect(openOldAfterAttack).toMatchObject({ ok: true, open: true });

    // Genuine recovery: NEW's own reservation settles cleanly with its
    // durable timed_out outcome.
    const recoverNew = await recoveryLauncher.reconcileDelegation(taskGraph.taskGraphId, "task-a", "root:task-a-new");
    expect(recoverNew).toMatchObject({ ok: true, reconciled: true, completionReceipt: { outcome: "timed_out" } });
    const openNewAfterRecovery = await delegationStore.isReservationOpen(taskGraph.taskGraphId, "root:task-a-new");
    expect(openNewAfterRecovery).toMatchObject({ ok: true, open: false });
  });

  it("item 3d: a durably cancelled attempt settles only its OWN reservation, never a different reservation for the same task", async () => {
    const taskGraph = pilotGraphFor("task-a");
    const runStore = new MaoFileRunStore(runStoreRoot);
    await runStore.createRun(taskGraph);
    const delegationStore = new MaoFileDelegationLedgerStore(delegationRoot);
    await delegationStore.createLedger(taskGraph.taskGraphId, { globalMaxChildren: 4, parentMaxChildren: 4, maxDepth: 2 });

    const oldReserve = await delegationStore.reserveDurable(taskGraph.taskGraphId, {
      taskGraphId: taskGraph.taskGraphId,
      parentTaskId: "root",
      childTaskId: "task-a",
      depth: 1,
      reservationKey: "root:task-a-old",
      authorityHash: taskGraph.authorityEnvelope.authorityHash,
      invocationBudgetCeiling: taskGraph.authorityEnvelope.budget.maxInvocations,
      launchIdempotencyKey: "launch-old",
    });
    expect(oldReserve.ok).toBe(true);

    const newReserve = await delegationStore.reserveDurable(taskGraph.taskGraphId, {
      taskGraphId: taskGraph.taskGraphId,
      parentTaskId: "root",
      childTaskId: "task-a",
      depth: 1,
      reservationKey: "root:task-a-new",
      authorityHash: taskGraph.authorityEnvelope.authorityHash,
      invocationBudgetCeiling: taskGraph.authorityEnvelope.budget.maxInvocations,
      launchIdempotencyKey: "launch-new",
    });
    expect(newReserve.ok).toBe(true);

    const lifecycle = new MaoLifecycleController("2026-08-29T08:00:00.000Z");
    await driveToRunningStateForAttempt(runStore, taskGraph, "task-a", "launch-new", lifecycle.clock.now());
    const cancelLauncher = new MaoOperationalWorkerLauncher(runStore, createMaoDelegationAdapter(), lifecycle);
    await cancelLauncher.requestCancellation(taskGraph.taskGraphId, "task-a");
    const acceptResult = await cancelLauncher.acceptCancellation(taskGraph.taskGraphId, "task-a");
    expect(acceptResult.ok).toBe(true);
    if (acceptResult.ok) expect(acceptResult.alreadyCancelled).toBe(false);

    const recoveryLauncher = new MaoOperationalWorkerLauncher(
      new MaoFileRunStore(runStoreRoot),
      createMaoDelegationAdapter(),
      new MaoLifecycleController("2026-08-29T08:30:00.000Z"),
      delegationStore,
    );

    // Attack: recover reservation OLD using task-a's (NEW's) durable
    // cancelled state. Must fail closed - the preceding INVOCATION_STARTED
    // for the cancelled attempt is keyed to "launch-new", not "launch-old".
    const attackOld = await recoveryLauncher.reconcileDelegation(taskGraph.taskGraphId, "task-a", "root:task-a-old");
    expect(attackOld).toMatchObject({ ok: true, reconciled: false, identityMismatch: true });
    const openOldAfterAttack = await delegationStore.isReservationOpen(taskGraph.taskGraphId, "root:task-a-old");
    expect(openOldAfterAttack).toMatchObject({ ok: true, open: true });

    // Genuine recovery: NEW's own reservation settles cleanly with its
    // durable cancelled outcome.
    const recoverNew = await recoveryLauncher.reconcileDelegation(taskGraph.taskGraphId, "task-a", "root:task-a-new");
    expect(recoverNew).toMatchObject({ ok: true, reconciled: true, completionReceipt: { outcome: "cancelled" } });
    const openNewAfterRecovery = await delegationStore.isReservationOpen(taskGraph.taskGraphId, "root:task-a-new");
    expect(openNewAfterRecovery).toMatchObject({ ok: true, open: false });
  });
});

describe("BRIGADE-MAO-R1 R5: missing-identity settlement is rejected at the durable port boundary", () => {
  let delegationRoot: string;

  beforeEach(async () => {
    delegationRoot = await mkdtemp(join(tmpdir(), "mao-r5-missing-identity-delegation-"));
  });

  afterEach(async () => {
    await rm(delegationRoot, { recursive: true, force: true });
  });

  it("item 4: a caller that bypasses the type system and omits expectedIdentity is rejected with MISSING_IDENTITY, and the reservation stays open", async () => {
    const delegationStore = new MaoFileDelegationLedgerStore(delegationRoot);
    const ledgerId = "graph-r5-missing-identity";
    await delegationStore.createLedger(ledgerId, { globalMaxChildren: 2, parentMaxChildren: 2, maxDepth: 2 });
    await delegationStore.reserve(ledgerId, reservation("root", "child-1", 1, ledgerId, "launch-missing-identity"));

    // A legitimate TypeScript caller cannot omit `expectedIdentity` - it is
    // a compile-time error. This simulates a caller that bypasses the type
    // system (e.g. plain-JS consumer, `as any`), which the runtime guard
    // must still catch.
    const bypassedSettle = await (delegationStore.settleDurable as any)(ledgerId, "root:child-1", "succeeded", undefined);
    expect(bypassedSettle).toMatchObject({ ok: false, reason: "MISSING_IDENTITY" });

    const bypassedSettleNull = await (delegationStore.settleDurable as any)(ledgerId, "root:child-1", "succeeded", null);
    expect(bypassedSettleNull).toMatchObject({ ok: false, reason: "MISSING_IDENTITY" });

    const bypassedSettlePartial = await (delegationStore.settleDurable as any)(ledgerId, "root:child-1", "succeeded", {
      launchIdempotencyKey: "launch-missing-identity",
      // childTaskId deliberately omitted.
    });
    expect(bypassedSettlePartial).toMatchObject({ ok: false, reason: "MISSING_IDENTITY" });

    // The reservation was never touched by any of the rejected attempts.
    const openCheck = await delegationStore.isReservationOpen(ledgerId, "root:child-1");
    expect(openCheck).toMatchObject({ ok: true, open: true });
    const replay = await delegationStore.replay(ledgerId);
    expect(replay.ok).toBe(true);
    if (replay.ok) {
      expect(replay.entries.filter((entry) => entry.operation === "SETTLE")).toHaveLength(0);
    }

    // The reservation remains settleable with the correct identity
    // afterwards - the rejected attempts left no corrupted state behind.
    const genuineSettle = await delegationStore.settleDurable(ledgerId, "root:child-1", "succeeded", {
      launchIdempotencyKey: "launch-missing-identity",
      childTaskId: "child-1",
    });
    expect(genuineSettle.ok).toBe(true);
    if (genuineSettle.ok) {
      expect(genuineSettle.result).toMatchObject({ ok: true, receipt: { released: true } });
    }
  });

  it("item 4 (R6): the CONCRETE store's own public settle() - not just settleDurable, the narrower port method - rejects a missing identity, and wrong key/task/reservation identities remain fail-closed", async () => {
    const delegationStore = new MaoFileDelegationLedgerStore(delegationRoot);
    const ledgerId = "graph-r6-concrete-store-boundary";
    await delegationStore.createLedger(ledgerId, { globalMaxChildren: 4, parentMaxChildren: 4, maxDepth: 2 });
    await delegationStore.reserve(ledgerId, reservation("root", "child-1", 1, ledgerId, "launch-concrete-1"));
    await delegationStore.reserve(ledgerId, reservation("root", "child-2", 1, ledgerId, "launch-concrete-2"));

    // MaoFileDelegationLedgerStore.settle is a PUBLIC method on the
    // CONCRETE class, reachable independently of the narrower
    // MaoDurableDelegationPort.settleDurable a runtime consumer is typed
    // against (reviewer RETURN_FOR_REWORK R6, requirement 1/4). It must
    // carry the identical unverified-settlement protection, not rely on the
    // port interface alone to enforce it.

    // Missing identity entirely (type-system-bypassing caller).
    const missingIdentity = await (delegationStore.settle as any)(ledgerId, "root:child-1", "succeeded", undefined);
    expect(missingIdentity).toMatchObject({ ok: false, reason: "MISSING_IDENTITY" });

    // Wrong launchIdempotencyKey (correct childTaskId).
    const wrongKey = await delegationStore.settle(ledgerId, "root:child-1", "succeeded", {
      launchIdempotencyKey: "launch-totally-wrong",
      childTaskId: "child-1",
    });
    expect(wrongKey.ok).toBe(true);
    if (wrongKey.ok) {
      expect(wrongKey.result).toMatchObject({ ok: false, reason: "IDENTITY_MISMATCH" });
    }

    // Wrong childTaskId (correct launchIdempotencyKey for a DIFFERENT
    // reservation - a plausible-looking but wrong cross-reservation
    // assertion).
    const wrongTaskId = await delegationStore.settle(ledgerId, "root:child-1", "succeeded", {
      launchIdempotencyKey: "launch-concrete-1",
      childTaskId: "child-2",
    });
    expect(wrongTaskId.ok).toBe(true);
    if (wrongTaskId.ok) {
      expect(wrongTaskId.result).toMatchObject({ ok: false, reason: "IDENTITY_MISMATCH" });
    }

    // Wrong reservationKey (asserting child-2's genuine, correct identity
    // while targeting child-1's reservationKey).
    const wrongReservationKey = await delegationStore.settle(ledgerId, "root:child-1", "succeeded", {
      launchIdempotencyKey: "launch-concrete-2",
      childTaskId: "child-2",
    });
    expect(wrongReservationKey.ok).toBe(true);
    if (wrongReservationKey.ok) {
      expect(wrongReservationKey.result).toMatchObject({ ok: false, reason: "IDENTITY_MISMATCH" });
    }

    // Every rejected attempt left both reservations open and wrote no
    // SETTLE entry.
    const openChild1 = await delegationStore.isReservationOpen(ledgerId, "root:child-1");
    const openChild2 = await delegationStore.isReservationOpen(ledgerId, "root:child-2");
    expect(openChild1).toMatchObject({ ok: true, open: true });
    expect(openChild2).toMatchObject({ ok: true, open: true });
    const replayAfterRejections = await delegationStore.replay(ledgerId);
    expect(replayAfterRejections.ok).toBe(true);
    if (replayAfterRejections.ok) {
      expect(replayAfterRejections.entries.filter((entry) => entry.operation === "SETTLE")).toHaveLength(0);
    }

    // Both reservations remain genuinely settleable with their own correct
    // identity afterwards.
    const genuineChild1 = await delegationStore.settle(ledgerId, "root:child-1", "succeeded", {
      launchIdempotencyKey: "launch-concrete-1",
      childTaskId: "child-1",
    });
    const genuineChild2 = await delegationStore.settle(ledgerId, "root:child-2", "succeeded", {
      launchIdempotencyKey: "launch-concrete-2",
      childTaskId: "child-2",
    });
    expect(genuineChild1.ok).toBe(true);
    expect(genuineChild2.ok).toBe(true);
    if (genuineChild1.ok) expect(genuineChild1.result).toMatchObject({ ok: true, receipt: { released: true } });
    if (genuineChild2.ok) expect(genuineChild2.result).toMatchObject({ ok: true, receipt: { released: true } });
  });
});
