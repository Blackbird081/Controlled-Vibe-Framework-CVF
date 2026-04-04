import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  GatewayPIIDetectionLogContract,
  createGatewayPIIDetectionLogContract,
} from "./gateway.pii.detection.log.contract";
import type {
  GatewayPIIDetectionLogContractDependencies,
  GatewayPIIDetectionLog,
} from "./gateway.pii.detection.log.contract";
import type { GatewayPIIDetectionResult, PIIType } from "./gateway.pii.detection.contract";
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

// ─── Warning constants ────────────────────────────────────────────────────────

const WARNING_NO_SCANS =
  "[gateway-pii-detection-log] no scans — log contains zero PII detection scans";
const WARNING_HIGH_PII_RATE =
  "[gateway-pii-detection-log] high PII rate — detected PII exceeds 50% of scans";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GatewayPIIDetectionLogConsumerPipelineRequest {
  results: GatewayPIIDetectionResult[];
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface GatewayPIIDetectionLogConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  log: GatewayPIIDetectionLog;
  dominantPIIType: PIIType | null;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
  consumerId: string | undefined;
}

export interface GatewayPIIDetectionLogConsumerPipelineContractDependencies {
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * GatewayPIIDetectionLogConsumerPipelineContract (W1-T24 CP1 — Full Lane)
 * ------------------------------------------------------------------------
 * Bridges GatewayPIIDetectionLogContract into CPF consumer pipeline.
 *
 * Query format: "PIIDetectionLog: {totalScanned} scanned, detected={piiDetectedCount}, type={dominantPIIType}"
 * contextId: log.logId
 *
 * Warnings:
 *   - totalScanned === 0 → WARNING_NO_SCANS
 *   - piiDetectedCount / totalScanned > 0.5 → WARNING_HIGH_PII_RATE
 */
export class GatewayPIIDetectionLogConsumerPipelineContract {
  private readonly now: () => string;
  private readonly logContract: GatewayPIIDetectionLogContract;
  private readonly consumerPipelineContract: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: GatewayPIIDetectionLogConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());

    const logDeps: GatewayPIIDetectionLogContractDependencies = {
      now: this.now,
    };
    this.logContract = createGatewayPIIDetectionLogContract(logDeps);

    const consumerDeps: ControlPlaneConsumerPipelineContractDependencies = {
      now: this.now,
    };
    this.consumerPipelineContract = createControlPlaneConsumerPipelineContract(consumerDeps);
  }

  execute(
    request: GatewayPIIDetectionLogConsumerPipelineRequest,
  ): GatewayPIIDetectionLogConsumerPipelineResult {
    const createdAt = this.now();

    // Create log
    const log = this.logContract.log(request.results);

    const dominantPIIType = log.dominantPIIType;

    // Derive query
    const typeStr = dominantPIIType ?? "none";
    const query = `PIIDetectionLog: ${log.totalScanned} scanned, detected=${log.piiDetectedCount}, type=${typeStr}`.slice(0, 120);

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
    if (log.totalScanned === 0) {
      warnings.push(WARNING_NO_SCANS);
    }
    if (log.totalScanned > 0 && log.piiDetectedCount / log.totalScanned > 0.5) {
      warnings.push(WARNING_HIGH_PII_RATE);
    }

    // Compute pipeline hash
    const pipelineHash = computeDeterministicHash(
      "w1-t24-cp1-gateway-pii-detection-log-consumer-pipeline",
      log.logHash,
      consumerPackage.pipelineHash,
      `warnings=${warnings.length}`,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w1-t24-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      log,
      dominantPIIType,
      consumerPackage,
      pipelineHash,
      warnings,
      consumerId: request.consumerId,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createGatewayPIIDetectionLogConsumerPipelineContract(
  dependencies?: GatewayPIIDetectionLogConsumerPipelineContractDependencies,
): GatewayPIIDetectionLogConsumerPipelineContract {
  return new GatewayPIIDetectionLogConsumerPipelineContract(dependencies);
}
