import type { ControlPlaneIntakeResult } from "./intake.contract";
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

export interface IntakeConsumerPipelineRequest {
  intakeResult: ControlPlaneIntakeResult;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface IntakeConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  intakeResult: ControlPlaneIntakeResult;
  consumerPackage: ControlPlaneConsumerPackage;
  query: string;
  contextId: string;
  warnings: string[];
  consumerId: string | undefined;
  pipelineHash: string;
}

export interface IntakeConsumerPipelineContractDependencies {
  now?: () => string;
}

// --- Contract ---

export class IntakeConsumerPipelineContract {
  private readonly consumerPipelineContract: ControlPlaneConsumerPipelineContract;
  private readonly now: () => string;

  constructor(
    dependencies: IntakeConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    const consumerDeps: ControlPlaneConsumerPipelineContractDependencies = {
      now: this.now,
    };
    this.consumerPipelineContract = createControlPlaneConsumerPipelineContract(consumerDeps);
  }

  execute(
    request: IntakeConsumerPipelineRequest,
  ): IntakeConsumerPipelineResult {
    const createdAt = this.now();
    const { intakeResult } = request;

    // Derive query from intake result
    const domain = intakeResult.intent.intent.domain;
    const chunkCount = intakeResult.retrieval.chunkCount;
    const totalTokens = intakeResult.packagedContext.totalTokens;
    const query = `Intake: domain=${domain}, chunks=${chunkCount}, tokens=${totalTokens}`;

    // Extract contextId
    const contextId = intakeResult.requestId;

    // Build warnings
    const warnings: string[] = [];
    if (domain === "general") {
      warnings.push("WARNING_NO_DOMAIN");
    }
    if (chunkCount === 0) {
      warnings.push("WARNING_NO_CHUNKS");
    }
    if (!intakeResult.intent.valid) {
      warnings.push("WARNING_INVALID_INTENT");
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
      "w1-t29-cp1-intake-consumer-pipeline",
      intakeResult.requestId,
      consumerPackage.pipelineHash,
      `warnings=${warnings.length}`,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w1-t29-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      intakeResult,
      consumerPackage,
      query,
      contextId,
      warnings,
      consumerId: request.consumerId,
      pipelineHash,
    };
  }
}

export function createIntakeConsumerPipelineContract(
  dependencies?: IntakeConsumerPipelineContractDependencies,
): IntakeConsumerPipelineContract {
  return new IntakeConsumerPipelineContract(dependencies);
}
