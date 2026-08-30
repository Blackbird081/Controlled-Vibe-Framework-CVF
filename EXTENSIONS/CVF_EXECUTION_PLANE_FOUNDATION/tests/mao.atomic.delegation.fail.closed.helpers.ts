// Shared fixtures for atomic delegation fail-closed adversarial suites.

import { mkdtemp, rm, chmod } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";

import { compileTaskGraph } from "../src/mao/task.graph.contract";
import type { MaoTaskGraph } from "../src/mao/task.graph.contract";
import { MaoFileRunStore } from "../src/mao/durable.run.store";
import { createMaoDelegationAdapter } from "../src/mao/delegation.adapter.contract";
import { MaoLifecycleController } from "../src/mao/lifecycle.controller.contract";
import { MaoOperationalWorkerLauncher } from "../src/mao/operational.worker.launcher";
import {
  MaoFileDelegationLedgerStore,
  MAO_DELEGATION_LOCK_STALE_AFTER_MS,
  delegationLockFilePathFor,
  acquireLock,
  releaseLock,
  readLockFileContent,
  writeLockFileContentForTest,
} from "../src/mao/durable.delegation.ledger.store";
import type { MaoDurableDelegationPort } from "../src/mao/durable.delegation.ledger.store";

const AUTHORITY_HASH = "test-authority-hash";
const BUDGET_CEILING = 20;

export function reservation(
  parentTaskId: string,
  childTaskId: string,
  depth: number,
  taskGraphId: string,
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

export function pilotGraph(): MaoTaskGraph {
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

/**
 * Single-task graph variant of `pilotGraph`, parameterized on taskId, for
 * same-task/cross-attempt adversarial tests where two SEPARATE reservations
 * (different reservationKey, different launchIdempotencyKey) are opened for
 * the SAME taskId. A higher budget ceiling than `pilotGraph`'s default
 * accommodates both reservations consuming the shared authority's
 * invocation budget.
 */
export function pilotGraphFor(taskId: string): MaoTaskGraph {
  const result = compileTaskGraph({
    authority: {
      workOrderId: "BRIGADE-MAO-R1",
      route: "MULTI_AGENT_SINGLE_ROLE",
      riskLevel: "R1",
      budget: {
        maxInvocations: 4,
        maxConcurrentRoles: 2,
        maxRevisionDepth: 1,
        tokenCostCeiling: null,
        wallClockCeilingMs: null,
      },
      closerActorId: "closer-1",
      approvalCheckpoints: [],
    },
    tasks: [{ taskId, role: "worker", riskLevel: "R1", fileScope: [`src/${taskId}.ts`] }],
  });
  if (!result.ok) throw new Error(result.detail);
  return result.graph;
}

export function launchRequestFor(graph: MaoTaskGraph, launchIdempotencyKey: string, reservationKey: string) {
  return launchRequestForTask(graph, "child-1", launchIdempotencyKey, reservationKey);
}

export function launchRequestForTask(graph: MaoTaskGraph, taskId: string, launchIdempotencyKey: string, reservationKey: string) {
  return {
    taskGraphId: graph.taskGraphId,
    taskId,
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

/** Two-task variant of `pilotGraph`, for cross-task/cross-settlement adversarial tests. */
export function twoTaskPilotGraph(): MaoTaskGraph {
  const result = compileTaskGraph({
    authority: {
      workOrderId: "BRIGADE-MAO-R1",
      route: "MULTI_AGENT_SINGLE_ROLE",
      riskLevel: "R1",
      budget: {
        maxInvocations: 4,
        maxConcurrentRoles: 2,
        maxRevisionDepth: 1,
        tokenCostCeiling: null,
        wallClockCeilingMs: null,
      },
      closerActorId: "closer-1",
      approvalCheckpoints: [],
    },
    tasks: [
      { taskId: "task-a", role: "worker", riskLevel: "R1", fileScope: ["src/task-a.ts"] },
      { taskId: "task-b", role: "worker", riskLevel: "R1", fileScope: ["src/task-b.ts"] },
    ],
  });
  if (!result.ok) throw new Error(result.detail);
  return result.graph;
}

/**
 * Durably drives `taskId` to a "running" state under a SPECIFIC
 * `launchIdempotencyKey`, with the INVOCATION_STARTED event keyed EXACTLY
 * the way `launch()` itself would key it
 * (`milestoneIdempotencyKey(launchIdempotencyKey, "INVOCATION_STARTED")`).
 * Used to reach `recordTimeout`/`acceptCancellation`'s required "running"
 * precondition directly (bypassing `launch()`, which runs the fake adapter
 * to full completion in one call and cannot be caught mid-invocation),
 * while still producing durable evidence that `terminalEventOwnedByAttempt`
 * can genuinely verify against - unlike a plain `driveToRunningState`-style
 * helper with no idempotencyKey at all, this lets a test prove ownership
 * resolves correctly for TIMEOUT_DETECTED/CANCEL_ACCEPTED evidence.
 */
export async function driveToRunningStateForAttempt(
  runStore: MaoFileRunStore,
  graph: MaoTaskGraph,
  taskId: string,
  launchIdempotencyKey: string,
  occurredAt: string,
): Promise<void> {
  await runStore.appendEvent(graph.taskGraphId, {
    taskGraphId: graph.taskGraphId,
    taskId,
    eventType: "GRAPH_COMPILED",
    resultingState: "planned",
    occurredAt,
  });
  await runStore.appendEvent(graph.taskGraphId, {
    taskGraphId: graph.taskGraphId,
    taskId,
    eventType: "TASK_ADMITTED",
    resultingState: "admitted",
    occurredAt,
    idempotencyKey: `${launchIdempotencyKey}::TASK_ADMITTED`,
  });
  await runStore.appendEvent(graph.taskGraphId, {
    taskGraphId: graph.taskGraphId,
    taskId,
    eventType: "INVOCATION_STARTED",
    resultingState: "running",
    occurredAt,
    idempotencyKey: `${launchIdempotencyKey}::INVOCATION_STARTED`,
  });
}

/**
 * Deterministic, path-safe run-store snapshot filename for a taskGraphId -
 * mirrors MaoFileRunStore's own private `snapshotFileNameFor` (SHA-256 hex
 * digest + ".json") exactly, so a test can locate and manipulate the real
 * on-disk snapshot file MaoFileRunStore.appendEvent writes to, without any
 * production code changes or test-only backdoors in durable.run.store.ts.
 */
function runStoreSnapshotFileNameFor(taskGraphId: string): string {
  const digest = createHash("sha256").update(taskGraphId, "utf8").digest("hex");
  return `${digest}.json`;
}

/**
 * Make the real run-store snapshot file for `taskGraphId` read-only, so the
 * NEXT `MaoFileRunStore.appendEvent` call against it genuinely fails at the
 * filesystem layer (Windows respects the read-only file attribute and
 * rejects a rename-over with a real EPERM; this is confirmed empirically -
 * chmod on a DIRECTORY does not block writes on this platform, but chmod on
 * the TARGET FILE itself does block a rename onto it). This injects an
 * ACTUAL create/append/run-store I/O failure, not a substituted successful
 * run plus a merely-failing settlement mock (requirement 3).
 */
export async function makeRunStoreSnapshotReadOnly(runStoreRoot: string, taskGraphId: string): Promise<string> {
  const snapshotPath = join(runStoreRoot, runStoreSnapshotFileNameFor(taskGraphId));
  await chmod(snapshotPath, 0o444);
  return snapshotPath;
}

export async function restoreRunStoreSnapshotWritable(snapshotPath: string): Promise<void> {
  await chmod(snapshotPath, 0o666);
}

/**
 * A delegation port wrapper that lets a test force `settleDurable` (and
 * optionally `abortCascadeDurable`) to return a chosen TYPED failure result
 * without ever throwing, proving requirement A4's "prove without throwing"
 * requirement distinctly from the existing thrown-exception fault-injection
 * coverage in mao.atomic.delegation.acceptance.cases.test.ts.
 */
export function withTypedSettleFailure(
  port: MaoFileDelegationLedgerStore,
  failure: { reason: "IO_FAILURE" | "CONCURRENT_WRITE_LOST_RACE"; detail: string },
): MaoDurableDelegationPort {
  return {
    reserveDurable: port.reserveDurable.bind(port),
    abortCascadeDurable: port.abortCascadeDurable.bind(port),
    isReservationOpen: port.isReservationOpen.bind(port),
    getReservationIdentity: port.getReservationIdentity.bind(port),
    settleDurable: async () => ({ ok: false, reason: failure.reason, detail: failure.detail }),
  };
}

export function withTypedAbortFailure(
  port: MaoFileDelegationLedgerStore,
  failure: { reason: "IO_FAILURE" | "CONCURRENT_WRITE_LOST_RACE"; detail: string },
): MaoDurableDelegationPort {
  return {
    reserveDurable: port.reserveDurable.bind(port),
    settleDurable: port.settleDurable.bind(port),
    isReservationOpen: port.isReservationOpen.bind(port),
    getReservationIdentity: port.getReservationIdentity.bind(port),
    abortCascadeDurable: async () => ({ ok: false, reason: failure.reason, detail: failure.detail }),
  };
}


export {
  mkdtemp, rm, tmpdir, join, MaoFileRunStore, createMaoDelegationAdapter,
  MaoLifecycleController, MaoOperationalWorkerLauncher, MaoFileDelegationLedgerStore,
  MAO_DELEGATION_LOCK_STALE_AFTER_MS, delegationLockFilePathFor, acquireLock, releaseLock,
  readLockFileContent, writeLockFileContentForTest,
};
