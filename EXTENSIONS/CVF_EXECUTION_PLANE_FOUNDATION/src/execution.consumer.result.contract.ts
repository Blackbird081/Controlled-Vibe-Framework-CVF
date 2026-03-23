import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { MultiAgentCoordinationResult } from "./execution.multi.agent.coordination.contract";
import {
  ControlPlaneConsumerPipelineContract,
  createControlPlaneConsumerPipelineContract,
} from "../../CVF_CONTROL_PLANE_FOUNDATION/src/consumer.pipeline.contract";
import type {
  ControlPlaneConsumerPackage,
  ControlPlaneConsumerPipelineContractDependencies,
} from "../../CVF_CONTROL_PLANE_FOUNDATION/src/consumer.pipeline.contract";
import type { ScoringWeights, RankableKnowledgeItem } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.ranking.contract";
import type { SegmentTypeConstraints } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/context.packager.contract";

// --- Types ---

export interface ExecutionConsumerResultRequest {
  coordinationResult: MultiAgentCoordinationResult;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
  sessionId?: string;
}

export interface ExecutionConsumerResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  sessionId?: string;
  coordinationResult: MultiAgentCoordinationResult;
  consumerPackage: ControlPlaneConsumerPackage;
  executionConsumerHash: string;
  warnings: string[];
}

export interface ExecutionConsumerResultContractDependencies {
  consumerPipeline?: ControlPlaneConsumerPipelineContract;
  consumerPipelineDependencies?: ControlPlaneConsumerPipelineContractDependencies;
  now?: () => string;
}

// --- Helpers ---

function buildCoordinationQuery(result: MultiAgentCoordinationResult): string {
  return `coordination ${result.coordinationId} status:${result.coordinationStatus} agents:${result.agents.length} tasks:${result.totalTasksDistributed}`;
}

// --- Contract ---

export class ExecutionConsumerResultContract {
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;
  private readonly now: () => string;

  constructor(
    dependencies: ExecutionConsumerResultContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.consumerPipeline =
      dependencies.consumerPipeline ??
      createControlPlaneConsumerPipelineContract({
        ...dependencies.consumerPipelineDependencies,
        now: dependencies.consumerPipelineDependencies?.now ?? this.now,
      });
  }

  execute(
    request: ExecutionConsumerResultRequest,
  ): ExecutionConsumerResult {
    const createdAt = this.now();
    const { coordinationResult } = request;

    // Build query from coordination context
    const query = buildCoordinationQuery(coordinationResult);

    // Drive consumer pipeline using coordinationId as contextId
    const consumerPackage = this.consumerPipeline.execute({
      rankingRequest: {
        query,
        contextId: coordinationResult.coordinationId,
        candidateItems: request.candidateItems ?? [],
        scoringWeights: request.scoringWeights,
      },
      segmentTypeConstraints: request.segmentTypeConstraints,
    });

    // Build deterministic hash
    const executionConsumerHash = computeDeterministicHash(
      "w2-t10-cp1-execution-consumer-result",
      coordinationResult.coordinationHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w2-t10-cp1-result-id",
      executionConsumerHash,
    );

    const warnings: string[] = [];
    if (coordinationResult.coordinationStatus === "FAILED") {
      warnings.push(
        `[coordination] Coordination ${coordinationResult.coordinationId} FAILED — consumer enrichment based on failed coordination.`,
      );
    } else if (coordinationResult.coordinationStatus === "PARTIAL") {
      warnings.push(
        `[coordination] Coordination ${coordinationResult.coordinationId} PARTIAL — only ${coordinationResult.agents.length} agent(s) assigned.`,
      );
    }

    return {
      resultId,
      createdAt,
      consumerId: request.consumerId,
      sessionId: request.sessionId,
      coordinationResult,
      consumerPackage,
      executionConsumerHash,
      warnings,
    };
  }
}

export function createExecutionConsumerResultContract(
  dependencies?: ExecutionConsumerResultContractDependencies,
): ExecutionConsumerResultContract {
  return new ExecutionConsumerResultContract(dependencies);
}
