import { describe, it, expect, beforeEach } from "vitest";
import { TaskRegistry, resetTaskCounter } from "../src/task.registry";

describe("TaskRegistry", () => {
  let registry: TaskRegistry;

  beforeEach(() => {
    registry = new TaskRegistry();
    resetTaskCounter();
  });

  it("creates task with unique ID", () => {
    const t1 = registry.create({ title: "T1", description: "D1", domain: "finance", priority: "high", createdBy: "admin" });
    const t2 = registry.create({ title: "T2", description: "D2", domain: "privacy", priority: "low", createdBy: "admin" });
    expect(t1.id).toMatch(/^TASK-/);
    expect(t1.id).not.toBe(t2.id);
  });

  it("sets default status to open", () => {
    const task = registry.create({ title: "T", description: "D", domain: "finance", priority: "medium", createdBy: "admin" });
    expect(task.status).toBe("open");
  });

  it("retrieves task by ID", () => {
    const task = registry.create({ title: "T", description: "D", domain: "finance", priority: "high", createdBy: "admin" });
    expect(registry.get(task.id)).toBeDefined();
    expect(registry.get(task.id)!.title).toBe("T");
  });

  it("updates task status", () => {
    const task = registry.create({ title: "T", description: "D", domain: "finance", priority: "high", createdBy: "admin" });
    registry.updateStatus(task.id, "in_progress");
    expect(registry.get(task.id)!.status).toBe("in_progress");
  });

  it("assigns task to agent", () => {
    const task = registry.create({ title: "T", description: "D", domain: "finance", priority: "high", createdBy: "admin" });
    registry.assign(task.id, "AGT-0001");
    expect(registry.get(task.id)!.assignedTo).toBe("AGT-0001");
    expect(registry.get(task.id)!.status).toBe("assigned");
  });

  it("finds tasks by status", () => {
    registry.create({ title: "T1", description: "D", domain: "finance", priority: "high", createdBy: "admin" });
    const t2 = registry.create({ title: "T2", description: "D", domain: "privacy", priority: "low", createdBy: "admin" });
    registry.updateStatus(t2.id, "completed");
    expect(registry.findByStatus("open").length).toBe(1);
    expect(registry.findByStatus("completed").length).toBe(1);
  });

  it("finds tasks by domain", () => {
    registry.create({ title: "T1", description: "D", domain: "finance", priority: "high", createdBy: "admin" });
    registry.create({ title: "T2", description: "D", domain: "finance", priority: "low", createdBy: "admin" });
    registry.create({ title: "T3", description: "D", domain: "privacy", priority: "medium", createdBy: "admin" });
    expect(registry.findByDomain("finance").length).toBe(2);
  });

  it("finds open tasks by capability", () => {
    registry.create({ title: "T1", description: "D", domain: "finance", priority: "high", createdBy: "admin", requiredCapabilities: ["analysis"] });
    registry.create({ title: "T2", description: "D", domain: "code", priority: "high", createdBy: "admin", requiredCapabilities: ["review"] });
    expect(registry.findByCapability("analysis").length).toBe(1);
  });

  it("counts and clears", () => {
    registry.create({ title: "T1", description: "D", domain: "finance", priority: "high", createdBy: "admin" });
    registry.create({ title: "T2", description: "D", domain: "privacy", priority: "low", createdBy: "admin" });
    expect(registry.count()).toBe(2);
    registry.clear();
    expect(registry.count()).toBe(0);
  });
});
