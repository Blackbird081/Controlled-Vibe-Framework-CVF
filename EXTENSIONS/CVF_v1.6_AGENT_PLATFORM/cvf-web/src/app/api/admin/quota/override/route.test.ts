import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const verifySessionCookieMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/middleware-auth', () => ({
  verifySessionCookie: verifySessionCookieMock,
}));

import { DELETE, POST } from './route';

describe('/api/admin/quota/override', () => {
  const originalPath = process.env.CVF_CONTROL_PLANE_EVENTS_PATH;
  let tempDir = '';

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-quota-override-route-'));
    process.env.CVF_CONTROL_PLANE_EVENTS_PATH = path.join(tempDir, 'events.json');
    verifySessionCookieMock.mockReset();
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

  it('requires owner role for grant', async () => {
    verifySessionCookieMock.mockResolvedValueOnce({
      userId: 'usr_2',
      user: 'admin',
      role: 'admin',
      orgId: 'org_cvf',
      teamId: 'team_exec',
      expiresAt: Date.now() + 60_000,
    });

    const response = await POST(new Request('http://localhost/api/admin/quota/override', {
      method: 'POST',
      body: JSON.stringify({ teamId: 'team_eng', reason: 'urgent' }),
      headers: { 'Content-Type': 'application/json' },
    }) as never);

    expect(response.status).toBe(403);
  });

  it('grants and revokes an override for an owner session', async () => {
    verifySessionCookieMock.mockResolvedValueOnce({
      userId: 'usr_1',
      user: 'owner',
      role: 'owner',
      orgId: 'org_cvf',
      teamId: 'team_exec',
      expiresAt: Date.now() + 60_000,
    });

    const grantResponse = await POST(new Request('http://localhost/api/admin/quota/override', {
      method: 'POST',
      body: JSON.stringify({ teamId: 'team_eng', reason: 'incident bridge' }),
      headers: { 'Content-Type': 'application/json' },
    }) as never);
    const grantBody = await grantResponse.json();

    expect(grantResponse.status).toBe(201);
    expect(grantBody.data.status).toBe('granted');

    verifySessionCookieMock.mockResolvedValueOnce({
      userId: 'usr_1',
      user: 'owner',
      role: 'owner',
      orgId: 'org_cvf',
      teamId: 'team_exec',
      expiresAt: Date.now() + 60_000,
    });

    const revokeResponse = await DELETE(new Request('http://localhost/api/admin/quota/override', {
      method: 'DELETE',
      body: JSON.stringify({ teamId: 'team_eng', reason: 'incident resolved' }),
      headers: { 'Content-Type': 'application/json' },
    }) as never);
    const revokeBody = await revokeResponse.json();

    expect(revokeResponse.status).toBe(200);
    expect(revokeBody.data.status).toBe('revoked');
  });
});
