import type {
  BoardroomSession,
  BoardroomDecision,
} from "./boardroom.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type RefinementFocus =
  | "TASK_AMENDMENT"
  | "ESCALATION_REVIEW"
  | "RISK_REVIEW"
  | "CLARIFICATION";

export interface BoardroomRound {
  roundId: string;
  roundNumber: number;
  createdAt: string;
  sourceSessionId: string;
  sourceDecision: BoardroomDecision;
  refinementFocus: RefinementFocus;
  refinementNote: string;
  roundHash: string;
}

export interface BoardroomRoundContractDependencies {
  deriveRefinementFocus?: (decision: BoardroomDecision) => RefinementFocus;
  now?: () => string;
}

// --- Refinement Focus Derivation ---

function defaultDeriveRefinementFocus(
  decision: BoardroomDecision,
): RefinementFocus {
  switch (decision) {
    case "AMEND_PLAN":
      return "TASK_AMENDMENT";
    case "ESCALATE":
      return "ESCALATION_REVIEW";
    case "REJECT":
      return "RISK_REVIEW";
    case "PROCEED":
      return "CLARIFICATION";
  }
}

// --- Refinement Note Building ---

function buildRefinementNote(
  focus: RefinementFocus,
  session: BoardroomSession,
): string {
  switch (focus) {
    case "TASK_AMENDMENT":
      return (
        `Round triggered by AMEND_PLAN decision on session ${session.sessionId.slice(0, 8)}…. ` +
        `Focus: revise tasks to resolve ${session.clarifications.filter((c) => c.status === "pending").length} pending clarification(s).`
      );
    case "ESCALATION_REVIEW":
      return (
        `Round triggered by ESCALATE decision on session ${session.sessionId.slice(0, 8)}…. ` +
        `Focus: governance escalation review before proceeding to orchestration.`
      );
    case "RISK_REVIEW":
      return (
        `Round triggered by REJECT decision on session ${session.sessionId.slice(0, 8)}…. ` +
        `Focus: full risk review and plan redesign required.`
      );
    case "CLARIFICATION":
      return (
        `Round triggered by PROCEED decision on session ${session.sessionId.slice(0, 8)}…. ` +
        `Focus: minor clarification pass — plan approved but optional refinement available.`
      );
  }
}

// --- Contract ---

export class BoardroomRoundContract {
  private readonly deriveRefinementFocus: (
    decision: BoardroomDecision,
  ) => RefinementFocus;
  private readonly now: () => string;

  constructor(dependencies: BoardroomRoundContractDependencies = {}) {
    this.deriveRefinementFocus =
      dependencies.deriveRefinementFocus ?? defaultDeriveRefinementFocus;
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  openRound(session: BoardroomSession, roundNumber = 1): BoardroomRound {
    const createdAt = this.now();
    const refinementFocus = this.deriveRefinementFocus(
      session.decision.decision,
    );
    const refinementNote = buildRefinementNote(refinementFocus, session);

    const roundHash = computeDeterministicHash(
      "w1-t6-cp1-boardroom-round",
      `${createdAt}:${session.sessionId}`,
      `round:${roundNumber}:focus:${refinementFocus}`,
      `decision:${session.decision.decision}`,
    );

    const roundId = computeDeterministicHash(
      "w1-t6-cp1-round-id",
      roundHash,
      createdAt,
    );

    return {
      roundId,
      roundNumber,
      createdAt,
      sourceSessionId: session.sessionId,
      sourceDecision: session.decision.decision,
      refinementFocus,
      refinementNote,
      roundHash,
    };
  }
}

export function createBoardroomRoundContract(
  dependencies?: BoardroomRoundContractDependencies,
): BoardroomRoundContract {
  return new BoardroomRoundContract(dependencies);
}
