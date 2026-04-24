import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const requireAdminApiSessionMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/admin-session', () => ({
  requireAdminApiSession: requireAdminApiSessionMock,
  withAdminAuditPayload: (_session: unknown, payload?: Record<string, unknown>) => payload,
}));

import { POST } from './route';

describe('/api/admin/dlp/policy', () => {
  const originalPath = process.env.CVF_CONTROL_PLANE_EVENTS_PATH;
  let tempDir = '';

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-dlp-policy-route-'));
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

  it('rejects invalid regex payloads', async () => {
    requireAdminApiSessionMock.mockResolvedValue({
      userId: 'usr_2',
      user: 'Alice Admin',
      role: 'admin',
      orgId: 'org_cvf',
      teamId: 'team_exec',
      expiresAt: Date.now() + 60_000,
      authMode: 'session',
    });

    const response = await POST(new Request('http://localhost/api/admin/dlp/policy', {
      method: 'POST',
      body: JSON.stringify({
        patterns: [{ id: 'broken', label: 'Broken', regex: '([', enabled: true }],
      }),
      headers: { 'Content-Type': 'application/json' },
    }) as never);

    expect(response.status).toBe(400);
  });

  it('rejects DLP policy changes outside the admin org scope', async () => {
    requireAdminApiSessionMock.mockResolvedValue({
      userId: 'usr_external_admin',
      user: 'External Admin',
      role: 'admin',
      orgId: 'org_other',
      teamId: 'team_external',
      expiresAt: Date.now() + 60_000,
      authMode: 'session',
    });

    const response = await POST(new Request('http://localhost/api/admin/dlp/policy', {
      method: 'POST',
      body: JSON.stringify({
        orgId: 'org_cvf',
        patterns: [{ id: 'secret-pattern', label: 'Secret', regex: 'secret', enabled: true }],
      }),
      headers: { 'Content-Type': 'application/json' },
    }) as never);

    expect(response.status).toBe(403);
  });

  it('stores a DLP policy event', async () => {
    requireAdminApiSessionMock.mockResolvedValue({
      userId: 'usr_2',
      user: 'Alice Admin',
      role: 'admin',
      orgId: 'org_cvf',
      teamId: 'team_exec',
      expiresAt: Date.now() + 60_000,
      authMode: 'session',
    });

    const response = await POST(new Request('http://localhost/api/admin/dlp/policy', {
      method: 'POST',
      body: JSON.stringify({
        patterns: [{ id: 'secret-pattern', label: 'Secret', regex: 'secret', enabled: true }],
      }),
      headers: { 'Content-Type': 'application/json' },
    }) as never);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.kind).toBe('dlp-policy');
    expect(body.data.orgId).toBe('org_cvf');
    expect(body.data.teamId).toBeNull();
    expect(body.data.patterns).toHaveLength(1);
  });
});
