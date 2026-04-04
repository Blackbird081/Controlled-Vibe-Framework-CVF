import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  WatchdogPulseContract,
  createWatchdogPulseContract,
} from "./watchdog.pulse.contract";
import type {
  WatchdogObservabilityInput,
  WatchdogExecutionInput,
  WatchdogPulse,
} from "./watchdog.pulse.contract";
import {
  WatchdogAlertLogContract,
  createWatchdogAlertLogContract,
} from "./watchdog.alert.log.contract";
import type { WatchdogAlertLog } from "./watchdog.alert.log.contract";
import {
  WatchdogEscalationContract,
  createWatchdogEscalationContract,
} from "./watchdog.escalation.contract";
import type {
  WatchdogEscalationDecision,
  WatchdogEscalationAction,
  WatchdogEscalationPolicy,
} from "./watchdog.escalation.contract";
import {
  WatchdogEscalationLogContract,
  createWatchdogEscalationLogContract,
} from "./watchdog.escalation.log.contract";
import type { WatchdogEscalationLog } from "./watchdog.escalation.log.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WatchdogEscalationPipelineRequest {
  observabilityInput: WatchdogObservabilityInput;
  executionInput: WatchdogExecutionInput;
  policy?: WatchdogEscalationPolicy;
}

export interface WatchdogEscalationPipelineResult {
  resultId: string;
  createdAt: string;
  pulse: WatchdogPulse;
  alertLog: WatchdogAlertLog;
  escalationDecision: WatchdogEscalationDecision;
  escalationLog: WatchdogEscalationLog;
  escalationActive: boolean;
  dominantAction: WatchdogEscalationAction;
  pipelineHash: string;
}

export interface WatchdogEscalationPipelineContractDependencies {
  now?: () => string;
  policy?: WatchdogEscalationPolicy;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * WatchdogEscalationPipelineContract (W3-T5)
 * ------------------------------------------
 * End-to-end governed watchdog escalation pipeline.
 *
 * Internal chain (single execute call):
 *   WatchdogPulseContract.pulse(obs, exec)         → WatchdogPulse
 *   WatchdogAlertLogContract.log([pulse])           → WatchdogAlertLog
 *   WatchdogEscalationContract.evaluate(alertLog)  → WatchdogEscalationDecision
 *   WatchdogEscalationLogContract.log([decision])  → WatchdogEscalationLog
 *   → WatchdogEscalationPipelineResult
 *
 * Determinism: all sub-contracts share the same injected now().
 * Policy: per-request policy overrides the contract-level default.
 */
export class WatchdogEscalationPipelineContract {
  private readonly now: () => string;
  private readonly defaultPolicy: WatchdogEscalationPolicy | undefined;
  private readonly pulseContract: WatchdogPulseContract;
  private readonly alertLogContract: WatchdogAlertLogContract;
  private readonly escalationLogContract: WatchdogEscalationLogContract;

  constructor(
    dependencies: WatchdogEscalationPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.defaultPolicy = dependencies.policy;

    this.pulseContract = createWatchdogPulseContract({ now: this.now });
    this.alertLogContract = createWatchdogAlertLogContract({ now: this.now });
    this.escalationLogContract = createWatchdogEscalationLogContract({ now: this.now });
  }

  execute(
    request: WatchdogEscalationPipelineRequest,
  ): WatchdogEscalationPipelineResult {
    const createdAt = this.now();

    // Step 1: Generate watchdog pulse
    const pulse: WatchdogPulse = this.pulseContract.pulse(
      request.observabilityInput,
      request.executionInput,
    );

    // Step 2: Build alert log from single pulse
    const alertLog: WatchdogAlertLog = this.alertLogContract.log([pulse]);

    // Step 3: Evaluate escalation decision (per-request policy takes precedence)
    const effectivePolicy = request.policy ?? this.defaultPolicy;
    const escalationContract: WatchdogEscalationContract =
      createWatchdogEscalationContract({ now: this.now, policy: effectivePolicy });
    const escalationDecision: WatchdogEscalationDecision =
      escalationContract.evaluate(alertLog);

    // Step 4: Build escalation log from single decision
    const escalationLog: WatchdogEscalationLog = this.escalationLogContract.log([
      escalationDecision,
    ]);

    // Build deterministic hash
    const pipelineHash = computeDeterministicHash(
      "w3-t5-cp1-escalation-pipeline",
      pulse.pulseHash,
      alertLog.logHash,
      escalationDecision.decisionHash,
      escalationLog.logHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w3-t5-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      pulse,
      alertLog,
      escalationDecision,
      escalationLog,
      escalationActive: escalationLog.escalationActive,
      dominantAction: escalationLog.dominantAction,
      pipelineHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createWatchdogEscalationPipelineContract(
  dependencies?: WatchdogEscalationPipelineContractDependencies,
): WatchdogEscalationPipelineContract {
  return new WatchdogEscalationPipelineContract(dependencies);
}
