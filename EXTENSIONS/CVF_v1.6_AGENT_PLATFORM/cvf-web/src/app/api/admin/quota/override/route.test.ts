import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { NextResponse } from 'next/server';

const requireAdminApiSessionMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/admin-session', () => ({
  requireAdminApiSession: requireAdminApiSessionMock,
  withAdminAuditPayload: (_session: unknown, payload?: Record<string, unknown>) => payload,
}));

import { DELETE, POST } from './route';

describe('/api/admin/quota/override', () => {
  const originalPath = process.env.CVF_CONTROL_PLANE_EVENTS_PATH;
  let tempDir = '';

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-quota-override-route-'));
    process.env.CVF_CONTROL_PLANE_EVENTS_PATH = path.join(tempDir, 'events.json');
    requireAdminApiSessionMock.mockReset();
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
    requireAdminApiSessionMock.mockResolvedValueOnce(NextResponse.json({ success: false }, { status: 403 }));

    const response = await POST(new Request('http://localhost/api/admin/quota/override', {
      method: 'POST',
      body: JSON.stringify({ teamId: 'team_eng', reason: 'urgent' }),
      headers: { 'Content-Type': 'application/json' },
    }) as never);

    expect(response.status).toBe(403);
  });

  it('grants and revokes an override for an owner session', async () => {
    requireAdminApiSessionMock.mockResolvedValueOnce({
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

    requireAdminApiSessionMock.mockResolvedValueOnce({
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
