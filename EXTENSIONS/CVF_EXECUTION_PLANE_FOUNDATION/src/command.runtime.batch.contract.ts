import { CommandRuntimeContract } from "./command.runtime.contract";
import type { CommandRuntimeResult, CommandRuntimeContractDependencies } from "./command.runtime.contract";
import type { PolicyGateResult } from "./policy.gate.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type CommandRuntimeBatchStatus =
  | "FULLY_EXECUTED"
  | "PARTIALLY_EXECUTED"
  | "FULLY_BLOCKED"
  | "NONE";

export interface CommandRuntimeBatchInput {
  policyGateResult: PolicyGateResult;
}

export interface CommandRuntimeBatchResult {
  batchId: string;
  batchHash: string;
  processedAt: string;
  results: CommandRuntimeResult[];
  totalExecuted: number;
  totalSandboxed: number;
  totalSkipped: number;
  totalFailed: number;
  totalRecords: number;
  warnedCount: number;
  dominantStatus: CommandRuntimeBatchStatus;
}

export interface CommandRuntimeBatchContractDependencies {
  commandRuntime?: CommandRuntimeContractDependencies;
  now?: () => string;
}

// --- Contract ---

export class CommandRuntimeBatchContract {
  private readonly commandRuntime: CommandRuntimeContract;
  private readonly now: () => string;

  constructor(dependencies: CommandRuntimeBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.commandRuntime = new CommandRuntimeContract({
      ...(dependencies.commandRuntime ?? {}),
      now: dependencies.commandRuntime?.now ?? this.now,
    });
  }

  batch(inputs: CommandRuntimeBatchInput[]): CommandRuntimeBatchResult {
    const processedAt = this.now();

    if (inputs.length === 0) {
      const batchHash = computeDeterministicHash(
        "w51-t1-cp1-command-runtime-batch",
        processedAt,
        "empty",
      );
      const batchId = computeDeterministicHash(
        "w51-t1-cp1-command-runtime-batch-id",
        batchHash,
      );
      return {
        batchId,
        batchHash,
        processedAt,
        results: [],
        totalExecuted: 0,
        totalSandboxed: 0,
        totalSkipped: 0,
        totalFailed: 0,
        totalRecords: 0,
        warnedCount: 0,
        dominantStatus: "NONE",
      };
    }

    const results: CommandRuntimeResult[] = inputs.map((input) =>
      this.commandRuntime.execute(input.policyGateResult),
    );

    const totalExecuted = results.reduce((sum, r) => sum + r.executedCount, 0);
    const totalSandboxed = results.reduce((sum, r) => sum + r.sandboxedCount, 0);
    const totalSkipped = results.reduce((sum, r) => sum + r.skippedCount, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.failedCount, 0);
    const totalRecords = results.reduce((sum, r) => sum + r.records.length, 0);
    const warnedCount = results.filter((r) => r.failedCount > 0).length;

    const dominantStatus = resolveDominantStatus(
      totalExecuted,
      totalSandboxed,
      totalSkipped,
      totalFailed,
    );

    const batchHash = computeDeterministicHash(
      "w51-t1-cp1-command-runtime-batch",
      processedAt,
      `executed:${totalExecuted}:sandboxed:${totalSandboxed}:skipped:${totalSkipped}:failed:${totalFailed}`,
      results.map((r) => r.runtimeId).join(":"),
    );

    const batchId = computeDeterministicHash(
      "w51-t1-cp1-command-runtime-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      processedAt,
      results,
      totalExecuted,
      totalSandboxed,
      totalSkipped,
      totalFailed,
      totalRecords,
      warnedCount,
      dominantStatus,
    };
  }
}

function resolveDominantStatus(
  totalExecuted: number,
  totalSandboxed: number,
  totalSkipped: number,
  totalFailed: number,
): CommandRuntimeBatchStatus {
  if (totalExecuted === 0) {
    return "FULLY_BLOCKED";
  }
  if (totalSandboxed === 0 && totalSkipped === 0 && totalFailed === 0) {
    return "FULLY_EXECUTED";
  }
  return "PARTIALLY_EXECUTED";
}

export function createCommandRuntimeBatchContract(
  dependencies?: CommandRuntimeBatchContractDependencies,
): CommandRuntimeBatchContract {
  return new CommandRuntimeBatchContract(dependencies);
}
