import {
  BoardroomMultiRoundContract,
  type BoardroomMultiRoundSummary,
  type BoardroomMultiRoundContractDependencies,
} from "./boardroom.multi.round.contract";
import type { BoardroomRound } from "./boardroom.round.contract";
import type { BoardroomDecision } from "./boardroom.contract";
import {
  createDeterministicBatchIdentity,
  resolveDominantBySeverity,
} from "./batch.contract.shared";

// --- Types ---

export interface BoardroomMultiRoundSummaryRequest {
  rounds: BoardroomRound[];
}

export interface BoardroomMultiRoundBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalSummaries: number;
  proceedCount: number;
  amendCount: number;
  escalateCount: number;
  rejectCount: number;
  dominantDecision: BoardroomDecision | "NONE";
  summaries: BoardroomMultiRoundSummary[];
}

export interface BoardroomMultiRoundBatchContractDependencies {
  contractDependencies?: BoardroomMultiRoundContractDependencies;
  now?: () => string;
}

// --- Dominant Decision Resolution ---

const DECISION_SEVERITY: Record<BoardroomDecision, number> = {
  REJECT: 4,
  ESCALATE: 3,
  AMEND_PLAN: 2,
  PROCEED: 1,
};

export function resolveDominantMultiRoundDecision(
  summaries: BoardroomMultiRoundSummary[],
): BoardroomDecision | "NONE" {
  return resolveDominantBySeverity(
    summaries.map((summary) => summary.dominantDecision),
    DECISION_SEVERITY,
    "NONE",
    "PROCEED",
  );
}

// --- Contract ---

export class BoardroomMultiRoundBatchContract {
  private readonly contract: BoardroomMultiRoundContract;
  private readonly now: () => string;

  constructor(
    dependencies: BoardroomMultiRoundBatchContractDependencies = {},
  ) {
    this.contract = new BoardroomMultiRoundContract(
      dependencies.contractDependencies ?? {},
    );
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    requests: BoardroomMultiRoundSummaryRequest[],
  ): BoardroomMultiRoundBatch {
    const createdAt = this.now();
    const summaries: BoardroomMultiRoundSummary[] = requests.map((req) =>
      this.contract.summarize(req.rounds),
    );

    const proceedCount = summaries.filter(
      (s) => s.dominantDecision === "PROCEED",
    ).length;
    const amendCount = summaries.filter(
      (s) => s.dominantDecision === "AMEND_PLAN",
    ).length;
    const escalateCount = summaries.filter(
      (s) => s.dominantDecision === "ESCALATE",
    ).length;
    const rejectCount = summaries.filter(
      (s) => s.dominantDecision === "REJECT",
    ).length;

    const dominantDecision = resolveDominantMultiRoundDecision(summaries);

    const { batchHash, batchId } = createDeterministicBatchIdentity({
      batchSeed: "w32-t1-cp1-boardroom-multi-round-batch",
      batchIdSeed: "w32-t1-cp1-boardroom-multi-round-batch-id",
      hashParts: [
        `${createdAt}:total:${summaries.length}`,
        `proceed:${proceedCount}:amend:${amendCount}`,
        `escalate:${escalateCount}:reject:${rejectCount}`,
        `dominant:${dominantDecision}`,
      ],
      batchIdParts: [createdAt],
    });

    return {
      batchId,
      batchHash,
      createdAt,
      totalSummaries: summaries.length,
      proceedCount,
      amendCount,
      escalateCount,
      rejectCount,
      dominantDecision,
      summaries,
    };
  }
}

export function createBoardroomMultiRoundBatchContract(
  dependencies?: BoardroomMultiRoundBatchContractDependencies,
): BoardroomMultiRoundBatchContract {
  return new BoardroomMultiRoundBatchContract(dependencies);
}
