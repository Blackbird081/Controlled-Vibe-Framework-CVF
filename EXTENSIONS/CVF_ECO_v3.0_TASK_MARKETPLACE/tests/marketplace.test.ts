import { describe, it, expect, beforeEach } from "vitest";
import { Marketplace, resetTaskCounter, resetBidCounter } from "../src/marketplace";

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

  it("places bid on task", () => {
    const task = mp.postTask({ title: "Audit", description: "Run audit", domain: "finance", priority: "high", createdBy: "admin" });
    const bid = mp.placeBid(task.id, "AGT-0001", 100);
    expect(bid).toBeDefined();
    expect(mp.getTaskRegistry().get(task.id)!.status).toBe("bidding");
  });

  it("rejects bid on nonexistent task", () => {
    expect(mp.placeBid("FAKE", "AGT-0001", 100)).toBeUndefined();
  });

  it("accepts bid and assigns task", () => {
    const task = mp.postTask({ title: "Audit", description: "D", domain: "finance", priority: "high", createdBy: "admin" });
    const bid = mp.placeBid(task.id, "AGT-0001", 100)!;
    mp.acceptBid(bid.id);
    expect(mp.getTaskRegistry().get(task.id)!.assignedTo).toBe("AGT-0001");
    expect(mp.getTaskRegistry().get(task.id)!.status).toBe("assigned");
  });

  it("auto-assigns to lowest bidder", () => {
    const task = mp.postTask({ title: "Audit", description: "D", domain: "finance", priority: "high", createdBy: "admin" });
    mp.placeBid(task.id, "AGT-0001", 100);
    mp.placeBid(task.id, "AGT-0002", 60);
    mp.placeBid(task.id, "AGT-0003", 80);
    mp.autoAssign(task.id);
    expect(mp.getTaskRegistry().get(task.id)!.assignedTo).toBe("AGT-0002");
  });

  it("starts and completes task", () => {
    const task = mp.postTask({ title: "Audit", description: "D", domain: "finance", priority: "high", createdBy: "admin" });
    const bid = mp.placeBid(task.id, "AGT-0001", 100)!;
    mp.acceptBid(bid.id);
    mp.startTask(task.id);
    expect(mp.getTaskRegistry().get(task.id)!.status).toBe("in_progress");

    const result = mp.completeTask(task.id, "All checks passed", true, 5);
    expect(result).toBeDefined();
    expect(result!.success).toBe(true);
    expect(mp.getTaskRegistry().get(task.id)!.status).toBe("completed");
  });

  it("cancels task", () => {
    const task = mp.postTask({ title: "Audit", description: "D", domain: "finance", priority: "high", createdBy: "admin" });
    expect(mp.cancelTask(task.id)).toBe(true);
    expect(mp.getTaskRegistry().get(task.id)!.status).toBe("cancelled");
  });

  it("cannot cancel completed task", () => {
    const task = mp.postTask({ title: "Audit", description: "D", domain: "finance", priority: "high", createdBy: "admin" });
    const bid = mp.placeBid(task.id, "AGT-0001", 100)!;
    mp.acceptBid(bid.id);
    mp.startTask(task.id);
    mp.completeTask(task.id, "Done", true);
    expect(mp.cancelTask(task.id)).toBe(false);
  });

  it("retrieves results by task and agent", () => {
    const t1 = mp.postTask({ title: "T1", description: "D", domain: "finance", priority: "high", createdBy: "admin" });
    const b1 = mp.placeBid(t1.id, "AGT-0001", 100)!;
    mp.acceptBid(b1.id);
    mp.startTask(t1.id);
    mp.completeTask(t1.id, "OK", true);

    expect(mp.getResults(t1.id).length).toBe(1);
    expect(mp.getAgentResults("AGT-0001").length).toBe(1);
  });

  describe("end-to-end", () => {
    it("full marketplace workflow", () => {
      const task = mp.postTask({
        title: "Security Audit",
        description: "Full security review",
        domain: "code_security",
        priority: "critical",
        createdBy: "admin",
        requiredCapabilities: ["security_analysis"],
        reward: 500,
      });

      mp.placeBid(task.id, "AGT-0001", 400, "I specialize in security");
      mp.placeBid(task.id, "AGT-0002", 300, "Best rates");
      mp.placeBid(task.id, "AGT-0003", 350, "Fast delivery");

      mp.autoAssign(task.id);
      expect(mp.getTaskRegistry().get(task.id)!.assignedTo).toBe("AGT-0002");

      mp.startTask(task.id);
      const result = mp.completeTask(task.id, "No vulnerabilities found", true, 4);
      expect(result!.rating).toBe(4);
      expect(mp.getResults().length).toBe(1);
    });
  });
});
