import { describe, it, expect } from "vitest";
import {
  BoardroomBatchContract,
  createBoardroomBatchContract,
  resolveDominantBoardroomDecision,
  type BoardroomBatchResult,
} from "../src/boardroom.batch.contract";
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

function makeProceedRequest(): BoardroomRequest {
  return {
    plan: makePlan("plan-proceed", { r0Count: 2 }),
    clarifications: [],
  };
}

function makeAmendRequest(): BoardroomRequest {
  return {
    plan: makePlan("plan-amend", { r1Count: 1 }),
    clarifications: [{ question: "What is the timeline?", answer: undefined }],
  };
}

function makeEscalateRequest(): BoardroomRequest {
  return {
    plan: makePlan("plan-escalate", {
      r3Count: 1,
      warnings: ["Intake had low confidence."],
    }),
    clarifications: [],
  };
}

function makeRejectRequest(): BoardroomRequest {
  return {
    plan: makePlan("plan-reject", { empty: true }),
    clarifications: [],
  };
}

function makeCanvas(): GovernanceCanvas {
  return new GovernanceCanvas();
}

function makeBatchContract(): BoardroomBatchContract {
  return new BoardroomBatchContract({
    contractDependencies: { canvas: makeCanvas(), now: () => FIXED_NOW },
    now: () => FIXED_NOW,
  });
}

function makeSession(decision: "PROCEED" | "AMEND_PLAN" | "ESCALATE" | "REJECT"): BoardroomSession {
  const contract = new BoardroomContract({
    canvas: makeCanvas(),
    now: () => FIXED_NOW,
  });
  let request: BoardroomRequest;
  if (decision === "PROCEED") request = makeProceedRequest();
  else if (decision === "AMEND_PLAN") request = makeAmendRequest();
  else if (decision === "ESCALATE") request = makeEscalateRequest();
  else request = makeRejectRequest();
  return contract.review(request);
}

// --- Tests ---

describe("resolveDominantBoardroomDecision", () => {
  it("returns NONE for empty sessions array", () => {
    expect(resolveDominantBoardroomDecision([])).toBe("NONE");
  });

  it("returns PROCEED when all sessions are PROCEED", () => {
    const sessions = [makeSession("PROCEED"), makeSession("PROCEED")];
    expect(resolveDominantBoardroomDecision(sessions)).toBe("PROCEED");
  });

  it("returns AMEND_PLAN when mixed PROCEED and AMEND_PLAN", () => {
    const sessions = [makeSession("PROCEED"), makeSession("AMEND_PLAN")];
    expect(resolveDominantBoardroomDecision(sessions)).toBe("AMEND_PLAN");
  });

  it("returns ESCALATE when ESCALATE present among lower decisions", () => {
    const sessions = [
      makeSession("PROCEED"),
      makeSession("AMEND_PLAN"),
      makeSession("ESCALATE"),
    ];
    expect(resolveDominantBoardroomDecision(sessions)).toBe("ESCALATE");
  });

  it("returns REJECT when REJECT present — highest severity wins", () => {
    const sessions = [
      makeSession("PROCEED"),
      makeSession("ESCALATE"),
      makeSession("REJECT"),
    ];
    expect(resolveDominantBoardroomDecision(sessions)).toBe("REJECT");
  });

  it("returns REJECT when all sessions are REJECT", () => {
    const sessions = [makeSession("REJECT"), makeSession("REJECT")];
    expect(resolveDominantBoardroomDecision(sessions)).toBe("REJECT");
  });

  it("ESCALATE beats AMEND_PLAN", () => {
    const sessions = [makeSession("AMEND_PLAN"), makeSession("ESCALATE")];
    expect(resolveDominantBoardroomDecision(sessions)).toBe("ESCALATE");
  });

  it("REJECT beats ESCALATE", () => {
    const sessions = [makeSession("ESCALATE"), makeSession("REJECT")];
    expect(resolveDominantBoardroomDecision(sessions)).toBe("REJECT");
  });

  it("returns single session decision for single-element array", () => {
    expect(resolveDominantBoardroomDecision([makeSession("AMEND_PLAN")])).toBe("AMEND_PLAN");
  });
});

describe("BoardroomBatchContract.batch()", () => {
  describe("empty batch", () => {
    it("returns NONE dominant for empty input", () => {
      const result = makeBatchContract().batch([]);
      expect(result.dominantDecision).toBe("NONE");
    });

    it("returns zero totalSessions for empty input", () => {
      const result = makeBatchContract().batch([]);
      expect(result.totalSessions).toBe(0);
    });

    it("returns zero all counts for empty input", () => {
      const result = makeBatchContract().batch([]);
      expect(result.proceedCount).toBe(0);
      expect(result.amendCount).toBe(0);
      expect(result.escalateCount).toBe(0);
      expect(result.rejectCount).toBe(0);
    });

    it("returns empty sessions array for empty input", () => {
      const result = makeBatchContract().batch([]);
      expect(result.sessions).toHaveLength(0);
    });

    it("produces non-empty batchHash and batchId for empty input", () => {
      const result = makeBatchContract().batch([]);
      expect(result.batchHash.length).toBeGreaterThan(0);
      expect(result.batchId.length).toBeGreaterThan(0);
    });
  });

  describe("single request routing", () => {
    it("routes PROCEED request and produces 1 session", () => {
      const result = makeBatchContract().batch([makeProceedRequest()]);
      expect(result.totalSessions).toBe(1);
      expect(result.sessions[0].decision.decision).toBe("PROCEED");
    });

    it("routes AMEND_PLAN request correctly", () => {
      const result = makeBatchContract().batch([makeAmendRequest()]);
      expect(result.sessions[0].decision.decision).toBe("AMEND_PLAN");
    });

    it("routes ESCALATE request correctly", () => {
      const result = makeBatchContract().batch([makeEscalateRequest()]);
      expect(result.sessions[0].decision.decision).toBe("ESCALATE");
    });

    it("routes REJECT request correctly", () => {
      const result = makeBatchContract().batch([makeRejectRequest()]);
      expect(result.sessions[0].decision.decision).toBe("REJECT");
    });
  });

  describe("dominant decision resolution", () => {
    it("dominant is PROCEED when all PROCEED", () => {
      const result = makeBatchContract().batch([makeProceedRequest(), makeProceedRequest()]);
      expect(result.dominantDecision).toBe("PROCEED");
    });

    it("dominant is AMEND_PLAN when PROCEED + AMEND_PLAN", () => {
      const result = makeBatchContract().batch([makeProceedRequest(), makeAmendRequest()]);
      expect(result.dominantDecision).toBe("AMEND_PLAN");
    });

    it("dominant is ESCALATE when ESCALATE + AMEND_PLAN + PROCEED", () => {
      const result = makeBatchContract().batch([
        makeProceedRequest(),
        makeAmendRequest(),
        makeEscalateRequest(),
      ]);
      expect(result.dominantDecision).toBe("ESCALATE");
    });

    it("dominant is REJECT when REJECT present", () => {
      const result = makeBatchContract().batch([
        makeProceedRequest(),
        makeEscalateRequest(),
        makeRejectRequest(),
      ]);
      expect(result.dominantDecision).toBe("REJECT");
    });

    it("REJECT beats ESCALATE as dominant", () => {
      const result = makeBatchContract().batch([
        makeEscalateRequest(),
        makeRejectRequest(),
      ]);
      expect(result.dominantDecision).toBe("REJECT");
    });
  });

  describe("count accuracy", () => {
    it("counts proceed sessions correctly", () => {
      const result = makeBatchContract().batch([
        makeProceedRequest(),
        makeProceedRequest(),
        makeAmendRequest(),
      ]);
      expect(result.proceedCount).toBe(2);
      expect(result.amendCount).toBe(1);
      expect(result.escalateCount).toBe(0);
      expect(result.rejectCount).toBe(0);
    });

    it("counts all decision types in mixed batch", () => {
      const result = makeBatchContract().batch([
        makeProceedRequest(),
        makeAmendRequest(),
        makeEscalateRequest(),
        makeRejectRequest(),
      ]);
      expect(result.proceedCount).toBe(1);
      expect(result.amendCount).toBe(1);
      expect(result.escalateCount).toBe(1);
      expect(result.rejectCount).toBe(1);
      expect(result.totalSessions).toBe(4);
    });

    it("totalSessions equals sum of all count fields", () => {
      const result = makeBatchContract().batch([
        makeProceedRequest(),
        makeAmendRequest(),
        makeEscalateRequest(),
        makeRejectRequest(),
        makeProceedRequest(),
      ]);
      const sum =
        result.proceedCount +
        result.amendCount +
        result.escalateCount +
        result.rejectCount;
      expect(sum).toBe(result.totalSessions);
    });

    it("counts reject sessions correctly when all REJECT", () => {
      const result = makeBatchContract().batch([
        makeRejectRequest(),
        makeRejectRequest(),
        makeRejectRequest(),
      ]);
      expect(result.rejectCount).toBe(3);
      expect(result.proceedCount).toBe(0);
      expect(result.amendCount).toBe(0);
      expect(result.escalateCount).toBe(0);
    });
  });

  describe("determinism", () => {
    it("produces identical batchHash for same inputs", () => {
      const bc = makeBatchContract();
      const r1 = bc.batch([makeProceedRequest(), makeAmendRequest()]);
      const r2 = bc.batch([makeProceedRequest(), makeAmendRequest()]);
      expect(r1.batchHash).toBe(r2.batchHash);
    });

    it("produces identical batchId for same inputs", () => {
      const bc = makeBatchContract();
      const r1 = bc.batch([makeProceedRequest()]);
      const r2 = bc.batch([makeProceedRequest()]);
      expect(r1.batchId).toBe(r2.batchId);
    });

    it("produces different batchHash for different inputs", () => {
      const bc = makeBatchContract();
      const r1 = bc.batch([makeProceedRequest()]);
      const r2 = bc.batch([makeRejectRequest()]);
      expect(r1.batchHash).not.toBe(r2.batchHash);
    });

    it("batchHash and batchId are different strings", () => {
      const result = makeBatchContract().batch([makeProceedRequest()]);
      expect(result.batchHash).not.toBe(result.batchId);
    });
  });

  describe("output shape", () => {
    it("result contains all required fields", () => {
      const result = makeBatchContract().batch([makeProceedRequest()]);
      expect(result).toHaveProperty("batchId");
      expect(result).toHaveProperty("batchHash");
      expect(result).toHaveProperty("createdAt");
      expect(result).toHaveProperty("totalSessions");
      expect(result).toHaveProperty("proceedCount");
      expect(result).toHaveProperty("amendCount");
      expect(result).toHaveProperty("escalateCount");
      expect(result).toHaveProperty("rejectCount");
      expect(result).toHaveProperty("dominantDecision");
      expect(result).toHaveProperty("sessions");
    });

    it("createdAt equals injected now value", () => {
      const result = makeBatchContract().batch([makeProceedRequest()]);
      expect(result.createdAt).toBe(FIXED_NOW);
    });

    it("sessions array length matches totalSessions", () => {
      const requests = [makeProceedRequest(), makeAmendRequest(), makeRejectRequest()];
      const result = makeBatchContract().batch(requests);
      expect(result.sessions).toHaveLength(result.totalSessions);
    });

    it("each session has a sessionId", () => {
      const result = makeBatchContract().batch([makeProceedRequest(), makeRejectRequest()]);
      for (const session of result.sessions) {
        expect(typeof session.sessionId).toBe("string");
        expect(session.sessionId.length).toBeGreaterThan(0);
      }
    });
  });

  describe("factory function", () => {
    it("createBoardroomBatchContract returns a working instance", () => {
      const bc = createBoardroomBatchContract({
        contractDependencies: { canvas: makeCanvas(), now: () => FIXED_NOW },
        now: () => FIXED_NOW,
      });
      const result = bc.batch([makeProceedRequest()]);
      expect(result.totalSessions).toBe(1);
      expect(result.dominantDecision).toBe("PROCEED");
    });

    it("factory with no args still constructs and runs", () => {
      const bc = createBoardroomBatchContract();
      const result = bc.batch([]);
      expect(result.dominantDecision).toBe("NONE");
    });
  });
});
