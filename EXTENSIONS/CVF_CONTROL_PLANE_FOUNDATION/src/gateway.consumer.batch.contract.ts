import {
  GatewayConsumerContract,
  type GatewayConsumerContractDependencies,
  type GatewayConsumptionReceipt,
} from "./gateway.consumer.contract";
import type { GatewaySignalRequest } from "./ai.gateway.contract";
import { createDeterministicBatchIdentity } from "./batch.contract.shared";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GatewayConsumptionBatchStatus = "COMPLETE" | "PARTIAL" | "DEGRADED";

export interface GatewayConsumptionBatchResult {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalRequests: number;
  completedCount: number;
  partialCount: number;
  degradedCount: number;
  warnedCount: number;
  totalChunksRetrieved: number;
  dominantStatus: GatewayConsumptionBatchStatus | "NONE";
  receipts: GatewayConsumptionReceipt[];
}

export interface GatewayConsumerBatchContractDependencies {
  contractDependencies?: GatewayConsumerContractDependencies;
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * GatewayConsumerBatchContract (W45-T1 CP1 — Full Lane GC-019)
 * -------------------------------------------------------
 * Batches multiple GatewaySignalRequests through GatewayConsumerContract.consume()
 * into a governed batch summary.
 *
 * Fields:
 *   totalRequests        = count of signals
 *   completedCount       = receipts with valid intent + chunkCount > 0
 *   partialCount         = receipts with valid intent but chunkCount === 0
 *   degradedCount        = receipts where intakeResult.intent.valid is false
 *   warnedCount          = receipts where warnings.length > 0
 *   totalChunksRetrieved = sum(intakeResult.retrieval.chunkCount) across all receipts
 *   dominantStatus       = DEGRADED > PARTIAL > COMPLETE; "NONE" for empty batch
 *   batchHash            = deterministic hash of batch state
 *   batchId              = distinct hash derived from batchHash
 *   receipts             = GatewayConsumptionReceipt[] in input order
 */
export class GatewayConsumerBatchContract {
  private readonly contract: GatewayConsumerContract;
  private readonly now: () => string;

  constructor(dependencies: GatewayConsumerBatchContractDependencies = {}) {
    this.contract = new GatewayConsumerContract(
      dependencies.contractDependencies ?? {},
    );
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(signals: GatewaySignalRequest[]): GatewayConsumptionBatchResult {
    const createdAt = this.now();
    const receipts: GatewayConsumptionReceipt[] = signals.map((signal) =>
      this.contract.consume(signal),
    );

    const totalRequests = receipts.length;
    let completedCount = 0;
    let partialCount = 0;
    let degradedCount = 0;
    let warnedCount = 0;
    let totalChunksRetrieved = 0;

    for (const receipt of receipts) {
      totalChunksRetrieved += receipt.intakeResult.retrieval.chunkCount;

      if (receipt.warnings.length > 0) {
        warnedCount++;
      }

      if (!receipt.intakeResult.intent.valid) {
        degradedCount++;
      } else if (receipt.intakeResult.retrieval.chunkCount === 0) {
        partialCount++;
      } else {
        completedCount++;
      }
    }

    const dominantStatus: GatewayConsumptionBatchStatus | "NONE" =
      totalRequests === 0
        ? "NONE"
        : degradedCount > 0
          ? "DEGRADED"
          : partialCount > 0
            ? "PARTIAL"
            : "COMPLETE";

    const { batchHash, batchId } = createDeterministicBatchIdentity({
      batchSeed: "w45-t1-cp1-gateway-consumer-batch",
      batchIdSeed: "w45-t1-cp1-gateway-consumer-batch-id",
      hashParts: [
        `${createdAt}:total:${totalRequests}`,
        `complete:${completedCount}`,
        `partial:${partialCount}`,
        `degraded:${degradedCount}`,
      ],
      batchIdParts: [createdAt],
    });

    return {
      batchId,
      batchHash,
      createdAt,
      totalRequests,
      completedCount,
      partialCount,
      degradedCount,
      warnedCount,
      totalChunksRetrieved,
      dominantStatus,
      receipts,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createGatewayConsumerBatchContract(
  dependencies?: GatewayConsumerBatchContractDependencies,
): GatewayConsumerBatchContract {
  return new GatewayConsumerBatchContract(dependencies);
}
