import { beforeEach, describe, expect, it, vi } from 'vitest';

const verifySessionCookieMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/middleware-auth', () => ({
  verifySessionCookie: verifySessionCookieMock,
}));

import { POST } from './route';

const RESULT_WITH_DRIFT = {
  artifactId: 'art-001',
  evaluatedAt: '2026-04-14T10:00:00.000Z',
  signals: [
    {
      signalId: 'sig-id-001',
      signalHash: 'sig-hash-001',
      signalType: 'drift' as const,
      artifactId: 'art-001',
      detectedAt: '2026-04-14T10:00:00.000Z',
      message: 'Raw source modified after compiledAt',
    },
  ],
  totalSignals: 1,
  hasIssues: true,
  resultHash: 'result-hash-001',
};

const RESULT_WITH_ORPHAN = {
  ...RESULT_WITH_DRIFT,
  signals: [
    {
      signalId: 'sig-id-002',
      signalHash: 'sig-hash-002',
      signalType: 'orphan' as const,
      artifactId: 'art-001',
      detectedAt: '2026-04-14T10:00:00.000Z',
      message: 'Source ID no longer active: src-001',
    },
  ],
};

const RESULT_NO_ISSUES = {
  ...RESULT_WITH_DRIFT,
  signals: [],
  totalSignals: 0,
  hasIssues: false,
};

describe('/api/governance/knowledge/refactor', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.CVF_SERVICE_TOKEN;
    verifySessionCookieMock.mockReset();
    verifySessionCookieMock.mockResolvedValue({
      user: 'tester',
      role: 'admin',
      expiresAt: Date.now() + 1000 * 60 * 60,
    });
  });

  it('returns 401 when no session and no service token', async () => {
    verifySessionCookieMock.mockResolvedValueOnce(null);

    const req = new Request('http://localhost/api/governance/knowledge/refactor', {
      method: 'POST',
      body: JSON.stringify({ result: RESULT_WITH_DRIFT }),
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/Unauthorized/);
  });

  it('returns 400 when result is missing', async () => {
    const req = new Request('http://localhost/api/governance/knowledge/refactor', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/result/);
  });

  it('returns recompile proposal for drift signal', async () => {
    const req = new Request('http://localhost/api/governance/knowledge/refactor', {
      method: 'POST',
      body: JSON.stringify({ result: RESULT_WITH_DRIFT }),
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.artifactId).toBe('art-001');
    expect(data.data.recommendedAction).toBe('recompile');
    expect(data.data.triggerTypes).toContain('drift');
    expect(data.data.proposalId).toBeDefined();
  });

  it('returns archive proposal for orphan-only signal', async () => {
    const req = new Request('http://localhost/api/governance/knowledge/refactor', {
      method: 'POST',
      body: JSON.stringify({ result: RESULT_WITH_ORPHAN }),
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.recommendedAction).toBe('archive');
    expect(data.data.triggerTypes).toContain('orphan');
  });

  it('returns 500 when result has no issues', async () => {
    const req = new Request('http://localhost/api/governance/knowledge/refactor', {
      method: 'POST',
      body: JSON.stringify({ result: RESULT_NO_ISSUES }),
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/no issues/);
  });
});
