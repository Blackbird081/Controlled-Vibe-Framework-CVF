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

import { POST } from './route';

describe('/api/admin/tool-registry/knowledge-scope', () => {
  const originalPath = process.env.CVF_CONTROL_PLANE_EVENTS_PATH;
  let tempDir = '';

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-knowledge-scope-route-'));
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

  it('rejects unauthorized requests', async () => {
    requireAdminApiSessionMock.mockResolvedValueOnce(NextResponse.json({ success: false }, { status: 401 }));

    const response = await POST(new Request('http://localhost/api/admin/tool-registry/knowledge-scope', {
      method: 'POST',
      body: JSON.stringify({}),
    }) as never);

    expect(response.status).toBe(401);
  });

  it('persists a scoped collection update for admin users', async () => {
    requireAdminApiSessionMock.mockResolvedValueOnce({
      userId: 'usr_2',
      user: 'admin',
      role: 'admin',
      orgId: 'org_cvf',
      teamId: 'team_exec',
      expiresAt: Date.now() + 60_000,
    });

    const response = await POST(new Request('http://localhost/api/admin/tool-registry/knowledge-scope', {
      method: 'POST',
      body: JSON.stringify({
        collectionId: 'cvf-engineering-runbooks',
        orgId: 'org_cvf',
        teamId: 'team_eng',
      }),
      headers: { 'Content-Type': 'application/json' },
    }) as never);

    const body = await response.json();
    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.kind).toBe('knowledge-collection-scope');
    expect(body.data.collectionId).toBe('cvf-engineering-runbooks');
    expect(body.data.orgId).toBe('org_cvf');
    expect(body.data.teamId).toBe('team_eng');
  });

  it('rejects inconsistent org/team combinations', async () => {
    requireAdminApiSessionMock.mockResolvedValueOnce({
      userId: 'usr_2',
      user: 'admin',
      role: 'admin',
      orgId: 'org_cvf',
      teamId: 'team_exec',
      expiresAt: Date.now() + 60_000,
    });

    const response = await POST(new Request('http://localhost/api/admin/tool-registry/knowledge-scope', {
      method: 'POST',
      body: JSON.stringify({
        collectionId: 'cvf-engineering-runbooks',
        orgId: 'org_cvf',
        teamId: 'team_a',
      }),
      headers: { 'Content-Type': 'application/json' },
    }) as never);

    expect(response.status).toBe(400);
  });
});
