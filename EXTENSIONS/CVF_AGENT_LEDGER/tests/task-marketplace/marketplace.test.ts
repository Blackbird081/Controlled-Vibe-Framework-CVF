import { beforeEach, describe, expect, it } from "vitest";
import { Marketplace, resetBidCounter, resetTaskCounter } from "../../src/task-marketplace/marketplace";

describe("Marketplace", () => {
  let mp: Marketplace;

  beforeEach(() => {
    mp = new Marketplace();
    resetTaskCounter();
    resetBidCounter();
  });

  it("posts task", () => {
    const task = mp.postTask({ title: "Audit", description: "Run audit", domain: "finance", priority: "high", createdBy: "admin" });
    expect(task.id).toMatch(/^TASK-/);
    expect(task.status).toBe("open");
  });

  it("places bid and completes marketplace workflow", () => {
    const task = mp.postTask({ title: "Audit", description: "D", domain: "finance", priority: "high", createdBy: "admin" });
    const bid = mp.placeBid(task.id, "AGT-0001", 100)!;

    expect(mp.acceptBid(bid.id)).toBe(true);
    expect(mp.startTask(task.id)).toBe(true);
    const result = mp.completeTask(task.id, "All checks passed", true, 5)!;

    expect(result.agentId).toBe("AGT-0001");
    expect(mp.getTaskRegistry().get(task.id)!.status).toBe("completed");
  });

  it("auto-assigns to lowest bidder", () => {
    const task = mp.postTask({ title: "Audit", description: "D", domain: "finance", priority: "high", createdBy: "admin" });
    mp.placeBid(task.id, "AGT-0001", 100);
    mp.placeBid(task.id, "AGT-0002", 60);
    mp.placeBid(task.id, "AGT-0003", 80);
    mp.autoAssign(task.id);
    expect(mp.getTaskRegistry().get(task.id)!.assignedTo).toBe("AGT-0002");
  });
});
