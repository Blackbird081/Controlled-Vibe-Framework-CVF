import {
  appendAuditEvent,
  type UnifiedAuditEvent,
} from '@/lib/control-plane-events';

export type LpciAuditQuotaProjection = {
  decision: 'ALLOW' | 'DENY' | 'NOT_EVALUATED';
  retryAfterBucket?: 'NONE' | 'LT_10S' | 'LT_60S' | 'GE_60S';
};

export type LpciTerminalAuditInput = {
  invocationId: string;
  auditId?: string;
  traceId?: string;
  timestamp?: string;
  authMode: 'session' | 'service' | 'unknown';
  roleClass: string;
  actorRef?: string;
  outcome: string;
  httpStatus: number;
  corpusRef?: string;
  responseBoundaryClass?: 'ANSWER_EMITTED' | 'ABSTAINED' | 'NEGATIVE_RECEIPT';
  providerId?: string;
  modelId?: string;
  queryQuota?: LpciAuditQuotaProjection;
  providerQuota?: LpciAuditQuotaProjection;
  providerAttemptCount: 0 | 1;
  timeoutFlag: boolean;
  diagnosticCode?: string;
  latencyBucket?: 'LT_100MS' | 'LT_1S' | 'LT_10S' | 'GE_10S';
};

export type LpciTerminalAuditProjection = Parameters<typeof appendAuditEvent>[0];

function copyDefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
  ) as Partial<T>;
}

export function projectLpciTerminalAudit(input: LpciTerminalAuditInput): LpciTerminalAuditProjection {
  const payload = copyDefined({
    schemaVersion: 'cvf.lpci.queryTerminal.v1',
    invocationId: input.invocationId,
    auditId: input.auditId,
    traceId: input.traceId,
    routeId: 'POST /api/lpci/query',
    authMode: input.authMode,
    roleClass: input.roleClass,
    actorRef: input.actorRef,
    outcome: input.outcome,
    httpStatus: input.httpStatus,
    corpusRef: input.corpusRef,
    responseBoundaryClass: input.responseBoundaryClass,
    providerId: input.providerId,
    modelId: input.modelId,
    queryQuota: input.queryQuota,
    providerQuota: input.providerQuota,
    providerAttemptCount: input.providerAttemptCount,
    timeoutFlag: input.timeoutFlag,
    diagnosticCode: input.diagnosticCode,
    latencyBucket: input.latencyBucket,
  });

  return {
    id: input.auditId,
    timestamp: input.timestamp,
    eventType: 'LPCI_QUERY_TERMINAL',
    actorId: input.actorRef ?? 'ACTOR_REF_UNAVAILABLE',
    actorRole: input.roleClass,
    targetResource: '/api/lpci/query',
    action: 'LPCI_QUERY',
    outcome: input.outcome,
    payload,
  };
}

export type LpciReleaseAuditDependencies = {
  appendAuditEvent?: typeof appendAuditEvent;
};

export async function appendLpciTerminalAudit(
  input: LpciTerminalAuditInput,
  dependencies: LpciReleaseAuditDependencies = {},
): Promise<UnifiedAuditEvent> {
  const append = dependencies.appendAuditEvent ?? appendAuditEvent;
  return append(projectLpciTerminalAudit(input));
}
