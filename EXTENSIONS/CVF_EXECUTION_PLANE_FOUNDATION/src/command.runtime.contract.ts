import type { PolicyGateEntry, PolicyGateResult } from "./policy.gate.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type RuntimeExecutionStatus =
  | "EXECUTED"
  | "DELEGATED_TO_SANDBOX"
  | "SKIPPED_DENIED"
  | "SKIPPED_REVIEW_REQUIRED"
  | "SKIPPED_PENDING"
  | "EXECUTION_FAILED";

export interface RuntimeExecutionRecord {
  assignmentId: string;
  taskId: string;
  gateDecision: string;
  status: RuntimeExecutionStatus;
  executionHash: string;
  notes: string;
}

export interface CommandRuntimeResult {
  runtimeId: string;
  gateId: string;
  executedAt: string;
  records: RuntimeExecutionRecord[];
  executedCount: number;
  sandboxedCount: number;
  skippedCount: number;
  failedCount: number;
  runtimeHash: string;
  summary: string;
}

export interface CommandRuntimeContractDependencies {
  executeTask?: (entry: PolicyGateEntry, sandbox: boolean) => RuntimeExecutionRecord;
  now?: () => string;
}

// --- Default executor (deterministic stub) ---

function defaultExecuteTask(
  entry: PolicyGateEntry,
  sandbox: boolean,
): RuntimeExecutionRecord {
  const status: RuntimeExecutionStatus = sandbox
    ? "DELEGATED_TO_SANDBOX"
    : "EXECUTED";

  const executionHash = computeDeterministicHash(
    "w2-t3-cp1-default-executor",
    entry.assignmentId,
    entry.taskId,
    status,
  );

  return {
    assignmentId: entry.assignmentId,
    taskId: entry.taskId,
    gateDecision: entry.gateDecision,
    status,
    executionHash,
    notes: sandbox
      ? `Task delegated to sandbox execution — R3 risk level requires isolated environment.`
      : `Task executed via default stub executor.`,
  };
}

// --- Contract ---

export class CommandRuntimeContract {
  private readonly executeTask: (entry: PolicyGateEntry, sandbox: boolean) => RuntimeExecutionRecord;
  private readonly now: () => string;

  constructor(dependencies: CommandRuntimeContractDependencies = {}) {
    this.executeTask = dependencies.executeTask ?? defaultExecuteTask;
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  execute(policyGateResult: PolicyGateResult): CommandRuntimeResult {
    const executedAt = this.now();
    const records: RuntimeExecutionRecord[] = [];

    for (const entry of policyGateResult.entries) {
      switch (entry.gateDecision) {
        case "allow": {
          const record = this.executeTask(entry, false);
          records.push({ ...record, status: record.status === "EXECUTION_FAILED" ? "EXECUTION_FAILED" : "EXECUTED" });
          break;
        }
        case "sandbox": {
          const record = this.executeTask(entry, true);
          records.push({ ...record, status: record.status === "EXECUTION_FAILED" ? "EXECUTION_FAILED" : "DELEGATED_TO_SANDBOX" });
          break;
        }
        case "deny":
          records.push({
            assignmentId: entry.assignmentId,
            taskId: entry.taskId,
            gateDecision: entry.gateDecision,
            status: "SKIPPED_DENIED",
            executionHash: computeDeterministicHash(
              "w2-t3-cp1-skipped",
              entry.assignmentId,
              "SKIPPED_DENIED",
            ),
            notes: `Assignment denied at policy gate — ${entry.rationale}`,
          });
          break;
        case "review":
          records.push({
            assignmentId: entry.assignmentId,
            taskId: entry.taskId,
            gateDecision: entry.gateDecision,
            status: "SKIPPED_REVIEW_REQUIRED",
            executionHash: computeDeterministicHash(
              "w2-t3-cp1-skipped",
              entry.assignmentId,
              "SKIPPED_REVIEW_REQUIRED",
            ),
            notes: `Assignment requires human review before execution — ${entry.rationale}`,
          });
          break;
        case "pending":
          records.push({
            assignmentId: entry.assignmentId,
            taskId: entry.taskId,
            gateDecision: entry.gateDecision,
            status: "SKIPPED_PENDING",
            executionHash: computeDeterministicHash(
              "w2-t3-cp1-skipped",
              entry.assignmentId,
              "SKIPPED_PENDING",
            ),
            notes: `Assignment in pending state — awaiting gate clearance.`,
          });
          break;
        default:
          records.push({
            assignmentId: entry.assignmentId,
            taskId: entry.taskId,
            gateDecision: entry.gateDecision,
            status: "SKIPPED_PENDING",
            executionHash: computeDeterministicHash(
              "w2-t3-cp1-skipped",
              entry.assignmentId,
              "SKIPPED_PENDING_UNKNOWN",
            ),
            notes: `Assignment gate decision not recognized — treated as pending.`,
          });
      }
    }

    const executedCount = records.filter((r) => r.status === "EXECUTED").length;
    const sandboxedCount = records.filter((r) => r.status === "DELEGATED_TO_SANDBOX").length;
    const failedCount = records.filter((r) => r.status === "EXECUTION_FAILED").length;
    const skippedCount = records.filter((r) =>
      r.status === "SKIPPED_DENIED" ||
      r.status === "SKIPPED_REVIEW_REQUIRED" ||
      r.status === "SKIPPED_PENDING",
    ).length;

    const runtimeHash = computeDeterministicHash(
      "w2-t3-cp1-command-runtime",
      `${executedAt}:${policyGateResult.gateId}`,
      `executed:${executedCount}:sandboxed:${sandboxedCount}:skipped:${skippedCount}:failed:${failedCount}`,
      records.map((r) => `${r.assignmentId}:${r.status}`).join(":"),
    );

    const runtimeId = computeDeterministicHash(
      "w2-t3-cp1-runtime-id",
      runtimeHash,
      executedAt,
    );

    return {
      runtimeId,
      gateId: policyGateResult.gateId,
      executedAt,
      records,
      executedCount,
      sandboxedCount,
      skippedCount,
      failedCount,
      runtimeHash,
      summary: buildSummary(executedCount, sandboxedCount, skippedCount, failedCount, records.length),
    };
  }
}

function buildSummary(
  executed: number,
  sandboxed: number,
  skipped: number,
  failed: number,
  total: number,
): string {
  if (total === 0) return "Command runtime processed zero entries.";
  const parts: string[] = [];
  if (executed > 0) parts.push(`${executed} executed`);
  if (sandboxed > 0) parts.push(`${sandboxed} delegated to sandbox`);
  if (skipped > 0) parts.push(`${skipped} skipped`);
  if (failed > 0) parts.push(`${failed} failed`);
  return `Command runtime result: ${parts.join(", ")}.`;
}

export function createCommandRuntimeContract(
  dependencies?: CommandRuntimeContractDependencies,
): CommandRuntimeContract {
  return new CommandRuntimeContract(dependencies);
}
