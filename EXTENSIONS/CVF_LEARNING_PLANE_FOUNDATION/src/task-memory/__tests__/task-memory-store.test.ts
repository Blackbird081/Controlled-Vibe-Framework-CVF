import { describe, expect, it } from "vitest";
import {
  TaskMemoryStoreRejectionError,
  createTaskMemoryStore,
} from "../task-memory-store";

describe("task-memory-store", () => {
  it("round-trips set() and get()", () => {
    const store = createTaskMemoryStore({ now: () => 1000 });

    store.set({
      taskId: "task-1",
      createdAt: 1000,
      expiresAt: 2000,
      payload: { tier: "task", value: "draft" },
    });

    expect(store.get("task-1")).toEqual({
      taskId: "task-1",
      createdAt: 1000,
      expiresAt: 2000,
      payload: { tier: "task", value: "draft" },
    });
  });

  it("returns undefined from get() for expired entries", () => {
    const store = createTaskMemoryStore({ now: () => 3000 });

    store.set({
      taskId: "task-expired",
      createdAt: 1000,
      expiresAt: 2000,
      payload: { tier: "task" },
    });

    expect(store.get("task-expired")).toBeUndefined();
    expect(store.inspect("task-expired")).toMatchObject({
      state: "expired",
      reason: "task_memory_entry_expired",
    });
  });

  it("filters expired entries from list()", () => {
    const store = createTaskMemoryStore({ now: () => 1500 });

    store.set({
      taskId: "task-live",
      createdAt: 1000,
      expiresAt: 2500,
      payload: { tier: "task" },
    });
    store.set({
      taskId: "task-old",
      createdAt: 1000,
      expiresAt: 1200,
      payload: { tier: "task" },
    });

    expect(store.list().map((entry) => entry.taskId)).toEqual(["task-live"]);
  });

  it("delete() removes an entry", () => {
    const store = createTaskMemoryStore({ now: () => 1000 });

    store.set({
      taskId: "task-delete",
      createdAt: 1000,
      expiresAt: 2000,
      payload: { tier: "task" },
    });
    store.delete("task-delete");

    expect(store.get("task-delete")).toBeUndefined();
  });

  it("clear() empties the store", () => {
    const store = createTaskMemoryStore({ now: () => 1000 });

    store.set({
      taskId: "task-clear",
      createdAt: 1000,
      expiresAt: 2000,
      payload: { tier: "task" },
    });
    store.clear();

    expect(store.list()).toEqual([]);
  });

  it("rejects non-task memory with a machine-readable reason", () => {
    const store = createTaskMemoryStore({ now: () => 1000 });

    expect(() => store.set({
      taskId: "audit-1",
      createdAt: 1000,
      expiresAt: 2000,
      payload: { tier: "audit" },
    })).toThrow(TaskMemoryStoreRejectionError);

    try {
      store.set({
        taskId: "audit-1",
        createdAt: 1000,
        expiresAt: 2000,
        payload: { tier: "audit" },
      });
    } catch (error) {
      expect(error).toMatchObject({
        reason: "non_task_memory_tier_rejected",
        classifiedTier: "audit",
      });
    }
  });

  it("does not expose filesystem, network, or database behavior", () => {
    const store = createTaskMemoryStore({ now: () => 1000 });

    expect(Object.keys(store).join(" ")).not.toMatch(/fs|fetch|database|db/i);
  });
});
