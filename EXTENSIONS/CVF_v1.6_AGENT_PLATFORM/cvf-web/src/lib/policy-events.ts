import type { TeamRole } from 'cvf-guard-contract/enterprise';

import { appendControlPlaneEvent, readControlPlaneEvents } from '@/lib/control-plane-events';

export type BillingPeriod = 'monthly' | 'weekly' | 'daily';
export type PolicyEventKind = 'quota-policy' | 'quota-override' | 'tool-policy';

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

export type PolicyControlPlaneEvent =
  | QuotaPolicyEvent
  | QuotaOverrideEvent
  | ToolPolicyEvent;

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

export async function readPolicyEvents(): Promise<PolicyControlPlaneEvent[]> {
  const events = await readControlPlaneEvents();
  return events.filter(
    (event): event is PolicyControlPlaneEvent =>
      event.kind === 'quota-policy' || event.kind === 'quota-override' || event.kind === 'tool-policy',
  );
}
