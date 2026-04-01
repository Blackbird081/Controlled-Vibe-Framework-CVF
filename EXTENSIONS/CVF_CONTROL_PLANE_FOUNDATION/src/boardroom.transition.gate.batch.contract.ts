import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  BoardroomTransitionGateContract,
  type BoardroomTransitionAction,
  type BoardroomTransitionGateResult,
  type BoardroomTransitionGateContractDependencies,
} from "./boardroom.transition.gate.contract";
import type { BoardroomSession } from "./boardroom.contract";

// --- Types ---

export interface BoardroomTransitionGateBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalGates: number;
  proceedCount: number;
  returnToDesignCount: number;
  escalateCount: number;
  stopCount: number;
  dominantAction: BoardroomTransitionAction | "NONE";
  allowOrchestration: boolean;
  gates: BoardroomTransitionGateResult[];
}

export interface BoardroomTransitionGateBatchContractDependencies {
  contractDependencies?: BoardroomTransitionGateContractDependencies;
  now?: () => string;
}

// --- Dominant Action Resolution ---

const ACTION_SEVERITY: Record<BoardroomTransitionAction, number> = {
  STOP_EXECUTION: 4,
  ESCALATE_FOR_REVIEW: 3,
  RETURN_TO_DESIGN: 2,
  PROCEED_TO_ORCHESTRATION: 1,
};

export function resolveDominantTransitionAction(
  gates: BoardroomTransitionGateResult[],
): BoardroomTransitionAction | "NONE" {
  if (gates.length === 0) return "NONE";

  let dominant: BoardroomTransitionAction = "PROCEED_TO_ORCHESTRATION";
  for (const gate of gates) {
    if (ACTION_SEVERITY[gate.action] > ACTION_SEVERITY[dominant]) {
      dominant = gate.action;
    }
  }
  return dominant;
}

// --- Contract ---

export class BoardroomTransitionGateBatchContract {
  private readonly contract: BoardroomTransitionGateContract;
  private readonly now: () => string;

  constructor(
    dependencies: BoardroomTransitionGateBatchContractDependencies = {},
  ) {
    this.contract = new BoardroomTransitionGateContract(
      dependencies.contractDependencies ?? {},
    );
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(sessions: BoardroomSession[]): BoardroomTransitionGateBatch {
    const createdAt = this.now();
    const gates: BoardroomTransitionGateResult[] = sessions.map((session) =>
      this.contract.evaluate(session),
    );

    const proceedCount = gates.filter(
      (g) => g.action === "PROCEED_TO_ORCHESTRATION",
    ).length;
    const returnToDesignCount = gates.filter(
      (g) => g.action === "RETURN_TO_DESIGN",
    ).length;
    const escalateCount = gates.filter(
      (g) => g.action === "ESCALATE_FOR_REVIEW",
    ).length;
    const stopCount = gates.filter(
      (g) => g.action === "STOP_EXECUTION",
    ).length;

    const dominantAction = resolveDominantTransitionAction(gates);
    const allowOrchestration =
      gates.length > 0 && gates.every((g) => g.allowOrchestration);

    const batchHash = computeDeterministicHash(
      "w30-t1-cp1-boardroom-transition-gate-batch",
      `${createdAt}:total:${gates.length}`,
      `proceed:${proceedCount}:return:${returnToDesignCount}:escalate:${escalateCount}:stop:${stopCount}`,
      `dominant:${dominantAction}:allowOrchestration:${allowOrchestration}`,
    );

    const batchId = computeDeterministicHash(
      "w30-t1-cp1-boardroom-transition-gate-batch-id",
      batchHash,
      createdAt,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalGates: gates.length,
      proceedCount,
      returnToDesignCount,
      escalateCount,
      stopCount,
      dominantAction,
      allowOrchestration,
      gates,
    };
  }
}

export function createBoardroomTransitionGateBatchContract(
  dependencies?: BoardroomTransitionGateBatchContractDependencies,
): BoardroomTransitionGateBatchContract {
  return new BoardroomTransitionGateBatchContract(dependencies);
}
