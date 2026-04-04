import { beforeEach, describe, expect, it } from "vitest";
import { ReputationSystem, resetEventCounter } from "../../src/reputation/reputation.system";

describe("ReputationSystem", () => {
  let sys: ReputationSystem;

  beforeEach(() => {
    sys = new ReputationSystem();
    resetEventCounter();
  });

  it("registers agents and records events", () => {
    const profile = sys.register("AGT-0001");
    expect(profile.tier).toBe("newcomer");

    sys.recordEvent("AGT-0001", "task_completed", "Finished audit");
    sys.recordEvent("AGT-0001", "commendation", "Great work");

    expect(sys.getProfile("AGT-0001")!.score).toBe(45);
    expect(sys.getHistory("AGT-0001").length).toBe(2);
  });

  it("produces leaderboard and summary", () => {
    sys.register("A");
    sys.register("B");
    sys.recordEvent("B", "commendation");
    sys.recordEvent("B", "commendation");

    expect(sys.leaderboard()[0].agentId).toBe("B");
    expect(sys.summarize("B")!.totalEvents).toBe(2);
  });
});
