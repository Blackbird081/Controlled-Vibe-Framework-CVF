import { beforeEach, describe, expect, it } from "vitest";
import { BidManager, resetBidCounter } from "../../src/task-marketplace/bid.manager";

describe("BidManager", () => {
  let mgr: BidManager;

  beforeEach(() => {
    mgr = new BidManager();
    resetBidCounter();
  });

  it("submits and queries bids", () => {
    const b1 = mgr.submit("TASK-0001", "AGT-0001", 100);
    const b2 = mgr.submit("TASK-0001", "AGT-0002", 80);

    expect(b1.id).toMatch(/^BID-/);
    expect(mgr.findByTask("TASK-0001").length).toBe(2);
    expect(mgr.findByAgent("AGT-0001").length).toBe(1);
    expect(mgr.getLowestBid("TASK-0001")!.id).toBe(b2.id);
  });

  it("accepts and rejects bids correctly", () => {
    const b1 = mgr.submit("TASK-0001", "AGT-0001", 100);
    const b2 = mgr.submit("TASK-0001", "AGT-0002", 80);

    expect(mgr.accept(b2.id)).toBe(true);
    expect(mgr.get(b2.id)!.status).toBe("accepted");
    expect(mgr.get(b1.id)!.status).toBe("rejected");
  });
});
