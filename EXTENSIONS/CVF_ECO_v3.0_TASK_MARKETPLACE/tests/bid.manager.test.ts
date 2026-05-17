import { describe, it, expect, beforeEach } from "vitest";
import { BidManager, resetBidCounter } from "../src/bid.manager";

describe("BidManager", () => {
  let mgr: BidManager;

  beforeEach(() => {
    mgr = new BidManager();
    resetBidCounter();
  });

  it("submits bid with unique ID", () => {
    const b1 = mgr.submit("TASK-0001", "AGT-0001", 100);
    const b2 = mgr.submit("TASK-0001", "AGT-0002", 80);
    expect(b1.id).toMatch(/^BID-/);
    expect(b1.id).not.toBe(b2.id);
  });

  it("retrieves bid by ID", () => {
    const bid = mgr.submit("TASK-0001", "AGT-0001", 100);
    expect(mgr.get(bid.id)).toBeDefined();
  });

  it("finds bids by task", () => {
    mgr.submit("TASK-0001", "AGT-0001", 100);
    mgr.submit("TASK-0001", "AGT-0002", 80);
    mgr.submit("TASK-0002", "AGT-0001", 50);
    expect(mgr.findByTask("TASK-0001").length).toBe(2);
  });

  it("finds bids by agent", () => {
    mgr.submit("TASK-0001", "AGT-0001", 100);
    mgr.submit("TASK-0002", "AGT-0001", 50);
    expect(mgr.findByAgent("AGT-0001").length).toBe(2);
  });

  it("accepts bid and rejects others", () => {
    const b1 = mgr.submit("TASK-0001", "AGT-0001", 100);
    const b2 = mgr.submit("TASK-0001", "AGT-0002", 80);
    mgr.accept(b2.id);
    expect(mgr.get(b2.id)!.status).toBe("accepted");
    expect(mgr.get(b1.id)!.status).toBe("rejected");
  });

  it("rejects bid", () => {
    const bid = mgr.submit("TASK-0001", "AGT-0001", 100);
    mgr.reject(bid.id);
    expect(mgr.get(bid.id)!.status).toBe("rejected");
  });

  it("withdraws bid", () => {
    const bid = mgr.submit("TASK-0001", "AGT-0001", 100);
    mgr.withdraw(bid.id);
    expect(mgr.get(bid.id)!.status).toBe("withdrawn");
  });

  it("cannot accept non-pending bid", () => {
    const bid = mgr.submit("TASK-0001", "AGT-0001", 100);
    mgr.reject(bid.id);
    expect(mgr.accept(bid.id)).toBe(false);
  });

  it("finds lowest bid for task", () => {
    mgr.submit("TASK-0001", "AGT-0001", 100);
    mgr.submit("TASK-0001", "AGT-0002", 60);
    mgr.submit("TASK-0001", "AGT-0003", 80);
    const lowest = mgr.getLowestBid("TASK-0001");
    expect(lowest).toBeDefined();
    expect(lowest!.amount).toBe(60);
  });

  it("counts and clears", () => {
    mgr.submit("TASK-0001", "AGT-0001", 100);
    expect(mgr.count()).toBe(1);
    mgr.clear();
    expect(mgr.count()).toBe(0);
  });
});
