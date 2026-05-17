import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { appendAuditEvent, appendCostEvent } from './control-plane-events';
import { appendQuotaOverrideEvent, appendQuotaPolicyEvent } from './policy-events';
import {
  calculateTeamSpendForPeriod,
  checkTeamQuota,
  getBillingWindow,
  hasSoftCapAuditEvent,
} from './quota-guard';

describe('quota-guard', () => {
  const originalPath = process.env.CVF_CONTROL_PLANE_EVENTS_PATH;
  let tempDir = '';

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-quota-guard-'));
    process.env.CVF_CONTROL_PLANE_EVENTS_PATH = path.join(tempDir, 'events.json');
  });

  afterEach(async () => {
    if (originalPath) {
      process.env.CVF_CONTROL_PLANE_EVENTS_PATH = originalPath;
    } else {
      delete process.env.CVF_CONTROL_PLANE_EVENTS_PATH;
    }
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('calculates current period spend and blocks when hard cap is exceeded', async () => {
    await appendQuotaPolicyEvent({
      timestamp: '2026-04-18T08:00:00.000Z',
      teamId: 'team_eng',
      orgId: 'org_cvf',
      softCapUSD: 10,
      hardCapUSD: 20,
      period: 'monthly',
      setBy: 'usr_2',
      setAt: '2026-04-18T08:00:00.000Z',
    });
    await appendCostEvent({
      timestamp: '2026-04-18T08:05:00.000Z',
      userId: 'usr_3',
      teamId: 'team_eng',
      orgId: 'org_cvf',
      provider: 'alibaba',
      model: 'qwen-turbo',
      inputTokens: 100,
      outputTokens: 50,
      estimatedCostUSD: 21,
    });

    const spend = await calculateTeamSpendForPeriod('team_eng', 'monthly', '2026-04-18T09:00:00.000Z');
    const quota = await checkTeamQuota('team_eng', '2026-04-18T09:00:00.000Z');

    expect(spend).toBe(21);
    expect(quota.exceeded).toBe(true);
    expect(quota.hardCapUSD).toBe(20);
  });

  it('allows execution when an active owner override exists', async () => {
    await appendQuotaPolicyEvent({
      timestamp: '2026-04-18T08:00:00.000Z',
      teamId: 'team_eng',
      orgId: 'org_cvf',
      softCapUSD: 10,
      hardCapUSD: 20,
      period: 'monthly',
      setBy: 'usr_2',
      setAt: '2026-04-18T08:00:00.000Z',
    });
    await appendCostEvent({
      timestamp: '2026-04-18T08:05:00.000Z',
      userId: 'usr_3',
      teamId: 'team_eng',
      orgId: 'org_cvf',
      provider: 'alibaba',
      model: 'qwen-turbo',
      inputTokens: 100,
      outputTokens: 50,
      estimatedCostUSD: 21,
    });
    await appendQuotaOverrideEvent({
      timestamp: '2026-04-18T08:10:00.000Z',
      teamId: 'team_eng',
      orgId: 'org_cvf',
      status: 'granted',
      grantedBy: 'usr_1',
      grantedAt: '2026-04-18T08:10:00.000Z',
      expiresAt: '2026-04-19T08:10:00.000Z',
      reason: 'Incident bridge',
    });

    const quota = await checkTeamQuota('team_eng', '2026-04-18T09:00:00.000Z');

    expect(quota.exceeded).toBe(false);
    expect(quota.overrideActive).toBe(true);
  });

  it('detects previously emitted soft-cap audit markers for the same window', async () => {
    await appendQuotaPolicyEvent({
      timestamp: '2026-04-18T08:00:00.000Z',
      teamId: 'team_eng',
      orgId: 'org_cvf',
      softCapUSD: 10,
      hardCapUSD: 20,
      period: 'monthly',
      setBy: 'usr_2',
      setAt: '2026-04-18T08:00:00.000Z',
    });
    const { billingWindowKey } = getBillingWindow('2026-04-18T09:00:00.000Z', 'monthly');
    await appendAuditEvent({
      timestamp: '2026-04-18T09:00:00.000Z',
      eventType: 'QUOTA_SOFT_CAP_REACHED',
      actorId: 'usr_3',
      actorRole: 'developer',
      targetResource: 'team_eng',
      action: 'NOTIFY_TEAM_QUOTA_SOFT_CAP',
      outcome: 'WARNING',
      payload: {
        teamId: 'team_eng',
        billingWindowKey,
        policyTimestamp: '2026-04-18T08:00:00.000Z',
      },
    });

    const alreadyEmitted = await hasSoftCapAuditEvent('team_eng', {
      kind: 'quota-policy',
      id: 'policy',
      evidenceClass: 'FULL',
      timestamp: '2026-04-18T08:00:00.000Z',
      teamId: 'team_eng',
      orgId: 'org_cvf',
      softCapUSD: 10,
      hardCapUSD: 20,
      period: 'monthly',
      setBy: 'usr_2',
      setAt: '2026-04-18T08:00:00.000Z',
    }, '2026-04-18T09:00:00.000Z');

    expect(alreadyEmitted).toBe(true);
  });
});
