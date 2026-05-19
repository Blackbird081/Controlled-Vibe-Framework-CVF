export interface AuditEvent {
  executionId?: string;
  runId?: string;
  eventType?: string;
  type?: string;
  receiptId?: string | null;
  decision?: string | null;
  enforcement?: {
    status?: string | null;
  } | null;
  stepTraceIds?: string[];
}

export interface MetricResult {
  rate: number;
  count: number;
  total: number;
}

export interface GovernanceReliabilityReport {
  receiptIntegrityRate: MetricResult;
  policyDecisionRate: MetricResult;
  stepTraceCompletionRate: MetricResult;
  auditEventCaptureRate: MetricResult;
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

export function computeGovernanceReliabilityReport(events: AuditEvent[]): GovernanceReliabilityReport {
  return {
    receiptIntegrityRate: receiptIntegrityRate(events),
    policyDecisionRate: policyDecisionRate(events),
    stepTraceCompletionRate: stepTraceCompletionRate(events),
    auditEventCaptureRate: auditEventCaptureRate(events),
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

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
