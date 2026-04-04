import { describe, expect, it } from "vitest";
import { Marketplace, ReputationSystem, resetBidCounter, resetEventCounter, resetTaskCounter } from "../src/index";

describe("CVF_AGENT_LEDGER integration", () => {
  it("connects task completion history to reputation updates", () => {
    resetTaskCounter();
    resetBidCounter();
    resetEventCounter();

    const marketplace = new Marketplace();
    const reputation = new ReputationSystem();

    reputation.register("AGT-0007");

    const task = marketplace.postTask({
      title: "Ledger merge review",
      description: "Review current-cycle merge receipts",
      domain: "governance",
      priority: "medium",
      createdBy: "architect",
    });
    const bid = marketplace.placeBid(task.id, "AGT-0007", 50)!;

    marketplace.acceptBid(bid.id);
    marketplace.startTask(task.id);
    const result = marketplace.completeTask(task.id, "Looks good", true, 5)!;

    reputation.recordEvent(result.agentId, "task_completed", "Task completed via marketplace");
    if ((result.rating ?? 0) >= 5) {
      reputation.recordEvent(result.agentId, "commendation", "High quality task result");
    }

    const summary = reputation.summarize("AGT-0007")!;
    expect(summary.totalEvents).toBe(2);
    expect(summary.score).toBe(45);
    expect(summary.recentTrend).toBe("improving");
  });
});
