import type { AsyncCommandRuntimeTicket } from "./execution.async.runtime.contract";
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

export interface AsyncRuntimeConsumerPipelineRequest {
  asyncTicket: AsyncCommandRuntimeTicket;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface AsyncRuntimeConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  asyncTicket: AsyncCommandRuntimeTicket;
  consumerPackage: ControlPlaneConsumerPackage;
  query: string;
  contextId: string;
  warnings: string[];
  consumerId: string | undefined;
  pipelineHash: string;
}

export interface AsyncRuntimeConsumerPipelineContractDependencies {
  now?: () => string;
}

// --- Contract ---

export class AsyncRuntimeConsumerPipelineContract {
  private readonly consumerPipelineContract: ControlPlaneConsumerPipelineContract;
  private readonly now: () => string;

  constructor(
    dependencies: AsyncRuntimeConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    const consumerDeps: ControlPlaneConsumerPipelineContractDependencies = {
      now: this.now,
    };
    this.consumerPipelineContract = createControlPlaneConsumerPipelineContract(consumerDeps);
  }

  execute(
    request: AsyncRuntimeConsumerPipelineRequest,
  ): AsyncRuntimeConsumerPipelineResult {
    const createdAt = this.now();
    const { asyncTicket } = request;

    // Derive query from async ticket
    const status = asyncTicket.asyncStatus;
    const executed = asyncTicket.executedCount;
    const timeout = asyncTicket.estimatedTimeoutMs;
    const query = `AsyncRuntime: status=${status}, executed=${executed}, timeout=${timeout}ms`;

    // Extract contextId
    const contextId = asyncTicket.ticketId;

    // Build warnings
    const warnings: string[] = [];
    if (asyncTicket.asyncStatus === "FAILED") {
      warnings.push("WARNING_FAILED_STATUS");
    }
    if (asyncTicket.estimatedTimeoutMs > 30000) {
      warnings.push("WARNING_LONG_TIMEOUT");
    }
    if (asyncTicket.executedCount === 0) {
      warnings.push("WARNING_NO_EXECUTION");
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
      "w2-t28-cp1-async-runtime-consumer-pipeline",
      asyncTicket.ticketHash,
      consumerPackage.pipelineHash,
      `warnings=${warnings.length}`,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w2-t28-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      asyncTicket,
      consumerPackage,
      query,
      contextId,
      warnings,
      consumerId: request.consumerId,
      pipelineHash,
    };
  }
}

export function createAsyncRuntimeConsumerPipelineContract(
  dependencies?: AsyncRuntimeConsumerPipelineContractDependencies,
): AsyncRuntimeConsumerPipelineContract {
  return new AsyncRuntimeConsumerPipelineContract(dependencies);
}
