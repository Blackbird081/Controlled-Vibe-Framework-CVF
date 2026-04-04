/**
 * CPF Boardroom Round Batch Contract — Dedicated Tests (W31-T1)
 * ==============================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   resolveDominantRefinementFocus:
 *     - returns NONE for empty rounds
 *     - RISK_REVIEW dominant over all lower focuses
 *     - ESCALATION_REVIEW dominant over TASK_AMENDMENT and CLARIFICATION
 *     - TASK_AMENDMENT dominant over CLARIFICATION
 *     - single CLARIFICATION focus
 *
 *   BoardroomRoundBatchContract.batch — empty batch:
 *     - dominantFocus NONE
 *     - zero count fields
 *     - empty rounds array
 *
 *   BoardroomRoundBatchContract.batch — single request routing:
 *     - AMEND_PLAN → TASK_AMENDMENT focus
 *     - ESCALATE → ESCALATION_REVIEW focus
 *     - REJECT → RISK_REVIEW focus
 *     - PROCEED → CLARIFICATION focus
 *
 *   BoardroomRoundBatchContract.batch — dominant focus resolution:
 *     - RISK_REVIEW dominates ESCALATION_REVIEW, TASK_AMENDMENT, CLARIFICATION
 *     - ESCALATION_REVIEW dominates TASK_AMENDMENT, CLARIFICATION
 *     - TASK_AMENDMENT dominates CLARIFICATION
 *
 *   BoardroomRoundBatchContract.batch — count accuracy:
 *     - mixed batch counts all focus types correctly
 *     - totalRounds equals rounds array length
 *     - all counts sum to totalRounds
 *
 *   BoardroomRoundBatchContract.batch — roundNumber propagation:
 *     - default roundNumber is 1
 *     - explicit roundNumber propagated
 *
 *   BoardroomRoundBatchContract.batch — determinism:
 *     - same batchHash for identical requests
 *     - same batchId for identical requests
 *     - different batchHash for different batch size
 *
 *   BoardroomRoundBatchContract.batch — output shape:
 *     - result has all required fields
 *     - createdAt equals injected timestamp
 *     - batchId and batchHash are non-empty strings
 *     - each round has roundId, roundHash, refinementFocus, refinementNote
 *
 *   createBoardroomRoundBatchContract:
 *     - factory creates valid instance
 *     - factory works with no dependencies
 */

import { describe, it, expect } from "vitest";
import {
  BoardroomRoundBatchContract,
  createBoardroomRoundBatchContract,
  resolveDominantRefinementFocus,
  type BoardroomRoundBatch,
  type BoardroomRoundRequest,
} from "../src/boardroom.round.batch.contract";
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

function makeBatchContract(): BoardroomRoundBatchContract {
  return new BoardroomRoundBatchContract({
    contractDependencies: { now: () => FIXED_NOW },
    now: () => FIXED_NOW,
  });
}

function req(
  decision: "PROCEED" | "AMEND_PLAN" | "ESCALATE" | "REJECT",
  roundNumber?: number,
): BoardroomRoundRequest {
  return { session: makeSession(decision), roundNumber };
}

// --- Tests: resolveDominantRefinementFocus ---

describe("resolveDominantRefinementFocus", () => {
  it("returns NONE for empty rounds array", () => {
    expect(resolveDominantRefinementFocus([])).toBe("NONE");
  });

  it("returns CLARIFICATION when all rounds are CLARIFICATION", () => {
    const result = makeBatchContract().batch([req("PROCEED"), req("PROCEED")]);
    expect(resolveDominantRefinementFocus(result.rounds)).toBe("CLARIFICATION");
  });

  it("returns TASK_AMENDMENT when mixed PROCEED and AMEND_PLAN", () => {
    const result = makeBatchContract().batch([req("PROCEED"), req("AMEND_PLAN")]);
    expect(resolveDominantRefinementFocus(result.rounds)).toBe("TASK_AMENDMENT");
  });

  it("returns ESCALATION_REVIEW when ESCALATE present among lower focuses", () => {
    const result = makeBatchContract().batch([
      req("PROCEED"),
      req("AMEND_PLAN"),
      req("ESCALATE"),
    ]);
    expect(resolveDominantRefinementFocus(result.rounds)).toBe("ESCALATION_REVIEW");
  });

  it("returns RISK_REVIEW when REJECT present — highest severity wins", () => {
    const result = makeBatchContract().batch([
      req("PROCEED"),
      req("ESCALATE"),
      req("REJECT"),
    ]);
    expect(resolveDominantRefinementFocus(result.rounds)).toBe("RISK_REVIEW");
  });

  it("returns RISK_REVIEW when all rounds are RISK_REVIEW", () => {
    const result = makeBatchContract().batch([req("REJECT"), req("REJECT")]);
    expect(resolveDominantRefinementFocus(result.rounds)).toBe("RISK_REVIEW");
  });
});

// --- Tests: empty batch ---

describe("BoardroomRoundBatchContract.batch — empty batch", () => {
  it("returns NONE dominantFocus for empty requests", () => {
    expect(makeBatchContract().batch([]).dominantFocus).toBe("NONE");
  });

  it("returns zero totalRounds for empty batch", () => {
    expect(makeBatchContract().batch([]).totalRounds).toBe(0);
  });

  it("returns zero taskAmendmentCount for empty batch", () => {
    expect(makeBatchContract().batch([]).taskAmendmentCount).toBe(0);
  });

  it("returns zero escalationReviewCount for empty batch", () => {
    expect(makeBatchContract().batch([]).escalationReviewCount).toBe(0);
  });

  it("returns zero riskReviewCount for empty batch", () => {
    expect(makeBatchContract().batch([]).riskReviewCount).toBe(0);
  });

  it("returns zero clarificationCount for empty batch", () => {
    expect(makeBatchContract().batch([]).clarificationCount).toBe(0);
  });

  it("returns empty rounds array for empty batch", () => {
    expect(makeBatchContract().batch([]).rounds).toHaveLength(0);
  });
});

// --- Tests: single request routing ---

describe("BoardroomRoundBatchContract.batch — single request routing", () => {
  it("AMEND_PLAN session → TASK_AMENDMENT focus", () => {
    const result = makeBatchContract().batch([req("AMEND_PLAN")]);
    expect(result.rounds[0].refinementFocus).toBe("TASK_AMENDMENT");
    expect(result.dominantFocus).toBe("TASK_AMENDMENT");
    expect(result.taskAmendmentCount).toBe(1);
  });

  it("ESCALATE session → ESCALATION_REVIEW focus", () => {
    const result = makeBatchContract().batch([req("ESCALATE")]);
    expect(result.rounds[0].refinementFocus).toBe("ESCALATION_REVIEW");
    expect(result.dominantFocus).toBe("ESCALATION_REVIEW");
    expect(result.escalationReviewCount).toBe(1);
  });

  it("REJECT session → RISK_REVIEW focus", () => {
    const result = makeBatchContract().batch([req("REJECT")]);
    expect(result.rounds[0].refinementFocus).toBe("RISK_REVIEW");
    expect(result.dominantFocus).toBe("RISK_REVIEW");
    expect(result.riskReviewCount).toBe(1);
  });

  it("PROCEED session → CLARIFICATION focus", () => {
    const result = makeBatchContract().batch([req("PROCEED")]);
    expect(result.rounds[0].refinementFocus).toBe("CLARIFICATION");
    expect(result.dominantFocus).toBe("CLARIFICATION");
    expect(result.clarificationCount).toBe(1);
  });
});

// --- Tests: dominant focus resolution ---

describe("BoardroomRoundBatchContract.batch — dominant focus resolution", () => {
  it("RISK_REVIEW dominates ESCALATION_REVIEW", () => {
    const result = makeBatchContract().batch([req("ESCALATE"), req("REJECT")]);
    expect(result.dominantFocus).toBe("RISK_REVIEW");
  });

  it("RISK_REVIEW dominates TASK_AMENDMENT", () => {
    const result = makeBatchContract().batch([req("AMEND_PLAN"), req("REJECT")]);
    expect(result.dominantFocus).toBe("RISK_REVIEW");
  });

  it("RISK_REVIEW dominates CLARIFICATION", () => {
    const result = makeBatchContract().batch([req("PROCEED"), req("REJECT")]);
    expect(result.dominantFocus).toBe("RISK_REVIEW");
  });

  it("ESCALATION_REVIEW dominates TASK_AMENDMENT", () => {
    const result = makeBatchContract().batch([req("AMEND_PLAN"), req("ESCALATE")]);
    expect(result.dominantFocus).toBe("ESCALATION_REVIEW");
  });

  it("ESCALATION_REVIEW dominates CLARIFICATION", () => {
    const result = makeBatchContract().batch([req("PROCEED"), req("ESCALATE")]);
    expect(result.dominantFocus).toBe("ESCALATION_REVIEW");
  });

  it("TASK_AMENDMENT dominates CLARIFICATION", () => {
    const result = makeBatchContract().batch([req("PROCEED"), req("AMEND_PLAN")]);
    expect(result.dominantFocus).toBe("TASK_AMENDMENT");
  });
});

// --- Tests: count accuracy ---

describe("BoardroomRoundBatchContract.batch — count accuracy", () => {
  it("counts all focus types correctly in a mixed batch", () => {
    const result = makeBatchContract().batch([
      req("PROCEED"),
      req("PROCEED"),
      req("AMEND_PLAN"),
      req("ESCALATE"),
      req("REJECT"),
    ]);
    expect(result.totalRounds).toBe(5);
    expect(result.clarificationCount).toBe(2);
    expect(result.taskAmendmentCount).toBe(1);
    expect(result.escalationReviewCount).toBe(1);
    expect(result.riskReviewCount).toBe(1);
  });

  it("totalRounds equals rounds array length", () => {
    const result = makeBatchContract().batch([
      req("PROCEED"),
      req("AMEND_PLAN"),
      req("REJECT"),
    ]);
    expect(result.totalRounds).toBe(result.rounds.length);
  });

  it("all counts sum to totalRounds", () => {
    const result = makeBatchContract().batch([
      req("PROCEED"),
      req("AMEND_PLAN"),
      req("ESCALATE"),
      req("REJECT"),
    ]);
    expect(
      result.clarificationCount +
      result.taskAmendmentCount +
      result.escalationReviewCount +
      result.riskReviewCount,
    ).toBe(result.totalRounds);
  });
});

// --- Tests: roundNumber propagation ---

describe("BoardroomRoundBatchContract.batch — roundNumber propagation", () => {
  it("default roundNumber is 1 when not specified", () => {
    const result = makeBatchContract().batch([req("PROCEED")]);
    expect(result.rounds[0].roundNumber).toBe(1);
  });

  it("explicit roundNumber is propagated to the round", () => {
    const result = makeBatchContract().batch([req("AMEND_PLAN", 3)]);
    expect(result.rounds[0].roundNumber).toBe(3);
  });

  it("different roundNumbers propagated across requests", () => {
    const result = makeBatchContract().batch([
      req("PROCEED", 1),
      req("AMEND_PLAN", 2),
      req("REJECT", 5),
    ]);
    expect(result.rounds[0].roundNumber).toBe(1);
    expect(result.rounds[1].roundNumber).toBe(2);
    expect(result.rounds[2].roundNumber).toBe(5);
  });
});

// --- Tests: determinism ---

describe("BoardroomRoundBatchContract.batch — determinism", () => {
  it("produces same batchHash for identical requests", () => {
    const contractA = makeBatchContract();
    const contractB = makeBatchContract();
    const sessions = [makeSession("PROCEED"), makeSession("AMEND_PLAN")];
    const reqsA = [{ session: sessions[0] }, { session: sessions[1] }];
    const reqsB = [{ session: sessions[0] }, { session: sessions[1] }];
    expect(contractA.batch(reqsA).batchHash).toBe(contractB.batch(reqsB).batchHash);
  });

  it("produces same batchId for identical requests", () => {
    const contractA = makeBatchContract();
    const contractB = makeBatchContract();
    const sessions = [makeSession("ESCALATE"), makeSession("REJECT")];
    const reqsA = [{ session: sessions[0] }, { session: sessions[1] }];
    const reqsB = [{ session: sessions[0] }, { session: sessions[1] }];
    expect(contractA.batch(reqsA).batchId).toBe(contractB.batch(reqsB).batchId);
  });

  it("produces different batchHash for different batch size", () => {
    const contract = makeBatchContract();
    const r1 = contract.batch([req("PROCEED")]);
    const r2 = contract.batch([req("PROCEED"), req("PROCEED")]);
    expect(r1.batchHash).not.toBe(r2.batchHash);
  });
});

// --- Tests: output shape ---

describe("BoardroomRoundBatchContract.batch — output shape", () => {
  it("result has all required fields", () => {
    const result = makeBatchContract().batch([req("PROCEED")]);
    expect(result).toHaveProperty("batchId");
    expect(result).toHaveProperty("batchHash");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("totalRounds");
    expect(result).toHaveProperty("taskAmendmentCount");
    expect(result).toHaveProperty("escalationReviewCount");
    expect(result).toHaveProperty("riskReviewCount");
    expect(result).toHaveProperty("clarificationCount");
    expect(result).toHaveProperty("dominantFocus");
    expect(result).toHaveProperty("rounds");
  });

  it("createdAt equals injected timestamp", () => {
    const result = makeBatchContract().batch([req("PROCEED")]);
    expect(result.createdAt).toBe(FIXED_NOW);
  });

  it("batchId and batchHash are non-empty strings", () => {
    const result = makeBatchContract().batch([req("PROCEED")]);
    expect(typeof result.batchId).toBe("string");
    expect(result.batchId.length).toBeGreaterThan(0);
    expect(typeof result.batchHash).toBe("string");
    expect(result.batchHash.length).toBeGreaterThan(0);
  });

  it("each round has roundId, roundHash, refinementFocus, refinementNote", () => {
    const result = makeBatchContract().batch([req("PROCEED"), req("REJECT")]);
    for (const round of result.rounds) {
      expect(round).toHaveProperty("roundId");
      expect(round).toHaveProperty("roundHash");
      expect(round).toHaveProperty("refinementFocus");
      expect(round).toHaveProperty("refinementNote");
    }
  });

  it("each round has sourceSessionId matching the input session", () => {
    const session = makeSession("AMEND_PLAN");
    const result = makeBatchContract().batch([{ session }]);
    expect(result.rounds[0].sourceSessionId).toBe(session.sessionId);
  });
});

// --- Tests: factory function ---

describe("createBoardroomRoundBatchContract", () => {
  it("factory creates a valid contract instance", () => {
    const contract = createBoardroomRoundBatchContract({
      contractDependencies: { now: () => FIXED_NOW },
      now: () => FIXED_NOW,
    });
    const result = contract.batch([req("REJECT")]);
    expect(result.dominantFocus).toBe("RISK_REVIEW");
    expect(result.totalRounds).toBe(1);
  });

  it("factory creates contract with no dependencies (smoke test)", () => {
    const contract = createBoardroomRoundBatchContract();
    expect(() => contract.batch([])).not.toThrow();
  });
});
