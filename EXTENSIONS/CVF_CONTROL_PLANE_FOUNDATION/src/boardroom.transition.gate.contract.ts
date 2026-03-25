import type { BoardroomDecision, BoardroomSession } from "./boardroom.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type BoardroomTransitionAction =
  | "PROCEED_TO_ORCHESTRATION"
  | "RETURN_TO_DESIGN"
  | "ESCALATE_FOR_REVIEW"
  | "STOP_EXECUTION";

export type BoardroomTransitionNextStage =
  | "ORCHESTRATION"
  | "DESIGN"
  | "BOARDROOM"
  | "STOP";

export interface BoardroomTransitionGateResult {
  gateId: string;
  createdAt: string;
  sourceSessionId: string;
  sourcePlanId: string;
  sourceDecision: BoardroomDecision;
  action: BoardroomTransitionAction;
  nextStage: BoardroomTransitionNextStage;
  allowOrchestration: boolean;
  escalationRequired: boolean;
  rationale: string;
  blockingConditions: string[];
  gateHash: string;
}

export interface BoardroomTransitionGateContractDependencies {
  now?: () => string;
}

interface TransitionEvaluation {
  action: BoardroomTransitionAction;
  nextStage: BoardroomTransitionNextStage;
  allowOrchestration: boolean;
  escalationRequired: boolean;
  rationale: string;
}

// --- Decision Mapping ---

function evaluateTransitionDecision(
  session: BoardroomSession,
): TransitionEvaluation {
  switch (session.decision.decision) {
    case "PROCEED":
      return {
        action: "PROCEED_TO_ORCHESTRATION",
        nextStage: "ORCHESTRATION",
        allowOrchestration: true,
        escalationRequired: false,
        rationale:
          "Boardroom converged on PROCEED, so downstream orchestration is allowed to continue.",
      };
    case "AMEND_PLAN":
      return {
        action: "RETURN_TO_DESIGN",
        nextStage: "DESIGN",
        allowOrchestration: false,
        escalationRequired: false,
        rationale:
          "Boardroom requires plan amendment before downstream orchestration may continue.",
      };
    case "ESCALATE":
      return {
        action: "ESCALATE_FOR_REVIEW",
        nextStage: "BOARDROOM",
        allowOrchestration: false,
        escalationRequired: true,
        rationale:
          "Boardroom escalated the plan for additional review, so downstream orchestration remains blocked.",
      };
    case "REJECT":
      return {
        action: "STOP_EXECUTION",
        nextStage: "STOP",
        allowOrchestration: false,
        escalationRequired: true,
        rationale:
          "Boardroom rejected the plan, so downstream orchestration must stop until a new governed path is opened.",
      };
  }
}

function deriveBlockingConditions(session: BoardroomSession): string[] {
  const conditions: string[] = [];

  const pendingClarifications = session.clarifications.filter(
    (item) => item.status === "pending",
  );
  if (pendingClarifications.length > 0) {
    conditions.push(
      `${pendingClarifications.length} clarification(s) remain unanswered.`,
    );
  }

  conditions.push(...session.warnings);

  if (session.finalPlan.totalTasks === 0) {
    conditions.push("Final plan contains zero tasks.");
  }

  return Array.from(new Set(conditions));
}

// --- Contract ---

export class BoardroomTransitionGateContract {
  private readonly now: () => string;

  constructor(dependencies: BoardroomTransitionGateContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  evaluate(session: BoardroomSession): BoardroomTransitionGateResult {
    const createdAt = this.now();
    const evaluation = evaluateTransitionDecision(session);
    const blockingConditions = evaluation.allowOrchestration
      ? []
      : deriveBlockingConditions(session);

    const gateHash = computeDeterministicHash(
      "gc028-boardroom-transition-gate",
      `${createdAt}:${session.sessionId}`,
      `decision:${session.decision.decision}:action:${evaluation.action}`,
      session.finalPlan.planHash,
    );

    const gateId = computeDeterministicHash(
      "gc028-boardroom-transition-gate-id",
      gateHash,
      createdAt,
    );

    return {
      gateId,
      createdAt,
      sourceSessionId: session.sessionId,
      sourcePlanId: session.planId,
      sourceDecision: session.decision.decision,
      action: evaluation.action,
      nextStage: evaluation.nextStage,
      allowOrchestration: evaluation.allowOrchestration,
      escalationRequired: evaluation.escalationRequired,
      rationale: evaluation.rationale,
      blockingConditions,
      gateHash,
    };
  }
}

export function createBoardroomTransitionGateContract(
  dependencies?: BoardroomTransitionGateContractDependencies,
): BoardroomTransitionGateContract {
  return new BoardroomTransitionGateContract(dependencies);
}
