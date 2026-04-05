import type { DesignConsumptionReceipt } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/design.consumer.contract";
import { DispatchContract, createDispatchContract } from "./dispatch.contract";
import type { DispatchResult } from "./dispatch.contract";
import { PolicyGateContract, createPolicyGateContract } from "./policy.gate.contract";
import type { PolicyGateResult } from "./policy.gate.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type ExecutionBridgePipelineStage =
  | "DESIGN_RECEIPT_INGESTED"
  | "ORCHESTRATION_EXTRACTED"
  | "DISPATCH_EVALUATED"
  | "POLICY_GATE_APPLIED"
  | "BRIDGE_RECEIPT_ISSUED";

export interface ExecutionBridgePipelineStageEntry {
  stage: ExecutionBridgePipelineStage;
  completedAt: string;
  itemCount: number;
  notes?: string;
}

export interface ExecutionBridgeReceipt {
  bridgeReceiptId: string;
  createdAt: string;
  consumerId?: string;
  designReceiptId: string;
  orchestrationId: string;
  dispatchResult: DispatchResult;
  policyGateResult: PolicyGateResult;
  totalAssignments: number;
  authorizedForExecution: number;
  requiresReview: number;
  sandboxed: number;
  blockedFromExecution: number;
  pipelineStages: ExecutionBridgePipelineStageEntry[];
  bridgeHash: string;
  warnings: string[];
}

export interface ExecutionBridgeConsumerContractDependencies {
  dispatch?: DispatchContract;
  policyGate?: PolicyGateContract;
  now?: () => string;
}

// --- Contract ---

export class ExecutionBridgeConsumerContract {
  private readonly dispatch: DispatchContract;
  private readonly policyGate: PolicyGateContract;
  private readonly now: () => string;

  constructor(dependencies: ExecutionBridgeConsumerContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.dispatch = dependencies.dispatch ?? createDispatchContract({ now: this.now });
    this.policyGate = dependencies.policyGate ?? createPolicyGateContract({ now: this.now });
  }

  bridge(receipt: DesignConsumptionReceipt): ExecutionBridgeReceipt {
    const createdAt = this.now();
    const stages: ExecutionBridgePipelineStageEntry[] = [];

    // Stage 1: Ingest design receipt
    stages.push({
      stage: "DESIGN_RECEIPT_INGESTED",
      completedAt: createdAt,
      itemCount: 1,
      notes: `Design receipt ${receipt.receiptId} ingested`,
    });

    // Stage 2: Extract orchestration assignments
    const { orchestrationResult } = receipt;
    stages.push({
      stage: "ORCHESTRATION_EXTRACTED",
      completedAt: createdAt,
      itemCount: orchestrationResult.assignments.length,
      notes: `${orchestrationResult.assignments.length} assignment(s) extracted from orchestration ${orchestrationResult.orchestrationId}`,
    });

    // Stage 3: Dispatch through guard engine
    const dispatchResult = this.dispatch.dispatch(
      orchestrationResult.orchestrationId,
      orchestrationResult.assignments,
    );
    stages.push({
      stage: "DISPATCH_EVALUATED",
      completedAt: createdAt,
      itemCount: dispatchResult.totalDispatched,
      notes: `${dispatchResult.authorizedCount} authorized, ${dispatchResult.blockedCount} blocked, ${dispatchResult.escalatedCount} escalated`,
    });

    // Stage 4: Apply policy gate
    const policyGateResult = this.policyGate.evaluate(dispatchResult);
    stages.push({
      stage: "POLICY_GATE_APPLIED",
      completedAt: createdAt,
      itemCount: policyGateResult.entries.length,
      notes: `${policyGateResult.allowedCount} allowed, ${policyGateResult.deniedCount} denied, ${policyGateResult.reviewRequiredCount} require review, ${policyGateResult.sandboxedCount} sandboxed`,
    });

    // Aggregate warnings
    const warnings = [
      ...receipt.warnings.map((w) => `[design] ${w}`),
      ...dispatchResult.warnings.map((w) => `[dispatch] ${w}`),
    ];

    if (policyGateResult.deniedCount > 0) {
      warnings.push(`[policy-gate] ${policyGateResult.deniedCount} assignment(s) denied — review dispatch result before retry.`);
    }

    if (policyGateResult.sandboxedCount > 0) {
      warnings.push(`[policy-gate] ${policyGateResult.sandboxedCount} R3 assignment(s) sandboxed — full governance review required.`);
    }

    // Stage 5: Issue bridge receipt
    const bridgeHash = computeDeterministicHash(
      "w2-t2-cp3-execution-bridge",
      `${createdAt}:${receipt.receiptId}`,
      `dispatch:${dispatchResult.dispatchId}`,
      `gate:${policyGateResult.gateId}`,
      `allowed:${policyGateResult.allowedCount}:blocked:${policyGateResult.deniedCount}`,
    );

    const bridgeReceiptId = computeDeterministicHash(
      "w2-t2-cp3-bridge-receipt-id",
      bridgeHash,
      createdAt,
    );

    stages.push({
      stage: "BRIDGE_RECEIPT_ISSUED",
      completedAt: createdAt,
      itemCount: 1,
      notes: `Bridge receipt ${bridgeReceiptId} issued`,
    });

    return {
      bridgeReceiptId,
      createdAt,
      consumerId: receipt.consumerId,
      designReceiptId: receipt.receiptId,
      orchestrationId: orchestrationResult.orchestrationId,
      dispatchResult,
      policyGateResult,
      totalAssignments: orchestrationResult.assignments.length,
      authorizedForExecution: policyGateResult.allowedCount,
      requiresReview: policyGateResult.reviewRequiredCount,
      sandboxed: policyGateResult.sandboxedCount,
      blockedFromExecution: policyGateResult.deniedCount,
      pipelineStages: stages,
      bridgeHash,
      warnings,
    };
  }
}

export function createExecutionBridgeConsumerContract(
  dependencies?: ExecutionBridgeConsumerContractDependencies,
): ExecutionBridgeConsumerContract {
  return new ExecutionBridgeConsumerContract(dependencies);
}
