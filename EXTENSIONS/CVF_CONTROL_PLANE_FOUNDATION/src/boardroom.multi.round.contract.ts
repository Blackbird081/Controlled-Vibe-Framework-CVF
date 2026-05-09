import type {
  BoardroomRound,
  RefinementFocus,
} from "./boardroom.round.contract";
import type { BoardroomDecision } from "./boardroom.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface BoardroomMultiRoundSummary {
  summaryId: string;
  createdAt: string;
  totalRounds: number;
  proceedCount: number;
  amendCount: number;
  escalateCount: number;
  rejectCount: number;
  dominantDecision: BoardroomDecision;
  finalRoundNumber: number;
  dominantFocus: RefinementFocus;
  summary: string;
  summaryHash: string;
}

export interface BoardroomMultiRoundContractDependencies {
  now?: () => string;
}

// --- Dominant Decision Derivation ---

function deriveDominantDecision(
  rejectCount: number,
  escalateCount: number,
  amendCount: number,
): BoardroomDecision {
  if (rejectCount > 0) return "REJECT";
  if (escalateCount > 0) return "ESCALATE";
  if (amendCount > 0) return "AMEND_PLAN";
  return "PROCEED";
}

// --- Dominant Focus Derivation ---

function deriveDominantFocus(dominant: BoardroomDecision): RefinementFocus {
  switch (dominant) {
    case "REJECT":
      return "RISK_REVIEW";
    case "ESCALATE":
      return "ESCALATION_REVIEW";
    case "AMEND_PLAN":
      return "TASK_AMENDMENT";
    case "PROCEED":
      return "CLARIFICATION";
  }
}

// --- Summary Building ---

function buildSummaryText(
  total: number,
  proceedCount: number,
  amendCount: number,
  escalateCount: number,
  rejectCount: number,
  dominant: BoardroomDecision,
  finalRound: number,
): string {
  if (total === 0) {
    return "No boardroom rounds to summarize. Multi-round summary is empty.";
  }
  const parts: string[] = [];
  if (proceedCount > 0) parts.push(`${proceedCount} proceed`);
  if (amendCount > 0) parts.push(`${amendCount} amend`);
  if (escalateCount > 0) parts.push(`${escalateCount} escalate`);
  if (rejectCount > 0) parts.push(`${rejectCount} reject`);
  return (
    `Boardroom multi-round summary: ${parts.join(", ")} across ${total} round(s). ` +
    `Final round: ${finalRound}. Dominant decision: ${dominant}.`
  );
}

// --- Contract ---

export class BoardroomMultiRoundContract {
  private readonly now: () => string;

  constructor(dependencies: BoardroomMultiRoundContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  summarize(rounds: BoardroomRound[]): BoardroomMultiRoundSummary {
    const createdAt = this.now();

    const proceedCount = rounds.filter(
      (r) => r.sourceDecision === "PROCEED",
    ).length;
    const amendCount = rounds.filter(
      (r) => r.sourceDecision === "AMEND_PLAN",
    ).length;
    const escalateCount = rounds.filter(
      (r) => r.sourceDecision === "ESCALATE",
    ).length;
    const rejectCount = rounds.filter(
      (r) => r.sourceDecision === "REJECT",
    ).length;
    const totalRounds = rounds.length;
    const finalRoundNumber =
      rounds.length > 0
        ? Math.max(...rounds.map((r) => r.roundNumber))
        : 0;

    const dominantDecision = deriveDominantDecision(
      rejectCount,
      escalateCount,
      amendCount,
    );
    const dominantFocus = deriveDominantFocus(dominantDecision);

    const summaryText = buildSummaryText(
      totalRounds,
      proceedCount,
      amendCount,
      escalateCount,
      rejectCount,
      dominantDecision,
      finalRoundNumber,
    );

    const summaryHash = computeDeterministicHash(
      "w1-t6-cp2-multi-round",
      `${createdAt}:total:${totalRounds}`,
      `proceed:${proceedCount}:amend:${amendCount}`,
      `escalate:${escalateCount}:reject:${rejectCount}`,
      `dominant:${dominantDecision}:finalRound:${finalRoundNumber}`,
    );

    const summaryId = computeDeterministicHash(
      "w1-t6-cp2-summary-id",
      summaryHash,
      createdAt,
    );

    return {
      summaryId,
      createdAt,
      totalRounds,
      proceedCount,
      amendCount,
      escalateCount,
      rejectCount,
      dominantDecision,
      finalRoundNumber,
      dominantFocus,
      summary: summaryText,
      summaryHash,
    };
  }
}

export function createBoardroomMultiRoundContract(
  dependencies?: BoardroomMultiRoundContractDependencies,
): BoardroomMultiRoundContract {
  return new BoardroomMultiRoundContract(dependencies);
}
