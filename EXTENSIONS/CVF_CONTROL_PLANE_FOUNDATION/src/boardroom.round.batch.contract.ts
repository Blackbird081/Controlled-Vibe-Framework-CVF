import {
  BoardroomRoundContract,
  type BoardroomRound,
  type RefinementFocus,
  type BoardroomRoundContractDependencies,
} from "./boardroom.round.contract";
import type { BoardroomSession } from "./boardroom.contract";
import {
  createDeterministicBatchIdentity,
  resolveDominantBySeverity,
} from "./batch.contract.shared";

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
  return resolveDominantBySeverity(
    rounds.map((round) => round.refinementFocus),
    FOCUS_SEVERITY,
    "NONE",
    "CLARIFICATION",
  );
}

// --- Contract ---

export class BoardroomRoundBatchContract {
  private readonly contract: BoardroomRoundContract;
  private readonly now: () => string;

  constructor(dependencies: BoardroomRoundBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.contract = new BoardroomRoundContract({
      ...(dependencies.contractDependencies ?? {}),
      now: dependencies.contractDependencies?.now ?? this.now,
    });
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

    const { batchHash, batchId } = createDeterministicBatchIdentity({
      batchSeed: "w31-t1-cp1-boardroom-round-batch",
      batchIdSeed: "w31-t1-cp1-boardroom-round-batch-id",
      hashParts: [
        `${createdAt}:total:${rounds.length}`,
        `taskAmendment:${taskAmendmentCount}:escalationReview:${escalationReviewCount}`,
        `riskReview:${riskReviewCount}:clarification:${clarificationCount}`,
        `dominant:${dominantFocus}`,
      ],
    });

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
