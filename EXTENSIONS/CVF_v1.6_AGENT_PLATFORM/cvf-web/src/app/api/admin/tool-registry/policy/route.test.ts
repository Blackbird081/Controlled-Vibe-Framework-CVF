import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const verifySessionCookieMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/middleware-auth', () => ({
  verifySessionCookie: verifySessionCookieMock,
}));

import { POST } from './route';

describe('/api/admin/tool-registry/policy', () => {
  const originalPath = process.env.CVF_CONTROL_PLANE_EVENTS_PATH;
  let tempDir = '';

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-tool-policy-route-'));
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

  it('rejects unauthorized requests', async () => {
    verifySessionCookieMock.mockResolvedValueOnce(null);

    const response = await POST(new Request('http://localhost/api/admin/tool-registry/policy', {
      method: 'POST',
      body: JSON.stringify({}),
    }) as never);

    expect(response.status).toBe(401);
  });

  it('prevents removing owner from the role list', async () => {
    verifySessionCookieMock.mockResolvedValueOnce({
      userId: 'usr_2',
      user: 'admin',
      role: 'admin',
      orgId: 'org_cvf',
      teamId: 'team_exec',
      expiresAt: Date.now() + 60_000,
    });

    const response = await POST(new Request('http://localhost/api/admin/tool-registry/policy', {
      method: 'POST',
      body: JSON.stringify({
        toolId: 'web_search',
        allowedRoles: ['admin', 'reviewer'],
      }),
      headers: { 'Content-Type': 'application/json' },
    }) as never);

    expect(response.status).toBe(400);
  });

  it('appends a tool policy event for an admin session', async () => {
    verifySessionCookieMock.mockResolvedValueOnce({
      userId: 'usr_2',
      user: 'admin',
      role: 'admin',
      orgId: 'org_cvf',
      teamId: 'team_exec',
      expiresAt: Date.now() + 60_000,
    });

    const response = await POST(new Request('http://localhost/api/admin/tool-registry/policy', {
      method: 'POST',
      body: JSON.stringify({
        toolId: 'web_search',
        allowedRoles: ['owner', 'admin', 'reviewer'],
      }),
      headers: { 'Content-Type': 'application/json' },
    }) as never);

    const body = await response.json();
    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.kind).toBe('tool-policy');
    expect(body.data.allowedRoles).toEqual(['owner', 'admin', 'reviewer']);
  });
});
