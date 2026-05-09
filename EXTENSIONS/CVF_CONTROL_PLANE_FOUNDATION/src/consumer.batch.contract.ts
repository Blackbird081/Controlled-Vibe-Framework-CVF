import {
  ConsumerContract,
  type ConsumerRequest,
  type ConsumptionReceipt,
  type ConsumerContractDependencies,
} from "./consumer.contract";
import { createDeterministicBatchIdentity } from "./batch.contract.shared";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConsumptionBatchStatus = "COMPLETE" | "PARTIAL" | "DEGRADED";

export interface ConsumerBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalRequests: number;
  completeCount: number;
  partialCount: number;
  degradedCount: number;
  frozenCount: number;
  totalChunksRetrieved: number;
  dominantStatus: ConsumptionBatchStatus | "NONE";
  receipts: ConsumptionReceipt[];
}

export interface ConsumerBatchContractDependencies {
  contractDependencies?: ConsumerContractDependencies;
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * ConsumerBatchContract (W44-T1 CP1 — Full Lane GC-019)
 * -------------------------------------------------------
 * Batches multiple ConsumerRequests through ConsumerContract.consume()
 * into a governed batch summary.
 *
 * Fields:
 *   totalRequests        = count of requests
 *   completeCount        = count of receipts with valid intent + chunks retrieved
 *   partialCount         = count of receipts with valid intent but zero chunks
 *   degradedCount        = count of receipts where intent.valid is false
 *   frozenCount          = count of receipts where freeze is defined
 *   totalChunksRetrieved = sum(intake.retrieval.chunkCount) across all receipts
 *   dominantStatus       = DEGRADED > PARTIAL > COMPLETE; "NONE" for empty batch
 *   batchHash            = deterministic hash of batch state
 *   batchId              = distinct hash derived from batchHash
 *   receipts             = ConsumptionReceipt[] in input order
 */
export class ConsumerBatchContract {
  private readonly contract: ConsumerContract;
  private readonly now: () => string;

  constructor(dependencies: ConsumerBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.contract = new ConsumerContract({
      ...(dependencies.contractDependencies ?? {}),
      now: dependencies.contractDependencies?.now ?? this.now,
    });
  }

  batch(requests: ConsumerRequest[]): ConsumerBatch {
    const createdAt = this.now();
    const receipts: ConsumptionReceipt[] = requests.map((req) =>
      this.contract.consume(req),
    );

    const totalRequests = receipts.length;
    let completeCount = 0;
    let partialCount = 0;
    let degradedCount = 0;
    let frozenCount = 0;
    let totalChunksRetrieved = 0;

    for (const receipt of receipts) {
      totalChunksRetrieved += receipt.intake.retrieval.chunkCount;

      if (receipt.freeze !== undefined) {
        frozenCount++;
      }

      if (!receipt.intake.intent.valid) {
        degradedCount++;
      } else if (receipt.intake.retrieval.chunkCount === 0) {
        partialCount++;
      } else {
        completeCount++;
      }
    }

    const dominantStatus: ConsumptionBatchStatus | "NONE" =
      totalRequests === 0
        ? "NONE"
        : degradedCount > 0
          ? "DEGRADED"
          : partialCount > 0
            ? "PARTIAL"
            : "COMPLETE";

    const { batchHash, batchId } = createDeterministicBatchIdentity({
      batchSeed: "w44-t1-cp1-consumer-batch",
      batchIdSeed: "w44-t1-cp1-consumer-batch-id",
      hashParts: [
        `${createdAt}:total:${totalRequests}`,
        `complete:${completeCount}`,
        `partial:${partialCount}`,
        `degraded:${degradedCount}`,
      ],
    });

    return {
      batchId,
      batchHash,
      createdAt,
      totalRequests,
      completeCount,
      partialCount,
      degradedCount,
      frozenCount,
      totalChunksRetrieved,
      dominantStatus,
      receipts,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createConsumerBatchContract(
  dependencies?: ConsumerBatchContractDependencies,
): ConsumerBatchContract {
  return new ConsumerBatchContract(dependencies);
}
