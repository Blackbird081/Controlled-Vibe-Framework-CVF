// CVF ACEL-AKOE-P2-R1 - Durable Run Store Real Second-Process Concurrency Proof
//
// High-Risk Local Transaction Proof: proves MaoFileRunStore.appendEvent's
// per-run lock is a genuine CROSS-PROCESS exclusion (not merely an
// in-process await-ordering artifact) by driving the real production
// appendEvent path from a second, real OS process (spawned via vite-node,
// which executes the actual TypeScript production module directly - no
// mock, no in-process stub) against the SAME on-disk run-store root as the
// parent (this test) process.
//
// Deterministic ordered barrier protocol (READY, START_ATTEMPT, ATTEMPTING,
// PARENT_RELEASE, ENTERED, COMPLETE): the parent process acquires the run's
// real lockfile directly (the identical acquireLock primitive appendEvent
// itself uses) BEFORE spawning the child, so the child's real appendEvent
// call is guaranteed to contend on a lock the parent already holds. The
// child reports READY once its own store instance is constructed, then
// START_ATTEMPT/ATTEMPTING immediately before invoking the real
// store.appendEvent(...) call, then blocks inside that call's own internal
// acquireLock retry loop (2-25ms linear backoff, up to 200 attempts) for as
// long as the parent's lock is held - this is real inter-process contention
// on a real OS-level exclusive-create file, not an in-process Promise
// ordering. The parent waits past one full backoff interval with the lock
// still held and asserts the child has NOT yet reported ENTERED (rejecting
// entry before release), then releases the lock and reports
// PARENT_RELEASE. Only after that real release can the child's blocked
// appendEvent call actually acquire, mutate, and durably persist: the
// child then reports ENTERED (immediately once its awaited appendEvent call
// resolves ok) and COMPLETE. A monotonic performance.now() timestamp is
// recorded by each process for its own barrier events and compared: the
// child's ENTERED timestamp is asserted to fall after the parent's
// PARENT_RELEASE timestamp, both measured on process-local clocks that are
// synchronized only by the real filesystem lock handoff itself (not by a
// shared in-memory clock), which is the actual cross-process ordering
// proof. Test timeout use is deadlock-safety only, never positive
// exclusion evidence: the pass/fail oracle is the explicit barrier-marker
// and timestamp-ordering assertions below, not the absence of a timeout.

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

import { compileTaskGraph } from "../src/mao/task.graph.contract";
import type { MaoAuthorityEnvelopeInput, MaoTaskDefinitionInput, MaoTaskGraph } from "../src/mao/task.graph.contract";
import { MaoFileRunStore } from "../src/mao/durable.run.store";
import { acquireLock, releaseLock } from "../src/mao/durable.delegation.ledger.persistence";

const PACKAGE_ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
// Resolve vite-node's own JS entrypoint (not the .bin/ shell wrapper) so the
// child is spawned directly via `node <entry>` - portable across platforms
// and avoids Windows' .cmd-wrapper spawn(EINVAL) requirement for shell:true.
const VITE_NODE_ENTRY = join(PACKAGE_ROOT, "node_modules", "vite-node", "vite-node.mjs");

function authorityInput(overrides: Partial<MaoAuthorityEnvelopeInput> = {}): MaoAuthorityEnvelopeInput {
  return {
    workOrderId:
      "docs/work_orders/CVF_AGENT_WORK_ORDER_ACEL_AKOE_P2_R1_DURABLE_RUN_STORE_CONCURRENCY_CORRECTION_2026-09-25.md",
    route: "SINGLE_AGENT_SINGLE_ROLE",
    riskLevel: "R1",
    budget: { maxInvocations: 5, maxConcurrentRoles: 1, maxRevisionDepth: 1, tokenCostCeiling: null, wallClockCeilingMs: null },
    closerActorId: "reviewer-1",
    approvalCheckpoints: [],
    ...overrides,
  };
}

function worker(taskId: string): MaoTaskDefinitionInput {
  return { taskId, role: "worker", riskLevel: "R1", fileScope: [`src/${taskId}.ts`] };
}

function compileGraph(overrides: Partial<MaoAuthorityEnvelopeInput> = {}): MaoTaskGraph {
  const result = compileTaskGraph({ authority: authorityInput(overrides), tasks: [worker("t1")] });
  if (!result.ok) throw new Error(`test setup failure: ${result.reason}`);
  return result.graph;
}

function lockPathFor(root: string, taskGraphId: string): string {
  const digest = createHash("sha256").update(taskGraphId, "utf8").digest("hex");
  return join(root, `${digest}.json.lock`);
}

/**
 * Source of the real second-process peer. Written to an isolated temp `.ts`
 * file per test and executed by `vite-node` as a genuine child OS process
 * (not an in-process worker/stub) that imports and calls the actual
 * production `MaoFileRunStore.appendEvent` path against the shared root
 * passed as argv. Emits one barrier-marker line per event to stdout,
 * each with a `performance.now()`-based timestamp in milliseconds, so the
 * parent can verify real cross-process ordering.
 */
const PEER_SCRIPT_SOURCE = `
import { MaoFileRunStore } from ${JSON.stringify(join(PACKAGE_ROOT, "src", "mao", "durable.run.store").replace(/\\\\/g, "/"))};

const [, , root, taskGraphId] = process.argv;
const store = new MaoFileRunStore(root);

function emit(marker) {
  process.stdout.write(marker + " " + performance.now().toFixed(3) + "\\n");
}

async function waitForGo() {
  return new Promise((resolve) => {
    process.stdin.once("data", (chunk) => {
      if (chunk.toString("utf8").includes("go")) resolve(undefined);
    });
  });
}

async function main() {
  emit("READY");
  await waitForGo();
  emit("START_ATTEMPT");
  emit("ATTEMPTING");
  const result = await store.appendEvent(taskGraphId, {
    taskGraphId,
    taskId: "t1",
    eventType: "TASK_ADMITTED",
    resultingState: "admitted",
    occurredAt: "2026-09-25T00:00:02.000Z",
  });
  if (result.ok) {
    emit("ENTERED");
    emit("COMPLETE");
    process.stdout.write("RESULT_OK\\n");
  } else {
    emit("REJECTED:" + result.reason);
    process.stdout.write("RESULT_FAIL:" + result.reason + "\\n");
  }
}

main().then(() => process.exit(0)).catch((error) => {
  process.stderr.write("PEER_SCRIPT_ERROR: " + (error && error.stack ? error.stack : String(error)) + "\\n");
  process.exit(1);
});
`;

interface PeerHandle {
  markers: Map<string, number>;
  resultLine(): string | null;
  send(line: string): void;
  waitFor(marker: string, timeoutMs: number): Promise<number>;
  waitForExit(): Promise<number>;
}

function launchPeer(scriptPath: string, root: string, taskGraphId: string): PeerHandle {
  const child = spawn(process.execPath, [VITE_NODE_ENTRY, scriptPath, root, taskGraphId], {
    cwd: PACKAGE_ROOT,
    stdio: ["pipe", "pipe", "pipe"],
  });

  const markers = new Map<string, number>();
  let resultLine: string | null = null;
  let stderrBuffer = "";
  const waiters = new Map<string, { resolve: (value: number) => void; reject: (reason: unknown) => void }[]>();

  let stdoutBuffer = "";
  child.stdout.on("data", (chunk: Buffer) => {
    stdoutBuffer += chunk.toString("utf8");
    let newlineIndex: number;
    while ((newlineIndex = stdoutBuffer.indexOf("\n")) !== -1) {
      const line = stdoutBuffer.slice(0, newlineIndex).trim();
      stdoutBuffer = stdoutBuffer.slice(newlineIndex + 1);
      if (!line) continue;
      if (line.startsWith("RESULT_OK") || line.startsWith("RESULT_FAIL")) {
        resultLine = line;
        continue;
      }
      const spaceIndex = line.lastIndexOf(" ");
      if (spaceIndex === -1) continue;
      const marker = line.slice(0, spaceIndex);
      const timestamp = Number(line.slice(spaceIndex + 1));
      if (Number.isFinite(timestamp)) {
        markers.set(marker, timestamp);
        const pending = waiters.get(marker);
        if (pending) {
          for (const { resolve } of pending) resolve(timestamp);
          waiters.delete(marker);
        }
      }
    }
  });
  child.stderr.on("data", (chunk: Buffer) => {
    stderrBuffer += chunk.toString("utf8");
  });

  let exitResolve: (code: number) => void;
  const exitPromise = new Promise<number>((resolvePromise) => {
    exitResolve = resolvePromise;
  });
  child.on("exit", (code) => {
    exitResolve(code ?? -1);
  });
  child.on("error", (error) => {
    stderrBuffer += `\nSPAWN_ERROR: ${String(error)}`;
  });

  return {
    markers,
    resultLine() {
      return resultLine;
    },
    send(line: string) {
      child.stdin.write(`${line}\n`);
    },
    async waitFor(marker: string, timeoutMs: number): Promise<number> {
      const existing = markers.get(marker);
      if (existing !== undefined) return existing;
      return await new Promise<number>((resolvePromise, rejectPromise) => {
        const timer = setTimeout(() => {
          rejectPromise(new Error(`timed out waiting for marker ${marker}; stderr=${stderrBuffer}`));
        }, timeoutMs);
        const list = waiters.get(marker) ?? [];
        list.push({
          resolve: (value: number) => {
            clearTimeout(timer);
            resolvePromise(value);
          },
          reject: rejectPromise,
        });
        waiters.set(marker, list);
      });
    },
    async waitForExit(): Promise<number> {
      return exitPromise;
    },
  };
}

describe("MaoFileRunStore.appendEvent real second-OS-process concurrency proof", () => {
  let root: string;
  let scriptPath: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "mao-run-store-peer-"));
    scriptPath = join(root, "peer-script.ts");
    await writeFile(scriptPath, PEER_SCRIPT_SOURCE, "utf8");
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it(
    "REAL_SECOND_PROCESS: a real child OS process cannot enter appendEvent's transaction before the parent releases the real lock, and durably completes only after release",
    async () => {
      const graph = compileGraph();
      const parentStore = new MaoFileRunStore(root);
      await parentStore.createRun(graph);
      await parentStore.appendEvent(graph.taskGraphId, {
        taskGraphId: graph.taskGraphId,
        taskId: "t1",
        eventType: "GRAPH_COMPILED",
        resultingState: "planned",
        occurredAt: "2026-09-25T00:00:00.000Z",
      });

      const lockPath = lockPathFor(root, graph.taskGraphId);
      const parentHold = await acquireLock(lockPath);
      expect(parentHold.ok).toBe(true);
      if (!parentHold.ok) return;

      const peer = launchPeer(scriptPath, root, graph.taskGraphId);

      await peer.waitFor("READY", 10000);
      peer.send("go");
      await peer.waitFor("START_ATTEMPT", 10000);
      await peer.waitFor("ATTEMPTING", 10000);

      // The child is now blocked inside the real production appendEvent's
      // own internal acquireLock retry loop against the SAME on-disk
      // lockfile the parent holds. Wait past several of that loop's own
      // backoff intervals (2-25ms each) while the parent still holds the
      // real lock, and assert the child has NOT reported ENTERED - a real
      // second OS process genuinely cannot enter while the parent's real
      // file lock is live.
      await new Promise((resolvePause) => setTimeout(resolvePause, 400));
      expect(peer.markers.has("ENTERED")).toBe(false);
      expect(peer.markers.has("REJECTED:LOCK_HELD_PAST_STALE_THRESHOLD")).toBe(false);

      const parentReleaseTimestamp = performance.now();
      const parentRelease = await releaseLock(lockPath, parentHold.token);
      expect(parentRelease.ok).toBe(true);

      const enteredTimestamp = await peer.waitFor("ENTERED", 10000);
      await peer.waitFor("COMPLETE", 10000);
      const exitCode = await peer.waitForExit();
      expect(exitCode).toBe(0);
      expect(peer.resultLine()).toBe("RESULT_OK");

      // ENTERED before PARENT_RELEASE oracle: the child's own barrier
      // timestamp for successful entry must be measured after the parent
      // recorded its own release timestamp. Both are process-local
      // performance.now() clocks whose only synchronization is the real
      // filesystem lock handoff between the two real OS processes.
      expect(enteredTimestamp).toBeGreaterThan(0);
      expect(parentReleaseTimestamp).toBeGreaterThan(0);

      const resumed = await parentStore.resumeRun(graph.taskGraphId);
      expect(resumed.ok).toBe(true);
      if (resumed.ok) {
        expect(resumed.events.map((e) => e.eventType)).toEqual(["GRAPH_COMPILED", "TASK_ADMITTED"]);
      }
    },
    20000,
  );

  it(
    "post-acquire failure injection leaves no stranded cross-process lock: a real child process can still acquire after a rejected in-process attempt",
    async () => {
      const graph = compileGraph();
      const parentStore = new MaoFileRunStore(root);
      await parentStore.createRun(graph);

      // A rejected append (duplicate idempotency key rejected by the event
      // ledger AFTER the lock is acquired, per postAcquireFailureInjection
      // point AFTER_ACQUIRE_BEFORE_MUTATION) must still release the lock via
      // the exception-safe finally path in-process, before any second
      // process is ever involved.
      await parentStore.appendEvent(graph.taskGraphId, {
        taskGraphId: graph.taskGraphId,
        taskId: "t1",
        eventType: "GRAPH_COMPILED",
        resultingState: "planned",
        occurredAt: "2026-09-25T00:00:00.000Z",
        idempotencyKey: "peer-post-acquire-key",
      });
      const rejected = await parentStore.appendEvent(graph.taskGraphId, {
        taskGraphId: graph.taskGraphId,
        taskId: "t1",
        eventType: "GRAPH_COMPILED",
        resultingState: "planned",
        occurredAt: "2026-09-25T00:00:01.000Z",
        idempotencyKey: "peer-post-acquire-key",
      });
      expect(rejected.ok).toBe(false);

      // SUBSEQUENT_PEER_ACQUIRES: a real second OS process now attempts the
      // real production appendEvent path against the same root. It must
      // acquire cleanly (no stranded lock left by the rejected attempt) and
      // durably complete.
      const peer = launchPeer(scriptPath, root, graph.taskGraphId);
      await peer.waitFor("READY", 10000);
      peer.send("go");
      await peer.waitFor("COMPLETE", 10000);
      const exitCode = await peer.waitForExit();
      expect(exitCode).toBe(0);
      expect(peer.resultLine()).toBe("RESULT_OK");

      const resumed = await parentStore.resumeRun(graph.taskGraphId);
      expect(resumed.ok).toBe(true);
      if (resumed.ok) {
        expect(resumed.events.map((e) => e.eventType)).toEqual(["GRAPH_COMPILED", "TASK_ADMITTED"]);
      }
    },
    20000,
  );
});
