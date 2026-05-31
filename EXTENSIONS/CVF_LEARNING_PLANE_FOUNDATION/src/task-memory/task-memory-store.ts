import { classifyMemoryTier } from "../memory-tier-classifier.contract";
import type {
  TaskMemoryEntry,
  TaskMemoryInspection,
  TaskMemoryStore,
} from "./task-memory-types";

export class TaskMemoryStoreRejectionError extends Error {
  readonly reason: string;
  readonly classifiedTier: string;

  constructor(reason: string, classifiedTier: string) {
    super(reason);
    this.name = "TaskMemoryStoreRejectionError";
    this.reason = reason;
    this.classifiedTier = classifiedTier;
  }
}

export interface CreateTaskMemoryStoreOptions {
  now?: () => number;
}

export function createTaskMemoryStore(
  options: CreateTaskMemoryStoreOptions = {},
): TaskMemoryStore & { inspect(taskId: string): TaskMemoryInspection } {
  return new InProcessTaskMemoryStore(options);
}

class InProcessTaskMemoryStore implements TaskMemoryStore {
  private readonly entries = new Map<string, TaskMemoryEntry>();
  private readonly now: () => number;

  constructor(options: CreateTaskMemoryStoreOptions) {
    this.now = options.now ?? (() => Date.now());
  }

  set(entry: TaskMemoryEntry): void {
    const tier = classifyMemoryTier({
      tier: readPayloadString(entry.payload, "tier") ?? readPayloadString(entry.payload, "memoryTier") ?? "task",
      source: readPayloadString(entry.payload, "source"),
      artifactType: readPayloadString(entry.payload, "artifactType"),
      retentionHint: readPayloadString(entry.payload, "retentionHint"),
    });

    if (tier !== "task") {
      throw new TaskMemoryStoreRejectionError("non_task_memory_tier_rejected", tier);
    }

    this.entries.set(entry.taskId, cloneEntry(entry));
  }

  get(taskId: string): TaskMemoryEntry | undefined {
    const inspected = this.inspect(taskId);
    return inspected.state === "present" ? inspected.entry : undefined;
  }

  inspect(taskId: string): TaskMemoryInspection {
    const entry = this.entries.get(taskId);
    if (!entry) {
      return { state: "missing", reason: "task_memory_entry_missing" };
    }
    if (entry.expiresAt <= this.now()) {
      return {
        state: "expired",
        reason: "task_memory_entry_expired",
        entry: cloneEntry(entry),
      };
    }
    return {
      state: "present",
      reason: "task_memory_entry_present",
      entry: cloneEntry(entry),
    };
  }

  delete(taskId: string): void {
    this.entries.delete(taskId);
  }

  list(): TaskMemoryEntry[] {
    const currentTime = this.now();
    return Array.from(this.entries.values())
      .filter((entry) => entry.expiresAt > currentTime)
      .map(cloneEntry);
  }

  clear(): void {
    this.entries.clear();
  }
}

function readPayloadString(payload: Record<string, unknown>, key: string): string | undefined {
  const value = payload[key];
  return typeof value === "string" ? value : undefined;
}

function cloneEntry(entry: TaskMemoryEntry): TaskMemoryEntry {
  return {
    taskId: entry.taskId,
    createdAt: entry.createdAt,
    expiresAt: entry.expiresAt,
    payload: { ...entry.payload },
  };
}
