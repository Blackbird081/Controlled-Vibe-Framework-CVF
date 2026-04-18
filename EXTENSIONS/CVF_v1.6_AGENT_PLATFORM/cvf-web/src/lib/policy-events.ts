import type { TeamRole } from 'cvf-guard-contract/enterprise';

import { appendControlPlaneEvent, readControlPlaneEvents } from '@/lib/control-plane-events';

export type BillingPeriod = 'monthly' | 'weekly' | 'daily';
export type SIEMEventFilter = 'audit' | 'cost' | 'all';
export type PolicyEventKind =
  | 'quota-policy'
  | 'quota-override'
  | 'tool-policy'
  | 'dlp-policy'
  | 'siem-config'
  | 'knowledge-collection-scope'
  | 'impersonation-session';

export interface PolicyEventBase {
  id: string;
  kind: PolicyEventKind;
  evidenceClass: 'FULL';
  timestamp: string;
}

export interface QuotaPolicyEvent extends PolicyEventBase {
  kind: 'quota-policy';
  teamId: string;
  orgId: string;
  softCapUSD: number;
  hardCapUSD: number;
  period: BillingPeriod;
  setBy: string;
  setAt: string;
}

export interface QuotaOverrideEvent extends PolicyEventBase {
  kind: 'quota-override';
  teamId: string;
  orgId: string;
  status: 'granted' | 'revoked';
  grantedBy: string;
  grantedAt: string;
  revokedBy?: string;
  revokedAt?: string;
  expiresAt: string;
  reason: string;
}

export interface ToolPolicyEvent extends PolicyEventBase {
  kind: 'tool-policy';
  toolId: string;
  allowedRoles: TeamRole[];
  setBy: string;
  setAt: string;
}

export interface DLPPatternRecord {
  id: string;
  label: string;
  regex: string;
  enabled: boolean;
}

export interface DLPPolicyEvent extends PolicyEventBase {
  kind: 'dlp-policy';
  patterns: DLPPatternRecord[];
  setBy: string;
  setAt: string;
}

export interface SIEMConfigEvent extends PolicyEventBase {
  kind: 'siem-config';
  webhookUrl: string;
  signingSecret: string;
  enabled: boolean;
  eventTypes: SIEMEventFilter;
  setBy: string;
  setAt: string;
}

export interface KnowledgeCollectionScopeEvent extends PolicyEventBase {
  kind: 'knowledge-collection-scope';
  collectionId: string;
  orgId: string | null;
  teamId: string | null;
  setBy: string;
  setAt: string;
}

export interface ImpersonationSessionEvent extends PolicyEventBase {
  kind: 'impersonation-session';
  sessionId: string;
  realActorId: string;
  impersonatedUserId: string;
  startedAt: string;
  expiresAt: string;
  status: 'started' | 'ended';
  endedAt?: string;
  endedBy?: string;
}

export type PolicyControlPlaneEvent =
  | QuotaPolicyEvent
  | QuotaOverrideEvent
  | ToolPolicyEvent
  | DLPPolicyEvent
  | SIEMConfigEvent
  | KnowledgeCollectionScopeEvent
  | ImpersonationSessionEvent;

export async function appendQuotaPolicyEvent(
  event: Omit<QuotaPolicyEvent, 'kind' | 'id' | 'timestamp' | 'evidenceClass'> & Partial<Pick<QuotaPolicyEvent, 'id' | 'timestamp'>>,
): Promise<QuotaPolicyEvent> {
  return appendControlPlaneEvent<QuotaPolicyEvent>({
    kind: 'quota-policy',
    ...event,
  });
}

export async function appendQuotaOverrideEvent(
  event: Omit<QuotaOverrideEvent, 'kind' | 'id' | 'timestamp' | 'evidenceClass'> & Partial<Pick<QuotaOverrideEvent, 'id' | 'timestamp'>>,
): Promise<QuotaOverrideEvent> {
  return appendControlPlaneEvent<QuotaOverrideEvent>({
    kind: 'quota-override',
    ...event,
  });
}

export async function appendToolPolicyEvent(
  event: Omit<ToolPolicyEvent, 'kind' | 'id' | 'timestamp' | 'evidenceClass'> & Partial<Pick<ToolPolicyEvent, 'id' | 'timestamp'>>,
): Promise<ToolPolicyEvent> {
  return appendControlPlaneEvent<ToolPolicyEvent>({
    kind: 'tool-policy',
    ...event,
  });
}

export async function appendDLPPolicyEvent(
  event: Omit<DLPPolicyEvent, 'kind' | 'id' | 'timestamp' | 'evidenceClass'> & Partial<Pick<DLPPolicyEvent, 'id' | 'timestamp'>>,
): Promise<DLPPolicyEvent> {
  return appendControlPlaneEvent<DLPPolicyEvent>({
    kind: 'dlp-policy',
    ...event,
  });
}

export async function appendSIEMConfigEvent(
  event: Omit<SIEMConfigEvent, 'kind' | 'id' | 'timestamp' | 'evidenceClass'> & Partial<Pick<SIEMConfigEvent, 'id' | 'timestamp'>>,
): Promise<SIEMConfigEvent> {
  return appendControlPlaneEvent<SIEMConfigEvent>({
    kind: 'siem-config',
    ...event,
  });
}

export async function appendKnowledgeCollectionScopeEvent(
  event: Omit<KnowledgeCollectionScopeEvent, 'kind' | 'id' | 'timestamp' | 'evidenceClass'> & Partial<Pick<KnowledgeCollectionScopeEvent, 'id' | 'timestamp'>>,
): Promise<KnowledgeCollectionScopeEvent> {
  return appendControlPlaneEvent<KnowledgeCollectionScopeEvent>({
    kind: 'knowledge-collection-scope',
    ...event,
  });
}

export async function appendImpersonationSessionEvent(
  event: Omit<ImpersonationSessionEvent, 'kind' | 'id' | 'timestamp' | 'evidenceClass'> & Partial<Pick<ImpersonationSessionEvent, 'id' | 'timestamp'>>,
): Promise<ImpersonationSessionEvent> {
  return appendControlPlaneEvent<ImpersonationSessionEvent>({
    kind: 'impersonation-session',
    ...event,
  });
}

export async function readPolicyEvents(): Promise<PolicyControlPlaneEvent[]> {
  const events = await readControlPlaneEvents();
  return events.filter(
    (event): event is PolicyControlPlaneEvent =>
      event.kind === 'quota-policy'
      || event.kind === 'quota-override'
      || event.kind === 'tool-policy'
      || event.kind === 'dlp-policy'
      || event.kind === 'siem-config'
      || event.kind === 'knowledge-collection-scope'
      || event.kind === 'impersonation-session',
  );
}
