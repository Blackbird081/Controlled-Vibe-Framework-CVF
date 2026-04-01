import { describe, it, expect } from "vitest";
import {
  BoardroomTransitionGateBatchContract,
  createBoardroomTransitionGateBatchContract,
  resolveDominantTransitionAction,
  type BoardroomTransitionGateBatch,
} from "../src/boardroom.transition.gate.batch.contract";
import { BoardroomContract } from "../src/boardroom.contract";
import type { BoardroomRequest, BoardroomSession } from "../src/boardroom.contract";
import type { DesignPlan } from "../src/design.contract";
import { GovernanceCanvas } from "../../CVF_ECO_v2.1_GOVERNANCE_CANVAS/src/canvas";

// --- Helpers ---

const FIXED_NOW = "2026-04-01T00:00:00.000Z";

function makePlan(
  id: string,
  opts: {
    r3Count?: number;
    r2Count?: number;
    r1Count?: number;
    r0Count?: number;
    warnings?: string[];
    domain?: string;
    empty?: boolean;
  } = {},
): DesignPlan {
  const r3 = opts.r3Count ?? 0;
  const r2 = opts.r2Count ?? 0;
  const r1 = opts.r1Count ?? 0;
  const r0 = opts.r0Count ?? 0;
  const warnings = opts.warnings ?? [];
  const domain = opts.domain ?? "general";
  const empty = opts.empty ?? false;

  const tasks = empty
    ? []
    : [
        ...Array.from({ length: r3 }, (_, i) => ({
          taskId: `task-r3-${i}`,
          title: `R3 Task ${i}`,
          description: `R3 task ${i}`,
          assignedRole: "architect" as const,
          riskLevel: "R3" as const,
          targetPhase: "DESIGN" as const,
          estimatedComplexity: "high" as const,
          dependencies: [],
        })),
        ...Array.from({ length: r2 }, (_, i) => ({
          taskId: `task-r2-${i}`,
          title: `R2 Task ${i}`,
          description: `R2 task ${i}`,
          assignedRole: "builder" as const,
          riskLevel: "R2" as const,
          targetPhase: "BUILD" as const,
          estimatedComplexity: "medium" as const,
          dependencies: [],
        })),
        ...Array.from({ length: r1 }, (_, i) => ({
          taskId: `task-r1-${i}`,
          title: `R1 Task ${i}`,
          description: `R1 task ${i}`,
          assignedRole: "builder" as const,
          riskLevel: "R1" as const,
          targetPhase: "BUILD" as const,
          estimatedComplexity: "low" as const,
          dependencies: [],
        })),
        ...Array.from({ length: r0 }, (_, i) => ({
          taskId: `task-r0-${i}`,
          title: `R0 Task ${i}`,
          description: `R0 task ${i}`,
          assignedRole: "reviewer" as const,
          riskLevel: "R0" as const,
          targetPhase: "REVIEW" as const,
          estimatedComplexity: "low" as const,
          dependencies: [],
        })),
      ];

  const totalTasks = tasks.length;

  return {
    planId: empty ? "" : id,
    createdAt: FIXED_NOW,
    intakeRequestId: `intake-${id}`,
    consumerId: "test-consumer",
    vibeOriginal: `vibe for ${id}`,
    tasks,
    totalTasks,
    riskSummary: { R3: r3, R2: r2, R1: r1, R0: r0 },
    roleSummary: {
      orchestrator: 0,
      architect: r3,
      builder: r2 + r1,
      reviewer: r0,
    },
    domainDetected: domain,
    planHash: `hash-${id}`,
    warnings,
  };
}

function makeCanvas(): GovernanceCanvas {
  return new GovernanceCanvas();
}

function makeSession(
  decision: "PROCEED" | "AMEND_PLAN" | "ESCALATE" | "REJECT",
): BoardroomSession {
  const contract = new BoardroomContract({
    canvas: makeCanvas(),
    now: () => FIXED_NOW,
  });
  let request: BoardroomRequest;
  if (decision === "PROCEED") {
    request = { plan: makePlan("plan-proceed", { r0Count: 2 }), clarifications: [] };
  } else if (decision === "AMEND_PLAN") {
    request = {
      plan: makePlan("plan-amend", { r1Count: 1 }),
      clarifications: [{ question: "What is the timeline?", answer: undefined }],
    };
  } else if (decision === "ESCALATE") {
    request = {
      plan: makePlan("plan-escalate", { r3Count: 1, warnings: ["Intake had low confidence."] }),
      clarifications: [],
    };
  } else {
    request = { plan: makePlan("plan-reject", { empty: true }), clarifications: [] };
  }
  return contract.review(request);
}

function makeBatchContract(): BoardroomTransitionGateBatchContract {
  return new BoardroomTransitionGateBatchContract({
    contractDependencies: { now: () => FIXED_NOW },
    now: () => FIXED_NOW,
  });
}

// --- Tests: resolveDominantTransitionAction ---

describe("resolveDominantTransitionAction", () => {
  it("returns NONE for empty gates array", () => {
    expect(resolveDominantTransitionAction([])).toBe("NONE");
  });

  it("returns PROCEED_TO_ORCHESTRATION when all gates are PROCEED_TO_ORCHESTRATION", () => {
    const contract = makeBatchContract();
    const result = contract.batch([makeSession("PROCEED"), makeSession("PROCEED")]);
    expect(resolveDominantTransitionAction(result.gates)).toBe("PROCEED_TO_ORCHESTRATION");
  });

  it("returns RETURN_TO_DESIGN when mixed PROCEED and RETURN_TO_DESIGN", () => {
    const contract = makeBatchContract();
    const result = contract.batch([makeSession("PROCEED"), makeSession("AMEND_PLAN")]);
    expect(resolveDominantTransitionAction(result.gates)).toBe("RETURN_TO_DESIGN");
  });

  it("returns ESCALATE_FOR_REVIEW when ESCALATE present among lower actions", () => {
    const contract = makeBatchContract();
    const result = contract.batch([
      makeSession("PROCEED"),
      makeSession("AMEND_PLAN"),
      makeSession("ESCALATE"),
    ]);
    expect(resolveDominantTransitionAction(result.gates)).toBe("ESCALATE_FOR_REVIEW");
  });

  it("returns STOP_EXECUTION when REJECT present — highest severity wins", () => {
    const contract = makeBatchContract();
    const result = contract.batch([
      makeSession("PROCEED"),
      makeSession("ESCALATE"),
      makeSession("REJECT"),
    ]);
    expect(resolveDominantTransitionAction(result.gates)).toBe("STOP_EXECUTION");
  });

  it("returns STOP_EXECUTION when all gates are STOP_EXECUTION", () => {
    const contract = makeBatchContract();
    const result = contract.batch([makeSession("REJECT"), makeSession("REJECT")]);
    expect(resolveDominantTransitionAction(result.gates)).toBe("STOP_EXECUTION");
  });
});

// --- Tests: empty batch ---

describe("BoardroomTransitionGateBatchContract.batch — empty batch", () => {
  it("returns NONE dominantAction for empty sessions", () => {
    const result = makeBatchContract().batch([]);
    expect(result.dominantAction).toBe("NONE");
  });

  it("returns zero totalGates for empty batch", () => {
    expect(makeBatchContract().batch([]).totalGates).toBe(0);
  });

  it("returns zero proceedCount for empty batch", () => {
    expect(makeBatchContract().batch([]).proceedCount).toBe(0);
  });

  it("returns zero returnToDesignCount for empty batch", () => {
    expect(makeBatchContract().batch([]).returnToDesignCount).toBe(0);
  });

  it("returns zero escalateCount for empty batch", () => {
    expect(makeBatchContract().batch([]).escalateCount).toBe(0);
  });

  it("returns zero stopCount for empty batch", () => {
    expect(makeBatchContract().batch([]).stopCount).toBe(0);
  });

  it("returns allowOrchestration false for empty batch", () => {
    expect(makeBatchContract().batch([]).allowOrchestration).toBe(false);
  });

  it("returns empty gates array for empty batch", () => {
    expect(makeBatchContract().batch([]).gates).toHaveLength(0);
  });
});

// --- Tests: single session routing ---

describe("BoardroomTransitionGateBatchContract.batch — single session routing", () => {
  it("routes PROCEED session to PROCEED_TO_ORCHESTRATION", () => {
    const result = makeBatchContract().batch([makeSession("PROCEED")]);
    expect(result.gates[0].action).toBe("PROCEED_TO_ORCHESTRATION");
    expect(result.dominantAction).toBe("PROCEED_TO_ORCHESTRATION");
    expect(result.proceedCount).toBe(1);
    expect(result.allowOrchestration).toBe(true);
  });

  it("routes AMEND_PLAN session to RETURN_TO_DESIGN", () => {
    const result = makeBatchContract().batch([makeSession("AMEND_PLAN")]);
    expect(result.gates[0].action).toBe("RETURN_TO_DESIGN");
    expect(result.dominantAction).toBe("RETURN_TO_DESIGN");
    expect(result.returnToDesignCount).toBe(1);
    expect(result.allowOrchestration).toBe(false);
  });

  it("routes ESCALATE session to ESCALATE_FOR_REVIEW", () => {
    const result = makeBatchContract().batch([makeSession("ESCALATE")]);
    expect(result.gates[0].action).toBe("ESCALATE_FOR_REVIEW");
    expect(result.dominantAction).toBe("ESCALATE_FOR_REVIEW");
    expect(result.escalateCount).toBe(1);
    expect(result.allowOrchestration).toBe(false);
  });

  it("routes REJECT session to STOP_EXECUTION", () => {
    const result = makeBatchContract().batch([makeSession("REJECT")]);
    expect(result.gates[0].action).toBe("STOP_EXECUTION");
    expect(result.dominantAction).toBe("STOP_EXECUTION");
    expect(result.stopCount).toBe(1);
    expect(result.allowOrchestration).toBe(false);
  });
});

// --- Tests: dominant action resolution ---

describe("BoardroomTransitionGateBatchContract.batch — dominant action resolution", () => {
  it("STOP_EXECUTION dominates ESCALATE_FOR_REVIEW", () => {
    const result = makeBatchContract().batch([makeSession("ESCALATE"), makeSession("REJECT")]);
    expect(result.dominantAction).toBe("STOP_EXECUTION");
  });

  it("STOP_EXECUTION dominates RETURN_TO_DESIGN", () => {
    const result = makeBatchContract().batch([makeSession("AMEND_PLAN"), makeSession("REJECT")]);
    expect(result.dominantAction).toBe("STOP_EXECUTION");
  });

  it("STOP_EXECUTION dominates PROCEED_TO_ORCHESTRATION", () => {
    const result = makeBatchContract().batch([makeSession("PROCEED"), makeSession("REJECT")]);
    expect(result.dominantAction).toBe("STOP_EXECUTION");
  });

  it("ESCALATE_FOR_REVIEW dominates RETURN_TO_DESIGN", () => {
    const result = makeBatchContract().batch([makeSession("AMEND_PLAN"), makeSession("ESCALATE")]);
    expect(result.dominantAction).toBe("ESCALATE_FOR_REVIEW");
  });

  it("ESCALATE_FOR_REVIEW dominates PROCEED_TO_ORCHESTRATION", () => {
    const result = makeBatchContract().batch([makeSession("PROCEED"), makeSession("ESCALATE")]);
    expect(result.dominantAction).toBe("ESCALATE_FOR_REVIEW");
  });

  it("RETURN_TO_DESIGN dominates PROCEED_TO_ORCHESTRATION", () => {
    const result = makeBatchContract().batch([makeSession("PROCEED"), makeSession("AMEND_PLAN")]);
    expect(result.dominantAction).toBe("RETURN_TO_DESIGN");
  });
});

// --- Tests: allowOrchestration ---

describe("BoardroomTransitionGateBatchContract.batch — allowOrchestration", () => {
  it("allowOrchestration true when all sessions PROCEED", () => {
    const result = makeBatchContract().batch([
      makeSession("PROCEED"),
      makeSession("PROCEED"),
      makeSession("PROCEED"),
    ]);
    expect(result.allowOrchestration).toBe(true);
  });

  it("allowOrchestration false when any session is AMEND_PLAN", () => {
    const result = makeBatchContract().batch([makeSession("PROCEED"), makeSession("AMEND_PLAN")]);
    expect(result.allowOrchestration).toBe(false);
  });

  it("allowOrchestration false when any session is ESCALATE", () => {
    const result = makeBatchContract().batch([makeSession("PROCEED"), makeSession("ESCALATE")]);
    expect(result.allowOrchestration).toBe(false);
  });

  it("allowOrchestration false when any session is REJECT", () => {
    const result = makeBatchContract().batch([makeSession("PROCEED"), makeSession("REJECT")]);
    expect(result.allowOrchestration).toBe(false);
  });
});

// --- Tests: count accuracy ---

describe("BoardroomTransitionGateBatchContract.batch — count accuracy", () => {
  it("counts all action types correctly in a mixed batch", () => {
    const result = makeBatchContract().batch([
      makeSession("PROCEED"),
      makeSession("PROCEED"),
      makeSession("AMEND_PLAN"),
      makeSession("ESCALATE"),
      makeSession("REJECT"),
    ]);
    expect(result.totalGates).toBe(5);
    expect(result.proceedCount).toBe(2);
    expect(result.returnToDesignCount).toBe(1);
    expect(result.escalateCount).toBe(1);
    expect(result.stopCount).toBe(1);
  });

  it("totalGates equals gates array length", () => {
    const result = makeBatchContract().batch([
      makeSession("PROCEED"),
      makeSession("AMEND_PLAN"),
      makeSession("REJECT"),
    ]);
    expect(result.totalGates).toBe(result.gates.length);
  });

  it("all counts sum to totalGates", () => {
    const result = makeBatchContract().batch([
      makeSession("PROCEED"),
      makeSession("AMEND_PLAN"),
      makeSession("ESCALATE"),
      makeSession("REJECT"),
    ]);
    expect(
      result.proceedCount +
      result.returnToDesignCount +
      result.escalateCount +
      result.stopCount,
    ).toBe(result.totalGates);
  });
});

// --- Tests: determinism ---

describe("BoardroomTransitionGateBatchContract.batch — determinism", () => {
  it("produces same batchHash for identical sessions", () => {
    const contractA = makeBatchContract();
    const contractB = makeBatchContract();
    const sessions = [makeSession("PROCEED"), makeSession("AMEND_PLAN")];
    expect(contractA.batch(sessions).batchHash).toBe(contractB.batch(sessions).batchHash);
  });

  it("produces same batchId for identical sessions", () => {
    const contractA = makeBatchContract();
    const contractB = makeBatchContract();
    const sessions = [makeSession("ESCALATE"), makeSession("REJECT")];
    expect(contractA.batch(sessions).batchId).toBe(contractB.batch(sessions).batchId);
  });

  it("produces different batchHash for different session counts", () => {
    const contract = makeBatchContract();
    const r1 = contract.batch([makeSession("PROCEED")]);
    const r2 = contract.batch([makeSession("PROCEED"), makeSession("PROCEED")]);
    expect(r1.batchHash).not.toBe(r2.batchHash);
  });
});

// --- Tests: output shape ---

describe("BoardroomTransitionGateBatchContract.batch — output shape", () => {
  it("result has all required fields", () => {
    const result = makeBatchContract().batch([makeSession("PROCEED")]);
    expect(result).toHaveProperty("batchId");
    expect(result).toHaveProperty("batchHash");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("totalGates");
    expect(result).toHaveProperty("proceedCount");
    expect(result).toHaveProperty("returnToDesignCount");
    expect(result).toHaveProperty("escalateCount");
    expect(result).toHaveProperty("stopCount");
    expect(result).toHaveProperty("dominantAction");
    expect(result).toHaveProperty("allowOrchestration");
    expect(result).toHaveProperty("gates");
  });

  it("createdAt equals injected timestamp", () => {
    const result = makeBatchContract().batch([makeSession("PROCEED")]);
    expect(result.createdAt).toBe(FIXED_NOW);
  });

  it("batchId and batchHash are non-empty strings", () => {
    const result = makeBatchContract().batch([makeSession("PROCEED")]);
    expect(typeof result.batchId).toBe("string");
    expect(result.batchId.length).toBeGreaterThan(0);
    expect(typeof result.batchHash).toBe("string");
    expect(result.batchHash.length).toBeGreaterThan(0);
  });

  it("each gate has action, nextStage, allowOrchestration, gateId", () => {
    const result = makeBatchContract().batch([makeSession("PROCEED"), makeSession("REJECT")]);
    for (const gate of result.gates) {
      expect(gate).toHaveProperty("action");
      expect(gate).toHaveProperty("nextStage");
      expect(gate).toHaveProperty("allowOrchestration");
      expect(gate).toHaveProperty("gateId");
    }
  });
});

// --- Tests: factory function ---

describe("createBoardroomTransitionGateBatchContract", () => {
  it("factory creates a valid contract instance", () => {
    const contract = createBoardroomTransitionGateBatchContract({
      contractDependencies: { now: () => FIXED_NOW },
      now: () => FIXED_NOW,
    });
    const result = contract.batch([makeSession("PROCEED")]);
    expect(result.dominantAction).toBe("PROCEED_TO_ORCHESTRATION");
    expect(result.totalGates).toBe(1);
  });

  it("factory creates contract with no dependencies (smoke test)", () => {
    const contract = createBoardroomTransitionGateBatchContract();
    expect(() => contract.batch([])).not.toThrow();
  });
});
