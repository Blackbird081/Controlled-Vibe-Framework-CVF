import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type {
  GatewayPIIDetectionLogConsumerPipelineResult,
} from "./gateway.pii.detection.log.consumer.pipeline.contract";
import type { PIIType } from "./gateway.pii.detection.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GatewayPIIDetectionLogConsumerPipelineBatchResult {
  batchId: string;
  createdAt: string;
  totalLogs: number;
  totalScanned: number;
  overallDominantPIIType: PIIType | null;
  dominantTokenBudget: number;
  results: GatewayPIIDetectionLogConsumerPipelineResult[];
  batchHash: string;
}

export interface GatewayPIIDetectionLogConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Dominant PII Type Logic ──────────────────────────────────────────────────

// Severity-based priority: SSN > CREDIT_CARD > EMAIL > PHONE > CUSTOM
const PII_TYPE_SEVERITY: PIIType[] = [
  "SSN",
  "CREDIT_CARD",
  "EMAIL",
  "PHONE",
  "CUSTOM",
];

function computeOverallDominantPIIType(
  results: GatewayPIIDetectionLogConsumerPipelineResult[],
): PIIType | null {
  if (results.length === 0) return null;

  // Count frequency of each PIIType across all logs
  const typeCounts: Map<PIIType, number> = new Map();

  for (const result of results) {
    if (result.dominantPIIType !== null) {
      typeCounts.set(
        result.dominantPIIType,
        (typeCounts.get(result.dominantPIIType) ?? 0) + 1,
      );
    }
  }

  if (typeCounts.size === 0) return null;

  // Find most frequent; ties broken by severity
  let maxCount = 0;
  let dominantType: PIIType | null = null;

  for (const piiType of PII_TYPE_SEVERITY) {
    const count = typeCounts.get(piiType) ?? 0;
    if (count > maxCount) {
      maxCount = count;
      dominantType = piiType;
    }
  }

  return dominantType;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * GatewayPIIDetectionLogConsumerPipelineBatchContract (W1-T24 CP2 — Fast Lane GC-021)
 * ------------------------------------------------------------------------------------
 * Aggregates multiple GatewayPIIDetectionLogConsumerPipelineResult records into a batch.
 *
 * Aggregation:
 *   totalLogs = count of results
 *   totalScanned = sum(result.log.totalScanned)
 *   overallDominantPIIType = most frequent PII type across all logs (severity-based tie-break)
 *   dominantTokenBudget = max(result.consumerPackage.typedContextPackage.estimatedTokens)
 */
export class GatewayPIIDetectionLogConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: GatewayPIIDetectionLogConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: GatewayPIIDetectionLogConsumerPipelineResult[],
  ): GatewayPIIDetectionLogConsumerPipelineBatchResult {
    const createdAt = this.now();
    const totalLogs = results.length;

    const totalScanned = results.reduce(
      (sum, r) => sum + r.log.totalScanned,
      0,
    );

    const overallDominantPIIType = computeOverallDominantPIIType(results);

    const dominantTokenBudget =
      totalLogs === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const batchHash = computeDeterministicHash(
      "w1-t24-cp2-gateway-pii-detection-log-consumer-pipeline-batch",
      `totalLogs=${totalLogs}:totalScanned=${totalScanned}`,
      `overallType=${overallDominantPIIType ?? "none"}`,
      `dominantTokenBudget=${dominantTokenBudget}`,
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w1-t24-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      totalLogs,
      totalScanned,
      overallDominantPIIType,
      dominantTokenBudget,
      results,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createGatewayPIIDetectionLogConsumerPipelineBatchContract(
  dependencies?: GatewayPIIDetectionLogConsumerPipelineBatchContractDependencies,
): GatewayPIIDetectionLogConsumerPipelineBatchContract {
  return new GatewayPIIDetectionLogConsumerPipelineBatchContract(dependencies);
}
