import {
  computeGovernanceReliabilityReport,
  humanCorrectionCount,
  parseAuditJsonl,
  policyViolationRate,
  receiptIntegrityRate,
  retryCount,
  rollbackSuccessRate,
  taskCompletionRate,
  type AuditEvent,
  type MetricResult,
} from "./governance-reliability-metrics";

export type OperationalBenchmarkEvidenceMode = "live" | "offline" | "fixture" | "unknown";

export interface CountMetricResult {
  readonly count: number;
  readonly total: number;
}

export interface OperationalBenchmarkMetrics {
  readonly taskCompletionRate: MetricResult;
  readonly retryCount: CountMetricResult;
  readonly policyViolationRate: MetricResult;
  readonly humanCorrectionCount: CountMetricResult;
  readonly crossSessionContinuityRate: MetricResult;
  readonly longHorizonStabilityRate: MetricResult;
  readonly receiptIntegrityRate: MetricResult;
  readonly deterministicConsistencyRate: MetricResult;
  readonly rollbackSuccessRate: MetricResult;
}

export interface OperationalBenchmarkModeBreakdown {
  readonly evidenceMode: OperationalBenchmarkEvidenceMode;
  readonly eventCount: number;
  readonly taskCompletionRate: MetricResult;
  readonly policyViolationRate: MetricResult;
  readonly receiptIntegrityRate: MetricResult;
}

export interface OperationalBenchmarkLabelCount {
  readonly label: string;
  readonly count: number;
}

export type OperationalBenchmarkClarityStatus = "clear" | "needs_context" | "insufficient_evidence";

export interface OperationalBenchmarkScorecard {
  readonly callLevel: {
    readonly totalCalls: number;
    readonly successfulCalls: number;
    readonly failedCalls: number;
    readonly unknownCalls: number;
    readonly liveCalls: number;
    readonly receiptBackedCalls: number;
    readonly callPassRate: MetricResult;
  };
  readonly eventModel: {
    readonly totalEvents: number;
    readonly eventsPerCall: number | null;
    readonly taskCompletionRate: MetricResult;
    readonly receiptIntegrityRate: MetricResult;
    readonly denominatorNote: string;
  };
  readonly diagnostics: {
    readonly classCounts: readonly OperationalBenchmarkLabelCount[];
    readonly userActionCounts: readonly OperationalBenchmarkLabelCount[];
    readonly diagnosticBackedFailures: number;
    readonly failedCallsWithoutDiagnostic: number;
  };
  readonly advisorySignals: {
    readonly frictionSignals: readonly OperationalBenchmarkLabelCount[];
    readonly overconstraintSignals: readonly OperationalBenchmarkLabelCount[];
  };
  readonly clarityStatus: OperationalBenchmarkClarityStatus;
  readonly operatorSummary: string;
}

export interface DeferredOperationalMetric {
  readonly metric: "hallucinationRecovery";
  readonly status: "deferred";
  readonly replacementMetrics: readonly string[];
  readonly reason: string;
}

export interface OperationalBenchmarkReport {
  readonly schemaVersion: "cvf.operationalBenchmark.v1";
  readonly source: {
    readonly input?: string;
    readonly eventCount: number;
    readonly evidenceModes: readonly OperationalBenchmarkEvidenceMode[];
    readonly providerLanes: readonly string[];
    readonly modelLanes: readonly string[];
  };
  readonly metrics: OperationalBenchmarkMetrics;
  readonly evidenceModeBreakdown: readonly OperationalBenchmarkModeBreakdown[];
  readonly scorecard: OperationalBenchmarkScorecard;
  readonly deferredMetrics: readonly DeferredOperationalMetric[];
  readonly claimBoundary: string;
}

export function parseOperationalBenchmarkInput(content: string): AuditEvent[] {
  const trimmed = content.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return extractOperationalEvents(JSON.parse(trimmed));
    } catch {
      return parseAuditJsonl(content);
    }
  }
  return parseAuditJsonl(content);
}

export function buildOperationalBenchmarkReport(
  events: AuditEvent[],
  input?: string,
): OperationalBenchmarkReport {
  const reliability = computeGovernanceReliabilityReport(events);
  const scorecard = buildOperationalBenchmarkScorecard(events);
  const modes = uniqueSorted(events.map(readEvidenceMode));
  const providerLanes = uniqueSorted(events.map((event) => readString(event.provider)));
  const modelLanes = uniqueSorted(events.map((event) => readString(event.model)));

  return {
    schemaVersion: "cvf.operationalBenchmark.v1",
    source: {
      input,
      eventCount: events.length,
      evidenceModes: modes.length ? modes : ["unknown"],
      providerLanes,
      modelLanes,
    },
    metrics: {
      taskCompletionRate: reliability.taskCompletionRate,
      retryCount: { count: retryCount(events), total: events.length },
      policyViolationRate: reliability.policyViolationRate,
      humanCorrectionCount: { count: humanCorrectionCount(events), total: distinctExecutionTotal(events) },
      crossSessionContinuityRate: reliability.crossSessionContinuityRate,
      longHorizonStabilityRate: reliability.longHorizonStabilityRate,
      receiptIntegrityRate: reliability.receiptIntegrityRate,
      deterministicConsistencyRate: reliability.deterministicConsistencyRate,
      rollbackSuccessRate: reliability.rollbackSuccessRate,
    },
    evidenceModeBreakdown: buildEvidenceModeBreakdown(events),
    scorecard,
    deferredMetrics: [
      {
        metric: "hallucinationRecovery",
        status: "deferred",
        replacementMetrics: ["policyViolationRate", "humanCorrectionCount", "rollbackSuccessRate"],
        reason: "No bounded hallucination-recovery event contract exists in the current private baseline.",
      },
    ],
    claimBoundary: "Operational benchmark foundation only; report does not prove broad provider reliability or output quality.",
  };
}

export function formatOperationalBenchmarkReport(
  report: OperationalBenchmarkReport,
  format: "json" | "table",
): string {
  if (format === "json") {
    return JSON.stringify(report, null, 2);
  }
  return [
    "CVF Operational Governance Benchmark",
    "====================================",
    `schemaVersion: ${report.schemaVersion}`,
    `events: ${report.source.eventCount}`,
    `evidenceModes: ${report.source.evidenceModes.join(", ")}`,
    `providerLanes: ${report.source.providerLanes.join(", ") || "n/a"}`,
    `modelLanes: ${report.source.modelLanes.join(", ") || "n/a"}`,
    "",
    "scorecard",
    `callLevel ${report.scorecard.callLevel.successfulCalls}/${report.scorecard.callLevel.totalCalls} pass=${formatRate(report.scorecard.callLevel.callPassRate.rate)} live=${report.scorecard.callLevel.liveCalls} receiptBacked=${report.scorecard.callLevel.receiptBackedCalls}`,
    `eventModel events=${report.scorecard.eventModel.totalEvents} eventsPerCall=${formatNullableNumber(report.scorecard.eventModel.eventsPerCall)} task=${formatRate(report.scorecard.eventModel.taskCompletionRate.rate)} receipt=${formatRate(report.scorecard.eventModel.receiptIntegrityRate.rate)}`,
    `clarityStatus ${report.scorecard.clarityStatus}`,
    `operatorSummary ${report.scorecard.operatorSummary}`,
    `diagnosticClasses ${formatLabelCounts(report.scorecard.diagnostics.classCounts)}`,
    `userActions ${formatLabelCounts(report.scorecard.diagnostics.userActionCounts)}`,
    "",
    "metric value",
    `taskCompletionRate ${formatRate(report.metrics.taskCompletionRate.rate)}`,
    `retryCount ${report.metrics.retryCount.count}/${report.metrics.retryCount.total}`,
    `policyViolationRate ${formatRate(report.metrics.policyViolationRate.rate)}`,
    `humanCorrectionCount ${report.metrics.humanCorrectionCount.count}/${report.metrics.humanCorrectionCount.total}`,
    `crossSessionContinuityRate ${formatRate(report.metrics.crossSessionContinuityRate.rate)}`,
    `longHorizonStabilityRate ${formatRate(report.metrics.longHorizonStabilityRate.rate)}`,
    `receiptIntegrityRate ${formatRate(report.metrics.receiptIntegrityRate.rate)}`,
    `deterministicConsistencyRate ${formatRate(report.metrics.deterministicConsistencyRate.rate)}`,
    `rollbackSuccessRate ${formatRate(report.metrics.rollbackSuccessRate.rate)}`,
    "",
    "evidenceModeBreakdown",
    ...report.evidenceModeBreakdown.map((entry) => {
      return `${entry.evidenceMode}: events=${entry.eventCount} task=${formatRate(entry.taskCompletionRate.rate)} policy=${formatRate(entry.policyViolationRate.rate)} receipt=${formatRate(entry.receiptIntegrityRate.rate)}`;
    }),
    "",
    `deferred: hallucinationRecovery -> ${report.deferredMetrics[0]?.replacementMetrics.join(", ")}`,
    `claimBoundary: ${report.claimBoundary}`,
  ].join("\n");
}

export function buildOperationalBenchmarkScorecard(events: AuditEvent[]): OperationalBenchmarkScorecard {
  const callGroups = groupEventsByCall(events);
  const callSummaries = callGroups.map(summarizeCallGroup);
  const totalCalls = callSummaries.length;
  const successfulCalls = callSummaries.filter((call) => call.status === "success").length;
  const failedCalls = callSummaries.filter((call) => call.status === "failed").length;
  const unknownCalls = callSummaries.filter((call) => call.status === "unknown").length;
  const liveCalls = callSummaries.filter((call) => call.evidenceMode === "live").length;
  const receiptBackedCalls = callSummaries.filter((call) => call.hasReceipt).length;
  const diagnosticBackedFailures = callSummaries.filter((call) => call.status === "failed" && call.hasDiagnostic).length;
  const failedCallsWithoutDiagnostic = callSummaries.filter((call) => call.status === "failed" && !call.hasDiagnostic).length;
  const eventsPerCall = totalCalls === 0 ? null : Number((events.length / totalCalls).toFixed(3));
  const classCounts = countLabels(events.flatMap(readDiagnosticClasses));
  const userActionCounts = countLabels(events.flatMap(readDiagnosticUserActions));
  const frictionSignals = countLabels(events.flatMap(readFrictionSignals));
  const overconstraintSignals = countLabels(events.flatMap(readOverconstraintSignals));
  const clarityStatus = resolveClarityStatus({
    totalCalls,
    totalEvents: events.length,
    failedCalls,
    failedCallsWithoutDiagnostic,
    eventsPerCall,
  });

  return {
    callLevel: {
      totalCalls,
      successfulCalls,
      failedCalls,
      unknownCalls,
      liveCalls,
      receiptBackedCalls,
      callPassRate: ratio(successfulCalls, totalCalls),
    },
    eventModel: {
      totalEvents: events.length,
      eventsPerCall,
      taskCompletionRate: taskCompletionRate(events),
      receiptIntegrityRate: receiptIntegrityRate(events),
      denominatorNote: "Event-model rates use benchmark events as denominator and may differ from call-level pass rate.",
    },
    diagnostics: {
      classCounts,
      userActionCounts,
      diagnosticBackedFailures,
      failedCallsWithoutDiagnostic,
    },
    advisorySignals: {
      frictionSignals,
      overconstraintSignals,
    },
    clarityStatus,
    operatorSummary: buildOperatorSummary(successfulCalls, totalCalls, events.length, failedCallsWithoutDiagnostic, clarityStatus),
  };
}

function extractOperationalEvents(value: unknown): AuditEvent[] {
  if (Array.isArray(value)) {
    return value.flatMap(extractOperationalEvents);
  }
  if (!isRecord(value)) return [];

  const directContainers = ["events", "records", "auditEvents", "checks", "results"];
  const events = directContainers.flatMap((key) => extractOperationalEvents(value[key]));
  const receiptEvent = extractReceiptEvent(value);
  if (events.length > 0) {
    return receiptEvent ? [...events, receiptEvent] : events;
  }
  if (isAuditEventLike(value)) {
    return receiptEvent ? [normalizeOperationalEvent(value), receiptEvent] : [normalizeOperationalEvent(value)];
  }
  return receiptEvent ? [...events, receiptEvent] : events;
}

function normalizeOperationalEvent(value: Record<string, unknown>): AuditEvent {
  return {
    ...value,
    executionId: readString(value.executionId) ?? readString(value.traceId) ?? readString(value.runId),
    receiptId: readString(value.receiptId) ?? readString(value.governanceReceiptId),
    decision: normalizeDecision(value),
    evidenceMode: readEvidenceMode(value),
    provider: readString(value.provider),
    model: readString(value.model),
    enforcement: isRecord(value.enforcement) ? value.enforcement as AuditEvent["enforcement"] : value.enforcement === "allow"
      ? { status: "allow" }
      : undefined,
  };
}

function extractReceiptEvent(value: Record<string, unknown>): AuditEvent | null {
  const receipt = isRecord(value.governanceEvidenceReceipt)
    ? value.governanceEvidenceReceipt
    : isRecord(value.receipt)
      ? value.receipt
      : null;
  if (!receipt) return null;

  return {
    eventType: "receipt_emitted",
    executionId: readString(receipt.traceId) ?? readString(value.traceId),
    receiptId: readString(receipt.receiptId) ?? readString(value.receiptId),
    decision: "captured",
    evidenceMode: readEvidenceMode(value),
    provider: readString(receipt.provider) ?? readString(value.provider),
    model: readString(receipt.model) ?? readString(value.model),
    enforcement: { status: normalizeDecision(receipt) === "allow" ? "allow" : "deny" },
    timestamp: readString(value.timestamp) ?? readString(value.date),
  };
}

function buildEvidenceModeBreakdown(events: AuditEvent[]): OperationalBenchmarkModeBreakdown[] {
  const groups = new Map<OperationalBenchmarkEvidenceMode, AuditEvent[]>();
  events.forEach((event) => {
    const mode = readEvidenceMode(event);
    groups.set(mode, [...(groups.get(mode) ?? []), event]);
  });
  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([evidenceMode, group]) => ({
      evidenceMode,
      eventCount: group.length,
      taskCompletionRate: taskCompletionRate(group),
      policyViolationRate: policyViolationRate(group),
      receiptIntegrityRate: receiptIntegrityRate(group),
    }));
}

interface CallGroup {
  readonly key: string;
  readonly events: readonly AuditEvent[];
}

interface CallSummary {
  readonly status: "success" | "failed" | "unknown";
  readonly evidenceMode: OperationalBenchmarkEvidenceMode;
  readonly hasReceipt: boolean;
  readonly hasDiagnostic: boolean;
}

function groupEventsByCall(events: AuditEvent[]): CallGroup[] {
  const groups = new Map<string, AuditEvent[]>();
  events.forEach((event, index) => {
    const key = readString(event.executionId) ?? readString(event.runId) ?? `event:${index}`;
    groups.set(key, [...(groups.get(key) ?? []), event]);
  });
  return [...groups.entries()].map(([key, group]) => ({ key, events: group }));
}

function summarizeCallGroup(group: CallGroup): CallSummary {
  const hasSuccess = group.events.some(isSuccessfulEvent);
  const hasFailure = group.events.some(isFailedEvent);
  return {
    status: hasSuccess ? "success" : hasFailure ? "failed" : "unknown",
    evidenceMode: group.events.some((event) => readEvidenceMode(event) === "live") ? "live" : readEvidenceMode(group.events[0] ?? {}),
    hasReceipt: group.events.some((event) => Boolean(readString(event.receiptId))),
    hasDiagnostic: group.events.some(hasDiagnostic),
  };
}

function isSuccessfulEvent(event: AuditEvent): boolean {
  const record = event as Record<string, unknown>;
  const decision = readString(event.decision)?.toLowerCase();
  const status = readString(event.enforcement?.status)?.toLowerCase() ?? readString(record.status)?.toLowerCase();
  const success = record.success;
  return decision === "allow" || status === "allow" || status === "pass" || success === true;
}

function isFailedEvent(event: AuditEvent): boolean {
  const record = event as Record<string, unknown>;
  const decision = readString(event.decision)?.toLowerCase();
  const status = readString(event.enforcement?.status)?.toLowerCase() ?? readString(record.status)?.toLowerCase();
  const success = record.success;
  return decision === "deny"
    || decision === "missing"
    || status === "deny"
    || status === "blocked"
    || status === "fail"
    || status === "failed"
    || status === "error"
    || success === false;
}

function hasDiagnostic(event: AuditEvent): boolean {
  return readDiagnosticClasses(event).length > 0 || readDiagnosticUserActions(event).length > 0;
}

function readDiagnosticClasses(event: AuditEvent): string[] {
  const record = event as Record<string, unknown>;
  const diagnostic = isRecord(record.diagnostic) ? record.diagnostic : isRecord(record.executionDiagnostic) ? record.executionDiagnostic : null;
  return [
    readString(record.diagnosticClass),
    readString(record.errorClass),
    readString(record.class),
    diagnostic ? readString(diagnostic.class) : undefined,
  ].filter((value): value is string => Boolean(value));
}

function readDiagnosticUserActions(event: AuditEvent): string[] {
  const record = event as Record<string, unknown>;
  const diagnostic = isRecord(record.diagnostic) ? record.diagnostic : isRecord(record.executionDiagnostic) ? record.executionDiagnostic : null;
  return [
    readString(record.userAction),
    diagnostic ? readString(diagnostic.userAction) : undefined,
  ].filter((value): value is string => Boolean(value));
}

function readFrictionSignals(event: AuditEvent): string[] {
  const record = event as Record<string, unknown>;
  return [
    ...readStringArray(record.frictionSignals),
    ...readStringArray(record.auditFlags),
    readString(record.governanceFrictionSignal),
  ].filter((value): value is string => Boolean(value));
}

function readOverconstraintSignals(event: AuditEvent): string[] {
  const record = event as Record<string, unknown>;
  return [
    ...readStringArray(record.overconstraintSignals),
    readString(record.overconstraintSignal),
    record.overconstraintDetected === true ? "overconstraint_detected" : undefined,
    record.pathLockRisk === true ? "path_lock_risk" : undefined,
  ].filter((value): value is string => Boolean(value));
}

function countLabels(values: readonly string[]): OperationalBenchmarkLabelCount[] {
  const counts = new Map<string, number>();
  values.forEach((value) => {
    const label = value.trim();
    if (!label) return;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });
  return [...counts.entries()]
    .sort(([leftLabel, leftCount], [rightLabel, rightCount]) => rightCount - leftCount || leftLabel.localeCompare(rightLabel))
    .map(([label, count]) => ({ label, count }));
}

function resolveClarityStatus(input: {
  readonly totalCalls: number;
  readonly totalEvents: number;
  readonly failedCalls: number;
  readonly failedCallsWithoutDiagnostic: number;
  readonly eventsPerCall: number | null;
}): OperationalBenchmarkClarityStatus {
  if (input.totalCalls === 0 || input.totalEvents === 0) return "insufficient_evidence";
  if (input.failedCallsWithoutDiagnostic > 0) return "needs_context";
  if (input.eventsPerCall !== null && input.eventsPerCall > 1) return "needs_context";
  if (input.failedCalls > 0) return "needs_context";
  return "clear";
}

function buildOperatorSummary(
  successfulCalls: number,
  totalCalls: number,
  totalEvents: number,
  failedCallsWithoutDiagnostic: number,
  clarityStatus: OperationalBenchmarkClarityStatus,
): string {
  if (totalCalls === 0) return "No benchmark calls were found in the evidence input.";
  const diagnosticNote = failedCallsWithoutDiagnostic > 0
    ? `; ${failedCallsWithoutDiagnostic} failed call(s) need diagnostic classification`
    : "";
  const contextNote = clarityStatus === "needs_context"
    ? "; read event-model rates with the event denominator"
    : "";
  return `${successfulCalls}/${totalCalls} call(s) passed; event model contains ${totalEvents} event(s)${diagnosticNote}${contextNote}.`;
}

function isAuditEventLike(value: Record<string, unknown>): boolean {
  return Boolean(
    value.eventType
    || value.type
    || value.executionId
    || value.runId
    || value.receiptId
    || value.enforcement
    || value.decision
    || value.status
    || value.governanceEvidenceReceipt
    || value.receipt,
  );
}

function normalizeDecision(value: Record<string, unknown>): string | null {
  const raw = readString(value.decision) ?? readString(value.routingDecision) ?? readString(value.status);
  if (!raw) {
    if (value.success === true) return "allow";
    if (value.success === false) return "deny";
    return null;
  }
  const lower = raw.toLowerCase();
  if (lower === "allow" || lower === "allowed" || lower === "pass" || lower === "passed") return "allow";
  if (lower === "deny" || lower === "blocked" || lower === "fail" || lower === "failed") return "deny";
  if (lower === "captured") return "captured";
  return lower;
}

function readEvidenceMode(value: Record<string, unknown> | AuditEvent): OperationalBenchmarkEvidenceMode {
  const record = value as Record<string, unknown>;
  const raw = readString(record.evidenceMode) ?? readString(record.mode);
  if (raw === "live" || raw === "offline" || raw === "fixture") return raw;
  return "unknown";
}

function distinctExecutionTotal(events: AuditEvent[]): number {
  const keys = new Set(
    events
      .map((event) => readString(event.executionId) ?? readString(event.runId))
      .filter((value): value is string => Boolean(value)),
  );
  return keys.size || events.length;
}

function uniqueSorted<T extends string>(values: Array<T | undefined>): T[] {
  return [...new Set(values.filter((value): value is T => Boolean(value)))].sort();
}

function formatRate(rate: number | null): string {
  return rate === null ? "n/a" : rate.toFixed(3);
}

function formatNullableNumber(value: number | null): string {
  return value === null ? "n/a" : value.toFixed(3);
}

function formatLabelCounts(values: readonly OperationalBenchmarkLabelCount[]): string {
  return values.length ? values.map((value) => `${value.label}:${value.count}`).join(", ") : "none";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function ratio(count: number, total: number): MetricResult {
  return {
    rate: total === 0 ? 0 : count / total,
    count,
    total,
  };
}
