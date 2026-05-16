export type ObservabilitySignalCategory =
  | "session"
  | "token_context"
  | "rate_limit"
  | "process_port";

export type ObservabilitySeverity =
  | "NORMAL"
  | "NOTICE"
  | "WARNING"
  | "HIGH"
  | "CRITICAL";

export type ObservabilityRecommendedAction =
  | "none"
  | "alert"
  | "recommend_context_freeze"
  | "recommend_session_handoff"
  | "recommend_new_controlled_session"
  | "recommend_escalation"
  | "notify_governance";

export type ObserveOnlyAction =
  | "observe"
  | "summarize"
  | "alert"
  | "emit_receipt"
  | "recommend_escalation";

export type ForbiddenInterventionAction =
  | "approve"
  | "kill_process"
  | "close_port"
  | "reroute_provider"
  | "change_policy"
  | "truncate_context"
  | "inject_prompt"
  | "delete_audit";

export type ProposedObservabilityAction =
  | ObserveOnlyAction
  | ForbiddenInterventionAction;

export type TokenMeasurementSource =
  | "runtime_counter"
  | "provider_usage"
  | "billing_meter"
  | "agent_self_report"
  | "manual_without_source";

export interface TokenContextMeasurement {
  readonly sessionId: string;
  readonly provider: string;
  readonly model: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly contextWindowSize: number;
  readonly source: TokenMeasurementSource;
}

export type RateLimitState =
  | "normal"
  | "provider_warning"
  | "repeated_throttle"
  | "quota_exhausted";

export interface RateLimitMeasurement {
  readonly sessionId: string;
  readonly provider: string;
  readonly state: RateLimitState;
  readonly occurrenceCount?: number;
}

export interface ProcessPortMeasurement {
  readonly sessionId: string;
  readonly processId?: number;
  readonly port?: number;
  readonly knownProcess: boolean;
  readonly orphanProcess: boolean;
  readonly exposure: "local" | "external";
}

export interface ObservabilitySignal {
  readonly id: string;
  readonly category: ObservabilitySignalCategory;
  readonly severity: ObservabilitySeverity;
  readonly reason: string;
  readonly recommendedAction: ObservabilityRecommendedAction;
  readonly receiptRequired: boolean;
  readonly verifiedSource: boolean;
  readonly observeOnly: true;
  readonly evidence: Record<string, string | number | boolean>;
}

export interface ObservabilityReceipt {
  readonly receiptId: string;
  readonly signalId: string;
  readonly category: ObservabilitySignalCategory;
  readonly severity: ObservabilitySeverity;
  readonly observed: true;
  readonly recommendedAction: ObservabilityRecommendedAction;
  readonly allowedActions: readonly ObserveOnlyAction[];
  readonly blockedInterventions: readonly ForbiddenInterventionAction[];
  readonly evidence: Record<string, string | number | boolean>;
}

export interface ObservabilityActionDecision {
  readonly action: ProposedObservabilityAction;
  readonly allowed: boolean;
  readonly reason: string;
}

const TRUSTED_TOKEN_SOURCES: readonly TokenMeasurementSource[] = [
  "runtime_counter",
  "provider_usage",
  "billing_meter",
];

export const OBSERVABILITY_ALLOWED_ACTIONS: readonly ObserveOnlyAction[] = [
  "observe",
  "summarize",
  "alert",
  "emit_receipt",
  "recommend_escalation",
];

export const OBSERVABILITY_FORBIDDEN_INTERVENTIONS: readonly ForbiddenInterventionAction[] = [
  "approve",
  "kill_process",
  "close_port",
  "reroute_provider",
  "change_policy",
  "truncate_context",
  "inject_prompt",
  "delete_audit",
];

export function measureTokenContext(
  measurement: TokenContextMeasurement,
): ObservabilitySignal {
  const totalTokens = measurement.inputTokens + measurement.outputTokens;
  const usagePercent = percentage(totalTokens, measurement.contextWindowSize);
  const sourceVerified = TRUSTED_TOKEN_SOURCES.includes(measurement.source);
  const measuredSeverity = severityForContextUsage(usagePercent);
  const severity = sourceVerified
    ? measuredSeverity
    : maxSeverity(measuredSeverity, "WARNING");

  return buildSignal({
    category: "token_context",
    sessionId: measurement.sessionId,
    severity,
    reason: sourceVerified
      ? `context usage ${usagePercent}% from verified ${measurement.source}`
      : `token measurement source ${measurement.source} is not trusted`,
    recommendedAction: tokenRecommendedAction(severity),
    verifiedSource: sourceVerified,
    evidence: {
      provider: measurement.provider,
      model: measurement.model,
      inputTokens: measurement.inputTokens,
      outputTokens: measurement.outputTokens,
      totalTokens,
      contextWindowSize: measurement.contextWindowSize,
      usagePercent,
      source: measurement.source,
    },
  });
}

export function watchRateLimit(
  measurement: RateLimitMeasurement,
): ObservabilitySignal {
  const severity = severityForRateLimit(measurement.state);

  return buildSignal({
    category: "rate_limit",
    sessionId: measurement.sessionId,
    severity,
    reason: `rate-limit state ${measurement.state}`,
    recommendedAction: rateLimitRecommendedAction(severity),
    verifiedSource: true,
    evidence: {
      provider: measurement.provider,
      state: measurement.state,
      occurrenceCount: measurement.occurrenceCount ?? 1,
    },
  });
}

export function watchProcessPort(
  measurement: ProcessPortMeasurement,
): ObservabilitySignal {
  const severity = severityForProcessPort(measurement);

  return buildSignal({
    category: "process_port",
    sessionId: measurement.sessionId,
    severity,
    reason: processPortReason(measurement, severity),
    recommendedAction: processPortRecommendedAction(severity),
    verifiedSource: true,
    evidence: {
      processId: measurement.processId ?? "unknown",
      port: measurement.port ?? "unknown",
      knownProcess: measurement.knownProcess,
      orphanProcess: measurement.orphanProcess,
      exposure: measurement.exposure,
    },
  });
}

export function createObservabilityReceipt(
  signal: ObservabilitySignal,
): ObservabilityReceipt {
  return {
    receiptId: stableId("obs-receipt", signal.id),
    signalId: signal.id,
    category: signal.category,
    severity: signal.severity,
    observed: true,
    recommendedAction: signal.recommendedAction,
    allowedActions: OBSERVABILITY_ALLOWED_ACTIONS,
    blockedInterventions: OBSERVABILITY_FORBIDDEN_INTERVENTIONS,
    evidence: signal.evidence,
  };
}

export function validateProposedObservabilityAction(
  action: ProposedObservabilityAction,
): ObservabilityActionDecision {
  if (OBSERVABILITY_ALLOWED_ACTIONS.includes(action as ObserveOnlyAction)) {
    return {
      action,
      allowed: true,
      reason: "observability may only observe, summarize, alert, emit receipt, or recommend escalation",
    };
  }

  return {
    action,
    allowed: false,
    reason: `observability is observe-only and cannot ${action}`,
  };
}

function buildSignal(input: {
  readonly category: ObservabilitySignalCategory;
  readonly sessionId: string;
  readonly severity: ObservabilitySeverity;
  readonly reason: string;
  readonly recommendedAction: ObservabilityRecommendedAction;
  readonly verifiedSource: boolean;
  readonly evidence: Record<string, string | number | boolean>;
}): ObservabilitySignal {
  return {
    id: stableId("obs-signal", input.category, input.sessionId, input.severity, input.reason),
    category: input.category,
    severity: input.severity,
    reason: input.reason,
    recommendedAction: input.recommendedAction,
    receiptRequired: severityRank(input.severity) >= severityRank("HIGH"),
    verifiedSource: input.verifiedSource,
    observeOnly: true,
    evidence: input.evidence,
  };
}

function severityForContextUsage(usagePercent: number): ObservabilitySeverity {
  if (usagePercent >= 98) return "CRITICAL";
  if (usagePercent >= 90) return "HIGH";
  if (usagePercent >= 75) return "WARNING";
  if (usagePercent >= 60) return "NOTICE";
  return "NORMAL";
}

function severityForRateLimit(state: RateLimitState): ObservabilitySeverity {
  if (state === "quota_exhausted") return "CRITICAL";
  if (state === "repeated_throttle") return "HIGH";
  if (state === "provider_warning") return "WARNING";
  return "NORMAL";
}

function severityForProcessPort(measurement: ProcessPortMeasurement): ObservabilitySeverity {
  if (measurement.orphanProcess && measurement.exposure === "external") {
    return "CRITICAL";
  }
  if (measurement.orphanProcess) return "HIGH";
  if (!measurement.knownProcess || measurement.port === undefined) return "WARNING";
  return "NORMAL";
}

function tokenRecommendedAction(
  severity: ObservabilitySeverity,
): ObservabilityRecommendedAction {
  if (severity === "CRITICAL") return "recommend_new_controlled_session";
  if (severity === "HIGH") return "recommend_session_handoff";
  if (severity === "WARNING") return "recommend_context_freeze";
  return "none";
}

function rateLimitRecommendedAction(
  severity: ObservabilitySeverity,
): ObservabilityRecommendedAction {
  if (severity === "CRITICAL") return "notify_governance";
  if (severity === "HIGH") return "recommend_escalation";
  if (severity === "WARNING") return "alert";
  return "none";
}

function processPortRecommendedAction(
  severity: ObservabilitySeverity,
): ObservabilityRecommendedAction {
  if (severity === "CRITICAL") return "notify_governance";
  if (severity === "HIGH") return "recommend_escalation";
  if (severity === "WARNING") return "recommend_escalation";
  return "none";
}

function processPortReason(
  measurement: ProcessPortMeasurement,
  severity: ObservabilitySeverity,
): string {
  if (severity === "CRITICAL") return "orphan process has external exposure";
  if (measurement.orphanProcess) return "orphan process detected";
  if (!measurement.knownProcess) return "unknown process detected";
  if (measurement.port === undefined) return "unknown open port detected";
  return "known local process";
}

function percentage(numerator: number, denominator: number): number {
  if (denominator <= 0) return 100;
  return Math.round((numerator / denominator) * 100);
}

function maxSeverity(
  left: ObservabilitySeverity,
  right: ObservabilitySeverity,
): ObservabilitySeverity {
  return severityRank(left) >= severityRank(right) ? left : right;
}

function severityRank(severity: ObservabilitySeverity): number {
  const rank: Record<ObservabilitySeverity, number> = {
    NORMAL: 0,
    NOTICE: 1,
    WARNING: 2,
    HIGH: 3,
    CRITICAL: 4,
  };
  return rank[severity];
}

function stableId(prefix: string, ...parts: readonly string[]): string {
  return `${prefix}-${parts.join("-").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase()}`;
}
