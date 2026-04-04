import type {
  GatewayPIIDetectionResult,
  PIIType,
} from "./gateway.pii.detection.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Priority for dominant PII type (frequency-first; tie-break by sensitivity) ---

const PII_TYPE_PRIORITY: PIIType[] = [
  "SSN",
  "CREDIT_CARD",
  "EMAIL",
  "PHONE",
  "CUSTOM",
];

// --- Types ---

export interface GatewayPIIDetectionLog {
  logId: string;
  createdAt: string;
  totalScanned: number;
  piiDetectedCount: number;
  cleanCount: number;
  dominantPIIType: PIIType | null; // null when no PII detected in any result
  logHash: string;
}

export interface GatewayPIIDetectionLogContractDependencies {
  now?: () => string;
}

// --- Contract ---

export class GatewayPIIDetectionLogContract {
  private readonly now: () => string;

  constructor(
    dependencies: GatewayPIIDetectionLogContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  log(results: GatewayPIIDetectionResult[]): GatewayPIIDetectionLog {
    const createdAt = this.now();

    const piiDetectedCount = results.filter((r) => r.piiDetected).length;
    const cleanCount = results.length - piiDetectedCount;

    // Count frequency of each PIIType across all results
    const typeCounts: Map<PIIType, number> = new Map();
    for (const result of results) {
      for (const match of result.matches) {
        typeCounts.set(
          match.piiType,
          (typeCounts.get(match.piiType) ?? 0) + match.matchCount,
        );
      }
    }

    // Dominant: frequency-first; ties broken by sensitivity priority SSN > CC > EMAIL > PHONE > CUSTOM
    let dominantPIIType: PIIType | null = null;
    let maxCount = 0;
    for (const piiType of PII_TYPE_PRIORITY) {
      const count = typeCounts.get(piiType) ?? 0;
      if (count > maxCount) {
        maxCount = count;
        dominantPIIType = piiType;
      }
    }

    const logHash = computeDeterministicHash(
      "w1-t9-cp2-pii-log",
      `${createdAt}:total:${results.length}`,
      `detected:${piiDetectedCount}:clean:${cleanCount}`,
      `dominant:${dominantPIIType ?? "none"}`,
    );

    const logId = computeDeterministicHash(
      "w1-t9-cp2-log-id",
      logHash,
      createdAt,
    );

    return {
      logId,
      createdAt,
      totalScanned: results.length,
      piiDetectedCount,
      cleanCount,
      dominantPIIType,
      logHash,
    };
  }
}

export function createGatewayPIIDetectionLogContract(
  dependencies?: GatewayPIIDetectionLogContractDependencies,
): GatewayPIIDetectionLogContract {
  return new GatewayPIIDetectionLogContract(dependencies);
}
