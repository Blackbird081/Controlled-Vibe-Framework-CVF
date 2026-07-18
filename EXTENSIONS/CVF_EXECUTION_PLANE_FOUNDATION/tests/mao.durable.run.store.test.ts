// CVF MAO-OA-T2 - Durable Run Store Focused Tests
//
// Covers create, fresh-instance replay, append-after-resume, repeated
// read-only resume, duplicate idempotency key, safe path derivation, missing
// run, corrupt JSON, schema mismatch, authority mismatch, graph mismatch,
// sequence gap, event tamper, invalid transition, and temporary-file
// cleanup. Every test creates its own isolated root directory under the OS
// temp root via fs.mkdtemp and removes it in afterEach so no test artifact
// remains in the repository or the OS temp root longer than the test run.

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdir, mkdtemp, readdir, readFile, rm, stat, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { compileTaskGraph } from "../src/mao/task.graph.contract";
import type { MaoAuthorityEnvelopeInput, MaoTaskDefinitionInput, MaoTaskGraph } from "../src/mao/task.graph.contract";
import {
  MAO_DURABLE_RUN_SNAPSHOT_SCHEMA_VERSION,
  MaoFileRunStore,
} from "../src/mao/durable.run.store";

function authorityInput(overrides: Partial<MaoAuthorityEnvelopeInput> = {}): MaoAuthorityEnvelopeInput {
  return {
    workOrderId:
      "docs/work_orders/CVF_AGENT_WORK_ORDER_MAO_OA_T2_DURABLE_RUN_STORE_REPLAY_RECOVERY_AND_IDEMPOTENT_RESUME_2026-07-16.md",
    route: "SINGLE_AGENT_SINGLE_ROLE",
    riskLevel: "R1",
    budget: {
      maxInvocations: 5,
      maxConcurrentRoles: 1,
      maxRevisionDepth: 1,
      tokenCostCeiling: null,
      wallClockCeilingMs: null,
    },
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

async function listTempArtifacts(root: string): Promise<string[]> {
  const entries = await readdir(root);
  return entries.filter((name) => name.includes(".tmp-"));
}

describe("MaoFileRunStore", () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "mao-durable-run-store-"));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  // --- Constructor ---

  it("throws synchronously on an empty rootDirectory without performing I/O", () => {
    expect(() => new MaoFileRunStore("")).toThrow();
    expect(() => new MaoFileRunStore("   ")).toThrow();
  });

  // --- Create ---

  it("creates a run and persists a versioned zero-event snapshot", async () => {
    const store = new MaoFileRunStore(root);
    const graph = compileGraph();
    const result = await store.createRun(graph);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.snapshot.schemaVersion).toBe(MAO_DURABLE_RUN_SNAPSHOT_SCHEMA_VERSION);
      expect(result.snapshot.graph.taskGraphId).toBe(graph.taskGraphId);
      expect(result.snapshot.events).toEqual([]);
    }
  });

  it("refuses to create a run that already exists (RUN_ALREADY_EXISTS) and leaves the run in place", async () => {
    const store = new MaoFileRunStore(root);
    const graph = compileGraph();
    const first = await store.createRun(graph);
    expect(first.ok).toBe(true);

    const second = await store.createRun(graph);
    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.reason).toBe("RUN_ALREADY_EXISTS");
    }

    const resumed = await store.resumeRun(graph.taskGraphId);
    expect(resumed.ok).toBe(true);
    if (resumed.ok) {
      expect(resumed.events).toEqual([]);
    }
  });

  // --- Fresh-instance replay ---

  it("resumes correctly from a SECOND MaoFileRunStore instance pointed at the same root", async () => {
    const graph = compileGraph();
    const firstStore = new MaoFileRunStore(root);
    await firstStore.createRun(graph);
    const appendResult = await firstStore.appendEvent(graph.taskGraphId, {
      taskGraphId: graph.taskGraphId,
      taskId: "t1",
      eventType: "GRAPH_COMPILED",
      resultingState: "planned",
      occurredAt: "2026-07-16T00:00:00.000Z",
    });
    expect(appendResult.ok).toBe(true);

    const secondStore = new MaoFileRunStore(root);
    const resumed = await secondStore.resumeRun(graph.taskGraphId);
    expect(resumed.ok).toBe(true);
    if (resumed.ok) {
      expect(resumed.graph.taskGraphId).toBe(graph.taskGraphId);
      expect(resumed.events).toHaveLength(1);
      expect(resumed.events[0]?.resultingState).toBe("planned");
      expect(resumed.events[0]?.sequence).toBe(1);
    }
  });

  // --- Append after resume ---

  it("appends a new event after a fresh-instance resume, extending persisted history", async () => {
    const graph = compileGraph();
    const firstStore = new MaoFileRunStore(root);
    await firstStore.createRun(graph);
    await firstStore.appendEvent(graph.taskGraphId, {
      taskGraphId: graph.taskGraphId,
      taskId: "t1",
      eventType: "GRAPH_COMPILED",
      resultingState: "planned",
      occurredAt: "2026-07-16T00:00:00.000Z",
    });

    const secondStore = new MaoFileRunStore(root);
    const appendResult = await secondStore.appendEvent(graph.taskGraphId, {
      taskGraphId: graph.taskGraphId,
      taskId: "t1",
      eventType: "TASK_ADMITTED",
      resultingState: "admitted",
      occurredAt: "2026-07-16T00:01:00.000Z",
    });
    expect(appendResult.ok).toBe(true);
    if (appendResult.ok) {
      expect(appendResult.appendedEntry.sequence).toBe(2);
      expect(appendResult.snapshot.events).toHaveLength(2);
    }

    const finalResume = await secondStore.resumeRun(graph.taskGraphId);
    expect(finalResume.ok).toBe(true);
    if (finalResume.ok) {
      expect(finalResume.events.map((e) => e.resultingState)).toEqual(["planned", "admitted"]);
    }
  });

  // --- Repeated read-only resume ---

  it("returns deeply-equal results across repeated resumeRun calls and never writes", async () => {
    const graph = compileGraph();
    const store = new MaoFileRunStore(root);
    await store.createRun(graph);
    await store.appendEvent(graph.taskGraphId, {
      taskGraphId: graph.taskGraphId,
      taskId: "t1",
      eventType: "GRAPH_COMPILED",
      resultingState: "planned",
      occurredAt: "2026-07-16T00:00:00.000Z",
    });

    const files = await readdir(root);
    const snapshotFile = files.find((name) => name.endsWith(".json"));
    expect(snapshotFile).toBeDefined();
    const snapshotPath = join(root, snapshotFile as string);
    const bytesBefore = await readFile(snapshotPath, "utf8");
    const mtimeBefore = (await stat(snapshotPath)).mtimeMs;

    const first = await store.resumeRun(graph.taskGraphId);
    const second = await store.resumeRun(graph.taskGraphId);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(first.events).toEqual(second.events);
      expect(first.graph).toEqual(second.graph);
    }

    const bytesAfter = await readFile(snapshotPath, "utf8");
    const mtimeAfter = (await stat(snapshotPath)).mtimeMs;
    expect(bytesAfter).toBe(bytesBefore);
    expect(mtimeAfter).toBe(mtimeBefore);
  });

  // --- Duplicate idempotency key ---

  it("rejects a duplicate idempotency key and leaves snapshot bytes unchanged", async () => {
    const graph = compileGraph();
    const store = new MaoFileRunStore(root);
    await store.createRun(graph);
    const firstAppend = await store.appendEvent(graph.taskGraphId, {
      taskGraphId: graph.taskGraphId,
      taskId: "t1",
      eventType: "GRAPH_COMPILED",
      resultingState: "planned",
      occurredAt: "2026-07-16T00:00:00.000Z",
      idempotencyKey: "dup-key-1",
    });
    expect(firstAppend.ok).toBe(true);

    const files = await readdir(root);
    const snapshotFile = files.find((name) => name.endsWith(".json")) as string;
    const snapshotPath = join(root, snapshotFile);
    const bytesBefore = await readFile(snapshotPath, "utf8");

    const duplicateAppend = await store.appendEvent(graph.taskGraphId, {
      taskGraphId: graph.taskGraphId,
      taskId: "t1",
      eventType: "GRAPH_COMPILED",
      resultingState: "planned",
      occurredAt: "2026-07-16T00:02:00.000Z",
      idempotencyKey: "dup-key-1",
    });
    expect(duplicateAppend.ok).toBe(false);
    if (!duplicateAppend.ok) {
      expect(duplicateAppend.reason).toBe("EVENT_REPLAY_REJECTED");
    }

    const bytesAfter = await readFile(snapshotPath, "utf8");
    expect(bytesAfter).toBe(bytesBefore);

    const resumed = await store.resumeRun(graph.taskGraphId);
    expect(resumed.ok).toBe(true);
    if (resumed.ok) {
      expect(resumed.events).toHaveLength(1);
    }
  });

  // --- Safe path derivation ---

  it("derives a safe hashed filename and never lets a path-traversal taskGraphId escape the root", async () => {
    const store = new MaoFileRunStore(root);
    const maliciousGraph = compileGraph({ workOrderId: "path-traversal-probe" });
    const traversalId = "../../etc/passwd";
    const graphWithTraversalId: MaoTaskGraph = { ...maliciousGraph, taskGraphId: traversalId };

    const createResult = await store.createRun(graphWithTraversalId);
    // Authority hash is bound to the original graph content, not taskGraphId,
    // so this create call still succeeds; what matters is where it writes.
    expect(createResult.ok).toBe(true);

    const filesInRoot = await readdir(root);
    for (const name of filesInRoot) {
      expect(name).not.toContain("..");
      expect(name).not.toContain("/");
      expect(name).not.toContain("\\");
    }

    const parentDir = join(root, "..");
    const parentEntriesBefore = await readdir(parentDir);
    expect(parentEntriesBefore).not.toContain("passwd");

    const resumed = await store.resumeRun(traversalId);
    expect(resumed.ok).toBe(true);
  });

  // --- Missing run ---

  it("returns RUN_NOT_FOUND for resumeRun on a nonexistent taskGraphId", async () => {
    const store = new MaoFileRunStore(root);
    const result = await store.resumeRun("does-not-exist");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("RUN_NOT_FOUND");
    }
  });

  it("returns RUN_NOT_FOUND for appendEvent on a nonexistent taskGraphId", async () => {
    const store = new MaoFileRunStore(root);
    const result = await store.appendEvent("does-not-exist", {
      taskGraphId: "does-not-exist",
      taskId: "t1",
      eventType: "GRAPH_COMPILED",
      resultingState: "planned",
      occurredAt: "2026-07-16T00:00:00.000Z",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("RUN_NOT_FOUND");
    }
  });

  // --- Corrupt JSON ---

  it("returns INVALID_SNAPSHOT_JSON when the persisted snapshot file contains garbage bytes", async () => {
    const graph = compileGraph();
    const store = new MaoFileRunStore(root);
    await store.createRun(graph);

    const files = await readdir(root);
    const snapshotFile = files.find((name) => name.endsWith(".json")) as string;
    await writeFile(join(root, snapshotFile), "{ this is not valid JSON ][", "utf8");

    const result = await store.resumeRun(graph.taskGraphId);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("INVALID_SNAPSHOT_JSON");
      // Failure detail must not echo the raw corrupted file content.
      expect(result.detail).not.toContain("this is not valid JSON");
    }
  });

  // --- Schema mismatch ---

  it("returns SNAPSHOT_SCHEMA_MISMATCH when persisted schemaVersion does not match the constant", async () => {
    const graph = compileGraph();
    const store = new MaoFileRunStore(root);
    await store.createRun(graph);

    const files = await readdir(root);
    const snapshotFile = files.find((name) => name.endsWith(".json")) as string;
    const snapshotPath = join(root, snapshotFile);
    const raw = await readFile(snapshotPath, "utf8");
    const parsed = JSON.parse(raw);
    parsed.schemaVersion = "mao-durable-run-snapshot.v999";
    await writeFile(snapshotPath, JSON.stringify(parsed, null, 2), "utf8");

    const result = await store.resumeRun(graph.taskGraphId);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("SNAPSHOT_SCHEMA_MISMATCH");
    }
  });

  // --- Authority mismatch ---

  it("returns AUTHORITY_HASH_MISMATCH when the persisted authority envelope is tampered", async () => {
    const graph = compileGraph();
    const store = new MaoFileRunStore(root);
    await store.createRun(graph);

    const files = await readdir(root);
    const snapshotFile = files.find((name) => name.endsWith(".json")) as string;
    const snapshotPath = join(root, snapshotFile);
    const raw = await readFile(snapshotPath, "utf8");
    const parsed = JSON.parse(raw);
    parsed.graph.authorityEnvelope.riskLevel = "R3";
    await writeFile(snapshotPath, JSON.stringify(parsed, null, 2), "utf8");

    const result = await store.resumeRun(graph.taskGraphId);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("AUTHORITY_HASH_MISMATCH");
    }
  });

  it("returns INVALID_SNAPSHOT_JSON instead of throwing for a malformed authority envelope", async () => {
    const graph = compileGraph();
    const store = new MaoFileRunStore(root);
    await store.createRun(graph);

    const files = await readdir(root);
    const snapshotFile = files.find((name) => name.endsWith(".json")) as string;
    const snapshotPath = join(root, snapshotFile);
    const parsed = JSON.parse(await readFile(snapshotPath, "utf8"));
    parsed.graph.authorityEnvelope = {};
    await writeFile(snapshotPath, JSON.stringify(parsed, null, 2), "utf8");

    const result = await store.resumeRun(graph.taskGraphId);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("INVALID_SNAPSHOT_JSON");
    }
  });

  // --- Graph mismatch ---

  it("returns GRAPH_ID_MISMATCH when the persisted graph taskGraphId does not match the requested id", async () => {
    const graph = compileGraph();
    const store = new MaoFileRunStore(root);
    await store.createRun(graph);

    const files = await readdir(root);
    const snapshotFile = files.find((name) => name.endsWith(".json")) as string;
    const snapshotPath = join(root, snapshotFile);
    const raw = await readFile(snapshotPath, "utf8");
    const parsed = JSON.parse(raw);
    parsed.graph.taskGraphId = "some-other-graph-id";
    await writeFile(snapshotPath, JSON.stringify(parsed, null, 2), "utf8");

    const result = await store.resumeRun(graph.taskGraphId);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("GRAPH_ID_MISMATCH");
    }
  });

  // --- Sequence gap ---

  it("returns EVENT_SEQUENCE_INVALID when the persisted events array is missing an in-order sequence", async () => {
    const graph = compileGraph();
    const store = new MaoFileRunStore(root);
    await store.createRun(graph);
    await store.appendEvent(graph.taskGraphId, {
      taskGraphId: graph.taskGraphId,
      taskId: "t1",
      eventType: "GRAPH_COMPILED",
      resultingState: "planned",
      occurredAt: "2026-07-16T00:00:00.000Z",
    });
    await store.appendEvent(graph.taskGraphId, {
      taskGraphId: graph.taskGraphId,
      taskId: "t1",
      eventType: "TASK_ADMITTED",
      resultingState: "admitted",
      occurredAt: "2026-07-16T00:01:00.000Z",
    });

    const files = await readdir(root);
    const snapshotFile = files.find((name) => name.endsWith(".json")) as string;
    const snapshotPath = join(root, snapshotFile);
    const raw = await readFile(snapshotPath, "utf8");
    const parsed = JSON.parse(raw);
    // Remove the sequence-1 entry, leaving sequence 2 as the first entry (gap).
    parsed.events = [parsed.events[1]];
    await writeFile(snapshotPath, JSON.stringify(parsed, null, 2), "utf8");

    const result = await store.resumeRun(graph.taskGraphId);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("EVENT_SEQUENCE_INVALID");
    }
  });

  // --- Event tamper ---

  it("returns EVENT_REPLAY_REJECTED when a persisted event field is tampered so replay diverges", async () => {
    const graph = compileGraph();
    const store = new MaoFileRunStore(root);
    await store.createRun(graph);
    await store.appendEvent(graph.taskGraphId, {
      taskGraphId: graph.taskGraphId,
      taskId: "t1",
      eventType: "GRAPH_COMPILED",
      resultingState: "planned",
      occurredAt: "2026-07-16T00:00:00.000Z",
    });

    const files = await readdir(root);
    const snapshotFile = files.find((name) => name.endsWith(".json")) as string;
    const snapshotPath = join(root, snapshotFile);
    const raw = await readFile(snapshotPath, "utf8");
    const parsed = JSON.parse(raw);
    // Tamper the persisted eventId so replay's recomputed id no longer matches.
    parsed.events[0].eventId = "tampered-event-id-does-not-match-recomputed-hash";
    await writeFile(snapshotPath, JSON.stringify(parsed, null, 2), "utf8");

    const result = await store.resumeRun(graph.taskGraphId);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("EVENT_REPLAY_REJECTED");
    }
  });

  it("returns INVALID_SNAPSHOT_JSON instead of throwing for a malformed persisted event", async () => {
    const graph = compileGraph();
    const store = new MaoFileRunStore(root);
    await store.createRun(graph);
    await store.appendEvent(graph.taskGraphId, {
      taskGraphId: graph.taskGraphId,
      taskId: "t1",
      eventType: "GRAPH_COMPILED",
      resultingState: "planned",
      occurredAt: "2026-07-16T00:00:00.000Z",
    });

    const files = await readdir(root);
    const snapshotFile = files.find((name) => name.endsWith(".json")) as string;
    const snapshotPath = join(root, snapshotFile);
    const parsed = JSON.parse(await readFile(snapshotPath, "utf8"));
    delete parsed.events[0].taskId;
    await writeFile(snapshotPath, JSON.stringify(parsed, null, 2), "utf8");

    const result = await store.resumeRun(graph.taskGraphId);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("INVALID_SNAPSHOT_JSON");
    }
  });

  // --- Invalid transition ---

  it("returns EVENT_REPLAY_REJECTED when appendEvent itself would be an invalid state transition", async () => {
    const graph = compileGraph();
    const store = new MaoFileRunStore(root);
    await store.createRun(graph);

    // t1 has no prior event; jumping straight to "succeeded" is not an
    // allowed __initial__ transition per the ledger's transition table.
    const result = await store.appendEvent(graph.taskGraphId, {
      taskGraphId: graph.taskGraphId,
      taskId: "t1",
      eventType: "INVOCATION_COMPLETED",
      resultingState: "succeeded",
      occurredAt: "2026-07-16T00:00:00.000Z",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("EVENT_REPLAY_REJECTED");
    }

    const resumed = await store.resumeRun(graph.taskGraphId);
    expect(resumed.ok).toBe(true);
    if (resumed.ok) {
      expect(resumed.events).toEqual([]);
    }
  });

  // --- Temporary-file cleanup ---

  it("leaves no .tmp-* files behind after successful create/append operations", async () => {
    const graph = compileGraph();
    const store = new MaoFileRunStore(root);
    await store.createRun(graph);
    await store.appendEvent(graph.taskGraphId, {
      taskGraphId: graph.taskGraphId,
      taskId: "t1",
      eventType: "GRAPH_COMPILED",
      resultingState: "planned",
      occurredAt: "2026-07-16T00:00:00.000Z",
    });

    const remainingTempFiles = await listTempArtifacts(root);
    expect(remainingTempFiles).toEqual([]);
  });

  it("leaves no .tmp-* files behind after a rejected append (duplicate key failure path)", async () => {
    const graph = compileGraph();
    const store = new MaoFileRunStore(root);
    await store.createRun(graph);
    await store.appendEvent(graph.taskGraphId, {
      taskGraphId: graph.taskGraphId,
      taskId: "t1",
      eventType: "GRAPH_COMPILED",
      resultingState: "planned",
      occurredAt: "2026-07-16T00:00:00.000Z",
      idempotencyKey: "cleanup-check-key",
    });

    await store.appendEvent(graph.taskGraphId, {
      taskGraphId: graph.taskGraphId,
      taskId: "t1",
      eventType: "GRAPH_COMPILED",
      resultingState: "planned",
      occurredAt: "2026-07-16T00:03:00.000Z",
      idempotencyKey: "cleanup-check-key",
    });

    const remainingTempFiles = await listTempArtifacts(root);
    expect(remainingTempFiles).toEqual([]);
  });

  // --- listRunIds discovery ---

  describe("listRunIds", () => {
    it("returns a successful empty list for a missing root and never creates it", async () => {
      const missingRoot = join(root, "does-not-exist-yet");
      const store = new MaoFileRunStore(missingRoot);

      const result = await store.listRunIds();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.taskGraphIds).toEqual([]);
      }

      await expect(stat(missingRoot)).rejects.toThrow();
    });

    it("returns unique valid task graph IDs in deterministic lexicographic order after full validation", async () => {
      const store = new MaoFileRunStore(root);
      const graphB = compileGraph({ workOrderId: "work-order-b" });
      const graphA = compileGraph({ workOrderId: "work-order-a" });
      await store.createRun(graphB);
      await store.createRun(graphA);

      const result = await store.listRunIds();
      expect(result.ok).toBe(true);
      if (result.ok) {
        const expected = [graphA.taskGraphId, graphB.taskGraphId].sort();
        expect(result.taskGraphIds).toEqual(expected);
      }
    });

    it("ignores atomic temp files, canonical directories, symlinks, and unrelated non-canonical entries", async () => {
      const store = new MaoFileRunStore(root);
      const graph = compileGraph();
      await store.createRun(graph);

      // Non-canonical noise the discovery pass must ignore.
      await writeFile(join(root, "not-a-snapshot.txt"), "noise", "utf8");
      await writeFile(join(root, "deadbeef.json.tmp-abc123"), "{}", "utf8");
      await mkdir(join(root, "a-subdirectory"));
      await mkdir(join(root, `${"b".repeat(64)}.json`));

      const externalSnapshot = join(root, "outside-candidate.json");
      await writeFile(externalSnapshot, "{}", "utf8");
      const canonicalSymlink = join(root, `${"c".repeat(64)}.json`);
      try {
        await symlink(externalSnapshot, canonicalSymlink, "file");
      } catch (error) {
        // Windows without Developer Mode may deny file-symlink creation.
        // The canonical-directory case still exercises non-file filtering;
        // source inspection confirms Dirent.isFile() does not follow links.
        if (!(typeof error === "object" && error !== null && "code" in error && error.code === "EPERM")) throw error;
      }

      const result = await store.listRunIds();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.taskGraphIds).toEqual([graph.taskGraphId]);
      }
    });

    it("fails closed on a canonical file with invalid JSON rather than silently skipping it", async () => {
      const store = new MaoFileRunStore(root);
      const graph = compileGraph();
      await store.createRun(graph);

      // A second, unrelated canonical-looking (but garbage) snapshot file.
      const bogusFileName = `${"a".repeat(64)}.json`;
      await writeFile(join(root, bogusFileName), "{ not valid json ][", "utf8");

      const result = await store.listRunIds();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("INVALID_SNAPSHOT_JSON");
      }
    });

    it("fails closed when a canonical filename does not hash-bind to its embedded graph.taskGraphId", async () => {
      const store = new MaoFileRunStore(root);
      const graph = compileGraph();
      await store.createRun(graph);

      const files = await readdir(root);
      const snapshotFile = files.find((name) => name.endsWith(".json")) as string;
      const snapshotPath = join(root, snapshotFile);
      const raw = await readFile(snapshotPath, "utf8");
      const parsed = JSON.parse(raw);
      parsed.graph.taskGraphId = "a-different-task-graph-id-than-the-filename-hash";
      await writeFile(snapshotPath, JSON.stringify(parsed, null, 2), "utf8");

      const result = await store.listRunIds();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("GRAPH_ID_MISMATCH");
      }
    });

    it("fails closed when a canonical candidate fails full replay validation", async () => {
      const store = new MaoFileRunStore(root);
      const graph = compileGraph();
      await store.createRun(graph);
      await store.appendEvent(graph.taskGraphId, {
        taskGraphId: graph.taskGraphId,
        taskId: "t1",
        eventType: "GRAPH_COMPILED",
        resultingState: "planned",
        occurredAt: "2026-07-16T00:00:00.000Z",
      });

      const files = await readdir(root);
      const snapshotFile = files.find((name) => name.endsWith(".json")) as string;
      const snapshotPath = join(root, snapshotFile);
      const raw = await readFile(snapshotPath, "utf8");
      const parsed = JSON.parse(raw);
      parsed.events[0].eventId = "tampered-event-id-does-not-match-recomputed-hash";
      await writeFile(snapshotPath, JSON.stringify(parsed, null, 2), "utf8");

      const result = await store.listRunIds();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("EVENT_REPLAY_REJECTED");
      }
    });

    it("returns deeply-equal results across repeated calls and never mutates entry names or bytes", async () => {
      const store = new MaoFileRunStore(root);
      const graph = compileGraph();
      await store.createRun(graph);

      const entriesBefore = (await readdir(root)).sort();
      const snapshotFile = entriesBefore.find((name) => name.endsWith(".json")) as string;
      const snapshotPath = join(root, snapshotFile);
      const bytesBefore = await readFile(snapshotPath, "utf8");
      const mtimeBefore = (await stat(snapshotPath)).mtimeMs;

      const first = await store.listRunIds();
      const second = await store.listRunIds();
      expect(first).toEqual(second);

      const entriesAfter = (await readdir(root)).sort();
      const bytesAfter = await readFile(snapshotPath, "utf8");
      const mtimeAfter = (await stat(snapshotPath)).mtimeMs;
      expect(entriesAfter).toEqual(entriesBefore);
      expect(bytesAfter).toBe(bytesBefore);
      expect(mtimeAfter).toBe(mtimeBefore);
    });
  });
});
