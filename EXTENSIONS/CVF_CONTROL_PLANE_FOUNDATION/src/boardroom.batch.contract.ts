import {
  BoardroomContract,
  type BoardroomRequest,
  type BoardroomSession,
  type BoardroomDecision,
  type BoardroomContractDependencies,
} from "./boardroom.contract";
import {
  createDeterministicBatchIdentity,
  resolveDominantBySeverity,
} from "./batch.contract.shared";

// --- Types ---

export interface BoardroomBatchResult {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalSessions: number;
  proceedCount: number;
  amendCount: number;
  escalateCount: number;
  rejectCount: number;
  dominantDecision: BoardroomDecision | "NONE";
  sessions: BoardroomSession[];
}

export interface BoardroomBatchContractDependencies {
  contractDependencies?: BoardroomContractDependencies;
  now?: () => string;
}

// --- Dominant Decision Resolution ---

const DECISION_SEVERITY: Record<BoardroomDecision, number> = {
  REJECT: 4,
  ESCALATE: 3,
  AMEND_PLAN: 2,
  PROCEED: 1,
};

export function resolveDominantBoardroomDecision(
  sessions: BoardroomSession[],
): BoardroomDecision | "NONE" {
  return resolveDominantBySeverity(
    sessions.map((session) => session.decision.decision),
    DECISION_SEVERITY,
    "NONE",
    "PROCEED",
  );
}

// --- Contract ---

export class BoardroomBatchContract {
  private readonly contract: BoardroomContract;
  private readonly now: () => string;

  constructor(dependencies: BoardroomBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.contract = new BoardroomContract({
      ...(dependencies.contractDependencies ?? {}),
      now: dependencies.contractDependencies?.now ?? this.now,
    });
  }

  batch(requests: BoardroomRequest[]): BoardroomBatchResult {
    const createdAt = this.now();
    const sessions: BoardroomSession[] = requests.map((request) =>
      this.contract.review(request),
    );

    const proceedCount = sessions.filter(
      (s) => s.decision.decision === "PROCEED",
    ).length;
    const amendCount = sessions.filter(
      (s) => s.decision.decision === "AMEND_PLAN",
    ).length;
    const escalateCount = sessions.filter(
      (s) => s.decision.decision === "ESCALATE",
    ).length;
    const rejectCount = sessions.filter(
      (s) => s.decision.decision === "REJECT",
    ).length;

    const dominantDecision = resolveDominantBoardroomDecision(sessions);

    const { batchHash, batchId } = createDeterministicBatchIdentity({
      batchSeed: "w29-t1-cp1-boardroom-batch",
      batchIdSeed: "w29-t1-cp1-boardroom-batch-id",
      hashParts: [
        `${createdAt}:total:${sessions.length}`,
        `proceed:${proceedCount}:amend:${amendCount}:escalate:${escalateCount}:reject:${rejectCount}`,
        `dominant:${dominantDecision}`,
      ],
    });

    return {
      batchId,
      batchHash,
      createdAt,
      totalSessions: sessions.length,
      proceedCount,
      amendCount,
      escalateCount,
      rejectCount,
      dominantDecision,
      sessions,
    };
  }
}

export function createBoardroomBatchContract(
  dependencies?: BoardroomBatchContractDependencies,
): BoardroomBatchContract {
  return new BoardroomBatchContract(dependencies);
}
