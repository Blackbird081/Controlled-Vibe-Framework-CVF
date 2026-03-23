/**
 * CPF Boardroom & Boardroom Round — Dedicated Tests (W6-T28)
 * ============================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   BoardroomContract.review:
 *     - createdAt set to injected now()
 *     - planId = request.plan.planId
 *     - consumerId = request.plan.consumerId
 *     - no clarifications → empty clarifications array
 *     - clarification with answer → status "answered"
 *     - clarification without answer → status "pending"
 *     - pending clarification → AMEND_PLAN decision
 *     - all answered, R3 tasks + plan warnings → ESCALATE decision
 *     - no pending, no R3 issues, valid plan → PROCEED decision
 *     - empty tasks → REJECT decision
 *     - sessionId = sessionHash
 *     - sessionHash deterministic for same inputs and timestamp
 *     - warnings include pending clarification warning
 *     - warnings include escalation warning on ESCALATE decision
 *     - factory createBoardroomContract returns working instance
 *
 *   BoardroomRoundContract.openRound:
 *     - AMEND_PLAN session → TASK_AMENDMENT focus
 *     - ESCALATE session → ESCALATION_REVIEW focus
 *     - REJECT session → RISK_REVIEW focus
 *     - PROCEED session → CLARIFICATION focus
 *     - roundNumber propagated
 *     - sourceSessionId = session.sessionId
 *     - sourceDecision = session.decision.decision
 *     - refinementNote mentions session id prefix
 *     - roundHash and roundId deterministic for same inputs and timestamp
 *     - createdAt set to injected now()
 *     - custom deriveRefinementFocus override respected
 *     - factory createBoardroomRoundContract returns working instance
 */

import { describe, it, expect } from "vitest";

import {
  BoardroomContract,
  createBoardroomContract,
} from "../src/boardroom.contract";
import type { BoardroomSession } from "../src/boardroom.contract";
import {
  BoardroomRoundContract,
  createBoardroomRoundContract,
} from "../src/boardroom.round.contract";
import { DesignContract } from "../src/design.contract";
import type { DesignPlan } from "../src/design.contract";
import { ControlPlaneIntakeContract } from "../src/intake.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T06:00:00.000Z";
const fixedNow = () => FIXED_NOW;

function makeDesignPlan(overrides: Partial<DesignPlan> = {}): DesignPlan {
  const base: DesignPlan = {
    planId: "plan-hash-0000000000000000000",
    createdAt: FIXED_NOW,
    intakeRequestId: "req-1",
    consumerId: "cons-1",
    vibeOriginal: "build a feature",
    domainDetected: "general",
    tasks: [
      {
        taskId: "t1",
        title: "Analyze requirements",
        description: "Review constraints",
        assignedRole: "architect",
        riskLevel: "R0",
        targetPhase: "DESIGN",
        estimatedComplexity: "low",
        dependencies: [],
      },
    ],
    totalTasks: 1,
    riskSummary: { R0: 1, R1: 0, R2: 0, R3: 0 },
    roleSummary: { orchestrator: 0, architect: 1, builder: 0, reviewer: 0 },
    planHash: "plan-hash-0000000000000000000",
    warnings: [],
  };
  return { ...base, ...overrides };
}

function makeR3PlanWithWarnings(): DesignPlan {
  return makeDesignPlan({
    tasks: [
      {
        taskId: "t1",
        title: "R3 task",
        description: "High risk task",
        assignedRole: "builder",
        riskLevel: "R3",
        targetPhase: "BUILD",
        estimatedComplexity: "high",
        dependencies: [],
      },
    ],
    riskSummary: { R0: 0, R1: 0, R2: 0, R3: 1 },
    roleSummary: { orchestrator: 0, architect: 0, builder: 1, reviewer: 0 },
    warnings: ["some intake warning"],
  });
}

function makeEmptyPlan(): DesignPlan {
  return makeDesignPlan({
    tasks: [],
    totalTasks: 0,
    riskSummary: { R0: 0, R1: 0, R2: 0, R3: 0 },
    roleSummary: { orchestrator: 0, architect: 0, builder: 0, reviewer: 0 },
  });
}

function getBoardroomSession(
  plan: DesignPlan,
  clarifications?: Array<{ question: string; answer?: string }>,
): BoardroomSession {
  const contract = new BoardroomContract({ now: fixedNow });
  return contract.review({ plan, clarifications });
}

// ─── BoardroomContract.review ─────────────────────────────────────────────────

describe("BoardroomContract.review", () => {
  const contract = new BoardroomContract({ now: fixedNow });

  it("createdAt set to injected now()", () => {
    expect(contract.review({ plan: makeDesignPlan() }).createdAt).toBe(FIXED_NOW);
  });

  it("planId = request.plan.planId", () => {
    const plan = makeDesignPlan();
    expect(contract.review({ plan }).planId).toBe(plan.planId);
  });

  it("consumerId = request.plan.consumerId", () => {
    const plan = makeDesignPlan({ consumerId: "cons-xyz" });
    expect(contract.review({ plan }).consumerId).toBe("cons-xyz");
  });

  it("no clarifications → empty clarifications array", () => {
    expect(contract.review({ plan: makeDesignPlan() }).clarifications).toHaveLength(0);
  });

  it("clarification with answer → status 'answered'", () => {
    const session = contract.review({
      plan: makeDesignPlan(),
      clarifications: [{ question: "Is this ready?", answer: "yes" }],
    });
    expect(session.clarifications[0].status).toBe("answered");
  });

  it("clarification without answer → status 'pending'", () => {
    const session = contract.review({
      plan: makeDesignPlan(),
      clarifications: [{ question: "What is the scope?" }],
    });
    expect(session.clarifications[0].status).toBe("pending");
  });

  describe("decision logic", () => {
    it("pending clarification → AMEND_PLAN decision", () => {
      const session = contract.review({
        plan: makeDesignPlan(),
        clarifications: [{ question: "Scope?" }],
      });
      expect(session.decision.decision).toBe("AMEND_PLAN");
    });

    it("all answered, R3 tasks + plan warnings → ESCALATE decision", () => {
      const session = contract.review({
        plan: makeR3PlanWithWarnings(),
        clarifications: [{ question: "Ok?", answer: "yes" }],
      });
      expect(session.decision.decision).toBe("ESCALATE");
    });

    it("no pending, no R3 issues, valid plan → PROCEED decision", () => {
      const session = contract.review({ plan: makeDesignPlan() });
      expect(session.decision.decision).toBe("PROCEED");
    });

    it("empty tasks → REJECT decision", () => {
      const session = contract.review({ plan: makeEmptyPlan() });
      expect(session.decision.decision).toBe("REJECT");
    });
  });

  it("sessionId = sessionHash", () => {
    const session = contract.review({ plan: makeDesignPlan() });
    expect(session.sessionId).toBe(session.sessionHash);
  });

  it("sessionHash deterministic for same inputs and timestamp", () => {
    const plan = makeDesignPlan();
    const s1 = contract.review({ plan });
    const s2 = contract.review({ plan });
    expect(s1.sessionHash).toBe(s2.sessionHash);
  });

  describe("warnings", () => {
    it("includes pending-clarification warning when pending count > 0", () => {
      const session = contract.review({
        plan: makeDesignPlan(),
        clarifications: [{ question: "Scope?" }],
      });
      expect(session.warnings.some((w) => w.includes("clarification(s) remain unanswered"))).toBe(true);
    });

    it("includes escalation warning on ESCALATE decision", () => {
      const session = contract.review({
        plan: makeR3PlanWithWarnings(),
        clarifications: [{ question: "Ok?", answer: "yes" }],
      });
      expect(session.warnings.some((w) => w.includes("escalated"))).toBe(true);
    });
  });

  it("factory createBoardroomContract returns working instance", () => {
    const c = createBoardroomContract({ now: fixedNow });
    const session = c.review({ plan: makeDesignPlan() });
    expect(session.createdAt).toBe(FIXED_NOW);
    expect(session.decision).toBeDefined();
  });
});

// ─── BoardroomRoundContract.openRound ─────────────────────────────────────────

describe("BoardroomRoundContract.openRound", () => {
  const contract = new BoardroomRoundContract({ now: fixedNow });

  describe("refinementFocus derivation from session decision", () => {
    it("AMEND_PLAN session → TASK_AMENDMENT focus", () => {
      const session = getBoardroomSession(makeDesignPlan(), [{ question: "Scope?" }]);
      expect(contract.openRound(session).refinementFocus).toBe("TASK_AMENDMENT");
    });

    it("ESCALATE session → ESCALATION_REVIEW focus", () => {
      const session = getBoardroomSession(
        makeR3PlanWithWarnings(),
        [{ question: "Ok?", answer: "yes" }],
      );
      expect(contract.openRound(session).refinementFocus).toBe("ESCALATION_REVIEW");
    });

    it("REJECT session (empty plan) → RISK_REVIEW focus", () => {
      const session = getBoardroomSession(makeEmptyPlan());
      expect(contract.openRound(session).refinementFocus).toBe("RISK_REVIEW");
    });

    it("PROCEED session → CLARIFICATION focus", () => {
      const session = getBoardroomSession(makeDesignPlan());
      expect(contract.openRound(session).refinementFocus).toBe("CLARIFICATION");
    });
  });

  it("roundNumber propagated (default=1)", () => {
    const session = getBoardroomSession(makeDesignPlan());
    expect(contract.openRound(session, 1).roundNumber).toBe(1);
    expect(contract.openRound(session, 3).roundNumber).toBe(3);
  });

  it("sourceSessionId = session.sessionId", () => {
    const session = getBoardroomSession(makeDesignPlan());
    expect(contract.openRound(session).sourceSessionId).toBe(session.sessionId);
  });

  it("sourceDecision = session.decision.decision", () => {
    const session = getBoardroomSession(makeDesignPlan());
    expect(contract.openRound(session).sourceDecision).toBe("PROCEED");
  });

  it("refinementNote mentions session id prefix", () => {
    const session = getBoardroomSession(makeDesignPlan());
    const note = contract.openRound(session).refinementNote;
    expect(note).toContain(session.sessionId.slice(0, 8));
  });

  it("roundHash and roundId deterministic for same inputs and timestamp", () => {
    const session = getBoardroomSession(makeDesignPlan());
    const r1 = contract.openRound(session, 1);
    const r2 = contract.openRound(session, 1);
    expect(r1.roundHash).toBe(r2.roundHash);
    expect(r1.roundId).toBe(r2.roundId);
  });

  it("createdAt set to injected now()", () => {
    const session = getBoardroomSession(makeDesignPlan());
    expect(contract.openRound(session).createdAt).toBe(FIXED_NOW);
  });

  it("custom deriveRefinementFocus override respected", () => {
    const custom = new BoardroomRoundContract({
      now: fixedNow,
      deriveRefinementFocus: () => "RISK_REVIEW",
    });
    const session = getBoardroomSession(makeDesignPlan()); // PROCEED session
    expect(custom.openRound(session).refinementFocus).toBe("RISK_REVIEW");
  });

  it("factory createBoardroomRoundContract returns working instance", () => {
    const c = createBoardroomRoundContract({ now: fixedNow });
    const session = getBoardroomSession(makeDesignPlan());
    const round = c.openRound(session);
    expect(round.createdAt).toBe(FIXED_NOW);
    expect(round.refinementFocus).toBe("CLARIFICATION");
  });
});
