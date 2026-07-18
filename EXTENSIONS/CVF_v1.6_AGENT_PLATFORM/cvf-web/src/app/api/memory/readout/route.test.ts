import { describe, expect, it, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { MEMORY_RUNTIME_READOUT_ROUTE_VERSION } from './route-constants';

const verifySessionCookieMock = vi.hoisted(() => vi.fn());
vi.mock('@/lib/middleware-auth', () => ({
  verifySessionCookie: verifySessionCookieMock,
}));

vi.mock('@/lib/service-token-auth', () => ({
  verifyServiceTokenRequest: vi.fn(() => false),
}));

const baseBody = {
  operationId: 'op-1',
  sessionId: 'sess-1',
  projectId: 'proj-1',
  actorId: 'actor-1',
  actorRole: 'OPERATOR',
  scope: 'proj-1',
  riskLevel: 'R1',
  query: 'memory query',
  tokenBudget: 200,
  candidates: [
    {
      id: 'mem-1',
      scope: 'proj-1',
      summary: 'summary only',
      content: 'RAW_MEMORY_CONTENT_MUST_NOT_LEAK',
      createdAt: Date.now(),
      auditTrust: 0.9,
      lifecycleState: 'semantic',
    },
  ],
};

function makeReq(body: unknown, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/memory/readout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('/api/memory/readout', () => {
  beforeEach(() => {
    verifySessionCookieMock.mockResolvedValue({
      userId: 'user-1', user: 'user', role: 'developer', orgId: 'org', teamId: 'team', expiresAt: Date.now() + 3600_000, authMode: 'session',
    });
  });

  it('returns 401 when unauthenticated', async () => {
    verifySessionCookieMock.mockResolvedValue(null);
    const res = await POST(makeReq(baseBody) as never);
    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid JSON', async () => {
    const res = await POST(makeReq('not-json') as never);
    expect(res.status).toBe(400);
  });

  it('returns 400 on invalid fields', async () => {
    const res = await POST(makeReq({}) as never);
    expect(res.status).toBe(400);
  });

  it('returns 400 on invalid enum fields', async () => {
    const res = await POST(makeReq({ ...baseBody, riskLevel: 'R9' }) as never);
    expect(res.status).toBe(400);
  });

  it('returns 200 with sanitized projection and route version', async () => {
    const res = await POST(makeReq(baseBody) as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.routeVersion).toBe(MEMORY_RUNTIME_READOUT_ROUTE_VERSION);
    expect(json.memoryRuntimeReadout.retrievalResult?.selected?.[0]?.content).toBeUndefined();
    expect(json.rawMemoryReleased).toBe(false);
    expect(json.canReinject).toBe(false);
    expect(json.memoryRuntimeReadout.rawMemoryReleased).toBe(false);
    expect(json.memoryRuntimeReadout.canReinject).toBe(false);
  });

  it('strips sentinel content from serialized response', async () => {
    const res = await POST(makeReq({ ...baseBody, candidates: [{ ...baseBody.candidates[0], summary: `S ${Math.random()}` }] }) as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(JSON.stringify(json)).not.toContain('RAW_MEMORY_CONTENT_MUST_NOT_LEAK');
  });

  it('fails closed when policy denies memory readout', async () => {
    const res = await POST(makeReq({ ...baseBody, policyDecision: 'deny' }) as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.memoryRuntimeReadout.status).toBe('denied');
    expect(json.memoryRuntimeReadout.contextBlock).toBeUndefined();
    expect(json.rawMemoryReleased).toBe(false);
    expect(json.canReinject).toBe(false);
  });
});
