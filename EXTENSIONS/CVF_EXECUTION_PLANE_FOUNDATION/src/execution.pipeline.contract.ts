import type { ExecutionBridgeReceipt } from "./execution.bridge.consumer.contract";
import { CommandRuntimeContract, createCommandRuntimeContract } from "./command.runtime.contract";
import type { CommandRuntimeResult, CommandRuntimeContractDependencies } from "./command.runtime.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type ExecutionPipelineStage =
  | "BRIDGE_INGESTED"
  | "GATE_EXTRACTED"
  | "RUNTIME_EXECUTED"
  | "PIPELINE_RECEIPT_ISSUED";

export interface ExecutionPipelineStageEntry {
  stage: ExecutionPipelineStage;
  completedAt: string;
  itemCount: number;
  notes?: string;
}

export interface ExecutionPipelineReceipt {
  pipelineReceiptId: string;
  createdAt: string;
  bridgeReceiptId: string;
  orchestrationId: string;
  gateId: string;
  runtimeId: string;
  commandRuntimeResult: CommandRuntimeResult;
  totalEntries: number;
  executedCount: number;
  sandboxedCount: number;
  skippedCount: number;
  failedCount: number;
  pipelineStages: ExecutionPipelineStageEntry[];
  pipelineHash: string;
  warnings: string[];
}

export interface ExecutionPipelineContractDependencies {
  commandRuntime?: CommandRuntimeContract;
  commandRuntimeDependencies?: CommandRuntimeContractDependencies;
  now?: () => string;
}

// --- Contract ---

export class ExecutionPipelineContract {
  private readonly commandRuntime: CommandRuntimeContract;
  private readonly now: () => string;

  constructor(dependencies: ExecutionPipelineContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.commandRuntime = dependencies.commandRuntime
      ?? createCommandRuntimeContract({
        ...dependencies.commandRuntimeDependencies,
        now: this.now,
      });
  }

  run(bridgeReceipt: ExecutionBridgeReceipt): ExecutionPipelineReceipt {
    const createdAt = this.now();
    const stages: ExecutionPipelineStageEntry[] = [];

    // Stage 1: Ingest bridge receipt
    stages.push({
      stage: "BRIDGE_INGESTED",
      completedAt: createdAt,
      itemCount: 1,
      notes: `Bridge receipt ${bridgeReceipt.bridgeReceiptId} ingested (orchestration: ${bridgeReceipt.orchestrationId})`,
    });

    // Stage 2: Extract policy gate result
    const { policyGateResult } = bridgeReceipt;
    stages.push({
      stage: "GATE_EXTRACTED",
      completedAt: createdAt,
      itemCount: policyGateResult.entries.length,
      notes: `${policyGateResult.entries.length} gate entry(s) extracted — ${policyGateResult.allowedCount} allowed, ${policyGateResult.deniedCount} denied, ${policyGateResult.sandboxedCount} sandboxed`,
    });

    // Stage 3: Execute via command runtime
    const commandRuntimeResult = this.commandRuntime.execute(policyGateResult);
    stages.push({
      stage: "RUNTIME_EXECUTED",
      completedAt: createdAt,
      itemCount: commandRuntimeResult.records.length,
      notes: `${commandRuntimeResult.executedCount} executed, ${commandRuntimeResult.sandboxedCount} delegated to sandbox, ${commandRuntimeResult.skippedCount} skipped, ${commandRuntimeResult.failedCount} failed`,
    });

    // Aggregate warnings
    const warnings: string[] = [
      ...bridgeReceipt.warnings.map((w) => `[bridge] ${w}`),
    ];

    if (commandRuntimeResult.failedCount > 0) {
      warnings.push(`[runtime] ${commandRuntimeResult.failedCount} execution(s) failed — review runtime records for details.`);
    }

    if (commandRuntimeResult.skippedCount > 0) {
      warnings.push(`[runtime] ${commandRuntimeResult.skippedCount} entry(s) skipped by policy gate — denied, review required, or pending.`);
    }

    // Compute cross-plane pipeline hash (INTAKE → DESIGN → BOARDROOM → ORCHESTRATION → DISPATCH → POLICY GATE → EXECUTION)
    const pipelineHash = computeDeterministicHash(
      "w2-t3-cp2-execution-pipeline",
      `${createdAt}:${bridgeReceipt.bridgeReceiptId}`,
      `gate:${policyGateResult.gateId}`,
      `runtime:${commandRuntimeResult.runtimeId}`,
      `executed:${commandRuntimeResult.executedCount}:sandboxed:${commandRuntimeResult.sandboxedCount}`,
    );

    const pipelineReceiptId = computeDeterministicHash(
      "w2-t3-cp2-pipeline-receipt-id",
      pipelineHash,
      createdAt,
    );

    stages.push({
      stage: "PIPELINE_RECEIPT_ISSUED",
      completedAt: createdAt,
      itemCount: 1,
      notes: `Pipeline receipt ${pipelineReceiptId} issued — full INTAKE→DESIGN→BOARDROOM→ORCHESTRATION→DISPATCH→POLICY-GATE→EXECUTION path provable`,
    });

    return {
      pipelineReceiptId,
      createdAt,
      bridgeReceiptId: bridgeReceipt.bridgeReceiptId,
      orchestrationId: bridgeReceipt.orchestrationId,
      gateId: policyGateResult.gateId,
      runtimeId: commandRuntimeResult.runtimeId,
      commandRuntimeResult,
      totalEntries: commandRuntimeResult.records.length,
      executedCount: commandRuntimeResult.executedCount,
      sandboxedCount: commandRuntimeResult.sandboxedCount,
      skippedCount: commandRuntimeResult.skippedCount,
      failedCount: commandRuntimeResult.failedCount,
      pipelineStages: stages,
      pipelineHash,
      warnings,
    };
  }
}

export function createExecutionPipelineContract(
  dependencies?: ExecutionPipelineContractDependencies,
): ExecutionPipelineContract {
  return new ExecutionPipelineContract(dependencies);
}
