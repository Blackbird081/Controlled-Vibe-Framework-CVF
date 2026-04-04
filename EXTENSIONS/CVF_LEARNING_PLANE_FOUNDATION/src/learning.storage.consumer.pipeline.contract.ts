import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  LearningStorageContract,
  createLearningStorageContract,
} from "./learning.storage.contract";
import type {
  LearningStorageRecord,
  LearningRecordType,
  LearningStorageContractDependencies,
} from "./learning.storage.contract";
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

// ─── Warning constants ────────────────────────────────────────────────────────

const WARNING_LARGE_PAYLOAD =
  "[learning-storage] large payload detected — artifact size exceeds 10KB threshold";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LearningStorageConsumerPipelineRequest {
  artifact: object;
  recordType: LearningRecordType;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface LearningStorageConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  storageRecord: LearningStorageRecord;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
  consumerId: string | undefined;
}

export interface LearningStorageConsumerPipelineContractDependencies {
  now?: () => string;
  storageContractDeps?: LearningStorageContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * LearningStorageConsumerPipelineContract (W4-T16 CP1 — Full Lane GC-019)
 * -----------------------------------------------------------------------
 * Bridges LearningStorageContract into the CPF consumer pipeline.
 *
 * Chain:
 *   artifact + recordType
 *     → LearningStorageContract.store()
 *     → LearningStorageRecord { recordId, payloadSize, ... }
 *     → ControlPlaneConsumerPipelineContract.execute()
 *     → ControlPlaneConsumerPackage
 *     → LearningStorageConsumerPipelineResult
 *
 * Query: "Storage: {recordType} ({payloadSize} bytes)" (max 120 chars)
 * contextId: storageRecord.recordId
 *
 * Warnings:
 *   payloadSize > 10000 → WARNING_LARGE_PAYLOAD
 */
export class LearningStorageConsumerPipelineContract {
  private readonly now: () => string;
  private readonly storageContract: LearningStorageContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: LearningStorageConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.storageContract = createLearningStorageContract({
      ...dependencies.storageContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: LearningStorageConsumerPipelineRequest,
  ): LearningStorageConsumerPipelineResult {
    const createdAt = this.now();

    const storageRecord: LearningStorageRecord = this.storageContract.store(
      request.artifact,
      request.recordType,
    );

    const query = `Storage: ${storageRecord.recordType} (${storageRecord.payloadSize} bytes)`.slice(
      0,
      120,
    );

    const contextId = storageRecord.recordId;

    const consumerPackage: ControlPlaneConsumerPackage =
      this.consumerPipeline.execute({
        rankingRequest: {
          query,
          contextId,
          candidateItems: request.candidateItems ?? [],
          scoringWeights: request.scoringWeights,
        },
        segmentTypeConstraints: request.segmentTypeConstraints,
      });

    const warnings: string[] = [];
    if (storageRecord.payloadSize > 10000) {
      warnings.push(WARNING_LARGE_PAYLOAD);
    }

    const pipelineHash = computeDeterministicHash(
      "w4-t16-cp1-learning-storage-consumer-pipeline",
      storageRecord.storageHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w4-t16-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      storageRecord,
      consumerPackage,
      pipelineHash,
      warnings,
      consumerId: request.consumerId,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createLearningStorageConsumerPipelineContract(
  dependencies?: LearningStorageConsumerPipelineContractDependencies,
): LearningStorageConsumerPipelineContract {
  return new LearningStorageConsumerPipelineContract(dependencies);
}
