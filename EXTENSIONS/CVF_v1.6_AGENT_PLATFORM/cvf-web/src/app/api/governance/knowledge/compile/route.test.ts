import { beforeEach, describe, expect, it, vi } from 'vitest';

const verifySessionCookieMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/middleware-auth', () => ({
  verifySessionCookie: verifySessionCookieMock,
}));

import { POST } from './route';

const VALID_COMPILE_REQUEST = {
  contextId: 'ctx-001',
  artifactType: 'concept' as const,
  sourceIds: ['src-001'],
  citationRef: 'CVF Knowledge Base §1',
  citationTrail: ['raw-ingest-001 -> compiled-001'],
  compiledBy: 'cvf-agent',
  content: 'Knowledge artifact content for testing purposes.',
};

describe('/api/governance/knowledge/compile', () => {
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

    const req = new Request('http://localhost/api/governance/knowledge/compile', {
      method: 'POST',
      body: JSON.stringify({ compileRequest: VALID_COMPILE_REQUEST }),
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/Unauthorized/);
  });

  it('returns 400 when compileRequest is missing', async () => {
    const req = new Request('http://localhost/api/governance/knowledge/compile', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/compileRequest/);
  });

  it('compiles an artifact with governanceStatus=pending when no governDecision provided', async () => {
    const req = new Request('http://localhost/api/governance/knowledge/compile', {
      method: 'POST',
      body: JSON.stringify({ compileRequest: VALID_COMPILE_REQUEST }),
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.governed).toBe(false);
    expect(data.data.artifact.governanceStatus).toBe('pending');
    expect(data.data.artifact.contextId).toBe('ctx-001');
    expect(data.data.artifact.artifactType).toBe('concept');
    expect(data.data.artifact.compiledBy).toBe('cvf-agent');
  });

  it('compiles and governs to approved when governDecision provided', async () => {
    const req = new Request('http://localhost/api/governance/knowledge/compile', {
      method: 'POST',
      body: JSON.stringify({
        compileRequest: VALID_COMPILE_REQUEST,
        governDecision: { decision: 'approved' },
      }),
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.governed).toBe(true);
    expect(data.data.artifact.governanceStatus).toBe('approved');
    expect(data.data.artifact.governedAt).not.toBeNull();
    expect(data.data.artifact.rejectionReason).toBeNull();
  });

  it('compiles and governs to rejected with reason', async () => {
    const req = new Request('http://localhost/api/governance/knowledge/compile', {
      method: 'POST',
      body: JSON.stringify({
        compileRequest: VALID_COMPILE_REQUEST,
        governDecision: { decision: 'rejected', reason: 'Content does not meet quality standards.' },
      }),
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.governed).toBe(true);
    expect(data.data.artifact.governanceStatus).toBe('rejected');
    expect(data.data.artifact.rejectionReason).toBe('Content does not meet quality standards.');
  });

  it('returns 500 when contract throws (missing required content)', async () => {
    const req = new Request('http://localhost/api/governance/knowledge/compile', {
      method: 'POST',
      body: JSON.stringify({
        compileRequest: { ...VALID_COMPILE_REQUEST, content: '   ' },
      }),
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/content/i);
  });

  it('allows service token bypass in lieu of session', async () => {
    process.env.CVF_SERVICE_TOKEN = 'test-svc';
    verifySessionCookieMock.mockResolvedValueOnce(null);

    const req = new Request('http://localhost/api/governance/knowledge/compile', {
      method: 'POST',
      headers: { 'x-cvf-service-token': 'test-svc' },
      body: JSON.stringify({ compileRequest: VALID_COMPILE_REQUEST }),
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
