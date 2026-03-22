import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Cross-plane-independent input interfaces ---
// These mirror the relevant fields from LearningObservabilitySnapshot (W4-T7)
// and AsyncExecutionStatusSummary (W2-T7) without importing from those packages.

export interface WatchdogObservabilityInput {
  snapshotId: string;
  dominantHealth: "HEALTHY" | "DEGRADED" | "CRITICAL" | "UNKNOWN";
  criticalCount: number;
  degradedCount: number;
}

export interface WatchdogExecutionInput {
  summaryId: string;
  dominantStatus: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  failedCount: number;
  runningCount: number;
}

// --- Types ---

export type WatchdogStatus = "NOMINAL" | "WARNING" | "CRITICAL" | "UNKNOWN";

export interface WatchdogPulse {
  pulseId: string;
  issuedAt: string;
  sourceObservabilitySnapshotId: string;
  sourceExecutionSummaryId: string;
  watchdogStatus: WatchdogStatus;
  statusRationale: string;
  pulseHash: string;
}

export interface WatchdogPulseContractDependencies {
  now?: () => string;
}

// --- Status Derivation ---
// CRITICAL: observability CRITICAL OR execution FAILED
// WARNING: observability DEGRADED OR execution RUNNING (and not already CRITICAL)
// UNKNOWN: both inputs have empty/unknown signals
// NOMINAL: otherwise (HEALTHY + COMPLETED or PENDING)

function deriveStatus(
  obs: WatchdogObservabilityInput,
  exec: WatchdogExecutionInput,
): WatchdogStatus {
  const isObsEmpty = obs.criticalCount === 0 && obs.degradedCount === 0 && obs.dominantHealth === "UNKNOWN";
  const isExecEmpty = exec.failedCount === 0 && exec.runningCount === 0 && exec.dominantStatus === "COMPLETED";

  if (obs.dominantHealth === "CRITICAL" || exec.dominantStatus === "FAILED") return "CRITICAL";
  if (obs.dominantHealth === "DEGRADED" || exec.dominantStatus === "RUNNING") return "WARNING";
  if (isObsEmpty && isExecEmpty) return "UNKNOWN";
  return "NOMINAL";
}

function buildRationale(
  status: WatchdogStatus,
  obs: WatchdogObservabilityInput,
  exec: WatchdogExecutionInput,
): string {
  return (
    `Watchdog status=${status}. ` +
    `Observability: dominantHealth=${obs.dominantHealth}, critical=${obs.criticalCount}, degraded=${obs.degradedCount}. ` +
    `Execution: dominantStatus=${exec.dominantStatus}, failed=${exec.failedCount}, running=${exec.runningCount}.`
  );
}

// --- Contract ---

export class WatchdogPulseContract {
  private readonly now: () => string;

  constructor(dependencies: WatchdogPulseContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  pulse(
    observabilityInput: WatchdogObservabilityInput,
    executionInput: WatchdogExecutionInput,
  ): WatchdogPulse {
    const issuedAt = this.now();
    const watchdogStatus = deriveStatus(observabilityInput, executionInput);
    const statusRationale = buildRationale(watchdogStatus, observabilityInput, executionInput);

    const pulseHash = computeDeterministicHash(
      "w3-t2-cp1-watchdog-pulse",
      `${issuedAt}:obsHealth=${observabilityInput.dominantHealth}:execStatus=${executionInput.dominantStatus}`,
      `status:${watchdogStatus}`,
      `obsId:${observabilityInput.snapshotId}:execId:${executionInput.summaryId}`,
    );

    const pulseId = computeDeterministicHash(
      "w3-t2-cp1-pulse-id",
      pulseHash,
      issuedAt,
    );

    return {
      pulseId,
      issuedAt,
      sourceObservabilitySnapshotId: observabilityInput.snapshotId,
      sourceExecutionSummaryId: executionInput.summaryId,
      watchdogStatus,
      statusRationale,
      pulseHash,
    };
  }
}

export function createWatchdogPulseContract(
  dependencies?: WatchdogPulseContractDependencies,
): WatchdogPulseContract {
  return new WatchdogPulseContract(dependencies);
}
