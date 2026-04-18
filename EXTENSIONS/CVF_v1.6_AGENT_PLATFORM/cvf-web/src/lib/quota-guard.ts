import { readAuditEvents, readCostEvents } from '@/lib/control-plane-events';
import { getActiveQuotaOverride, getActiveQuotaPolicy } from '@/lib/policy-reader';
import type { BillingPeriod, QuotaPolicyEvent } from '@/lib/policy-events';

export interface TeamQuotaCheckResult {
  exceeded: boolean;
  teamId?: string;
  reason?: string;
  period?: BillingPeriod;
  currentUSD: number;
  softCapUSD: number;
  hardCapUSD: number;
  overrideActive: boolean;
  billingWindowKey?: string;
  billingWindowStart?: string;
  policyTimestamp?: string;
}

function startOfBillingWindow(referenceTimestamp: string, period: BillingPeriod): Date {
  const date = new Date(referenceTimestamp);
  const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

  if (period === 'monthly') {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  }

  if (period === 'weekly') {
    const day = result.getUTCDay();
    const offset = day === 0 ? 6 : day - 1;
    result.setUTCDate(result.getUTCDate() - offset);
    return result;
  }

  return result;
}

export function getBillingWindow(referenceTimestamp: string, period: BillingPeriod) {
  const windowStart = startOfBillingWindow(referenceTimestamp, period);
  const billingWindowStart = windowStart.toISOString();
  const billingWindowKey =
    period === 'monthly'
      ? billingWindowStart.slice(0, 7)
      : billingWindowStart.slice(0, 10);

  return {
    billingWindowKey: `${period}:${billingWindowKey}`,
    billingWindowStart,
  };
}

export async function calculateTeamSpendForPeriod(
  teamId: string,
  period: BillingPeriod,
  referenceTimestamp = new Date().toISOString(),
): Promise<number> {
  const { billingWindowStart } = getBillingWindow(referenceTimestamp, period);
  const costEvents = await readCostEvents();

  return costEvents
    .filter(event => event.teamId === teamId && event.timestamp >= billingWindowStart && event.timestamp <= referenceTimestamp)
    .reduce((sum, event) => sum + event.estimatedCostUSD, 0);
}

export async function hasSoftCapAuditEvent(
  teamId: string,
  policy: QuotaPolicyEvent,
  referenceTimestamp = new Date().toISOString(),
): Promise<boolean> {
  const { billingWindowKey } = getBillingWindow(referenceTimestamp, policy.period);
  const auditEvents = await readAuditEvents();

  return auditEvents.some(event =>
    event.eventType === 'QUOTA_SOFT_CAP_REACHED'
    && event.payload?.teamId === teamId
    && event.payload?.billingWindowKey === billingWindowKey
    && event.payload?.policyTimestamp === policy.timestamp,
  );
}

export async function checkTeamQuota(
  teamId?: string,
  referenceTimestamp = new Date().toISOString(),
): Promise<TeamQuotaCheckResult> {
  if (!teamId) {
    return {
      exceeded: false,
      currentUSD: 0,
      softCapUSD: 0,
      hardCapUSD: 0,
      overrideActive: false,
    };
  }

  const policy = await getActiveQuotaPolicy(teamId);
  if (!policy) {
    return {
      exceeded: false,
      teamId,
      currentUSD: 0,
      softCapUSD: 0,
      hardCapUSD: 0,
      overrideActive: false,
    };
  }

  const { billingWindowKey, billingWindowStart } = getBillingWindow(referenceTimestamp, policy.period);
  const currentUSD = await calculateTeamSpendForPeriod(teamId, policy.period, referenceTimestamp);
  const override = await getActiveQuotaOverride(teamId, referenceTimestamp);

  if (override) {
    return {
      exceeded: false,
      teamId,
      period: policy.period,
      currentUSD,
      softCapUSD: policy.softCapUSD,
      hardCapUSD: policy.hardCapUSD,
      overrideActive: true,
      billingWindowKey,
      billingWindowStart,
      policyTimestamp: policy.timestamp,
    };
  }

  const exceeded = currentUSD >= policy.hardCapUSD;
  return {
    exceeded,
    teamId,
    reason: exceeded ? 'Team quota exceeded. Contact an owner for an emergency override.' : undefined,
    period: policy.period,
    currentUSD,
    softCapUSD: policy.softCapUSD,
    hardCapUSD: policy.hardCapUSD,
    overrideActive: false,
    billingWindowKey,
    billingWindowStart,
    policyTimestamp: policy.timestamp,
  };
}
