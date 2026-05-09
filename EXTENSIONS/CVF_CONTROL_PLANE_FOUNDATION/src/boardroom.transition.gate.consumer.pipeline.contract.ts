import type {
  BoardroomTransitionGateResult,
  BoardroomTransitionAction,
  BoardroomTransitionNextStage,
} from "./boardroom.transition.gate.contract";
import {
  ControlPlaneConsumerPipelineContract,
  createControlPlaneConsumerPipelineContract,
} from "./consumer.pipeline.contract";
import type {
  ControlPlaneConsumerPackage,
  ControlPlaneConsumerPipelineContractDependencies,
} from "./consumer.pipeline.contract";
import type { RankableKnowledgeItem, ScoringWeights } from "./knowledge.ranking.contract";
import type { SegmentTypeConstraints } from "./context.packager.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface BoardroomTransitionGateConsumerPipelineRequest {
  gateResult: BoardroomTransitionGateResult;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface BoardroomTransitionGateConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  gateResult: BoardroomTransitionGateResult;
  consumerPackage: ControlPlaneConsumerPackage;
  query: string;
  contextId: string;
  warnings: string[];
  consumerId: string | undefined;
  pipelineHash: string;
}

export interface BoardroomTransitionGateConsumerPipelineContractDependencies {
  now?: () => string;
}

// --- Contract ---

export class BoardroomTransitionGateConsumerPipelineContract {
  private readonly consumerPipelineContract: ControlPlaneConsumerPipelineContract;
  private readonly now: () => string;

  constructor(
    dependencies: BoardroomTransitionGateConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    const consumerDeps: ControlPlaneConsumerPipelineContractDependencies = {
      now: this.now,
    };
    this.consumerPipelineContract = createControlPlaneConsumerPipelineContract(consumerDeps);
  }

  execute(
    request: BoardroomTransitionGateConsumerPipelineRequest,
  ): BoardroomTransitionGateConsumerPipelineResult {
    const createdAt = this.now();
    const { gateResult } = request;

    // Derive query
    const query =
      `BoardroomTransitionGate: action=${gateResult.action}, ` +
      `nextStage=${gateResult.nextStage}, ` +
      `blocked=${gateResult.blockingConditions.length}`;

    // Extract contextId
    const contextId = gateResult.gateId;

    // Build warnings (ordered by severity)
    const warnings: string[] = [];
    if (gateResult.action === "STOP_EXECUTION") {
      warnings.push("WARNING_EXECUTION_STOPPED");
    }
    if (gateResult.escalationRequired) {
      warnings.push("WARNING_ESCALATION_REQUIRED");
    }
    if (!gateResult.allowOrchestration) {
      warnings.push("WARNING_ORCHESTRATION_BLOCKED");
    }
    if (gateResult.blockingConditions.length > 0) {
      warnings.push("WARNING_BLOCKING_CONDITIONS");
    }

    // Build consumer package
    const consumerPackage = this.consumerPipelineContract.execute({
      rankingRequest: {
        query,
        contextId,
        candidateItems: request.candidateItems ?? [],
        scoringWeights: request.scoringWeights,
      },
      segmentTypeConstraints: request.segmentTypeConstraints,
    });

    // Compute pipeline hash
    const pipelineHash = computeDeterministicHash(
      "w2-t31-cp1-boardroom-transition-gate-consumer-pipeline",
      gateResult.gateHash,
      consumerPackage.pipelineHash,
      `action=${gateResult.action}`,
      `nextStage=${gateResult.nextStage}`,
      `allowOrchestration=${gateResult.allowOrchestration}`,
      `warnings=${warnings.length}`,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w2-t31-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      gateResult,
      consumerPackage,
      query,
      contextId,
      warnings,
      consumerId: request.consumerId,
      pipelineHash,
    };
  }
}

export function createBoardroomTransitionGateConsumerPipelineContract(
  dependencies?: BoardroomTransitionGateConsumerPipelineContractDependencies,
): BoardroomTransitionGateConsumerPipelineContract {
  return new BoardroomTransitionGateConsumerPipelineContract(dependencies);
}
