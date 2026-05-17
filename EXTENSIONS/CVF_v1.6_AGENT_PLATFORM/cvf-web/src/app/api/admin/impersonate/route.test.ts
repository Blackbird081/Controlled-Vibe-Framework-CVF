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

describe('/api/admin/impersonate', () => {
  const originalPath = process.env.CVF_CONTROL_PLANE_EVENTS_PATH;
  let tempDir = '';

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-impersonate-route-'));
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

  it('blocks impersonation during break-glass access', async () => {
    requireAdminApiSessionMock.mockResolvedValue({
      userId: 'break-glass',
      user: 'Break Glass Session',
      role: 'owner',
      orgId: 'org_cvf',
      teamId: 'team_exec',
      expiresAt: Date.now() + 60_000,
      authMode: 'break-glass',
    });

    const response = await POST(new Request('http://localhost/api/admin/impersonate', {
      method: 'POST',
      body: JSON.stringify({ userId: 'usr_3' }),
      headers: { 'Content-Type': 'application/json' },
    }) as never);

    expect(response.status).toBe(403);
  });

  it('starts an impersonation session for a non-owner user', async () => {
    requireAdminApiSessionMock.mockResolvedValue({
      userId: 'usr_1',
      user: 'John Owner',
      role: 'owner',
      orgId: 'org_cvf',
      teamId: 'team_exec',
      expiresAt: Date.now() + 60_000,
      authMode: 'session',
    });

    const response = await POST(new Request('http://localhost/api/admin/impersonate', {
      method: 'POST',
      body: JSON.stringify({ userId: 'usr_3' }),
      headers: { 'Content-Type': 'application/json' },
    }) as never);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data.kind).toBe('impersonation-session');
    expect(response.headers.get('X-CVF-Impersonation-Active')).toBe('true');
    expect(response.headers.get('set-cookie')).toContain('cvf_impersonation=');
  });
});
