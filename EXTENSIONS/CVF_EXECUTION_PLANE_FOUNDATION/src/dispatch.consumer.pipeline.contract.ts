import type { DispatchResult } from "./dispatch.contract";
import {
  ControlPlaneConsumerPipelineContract,
  createControlPlaneConsumerPipelineContract,
} from "../../CVF_CONTROL_PLANE_FOUNDATION/src/consumer.pipeline.contract";
import type {
  ControlPlaneConsumerPackage,
  ControlPlaneConsumerPipelineContractDependencies,
} from "../../CVF_CONTROL_PLANE_FOUNDATION/src/consumer.pipeline.contract";
import type { RankableKnowledgeItem, ScoringWeights } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.ranking.contract";
import type { SegmentTypeConstraints } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/context.packager.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface DispatchConsumerPipelineRequest {
  dispatchResult: DispatchResult;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface DispatchConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  dispatchResult: DispatchResult;
  consumerPackage: ControlPlaneConsumerPackage;
  query: string;
  contextId: string;
  warnings: string[];
  consumerId: string | undefined;
  pipelineHash: string;
}

export interface DispatchConsumerPipelineContractDependencies {
  now?: () => string;
}

// --- Contract ---

export class DispatchConsumerPipelineContract {
  private readonly consumerPipelineContract: ControlPlaneConsumerPipelineContract;
  private readonly now: () => string;

  constructor(
    dependencies: DispatchConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    const consumerDeps: ControlPlaneConsumerPipelineContractDependencies = {
      now: this.now,
    };
    this.consumerPipelineContract = createControlPlaneConsumerPipelineContract(consumerDeps);
  }

  execute(
    request: DispatchConsumerPipelineRequest,
  ): DispatchConsumerPipelineResult {
    const createdAt = this.now();
    const { dispatchResult } = request;

    // Derive query from dispatch result
    const totalDispatched = dispatchResult.totalDispatched;
    const authorized = dispatchResult.authorizedCount;
    const blocked = dispatchResult.blockedCount;
    const query = `Dispatch: total=${totalDispatched}, authorized=${authorized}, blocked=${blocked}`;

    // Extract contextId
    const contextId = dispatchResult.dispatchId;

    // Build warnings
    const warnings: string[] = [];
    if (dispatchResult.blockedCount > 0) {
      warnings.push("WARNING_BLOCKED_DISPATCHES");
    }
    if (dispatchResult.escalatedCount > 0) {
      warnings.push("WARNING_ESCALATED_DISPATCHES");
    }
    if (dispatchResult.totalDispatched === 0) {
      warnings.push("WARNING_NO_DISPATCHES");
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
      "w2-t27-cp1-dispatch-consumer-pipeline",
      dispatchResult.dispatchHash,
      consumerPackage.pipelineHash,
      `warnings=${warnings.length}`,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w2-t27-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      dispatchResult,
      consumerPackage,
      query,
      contextId,
      warnings,
      consumerId: request.consumerId,
      pipelineHash,
    };
  }
}

export function createDispatchConsumerPipelineContract(
  dependencies?: DispatchConsumerPipelineContractDependencies,
): DispatchConsumerPipelineContract {
  return new DispatchConsumerPipelineContract(dependencies);
}
