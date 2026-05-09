/**
 * CPF Boardroom Multi-Round & Orchestration — Dedicated Tests (W6-T29)
 * ======================================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   BoardroomMultiRoundContract.summarize:
 *     - empty → totalRounds=0, PROCEED dominant, finalRoundNumber=0, "No boardroom rounds" summary
 *     - single PROCEED round → proceedCount=1, PROCEED dominant
 *     - single AMEND_PLAN round → amendCount=1, AMEND_PLAN dominant
 *     - single ESCALATE round → escalateCount=1, ESCALATE dominant
 *     - single REJECT round → rejectCount=1, REJECT dominant
 *     - REJECT dominates ESCALATE (severity-first: REJECT>ESCALATE>AMEND_PLAN>PROCEED)
 *     - ESCALATE dominates AMEND_PLAN
 *     - totalRounds = input length
 *     - finalRoundNumber = max(roundNumber) across rounds
 *     - dominantFocus matches dominant decision mapping
 *     - counts accurate for mixed input
 *     - summary mentions non-zero decision buckets and dominant
 *     - summaryHash and summaryId deterministic for same inputs and timestamp
 *     - createdAt set to injected now()
 *     - factory createBoardroomMultiRoundContract returns working instance
 *
 *   OrchestrationContract.orchestrate:
 *     - createdAt set to injected now()
 *     - planId = plan.planId
 *     - consumerId = plan.consumerId
 *     - orchestrationId = orchestrationHash
 *     - totalAssignments = plan.tasks.length
 *     - phaseBreakdown/roleBreakdown/riskBreakdown counts accurate
 *     - scopeConstraints include phase/risk/role always
 *     - R3 task → scopeConstraints include "requires:full-governance-review"
 *     - BUILD task → scopeConstraints include "requires:test-coverage"
 *     - REVIEW task → scopeConstraints include "requires:independent-reviewer"
 *     - task with dependencies → scopeConstraints include "blocked-by:..."
 *     - executionAuthorizationHash truthy per assignment
 *     - warnings: zero assignments → empty-plan warning
 *     - warnings: R3 tasks → R3 governance warning
 *     - warnings: plan.warnings → carried-over warning
 *     - orchestrationHash deterministic for same inputs and timestamp
 *     - factory createOrchestrationContract returns working instance
 */

import { describe, it, expect } from "vitest";

import {
  BoardroomMultiRoundContract,
  createBoardroomMultiRoundContract,
} from "../src/boardroom.multi.round.contract";
import type { BoardroomRound } from "../src/boardroom.round.contract";
import type { BoardroomDecision } from "../src/boardroom.contract";
import {
  OrchestrationContract,
  createOrchestrationContract,
} from "../src/orchestration.contract";
import type { DesignPlan, DesignTask } from "../src/design.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T07:00:00.000Z";
const fixedNow = () => FIXED_NOW;

let _seq = 0;
function makeRound(
  decision: BoardroomDecision,
  roundNumber = 1,
): BoardroomRound {
  const n = ++_seq;
  return {
    roundId: `round-${n}`,
    roundNumber,
    createdAt: FIXED_NOW,
    sourceSessionId: `session-${n}`,
    sourceDecision: decision,
    refinementFocus: "CLARIFICATION",
    refinementNote: `note-${n}`,
    roundHash: `rh-${n}`,
  };
}

function makeTask(overrides: Partial<DesignTask> = {}): DesignTask {
  const n = ++_seq;
  return {
    taskId: `task-${n}`,
    title: `Task ${n}`,
    description: `Desc ${n}`,
    assignedRole: "builder",
    riskLevel: "R0",
    targetPhase: "BUILD",
    estimatedComplexity: "medium",
    dependencies: [],
    ...overrides,
  };
}

function makePlan(tasks: DesignTask[], overrides: Partial<DesignPlan> = {}): DesignPlan {
  const riskSummary = { R0: 0, R1: 0, R2: 0, R3: 0 };
  const roleSummary = { orchestrator: 0, architect: 0, builder: 0, reviewer: 0 };
  for (const t of tasks) {
    riskSummary[t.riskLevel]++;
    roleSummary[t.assignedRole]++;
  }
  return {
    planId: "plan-0000000000000000000000",
    createdAt: FIXED_NOW,
    intakeRequestId: "req-1",
    consumerId: "cons-1",
    vibeOriginal: "build a feature",
    domainDetected: "general",
    tasks,
    totalTasks: tasks.length,
    riskSummary,
    roleSummary,
    planHash: "plan-0000000000000000000000",
    warnings: [],
    ...overrides,
  };
}

// ─── BoardroomMultiRoundContract.summarize ────────────────────────────────────

describe("BoardroomMultiRoundContract.summarize", () => {
  const contract = new BoardroomMultiRoundContract({ now: fixedNow });

  it("empty → totalRounds=0, PROCEED dominant, finalRoundNumber=0, no-rounds summary", () => {
    const result = contract.summarize([]);
    expect(result.totalRounds).toBe(0);
    expect(result.dominantDecision).toBe("PROCEED");
    expect(result.finalRoundNumber).toBe(0);
    expect(result.summary).toContain("No boardroom rounds");
  });

  describe("single-decision dominant", () => {
    it("single PROCEED round → proceedCount=1, PROCEED dominant", () => {
      const result = contract.summarize([makeRound("PROCEED")]);
      expect(result.proceedCount).toBe(1);
      expect(result.dominantDecision).toBe("PROCEED");
    });

    it("single AMEND_PLAN round → amendCount=1, AMEND_PLAN dominant", () => {
      const result = contract.summarize([makeRound("AMEND_PLAN")]);
      expect(result.amendCount).toBe(1);
      expect(result.dominantDecision).toBe("AMEND_PLAN");
    });

    it("single ESCALATE round → escalateCount=1, ESCALATE dominant", () => {
      const result = contract.summarize([makeRound("ESCALATE")]);
      expect(result.escalateCount).toBe(1);
      expect(result.dominantDecision).toBe("ESCALATE");
    });

    it("single REJECT round → rejectCount=1, REJECT dominant", () => {
      const result = contract.summarize([makeRound("REJECT")]);
      expect(result.rejectCount).toBe(1);
      expect(result.dominantDecision).toBe("REJECT");
    });
  });

  describe("severity-first dominant: REJECT>ESCALATE>AMEND_PLAN>PROCEED", () => {
    it("REJECT dominates ESCALATE", () => {
      const rounds = [makeRound("ESCALATE"), makeRound("REJECT")];
      expect(contract.summarize(rounds).dominantDecision).toBe("REJECT");
    });

    it("ESCALATE dominates AMEND_PLAN", () => {
      const rounds = [makeRound("AMEND_PLAN"), makeRound("ESCALATE")];
      expect(contract.summarize(rounds).dominantDecision).toBe("ESCALATE");
    });

    it("AMEND_PLAN dominates PROCEED", () => {
      const rounds = [makeRound("PROCEED"), makeRound("AMEND_PLAN")];
      expect(contract.summarize(rounds).dominantDecision).toBe("AMEND_PLAN");
    });
  });

  it("totalRounds = input length", () => {
    const rounds = [makeRound("PROCEED"), makeRound("AMEND_PLAN"), makeRound("ESCALATE")];
    expect(contract.summarize(rounds).totalRounds).toBe(3);
  });

  it("finalRoundNumber = max roundNumber across rounds", () => {
    const rounds = [makeRound("PROCEED", 1), makeRound("PROCEED", 5), makeRound("PROCEED", 3)];
    expect(contract.summarize(rounds).finalRoundNumber).toBe(5);
  });

  describe("dominantFocus matches dominant decision", () => {
    it("REJECT dominant → RISK_REVIEW focus", () => {
      expect(contract.summarize([makeRound("REJECT")]).dominantFocus).toBe("RISK_REVIEW");
    });

    it("ESCALATE dominant → ESCALATION_REVIEW focus", () => {
      expect(contract.summarize([makeRound("ESCALATE")]).dominantFocus).toBe("ESCALATION_REVIEW");
    });

    it("AMEND_PLAN dominant → TASK_AMENDMENT focus", () => {
      expect(contract.summarize([makeRound("AMEND_PLAN")]).dominantFocus).toBe("TASK_AMENDMENT");
    });

    it("PROCEED dominant → CLARIFICATION focus", () => {
      expect(contract.summarize([makeRound("PROCEED")]).dominantFocus).toBe("CLARIFICATION");
    });
  });

  it("counts accurate for mixed input", () => {
    const rounds = [
      makeRound("PROCEED"),
      makeRound("AMEND_PLAN"),
      makeRound("AMEND_PLAN"),
      makeRound("ESCALATE"),
    ];
    const result = contract.summarize(rounds);
    expect(result.proceedCount).toBe(1);
    expect(result.amendCount).toBe(2);
    expect(result.escalateCount).toBe(1);
    expect(result.rejectCount).toBe(0);
  });

  it("summary mentions non-zero decision buckets", () => {
    const result = contract.summarize([makeRound("PROCEED"), makeRound("ESCALATE")]);
    expect(result.summary).toContain("proceed");
    expect(result.summary).toContain("escalate");
  });

  it("summaryHash and summaryId deterministic for same inputs and timestamp", () => {
    const rounds = [makeRound("PROCEED"), makeRound("AMEND_PLAN")];
    const r1 = contract.summarize(rounds);
    const r2 = contract.summarize(rounds);
    expect(r1.summaryHash).toBe(r2.summaryHash);
    expect(r1.summaryId).toBe(r2.summaryId);
  });

  it("createdAt set to injected now()", () => {
    expect(contract.summarize([]).createdAt).toBe(FIXED_NOW);
  });

  it("factory createBoardroomMultiRoundContract returns working instance", () => {
    const c = createBoardroomMultiRoundContract({ now: fixedNow });
    const result = c.summarize([]);
    expect(result.dominantDecision).toBe("PROCEED");
    expect(result.createdAt).toBe(FIXED_NOW);
  });
});

// ─── OrchestrationContract.orchestrate ────────────────────────────────────────

describe("OrchestrationContract.orchestrate", () => {
  const contract = new OrchestrationContract({ now: fixedNow });

  it("createdAt set to injected now()", () => {
    expect(contract.orchestrate(makePlan([])).createdAt).toBe(FIXED_NOW);
  });

  it("planId = plan.planId", () => {
    const plan = makePlan([]);
    expect(contract.orchestrate(plan).planId).toBe(plan.planId);
  });

  it("consumerId = plan.consumerId", () => {
    const plan = makePlan([], { consumerId: "cons-xyz" });
    expect(contract.orchestrate(plan).consumerId).toBe("cons-xyz");
  });

  it("orchestrationId = orchestrationHash", () => {
    const result = contract.orchestrate(makePlan([]));
    expect(result.orchestrationId).toBe(result.orchestrationHash);
  });

  it("totalAssignments = plan.tasks.length", () => {
    const plan = makePlan([makeTask(), makeTask()]);
    expect(contract.orchestrate(plan).totalAssignments).toBe(2);
  });

  describe("breakdowns", () => {
    it("phaseBreakdown counts accurate", () => {
      const tasks = [
        makeTask({ targetPhase: "DESIGN", assignedRole: "architect", riskLevel: "R0" }),
        makeTask({ targetPhase: "BUILD", assignedRole: "builder", riskLevel: "R0" }),
      ];
      const result = contract.orchestrate(makePlan(tasks));
      expect(result.phaseBreakdown.DESIGN).toBe(1);
      expect(result.phaseBreakdown.BUILD).toBe(1);
    });

    it("roleBreakdown counts accurate", () => {
      const tasks = [
        makeTask({ assignedRole: "architect", targetPhase: "DESIGN" }),
        makeTask({ assignedRole: "builder", targetPhase: "BUILD" }),
        makeTask({ assignedRole: "builder", targetPhase: "BUILD" }),
      ];
      const result = contract.orchestrate(makePlan(tasks));
      expect(result.roleBreakdown.architect).toBe(1);
      expect(result.roleBreakdown.builder).toBe(2);
    });

    it("riskBreakdown counts accurate", () => {
      const tasks = [
        makeTask({ riskLevel: "R0" }),
        makeTask({ riskLevel: "R2" }),
      ];
      const result = contract.orchestrate(makePlan(tasks));
      expect(result.riskBreakdown.R0).toBe(1);
      expect(result.riskBreakdown.R2).toBe(1);
    });
  });

  describe("scopeConstraints", () => {
    it("always include phase, risk, and role constraints", () => {
      const task = makeTask({ assignedRole: "architect", riskLevel: "R0", targetPhase: "DESIGN" });
      const result = contract.orchestrate(makePlan([task]));
      const constraints = result.assignments[0].scopeConstraints;
      expect(constraints).toContain("phase:DESIGN");
      expect(constraints).toContain("risk:R0");
      expect(constraints).toContain("role:architect");
    });

    it("R3 task → includes full-governance-review and audit-trail", () => {
      const task = makeTask({ riskLevel: "R3", targetPhase: "BUILD" });
      const result = contract.orchestrate(makePlan([task]));
      const constraints = result.assignments[0].scopeConstraints;
      expect(constraints).toContain("requires:full-governance-review");
      expect(constraints).toContain("requires:audit-trail");
    });

    it("BUILD task → includes test-coverage", () => {
      const task = makeTask({ targetPhase: "BUILD" });
      const result = contract.orchestrate(makePlan([task]));
      expect(result.assignments[0].scopeConstraints).toContain("requires:test-coverage");
    });

    it("REVIEW task → includes independent-reviewer", () => {
      const task = makeTask({ targetPhase: "REVIEW", assignedRole: "reviewer" });
      const result = contract.orchestrate(makePlan([task]));
      expect(result.assignments[0].scopeConstraints).toContain("requires:independent-reviewer");
    });

    it("task with dependencies → includes blocked-by constraint", () => {
      const task = makeTask({ dependencies: ["dep-1", "dep-2"] });
      const result = contract.orchestrate(makePlan([task]));
      expect(result.assignments[0].scopeConstraints).toContain("blocked-by:2-task(s)");
    });
  });

  it("executionAuthorizationHash truthy per assignment", () => {
    const plan = makePlan([makeTask()]);
    const { assignments } = contract.orchestrate(plan);
    expect(assignments[0].executionAuthorizationHash.length).toBeGreaterThan(0);
  });

  describe("warnings", () => {
    it("zero assignments → empty-plan warning", () => {
      const result = contract.orchestrate(makePlan([]));
      expect(result.warnings.some((w) => w.includes("zero assignments"))).toBe(true);
    });

    it("R3 task → R3 governance warning", () => {
      const plan = makePlan([makeTask({ riskLevel: "R3" })]);
      const result = contract.orchestrate(plan);
      expect(result.warnings.some((w) => w.includes("R3"))).toBe(true);
    });

    it("plan.warnings → carried-over warning", () => {
      const plan = makePlan([makeTask()], { warnings: ["design warning"] });
      const result = contract.orchestrate(plan);
      expect(result.warnings.some((w) => w.includes("carried") || w.includes("warning(s)"))).toBe(true);
    });
  });

  it("orchestrationHash deterministic for same inputs and timestamp", () => {
    const plan = makePlan([makeTask()]);
    const r1 = contract.orchestrate(plan);
    const r2 = contract.orchestrate(plan);
    expect(r1.orchestrationHash).toBe(r2.orchestrationHash);
  });

  it("factory createOrchestrationContract returns working instance", () => {
    const c = createOrchestrationContract({ now: fixedNow });
    const result = c.orchestrate(makePlan([]));
    expect(result.createdAt).toBe(FIXED_NOW);
    expect(result.totalAssignments).toBe(0);
  });
});
