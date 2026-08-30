// Atomic delegation durable settlement and recovery adversarial tests.

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  mkdtemp,
  rm,
  tmpdir,
  join,
  MaoFileRunStore,
  createMaoDelegationAdapter,
  MaoLifecycleController,
  MaoOperationalWorkerLauncher,
  MaoFileDelegationLedgerStore,
  reservation,
  pilotGraph,
  launchRequestFor,
  makeRunStoreSnapshotReadOnly,
  restoreRunStoreSnapshotWritable,
  withTypedSettleFailure,
} from "./mao.atomic.delegation.fail.closed.helpers";

describe("BRIGADE-MAO-R1 R2-A: delegated success requires a durable completion receipt", () => {
  let runStoreRoot: string;
  let delegationRoot: string;

  beforeEach(async () => {
    runStoreRoot = await mkdtemp(join(tmpdir(), "mao-r2a-run-store-"));
    delegationRoot = await mkdtemp(join(tmpdir(), "mao-r2a-delegation-"));
  });

  afterEach(async () => {
    await rm(runStoreRoot, { recursive: true, force: true });
    await rm(delegationRoot, { recursive: true, force: true });
  });

  for (const failureReason of ["IO_FAILURE", "CONCURRENT_WRITE_LOST_RACE"] as const) {
    it(`fails closed without throwing when settlement returns typed ${failureReason}`, async () => {
      const graph = pilotGraph();
      const runStore = new MaoFileRunStore(runStoreRoot);
      await runStore.createRun(graph);
      const store = new MaoFileDelegationLedgerStore(delegationRoot);
      await store.createLedger(graph.taskGraphId, { globalMaxChildren: 2, parentMaxChildren: 2, maxDepth: 2 });
      const launcher = new MaoOperationalWorkerLauncher(
        runStore,
        createMaoDelegationAdapter(),
        new MaoLifecycleController("2026-08-29T00:00:00.000Z"),
        withTypedSettleFailure(store, { reason: failureReason, detail: "injected typed settlement failure" }),
      );

      const result = await launcher.launch(launchRequestFor(graph, `launch-${failureReason}`, "root:child-1"));

      expect(result).toMatchObject({ ok: false, reason: "DELEGATION_SETTLEMENT_PENDING" });
      expect(result.completionReceipt).toBeUndefined();
      expect(await store.isReservationOpen(graph.taskGraphId, "root:child-1")).toMatchObject({ ok: true, open: true });
      const resumed = await runStore.resumeRun(graph.taskGraphId);
      expect(resumed.ok).toBe(true);
      if (resumed.ok) {
        expect(resumed.events.at(-1)).toMatchObject({ taskId: "child-1", resultingState: "succeeded" });
      }
    });
  }

  it("returns success only when the real store returns the bound durable completion receipt", async () => {
    const graph = pilotGraph();
    const runStore = new MaoFileRunStore(runStoreRoot);
    await runStore.createRun(graph);
    const store = new MaoFileDelegationLedgerStore(delegationRoot);
    await store.createLedger(graph.taskGraphId, { globalMaxChildren: 2, parentMaxChildren: 2, maxDepth: 2 });
    const launcher = new MaoOperationalWorkerLauncher(
      runStore,
      createMaoDelegationAdapter(),
      new MaoLifecycleController("2026-08-29T00:00:00.000Z"),
      store,
    );

    const result = await launcher.launch(launchRequestFor(graph, "launch-confirmed", "root:child-1"));
    expect(result).toMatchObject({
      ok: true,
      reservationReceipt: { reservationKey: "root:child-1", launchIdempotencyKey: "launch-confirmed" },
      completionReceipt: { outcome: "succeeded", released: true, wakeParent: true },
    });
    expect(await store.isReservationOpen(graph.taskGraphId, "root:child-1")).toMatchObject({ ok: true, open: false });
  });

  it("fails closed when transport succeeds but the coordinator rejects settlement", async () => {
    const graph = pilotGraph();
    const runStore = new MaoFileRunStore(runStoreRoot);
    await runStore.createRun(graph);
    const store = new MaoFileDelegationLedgerStore(delegationRoot);
    await store.createLedger(graph.taskGraphId, { globalMaxChildren: 2, parentMaxChildren: 2, maxDepth: 2 });
    const rejectingPort = {
      reserveDurable: store.reserveDurable.bind(store),
      abortCascadeDurable: store.abortCascadeDurable.bind(store),
      isReservationOpen: store.isReservationOpen.bind(store),
      getReservationIdentity: store.getReservationIdentity.bind(store),
      settleDurable: async () => ({
        ok: true as const,
        result: { ok: false as const, reason: "UNKNOWN_RESERVATION" as const, detail: "injected coordinator rejection" },
      }),
    };
    const launcher = new MaoOperationalWorkerLauncher(
      runStore,
      createMaoDelegationAdapter(),
      new MaoLifecycleController("2026-08-29T00:00:00.000Z"),
      rejectingPort as any,
    );

    const result = await launcher.launch(launchRequestFor(graph, "launch-coordinator-reject", "root:child-1"));
    expect(result).toMatchObject({ ok: false, reason: "DELEGATION_SETTLEMENT_PENDING" });
    if (!result.ok) expect(result.detail).toContain("UNKNOWN_RESERVATION");
    expect(await store.isReservationOpen(graph.taskGraphId, "root:child-1")).toMatchObject({ ok: true, open: true });
  });
});

describe("BRIGADE-MAO-R1 R3: public recovery consumes durable failure evidence", () => {
  let runStoreRoot: string;
  let delegationRoot: string;

  beforeEach(async () => {
    runStoreRoot = await mkdtemp(join(tmpdir(), "mao-r3-run-store-"));
    delegationRoot = await mkdtemp(join(tmpdir(), "mao-r3-delegation-"));
  });

  afterEach(async () => {
    await rm(runStoreRoot, { recursive: true, force: true });
    await rm(delegationRoot, { recursive: true, force: true });
  });

  it("recovers an adapter rejection after restart exactly once through reconcileDelegation", async () => {
    const graph = pilotGraph();
    const runStore = new MaoFileRunStore(runStoreRoot);
    await runStore.createRun(graph);
    const store = new MaoFileDelegationLedgerStore(delegationRoot);
    await store.createLedger(graph.taskGraphId, { globalMaxChildren: 2, parentMaxChildren: 2, maxDepth: 2 });
    const launchKey = "launch-adapter-rejected";
    const request = launchRequestFor(graph, launchKey, "root:child-1");
    request.capability.offeredCapabilities = [];
    const launcher = new MaoOperationalWorkerLauncher(
      runStore,
      createMaoDelegationAdapter(),
      new MaoLifecycleController("2026-08-29T00:00:00.000Z"),
      withTypedSettleFailure(store, { reason: "IO_FAILURE", detail: "settlement unavailable" }),
    );

    const rejected = await launcher.launch(request);
    expect(rejected).toMatchObject({ ok: false, reason: "ADAPTER_REJECTED" });
    expect(rejected.completionReceipt).toBeUndefined();
    expect(await store.isReservationOpen(graph.taskGraphId, "root:child-1")).toMatchObject({ ok: true, open: true });

    const recoveredLauncher = new MaoOperationalWorkerLauncher(
      new MaoFileRunStore(runStoreRoot),
      createMaoDelegationAdapter(),
      new MaoLifecycleController("2026-08-29T01:00:00.000Z"),
      new MaoFileDelegationLedgerStore(delegationRoot),
    );
    const recovered = await recoveredLauncher.reconcileDelegation(graph.taskGraphId, "child-1", "root:child-1", launchKey);
    expect(recovered).toMatchObject({
      ok: true,
      reconciled: true,
      completionReceipt: { outcome: "rejected", released: true, wakeParent: true, replayed: false },
    });
    expect(await recoveredLauncher.reconcileDelegation(graph.taskGraphId, "child-1", "root:child-1", launchKey)).toMatchObject({
      ok: true,
      reconciled: false,
    });
    const replay = await store.replay(graph.taskGraphId);
    expect(replay.ok).toBe(true);
    if (replay.ok) {
      expect(replay.entries.filter((entry) => entry.operation === "SETTLE" && entry.reservationKey === "root:child-1")).toHaveLength(1);
    }
  });

  it("rejects a wrong recovery launch key, then permits the durably bound key", async () => {
    const graph = pilotGraph();
    const runStore = new MaoFileRunStore(runStoreRoot);
    await runStore.createRun(graph);
    const store = new MaoFileDelegationLedgerStore(delegationRoot);
    await store.createLedger(graph.taskGraphId, { globalMaxChildren: 2, parentMaxChildren: 2, maxDepth: 2 });
    const launchKey = "launch-bound-rejection";
    const request = launchRequestFor(graph, launchKey, "root:child-1");
    request.capability.offeredCapabilities = [];
    const faultyLauncher = new MaoOperationalWorkerLauncher(
      runStore,
      createMaoDelegationAdapter(),
      new MaoLifecycleController("2026-08-29T00:00:00.000Z"),
      withTypedSettleFailure(store, { reason: "IO_FAILURE", detail: "settlement unavailable" }),
    );
    expect(await faultyLauncher.launch(request)).toMatchObject({ ok: false, reason: "ADAPTER_REJECTED" });

    const recovery = new MaoOperationalWorkerLauncher(
      new MaoFileRunStore(runStoreRoot),
      createMaoDelegationAdapter(),
      new MaoLifecycleController("2026-08-29T01:00:00.000Z"),
      store,
    );
    expect(await recovery.reconcileDelegation(graph.taskGraphId, "child-1", "root:child-1", "launch-wrong")).toMatchObject({
      ok: true,
      reconciled: false,
      identityMismatch: true,
    });
    expect(await store.isReservationOpen(graph.taskGraphId, "root:child-1")).toMatchObject({ ok: true, open: true });
    expect(await recovery.reconcileDelegation(graph.taskGraphId, "child-1", "root:child-1", launchKey)).toMatchObject({
      ok: true,
      reconciled: true,
      completionReceipt: { outcome: "rejected" },
    });
  });

  it("does not reconcile a non-terminal task when no attempt identity is supplied", async () => {
    const graph = pilotGraph();
    const runStore = new MaoFileRunStore(runStoreRoot);
    await runStore.createRun(graph);
    const store = new MaoFileDelegationLedgerStore(delegationRoot);
    await store.createLedger(graph.taskGraphId, { globalMaxChildren: 2, parentMaxChildren: 2, maxDepth: 2 });
    await store.reserve(graph.taskGraphId, reservation("root", "child-1", 1, graph.taskGraphId, "launch-pending"));
    const recovery = new MaoOperationalWorkerLauncher(
      runStore,
      createMaoDelegationAdapter(),
      new MaoLifecycleController("2026-08-29T01:00:00.000Z"),
      store,
    );

    expect(await recovery.reconcileDelegation(graph.taskGraphId, "child-1", "root:child-1")).toMatchObject({
      ok: true,
      reconciled: false,
    });
    expect(await store.isReservationOpen(graph.taskGraphId, "root:child-1")).toMatchObject({ ok: true, open: true });
  });

  it("recovers a genuine post-reservation run-store I/O failure through the public API", async () => {
    const graph = pilotGraph();
    const runStore = new MaoFileRunStore(runStoreRoot);
    await runStore.createRun(graph);
    const store = new MaoFileDelegationLedgerStore(delegationRoot);
    await store.createLedger(graph.taskGraphId, { globalMaxChildren: 2, parentMaxChildren: 2, maxDepth: 2 });
    const launchKey = "launch-run-store-io-failure";
    const snapshotPath = await makeRunStoreSnapshotReadOnly(runStoreRoot, graph.taskGraphId);
    try {
      const launcher = new MaoOperationalWorkerLauncher(
        runStore,
        createMaoDelegationAdapter(),
        new MaoLifecycleController("2026-08-29T00:00:00.000Z"),
        withTypedSettleFailure(store, { reason: "IO_FAILURE", detail: "settlement unavailable" }),
      );
      const failed = await launcher.launch(launchRequestFor(graph, launchKey, "root:child-1"));
      expect(failed).toMatchObject({ ok: false, reason: "DURABLE_STORE_REJECTED" });
      expect(failed.completionReceipt).toBeUndefined();
      expect(await store.isReservationOpen(graph.taskGraphId, "root:child-1")).toMatchObject({ ok: true, open: true });
    } finally {
      await restoreRunStoreSnapshotWritable(snapshotPath);
    }

    const recoveredLauncher = new MaoOperationalWorkerLauncher(
      new MaoFileRunStore(runStoreRoot),
      createMaoDelegationAdapter(),
      new MaoLifecycleController("2026-08-29T01:00:00.000Z"),
      new MaoFileDelegationLedgerStore(delegationRoot),
    );
    const recovered = await recoveredLauncher.reconcileDelegation(graph.taskGraphId, "child-1", "root:child-1", launchKey);
    expect(recovered).toMatchObject({ ok: true, reconciled: true, completionReceipt: { outcome: "failed", released: true } });
    expect(await store.isReservationOpen(graph.taskGraphId, "root:child-1")).toMatchObject({ ok: true, open: false });
  });
});

describe("BRIGADE-MAO-R1 R4: reservation identity is verified before settlement", () => {
  let delegationRoot: string;

  beforeEach(async () => {
    delegationRoot = await mkdtemp(join(tmpdir(), "mao-r4-identity-"));
  });

  afterEach(async () => {
    await rm(delegationRoot, { recursive: true, force: true });
  });

  it("rejects wrong launch and child identities without changing capacity or ledger state", async () => {
    const store = new MaoFileDelegationLedgerStore(delegationRoot);
    const ledgerId = "graph-r4-bound-identity";
    await store.createLedger(ledgerId, { globalMaxChildren: 2, parentMaxChildren: 2, maxDepth: 2 });
    const reserved = await store.reserve(ledgerId, reservation("root", "child-1", 1, ledgerId, "launch-bound"));
    expect(reserved.ok).toBe(true);

    for (const expectedIdentity of [
      { launchIdempotencyKey: "launch-wrong", childTaskId: "child-1" },
      { launchIdempotencyKey: "launch-bound", childTaskId: "child-other" },
    ]) {
      const mismatched = await store.settleDurable(ledgerId, "root:child-1", "succeeded", expectedIdentity);
      expect(mismatched).toMatchObject({ ok: true, result: { ok: false, reason: "IDENTITY_MISMATCH" } });
      expect(await store.isReservationOpen(ledgerId, "root:child-1")).toMatchObject({ ok: true, open: true });
    }

    const beforeGenuineSettle = await store.replay(ledgerId);
    expect(beforeGenuineSettle.ok).toBe(true);
    if (beforeGenuineSettle.ok) {
      expect(beforeGenuineSettle.entries.filter((entry) => entry.operation === "SETTLE")).toHaveLength(0);
      expect(beforeGenuineSettle.coordinator.snapshot().globalActive).toBe(1);
    }
    const genuine = await store.settleDurable(ledgerId, "root:child-1", "succeeded", {
      launchIdempotencyKey: "launch-bound",
      childTaskId: "child-1",
    });
    expect(genuine).toMatchObject({ ok: true, result: { ok: true, receipt: { released: true, replayed: false } } });
  });

  it("persists and returns the complete reservation identity used by recovery", async () => {
    const store = new MaoFileDelegationLedgerStore(delegationRoot);
    const ledgerId = "graph-r4-identity-lookup";
    await store.createLedger(ledgerId, { globalMaxChildren: 2, parentMaxChildren: 2, maxDepth: 2 });
    await store.reserve(ledgerId, reservation("root", "child-1", 1, ledgerId, "launch-identity-lookup"));

    expect(await store.getReservationIdentity(ledgerId, "root:child-1")).toMatchObject({
      ok: true,
      identity: { childTaskId: "child-1", launchIdempotencyKey: "launch-identity-lookup" },
    });
    const reconstructed = new MaoFileDelegationLedgerStore(delegationRoot);
    expect(await reconstructed.getReservationIdentity(ledgerId, "root:child-1")).toMatchObject({
      ok: true,
      identity: { childTaskId: "child-1", launchIdempotencyKey: "launch-identity-lookup" },
    });
  });
});
