import { beforeEach, describe, expect, it } from "vitest";
import { TaskRegistry, resetTaskCounter } from "../../src/task-marketplace/task.registry";

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

  it("finds tasks by status, domain, and capability", () => {
    registry.create({ title: "T1", description: "D", domain: "finance", priority: "high", createdBy: "admin", requiredCapabilities: ["analysis"] });
    const t2 = registry.create({ title: "T2", description: "D", domain: "privacy", priority: "low", createdBy: "admin" });
    registry.updateStatus(t2.id, "completed");

    expect(registry.findByStatus("open").length).toBe(1);
    expect(registry.findByDomain("finance").length).toBe(1);
    expect(registry.findByCapability("analysis").length).toBe(1);
  });
});
