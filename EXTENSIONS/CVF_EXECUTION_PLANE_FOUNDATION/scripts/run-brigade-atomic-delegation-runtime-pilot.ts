/**
 * Representative BRIGADE-MAO-R1 runtime pilot.
 *
 * Exercises the real operational launcher, file-backed run store, durable
 * delegation ledger, restart/replay, completion serialization, and launcher-
 * owned abort cascade. No provider, network, mock port, or test runner is used.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import { compileTaskGraph, type MaoTaskGraph } from "../src/mao/task.graph.contract";
import { MaoFileRunStore } from "../src/mao/durable.run.store";
import { createMaoDelegationAdapter } from "../src/mao/delegation.adapter.contract";
import { MaoLifecycleController } from "../src/mao/lifecycle.controller.contract";
import { MaoOperationalWorkerLauncher } from "../src/mao/operational.worker.launcher";
import { MaoFileDelegationLedgerStore } from "../src/mao/durable.delegation.ledger.store";

const REPO_ROOT = resolve(__dirname, "..", "..", "..");
const OUTPUT_PATH = resolve(
  REPO_ROOT,
  process.env.CVF_BRIGADE_RUNTIME_PILOT_RESULT_PATH?.trim()
    || "docs/reviews/evidence/brigade-atomic-delegation-runtime-pilot-2026-08-29.json",
);

function requireTrue(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`runtime_pilot_invariant_failed:${message}`);
}

function graphFor(taskIds: readonly string[], workOrderId: string): MaoTaskGraph {
  const result = compileTaskGraph({
    authority: {
      workOrderId,
      route: "MULTI_AGENT_SINGLE_ROLE",
      riskLevel: "R1",
      budget: {
        maxInvocations: 8,
        maxConcurrentRoles: 3,
        maxRevisionDepth: 1,
        tokenCostCeiling: null,
        wallClockCeilingMs: null,
      },
      closerActorId: "brigade-runtime-pilot-closer",
      approvalCheckpoints: [],
    },
    tasks: taskIds.map((taskId) => ({
      taskId,
      role: "worker",
      riskLevel: "R1" as const,
      fileScope: [`runtime-pilot/${taskId}.txt`],
    })),
  });
  requireTrue(result.ok, "task_graph_compile");
  return result.graph;
}

function launchRequest(graph: MaoTaskGraph, taskId: string, launchKey: string, reservationKey: string) {
  return {
    taskGraphId: graph.taskGraphId,
    taskId,
    admission: {
      taskGraphId: graph.taskGraphId,
      decision: "BOUNDED_ROLE_PLAN_ADMITTED" as const,
      approvalRequired: false,
      admittedRoles: ["worker"],
    },
    capability: {
      role: "worker",
      requiredCapabilities: ["text-generation"],
      offeredCapabilities: ["text-generation"],
    },
    inputManifest: ["BRIGADE-MAO-R1-RUNTIME-PILOT"],
    launchIdempotencyKey: launchKey,
    delegation: { parentTaskId: "root", depth: 1, reservationKey },
  };
}

async function reserve(
  store: MaoFileDelegationLedgerStore,
  graph: MaoTaskGraph,
  parentTaskId: string,
  childTaskId: string,
  depth: number,
  launchIdempotencyKey: string,
) {
  const reservationKey = `${parentTaskId}:${childTaskId}`;
  const result = await store.reserveDurable(graph.taskGraphId, {
    taskGraphId: graph.taskGraphId,
    parentTaskId,
    childTaskId,
    depth,
    reservationKey,
    authorityHash: graph.authorityEnvelope.authorityHash,
    invocationBudgetCeiling: graph.authorityEnvelope.budget.maxInvocations,
    launchIdempotencyKey,
  });
  requireTrue(result.ok && result.result.ok, `reserve_${reservationKey}`);
  return result.result.receipt;
}

async function main(): Promise<void> {
  const startedAt = new Date().toISOString();
  const root = await mkdtemp(join(tmpdir(), "cvf-brigade-runtime-pilot-"));
  try {
    const completionGraph = graphFor(["child-a", "child-b"], "BRIGADE-MAO-R1-COMPLETION-PILOT");
    const completionRunRoot = join(root, "completion-run");
    const completionLedgerRoot = join(root, "completion-ledger");
    const runStore = new MaoFileRunStore(completionRunRoot);
    const ledgerStore = new MaoFileDelegationLedgerStore(completionLedgerRoot);
    await runStore.createRun(completionGraph);
    await ledgerStore.createLedger(completionGraph.taskGraphId, {
      globalMaxChildren: 4,
      parentMaxChildren: 4,
      maxDepth: 3,
    });
    await reserve(ledgerStore, completionGraph, "root", "child-a", 1, "launch-child-a");
    await reserve(ledgerStore, completionGraph, "root", "child-b", 1, "launch-child-b");

    const firstLauncher = new MaoOperationalWorkerLauncher(
      runStore,
      createMaoDelegationAdapter(),
      new MaoLifecycleController("2026-08-29T00:00:00.000Z"),
      ledgerStore,
    );
    const first = await firstLauncher.launch(
      launchRequest(completionGraph, "child-a", "launch-child-a", "root:child-a"),
    );
    requireTrue(first.ok && first.completionReceipt, "first_launcher_completion");
    requireTrue(first.completionReceipt.wakeParent === false, "first_completion_must_not_wake_parent");

    // Reconstruct every stateful runtime owner before the second completion.
    const recoveredLedgerStore = new MaoFileDelegationLedgerStore(completionLedgerRoot);
    const recoveredLauncher = new MaoOperationalWorkerLauncher(
      new MaoFileRunStore(completionRunRoot),
      createMaoDelegationAdapter(),
      new MaoLifecycleController("2026-08-29T01:00:00.000Z"),
      recoveredLedgerStore,
    );
    const second = await recoveredLauncher.launch(
      launchRequest(completionGraph, "child-b", "launch-child-b", "root:child-b"),
    );
    requireTrue(second.ok && second.completionReceipt, "second_launcher_completion_after_restart");
    requireTrue(second.completionReceipt.wakeParent === true, "final_completion_must_wake_parent_once");

    const completionReplay = await recoveredLedgerStore.replay(completionGraph.taskGraphId);
    requireTrue(completionReplay.ok, "completion_replay");
    const settleEntries = completionReplay.entries.filter((entry) => entry.operation === "SETTLE");
    const wakeEntries = settleEntries.filter((entry) => entry.wakeParent === true);
    requireTrue(settleEntries.length === 2, "exactly_two_serialized_settlements");
    requireTrue(wakeEntries.length === 1, "exactly_one_parent_wake");
    requireTrue(completionReplay.coordinator.snapshot().globalActive === 0, "completion_capacity_released");

    const abortGraph = graphFor(["parent", "child", "grandchild"], "BRIGADE-MAO-R1-ABORT-PILOT");
    const abortRunStore = new MaoFileRunStore(join(root, "abort-run"));
    const abortLedgerStore = new MaoFileDelegationLedgerStore(join(root, "abort-ledger"));
    await abortRunStore.createRun(abortGraph);
    await abortLedgerStore.createLedger(abortGraph.taskGraphId, {
      globalMaxChildren: 4,
      parentMaxChildren: 4,
      maxDepth: 3,
    });
    await reserve(abortLedgerStore, abortGraph, "parent", "child", 1, "launch-child");
    await reserve(abortLedgerStore, abortGraph, "child", "grandchild", 2, "launch-grandchild");
    const abortLauncher = new MaoOperationalWorkerLauncher(
      abortRunStore,
      createMaoDelegationAdapter(),
      new MaoLifecycleController("2026-08-29T02:00:00.000Z"),
      abortLedgerStore,
    );
    const cancellation = await abortLauncher.requestCancellation(abortGraph.taskGraphId, "parent");
    requireTrue(cancellation.ok && cancellation.cascadeReceipt, "launcher_abort_cascade");
    requireTrue(
      cancellation.cascadeReceipt.releasedLeafFirst.join(",") === "grandchild,child",
      "abort_must_release_leaf_first",
    );
    const abortReplay = await new MaoFileDelegationLedgerStore(join(root, "abort-ledger")).replay(abortGraph.taskGraphId);
    requireTrue(abortReplay.ok, "abort_replay");
    requireTrue(abortReplay.coordinator.snapshot().globalActive === 0, "abort_capacity_released");

    const payload = {
      pilot: "brigade-atomic-delegation-runtime-pilot",
      startedAt,
      finishedAt: new Date().toISOString(),
      verdict: "PASS",
      providerCalls: 0,
      runtimeOwners: [
        "MaoOperationalWorkerLauncher",
        "MaoFileRunStore",
        "MaoFileDelegationLedgerStore",
        "MaoAtomicDelegationLifecycleCoordinator",
      ],
      completionSerialization: {
        launcherRestartedBetweenCompletions: true,
        settleEntryCount: settleEntries.length,
        wakeEntryCount: wakeEntries.length,
        wakeSequence: wakeEntries[0]?.sequence ?? null,
        finalGlobalActive: completionReplay.coordinator.snapshot().globalActive,
      },
      abortCascade: {
        invokedThroughLauncher: true,
        admissionClosed: cancellation.cascadeReceipt.admissionClosed,
        releasedLeafFirst: cancellation.cascadeReceipt.releasedLeafFirst,
        completionCount: cancellation.cascadeReceipt.completions.length,
        replayFinalGlobalActive: abortReplay.coordinator.snapshot().globalActive,
      },
      claimBoundary: "Representative local runtime use only; no provider, distributed process, public release, deployment, or production-readiness claim.",
    };
    mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
    writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    console.log(`BRIGADE-MAO-R1 runtime pilot: PASS receipt=${OUTPUT_PATH}`);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

main().catch((error: unknown) => {
  const safeMessage = error instanceof Error && error.message.startsWith("runtime_pilot_invariant_failed:")
    ? error.message
    : "runtime_pilot_unknown_error";
  console.error(`BRIGADE-MAO-R1 runtime pilot: FAIL ${safeMessage}`);
  process.exit(1);
});
