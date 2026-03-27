import type { BoardroomSession } from "./boardroom.contract";
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

export interface BoardroomConsumerPipelineRequest {
  boardroomSession: BoardroomSession;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface BoardroomConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  boardroomSession: BoardroomSession;
  consumerPackage: ControlPlaneConsumerPackage;
  query: string;
  contextId: string;
  warnings: string[];
  consumerId: string | undefined;
  pipelineHash: string;
}

export interface BoardroomConsumerPipelineContractDependencies {
  now?: () => string;
}

// --- Contract ---

export class BoardroomConsumerPipelineContract {
  private readonly consumerPipelineContract: ControlPlaneConsumerPipelineContract;
  private readonly now: () => string;

  constructor(
    dependencies: BoardroomConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    const consumerDeps: ControlPlaneConsumerPipelineContractDependencies = {
      now: this.now,
    };
    this.consumerPipelineContract = createControlPlaneConsumerPipelineContract(consumerDeps);
  }

  execute(
    request: BoardroomConsumerPipelineRequest,
  ): BoardroomConsumerPipelineResult {
    const createdAt = this.now();
    const { boardroomSession } = request;

    // Derive query from boardroom session
    const totalRounds = 1; // BoardroomSession represents a single session/round
    const decision = boardroomSession.decision.decision;
    const clarificationCount = boardroomSession.clarifications.length;
    const query = `BoardroomSession: ${totalRounds} rounds, decision=${decision}, clarifications=${clarificationCount}`;

    // Extract contextId
    const contextId = boardroomSession.sessionId;

    // Build warnings
    const warnings: string[] = [];
    if (totalRounds === 0) {
      warnings.push("WARNING_NO_ROUNDS");
    }
    const pendingClarifications = boardroomSession.clarifications.filter(
      (c) => c.status === "pending",
    );
    if (pendingClarifications.length > 0) {
      warnings.push("WARNING_PENDING_CLARIFICATIONS");
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
      "w1-t27-cp1-boardroom-consumer-pipeline",
      boardroomSession.sessionHash,
      consumerPackage.pipelineHash,
      `warnings=${warnings.length}`,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w1-t27-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      boardroomSession,
      consumerPackage,
      query,
      contextId,
      warnings,
      consumerId: request.consumerId,
      pipelineHash,
    };
  }
}

export function createBoardroomConsumerPipelineContract(
  dependencies?: BoardroomConsumerPipelineContractDependencies,
): BoardroomConsumerPipelineContract {
  return new BoardroomConsumerPipelineContract(dependencies);
}
