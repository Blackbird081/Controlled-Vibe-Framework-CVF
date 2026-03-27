import type { BoardroomRound, RefinementFocus } from "./boardroom.round.contract";
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

export interface BoardroomRoundConsumerPipelineRequest {
  round: BoardroomRound;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface BoardroomRoundConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  round: BoardroomRound;
  consumerPackage: ControlPlaneConsumerPackage;
  query: string;
  contextId: string;
  warnings: string[];
  consumerId: string | undefined;
  pipelineHash: string;
}

export interface BoardroomRoundConsumerPipelineContractDependencies {
  now?: () => string;
}

// --- Contract ---

export class BoardroomRoundConsumerPipelineContract {
  private readonly consumerPipelineContract: ControlPlaneConsumerPipelineContract;
  private readonly now: () => string;

  constructor(dependencies: BoardroomRoundConsumerPipelineContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    const consumerDeps: ControlPlaneConsumerPipelineContractDependencies = {
      now: this.now,
    };
    this.consumerPipelineContract = createControlPlaneConsumerPipelineContract(consumerDeps);
  }

  execute(request: BoardroomRoundConsumerPipelineRequest): BoardroomRoundConsumerPipelineResult {
    const createdAt = this.now();
    const { round } = request;

    // Derive query
    const query =
      `BoardroomRound: focus=${round.refinementFocus}, ` +
      `decision=${round.sourceDecision}, ` +
      `round=${round.roundNumber}`;

    // Extract contextId
    const contextId = round.roundId;

    // Build warnings (severity-ordered)
    const warnings: string[] = [];
    if (round.refinementFocus === "RISK_REVIEW") {
      warnings.push("WARNING_RISK_REVIEW");
    }
    if (round.refinementFocus === "ESCALATION_REVIEW") {
      warnings.push("WARNING_ESCALATION_REVIEW");
    }
    if (round.refinementFocus === "TASK_AMENDMENT") {
      warnings.push("WARNING_TASK_AMENDMENT");
    }
    // CLARIFICATION emits no warnings

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

    // Compute hashes
    const pipelineHash = computeDeterministicHash(
      "w2-t33-cp1-boardroom-round-consumer-pipeline",
      round.roundHash,
      consumerPackage.pipelineHash,
      `focus=${round.refinementFocus}`,
      `decision=${round.sourceDecision}`,
      `round=${round.roundNumber}`,
      `warnings=${warnings.length}`,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w2-t33-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      round,
      consumerPackage,
      query,
      contextId,
      warnings,
      consumerId: request.consumerId,
      pipelineHash,
    };
  }
}

export function createBoardroomRoundConsumerPipelineContract(
  dependencies?: BoardroomRoundConsumerPipelineContractDependencies,
): BoardroomRoundConsumerPipelineContract {
  return new BoardroomRoundConsumerPipelineContract(dependencies);
}
