import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type {
  GatewayPIIDetectionRequest,
  GatewayPIIDetectionResult,
  PIIType,
} from "./gateway.pii.detection.contract";
import { GatewayPIIDetectionContract } from "./gateway.pii.detection.contract";

// --- Types ---

export type DominantPIIType = PIIType | "NONE";

export interface GatewayPIIDetectionBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalRequests: number;
  totalDetected: number;
  totalClean: number;
  emailCount: number;
  phoneCount: number;
  ssnCount: number;
  creditCardCount: number;
  customCount: number;
  dominantPiiType: DominantPIIType;
  results: GatewayPIIDetectionResult[];
}

export interface GatewayPIIDetectionBatchContractDependencies {
  now?: () => string;
}

// --- Dominant PII Type Resolution ---

/*
 * Resolves the dominant PIIType by highest result-level count.
 * Tie-breaking precedence: SSN > CREDIT_CARD > EMAIL > PHONE > CUSTOM
 * Returns "NONE" when batch is empty or no PII was detected.
 *
 * Precedence reflects data sensitivity risk:
 *   SSN         — identity theft risk; highest governance weight
 *   CREDIT_CARD — financial fraud risk
 *   EMAIL       — contact/identity linkage risk
 *   PHONE       — contact risk
 *   CUSTOM      — user-defined; lowest default governance weight
 */
function resolveDominantPiiType(
  emailCount: number,
  phoneCount: number,
  ssnCount: number,
  creditCardCount: number,
  customCount: number,
): DominantPIIType {
  const total = emailCount + phoneCount + ssnCount + creditCardCount + customCount;
  if (total === 0) return "NONE";

  const maxCount = Math.max(emailCount, phoneCount, ssnCount, creditCardCount, customCount);

  // Tie-breaking: SSN > CREDIT_CARD > EMAIL > PHONE > CUSTOM
  if (ssnCount === maxCount) return "SSN";
  if (creditCardCount === maxCount) return "CREDIT_CARD";
  if (emailCount === maxCount) return "EMAIL";
  if (phoneCount === maxCount) return "PHONE";
  return "CUSTOM";
}

// --- Contract ---

export class GatewayPIIDetectionBatchContract {
  private readonly now: () => string;

  constructor(dependencies: GatewayPIIDetectionBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    requests: GatewayPIIDetectionRequest[],
    contract: GatewayPIIDetectionContract,
  ): GatewayPIIDetectionBatch {
    const createdAt = this.now();
    const results: GatewayPIIDetectionResult[] = [];

    for (const request of requests) {
      results.push(contract.detect(request));
    }

    const totalDetected = results.filter((r) => r.piiDetected).length;
    const totalClean = results.filter((r) => !r.piiDetected).length;

    const emailCount = results.filter((r) => r.piiTypes.includes("EMAIL")).length;
    const phoneCount = results.filter((r) => r.piiTypes.includes("PHONE")).length;
    const ssnCount = results.filter((r) => r.piiTypes.includes("SSN")).length;
    const creditCardCount = results.filter((r) => r.piiTypes.includes("CREDIT_CARD")).length;
    const customCount = results.filter((r) => r.piiTypes.includes("CUSTOM")).length;

    const dominantPiiType = resolveDominantPiiType(
      emailCount,
      phoneCount,
      ssnCount,
      creditCardCount,
      customCount,
    );

    const batchHash = computeDeterministicHash(
      "w24-t1-cp1-gateway-pii-detection-batch",
      ...results.map((r) => r.detectionHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w24-t1-cp1-gateway-pii-detection-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalRequests: results.length,
      totalDetected,
      totalClean,
      emailCount,
      phoneCount,
      ssnCount,
      creditCardCount,
      customCount,
      dominantPiiType,
      results,
    };
  }
}

export function createGatewayPIIDetectionBatchContract(
  dependencies?: GatewayPIIDetectionBatchContractDependencies,
): GatewayPIIDetectionBatchContract {
  return new GatewayPIIDetectionBatchContract(dependencies);
}
