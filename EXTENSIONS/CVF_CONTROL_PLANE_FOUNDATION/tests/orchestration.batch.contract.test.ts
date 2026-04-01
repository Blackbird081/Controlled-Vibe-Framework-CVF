import { describe, it, expect } from "vitest";
import {
  OrchestrationBatchContract,
  createOrchestrationBatchContract,
  type OrchestrationBatchResult,
  type DominantRiskLevel,
} from "../src/orchestration.batch.contract";
import { OrchestrationContract } from "../src/orchestration.contract";
import type { DesignPlan, DesignTask, DesignTaskRisk, DesignAgentRole, DesignTaskPhase } from "../src/design.contract";

// --- Helpers ---

const FIXED_NOW = "2026-04-01T00:00:00.000Z";

function makeTask(
  id: string,
  riskLevel: DesignTaskRisk,
  role: DesignAgentRole = "builder",
  phase: DesignTaskPhase = "BUILD",
): DesignTask {
  return {
    taskId: id,
    title: `Task ${id}`,
    description: "Test task",
    assignedRole: role,
    riskLevel,
    targetPhase: phase,
    estimatedComplexity: "low",
    dependencies: [],
  };
}

function makePlan(planId: string, tasks: DesignTask[]): DesignPlan {
  const riskSummary: Record<DesignTaskRisk, number> = { R0: 0, R1: 0, R2: 0, R3: 0 };
  const roleSummary: Record<DesignAgentRole, number> = {
    orchestrator: 0,
    architect: 0,
    builder: 0,
    reviewer: 0,
  };
  for (const task of tasks) {
    riskSummary[task.riskLevel]++;
    roleSummary[task.assignedRole]++;
  }
  return {
    planId,
    createdAt: FIXED_NOW,
    intakeRequestId: `intake-${planId}`,
    vibeOriginal: "test vibe",
    domainDetected: "general",
    tasks,
    totalTasks: tasks.length,
    riskSummary,
    roleSummary,
    planHash: `hash-${planId}`,
    warnings: [],
  };
}

function makeContract(): { contract: OrchestrationContract; batchContract: OrchestrationBatchContract } {
  const contract = new OrchestrationContract({ now: () => FIXED_NOW });
  const batchContract = new OrchestrationBatchContract({ now: () => FIXED_NOW });
  return { contract, batchContract };
}

// --- Tests ---

describe("OrchestrationBatchContract", () => {
  describe("empty batch", () => {
    it("returns totalPlans=0 for empty batch", () => {
      const { contract, batchContract } = makeContract();
      const result = batchContract.batch([], contract);
      expect(result.totalPlans).toBe(0);
    });

    it("returns totalAssignments=0 for empty batch", () => {
      const { contract, batchContract } = makeContract();
      const result = batchContract.batch([], contract);
      expect(result.totalAssignments).toBe(0);
    });

    it("returns all risk counts zero for empty batch", () => {
      const { contract, batchContract } = makeContract();
      const result = batchContract.batch([], contract);
      expect(result.r0Count).toBe(0);
      expect(result.r1Count).toBe(0);
      expect(result.r2Count).toBe(0);
      expect(result.r3Count).toBe(0);
    });

    it("returns dominantRiskLevel NONE for empty batch", () => {
      const { contract, batchContract } = makeContract();
      const result = batchContract.batch([], contract);
      expect(result.dominantRiskLevel).toBe("NONE");
    });

    it("returns empty results array for empty batch", () => {
      const { contract, batchContract } = makeContract();
      const result = batchContract.batch([], contract);
      expect(result.results).toHaveLength(0);
    });

    it("still produces batchHash and batchId for empty batch", () => {
      const { contract, batchContract } = makeContract();
      const result = batchContract.batch([], contract);
      expect(typeof result.batchHash).toBe("string");
      expect(result.batchHash.length).toBeGreaterThan(0);
      expect(typeof result.batchId).toBe("string");
      expect(result.batchId.length).toBeGreaterThan(0);
    });
  });

  describe("single plan routing", () => {
    it("returns dominantRiskLevel R0 for plan with only R0 tasks", () => {
      const { contract, batchContract } = makeContract();
      const plan = makePlan("p1", [makeTask("t1", "R0"), makeTask("t2", "R0")]);
      const result = batchContract.batch([plan], contract);
      expect(result.dominantRiskLevel).toBe("R0");
    });

    it("returns dominantRiskLevel R1 for plan with only R1 tasks", () => {
      const { contract, batchContract } = makeContract();
      const plan = makePlan("p1", [makeTask("t1", "R1")]);
      const result = batchContract.batch([plan], contract);
      expect(result.dominantRiskLevel).toBe("R1");
    });

    it("returns dominantRiskLevel R2 for plan with only R2 tasks", () => {
      const { contract, batchContract } = makeContract();
      const plan = makePlan("p1", [makeTask("t1", "R2"), makeTask("t2", "R2")]);
      const result = batchContract.batch([plan], contract);
      expect(result.dominantRiskLevel).toBe("R2");
    });

    it("returns dominantRiskLevel R3 for plan with only R3 tasks", () => {
      const { contract, batchContract } = makeContract();
      const plan = makePlan("p1", [makeTask("t1", "R3")]);
      const result = batchContract.batch([plan], contract);
      expect(result.dominantRiskLevel).toBe("R3");
    });

    it("returns totalPlans=1 for single plan", () => {
      const { contract, batchContract } = makeContract();
      const plan = makePlan("p1", [makeTask("t1", "R0")]);
      const result = batchContract.batch([plan], contract);
      expect(result.totalPlans).toBe(1);
    });
  });

  describe("dominant risk level resolution", () => {
    it("R3 wins over R0 when R3 count is highest", () => {
      const { contract, batchContract } = makeContract();
      const p1 = makePlan("p1", [makeTask("t1", "R3"), makeTask("t2", "R3")]);
      const p2 = makePlan("p2", [makeTask("t3", "R0")]);
      const result = batchContract.batch([p1, p2], contract);
      expect(result.dominantRiskLevel).toBe("R3");
    });

    it("R2 wins over R1 when R2 count is highest", () => {
      const { contract, batchContract } = makeContract();
      const p1 = makePlan("p1", [makeTask("t1", "R2"), makeTask("t2", "R2")]);
      const p2 = makePlan("p2", [makeTask("t3", "R1")]);
      const result = batchContract.batch([p1, p2], contract);
      expect(result.dominantRiskLevel).toBe("R2");
    });

    it("R3 wins tie over R2 by priority", () => {
      const { contract, batchContract } = makeContract();
      const p1 = makePlan("p1", [makeTask("t1", "R3")]);
      const p2 = makePlan("p2", [makeTask("t2", "R2")]);
      const result = batchContract.batch([p1, p2], contract);
      expect(result.r3Count).toBe(1);
      expect(result.r2Count).toBe(1);
      expect(result.dominantRiskLevel).toBe("R3");
    });

    it("R2 wins tie over R1 by priority", () => {
      const { contract, batchContract } = makeContract();
      const p1 = makePlan("p1", [makeTask("t1", "R2")]);
      const p2 = makePlan("p2", [makeTask("t2", "R1")]);
      const result = batchContract.batch([p1, p2], contract);
      expect(result.r2Count).toBe(1);
      expect(result.r1Count).toBe(1);
      expect(result.dominantRiskLevel).toBe("R2");
    });

    it("R1 wins tie over R0 by priority", () => {
      const { contract, batchContract } = makeContract();
      const p1 = makePlan("p1", [makeTask("t1", "R1")]);
      const p2 = makePlan("p2", [makeTask("t2", "R0")]);
      const result = batchContract.batch([p1, p2], contract);
      expect(result.r1Count).toBe(1);
      expect(result.r0Count).toBe(1);
      expect(result.dominantRiskLevel).toBe("R1");
    });

    it("R3 wins tie over R1 by priority", () => {
      const { contract, batchContract } = makeContract();
      const p1 = makePlan("p1", [makeTask("t1", "R3")]);
      const p2 = makePlan("p2", [makeTask("t2", "R1")]);
      const result = batchContract.batch([p1, p2], contract);
      expect(result.dominantRiskLevel).toBe("R3");
    });

    it("frequency wins: R1 with count 3 beats R3 with count 1", () => {
      const { contract, batchContract } = makeContract();
      const p1 = makePlan("p1", [makeTask("t1", "R1"), makeTask("t2", "R1"), makeTask("t3", "R1")]);
      const p2 = makePlan("p2", [makeTask("t4", "R3")]);
      const result = batchContract.batch([p1, p2], contract);
      expect(result.r1Count).toBe(3);
      expect(result.r3Count).toBe(1);
      expect(result.dominantRiskLevel).toBe("R1");
    });
  });

  describe("count accuracy", () => {
    it("totalAssignments equals sum of all tasks across plans", () => {
      const { contract, batchContract } = makeContract();
      const p1 = makePlan("p1", [makeTask("t1", "R0"), makeTask("t2", "R1")]);
      const p2 = makePlan("p2", [makeTask("t3", "R2"), makeTask("t4", "R2"), makeTask("t5", "R3")]);
      const result = batchContract.batch([p1, p2], contract);
      expect(result.totalAssignments).toBe(5);
    });

    it("risk counts sum to totalAssignments", () => {
      const { contract, batchContract } = makeContract();
      const p1 = makePlan("p1", [makeTask("t1", "R0"), makeTask("t2", "R1"), makeTask("t3", "R2")]);
      const p2 = makePlan("p2", [makeTask("t4", "R3"), makeTask("t5", "R0")]);
      const result = batchContract.batch([p1, p2], contract);
      expect(result.r0Count + result.r1Count + result.r2Count + result.r3Count).toBe(result.totalAssignments);
    });

    it("r0Count correctly aggregated across plans", () => {
      const { contract, batchContract } = makeContract();
      const p1 = makePlan("p1", [makeTask("t1", "R0"), makeTask("t2", "R0")]);
      const p2 = makePlan("p2", [makeTask("t3", "R0")]);
      const p3 = makePlan("p3", [makeTask("t4", "R1")]);
      const result = batchContract.batch([p1, p2, p3], contract);
      expect(result.r0Count).toBe(3);
    });

    it("r3Count correctly aggregated across plans", () => {
      const { contract, batchContract } = makeContract();
      const p1 = makePlan("p1", [makeTask("t1", "R3"), makeTask("t2", "R3")]);
      const p2 = makePlan("p2", [makeTask("t3", "R3"), makeTask("t4", "R0")]);
      const result = batchContract.batch([p1, p2], contract);
      expect(result.r3Count).toBe(3);
    });

    it("plan with no tasks contributes zero to all counts", () => {
      const { contract, batchContract } = makeContract();
      const emptyPlan = makePlan("empty", []);
      const result = batchContract.batch([emptyPlan], contract);
      expect(result.totalPlans).toBe(1);
      expect(result.totalAssignments).toBe(0);
      expect(result.r0Count).toBe(0);
      expect(result.dominantRiskLevel).toBe("NONE");
    });
  });

  describe("determinism", () => {
    it("batchHash is deterministic for same plans and timestamp", () => {
      const plan = makePlan("p1", [makeTask("t1", "R2")]);
      const contract = new OrchestrationContract({ now: () => FIXED_NOW });
      const b1 = new OrchestrationBatchContract({ now: () => FIXED_NOW });
      const b2 = new OrchestrationBatchContract({ now: () => FIXED_NOW });
      expect(b1.batch([plan], contract).batchHash).toBe(b2.batch([plan], contract).batchHash);
    });

    it("batchId is deterministic for same plans and timestamp", () => {
      const plan = makePlan("p1", [makeTask("t1", "R1")]);
      const contract = new OrchestrationContract({ now: () => FIXED_NOW });
      const b1 = new OrchestrationBatchContract({ now: () => FIXED_NOW });
      const b2 = new OrchestrationBatchContract({ now: () => FIXED_NOW });
      expect(b1.batch([plan], contract).batchId).toBe(b2.batch([plan], contract).batchId);
    });

    it("batchHash and batchId are distinct", () => {
      const { contract, batchContract } = makeContract();
      const plan = makePlan("p1", [makeTask("t1", "R0")]);
      const result = batchContract.batch([plan], contract);
      expect(result.batchHash).not.toBe(result.batchId);
    });

    it("batchHash changes when plans change", () => {
      const contract = new OrchestrationContract({ now: () => FIXED_NOW });
      const batchContract = new OrchestrationBatchContract({ now: () => FIXED_NOW });
      const planA = makePlan("p1", [makeTask("t1", "R0")]);
      const planB = makePlan("p2", [makeTask("t2", "R3")]);
      const h1 = batchContract.batch([planA], contract).batchHash;
      const h2 = batchContract.batch([planB], contract).batchHash;
      expect(h1).not.toBe(h2);
    });
  });

  describe("output shape", () => {
    it("createdAt uses injected now function", () => {
      const { contract, batchContract } = makeContract();
      const result = batchContract.batch([], contract);
      expect(result.createdAt).toBe(FIXED_NOW);
    });

    it("results array length matches number of plans", () => {
      const { contract, batchContract } = makeContract();
      const p1 = makePlan("p1", [makeTask("t1", "R0")]);
      const p2 = makePlan("p2", [makeTask("t2", "R1")]);
      const p3 = makePlan("p3", [makeTask("t3", "R2")]);
      const result = batchContract.batch([p1, p2, p3], contract);
      expect(result.results).toHaveLength(3);
    });

    it("each result has an orchestrationHash", () => {
      const { contract, batchContract } = makeContract();
      const plan = makePlan("p1", [makeTask("t1", "R0")]);
      const result = batchContract.batch([plan], contract);
      expect(typeof result.results[0].orchestrationHash).toBe("string");
      expect(result.results[0].orchestrationHash.length).toBeGreaterThan(0);
    });

    it("output contains all required fields", () => {
      const { contract, batchContract } = makeContract();
      const result: OrchestrationBatchResult = batchContract.batch([], contract);
      expect(result).toHaveProperty("batchId");
      expect(result).toHaveProperty("batchHash");
      expect(result).toHaveProperty("createdAt");
      expect(result).toHaveProperty("totalPlans");
      expect(result).toHaveProperty("totalAssignments");
      expect(result).toHaveProperty("r0Count");
      expect(result).toHaveProperty("r1Count");
      expect(result).toHaveProperty("r2Count");
      expect(result).toHaveProperty("r3Count");
      expect(result).toHaveProperty("dominantRiskLevel");
      expect(result).toHaveProperty("results");
    });
  });

  describe("factory", () => {
    it("createOrchestrationBatchContract returns an OrchestrationBatchContract instance", () => {
      const instance = createOrchestrationBatchContract();
      expect(instance).toBeInstanceOf(OrchestrationBatchContract);
    });

    it("factory result can call batch without error", () => {
      const contract = new OrchestrationContract({ now: () => FIXED_NOW });
      const batchContract = createOrchestrationBatchContract({ now: () => FIXED_NOW });
      const plan = makePlan("p1", [makeTask("t1", "R2")]);
      expect(() => batchContract.batch([plan], contract)).not.toThrow();
    });
  });
});
