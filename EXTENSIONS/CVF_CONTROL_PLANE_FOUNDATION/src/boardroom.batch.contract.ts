import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  BoardroomContract,
  type BoardroomRequest,
  type BoardroomSession,
  type BoardroomDecision,
  type BoardroomContractDependencies,
} from "./boardroom.contract";

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
  if (sessions.length === 0) return "NONE";

  let dominant: BoardroomDecision = "PROCEED";
  for (const session of sessions) {
    const decision = session.decision.decision;
    if (DECISION_SEVERITY[decision] > DECISION_SEVERITY[dominant]) {
      dominant = decision;
    }
  }
  return dominant;
}

// --- Contract ---

export class BoardroomBatchContract {
  private readonly contract: BoardroomContract;
  private readonly now: () => string;

  constructor(dependencies: BoardroomBatchContractDependencies = {}) {
    this.contract = new BoardroomContract(
      dependencies.contractDependencies ?? {},
    );
    this.now = dependencies.now ?? (() => new Date().toISOString());
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

    const batchHash = computeDeterministicHash(
      "w29-t1-cp1-boardroom-batch",
      `${createdAt}:total:${sessions.length}`,
      `proceed:${proceedCount}:amend:${amendCount}:escalate:${escalateCount}:reject:${rejectCount}`,
      `dominant:${dominantDecision}`,
    );

    const batchId = computeDeterministicHash(
      "w29-t1-cp1-boardroom-batch-id",
      batchHash,
      createdAt,
    );

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
