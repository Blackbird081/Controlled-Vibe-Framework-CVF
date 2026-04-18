import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  appendQuotaOverrideEvent,
  appendQuotaPolicyEvent,
  appendToolPolicyEvent,
} from './policy-events';
import {
  getActiveQuotaOverride,
  getActiveQuotaPolicy,
  getActiveToolPolicy,
  getAllToolPolicies,
} from './policy-reader';

describe('policy-reader', () => {
  const originalPath = process.env.CVF_CONTROL_PLANE_EVENTS_PATH;
  let tempDir = '';

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-policy-reader-'));
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

  it('returns the newest quota policy for a team', async () => {
    await appendQuotaPolicyEvent({
      timestamp: '2026-04-18T08:00:00.000Z',
      teamId: 'team_eng',
      orgId: 'org_cvf',
      softCapUSD: 20,
      hardCapUSD: 50,
      period: 'monthly',
      setBy: 'usr_2',
      setAt: '2026-04-18T08:00:00.000Z',
    });
    await appendQuotaPolicyEvent({
      timestamp: '2026-04-18T09:00:00.000Z',
      teamId: 'team_eng',
      orgId: 'org_cvf',
      softCapUSD: 30,
      hardCapUSD: 60,
      period: 'monthly',
      setBy: 'usr_2',
      setAt: '2026-04-18T09:00:00.000Z',
    });

    const policy = await getActiveQuotaPolicy('team_eng');

    expect(policy?.softCapUSD).toBe(30);
    expect(policy?.hardCapUSD).toBe(60);
  });

  it('deactivates a granted override when a newer revoke event exists', async () => {
    await appendQuotaOverrideEvent({
      timestamp: '2026-04-18T08:00:00.000Z',
      teamId: 'team_eng',
      orgId: 'org_cvf',
      status: 'granted',
      grantedBy: 'usr_1',
      grantedAt: '2026-04-18T08:00:00.000Z',
      expiresAt: '2026-04-19T08:00:00.000Z',
      reason: 'Emergency release',
    });
    await appendQuotaOverrideEvent({
      timestamp: '2026-04-18T10:00:00.000Z',
      teamId: 'team_eng',
      orgId: 'org_cvf',
      status: 'revoked',
      grantedBy: 'usr_1',
      grantedAt: '2026-04-18T08:00:00.000Z',
      revokedBy: 'usr_1',
      revokedAt: '2026-04-18T10:00:00.000Z',
      expiresAt: '2026-04-19T08:00:00.000Z',
      reason: 'Rollback complete',
    });

    const override = await getActiveQuotaOverride('team_eng', '2026-04-18T11:00:00.000Z');
    expect(override).toBeNull();
  });

  it('returns the latest tool policy per tool', async () => {
    await appendToolPolicyEvent({
      timestamp: '2026-04-18T08:00:00.000Z',
      toolId: 'web_search',
      allowedRoles: ['owner', 'admin'],
      setBy: 'usr_2',
      setAt: '2026-04-18T08:00:00.000Z',
    });
    await appendToolPolicyEvent({
      timestamp: '2026-04-18T09:00:00.000Z',
      toolId: 'web_search',
      allowedRoles: ['owner', 'admin', 'reviewer'],
      setBy: 'usr_2',
      setAt: '2026-04-18T09:00:00.000Z',
    });

    const direct = await getActiveToolPolicy('web_search');
    const all = await getAllToolPolicies();

    expect(direct?.allowedRoles).toEqual(['owner', 'admin', 'reviewer']);
    expect(all.get('web_search')?.allowedRoles).toEqual(['owner', 'admin', 'reviewer']);
  });
});
