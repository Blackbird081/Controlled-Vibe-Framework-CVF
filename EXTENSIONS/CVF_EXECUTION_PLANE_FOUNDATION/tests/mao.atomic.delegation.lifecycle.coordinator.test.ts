import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  MaoAtomicDelegationLifecycleCoordinator,
  MaoOperationalWorkerLauncher,
} from "../src/mao";
import { compileTaskGraph } from "../src/mao/task.graph.contract";
import { MaoFileRunStore } from "../src/mao/durable.run.store";
import { createMaoDelegationAdapter } from "../src/mao/delegation.adapter.contract";
import { MaoLifecycleController } from "../src/mao/lifecycle.controller.contract";
import { MaoFileDelegationLedgerStore } from "../src/mao/durable.delegation.ledger.store";

const AUTHORITY_HASH = "test-authority-hash";
const BUDGET_CEILING = 10;

function coordinator(globalMaxChildren = 3, parentMaxChildren = 2, maxDepth = 3) {
  return new MaoAtomicDelegationLifecycleCoordinator({ globalMaxChildren, parentMaxChildren, maxDepth });
}

function reservation(parentTaskId: string, childTaskId: string, depth: number, launchIdempotencyKey = `launch-${childTaskId}`) {
  return {
    taskGraphId: "graph-1",
    parentTaskId,
    childTaskId,
    depth,
    reservationKey: `${parentTaskId}:${childTaskId}`,
    authorityHash: AUTHORITY_HASH,
    invocationBudgetCeiling: BUDGET_CEILING,
    launchIdempotencyKey,
  };
}

describe("MaoAtomicDelegationLifecycleCoordinator", () => {
  it("rejects a global-capacity overflow without partially reserving", () => {
    const target = coordinator(1, 2);
    expect(target.reserve(reservation("p1", "c1", 1)).ok).toBe(true);
    const rejected = target.reserve(reservation("p2", "c2", 1));
    expect(rejected).toMatchObject({ ok: false, reason: "GLOBAL_CAPACITY_EXHAUSTED" });
    expect(target.snapshot()).toMatchObject({ globalActive: 1, activeByParent: { p1: 1 } });
  });

  it("enforces the per-parent ceiling independently of spare global capacity", () => {
    const target = coordinator(4, 1);
    expect(target.reserve(reservation("p1", "c1", 1)).ok).toBe(true);
    expect(target.reserve(reservation("p1", "c2", 1))).toMatchObject({
      ok: false,
      reason: "PARENT_CAPACITY_EXHAUSTED",
    });
    expect(target.snapshot().globalActive).toBe(1);
  });

  it("enforces one cross-parent global ceiling", () => {
    const target = coordinator(2, 2);
    expect(target.reserve(reservation("p1", "c1", 1)).ok).toBe(true);
    expect(target.reserve(reservation("p2", "c2", 1)).ok).toBe(true);
    expect(target.reserve(reservation("p3", "c3", 1))).toMatchObject({
      ok: false,
      reason: "GLOBAL_CAPACITY_EXHAUSTED",
    });
  });

  it("closes parent admission before a leaf-first abort cascade releases descendants", () => {
    const target = coordinator(4, 3);
    target.reserve(reservation("root", "child", 1));
    target.reserve(reservation("child", "leaf", 2));

    const cascade = target.abortCascade("root");
    expect(cascade.admissionClosed).toBe(true);
    expect(cascade.releasedLeafFirst).toEqual(["leaf", "child"]);
    expect(target.reserve(reservation("root", "late-child", 1))).toMatchObject({
      ok: false,
      reason: "PARENT_ADMISSION_CLOSED",
    });
    expect(target.snapshot().globalActive).toBe(0);
  });

  it("releases capacity exactly once when settlement is retried", () => {
    const target = coordinator();
    target.reserve(reservation("p1", "c1", 1));
    const identity = { launchIdempotencyKey: "launch-c1", childTaskId: "c1" };
    const first = target.settle("p1:c1", "failed", identity);
    const replay = target.settle("p1:c1", "failed", identity);
    expect(first).toMatchObject({ ok: true, receipt: { released: true, replayed: false } });
    expect(replay).toMatchObject({ ok: true, receipt: { released: true, replayed: true } });
    expect(target.snapshot()).toMatchObject({ globalActive: 0, activeByParent: { p1: 0 } });
  });

  it("R6: settle() rejects a caller that bypasses the type system and omits identity entirely, and wrong identities remain fail-closed", () => {
    const target = coordinator();
    target.reserve(reservation("p1", "c1", 1));

    const missingIdentity = (target.settle as any)("p1:c1", "succeeded", undefined);
    expect(missingIdentity).toMatchObject({ ok: false, reason: "IDENTITY_MISMATCH" });
    expect(target.snapshot()).toMatchObject({ globalActive: 1, activeByParent: { p1: 1 } });

    const nullIdentity = (target.settle as any)("p1:c1", "succeeded", null);
    expect(nullIdentity).toMatchObject({ ok: false, reason: "IDENTITY_MISMATCH" });
    expect(target.snapshot()).toMatchObject({ globalActive: 1, activeByParent: { p1: 1 } });

    const wrongIdentity = target.settle("p1:c1", "succeeded", {
      launchIdempotencyKey: "launch-totally-wrong",
      childTaskId: "c1",
    });
    expect(wrongIdentity).toMatchObject({ ok: false, reason: "IDENTITY_MISMATCH" });
    expect(target.snapshot()).toMatchObject({ globalActive: 1, activeByParent: { p1: 1 } });

    const genuine = target.settle("p1:c1", "succeeded", { launchIdempotencyKey: "launch-c1", childTaskId: "c1" });
    expect(genuine).toMatchObject({ ok: true, receipt: { released: true } });
    expect(target.snapshot()).toMatchObject({ globalActive: 0, activeByParent: { p1: 0 } });
  });

  it("R6: abortCascade settles its own enumerated reservations through the private trusted path, needing no external identity", () => {
    const target = coordinator();
    target.reserve(reservation("root", "child-a", 1));
    target.reserve(reservation("root", "child-b", 1));

    // abortCascade must keep working exactly as before: it settles the
    // reservations IT closed admission for and enumerated itself, entirely
    // internally, with no caller-supplied identity involved at all.
    const cascade = target.abortCascade("root");
    expect(cascade.completions).toHaveLength(2);
    expect(cascade.completions.every((completion) => completion.outcome === "cancelled")).toBe(true);
    expect(target.snapshot()).toMatchObject({ globalActive: 0, activeByParent: { root: 0 } });
  });

  it("serializes sibling completions per parent and wakes only on the final release", () => {
    const target = coordinator();
    target.reserve(reservation("p1", "c1", 1));
    target.reserve(reservation("p1", "c2", 1));
    const first = target.settle("p1:c2", "succeeded", { launchIdempotencyKey: "launch-c2", childTaskId: "c2" });
    const second = target.settle("p1:c1", "succeeded", { launchIdempotencyKey: "launch-c1", childTaskId: "c1" });
    expect(first).toMatchObject({ ok: true, receipt: { parentCompletionSequence: 1, wakeParent: false } });
    expect(second).toMatchObject({ ok: true, receipt: { parentCompletionSequence: 2, wakeParent: true } });
  });

  it("rejects a reservation for a parent whose continuation already woke, even without an explicit abort", () => {
    const target = coordinator();
    target.reserve(reservation("p1", "c1", 1));
    const settled = target.settle("p1:c1", "succeeded", { launchIdempotencyKey: "launch-c1", childTaskId: "c1" });
    expect(settled).toMatchObject({ ok: true, receipt: { wakeParent: true } });

    const late = target.reserve(reservation("p1", "c2", 1));
    expect(late).toMatchObject({ ok: false, reason: "PARENT_ALREADY_WOKEN" });
  });

  it("binds authorityHash and rejects a conflicting authorityHash for the same taskGraphId", () => {
    const target = coordinator();
    target.reserve(reservation("p1", "c1", 1));
    const conflict = target.reserve({ ...reservation("p1", "c2", 1), authorityHash: "different-hash" });
    expect(conflict).toMatchObject({ ok: false, reason: "AUTHORITY_HASH_CONFLICT" });
  });

  it("enforces the invocation-budget ceiling per authorityHash", () => {
    const target = coordinator(8, 8, 3);
    const tightBudget = { ...reservation("p1", "c1", 1), invocationBudgetCeiling: 1 };
    expect(target.reserve(tightBudget).ok).toBe(true);
    const overBudget = target.reserve({ ...reservation("p1", "c2", 1), invocationBudgetCeiling: 1 });
    expect(overBudget).toMatchObject({ ok: false, reason: "INVOCATION_BUDGET_EXHAUSTED" });
  });
});

describe("MaoOperationalWorkerLauncher atomic delegation consumer", () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "mao-atomic-delegation-"));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  function graph() {
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

  it("is consumed by the real launcher and returns reservation plus completion receipts", async () => {
    const taskGraph = graph();
    const store = new MaoFileRunStore(root);
    await store.createRun(taskGraph);
    const delegationRoot = await mkdtemp(join(tmpdir(), "mao-delegation-ledger-"));
    try {
      const delegationStore = new MaoFileDelegationLedgerStore(delegationRoot);
      await delegationStore.createLedger(taskGraph.taskGraphId, { globalMaxChildren: 3, parentMaxChildren: 2, maxDepth: 3 });
      const launcher = new MaoOperationalWorkerLauncher(
        store,
        createMaoDelegationAdapter(),
        new MaoLifecycleController("2026-08-29T00:00:00.000Z"),
        delegationStore,
      );
      const result = await launcher.launch({
        taskGraphId: taskGraph.taskGraphId,
        taskId: "child-1",
        admission: {
          taskGraphId: taskGraph.taskGraphId,
          decision: "BOUNDED_ROLE_PLAN_ADMITTED",
          approvalRequired: false,
          admittedRoles: ["worker"],
        },
        capability: { role: "worker", requiredCapabilities: ["text-generation"], offeredCapabilities: ["text-generation"] },
        inputManifest: ["BRIGADE-MAO-R1"],
        launchIdempotencyKey: "launch-child-1",
        delegation: { parentTaskId: "root", depth: 1, reservationKey: "root:child-1" },
      });

      expect(result).toMatchObject({
        ok: true,
        reservationReceipt: { parentTaskId: "root", childTaskId: "child-1", replayed: false },
        completionReceipt: { outcome: "succeeded", released: true, wakeParent: true },
      });

      const replayed = await delegationStore.replay(taskGraph.taskGraphId);
      expect(replayed.ok).toBe(true);
      if (replayed.ok) {
        expect(replayed.coordinator.snapshot().globalActive).toBe(0);
      }
    } finally {
      await rm(delegationRoot, { recursive: true, force: true });
    }
  });

  it("fails closed when delegation metadata has no coordinator and does not invoke the adapter", async () => {
    const taskGraph = graph();
    const store = new MaoFileRunStore(root);
    await store.createRun(taskGraph);
    let calls = 0;
    const launcher = new MaoOperationalWorkerLauncher(
      store,
      { invoke: (request) => { calls += 1; return createMaoDelegationAdapter().invoke(request); } },
      new MaoLifecycleController("2026-08-29T00:00:00.000Z"),
    );
    const result = await launcher.launch({
      taskGraphId: taskGraph.taskGraphId,
      taskId: "child-1",
      admission: {
        taskGraphId: taskGraph.taskGraphId,
        decision: "BOUNDED_ROLE_PLAN_ADMITTED",
        approvalRequired: false,
        admittedRoles: ["worker"],
      },
      capability: { role: "worker", requiredCapabilities: ["text-generation"], offeredCapabilities: ["text-generation"] },
      inputManifest: ["BRIGADE-MAO-R1"],
      launchIdempotencyKey: "launch-child-1",
      delegation: { parentTaskId: "root", depth: 1, reservationKey: "root:child-1" },
    });
    expect(result).toMatchObject({ ok: false, reason: "DELEGATION_RESERVATION_REJECTED" });
    expect(calls).toBe(0);
  });
});
