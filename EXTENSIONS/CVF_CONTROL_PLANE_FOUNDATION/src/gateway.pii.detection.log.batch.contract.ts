import type {
  GatewayPIIDetectionResult,
  PIIType,
} from "./gateway.pii.detection.contract";
import { GatewayPIIDetectionLogContract } from "./gateway.pii.detection.log.contract";
import type { GatewayPIIDetectionLog } from "./gateway.pii.detection.log.contract";
import {
  createDeterministicBatchIdentity,
  resolveDominantBySeverity,
} from "./batch.contract.shared";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GatewayPIIDetectionLogBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalLogs: number;
  totalScanned: number;
  piiDetectedCount: number;
  cleanCount: number;
  overallDominantPIIType: PIIType | null;
  logs: GatewayPIIDetectionLog[];
}

export interface GatewayPIIDetectionLogBatchContractDependencies {
  now?: () => string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PII_SEVERITY: Record<PIIType, number> = {
  SSN: 5,
  CREDIT_CARD: 4,
  EMAIL: 3,
  PHONE: 2,
  CUSTOM: 1,
};

function resolveOverallDominantPIIType(
  logs: GatewayPIIDetectionLog[],
): PIIType | null {
  const nonNull = logs
    .map((l) => l.dominantPIIType)
    .filter((t): t is PIIType => t !== null);
  if (nonNull.length === 0) return null;
  const result = resolveDominantBySeverity<PIIType, "NONE">(
    nonNull,
    PII_SEVERITY,
    "NONE",
    "CUSTOM",
  );
  return result === "NONE" ? null : result;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * GatewayPIIDetectionLogBatchContract (W42-T1 CP1 — Full Lane GC-019)
 * ---------------------------------------------------------------------
 * Batches multiple GatewayPIIDetectionResult[] sets through
 * GatewayPIIDetectionLogContract.log() into a governed batch summary.
 *
 * Fields:
 *   totalLogs              = count of entries
 *   totalScanned           = sum(log.totalScanned) across all logs
 *   piiDetectedCount       = sum(log.piiDetectedCount) across all logs
 *   cleanCount             = sum(log.cleanCount) across all logs
 *   overallDominantPIIType = most severe non-null dominantPIIType across all
 *                            logs; severity: SSN > CREDIT_CARD > EMAIL > PHONE
 *                            > CUSTOM; null when all logs have no PII detected
 *   batchHash              = hash of all logHashes + createdAt
 *   batchId                = hash(batchHash) — distinct from batchHash
 *   logs                   = full GatewayPIIDetectionLog[] in input order
 */
export class GatewayPIIDetectionLogBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: GatewayPIIDetectionLogBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    entries: GatewayPIIDetectionResult[][],
    log: GatewayPIIDetectionLogContract,
  ): GatewayPIIDetectionLogBatch {
    const createdAt = this.now();
    const logs: GatewayPIIDetectionLog[] = entries.map((results) =>
      log.log(results),
    );

    const totalLogs = logs.length;
    const totalScanned = logs.reduce((sum, l) => sum + l.totalScanned, 0);
    const piiDetectedCount = logs.reduce(
      (sum, l) => sum + l.piiDetectedCount,
      0,
    );
    const cleanCount = logs.reduce((sum, l) => sum + l.cleanCount, 0);

    const overallDominantPIIType = resolveOverallDominantPIIType(logs);

    const { batchHash, batchId } = createDeterministicBatchIdentity({
      batchSeed: "w42-t1-cp1-gateway-pii-detection-log-batch",
      batchIdSeed: "w42-t1-cp1-gateway-pii-detection-log-batch-id",
      hashParts: [...logs.map((l) => l.logHash), createdAt],
    });

    return {
      batchId,
      batchHash,
      createdAt,
      totalLogs,
      totalScanned,
      piiDetectedCount,
      cleanCount,
      overallDominantPIIType,
      logs,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createGatewayPIIDetectionLogBatchContract(
  dependencies?: GatewayPIIDetectionLogBatchContractDependencies,
): GatewayPIIDetectionLogBatchContract {
  return new GatewayPIIDetectionLogBatchContract(dependencies);
}
