// CVF MAO-OA-T3 - Operational Worker Launcher Focused Tests
//
// Covers successful fresh launch (admitted/running/succeeded order), durable
// restart replay, duplicate launch key (single adapter call), adapter
// rejection, durable append rejection stopping later milestones, liveness-
// only heartbeat, deterministic timeout boundary, cancellation blocking and
// idempotent acceptance, terminal-cancelled restart, unknown graph/task
// failure, and local-barrel export. Every test creates its own isolated root
// directory under the OS temp root via fs.mkdtemp and removes it in
// afterEach so no test artifact remains longer than the test run.

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { compileTaskGraph } from "../src/mao/task.graph.contract";
import type { MaoAuthorityEnvelopeInput, MaoTaskDefinitionInput, MaoTaskGraph } from "../src/mao/task.graph.contract";
import { MaoFileRunStore } from "../src/mao/durable.run.store";
import { createMaoDelegationAdapter } from "../src/mao/delegation.adapter.contract";
import type { MaoAdmissionReceiptLike, MaoCapabilityDeclaration, MaoInvocationRequest, MaoInvocationResult } from "../src/mao/delegation.adapter.contract";
import { MaoLifecycleController } from "../src/mao/lifecycle.controller.contract";
import { MaoOperationalWorkerLauncher } from "../src/mao/operational.worker.launcher";
import type { MaoOperationalAdapterPort, MaoOperationalLaunchRequest } from "../src/mao/operational.worker.launcher";
import { MaoOperationalWorkerLauncher as BarrelLauncher } from "../src/mao";

const WORK_ORDER_ID =
  "docs/work_orders/CVF_AGENT_WORK_ORDER_MAO_OA_T3_OPERATIONAL_WORKER_LAUNCHER_AND_LIVENESS_WIRING_2026-07-17.md";

function authorityInput(overrides: Partial<MaoAuthorityEnvelopeInput> = {}): MaoAuthorityEnvelopeInput {
  return {
    workOrderId: WORK_ORDER_ID,
    route: "SINGLE_AGENT_SINGLE_ROLE",
    riskLevel: "R2",
    budget: { maxInvocations: 5, maxConcurrentRoles: 1, maxRevisionDepth: 1, tokenCostCeiling: null, wallClockCeilingMs: null },
    closerActorId: "reviewer-1",
    approvalCheckpoints: [],
    ...overrides,
  };
}

function workerTask(taskId: string): MaoTaskDefinitionInput {
  return { taskId, role: "worker", riskLevel: "R2", fileScope: [`src/${taskId}.ts`] };
}

function compileGraph(overrides: Partial<MaoAuthorityEnvelopeInput> = {}): MaoTaskGraph {
  const result = compileTaskGraph({ authority: authorityInput(overrides), tasks: [workerTask("t1")] });
  if (!result.ok) throw new Error(`test setup failure: ${result.reason} - ${result.detail}`);
  return result.graph;
}

function admittedReceipt(graph: MaoTaskGraph): MaoAdmissionReceiptLike {
  return { taskGraphId: graph.taskGraphId, decision: "SINGLE_WORKER_ADMITTED", approvalRequired: false, admittedRoles: ["worker"] };
}

function capability(): MaoCapabilityDeclaration {
  return { role: "worker", requiredCapabilities: ["text-generation"], offeredCapabilities: ["text-generation"] };
}

function launchRequestFor(graph: MaoTaskGraph, overrides: Partial<MaoOperationalLaunchRequest> = {}): MaoOperationalLaunchRequest {
  return {
    taskGraphId: graph.taskGraphId,
    taskId: "t1",
    admission: admittedReceipt(graph),
    capability: capability(),
    inputManifest: [WORK_ORDER_ID],
    launchIdempotencyKey: "launch-key-1",
    ...overrides,
  };
}

/** Adapter stub that always rejects, to exercise the ADAPTER_REJECTED path without depending on the real adapter's own rejection reasons. */
function rejectingAdapter(): MaoOperationalAdapterPort {
  return {
    invoke(): MaoInvocationResult {
      return {
        ok: false,
        reason: "REJECTED_MISSING_CAPABILITY",
        detail: "test stub always rejects",
        diagnosticClass: "NON_RETRYABLE_SCOPE_BREACH",
      };
    },
  };
}

/** Adapter wrapper that counts invoke() calls without altering behavior. */
function countingAdapter(inner: MaoOperationalAdapterPort): { adapter: MaoOperationalAdapterPort; callCount: () => number } {
  let calls = 0;
  return {
    adapter: {
      invoke(request: MaoInvocationRequest): MaoInvocationResult {
        calls += 1;
        return inner.invoke(request);
      },
    },
    callCount: () => calls,
  };
}

/**
 * Manually drives task t1 to a durable `running` state without ever calling
 * launch(), so timeout/cancel tests can observe a mid-flight invocation. The
 * real fake/local adapter completes synchronously inside launch(), so
 * launch() alone always reaches terminal `succeeded` within one call and
 * never leaves the task observably `running` between calls.
 */
async function driveToRunningState(targetStore: MaoFileRunStore, graph: MaoTaskGraph, occurredAt: string): Promise<void> {
  await targetStore.appendEvent(graph.taskGraphId, {
    taskGraphId: graph.taskGraphId,
    taskId: "t1",
    eventType: "GRAPH_COMPILED",
    resultingState: "planned",
    occurredAt,
  });
  await targetStore.appendEvent(graph.taskGraphId, {
    taskGraphId: graph.taskGraphId,
    taskId: "t1",
    eventType: "TASK_ADMITTED",
    resultingState: "admitted",
    occurredAt,
  });
  await targetStore.appendEvent(graph.taskGraphId, {
    taskGraphId: graph.taskGraphId,
    taskId: "t1",
    eventType: "INVOCATION_STARTED",
    resultingState: "running",
    occurredAt,
  });
}

/** Store wrapper whose appendEvent rejects every call, to exercise durable-append-rejection-stops-later-milestones. */
function appendAlwaysFailsStore(inner: MaoFileRunStore): MaoFileRunStore {
  return Object.assign(Object.create(Object.getPrototypeOf(inner)), inner, {
    appendEvent: async () => ({ ok: false as const, reason: "IO_FAILURE" as const, detail: "test stub forces append failure" }),
  });
}

describe("MaoOperationalWorkerLauncher", () => {
  let root: string;
  let store: MaoFileRunStore;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "mao-operational-worker-launcher-"));
    store = new MaoFileRunStore(root);
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("exports MaoOperationalWorkerLauncher from the MAO local barrel", () => {
    expect(BarrelLauncher).toBe(MaoOperationalWorkerLauncher);
  });

  // --- Successful launch sequence ---

  it("persists admitted, running, and succeeded in order on a successful fresh launch", async () => {
    const graph = compileGraph();
    const createResult = await store.createRun(graph);
    expect(createResult.ok).toBe(true);

    const lifecycle = new MaoLifecycleController("2026-07-17T00:00:00.000Z");
    const launcher = new MaoOperationalWorkerLauncher(store, createMaoDelegationAdapter(), lifecycle);

    const result = await launcher.launch(launchRequestFor(graph));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.replayed).toBe(false);
      expect(result.durableEvidence.map((e) => e.eventType)).toEqual([
        "GRAPH_COMPILED",
        "TASK_ADMITTED",
        "INVOCATION_STARTED",
        "INVOCATION_COMPLETED",
      ]);
      expect(result.durableEvidence.map((e) => e.resultingState)).toEqual(["planned", "admitted", "running", "succeeded"]);
      expect(result.invocationResult.receipt.taskId).toBe("t1");
    }
  });

  it("calls the adapter exactly once for a successful launch", async () => {
    const graph = compileGraph();
    await store.createRun(graph);
    const lifecycle = new MaoLifecycleController("2026-07-17T00:00:00.000Z");
    const { adapter, callCount } = countingAdapter(createMaoDelegationAdapter());
    const launcher = new MaoOperationalWorkerLauncher(store, adapter, lifecycle);

    const result = await launcher.launch(launchRequestFor(graph));
    expect(result.ok).toBe(true);
    expect(callCount()).toBe(1);
  });

  // --- Durable resume/replay across a new store instance ---

  it("reproduces terminal succeeded state via durable resume after creating a new store instance", async () => {
    const graph = compileGraph();
    await store.createRun(graph);
    const lifecycle = new MaoLifecycleController("2026-07-17T00:00:00.000Z");
    const launcher = new MaoOperationalWorkerLauncher(store, createMaoDelegationAdapter(), lifecycle);
    await launcher.launch(launchRequestFor(graph));

    const freshStore = new MaoFileRunStore(root);
    const resumed = await freshStore.resumeRun(graph.taskGraphId);
    expect(resumed.ok).toBe(true);
    if (resumed.ok) {
      const last = resumed.events[resumed.events.length - 1];
      expect(last.resultingState).toBe("succeeded");
    }
  });

  // --- Duplicate launch key ---

  it("returns a typed duplicate outcome and does not call the adapter twice for the same launch key", async () => {
    const graph = compileGraph();
    await store.createRun(graph);
    const lifecycle = new MaoLifecycleController("2026-07-17T00:00:00.000Z");
    const { adapter, callCount } = countingAdapter(createMaoDelegationAdapter());
    const launcher = new MaoOperationalWorkerLauncher(store, adapter, lifecycle);

    const first = await launcher.launch(launchRequestFor(graph));
    expect(first.ok).toBe(true);

    const second = await launcher.launch(launchRequestFor(graph));
    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.reason).toBe("DUPLICATE_LAUNCH_ADAPTER_NOT_CALLED");
    }
    expect(callCount()).toBe(1);
  });

  it("does not call the adapter twice for the same launch key even against a freshly reconstructed launcher", async () => {
    const graph = compileGraph();
    await store.createRun(graph);
    const { adapter, callCount } = countingAdapter(createMaoDelegationAdapter());
    const launcherA = new MaoOperationalWorkerLauncher(store, adapter, new MaoLifecycleController("2026-07-17T00:00:00.000Z"));
    await launcherA.launch(launchRequestFor(graph));

    const launcherB = new MaoOperationalWorkerLauncher(new MaoFileRunStore(root), adapter, new MaoLifecycleController("2026-07-17T00:05:00.000Z"));
    const second = await launcherB.launch(launchRequestFor(graph));
    expect(second.ok).toBe(false);
    expect(callCount()).toBe(1);
  });

  // --- Adapter rejection ---

  it("treats adapter authority/admission/capability rejection as a failure and does not claim success", async () => {
    const graph = compileGraph();
    await store.createRun(graph);
    const lifecycle = new MaoLifecycleController("2026-07-17T00:00:00.000Z");
    const launcher = new MaoOperationalWorkerLauncher(store, rejectingAdapter(), lifecycle);

    const result = await launcher.launch(launchRequestFor(graph));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("ADAPTER_REJECTED");
      expect(result.adapterRejectionReason).toBe("REJECTED_MISSING_CAPABILITY");
      expect(result.durableEvidence.some((e) => e.eventType === "INVOCATION_STARTED")).toBe(false);
    }
  });

  it.each([
    {
      label: "admission denial",
      overrides: (graph: MaoTaskGraph): Partial<MaoOperationalLaunchRequest> => ({
        admission: { ...admittedReceipt(graph), decision: "REJECTED" },
      }),
      expectedReason: "REJECTED_ADMISSION_DECISION_REJECTED",
    },
    {
      label: "authority role exclusion",
      overrides: (graph: MaoTaskGraph): Partial<MaoOperationalLaunchRequest> => ({
        admission: { ...admittedReceipt(graph), admittedRoles: [] },
      }),
      expectedReason: "REJECTED_ROLE_NOT_ADMITTED",
    },
    {
      label: "capability rejection",
      overrides: (): Partial<MaoOperationalLaunchRequest> => ({
        capability: { ...capability(), offeredCapabilities: [] },
      }),
      expectedReason: "REJECTED_MISSING_CAPABILITY",
    },
  ])("preserves the real adapter $label as an exact typed failure", async ({ overrides, expectedReason }) => {
    const graph = compileGraph();
    await store.createRun(graph);
    const launcher = new MaoOperationalWorkerLauncher(
      store,
      createMaoDelegationAdapter(),
      new MaoLifecycleController("2026-07-17T00:00:00.000Z"),
    );

    const result = await launcher.launch(launchRequestFor(graph, overrides(graph)));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("ADAPTER_REJECTED");
      expect(result.adapterRejectionReason).toBe(expectedReason);
      expect(result.durableEvidence.some((event) => event.eventType === "INVOCATION_STARTED")).toBe(false);
      expect(result.durableEvidence.at(-1)?.resultingState).toBe("blocked");
    }
  });

  // --- Durable append rejection stops later milestones ---

  it("stops later milestones when durable append fails after admission", async () => {
    const graph = compileGraph();
    await store.createRun(graph);
    const failingStore = appendAlwaysFailsStore(store);
    const lifecycle = new MaoLifecycleController("2026-07-17T00:00:00.000Z");
    const launcher = new MaoOperationalWorkerLauncher(failingStore, createMaoDelegationAdapter(), lifecycle);

    const result = await launcher.launch(launchRequestFor(graph));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("DURABLE_STORE_REJECTED");
      expect(result.durableEvidence).toEqual([]);
    }

    const freshStore = new MaoFileRunStore(root);
    const resumed = await freshStore.resumeRun(graph.taskGraphId);
    expect(resumed.ok).toBe(true);
    if (resumed.ok) expect(resumed.events).toEqual([]);
  });

  // --- Heartbeat ---

  it("returns a liveness-only heartbeat and writes no durable event", async () => {
    const graph = compileGraph();
    await store.createRun(graph);
    const lifecycle = new MaoLifecycleController("2026-07-17T00:00:00.000Z");
    const launcher = new MaoOperationalWorkerLauncher(store, createMaoDelegationAdapter(), lifecycle);

    const result = await launcher.heartbeat(graph.taskGraphId, "t1");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.livenessOnly).toBe(true);

    const resumed = await store.resumeRun(graph.taskGraphId);
    expect(resumed.ok).toBe(true);
    if (resumed.ok) expect(resumed.events).toEqual([]);
  });

  it("advances heartbeat staleness deterministically through the injected clock", async () => {
    const graph = compileGraph();
    await store.createRun(graph);
    const lifecycle = new MaoLifecycleController("2026-07-17T00:00:00.000Z");
    const launcher = new MaoOperationalWorkerLauncher(store, createMaoDelegationAdapter(), lifecycle);

    await launcher.heartbeat(graph.taskGraphId, "t1");
    expect(lifecycle.isHeartbeatStale("t1", 1000)).toBe(false);
    lifecycle.advanceClock(2000);
    expect(lifecycle.isHeartbeatStale("t1", 1000)).toBe(true);
  });

  it("fails closed on heartbeat for an unknown task", async () => {
    const graph = compileGraph();
    await store.createRun(graph);
    const lifecycle = new MaoLifecycleController("2026-07-17T00:00:00.000Z");
    const launcher = new MaoOperationalWorkerLauncher(store, createMaoDelegationAdapter(), lifecycle);

    const result = await launcher.heartbeat(graph.taskGraphId, "does-not-exist");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("UNKNOWN_TASK");
  });

  // --- Timeout ---

  it("writes nothing at the ceiling and exactly one timed-out milestone once strictly exceeded", async () => {
    const graph = compileGraph();
    await store.createRun(graph);
    const lifecycle = new MaoLifecycleController("2026-07-17T00:00:00.000Z");
    await driveToRunningState(store, graph, lifecycle.clock.now());
    const launcher = new MaoOperationalWorkerLauncher(store, createMaoDelegationAdapter(), lifecycle);

    lifecycle.advanceClock(1000);
    const atCeiling = await launcher.recordTimeout(graph.taskGraphId, "t1", 1000);
    expect(atCeiling.ok).toBe(true);
    if (atCeiling.ok) expect(atCeiling.timedOut).toBe(false);

    lifecycle.advanceClock(1);
    const overCeiling = await launcher.recordTimeout(graph.taskGraphId, "t1", 1000);
    expect(overCeiling.ok).toBe(true);
    if (overCeiling.ok && overCeiling.timedOut) {
      expect(overCeiling.entry.eventType).toBe("TIMEOUT_DETECTED");
      expect(overCeiling.entry.resultingState).toBe("timed_out");
    }

    const repeated = await launcher.recordTimeout(graph.taskGraphId, "t1", 1000);
    expect(repeated.ok).toBe(false);
    if (!repeated.ok) expect(repeated.reason).toBe("ALREADY_TERMINAL");

    const resumed = await store.resumeRun(graph.taskGraphId);
    expect(resumed.ok).toBe(true);
    if (resumed.ok) {
      const timeoutEvents = resumed.events.filter((e) => e.eventType === "TIMEOUT_DETECTED");
      expect(timeoutEvents).toHaveLength(1);
    }
  });

  // --- Cancellation ---

  it("blocks launch before adapter invocation once cancellation is requested", async () => {
    const graph = compileGraph();
    await store.createRun(graph);
    const lifecycle = new MaoLifecycleController("2026-07-17T00:00:00.000Z");
    const { adapter, callCount } = countingAdapter(createMaoDelegationAdapter());
    const launcher = new MaoOperationalWorkerLauncher(store, adapter, lifecycle);

    const requested = launcher.requestCancellation("t1");
    expect(requested.ok).toBe(true);

    const result = await launcher.launch(launchRequestFor(graph));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("CANCELLATION_BLOCKS_NEW_CHILD");
    expect(callCount()).toBe(0);
  });

  it("accepts cancellation idempotently and persists exactly one cancelled milestone", async () => {
    const graph = compileGraph();
    await store.createRun(graph);
    const lifecycle = new MaoLifecycleController("2026-07-17T00:00:00.000Z");
    await driveToRunningState(store, graph, lifecycle.clock.now());
    const launcher = new MaoOperationalWorkerLauncher(store, createMaoDelegationAdapter(), lifecycle);

    launcher.requestCancellation("t1");
    const first = await launcher.acceptCancellation(graph.taskGraphId, "t1");
    expect(first.ok).toBe(true);
    if (first.ok) expect(first.alreadyCancelled).toBe(false);

    const second = await launcher.acceptCancellation(graph.taskGraphId, "t1");
    expect(second.ok).toBe(true);
    if (second.ok) expect(second.alreadyCancelled).toBe(true);

    const resumed = await store.resumeRun(graph.taskGraphId);
    expect(resumed.ok).toBe(true);
    if (resumed.ok) {
      const cancelEvents = resumed.events.filter((e) => e.eventType === "CANCEL_ACCEPTED");
      expect(cancelEvents).toHaveLength(1);
    }
  });

  it("keeps terminal cancelled state closed after creating a new launcher and store instance", async () => {
    const graph = compileGraph();
    await store.createRun(graph);
    const lifecycle = new MaoLifecycleController("2026-07-17T00:00:00.000Z");
    await driveToRunningState(store, graph, lifecycle.clock.now());
    const launcher = new MaoOperationalWorkerLauncher(store, createMaoDelegationAdapter(), lifecycle);
    launcher.requestCancellation("t1");
    await launcher.acceptCancellation(graph.taskGraphId, "t1");

    const newLauncher = new MaoOperationalWorkerLauncher(
      new MaoFileRunStore(root),
      createMaoDelegationAdapter(),
      new MaoLifecycleController("2026-07-17T01:00:00.000Z"),
    );
    const secondAccept = await newLauncher.acceptCancellation(graph.taskGraphId, "t1");
    expect(secondAccept.ok).toBe(true);
    if (secondAccept.ok) expect(secondAccept.alreadyCancelled).toBe(true);

    // Durable replay already shows task t1 terminal-cancelled, so the
    // restarted launcher fails closed on the runnable-state check before
    // ever consulting its fresh (necessarily un-cancelled) in-memory
    // lifecycle tracker. This is the durable-truth equivalent of
    // CANCELLATION_BLOCKS_NEW_CHILD: the launch is refused either way, and
    // the refusal source that actually survives a restart is durable state.
    const relaunch = await newLauncher.launch(launchRequestFor(graph, { launchIdempotencyKey: "launch-key-2" }));
    expect(relaunch.ok).toBe(false);
    if (!relaunch.ok) expect(relaunch.reason).toBe("UNKNOWN_OR_NON_RUNNABLE_TASK");
  });

  // --- Unknown graph/task and invalid state ---

  it("fails closed with DURABLE_STORE_REJECTED when the graph has never been created", async () => {
    const graph = compileGraph();
    const lifecycle = new MaoLifecycleController("2026-07-17T00:00:00.000Z");
    const launcher = new MaoOperationalWorkerLauncher(store, createMaoDelegationAdapter(), lifecycle);

    const result = await launcher.launch(launchRequestFor(graph));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("DURABLE_STORE_REJECTED");
  });

  it("fails closed with UNKNOWN_OR_NON_RUNNABLE_TASK for an undeclared task", async () => {
    const graph = compileGraph();
    await store.createRun(graph);
    const lifecycle = new MaoLifecycleController("2026-07-17T00:00:00.000Z");
    const launcher = new MaoOperationalWorkerLauncher(store, createMaoDelegationAdapter(), lifecycle);

    const result = await launcher.launch(launchRequestFor(graph, { taskId: "does-not-exist" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("UNKNOWN_OR_NON_RUNNABLE_TASK");
  });

  it("fails closed with UNKNOWN_OR_NON_RUNNABLE_TASK when the task is already terminal-succeeded", async () => {
    const graph = compileGraph();
    await store.createRun(graph);
    const lifecycle = new MaoLifecycleController("2026-07-17T00:00:00.000Z");
    const launcher = new MaoOperationalWorkerLauncher(store, createMaoDelegationAdapter(), lifecycle);
    await launcher.launch(launchRequestFor(graph));

    const relaunch = await launcher.launch(launchRequestFor(graph, { launchIdempotencyKey: "launch-key-3" }));
    expect(relaunch.ok).toBe(false);
    if (!relaunch.ok) expect(relaunch.reason).toBe("UNKNOWN_OR_NON_RUNNABLE_TASK");
  });

  // --- Source import discipline ---

  it("imports no control-plane, router, or provider/network owner in its source", async () => {
    const { readFile } = await import("node:fs/promises");
    const sourcePath = join(__dirname, "..", "src", "mao", "operational.worker.launcher.ts");
    const source = await readFile(sourcePath, "utf8");
    expect(source).not.toMatch(/CVF_CONTROL_PLANE_FOUNDATION/);
    expect(source).not.toMatch(/ProviderRouterContract/);
    expect(source).not.toMatch(/node:https?/);
    expect(source).not.toMatch(/node:child_process/);
  });
});
