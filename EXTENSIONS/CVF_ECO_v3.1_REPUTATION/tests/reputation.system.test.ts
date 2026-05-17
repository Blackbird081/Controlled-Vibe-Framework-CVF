import { describe, it, expect, beforeEach } from "vitest";
import { ReputationSystem, resetEventCounter } from "../src/reputation.system";

describe("ReputationSystem", () => {
  let sys: ReputationSystem;

  beforeEach(() => {
    sys = new ReputationSystem();
    resetEventCounter();
  });

  describe("registration", () => {
    it("registers agent with initial score", () => {
      const profile = sys.register("AGT-0001");
      expect(profile.score).toBe(30);
      expect(profile.tier).toBe("newcomer");
    });

    it("does not duplicate registration", () => {
      sys.register("AGT-0001");
      const p2 = sys.register("AGT-0001");
      expect(sys.count()).toBe(1);
      expect(p2.agentId).toBe("AGT-0001");
    });
  });

  describe("events", () => {
    beforeEach(() => {
      sys.register("AGT-0001");
    });

    it("records task_completed event", () => {
      const event = sys.recordEvent("AGT-0001", "task_completed", "Finished audit");
      expect(event).toBeDefined();
      expect(event!.delta).toBe(5);
      expect(sys.getProfile("AGT-0001")!.score).toBe(35);
    });

    it("records violation event", () => {
      sys.recordEvent("AGT-0001", "violation", "Policy breach");
      expect(sys.getProfile("AGT-0001")!.score).toBe(15);
      expect(sys.getProfile("AGT-0001")!.violationCount).toBe(1);
    });

    it("records commendation event", () => {
      sys.recordEvent("AGT-0001", "commendation", "Great work");
      expect(sys.getProfile("AGT-0001")!.score).toBe(40);
      expect(sys.getProfile("AGT-0001")!.commendationCount).toBe(1);
    });

    it("tracks success and failure counts", () => {
      sys.recordEvent("AGT-0001", "task_completed");
      sys.recordEvent("AGT-0001", "task_completed");
      sys.recordEvent("AGT-0001", "task_failed");
      const p = sys.getProfile("AGT-0001")!;
      expect(p.successCount).toBe(2);
      expect(p.failureCount).toBe(1);
    });

    it("clamps score to 0-100", () => {
      sys.recordEvent("AGT-0001", "violation");
      sys.recordEvent("AGT-0001", "violation");
      expect(sys.getProfile("AGT-0001")!.score).toBe(0);
    });

    it("returns undefined for unregistered agent", () => {
      expect(sys.recordEvent("FAKE", "task_completed")).toBeUndefined();
    });
  });

  describe("history", () => {
    it("returns event history", () => {
      sys.register("AGT-0001");
      sys.recordEvent("AGT-0001", "task_completed");
      sys.recordEvent("AGT-0001", "task_completed");
      expect(sys.getHistory("AGT-0001").length).toBe(2);
    });

    it("returns recent history", () => {
      sys.register("AGT-0001");
      for (let i = 0; i < 15; i++) {
        sys.recordEvent("AGT-0001", "bid_accepted");
      }
      expect(sys.getRecentHistory("AGT-0001", 5).length).toBe(5);
    });
  });

  describe("summary", () => {
    it("generates summary for agent", () => {
      sys.register("AGT-0001");
      sys.recordEvent("AGT-0001", "task_completed");
      sys.recordEvent("AGT-0001", "task_completed");
      sys.recordEvent("AGT-0001", "task_failed");
      const summary = sys.summarize("AGT-0001");
      expect(summary).toBeDefined();
      expect(summary!.totalEvents).toBe(3);
      expect(summary!.successRate).toBeCloseTo(2 / 3);
    });

    it("returns undefined for unknown agent", () => {
      expect(sys.summarize("FAKE")).toBeUndefined();
    });
  });

  describe("leaderboard", () => {
    it("ranks agents by score", () => {
      sys.register("A");
      sys.register("B");
      sys.register("C");
      sys.recordEvent("B", "commendation");
      sys.recordEvent("B", "commendation");
      sys.recordEvent("C", "commendation");
      const board = sys.leaderboard();
      expect(board[0].agentId).toBe("B");
      expect(board[1].agentId).toBe("C");
    });
  });

  describe("tier filtering", () => {
    it("finds agents by tier", () => {
      sys.register("A");
      sys.register("B");
      sys.recordEvent("A", "commendation");
      sys.recordEvent("A", "commendation");
      sys.recordEvent("A", "commendation");
      expect(sys.findByTier("reliable").length).toBe(1);
      expect(sys.findByTier("newcomer").length).toBe(1);
    });
  });

  describe("end-to-end", () => {
    it("full reputation lifecycle", () => {
      sys.register("AGT-0001");

      sys.recordEvent("AGT-0001", "task_completed", "Audit done");
      sys.recordEvent("AGT-0001", "task_completed", "Review done");
      sys.recordEvent("AGT-0001", "commendation", "Excellent work");
      sys.recordEvent("AGT-0001", "bid_accepted", "Won bid");

      const profile = sys.getProfile("AGT-0001")!;
      expect(profile.score).toBe(52);
      expect(profile.tier).toBe("reliable");

      sys.recordEvent("AGT-0001", "violation", "Policy breach");
      expect(sys.getProfile("AGT-0001")!.score).toBe(37);
      expect(sys.getProfile("AGT-0001")!.tier).toBe("newcomer");

      const summary = sys.summarize("AGT-0001")!;
      expect(summary.totalEvents).toBe(5);
      expect(summary.recentTrend).toBe("improving");

      const board = sys.leaderboard();
      expect(board.length).toBe(1);
      expect(board[0].agentId).toBe("AGT-0001");
    });
  });
});
