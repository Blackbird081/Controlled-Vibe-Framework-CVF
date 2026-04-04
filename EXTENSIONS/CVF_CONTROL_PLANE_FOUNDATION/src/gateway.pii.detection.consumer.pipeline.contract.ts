import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  GatewayPIIDetectionContract,
  createGatewayPIIDetectionContract,
} from "./gateway.pii.detection.contract";
import type {
  GatewayPIIDetectionRequest,
  GatewayPIIDetectionResult,
  GatewayPIIDetectionContractDependencies,
} from "./gateway.pii.detection.contract";
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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GatewayPIIDetectionConsumerPipelineRequest {
  detectionRequest: GatewayPIIDetectionRequest;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface GatewayPIIDetectionConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  detectionResult: GatewayPIIDetectionResult;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
}

export interface GatewayPIIDetectionConsumerPipelineContractDependencies {
  now?: () => string;
  detectionContractDeps?: GatewayPIIDetectionContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Query Derivation ─────────────────────────────────────────────────────────

function derivePIIDetectionQuery(result: GatewayPIIDetectionResult): string {
  const raw = `${result.tenantId}:pii:${result.piiDetected}:${result.piiTypes.join(",")}`;
  return raw.slice(0, 120);
}

// ─── Warning Builder ──────────────────────────────────────────────────────────

function buildPIIDetectionWarnings(result: GatewayPIIDetectionResult): string[] {
  const warnings: string[] = [];
  if (result.piiDetected) {
    warnings.push("[pii] detected in signal: redact before consumer use");
  }
  if (result.piiTypes.includes("CUSTOM")) {
    warnings.push("[pii] custom pattern match detected");
  }
  return warnings;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * GatewayPIIDetectionConsumerPipelineContract (W1-T18)
 * -----------------------------------------------------
 * CPF-internal consumer bridge.
 *
 * Internal chain (single execute call):
 *   GatewayPIIDetectionContract.detect(detectionRequest)  → GatewayPIIDetectionResult
 *   ControlPlaneConsumerPipelineContract.execute(...)      → ControlPlaneConsumerPackage
 *   → GatewayPIIDetectionConsumerPipelineResult
 *
 * Determinism: all sub-contracts share the same injected now().
 * Warnings: piiDetected → redact before consumer use; CUSTOM → custom pattern match detected.
 */
export class GatewayPIIDetectionConsumerPipelineContract {
  private readonly now: () => string;
  private readonly detectionContract: GatewayPIIDetectionContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: GatewayPIIDetectionConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.detectionContract = createGatewayPIIDetectionContract({
      ...dependencies.detectionContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: GatewayPIIDetectionConsumerPipelineRequest,
  ): GatewayPIIDetectionConsumerPipelineResult {
    const createdAt = this.now();

    // Step 1: run PII detection
    const detectionResult: GatewayPIIDetectionResult =
      this.detectionContract.detect(request.detectionRequest);

    // Step 2: derive query and build consumer package
    const query = derivePIIDetectionQuery(detectionResult);
    const consumerPackage: ControlPlaneConsumerPackage =
      this.consumerPipeline.execute({
        rankingRequest: {
          query,
          contextId: detectionResult.resultId,
          candidateItems: request.candidateItems ?? [],
          scoringWeights: request.scoringWeights,
        },
        segmentTypeConstraints: request.segmentTypeConstraints,
      });

    // Step 3: build warnings based on detection outcome
    const warnings = buildPIIDetectionWarnings(detectionResult);

    // Step 4: deterministic hash + resultId
    const pipelineHash = computeDeterministicHash(
      "w1-t18-cp1-pii-detection-consumer-pipeline",
      detectionResult.detectionHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w1-t18-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      consumerId: request.consumerId,
      detectionResult,
      consumerPackage,
      pipelineHash,
      warnings,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createGatewayPIIDetectionConsumerPipelineContract(
  dependencies?: GatewayPIIDetectionConsumerPipelineContractDependencies,
): GatewayPIIDetectionConsumerPipelineContract {
  return new GatewayPIIDetectionConsumerPipelineContract(dependencies);
}
