import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  LearningStorageLogContract,
  createLearningStorageLogContract,
} from "./learning.storage.log.contract";
import type {
  LearningStorageLogContractDependencies,
  LearningStorageLog,
} from "./learning.storage.log.contract";
import type { LearningStorageRecord, LearningRecordType } from "./learning.storage.contract";
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

const WARNING_NO_RECORDS =
  "[learning-storage-log] no records — log contains zero storage records";
const WARNING_NO_DOMINANT_TYPE =
  "[learning-storage-log] no dominant type — unable to determine dominant record type";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LearningStorageLogConsumerPipelineRequest {
  records: LearningStorageRecord[];
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface LearningStorageLogConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  log: LearningStorageLog;
  dominantRecordType: LearningRecordType | null;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
  consumerId: string | undefined;
}

export interface LearningStorageLogConsumerPipelineContractDependencies {
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * LearningStorageLogConsumerPipelineContract (W4-T24 CP1 — Full Lane)
 * ---------------------------------------------------------------------
 * Bridges LearningStorageLogContract into CPF consumer pipeline.
 *
 * Query format: "StorageLog: {totalRecords} records, type={dominantRecordType}"
 * contextId: log.logId
 *
 * Warnings:
 *   - totalRecords === 0 → WARNING_NO_RECORDS
 *   - dominantRecordType === null → WARNING_NO_DOMINANT_TYPE
 */
export class LearningStorageLogConsumerPipelineContract {
  private readonly now: () => string;
  private readonly logContract: LearningStorageLogContract;
  private readonly consumerPipelineContract: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: LearningStorageLogConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());

    const logDeps: LearningStorageLogContractDependencies = {
      now: this.now,
    };
    this.logContract = createLearningStorageLogContract(logDeps);

    const consumerDeps: ControlPlaneConsumerPipelineContractDependencies = {
      now: this.now,
    };
    this.consumerPipelineContract = createControlPlaneConsumerPipelineContract(consumerDeps);
  }

  execute(
    request: LearningStorageLogConsumerPipelineRequest,
  ): LearningStorageLogConsumerPipelineResult {
    const createdAt = this.now();

    // Create log
    const log = this.logContract.log(request.records);

    const dominantRecordType = log.dominantRecordType;

    // Derive query
    const typeStr = dominantRecordType ?? "none";
    const query = `StorageLog: ${log.totalRecords} records, type=${typeStr}`.slice(0, 120);

    // Build consumer package
    const consumerPackage = this.consumerPipelineContract.execute({
      rankingRequest: {
        query,
        contextId: log.logId,
        candidateItems: request.candidateItems ?? [],
        scoringWeights: request.scoringWeights,
      },
      segmentTypeConstraints: request.segmentTypeConstraints,
    });

    // Compute warnings
    const warnings: string[] = [];
    if (log.totalRecords === 0) {
      warnings.push(WARNING_NO_RECORDS);
    }
    if (dominantRecordType === null) {
      warnings.push(WARNING_NO_DOMINANT_TYPE);
    }

    // Compute pipeline hash
    const pipelineHash = computeDeterministicHash(
      "w4-t24-cp1-learning-storage-log-consumer-pipeline",
      log.logHash,
      consumerPackage.pipelineHash,
      `warnings=${warnings.length}`,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w4-t24-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      log,
      dominantRecordType,
      consumerPackage,
      pipelineHash,
      warnings,
      consumerId: request.consumerId,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createLearningStorageLogConsumerPipelineContract(
  dependencies?: LearningStorageLogConsumerPipelineContractDependencies,
): LearningStorageLogConsumerPipelineContract {
  return new LearningStorageLogConsumerPipelineContract(dependencies);
}
