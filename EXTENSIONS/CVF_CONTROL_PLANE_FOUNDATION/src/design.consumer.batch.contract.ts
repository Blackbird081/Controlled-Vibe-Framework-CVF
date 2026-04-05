import {
  DesignConsumerContract,
  type DesignConsumerContractDependencies,
  type DesignConsumptionReceipt,
} from "./design.consumer.contract";
import type { ControlPlaneIntakeResult } from "./intake.contract";
import { createDeterministicBatchIdentity } from "./batch.contract.shared";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DesignConsumptionBatchStatus = "COMPLETE" | "PARTIAL" | "DEGRADED";

export interface DesignConsumptionBatchResult {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalRequests: number;
  completedCount: number;
  partialCount: number;
  degradedCount: number;
  blockedCount: number;
  warnedCount: number;
  dominantStatus: DesignConsumptionBatchStatus | "NONE";
  receipts: DesignConsumptionReceipt[];
}

export interface DesignConsumerBatchContractDependencies {
  contractDependencies?: DesignConsumerContractDependencies;
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * DesignConsumerBatchContract (W46-T1 CP1 — Full Lane GC-019)
 * -------------------------------------------------------
 * Batches multiple ControlPlaneIntakeResults through DesignConsumerContract.consume()
 * into a governed batch summary.
 *
 * Fields:
 *   totalRequests  = count of intake results
 *   completedCount = receipts where !orchestrationBlocked
 *   partialCount   = receipts where orchestrationBlocked + decision === "AMEND_PLAN"
 *   degradedCount  = receipts where orchestrationBlocked + decision !== "AMEND_PLAN" (ESCALATE/REJECT)
 *   blockedCount   = receipts where orchestrationBlocked === true
 *   warnedCount    = receipts where warnings.length > 0
 *   dominantStatus = DEGRADED > PARTIAL > COMPLETE; "NONE" for empty batch
 *   batchHash      = deterministic hash of batch state
 *   batchId        = distinct hash derived from batchHash
 *   receipts       = DesignConsumptionReceipt[] in input order
 */
export class DesignConsumerBatchContract {
  private readonly contract: DesignConsumerContract;
  private readonly now: () => string;

  constructor(dependencies: DesignConsumerBatchContractDependencies = {}) {
    this.contract = new DesignConsumerContract(
      dependencies.contractDependencies ?? {},
    );
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(intakes: ControlPlaneIntakeResult[]): DesignConsumptionBatchResult {
    const createdAt = this.now();
    const receipts: DesignConsumptionReceipt[] = intakes.map((intake) =>
      this.contract.consume(intake),
    );

    const totalRequests = receipts.length;
    let completedCount = 0;
    let partialCount = 0;
    let degradedCount = 0;
    let blockedCount = 0;
    let warnedCount = 0;

    for (const receipt of receipts) {
      if (receipt.warnings.length > 0) {
        warnedCount++;
      }

      if (receipt.orchestrationBlocked) {
        blockedCount++;
        if (receipt.boardroomSession.decision.decision === "AMEND_PLAN") {
          partialCount++;
        } else {
          degradedCount++;
        }
      } else {
        completedCount++;
      }
    }

    const dominantStatus: DesignConsumptionBatchStatus | "NONE" =
      totalRequests === 0
        ? "NONE"
        : degradedCount > 0
          ? "DEGRADED"
          : partialCount > 0
            ? "PARTIAL"
            : "COMPLETE";

    const { batchHash, batchId } = createDeterministicBatchIdentity({
      batchSeed: "w46-t1-cp1-design-consumer-batch",
      batchIdSeed: "w46-t1-cp1-design-consumer-batch-id",
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
      blockedCount,
      warnedCount,
      dominantStatus,
      receipts,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createDesignConsumerBatchContract(
  dependencies?: DesignConsumerBatchContractDependencies,
): DesignConsumerBatchContract {
  return new DesignConsumerBatchContract(dependencies);
}
