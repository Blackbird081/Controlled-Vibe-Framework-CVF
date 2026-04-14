import { beforeEach, describe, expect, it, vi } from 'vitest';

const verifySessionCookieMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/middleware-auth', () => ({
  verifySessionCookie: verifySessionCookieMock,
}));

import { POST } from './route';

const APPROVED_ARTIFACT = {
  artifactId: 'art-001',
  artifactType: 'concept' as const,
  compiledAt: '2026-01-01T00:00:00.000Z',
  sourceIds: ['src-001'],
  citationRef: 'CVF Knowledge Base §1',
  citationTrail: ['raw-ingest-001 -> compiled-001'],
  contextId: 'ctx-001',
  compiledBy: 'cvf-agent',
  content: 'Knowledge artifact content with keyword governance.',
  artifactHash: 'hash-001',
  governedAt: '2026-01-01T01:00:00.000Z',
  governanceStatus: 'approved' as const,
  rejectionReason: null,
};

describe('/api/governance/knowledge/maintain', () => {
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

    const req = new Request('http://localhost/api/governance/knowledge/maintain', {
      method: 'POST',
      body: JSON.stringify({ artifact: APPROVED_ARTIFACT, checks: [] }),
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/Unauthorized/);
  });

  it('returns 400 when required fields are missing', async () => {
    const req = new Request('http://localhost/api/governance/knowledge/maintain', {
      method: 'POST',
      body: JSON.stringify({ artifact: APPROVED_ARTIFACT }),
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/checks/);
  });

  it('returns maintenance result with no signals when all checks pass', async () => {
    const req = new Request('http://localhost/api/governance/knowledge/maintain', {
      method: 'POST',
      body: JSON.stringify({
        artifact: APPROVED_ARTIFACT,
        checks: [
          { type: 'lint', requiredKeywords: ['governance'] },
          { type: 'orphan', activeSourceIds: ['src-001'] },
        ],
      }),
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.artifactId).toBe('art-001');
    expect(data.data.hasIssues).toBe(false);
    expect(data.data.totalSignals).toBe(0);
    expect(data.data.signals).toHaveLength(0);
  });

  it('returns maintenance result with signals when checks fail', async () => {
    const req = new Request('http://localhost/api/governance/knowledge/maintain', {
      method: 'POST',
      body: JSON.stringify({
        artifact: APPROVED_ARTIFACT,
        checks: [
          { type: 'lint', requiredKeywords: ['missing-keyword-xyz'] },
          { type: 'orphan', activeSourceIds: [] },
        ],
      }),
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.hasIssues).toBe(true);
    expect(data.data.totalSignals).toBeGreaterThan(0);
    expect(data.data.signals[0].signalType).toBeDefined();
  });

  it('returns 500 when artifact is not approved', async () => {
    const pendingArtifact = { ...APPROVED_ARTIFACT, governanceStatus: 'pending' as const, governedAt: null };

    const req = new Request('http://localhost/api/governance/knowledge/maintain', {
      method: 'POST',
      body: JSON.stringify({ artifact: pendingArtifact, checks: [] }),
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/approved/);
  });
});
