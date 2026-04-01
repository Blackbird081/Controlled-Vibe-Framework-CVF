/**
 * CPF Boardroom Multi-Round Batch Contract — Dedicated Tests (W32-T1)
 * ====================================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   resolveDominantMultiRoundDecision:
 *     - returns NONE for empty summaries
 *     - REJECT dominant over all lower decisions
 *     - ESCALATE dominant over AMEND_PLAN and PROCEED
 *     - AMEND_PLAN dominant over PROCEED
 *     - single PROCEED decision
 *
 *   BoardroomMultiRoundBatchContract.batch — empty batch:
 *     - dominantDecision NONE
 *     - zero count fields
 *     - empty summaries array
 *
 *   BoardroomMultiRoundBatchContract.batch — single request routing:
 *     - rounds with PROCEED decisions → PROCEED dominantDecision
 *     - rounds with AMEND_PLAN decisions → AMEND_PLAN dominantDecision
 *     - rounds with ESCALATE decisions → ESCALATE dominantDecision
 *     - rounds with REJECT decisions → REJECT dominantDecision
 *
 *   BoardroomMultiRoundBatchContract.batch — dominant decision resolution:
 *     - REJECT dominates ESCALATE, AMEND_PLAN, PROCEED
 *     - ESCALATE dominates AMEND_PLAN, PROCEED
 *     - AMEND_PLAN dominates PROCEED
 *
 *   BoardroomMultiRoundBatchContract.batch — count accuracy:
 *     - mixed batch counts all decision types correctly
 *     - totalSummaries equals summaries array length
 *     - all counts sum to totalSummaries
 *
 *   BoardroomMultiRoundBatchContract.batch — empty rounds in request:
 *     - request with empty rounds produces PROCEED dominant summary
 *
 *   BoardroomMultiRoundBatchContract.batch — determinism:
 *     - same batchHash for identical requests
 *     - same batchId for identical requests
 *     - different batchHash for different batch size
 *
 *   BoardroomMultiRoundBatchContract.batch — output shape:
 *     - result has all required fields
 *     - createdAt equals injected timestamp
 *     - batchId and batchHash are non-empty strings
 *     - each summary has summaryId, summaryHash, dominantDecision, totalRounds
 *
 *   createBoardroomMultiRoundBatchContract:
 *     - factory creates valid instance
 *     - factory works with no dependencies
 */

import { describe, it, expect } from "vitest";
import {
  BoardroomMultiRoundBatchContract,
  createBoardroomMultiRoundBatchContract,
  resolveDominantMultiRoundDecision,
  type BoardroomMultiRoundBatch,
  type BoardroomMultiRoundSummaryRequest,
} from "../src/boardroom.multi.round.batch.contract";
import { BoardroomRoundContract } from "../src/boardroom.round.contract";
import type { BoardroomRound } from "../src/boardroom.round.contract";
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
    empty?: boolean;
  } = {},
): DesignPlan {
  const r3 = opts.r3Count ?? 0;
  const r2 = opts.r2Count ?? 0;
  const r1 = opts.r1Count ?? 0;
  const r0 = opts.r0Count ?? 0;
  const warnings = opts.warnings ?? [];
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

  return {
    planId: empty ? "" : id,
    createdAt: FIXED_NOW,
    intakeRequestId: `intake-${id}`,
    consumerId: "test-consumer",
    vibeOriginal: `vibe for ${id}`,
    tasks,
    totalTasks: tasks.length,
    riskSummary: { R3: r3, R2: r2, R1: r1, R0: r0 },
    roleSummary: {
      orchestrator: 0,
      architect: r3,
      builder: r2 + r1,
      reviewer: r0,
    },
    domainDetected: "general",
    planHash: `hash-${id}`,
    warnings,
  };
}

function makeSession(
  decision: "PROCEED" | "AMEND_PLAN" | "ESCALATE" | "REJECT",
): BoardroomSession {
  const contract = new BoardroomContract({
    canvas: new GovernanceCanvas(),
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

function makeRound(
  decision: "PROCEED" | "AMEND_PLAN" | "ESCALATE" | "REJECT",
  roundNumber = 1,
): BoardroomRound {
  const roundContract = new BoardroomRoundContract({ now: () => FIXED_NOW });
  return roundContract.openRound(makeSession(decision), roundNumber);
}

function makeBatchContract(): BoardroomMultiRoundBatchContract {
  return new BoardroomMultiRoundBatchContract({
    contractDependencies: { now: () => FIXED_NOW },
    now: () => FIXED_NOW,
  });
}

function req(rounds: BoardroomRound[]): BoardroomMultiRoundSummaryRequest {
  return { rounds };
}

// --- Tests: resolveDominantMultiRoundDecision ---

describe("resolveDominantMultiRoundDecision", () => {
  it("returns NONE for empty summaries array", () => {
    expect(resolveDominantMultiRoundDecision([])).toBe("NONE");
  });

  it("returns PROCEED when all summaries have PROCEED dominant", () => {
    const result = makeBatchContract().batch([
      req([makeRound("PROCEED"), makeRound("PROCEED")]),
      req([makeRound("PROCEED")]),
    ]);
    expect(resolveDominantMultiRoundDecision(result.summaries)).toBe("PROCEED");
  });

  it("returns AMEND_PLAN when mixed PROCEED and AMEND_PLAN", () => {
    const result = makeBatchContract().batch([
      req([makeRound("PROCEED")]),
      req([makeRound("AMEND_PLAN")]),
    ]);
    expect(resolveDominantMultiRoundDecision(result.summaries)).toBe("AMEND_PLAN");
  });

  it("returns ESCALATE when ESCALATE present among lower decisions", () => {
    const result = makeBatchContract().batch([
      req([makeRound("PROCEED")]),
      req([makeRound("AMEND_PLAN")]),
      req([makeRound("ESCALATE")]),
    ]);
    expect(resolveDominantMultiRoundDecision(result.summaries)).toBe("ESCALATE");
  });

  it("returns REJECT when REJECT present — highest severity wins", () => {
    const result = makeBatchContract().batch([
      req([makeRound("PROCEED")]),
      req([makeRound("ESCALATE")]),
      req([makeRound("REJECT")]),
    ]);
    expect(resolveDominantMultiRoundDecision(result.summaries)).toBe("REJECT");
  });

  it("returns REJECT when all summaries have REJECT dominant", () => {
    const result = makeBatchContract().batch([
      req([makeRound("REJECT")]),
      req([makeRound("REJECT")]),
    ]);
    expect(resolveDominantMultiRoundDecision(result.summaries)).toBe("REJECT");
  });
});

// --- Tests: empty batch ---

describe("BoardroomMultiRoundBatchContract.batch — empty batch", () => {
  it("returns NONE dominantDecision for empty requests", () => {
    expect(makeBatchContract().batch([]).dominantDecision).toBe("NONE");
  });

  it("returns zero totalSummaries for empty batch", () => {
    expect(makeBatchContract().batch([]).totalSummaries).toBe(0);
  });

  it("returns zero proceedCount for empty batch", () => {
    expect(makeBatchContract().batch([]).proceedCount).toBe(0);
  });

  it("returns zero amendCount for empty batch", () => {
    expect(makeBatchContract().batch([]).amendCount).toBe(0);
  });

  it("returns zero escalateCount for empty batch", () => {
    expect(makeBatchContract().batch([]).escalateCount).toBe(0);
  });

  it("returns zero rejectCount for empty batch", () => {
    expect(makeBatchContract().batch([]).rejectCount).toBe(0);
  });

  it("returns empty summaries array for empty batch", () => {
    expect(makeBatchContract().batch([]).summaries).toHaveLength(0);
  });
});

// --- Tests: single request routing ---

describe("BoardroomMultiRoundBatchContract.batch — single request routing", () => {
  it("PROCEED rounds → PROCEED dominantDecision in summary", () => {
    const result = makeBatchContract().batch([req([makeRound("PROCEED"), makeRound("PROCEED")])]);
    expect(result.summaries[0].dominantDecision).toBe("PROCEED");
    expect(result.dominantDecision).toBe("PROCEED");
    expect(result.proceedCount).toBe(1);
  });

  it("AMEND_PLAN rounds → AMEND_PLAN dominantDecision in summary", () => {
    const result = makeBatchContract().batch([req([makeRound("AMEND_PLAN")])]);
    expect(result.summaries[0].dominantDecision).toBe("AMEND_PLAN");
    expect(result.dominantDecision).toBe("AMEND_PLAN");
    expect(result.amendCount).toBe(1);
  });

  it("ESCALATE rounds → ESCALATE dominantDecision in summary", () => {
    const result = makeBatchContract().batch([req([makeRound("ESCALATE")])]);
    expect(result.summaries[0].dominantDecision).toBe("ESCALATE");
    expect(result.dominantDecision).toBe("ESCALATE");
    expect(result.escalateCount).toBe(1);
  });

  it("REJECT rounds → REJECT dominantDecision in summary", () => {
    const result = makeBatchContract().batch([req([makeRound("REJECT")])]);
    expect(result.summaries[0].dominantDecision).toBe("REJECT");
    expect(result.dominantDecision).toBe("REJECT");
    expect(result.rejectCount).toBe(1);
  });
});

// --- Tests: dominant decision resolution ---

describe("BoardroomMultiRoundBatchContract.batch — dominant decision resolution", () => {
  it("REJECT dominates ESCALATE", () => {
    const result = makeBatchContract().batch([
      req([makeRound("ESCALATE")]),
      req([makeRound("REJECT")]),
    ]);
    expect(result.dominantDecision).toBe("REJECT");
  });

  it("REJECT dominates AMEND_PLAN", () => {
    const result = makeBatchContract().batch([
      req([makeRound("AMEND_PLAN")]),
      req([makeRound("REJECT")]),
    ]);
    expect(result.dominantDecision).toBe("REJECT");
  });

  it("REJECT dominates PROCEED", () => {
    const result = makeBatchContract().batch([
      req([makeRound("PROCEED")]),
      req([makeRound("REJECT")]),
    ]);
    expect(result.dominantDecision).toBe("REJECT");
  });

  it("ESCALATE dominates AMEND_PLAN", () => {
    const result = makeBatchContract().batch([
      req([makeRound("AMEND_PLAN")]),
      req([makeRound("ESCALATE")]),
    ]);
    expect(result.dominantDecision).toBe("ESCALATE");
  });

  it("ESCALATE dominates PROCEED", () => {
    const result = makeBatchContract().batch([
      req([makeRound("PROCEED")]),
      req([makeRound("ESCALATE")]),
    ]);
    expect(result.dominantDecision).toBe("ESCALATE");
  });

  it("AMEND_PLAN dominates PROCEED", () => {
    const result = makeBatchContract().batch([
      req([makeRound("PROCEED")]),
      req([makeRound("AMEND_PLAN")]),
    ]);
    expect(result.dominantDecision).toBe("AMEND_PLAN");
  });
});

// --- Tests: count accuracy ---

describe("BoardroomMultiRoundBatchContract.batch — count accuracy", () => {
  it("counts all decision types correctly in a mixed batch", () => {
    const result = makeBatchContract().batch([
      req([makeRound("PROCEED")]),
      req([makeRound("PROCEED")]),
      req([makeRound("AMEND_PLAN")]),
      req([makeRound("ESCALATE")]),
      req([makeRound("REJECT")]),
    ]);
    expect(result.totalSummaries).toBe(5);
    expect(result.proceedCount).toBe(2);
    expect(result.amendCount).toBe(1);
    expect(result.escalateCount).toBe(1);
    expect(result.rejectCount).toBe(1);
  });

  it("totalSummaries equals summaries array length", () => {
    const result = makeBatchContract().batch([
      req([makeRound("PROCEED")]),
      req([makeRound("AMEND_PLAN")]),
      req([makeRound("REJECT")]),
    ]);
    expect(result.totalSummaries).toBe(result.summaries.length);
  });

  it("all counts sum to totalSummaries", () => {
    const result = makeBatchContract().batch([
      req([makeRound("PROCEED")]),
      req([makeRound("AMEND_PLAN")]),
      req([makeRound("ESCALATE")]),
      req([makeRound("REJECT")]),
    ]);
    expect(
      result.proceedCount +
      result.amendCount +
      result.escalateCount +
      result.rejectCount,
    ).toBe(result.totalSummaries);
  });
});

// --- Tests: empty rounds in request ---

describe("BoardroomMultiRoundBatchContract.batch — empty rounds in request", () => {
  it("request with empty rounds produces PROCEED dominantDecision (no rounds = no rejects)", () => {
    const result = makeBatchContract().batch([req([])]);
    expect(result.summaries[0].dominantDecision).toBe("PROCEED");
    expect(result.totalSummaries).toBe(1);
    expect(result.proceedCount).toBe(1);
  });

  it("empty rounds request produces summary with totalRounds 0", () => {
    const result = makeBatchContract().batch([req([])]);
    expect(result.summaries[0].totalRounds).toBe(0);
  });
});

// --- Tests: determinism ---

describe("BoardroomMultiRoundBatchContract.batch — determinism", () => {
  it("produces same batchHash for identical requests", () => {
    const rounds1 = [makeRound("PROCEED"), makeRound("AMEND_PLAN")];
    const rounds2 = [makeRound("ESCALATE")];
    const contractA = makeBatchContract();
    const contractB = makeBatchContract();
    expect(
      contractA.batch([req(rounds1), req(rounds2)]).batchHash,
    ).toBe(
      contractB.batch([req(rounds1), req(rounds2)]).batchHash,
    );
  });

  it("produces same batchId for identical requests", () => {
    const rounds = [makeRound("REJECT"), makeRound("REJECT")];
    const contractA = makeBatchContract();
    const contractB = makeBatchContract();
    expect(
      contractA.batch([req(rounds)]).batchId,
    ).toBe(
      contractB.batch([req(rounds)]).batchId,
    );
  });

  it("produces different batchHash for different batch size", () => {
    const contract = makeBatchContract();
    const r1 = contract.batch([req([makeRound("PROCEED")])]);
    const r2 = contract.batch([req([makeRound("PROCEED")]), req([makeRound("PROCEED")])]);
    expect(r1.batchHash).not.toBe(r2.batchHash);
  });
});

// --- Tests: output shape ---

describe("BoardroomMultiRoundBatchContract.batch — output shape", () => {
  it("result has all required fields", () => {
    const result = makeBatchContract().batch([req([makeRound("PROCEED")])]);
    expect(result).toHaveProperty("batchId");
    expect(result).toHaveProperty("batchHash");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("totalSummaries");
    expect(result).toHaveProperty("proceedCount");
    expect(result).toHaveProperty("amendCount");
    expect(result).toHaveProperty("escalateCount");
    expect(result).toHaveProperty("rejectCount");
    expect(result).toHaveProperty("dominantDecision");
    expect(result).toHaveProperty("summaries");
  });

  it("createdAt equals injected timestamp", () => {
    const result = makeBatchContract().batch([req([makeRound("PROCEED")])]);
    expect(result.createdAt).toBe(FIXED_NOW);
  });

  it("batchId and batchHash are non-empty strings", () => {
    const result = makeBatchContract().batch([req([makeRound("PROCEED")])]);
    expect(typeof result.batchId).toBe("string");
    expect(result.batchId.length).toBeGreaterThan(0);
    expect(typeof result.batchHash).toBe("string");
    expect(result.batchHash.length).toBeGreaterThan(0);
  });

  it("each summary has summaryId, summaryHash, dominantDecision, totalRounds", () => {
    const result = makeBatchContract().batch([
      req([makeRound("PROCEED")]),
      req([makeRound("REJECT")]),
    ]);
    for (const summary of result.summaries) {
      expect(summary).toHaveProperty("summaryId");
      expect(summary).toHaveProperty("summaryHash");
      expect(summary).toHaveProperty("dominantDecision");
      expect(summary).toHaveProperty("totalRounds");
    }
  });
});

// --- Tests: factory function ---

describe("createBoardroomMultiRoundBatchContract", () => {
  it("factory creates a valid contract instance", () => {
    const contract = createBoardroomMultiRoundBatchContract({
      contractDependencies: { now: () => FIXED_NOW },
      now: () => FIXED_NOW,
    });
    const result = contract.batch([req([makeRound("REJECT")])]);
    expect(result.dominantDecision).toBe("REJECT");
    expect(result.totalSummaries).toBe(1);
  });

  it("factory creates contract with no dependencies (smoke test)", () => {
    const contract = createBoardroomMultiRoundBatchContract();
    expect(() => contract.batch([])).not.toThrow();
  });
});
