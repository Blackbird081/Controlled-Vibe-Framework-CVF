import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  BoardroomRoundContract,
  type BoardroomRound,
  type RefinementFocus,
  type BoardroomRoundContractDependencies,
} from "./boardroom.round.contract";
import type { BoardroomSession } from "./boardroom.contract";

// --- Types ---

export interface BoardroomRoundRequest {
  session: BoardroomSession;
  roundNumber?: number;
}

export interface BoardroomRoundBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalRounds: number;
  taskAmendmentCount: number;
  escalationReviewCount: number;
  riskReviewCount: number;
  clarificationCount: number;
  dominantFocus: RefinementFocus | "NONE";
  rounds: BoardroomRound[];
}

export interface BoardroomRoundBatchContractDependencies {
  contractDependencies?: BoardroomRoundContractDependencies;
  now?: () => string;
}

// --- Dominant Focus Resolution ---

const FOCUS_SEVERITY: Record<RefinementFocus, number> = {
  RISK_REVIEW: 4,
  ESCALATION_REVIEW: 3,
  TASK_AMENDMENT: 2,
  CLARIFICATION: 1,
};

export function resolveDominantRefinementFocus(
  rounds: BoardroomRound[],
): RefinementFocus | "NONE" {
  if (rounds.length === 0) return "NONE";

  let dominant: RefinementFocus = "CLARIFICATION";
  for (const round of rounds) {
    if (FOCUS_SEVERITY[round.refinementFocus] > FOCUS_SEVERITY[dominant]) {
      dominant = round.refinementFocus;
    }
  }
  return dominant;
}

// --- Contract ---

export class BoardroomRoundBatchContract {
  private readonly contract: BoardroomRoundContract;
  private readonly now: () => string;

  constructor(dependencies: BoardroomRoundBatchContractDependencies = {}) {
    this.contract = new BoardroomRoundContract(
      dependencies.contractDependencies ?? {},
    );
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(requests: BoardroomRoundRequest[]): BoardroomRoundBatch {
    const createdAt = this.now();
    const rounds: BoardroomRound[] = requests.map((req) =>
      this.contract.openRound(req.session, req.roundNumber),
    );

    const taskAmendmentCount = rounds.filter(
      (r) => r.refinementFocus === "TASK_AMENDMENT",
    ).length;
    const escalationReviewCount = rounds.filter(
      (r) => r.refinementFocus === "ESCALATION_REVIEW",
    ).length;
    const riskReviewCount = rounds.filter(
      (r) => r.refinementFocus === "RISK_REVIEW",
    ).length;
    const clarificationCount = rounds.filter(
      (r) => r.refinementFocus === "CLARIFICATION",
    ).length;

    const dominantFocus = resolveDominantRefinementFocus(rounds);

    const batchHash = computeDeterministicHash(
      "w31-t1-cp1-boardroom-round-batch",
      `${createdAt}:total:${rounds.length}`,
      `taskAmendment:${taskAmendmentCount}:escalationReview:${escalationReviewCount}`,
      `riskReview:${riskReviewCount}:clarification:${clarificationCount}`,
      `dominant:${dominantFocus}`,
    );

    const batchId = computeDeterministicHash(
      "w31-t1-cp1-boardroom-round-batch-id",
      batchHash,
      createdAt,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalRounds: rounds.length,
      taskAmendmentCount,
      escalationReviewCount,
      riskReviewCount,
      clarificationCount,
      dominantFocus,
      rounds,
    };
  }
}

export function createBoardroomRoundBatchContract(
  dependencies?: BoardroomRoundBatchContractDependencies,
): BoardroomRoundBatchContract {
  return new BoardroomRoundBatchContract(dependencies);
}
