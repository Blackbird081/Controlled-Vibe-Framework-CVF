import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { DesignConsumptionReceipt } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/design.consumer.contract";
import {
  ExecutionBridgeConsumerContract,
  createExecutionBridgeConsumerContract,
} from "./execution.bridge.consumer.contract";
import type {
  ExecutionBridgeReceipt,
  ExecutionBridgeConsumerContractDependencies,
} from "./execution.bridge.consumer.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ExecutionBridgeBatchStatus =
  | "FULLY_AUTHORIZED"
  | "PARTIALLY_AUTHORIZED"
  | "BLOCKED";

export interface ExecutionBridgeConsumptionBatchResult {
  batchHash: string;
  batchId: string;
  createdAt: string;
  totalRequests: number;
  receipts: ExecutionBridgeReceipt[];
  dominantStatus: ExecutionBridgeBatchStatus | "NONE";
  fullyAuthorizedCount: number;
  partiallyAuthorizedCount: number;
  blockedCount: number;
  warnedCount: number;
  totalAssignments: number;
  totalAuthorizedForExecution: number;
}

export interface ExecutionBridgeConsumerBatchContractDependencies {
  contractDependencies?: ExecutionBridgeConsumerContractDependencies;
  now?: () => string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function classifyReceipt(receipt: ExecutionBridgeReceipt): ExecutionBridgeBatchStatus {
  const { allowedCount, deniedCount, sandboxedCount } = receipt.policyGateResult;
  if (allowedCount === 0) return "BLOCKED";
  if (deniedCount > 0 || sandboxedCount > 0) return "PARTIALLY_AUTHORIZED";
  return "FULLY_AUTHORIZED";
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * ExecutionBridgeConsumerBatchContract (W48-T1 CP1 — Full Lane GC-019)
 * ----------------------------------------------------------------------
 * Batches multiple DesignConsumptionReceipts through
 * ExecutionBridgeConsumerContract.bridge() into a governed batch summary.
 *
 * Fields:
 *   totalRequests              = count of design receipts in the batch
 *   fullyAuthorizedCount       = count where allowedCount > 0 and deniedCount = 0 and sandboxedCount = 0
 *   partiallyAuthorizedCount   = count where allowedCount > 0 but deniedCount > 0 or sandboxedCount > 0
 *   blockedCount               = count where allowedCount = 0
 *   warnedCount                = count of bridge receipts with warnings.length > 0
 *   totalAssignments           = sum(totalAssignments) across all bridge receipts
 *   totalAuthorizedForExecution = sum(authorizedForExecution) across all bridge receipts
 *   dominantStatus             = BLOCKED > PARTIALLY_AUTHORIZED > FULLY_AUTHORIZED; "NONE" for empty batch
 *   batchHash                  = deterministic hash of batch state
 *   batchId                    = distinct hash derived from batchHash
 *   receipts                   = ExecutionBridgeReceipt[] in input order
 */
export class ExecutionBridgeConsumerBatchContract {
  private readonly contract: ExecutionBridgeConsumerContract;
  private readonly now: () => string;

  constructor(
    dependencies: ExecutionBridgeConsumerBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.contract = createExecutionBridgeConsumerContract({
      ...(dependencies.contractDependencies ?? {}),
      now: dependencies.contractDependencies?.now ?? this.now,
    });
  }

  batch(
    designReceipts: DesignConsumptionReceipt[],
  ): ExecutionBridgeConsumptionBatchResult {
    const createdAt = this.now();
    const receipts: ExecutionBridgeReceipt[] = designReceipts.map((r) =>
      this.contract.bridge(r),
    );

    const totalRequests = receipts.length;
    let fullyAuthorizedCount = 0;
    let partiallyAuthorizedCount = 0;
    let blockedCount = 0;
    let warnedCount = 0;
    let totalAssignments = 0;
    let totalAuthorizedForExecution = 0;

    for (const receipt of receipts) {
      const status = classifyReceipt(receipt);
      if (status === "FULLY_AUTHORIZED") fullyAuthorizedCount++;
      else if (status === "PARTIALLY_AUTHORIZED") partiallyAuthorizedCount++;
      else blockedCount++;

      if (receipt.warnings.length > 0) warnedCount++;
      totalAssignments += receipt.totalAssignments;
      totalAuthorizedForExecution += receipt.authorizedForExecution;
    }

    const dominantStatus: ExecutionBridgeBatchStatus | "NONE" =
      totalRequests === 0
        ? "NONE"
        : blockedCount > 0
          ? "BLOCKED"
          : partiallyAuthorizedCount > 0
            ? "PARTIALLY_AUTHORIZED"
            : "FULLY_AUTHORIZED";

    const batchHash = computeDeterministicHash(
      "w48-t1-cp1-execution-bridge-consumer-batch",
      `${createdAt}:total:${totalRequests}`,
      `fullyAuthorized:${fullyAuthorizedCount}`,
      `partiallyAuthorized:${partiallyAuthorizedCount}`,
      `blocked:${blockedCount}`,
    );

    const batchId = computeDeterministicHash(
      "w48-t1-cp1-execution-bridge-consumer-batch-id",
      batchHash,
    );

    return {
      batchHash,
      batchId,
      createdAt,
      totalRequests,
      receipts,
      dominantStatus,
      fullyAuthorizedCount,
      partiallyAuthorizedCount,
      blockedCount,
      warnedCount,
      totalAssignments,
      totalAuthorizedForExecution,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createExecutionBridgeConsumerBatchContract(
  dependencies?: ExecutionBridgeConsumerBatchContractDependencies,
): ExecutionBridgeConsumerBatchContract {
  return new ExecutionBridgeConsumerBatchContract(dependencies);
}
