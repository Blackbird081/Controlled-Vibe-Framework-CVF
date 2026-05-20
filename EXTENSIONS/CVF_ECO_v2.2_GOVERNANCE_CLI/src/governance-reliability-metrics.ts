interface GenericAuditEvent {
  executionId?: string;
  runId?: string;
  eventType?: string;
  type?: string;
  timestamp?: string;
  at?: string;
  createdAt?: string;
  receiptId?: string | null;
  decision?: string | null;
  enforcement?: {
    status?: string | null;
  } | null;
  stepTraceIds?: string[];
}

export interface OperatorCorrectionEvent extends GenericAuditEvent {
  eventType: "operator_correction";
  executionId: string;
  correctedAt: string;
  correctionSource: "operator" | "reviewer";
}

export interface RollbackEvent extends GenericAuditEvent {
  eventType: "rollback";
  executionId: string;
  rolledBackAt: string;
  success: boolean;
}

export type AuditEvent = GenericAuditEvent | OperatorCorrectionEvent | RollbackEvent;

export interface MetricResult {
  rate: number | null;
  count: number;
  total: number;
}

export interface GovernanceReliabilityReport {
  receiptIntegrityRate: MetricResult;
  policyDecisionRate: MetricResult;
  stepTraceCompletionRate: MetricResult;
  auditEventCaptureRate: MetricResult;
  taskCompletionRate: MetricResult;
  retryRecoveryRate: MetricResult;
  policyViolationRate: MetricResult;
  crossSessionContinuityRate: MetricResult;
  deterministicConsistencyRate: MetricResult;
  humanCorrectionRate: MetricResult;
  longHorizonStabilityRate: MetricResult;
  rollbackSuccessRate: MetricResult;
}

export function receiptIntegrityRate(events: AuditEvent[]): MetricResult {
  return ratio(
    events.filter((event) => Boolean(nonEmptyString(event.receiptId)) && event.decision === "captured").length,
    events.length,
  );
}

export function policyDecisionRate(events: AuditEvent[]): MetricResult {
  return ratio(
    events.filter((event) => {
      const status = nonEmptyString(event.enforcement?.status);
      return Boolean(status) && status !== "error";
    }).length,
    events.length,
  );
}

export function stepTraceCompletionRate(events: AuditEvent[]): MetricResult {
  return ratio(
    events.filter((event) => Array.isArray(event.stepTraceIds) && event.stepTraceIds.length > 0).length,
    events.length,
  );
}

export function auditEventCaptureRate(events: AuditEvent[]): MetricResult {
  const executionRequests = new Set(
    events
      .filter((event) => event.eventType === "execution_requested" || event.type === "execution_requested")
      .map(executionKey)
      .filter(Boolean),
  );
  const executionsWithAuditEvents = new Set(events.map(executionKey).filter(Boolean));
  const total = executionRequests.size || executionsWithAuditEvents.size;
  return ratio(executionsWithAuditEvents.size, total);
}

export function taskCompletionRate(events: AuditEvent[]): MetricResult {
  return ratio(events.filter((event) => event.decision === "allow").length, events.length);
}

export function retryRecoveryRate(events: AuditEvent[]): MetricResult {
  const withStatus = events.filter((event) => Boolean(nonEmptyString(event.enforcement?.status)));
  const recovered = withStatus.filter((event) => {
    const status = nonEmptyString(event.enforcement?.status);
    return status === "retry" || status === "recovered";
  });
  return ratio(recovered.length, withStatus.length);
}

export function policyViolationRate(events: AuditEvent[]): MetricResult {
  return ratio(
    events.filter((event) => {
      const status = nonEmptyString(event.enforcement?.status);
      return status === "deny" || status === "blocked";
    }).length,
    events.length,
  );
}

export function crossSessionContinuityRate(events: AuditEvent[]): MetricResult {
  const runGroups = new Map<string, number>();
  events.forEach((event) => {
    const key = nonEmptyString(event.runId);
    if (key) runGroups.set(key, (runGroups.get(key) ?? 0) + 1);
  });
  return ratio([...runGroups.values()].filter((count) => count > 1).length, runGroups.size);
}

export function deterministicConsistencyRate(events: AuditEvent[]): MetricResult {
  const executionGroups = new Map<string, number>();
  events.forEach((event) => {
    const key = nonEmptyString(event.executionId);
    if (key) executionGroups.set(key, (executionGroups.get(key) ?? 0) + 1);
  });
  return ratio([...executionGroups.values()].filter((count) => count === 1).length, executionGroups.size);
}

export function humanCorrectionRate(events: AuditEvent[]): MetricResult {
  const executions = distinctExecutions(events);
  const correctedExecutions = new Set(
    events
      .filter((event) => eventKind(event) === "operator_correction")
      .map(executionKey)
      .filter(Boolean),
  );
  return ratio(correctedExecutions.size, executions.size);
}

export function longHorizonStabilityRate(events: AuditEvent[], windowDays: number): MetricResult {
  const groups = groupByExecution(events);
  if (groups.size === 0) {
    return { rate: 1, count: 0, total: 0 };
  }

  let stable = 0;
  groups.forEach((group) => {
    const times = group
      .map(eventTime)
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value))
      .sort((a, b) => a - b);
    const withinWindow = times.length < 2 || ((times[times.length - 1]! - times[0]!) / 86_400_000) <= windowDays;
    const hasViolation = group.some((event) => {
      const kind = eventKind(event);
      return kind === "policy_violation" || (kind === "rollback" && (event as RollbackEvent).success === false);
    });
    if (withinWindow && !hasViolation) {
      stable += 1;
    }
  });

  return ratio(stable, groups.size);
}

export function rollbackSuccessRate(events: AuditEvent[]): MetricResult {
  const rollbackEvents = events.filter((event): event is RollbackEvent => eventKind(event) === "rollback");
  if (rollbackEvents.length === 0) {
    return { rate: null, count: 0, total: 0 };
  }
  return ratio(rollbackEvents.filter((event) => event.success === true).length, rollbackEvents.length);
}

export function computeGovernanceReliabilityReport(events: AuditEvent[]): GovernanceReliabilityReport {
  return {
    receiptIntegrityRate: receiptIntegrityRate(events),
    policyDecisionRate: policyDecisionRate(events),
    stepTraceCompletionRate: stepTraceCompletionRate(events),
    auditEventCaptureRate: auditEventCaptureRate(events),
    taskCompletionRate: taskCompletionRate(events),
    retryRecoveryRate: retryRecoveryRate(events),
    policyViolationRate: policyViolationRate(events),
    crossSessionContinuityRate: crossSessionContinuityRate(events),
    deterministicConsistencyRate: deterministicConsistencyRate(events),
    humanCorrectionRate: humanCorrectionRate(events),
    longHorizonStabilityRate: longHorizonStabilityRate(events, 30),
    rollbackSuccessRate: rollbackSuccessRate(events),
  };
}

export function parseAuditJsonl(content: string): AuditEvent[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as AuditEvent);
}

function ratio(count: number, total: number): MetricResult {
  return {
    rate: total === 0 ? 0 : count / total,
    count,
    total,
  };
}

function executionKey(event: AuditEvent): string {
  return nonEmptyString(event.executionId) ?? nonEmptyString(event.runId) ?? "";
}

function distinctExecutions(events: AuditEvent[]): Set<string> {
  return new Set(events.map(executionKey).filter(Boolean));
}

function groupByExecution(events: AuditEvent[]): Map<string, AuditEvent[]> {
  const groups = new Map<string, AuditEvent[]>();
  events.forEach((event) => {
    const key = executionKey(event);
    if (!key) return;
    groups.set(key, [...(groups.get(key) ?? []), event]);
  });
  return groups;
}

function eventKind(event: AuditEvent): string {
  return nonEmptyString(event.eventType) ?? nonEmptyString(event.type) ?? "";
}

function eventTime(event: AuditEvent): number | undefined {
  const raw =
    nonEmptyString((event as OperatorCorrectionEvent).correctedAt) ??
    nonEmptyString((event as RollbackEvent).rolledBackAt) ??
    nonEmptyString(event.timestamp) ??
    nonEmptyString(event.at) ??
    nonEmptyString(event.createdAt);
  if (!raw) return undefined;
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
