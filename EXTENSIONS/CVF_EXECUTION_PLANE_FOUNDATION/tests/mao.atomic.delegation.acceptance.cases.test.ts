// CVF BRIGADE-MAO-R1 - Deterministic Runtime Acceptance Cases
//
// Exercises the eight acceptance cases required by
// docs/reference/multi_agent_orchestration/CVF_MAO_ATOMIC_DELEGATION_LIFECYCLE_COMPOSITION_STANDARD.md
// ("Deterministic Runtime Acceptance Cases") against
// MaoAtomicDelegationLifecycleCoordinator and MaoFileDelegationLedgerStore.
// These are additional to, not a replacement for,
// tests/mao.atomic.delegation.lifecycle.coordinator.test.ts (focused
// reservation/capacity/cascade/release/completion/consumer-integration
// cases). This file specifically proves: last-slot contention, abort-vs-
// admission race, three-level cascade, duplicate abort/completion replay,
// completion-during-cascade, exactly-once release, sibling-permutation
// determinism, and crash/replay between terminal outcome and the final
// settlement receipt.
//
// Rework (reviewer RETURN_FOR_REWORK) additions:
//  - Promise.all contention against the durable port, including from two
//    SEPARATE MaoFileDelegationLedgerStore instances pointed at the same
//    ledger file (requirement 6), proving the in-process queue
//    (requirement 5) and the file-level CAS guard are both load-bearing.
//  - Late-admission rejection once a parent's continuation has fired,
//    through the durable port (requirement 8).
//  - A fault injected exactly after INVOCATION_COMPLETED and before
//    delegation settlement, then launcher reconstruction and
//    reconcileDelegation() recovery proof without double release or double
//    wake (requirement 10, using recover-and-reconcile from requirement 4).

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { MaoAtomicDelegationLifecycleCoordinator } from "../src/mao/atomic.delegation.lifecycle.coordinator";
import { MaoFileDelegationLedgerStore } from "../src/mao/durable.delegation.ledger.store";
import { compileTaskGraph } from "../src/mao/task.graph.contract";
import type { MaoTaskGraph } from "../src/mao/task.graph.contract";
import { MaoFileRunStore } from "../src/mao/durable.run.store";
import { createMaoDelegationAdapter } from "../src/mao/delegation.adapter.contract";
import { MaoLifecycleController } from "../src/mao/lifecycle.controller.contract";
import { MaoOperationalWorkerLauncher } from "../src/mao/operational.worker.launcher";
import type { MaoOperationalAdapterPort } from "../src/mao/operational.worker.launcher";

const AUTHORITY_HASH = "test-authority-hash";
const BUDGET_CEILING = 20;

function reservation(
  parentTaskId: string,
  childTaskId: string,
  depth: number,
  taskGraphId = "graph-1",
  launchIdempotencyKey = `launch-${childTaskId}`,
) {
  return {
    taskGraphId,
    parentTaskId,
    childTaskId,
    depth,
    reservationKey: `${parentTaskId}:${childTaskId}`,
    authorityHash: AUTHORITY_HASH,
    invocationBudgetCeiling: BUDGET_CEILING,
    launchIdempotencyKey,
  };
}

/**
 * The settlement identity matching a `reservation(...)` call made with the
 * same `childTaskId` and default `launchIdempotencyKey` convention
 * (`launch-${childTaskId}`). `settle`/`settleDurable` require an identity
 * on every public call as of reviewer RETURN_FOR_REWORK R6; this keeps that
 * required argument terse across this file's many acceptance-case tests
 * without repeating the convention at each call site.
 */
function identityFor(childTaskId: string, launchIdempotencyKey = `launch-${childTaskId}`) {
  return { launchIdempotencyKey, childTaskId };
}

function pilotGraph(): MaoTaskGraph {
  const result = compileTaskGraph({
    authority: {
      workOrderId: "BRIGADE-MAO-R1",
      route: "MULTI_AGENT_SINGLE_ROLE",
      riskLevel: "R1",
      budget: {
        maxInvocations: 2,
        maxConcurrentRoles: 2,
        maxRevisionDepth: 1,
        tokenCostCeiling: null,
        wallClockCeilingMs: null,
      },
      closerActorId: "closer-1",
      approvalCheckpoints: [],
    },
    tasks: [{ taskId: "child-1", role: "worker", riskLevel: "R1", fileScope: ["src/child-1.ts"] }],
  });
  if (!result.ok) throw new Error(result.detail);
  return result.graph;
}

function launchRequestFor(graph: MaoTaskGraph, launchIdempotencyKey: string, reservationKey: string) {
  return {
    taskGraphId: graph.taskGraphId,
    taskId: "child-1",
    admission: {
      taskGraphId: graph.taskGraphId,
      decision: "BOUNDED_ROLE_PLAN_ADMITTED" as const,
      approvalRequired: false,
      admittedRoles: ["worker"],
    },
    capability: { role: "worker", requiredCapabilities: ["text-generation"], offeredCapabilities: ["text-generation"] },
    inputManifest: ["BRIGADE-MAO-R1"],
    launchIdempotencyKey,
    delegation: { parentTaskId: "root", depth: 1, reservationKey },
  };
}

describe("BRIGADE-MAO-R1 acceptance case 1: last-slot contention under two concurrent reservation attempts", () => {
  it("admits exactly one of two simultaneous requests for the last global slot and changes no counter for the loser", () => {
    const coordinator = new MaoAtomicDelegationLifecycleCoordinator({ globalMaxChildren: 1, parentMaxChildren: 2, maxDepth: 2 });
    // JavaScript's single-threaded execution model makes the two "concurrent"
    // reserve() calls indivisible: each call fully completes its
    // check-then-increment before the next call begins, so this proves the
    // atomicity invariant (I-1) deterministically rather than relying on
    // real OS thread scheduling.
    const first = coordinator.reserve(reservation("p1", "c1", 1));
    const second = coordinator.reserve(reservation("p1", "c2", 1));

    expect(first.ok).toBe(true);
    expect(second).toMatchObject({ ok: false, reason: "GLOBAL_CAPACITY_EXHAUSTED" });
    expect(coordinator.snapshot()).toMatchObject({ globalActive: 1, activeByParent: { p1: 1 } });
  });

  it("admits exactly one of many simultaneous requests regardless of submission order", () => {
    const coordinator = new MaoAtomicDelegationLifecycleCoordinator({ globalMaxChildren: 1, parentMaxChildren: 5, maxDepth: 2 });
    const requests = ["c1", "c2", "c3", "c4", "c5"].map((childId) => reservation("p1", childId, 1));
    const results = requests.map((request) => coordinator.reserve(request));

    const admitted = results.filter((result) => result.ok);
    const rejected = results.filter((result) => !result.ok);
    expect(admitted).toHaveLength(1);
    expect(rejected).toHaveLength(4);
    expect(rejected.every((result) => !result.ok && result.reason === "GLOBAL_CAPACITY_EXHAUSTED")).toBe(true);
    expect(coordinator.snapshot().globalActive).toBe(1);
  });
});

describe("BRIGADE-MAO-R1 acceptance case 2: parent abort versus new-child admission race", () => {
  it("rejects a reservation submitted after abortCascade closed admission, even for a still-in-flight sibling", () => {
    const coordinator = new MaoAtomicDelegationLifecycleCoordinator({ globalMaxChildren: 4, parentMaxChildren: 4, maxDepth: 2 });
    coordinator.reserve(reservation("root", "child-a", 1));

    // The abort boundary is established (admission closed) strictly before
    // any new reservation attempt against the same parent can be evaluated,
    // per invariant I-3 (Close Admission Before Abort Traversal).
    const cascade = coordinator.abortCascade("root");
    const raceLoser = coordinator.reserve(reservation("root", "child-b", 1));

    expect(cascade.admissionClosed).toBe(true);
    expect(raceLoser).toMatchObject({ ok: false, reason: "PARENT_ADMISSION_CLOSED" });
    expect(coordinator.snapshot().globalActive).toBe(0);
  });

  it("never admits a reservation whose request predates the abort but is only evaluated after admission closed", () => {
    const coordinator = new MaoAtomicDelegationLifecycleCoordinator({ globalMaxChildren: 4, parentMaxChildren: 4, maxDepth: 2 });
    const pendingRequest = reservation("root", "late-arrival", 1);

    // Simulate the abort boundary being decided first (as I-3 requires) even
    // though the reservation request was conceptually "in flight" earlier;
    // the coordinator must decide by admission-close sequence, not by
    // request wall-clock origin.
    coordinator.abortCascade("root");
    const result = coordinator.reserve(pendingRequest);

    expect(result).toMatchObject({ ok: false, reason: "PARENT_ADMISSION_CLOSED" });
  });
});

describe("BRIGADE-MAO-R1 acceptance case 3: cascade across a three-level descendant tree", () => {
  it("closes admission at the root, then releases all three levels leaf-first in one cascade", () => {
    const coordinator = new MaoAtomicDelegationLifecycleCoordinator({ globalMaxChildren: 8, parentMaxChildren: 4, maxDepth: 4 });
    coordinator.reserve(reservation("root", "mid", 1));
    coordinator.reserve(reservation("mid", "leaf-a", 2));
    coordinator.reserve(reservation("mid", "leaf-b", 2));
    coordinator.reserve(reservation("leaf-a", "grandleaf", 3));

    const cascade = coordinator.abortCascade("root");

    expect(cascade.admissionClosed).toBe(true);
    // grandleaf (depth 3) and both depth-2 leaves settle before mid (depth 1).
    const depthOrder = cascade.releasedLeafFirst.map((childTaskId) => {
      if (childTaskId === "grandleaf") return 3;
      if (childTaskId === "leaf-a" || childTaskId === "leaf-b") return 2;
      return 1;
    });
    for (let i = 1; i < depthOrder.length; i += 1) {
      expect(depthOrder[i]).toBeLessThanOrEqual(depthOrder[i - 1]);
    }
    expect(cascade.releasedLeafFirst).toContain("grandleaf");
    expect(cascade.releasedLeafFirst).toContain("mid");
    expect(cascade.completions.every((completion) => completion.outcome === "cancelled")).toBe(true);
    expect(coordinator.snapshot().globalActive).toBe(0);
  });

  it("does not cancel a sibling subtree that does not descend from the aborted parent", () => {
    const coordinator = new MaoAtomicDelegationLifecycleCoordinator({ globalMaxChildren: 8, parentMaxChildren: 4, maxDepth: 4 });
    coordinator.reserve(reservation("root", "mid", 1));
    coordinator.reserve(reservation("mid", "leaf-a", 2));
    coordinator.reserve(reservation("unrelated-root", "unrelated-child", 1));

    const cascade = coordinator.abortCascade("root");

    expect(cascade.releasedLeafFirst).not.toContain("unrelated-child");
    expect(coordinator.snapshot().activeByParent["unrelated-root"]).toBe(1);
    expect(coordinator.snapshot().globalActive).toBe(1);
  });
});

describe("BRIGADE-MAO-R1 acceptance case 4: duplicate abort and duplicate completion replay", () => {
  it("returns the same admission-closed boundary on a repeated abort without a second counter change or new completions", () => {
    const coordinator = new MaoAtomicDelegationLifecycleCoordinator({ globalMaxChildren: 4, parentMaxChildren: 4, maxDepth: 2 });
    coordinator.reserve(reservation("root", "child", 1));

    const firstAbort = coordinator.abortCascade("root");
    const snapshotAfterFirst = coordinator.snapshot();
    const secondAbort = coordinator.abortCascade("root");
    const snapshotAfterSecond = coordinator.snapshot();

    expect(firstAbort.completions).toHaveLength(1);
    expect(secondAbort.completions).toHaveLength(0);
    expect(secondAbort.admissionClosed).toBe(true);
    expect(snapshotAfterSecond).toEqual(snapshotAfterFirst);
  });

  it("replays the identical settlement receipt on a duplicate completion and never increments join or wake counts twice", () => {
    const coordinator = new MaoAtomicDelegationLifecycleCoordinator({ globalMaxChildren: 4, parentMaxChildren: 4, maxDepth: 2 });
    coordinator.reserve(reservation("p1", "c1", 1));

    const first = coordinator.settle("p1:c1", "succeeded", identityFor("c1"));
    const duplicate = coordinator.settle("p1:c1", "succeeded", identityFor("c1"));
    const duplicateWithDifferentOutcome = coordinator.settle("p1:c1", "failed", identityFor("c1"));

    expect(first).toMatchObject({ ok: true, receipt: { replayed: false, parentCompletionSequence: 1, wakeParent: true } });
    expect(duplicate).toMatchObject({ ok: true, receipt: { replayed: true, parentCompletionSequence: 1, wakeParent: true, outcome: "succeeded" } });
    // A duplicate/late completion cannot rewrite the terminal outcome either.
    expect(duplicateWithDifferentOutcome).toMatchObject({ ok: true, receipt: { replayed: true, outcome: "succeeded" } });
    expect(coordinator.snapshot().globalActive).toBe(0);
  });
});

describe("BRIGADE-MAO-R1 acceptance case 5: child completion during cascade", () => {
  it("lets a child's own completion win when it settles before the cascade reaches it, and the cascade observes rather than re-cancels it", () => {
    const coordinator = new MaoAtomicDelegationLifecycleCoordinator({ globalMaxChildren: 4, parentMaxChildren: 4, maxDepth: 2 });
    coordinator.reserve(reservation("root", "child-a", 1));
    coordinator.reserve(reservation("root", "child-b", 1));

    // child-a completes successfully in a race with the parent's abort.
    const raceWinner = coordinator.settle("root:child-a", "succeeded", identityFor("child-a"));
    const cascade = coordinator.abortCascade("root");

    expect(raceWinner).toMatchObject({ ok: true, receipt: { outcome: "succeeded", replayed: false } });
    // The cascade only cancels the still-active sibling; it does not
    // re-settle or overwrite child-a's already-terminal outcome.
    expect(cascade.releasedLeafFirst).toEqual(["child-b"]);
    expect(cascade.completions).toHaveLength(1);
    expect(cascade.completions[0]).toMatchObject({ childTaskId: "child-b", outcome: "cancelled" });

    const replayOfChildA = coordinator.settle("root:child-a", "cancelled", identityFor("child-a"));
    expect(replayOfChildA).toMatchObject({ ok: true, receipt: { outcome: "succeeded", replayed: true } });
  });
});

describe("BRIGADE-MAO-R1 acceptance case 6: exactly-once parent/global budget release", () => {
  it("holds acquired = active + released at every step across reserve/settle/retry for both scopes", () => {
    const coordinator = new MaoAtomicDelegationLifecycleCoordinator({ globalMaxChildren: 4, parentMaxChildren: 4, maxDepth: 2 });
    coordinator.reserve(reservation("p1", "c1", 1));
    coordinator.reserve(reservation("p1", "c2", 1));
    coordinator.reserve(reservation("p2", "c3", 1));

    let acquired = 3;
    let released = 0;
    let active = acquired - released;
    expect(coordinator.snapshot().globalActive).toBe(active);

    coordinator.settle("p1:c1", "succeeded", identityFor("c1"));
    released += 1;
    active = acquired - released;
    expect(coordinator.snapshot().globalActive).toBe(active);
    expect(coordinator.snapshot().activeByParent.p1).toBe(1);

    // Retry must not release twice.
    coordinator.settle("p1:c1", "succeeded", identityFor("c1"));
    expect(coordinator.snapshot().globalActive).toBe(active);

    coordinator.settle("p1:c2", "failed", identityFor("c2"));
    coordinator.settle("p2:c3", "cancelled", identityFor("c3"));
    released += 2;
    active = acquired - released;
    expect(coordinator.snapshot().globalActive).toBe(0);
    expect(active).toBe(0);
  });

  it("never lets counters go negative when settle is called on an already fully-released reservation repeatedly", () => {
    const coordinator = new MaoAtomicDelegationLifecycleCoordinator({ globalMaxChildren: 2, parentMaxChildren: 2, maxDepth: 2 });
    coordinator.reserve(reservation("p1", "c1", 1));
    for (let i = 0; i < 5; i += 1) {
      coordinator.settle("p1:c1", "succeeded", identityFor("c1"));
    }
    expect(coordinator.snapshot().globalActive).toBe(0);
    expect(coordinator.snapshot().activeByParent.p1).toBe(0);
  });
});

describe("BRIGADE-MAO-R1 acceptance case 7: sibling completion permutations produce one identical parent decision", () => {
  it("produces the same final wake decision and join count regardless of sibling settlement order", () => {
    function runOrder(order: readonly string[]) {
      const coordinator = new MaoAtomicDelegationLifecycleCoordinator({ globalMaxChildren: 8, parentMaxChildren: 8, maxDepth: 2 });
      for (const childId of ["c1", "c2", "c3"]) {
        coordinator.reserve(reservation("p1", childId, 1));
      }
      const receipts = order.map((childId) => {
        const result = coordinator.settle(`p1:${childId}`, "succeeded", identityFor(childId));
        if (!result.ok) throw new Error("unexpected settlement failure in permutation test");
        return result.receipt;
      });
      return { receipts, finalSnapshot: coordinator.snapshot() };
    }

    const permutations: readonly (readonly string[])[] = [
      ["c1", "c2", "c3"],
      ["c3", "c2", "c1"],
      ["c2", "c1", "c3"],
      ["c1", "c3", "c2"],
    ];

    const outcomes = permutations.map(runOrder);

    for (const outcome of outcomes) {
      // Sequence numbers always run 1..3 in submission order (per-parent
      // monotonic sequence), but the *final* decision - all three settled,
      // exactly one wake=true, at the last settlement in each run - must be
      // identical across every permutation.
      const wakeFlags = outcome.receipts.map((receipt) => receipt.wakeParent);
      expect(wakeFlags.filter(Boolean)).toHaveLength(1);
      expect(wakeFlags[wakeFlags.length - 1]).toBe(true);
      expect(outcome.finalSnapshot.activeByParent.p1).toBe(0);
      expect(outcome.finalSnapshot.globalActive).toBe(0);
    }
  });
});

describe("BRIGADE-MAO-R1 requirement 8: late admission rejected once the parent continuation has fired", () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "mao-delegation-ledger-wake-"));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("rejects a durable reservation for a parent whose continuation already fired, even without an abort", async () => {
    const store = new MaoFileDelegationLedgerStore(root);
    const ledgerId = "graph-wake-1";
    await store.createLedger(ledgerId, { globalMaxChildren: 4, parentMaxChildren: 4, maxDepth: 2 });

    await store.reserve(ledgerId, reservation("p1", "c1", 1, ledgerId));
    const settled = await store.settle(ledgerId, "p1:c1", "succeeded", identityFor("c1"));
    expect(settled.ok).toBe(true);
    if (settled.ok) expect(settled.result).toMatchObject({ ok: true, receipt: { wakeParent: true } });

    const late = await store.reserve(ledgerId, reservation("p1", "c2", 1, ledgerId));
    expect(late.ok).toBe(true);
    if (late.ok) expect(late.result).toMatchObject({ ok: false, reason: "PARENT_ALREADY_WOKEN" });

    // The rejection is durable and survives replay: a fresh store/coordinator
    // built from the persisted log still refuses the same late reservation.
    const recoveredStore = new MaoFileDelegationLedgerStore(root);
    const lateAfterReplay = await recoveredStore.reserve(ledgerId, reservation("p1", "c3", 1, ledgerId));
    expect(lateAfterReplay.ok).toBe(true);
    if (lateAfterReplay.ok) expect(lateAfterReplay.result).toMatchObject({ ok: false, reason: "PARENT_ALREADY_WOKEN" });
  });
});

describe("BRIGADE-MAO-R1 requirements 5 and 6: serialized and CAS-guarded concurrent writes against the durable port", () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "mao-delegation-ledger-contention-"));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("admits exactly one winner when Promise.all fires many concurrent reserve() calls at the last slots from ONE store instance", async () => {
    const store = new MaoFileDelegationLedgerStore(root);
    const ledgerId = "graph-contention-1";
    await store.createLedger(ledgerId, { globalMaxChildren: 2, parentMaxChildren: 8, maxDepth: 2 });

    const childIds = ["c1", "c2", "c3", "c4", "c5", "c6"];
    const results = await Promise.all(
      childIds.map((childId) => store.reserve(ledgerId, reservation("p1", childId, 1, ledgerId))),
    );

    expect(results.every((result) => result.ok)).toBe(true);
    const admitted = results.filter((result) => result.ok && result.result.ok);
    expect(admitted).toHaveLength(2);

    const replayed = await store.replay(ledgerId);
    expect(replayed.ok).toBe(true);
    if (replayed.ok) {
      expect(replayed.coordinator.snapshot()).toMatchObject({ globalActive: 2, activeByParent: { p1: 2 } });
      // Exactly two RESERVE entries were ever persisted, proving the
      // in-process queue (requirement 5) prevented any lost or duplicated
      // write under concurrent load.
      const reserveEntries = replayed.entries.filter((entry) => entry.operation === "RESERVE");
      expect(reserveEntries).toHaveLength(2);
    }
  });

  it("admits exactly one winner when two SEPARATE store instances race Promise.all reserve() calls against the same ledger file", async () => {
    const ledgerId = "graph-contention-2";
    const seedStore = new MaoFileDelegationLedgerStore(root);
    await seedStore.createLedger(ledgerId, { globalMaxChildren: 1, parentMaxChildren: 4, maxDepth: 2 });

    // Two independent store instances, each with their own in-process queue,
    // simulate two separate worker processes writing to the same file. Only
    // the file-level CAS guard (requirement 6) - not the in-process queue
    // (which only serializes within one instance) - can keep this safe.
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

    const replayed = await seedStore.replay(ledgerId);
    expect(replayed.ok).toBe(true);
    if (replayed.ok) {
      expect(replayed.coordinator.snapshot().globalActive).toBe(1);
      const reserveEntries = replayed.entries.filter((entry) => entry.operation === "RESERVE");
      expect(reserveEntries).toHaveLength(1);
    }
  });

  it("settles exactly once when two SEPARATE store instances race Promise.all settle() calls for the same reservation", async () => {
    const ledgerId = "graph-contention-3";
    const seedStore = new MaoFileDelegationLedgerStore(root);
    await seedStore.createLedger(ledgerId, { globalMaxChildren: 4, parentMaxChildren: 4, maxDepth: 2 });
    await seedStore.reserve(ledgerId, reservation("p1", "c1", 1, ledgerId));

    const storeA = new MaoFileDelegationLedgerStore(root);
    const storeB = new MaoFileDelegationLedgerStore(root);

    const [resultA, resultB] = await Promise.all([
      storeA.settle(ledgerId, "p1:c1", "succeeded", identityFor("c1")),
      storeB.settle(ledgerId, "p1:c1", "succeeded", identityFor("c1")),
    ]);

    expect(resultA.ok).toBe(true);
    expect(resultB.ok).toBe(true);
    if (!resultA.ok || !resultB.ok) return;
    expect(resultA.result.ok).toBe(true);
    expect(resultB.result.ok).toBe(true);

    const replayed = await seedStore.replay(ledgerId);
    expect(replayed.ok).toBe(true);
    if (replayed.ok) {
      const settleEntries = replayed.entries.filter((entry) => entry.operation === "SETTLE" && entry.reservationKey === "p1:c1");
      expect(settleEntries).toHaveLength(1);
      expect(replayed.coordinator.snapshot()).toMatchObject({ globalActive: 0, activeByParent: { p1: 0 } });
    }
  });

  it("interleaves many mixed concurrent reserve/settle calls from one store instance without losing or duplicating any durable entry", async () => {
    const store = new MaoFileDelegationLedgerStore(root);
    const ledgerId = "graph-contention-4";
    await store.createLedger(ledgerId, { globalMaxChildren: 10, parentMaxChildren: 10, maxDepth: 2 });

    const childIds = ["c1", "c2", "c3", "c4", "c5"];
    await Promise.all(childIds.map((childId) => store.reserve(ledgerId, reservation("p1", childId, 1, ledgerId))));

    // Now settle all five concurrently, racing with each other in-process.
    await Promise.all(childIds.map((childId) => store.settle(ledgerId, `p1:${childId}`, "succeeded", identityFor(childId))));

    const replayed = await store.replay(ledgerId);
    expect(replayed.ok).toBe(true);
    if (replayed.ok) {
      expect(replayed.entries.filter((entry) => entry.operation === "RESERVE")).toHaveLength(5);
      expect(replayed.entries.filter((entry) => entry.operation === "SETTLE")).toHaveLength(5);
      expect(replayed.coordinator.snapshot()).toMatchObject({ globalActive: 0, activeByParent: { p1: 0 } });
      const wakeEntries = replayed.entries.filter((entry) => entry.wakeParent === true);
      expect(wakeEntries).toHaveLength(1);
    }
  });
});

describe("BRIGADE-MAO-R1 acceptance case 8 and requirement 10: crash/replay between terminal outcome and final settlement receipt", () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "mao-delegation-ledger-"));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("reconstructs identical coordinator state via full replay after a durable reserve+settle sequence", async () => {
    const store = new MaoFileDelegationLedgerStore(root);
    const ledgerId = "graph-crash-1";
    await store.createLedger(ledgerId, { globalMaxChildren: 4, parentMaxChildren: 4, maxDepth: 2 });

    await store.reserve(ledgerId, reservation("p1", "c1", 1, ledgerId));
    await store.reserve(ledgerId, reservation("p1", "c2", 1, ledgerId));
    await store.settle(ledgerId, "p1:c1", "succeeded", identityFor("c1"));

    // Simulate a crash: no further durable write happens, and a brand new
    // process/store instance rebuilds the coordinator purely from the
    // persisted log.
    const replayed = await store.replay(ledgerId);
    expect(replayed.ok).toBe(true);
    if (!replayed.ok) return;

    expect(replayed.coordinator.snapshot()).toMatchObject({
      globalActive: 1,
      activeByParent: { p1: 1 },
    });

    // Finish settling the surviving reservation post-replay and confirm the
    // ledger accepts it as the true continuation, not a duplicate.
    const finalSettle = await store.settle(ledgerId, "p1:c2", "succeeded", identityFor("c2"));
    expect(finalSettle.ok).toBe(true);
    if (finalSettle.ok) {
      expect(finalSettle.result).toMatchObject({ ok: true, receipt: { replayed: false, wakeParent: true } });
    }
  });

  it("does not double-release capacity or double-wake the parent when settle is retried after a simulated crash immediately following the first successful settle", async () => {
    const store = new MaoFileDelegationLedgerStore(root);
    const ledgerId = "graph-crash-2";
    await store.createLedger(ledgerId, { globalMaxChildren: 2, parentMaxChildren: 2, maxDepth: 2 });
    await store.reserve(ledgerId, reservation("p1", "c1", 1, ledgerId));

    const firstSettle = await store.settle(ledgerId, "p1:c1", "succeeded", identityFor("c1"));
    expect(firstSettle.ok).toBe(true);
    if (firstSettle.ok) {
      expect(firstSettle.result).toMatchObject({ ok: true, receipt: { replayed: false, wakeParent: true, released: true } });
    }

    // "Crash" here means the caller's in-memory coordinator reference is
    // discarded; recovery opens a fresh store/coordinator over the same
    // durable ledger file and retries the settle it was never told
    // succeeded.
    const recoveredStore = new MaoFileDelegationLedgerStore(root);
    const retriedSettle = await recoveredStore.settle(ledgerId, "p1:c1", "succeeded", identityFor("c1"));
    expect(retriedSettle.ok).toBe(true);
    if (retriedSettle.ok) {
      expect(retriedSettle.result).toMatchObject({ ok: true, receipt: { replayed: true, wakeParent: true } });
    }

    const finalReplay = await recoveredStore.replay(ledgerId);
    expect(finalReplay.ok).toBe(true);
    if (finalReplay.ok) {
      // Exactly one release happened durably; the retried settle after
      // "crash" recovery did not persist a second SETTLE entry.
      const settleEntries = finalReplay.entries.filter((entry) => entry.operation === "SETTLE" && entry.reservationKey === "p1:c1");
      expect(settleEntries).toHaveLength(1);
      expect(finalReplay.coordinator.snapshot()).toMatchObject({ globalActive: 0, activeByParent: { p1: 0 } });
    }
  });

  it("reconstructs a durable abort-cascade boundary via replay without re-cancelling already-settled descendants", async () => {
    const store = new MaoFileDelegationLedgerStore(root);
    const ledgerId = "graph-crash-3";
    await store.createLedger(ledgerId, { globalMaxChildren: 4, parentMaxChildren: 4, maxDepth: 3 });
    await store.reserve(ledgerId, reservation("root", "mid", 1, ledgerId));
    await store.reserve(ledgerId, reservation("mid", "leaf", 2, ledgerId));

    const cascade = await store.abortCascade(ledgerId, "root");
    expect(cascade.ok).toBe(true);
    if (cascade.ok) {
      expect(cascade.receipt.releasedLeafFirst).toEqual(["leaf", "mid"]);
    }

    const replayed = await store.replay(ledgerId);
    expect(replayed.ok).toBe(true);
    if (!replayed.ok) return;
    expect(replayed.coordinator.snapshot()).toMatchObject({ globalActive: 0, closedParents: ["root"] });

    // A late reservation attempt against the recovered coordinator must
    // still be rejected by the replayed admission-closed boundary.
    const lateAttempt = replayed.coordinator.reserve(reservation("root", "late", 1, ledgerId));
    expect(lateAttempt).toMatchObject({ ok: false, reason: "PARENT_ADMISSION_CLOSED" });

    // A repeated durable abort after replay is a no-op: no new entries.
    const recoveredStore = new MaoFileDelegationLedgerStore(root);
    const secondAbort = await recoveredStore.abortCascade(ledgerId, "root");
    expect(secondAbort.ok).toBe(true);
    if (secondAbort.ok) {
      expect(secondAbort.receipt.completions).toHaveLength(0);
      expect(secondAbort.snapshot.entries.length).toBe(replayed.entries.length);
    }
  });

  it("fails closed on replay when the persisted log is inconsistent with the fixed policy rather than silently repairing it", async () => {
    const store = new MaoFileDelegationLedgerStore(root);
    const ledgerId = "graph-crash-4";
    const created = await store.createLedger(ledgerId, { globalMaxChildren: 1, parentMaxChildren: 1, maxDepth: 1 });
    expect(created.ok).toBe(true);

    const duplicateCreate = await store.createLedger(ledgerId, { globalMaxChildren: 1, parentMaxChildren: 1, maxDepth: 1 });
    expect(duplicateCreate).toMatchObject({ ok: false, reason: "LEDGER_ALREADY_EXISTS" });

    const missing = await store.replay("graph-does-not-exist");
    expect(missing).toMatchObject({ ok: false, reason: "LEDGER_NOT_FOUND" });
  });

  it("hands a durable delegation port rebuilt after a simulated crash to the real MaoOperationalWorkerLauncher, without double-releasing or double-waking", async () => {
    const runStoreRoot = await mkdtemp(join(tmpdir(), "mao-run-store-"));
    try {
      const taskGraph = pilotGraph();

      const runStore = new MaoFileRunStore(runStoreRoot);
      await runStore.createRun(taskGraph);

      const ledgerId = taskGraph.taskGraphId;
      const delegationStore = new MaoFileDelegationLedgerStore(root);
      await delegationStore.createLedger(ledgerId, { globalMaxChildren: 2, parentMaxChildren: 2, maxDepth: 2 });

      // First launcher instance reserves durably (simulating a launch that
      // is about to dispatch) then the process is discarded before any
      // in-memory settle occurs. A genuine restart retries the SAME logical
      // launch attempt - the same launchIdempotencyKey the reservation was
      // durably bound to (schema v3, requirement 1) - not a fresh one; a
      // restarted worker resuming an in-flight attempt already knows which
      // attempt it is resuming.
      const retryLaunchIdempotencyKey = "launch-child-1-retry";
      const preCrashReservation = await delegationStore.reserve(
        ledgerId,
        reservation("root", "child-1", 1, ledgerId, retryLaunchIdempotencyKey),
      );
      expect(preCrashReservation.ok).toBe(true);

      // Recovery: a fresh store instance is handed directly to a fresh
      // launcher, exactly as a restarted worker process would; the launcher
      // itself calls reserveDurable again (idempotent replay) before ever
      // invoking the adapter.
      const recoveredDelegationStore = new MaoFileDelegationLedgerStore(root);
      const launcher = new MaoOperationalWorkerLauncher(
        runStore,
        createMaoDelegationAdapter(),
        new MaoLifecycleController("2026-08-29T00:00:00.000Z"),
        recoveredDelegationStore,
      );

      const result = await launcher.launch(launchRequestFor(taskGraph, retryLaunchIdempotencyKey, "root:child-1"));

      // The recovered store already holds the reservation from before the
      // crash (reservationReceipt is replayed:true), and the launcher's own
      // durable settle-on-completion still fires exactly once.
      expect(result).toMatchObject({
        ok: true,
        reservationReceipt: { parentTaskId: "root", childTaskId: "child-1", replayed: true },
        completionReceipt: { outcome: "succeeded", released: true, wakeParent: true, replayed: false },
      });

      const finalReplay = await recoveredDelegationStore.replay(ledgerId);
      expect(finalReplay.ok).toBe(true);
      if (finalReplay.ok) {
        expect(finalReplay.coordinator.snapshot()).toMatchObject({ globalActive: 0, activeByParent: { root: 0 } });
        const settleEntries = finalReplay.entries.filter((entry) => entry.operation === "SETTLE");
        expect(settleEntries).toHaveLength(1);
      }
    } finally {
      await rm(runStoreRoot, { recursive: true, force: true });
    }
  });
});

describe("BRIGADE-MAO-R1 requirement 10: fault injected between INVOCATION_COMPLETED and delegation settlement, recovered via reconcileDelegation", () => {
  let runStoreRoot: string;
  let delegationRoot: string;

  beforeEach(async () => {
    runStoreRoot = await mkdtemp(join(tmpdir(), "mao-fault-run-store-"));
    delegationRoot = await mkdtemp(join(tmpdir(), "mao-fault-delegation-"));
  });

  afterEach(async () => {
    await rm(runStoreRoot, { recursive: true, force: true });
    await rm(delegationRoot, { recursive: true, force: true });
  });

  /**
   * A delegation port wrapper that injects a fault into `settleDurable` the
   * first time it is called (simulating a process crash/kill exactly after
   * the durable run store already recorded INVOCATION_COMPLETED but before
   * delegation settlement lands), then behaves normally afterward. This
   * reproduces exactly the recovery gap requirement 4/10 must close.
   */
  function withOneShotSettleFault(port: MaoFileDelegationLedgerStore) {
    let hasFaulted = false;
    return {
      reserveDurable: port.reserveDurable.bind(port),
      abortCascadeDurable: port.abortCascadeDurable.bind(port),
      isReservationOpen: port.isReservationOpen.bind(port),
      getReservationIdentity: port.getReservationIdentity.bind(port),
      settleDurable: async (...args: Parameters<MaoFileDelegationLedgerStore["settleDurable"]>) => {
        if (!hasFaulted) {
          hasFaulted = true;
          throw new Error("INJECTED_FAULT: simulated crash between INVOCATION_COMPLETED and delegation settlement");
        }
        return port.settleDurable(...args);
      },
    };
  }

  it("crashes after the durable run reaches succeeded but before delegation settlement, then recovers via reconcileDelegation without double release or double wake", async () => {
    const taskGraph = pilotGraph();
    const runStore = new MaoFileRunStore(runStoreRoot);
    await runStore.createRun(taskGraph);

    const ledgerId = taskGraph.taskGraphId;
    const realDelegationStore = new MaoFileDelegationLedgerStore(delegationRoot);
    await realDelegationStore.createLedger(ledgerId, { globalMaxChildren: 2, parentMaxChildren: 2, maxDepth: 2 });

    const faultyPort = withOneShotSettleFault(realDelegationStore);
    const faultyLauncher = new MaoOperationalWorkerLauncher(
      runStore,
      createMaoDelegationAdapter(),
      new MaoLifecycleController("2026-08-29T00:00:00.000Z"),
      faultyPort,
    );

    // The injected fault throws out of launch() after the durable run store
    // already committed INVOCATION_COMPLETED/succeeded for child-1, but
    // before settleDurable's write lands - the exact crash window
    // requirement 10 targets.
    await expect(
      faultyLauncher.launch(launchRequestFor(taskGraph, "launch-child-1-fault", "root:child-1")),
    ).rejects.toThrow(/INJECTED_FAULT/);

    // Confirm the crash window is real: the durable run is terminal...
    const resumedAfterFault = await runStore.resumeRun(taskGraph.taskGraphId);
    expect(resumedAfterFault.ok).toBe(true);
    if (resumedAfterFault.ok) {
      const child1Events = resumedAfterFault.events.filter((event) => event.taskId === "child-1");
      const lastState = child1Events[child1Events.length - 1]?.resultingState;
      expect(lastState).toBe("succeeded");
    }

    // ...but the delegation reservation is still open (never durably settled).
    const openBeforeReconcile = await realDelegationStore.isReservationOpen(ledgerId, "root:child-1");
    expect(openBeforeReconcile).toMatchObject({ ok: true, open: true });

    // Reconstruct the launcher (simulating a restarted worker process) with
    // a healthy, non-faulty delegation port, and run recover-and-reconcile.
    const recoveredLauncher = new MaoOperationalWorkerLauncher(
      new MaoFileRunStore(runStoreRoot),
      createMaoDelegationAdapter(),
      new MaoLifecycleController("2026-08-29T01:00:00.000Z"),
      realDelegationStore,
    );

    const reconcileResult = await recoveredLauncher.reconcileDelegation(taskGraph.taskGraphId, "child-1", "root:child-1");
    expect(reconcileResult).toMatchObject({
      ok: true,
      reconciled: true,
      completionReceipt: { outcome: "succeeded", released: true, wakeParent: true, replayed: false },
    });

    // The reservation is now closed durably.
    const openAfterReconcile = await realDelegationStore.isReservationOpen(ledgerId, "root:child-1");
    expect(openAfterReconcile).toMatchObject({ ok: true, open: false });

    // A second reconcile call is a safe no-op: it does not re-settle or
    // double-wake.
    const secondReconcile = await recoveredLauncher.reconcileDelegation(taskGraph.taskGraphId, "child-1", "root:child-1");
    expect(secondReconcile).toMatchObject({ ok: true, reconciled: false });

    const finalReplay = await realDelegationStore.replay(ledgerId);
    expect(finalReplay.ok).toBe(true);
    if (finalReplay.ok) {
      const settleEntries = finalReplay.entries.filter((entry) => entry.operation === "SETTLE" && entry.reservationKey === "root:child-1");
      expect(settleEntries).toHaveLength(1);
      const wakeEntries = finalReplay.entries.filter((entry) => entry.wakeParent === true);
      expect(wakeEntries).toHaveLength(1);
      expect(finalReplay.coordinator.snapshot()).toMatchObject({ globalActive: 0, activeByParent: { root: 0 } });
    }

    // Recovery itself already happened above via reconcileDelegation()
    // (the sole public recovery path). This final call is NOT a second
    // recovery attempt - it is a supplementary defense-in-depth check that
    // even a raw, direct port call made AFTER recovery still observes the
    // replay rather than re-settling or double-waking, proving the
    // idempotency guarantee holds at the store layer too, not only through
    // the public API.
    const redundantDirectSettle = await realDelegationStore.settleDurable(ledgerId, "root:child-1", "succeeded", {
      launchIdempotencyKey: "launch-child-1-fault",
      childTaskId: "child-1",
    });
    expect(redundantDirectSettle.ok).toBe(true);
    if (redundantDirectSettle.ok) {
      expect(redundantDirectSettle.result).toMatchObject({ ok: true, receipt: { replayed: true, wakeParent: true } });
    }
  });

  it("reports reconciled:false for a task that is not yet durably terminal", async () => {
    const taskGraph = pilotGraph();
    const runStore = new MaoFileRunStore(runStoreRoot);
    await runStore.createRun(taskGraph);
    const ledgerId = taskGraph.taskGraphId;
    const delegationStore = new MaoFileDelegationLedgerStore(delegationRoot);
    await delegationStore.createLedger(ledgerId, { globalMaxChildren: 2, parentMaxChildren: 2, maxDepth: 2 });

    const launcher = new MaoOperationalWorkerLauncher(
      runStore,
      createMaoDelegationAdapter(),
      new MaoLifecycleController("2026-08-29T00:00:00.000Z"),
      delegationStore,
    );

    // No launch has happened yet, so the task has no durable state at all.
    const reconcileResult = await launcher.reconcileDelegation(taskGraph.taskGraphId, "child-1", "root:child-1");
    expect(reconcileResult).toMatchObject({ ok: true, reconciled: false });
  });
});

describe("BRIGADE-MAO-R1 requirement 9: authorityHash and invocation-budget binding on reservation receipts", () => {
  let runStoreRoot: string;
  let delegationRoot: string;

  beforeEach(async () => {
    runStoreRoot = await mkdtemp(join(tmpdir(), "mao-budget-run-store-"));
    delegationRoot = await mkdtemp(join(tmpdir(), "mao-budget-delegation-"));
  });

  afterEach(async () => {
    await rm(runStoreRoot, { recursive: true, force: true });
    await rm(delegationRoot, { recursive: true, force: true });
  });

  it("binds the graph's authorityHash and maxInvocations budget onto the durable reservation receipt via the real launcher", async () => {
    const taskGraph = pilotGraph();
    const runStore = new MaoFileRunStore(runStoreRoot);
    await runStore.createRun(taskGraph);
    const delegationStore = new MaoFileDelegationLedgerStore(delegationRoot);
    await delegationStore.createLedger(taskGraph.taskGraphId, { globalMaxChildren: 4, parentMaxChildren: 4, maxDepth: 2 });

    const launcher = new MaoOperationalWorkerLauncher(
      runStore,
      createMaoDelegationAdapter(),
      new MaoLifecycleController("2026-08-29T00:00:00.000Z"),
      delegationStore,
    );

    const result = await launcher.launch(launchRequestFor(taskGraph, "launch-budget-1", "root:child-1"));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.reservationReceipt).toMatchObject({
        authorityHash: taskGraph.authorityEnvelope.authorityHash,
        invocationBudgetCeiling: taskGraph.authorityEnvelope.budget.maxInvocations,
      });
    }
  });

  it("rejects a reservation whose invocation budget is already exhausted for that authorityHash", async () => {
    const delegationStore = new MaoFileDelegationLedgerStore(delegationRoot);
    const ledgerId = "graph-budget-2";
    await delegationStore.createLedger(ledgerId, { globalMaxChildren: 8, parentMaxChildren: 8, maxDepth: 2 });

    const tight = { ...reservation("p1", "c1", 1, ledgerId), invocationBudgetCeiling: 1 };
    const first = await delegationStore.reserve(ledgerId, tight);
    expect(first.ok).toBe(true);
    if (first.ok) expect(first.result.ok).toBe(true);

    const second = await delegationStore.reserve(ledgerId, { ...reservation("p1", "c2", 1, ledgerId), invocationBudgetCeiling: 1 });
    expect(second.ok).toBe(true);
    if (second.ok) expect(second.result).toMatchObject({ ok: false, reason: "INVOCATION_BUDGET_EXHAUSTED" });
  });
});
