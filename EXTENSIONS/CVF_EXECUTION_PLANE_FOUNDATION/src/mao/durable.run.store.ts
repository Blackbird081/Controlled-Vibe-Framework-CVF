// CVF MAO-OA-T2 - Durable Run Store Replay Recovery And Idempotent Resume
//
// Implements a bounded, local, explicit-root file-backed durable store for
// one immutable MAO task graph plus its ordered append-only event entries.
// Per docs/reference/multi_agent_orchestration/CVF_MAO_RUNTIME_FOUNDATION_CONTRACT.md
// Storage And Retention Decision, the event/receipt ledger is execution
// truth; this store persists exactly that truth under a caller-supplied
// local root directory and restores it only by revalidating graph identity/
// authority and replaying every persisted event through a fresh
// MaoEventLedger instance (task.graph.contract.ts / event.ledger.contract.ts
// remain the sole owners of graph and transition validation - this module
// never reimplements or bypasses that validation).
//
// This module owns storage only. It does not launch a worker or provider,
// does not implement heartbeat/timeout/cancellation/retry, does not read
// environment variables, and does not select a global/user/session/
// workspace path. Local execution-plane module only; no runtime caller.

import { mkdir, readdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { createHash, randomBytes } from "node:crypto";
import { join } from "node:path";

import type { MaoTaskGraph } from "./task.graph.contract";
import { verifyAuthorityEnvelope } from "./task.graph.contract";
import type { MaoAppendEventInput, MaoEventLedgerEntry } from "./event.ledger.contract";
import { MaoEventLedger } from "./event.ledger.contract";

// --- Types ---

export const MAO_DURABLE_RUN_SNAPSHOT_SCHEMA_VERSION = "mao-durable-run-snapshot.v1";

export interface MaoDurableRunSnapshot {
  schemaVersion: string;
  graph: MaoTaskGraph;
  events: readonly MaoEventLedgerEntry[];
}

export type MaoDurableRunStoreFailureReason =
  | "RUN_ALREADY_EXISTS"
  | "RUN_NOT_FOUND"
  | "INVALID_SNAPSHOT_JSON"
  | "SNAPSHOT_SCHEMA_MISMATCH"
  | "AUTHORITY_HASH_MISMATCH"
  | "GRAPH_ID_MISMATCH"
  | "EVENT_SEQUENCE_INVALID"
  | "EVENT_REPLAY_REJECTED"
  | "IO_FAILURE";

export interface MaoDurableRunStoreFailure {
  ok: false;
  reason: MaoDurableRunStoreFailureReason;
  detail: string;
}

export interface MaoDurableRunCreateSuccess {
  ok: true;
  snapshot: MaoDurableRunSnapshot;
}

export interface MaoDurableRunAppendSuccess {
  ok: true;
  appendedEntry: MaoEventLedgerEntry;
  snapshot: MaoDurableRunSnapshot;
}

export interface MaoDurableRunResumeSuccess {
  ok: true;
  graph: MaoTaskGraph;
  events: readonly MaoEventLedgerEntry[];
}

export interface MaoDurableRunListSuccess {
  ok: true;
  taskGraphIds: readonly string[];
}

type MaoDurableReplayResult =
  | { ok: true; graph: MaoTaskGraph; events: readonly MaoEventLedgerEntry[]; ledger: MaoEventLedger }
  | MaoDurableRunStoreFailure;

function failure(reason: MaoDurableRunStoreFailureReason, detail: string): MaoDurableRunStoreFailure {
  return { ok: false, reason, detail };
}

/**
 * Deterministic, path-safe file identity for a taskGraphId. The raw ID is
 * never used as or interpolated into a path segment (SHA-256 hex digest
 * only), which prevents path traversal via `../` or absolute-path-like
 * taskGraphId content.
 */
function snapshotFileNameFor(taskGraphId: string): string {
  const digest = createHash("sha256").update(taskGraphId, "utf8").digest("hex");
  return `${digest}.json`;
}

/**
 * Canonical snapshot filename shape: exactly 64 lowercase hex characters
 * (a SHA-256 digest) followed by `.json`. Any other entry - including the
 * atomic writer's own `<hash>.json.tmp-<suffix>` temporary files, directories,
 * or unrelated files - is not a discovery candidate.
 */
const CANONICAL_SNAPSHOT_FILENAME_RE = /^[0-9a-f]{64}\.json$/;

/**
 * Bounded local file-backed durable store for one MAO run (immutable task
 * graph plus ordered append-only event entries) per caller-supplied root
 * directory. The store owns only files below that root whose names are a
 * deterministic hash of the task-graph ID; it never reads environment
 * variables and never selects a global/user/session/workspace path.
 */
export class MaoFileRunStore {
  private readonly rootDirectory: string;

  constructor(rootDirectory: string) {
    if (typeof rootDirectory !== "string" || rootDirectory.trim().length === 0) {
      throw new Error("MaoFileRunStore: rootDirectory must be a non-empty string");
    }
    this.rootDirectory = rootDirectory;
  }

  private snapshotPathFor(taskGraphId: string): string {
    return join(this.rootDirectory, snapshotFileNameFor(taskGraphId));
  }

  /**
   * Verify authority, create the root directory when needed, refuse an
   * existing run for the same graph identity, and atomically write the
   * versioned zero-event snapshot. Never overwrites an existing run.
   */
  async createRun(graph: MaoTaskGraph): Promise<MaoDurableRunCreateSuccess | MaoDurableRunStoreFailure> {
    if (!verifyAuthorityEnvelope(graph.authorityEnvelope)) {
      return failure("AUTHORITY_HASH_MISMATCH", "graph authority envelope does not verify against its recorded hash");
    }

    const targetPath = this.snapshotPathFor(graph.taskGraphId);

    try {
      await mkdir(this.rootDirectory, { recursive: true });
    } catch (error) {
      return failure("IO_FAILURE", `failed to create root directory: ${describeError(error)}`);
    }

    const existing = await readSnapshotFile(targetPath);
    if (existing.status === "present") {
      return failure("RUN_ALREADY_EXISTS", `a run snapshot already exists for this taskGraphId`);
    }
    if (existing.status === "io_error") {
      return failure("IO_FAILURE", `failed to probe existing run snapshot: ${existing.detail}`);
    }

    const snapshot: MaoDurableRunSnapshot = {
      schemaVersion: MAO_DURABLE_RUN_SNAPSHOT_SCHEMA_VERSION,
      graph,
      events: [],
    };

    const writeResult = await atomicWriteJson(this.rootDirectory, targetPath, snapshot);
    if (!writeResult.ok) {
      return failure("IO_FAILURE", `failed to write initial run snapshot: ${writeResult.detail}`);
    }

    return { ok: true, snapshot };
  }

  /**
   * Pure read: locate the snapshot file by deterministic hash of
   * taskGraphId, validate schema/graph/authority/sequence, and replay every
   * persisted event in order through a fresh MaoEventLedger, requiring each
   * replayed entry to match the persisted entry's ID and fields exactly.
   * Performs no write. Repeated calls return deeply-equal results.
   */
  async resumeRun(taskGraphId: string): Promise<MaoDurableRunResumeSuccess | MaoDurableRunStoreFailure> {
    const replay = await this.loadAndReplay(taskGraphId);
    if (!replay.ok) return replay;
    return { ok: true, graph: replay.graph, events: replay.events };
  }

  /**
   * Validated resume/replay identical to resumeRun, then invoke the fresh
   * ledger's real append exactly once with `input`. On success, atomically
   * replace the snapshot file with the new full snapshot. On any rejection
   * (including duplicate idempotency key, which append naturally rejects),
   * no write occurs and snapshot bytes/event count on disk remain
   * byte-identical to before the call.
   */
  async appendEvent(
    taskGraphId: string,
    input: MaoAppendEventInput,
  ): Promise<MaoDurableRunAppendSuccess | MaoDurableRunStoreFailure> {
    const replay = await this.loadAndReplay(taskGraphId);
    if (!replay.ok) return replay;

    // Reuse the already-replayed ledger (its internal sequence counter,
    // idempotency-key set, and per-task state already reflect every
    // persisted event) so this append extends exactly that history without
    // a second replay pass.
    const ledger = replay.ledger;
    const appendResult = ledger.append(input);
    if (!appendResult.ok) {
      return failure("EVENT_REPLAY_REJECTED", `append was rejected by the event ledger: ${appendResult.reason} - ${appendResult.detail}`);
    }

    const newSnapshot: MaoDurableRunSnapshot = {
      schemaVersion: MAO_DURABLE_RUN_SNAPSHOT_SCHEMA_VERSION,
      graph: replay.graph,
      events: ledger.getEntries(),
    };

    const targetPath = this.snapshotPathFor(taskGraphId);
    const writeResult = await atomicWriteJson(this.rootDirectory, targetPath, newSnapshot);
    if (!writeResult.ok) {
      return failure("IO_FAILURE", `failed to write updated run snapshot: ${writeResult.detail}`);
    }

    return { ok: true, appendedEntry: appendResult.entry, snapshot: newSnapshot };
  }

  /**
   * Deterministic, read-only, fail-closed discovery of every valid run's
   * taskGraphId under this store's root. Never creates the root, never
   * writes, never repairs, and never returns a partial result: any canonical
   * candidate that fails full replay validation (the same
   * `loadAndReplay` this class already uses for resumeRun/appendEvent) fails
   * the whole call rather than being silently skipped. Non-canonical entries
   * (directories, the atomic writer's own `.tmp-` files, or any filename
   * that is not exactly 64 lowercase hex characters plus `.json`) are
   * ignored as discovery candidates without being treated as errors.
   * Returns unique task-graph IDs sorted by ordinary JavaScript
   * lexicographic (`Array.prototype.sort()`) order. Repeated calls are
   * deeply equal and never change directory entries, snapshot bytes, or
   * missing-root existence.
   */
  async listRunIds(): Promise<MaoDurableRunListSuccess | MaoDurableRunStoreFailure> {
    let entries;
    try {
      entries = await readdir(this.rootDirectory, { withFileTypes: true });
    } catch (error) {
      if (isNodeErrnoException(error) && error.code === "ENOENT") {
        return { ok: true, taskGraphIds: [] };
      }
      return failure("IO_FAILURE", `failed to list run-store root: ${describeError(error)}`);
    }

    // Dirent.isFile() classifies the directory entry itself without following
    // symbolic links. A canonical-looking symlink must never escape the
    // caller-supplied root and become a discovery candidate.
    const regularCanonicalFileNames = entries
      .filter((entry) => entry.isFile() && CANONICAL_SNAPSHOT_FILENAME_RE.test(entry.name))
      .map((entry) => entry.name);

    const discoveredTaskGraphIds = new Set<string>();

    for (const fileName of regularCanonicalFileNames) {
      const read = await readSnapshotFile(join(this.rootDirectory, fileName));
      if (read.status === "absent") {
        return failure("IO_FAILURE", `run-store candidate ${fileName} disappeared during discovery`);
      }
      if (read.status === "io_error") {
        return failure("IO_FAILURE", `failed to read run-store candidate ${fileName}: ${read.detail}`);
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(read.raw);
      } catch {
        return failure("INVALID_SNAPSHOT_JSON", `run-store candidate ${fileName} is not valid JSON`);
      }
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        !("graph" in parsed) ||
        !isPersistedGraphShape((parsed as { graph: unknown }).graph)
      ) {
        return failure("INVALID_SNAPSHOT_JSON", `run-store candidate ${fileName} is missing a valid graph.taskGraphId`);
      }

      const candidateTaskGraphId = (parsed as { graph: MaoTaskGraph }).graph.taskGraphId;
      if (candidateTaskGraphId.trim().length === 0) {
        return failure("INVALID_SNAPSHOT_JSON", `run-store candidate ${fileName} has an empty graph.taskGraphId`);
      }

      const expectedFileName = snapshotFileNameFor(candidateTaskGraphId);
      if (expectedFileName !== fileName) {
        return failure(
          "GRAPH_ID_MISMATCH",
          `run-store candidate ${fileName} does not hash-bind to its embedded graph.taskGraphId`,
        );
      }

      const replay = await this.loadAndReplay(candidateTaskGraphId);
      if (!replay.ok) return replay;

      discoveredTaskGraphIds.add(candidateTaskGraphId);
    }

    return { ok: true, taskGraphIds: [...discoveredTaskGraphIds].sort() };
  }

  /**
   * Shared read-only load-plus-replay path used by both resumeRun and the
   * pre-append validation half of appendEvent. Never writes.
   */
  private async loadAndReplay(taskGraphId: string): Promise<MaoDurableReplayResult> {
    const targetPath = this.snapshotPathFor(taskGraphId);
    const read = await readSnapshotFile(targetPath);

    if (read.status === "absent") {
      return failure("RUN_NOT_FOUND", "no run snapshot exists for this taskGraphId");
    }
    if (read.status === "io_error") {
      return failure("IO_FAILURE", `failed to read run snapshot: ${read.detail}`);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(read.raw);
    } catch {
      return failure("INVALID_SNAPSHOT_JSON", "persisted run snapshot is not valid JSON");
    }

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("schemaVersion" in parsed) ||
      !("graph" in parsed) ||
      !("events" in parsed)
    ) {
      return failure("INVALID_SNAPSHOT_JSON", "persisted run snapshot is missing required top-level fields");
    }

    const candidate = parsed as { schemaVersion: unknown; graph: unknown; events: unknown };

    if (candidate.schemaVersion !== MAO_DURABLE_RUN_SNAPSHOT_SCHEMA_VERSION) {
      return failure(
        "SNAPSHOT_SCHEMA_MISMATCH",
        `persisted schemaVersion does not match expected ${MAO_DURABLE_RUN_SNAPSHOT_SCHEMA_VERSION}`,
      );
    }

    if (!isPersistedGraphShape(candidate.graph)) {
      return failure("INVALID_SNAPSHOT_JSON", "persisted graph is missing required fields");
    }
    const graph = candidate.graph;

    if (graph.taskGraphId !== taskGraphId) {
      return failure("GRAPH_ID_MISMATCH", "persisted graph taskGraphId does not match the requested taskGraphId");
    }

    let authorityValid = false;
    try {
      authorityValid = verifyAuthorityEnvelope(graph.authorityEnvelope);
    } catch {
      return failure("INVALID_SNAPSHOT_JSON", "persisted graph authority envelope has an invalid shape");
    }
    if (!authorityValid) {
      return failure("AUTHORITY_HASH_MISMATCH", "persisted graph authority envelope does not verify against its recorded hash");
    }

    if (!Array.isArray(candidate.events)) {
      return failure("INVALID_SNAPSHOT_JSON", "persisted events field is not an array");
    }

    const persistedEvents = candidate.events as MaoEventLedgerEntry[];

    for (let i = 0; i < persistedEvents.length; i += 1) {
      if (!isPersistedEventShape(persistedEvents[i])) {
        return failure("INVALID_SNAPSHOT_JSON", `persisted event at index ${i} is missing required fields`);
      }
      const expectedSequence = i + 1;
      if (persistedEvents[i]?.sequence !== expectedSequence) {
        return failure(
          "EVENT_SEQUENCE_INVALID",
          `expected contiguous sequence starting at 1; entry at index ${i} has sequence ${String(persistedEvents[i]?.sequence)}`,
        );
      }
    }

    const ledger = new MaoEventLedger(graph);
    for (const persistedEntry of persistedEvents) {
      const replayed = ledger.append({
        taskGraphId: persistedEntry.taskGraphId,
        taskId: persistedEntry.taskId,
        eventType: persistedEntry.eventType,
        resultingState: persistedEntry.resultingState,
        occurredAt: persistedEntry.occurredAt,
        idempotencyKey: persistedEntry.idempotencyKey ?? undefined,
      });

      if (!replayed.ok) {
        return failure(
          "EVENT_REPLAY_REJECTED",
          `replay of persisted event failed ledger validation: ${replayed.reason}`,
        );
      }

      if (
        replayed.entry.eventId !== persistedEntry.eventId ||
        replayed.entry.sequence !== persistedEntry.sequence ||
        replayed.entry.taskId !== persistedEntry.taskId ||
        replayed.entry.eventType !== persistedEntry.eventType ||
        replayed.entry.resultingState !== persistedEntry.resultingState ||
        replayed.entry.occurredAt !== persistedEntry.occurredAt ||
        (replayed.entry.idempotencyKey ?? null) !== (persistedEntry.idempotencyKey ?? null)
      ) {
        return failure(
          "EVENT_REPLAY_REJECTED",
          "replayed event does not match persisted event id/fields exactly",
        );
      }
    }

    return { ok: true, graph, events: ledger.getEntries(), ledger };
  }
}

// --- Filesystem helpers ---

type SnapshotReadResult =
  | { status: "present"; raw: string }
  | { status: "absent" }
  | { status: "io_error"; detail: string };

async function readSnapshotFile(targetPath: string): Promise<SnapshotReadResult> {
  try {
    const raw = await readFile(targetPath, "utf8");
    return { status: "present", raw };
  } catch (error) {
    if (isNodeErrnoException(error) && error.code === "ENOENT") {
      return { status: "absent" };
    }
    return { status: "io_error", detail: describeError(error) };
  }
}

type AtomicWriteResult = { ok: true } | { ok: false; detail: string };

/**
 * Write complete JSON to a unique same-directory temporary file, then
 * rename it over the target path. Cleans up the temporary file on failure
 * where safe (best-effort only; cleanup failure never masks the original
 * error).
 */
async function atomicWriteJson(directory: string, targetPath: string, value: unknown): Promise<AtomicWriteResult> {
  const tempSuffix = randomBytes(8).toString("hex");
  const tempPath = `${targetPath}.tmp-${tempSuffix}`;

  try {
    await writeFile(tempPath, JSON.stringify(value, null, 2), "utf8");
  } catch (error) {
    await bestEffortCleanup(tempPath);
    return { ok: false, detail: `temp write failed: ${describeError(error)}` };
  }

  try {
    await rename(tempPath, targetPath);
  } catch (error) {
    await bestEffortCleanup(tempPath);
    return { ok: false, detail: `atomic rename failed: ${describeError(error)}` };
  }

  return { ok: true };
}

async function bestEffortCleanup(tempPath: string): Promise<void> {
  try {
    await unlink(tempPath);
  } catch {
    // Best-effort only: cleanup failure must never mask the original error.
  }
}

function isNodeErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPersistedGraphShape(value: unknown): value is MaoTaskGraph {
  if (!isRecord(value)) return false;
  if (typeof value.taskGraphId !== "string" || !isRecord(value.authorityEnvelope)) return false;
  if (!Array.isArray(value.tasks) || !Array.isArray(value.dependencyManifest)) return false;
  return value.tasks.every((task) => isRecord(task) && typeof task.taskId === "string");
}

function isPersistedEventShape(value: unknown): value is MaoEventLedgerEntry {
  if (!isRecord(value)) return false;
  return (
    typeof value.eventId === "string" &&
    typeof value.taskGraphId === "string" &&
    typeof value.taskId === "string" &&
    typeof value.eventType === "string" &&
    typeof value.occurredAt === "string" &&
    typeof value.resultingState === "string" &&
    Number.isInteger(value.sequence) &&
    (value.idempotencyKey === null || typeof value.idempotencyKey === "string")
  );
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "unknown filesystem error";
}
