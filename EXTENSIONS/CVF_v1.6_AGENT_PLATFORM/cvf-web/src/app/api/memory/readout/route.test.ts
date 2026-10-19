import { describe, expect, it, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { MEMORY_RUNTIME_READOUT_ROUTE_VERSION } from './route-constants';
import * as memoryReadout from '@/lib/memory-runtime-readout';

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

  it.each([
    { policyDecision: null }, { policyDecision: false }, { policyDecision: {} },
    { containsSensitiveData: 'true' }, { containsSensitiveData: null },
    { maxResults: '2' }, { maxResults: null },
    { candidates: [{ ...baseBody.candidates[0], containsSecret: 'true' }] },
    { candidates: [{ ...baseBody.candidates[0], containsSecret: null }] },
    { candidates: [{ ...baseBody.candidates[0], content: {} }] },
    { candidates: [{ ...baseBody.candidates[0], content: null }] },
  ])('rejects malformed optional fields before projection %#', async (override) => {
    const projection = vi.spyOn(memoryReadout, 'buildMemoryRuntimeReadout');
    try {
      const response = await POST(makeReq({ ...baseBody, ...override }) as never);
      expect(response.status).toBe(400);
      expect(projection).not.toHaveBeenCalled();
      expect((await response.json()).memoryRuntimeReadout).toBeUndefined();
    } finally { projection.mockRestore(); }
  });

  it.each(['tokenBudget', 'maxResults', 'createdAt'])('rejects overflowing JSON %s before projection', async (field) => {
    const candidate = field === 'createdAt' ? { ...baseBody.candidates[0], createdAt: '~' } : baseBody.candidates[0];
    const payload = { ...baseBody, candidates: [candidate], ...(field === 'createdAt' ? {} : { [field]: '~' }) };
    const rawBody = JSON.stringify(payload).replace('"~"', '1e309');
    const projection = vi.spyOn(memoryReadout, 'buildMemoryRuntimeReadout');
    try {
      const response = await POST(makeReq(rawBody) as never);
      expect(response.status).toBe(400);
      expect(projection).not.toHaveBeenCalled();
    } finally { projection.mockRestore(); }
  });

  it('preserves valid optional fields and explicit false flags', async () => {
    const response = await POST(makeReq({ ...baseBody, maxResults: 1, policyDecision: 'allow', containsSensitiveData: false,
      candidates: [{ ...baseBody.candidates[0], containsSecret: false }],
    }) as never);
    expect(response.status).toBe(200);
    expect((await response.json()).rawMemoryReleased).toBe(false);
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

// EAFR-R5 route admission boundary: candidate auditTrust must be a finite number
// inside the closed interval [0,1] before any workflow projection is constructed.
// Malformed or out-of-range trust rejects the whole request with HTTP 400.
describe('/api/memory/readout EAFR-R5 candidate trust admission', () => {
  beforeEach(() => {
    verifySessionCookieMock.mockResolvedValue({
      userId: 'user-1', user: 'user', role: 'developer', orgId: 'org', teamId: 'team', expiresAt: Date.now() + 3600_000, authMode: 'session',
    });
  });

  function withTrust(trust: unknown) {
    const candidate: Record<string, unknown> = { ...baseBody.candidates[0] };
    if (trust === undefined) {
      delete candidate.auditTrust;
    } else {
      candidate.auditTrust = trust;
    }
    return { ...baseBody, candidates: [candidate] };
  }

  const invalidTrustVectors: readonly { label: string; value: unknown }[] = [
    { label: 'missing', value: undefined },
    { label: 'null', value: null },
    { label: 'string', value: '0.9' },
    { label: 'below zero', value: -0.01 },
    { label: 'above one', value: 1.01 },
  ];

  for (const vector of invalidTrustVectors) {
    it(`returns 400 and no success projection for ${vector.label} auditTrust`, async () => {
      const res = await POST(makeReq(withTrust(vector.value)) as never);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.memoryRuntimeReadout).toBeUndefined();
    });
  }

  for (const vector of [
    { label: 'positive overflow', literal: '1e309' },
    { label: 'negative overflow', literal: '-1e309' },
  ] as const) {
    it(`returns 400 for raw JSON ${vector.label} auditTrust`, async () => {
      const rawBody = JSON.stringify(baseBody).replace(
        '"auditTrust":0.9',
        `"auditTrust":${vector.literal}`,
      );
      const res = await POST(makeReq(rawBody) as never);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.memoryRuntimeReadout).toBeUndefined();
    });
  }

  const boundaryVectors: readonly { label: string; value: number }[] = [
    { label: 'zero', value: 0 },
    { label: 'one', value: 1 },
  ];

  for (const boundary of boundaryVectors) {
    it(`accepts exact boundary auditTrust ${boundary.label} with a sanitized readout`, async () => {
      const res = await POST(makeReq(withTrust(boundary.value)) as never);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.memoryRuntimeReadout.retrievalResult?.selected?.[0]?.content).toBeUndefined();
      expect(JSON.stringify(json)).not.toContain('RAW_MEMORY_CONTENT_MUST_NOT_LEAK');
      expect(json.rawMemoryReleased).toBe(false);
      expect(json.canReinject).toBe(false);
      expect(json.memoryRuntimeReadout.rawMemoryReleased).toBe(false);
      expect(json.memoryRuntimeReadout.canReinject).toBe(false);
    });
  }

  it('rejects the whole request when any one candidate carries invalid trust', async () => {
    const res = await POST(makeReq({
      ...baseBody,
      candidates: [
        { ...baseBody.candidates[0], id: 'mem-ok', auditTrust: 0.5 },
        { ...baseBody.candidates[0], id: 'mem-bad', auditTrust: Number.NaN },
      ],
    }) as never);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.memoryRuntimeReadout).toBeUndefined();
  });

  it('keeps authentication ahead of candidate trust parsing', async () => {
    verifySessionCookieMock.mockResolvedValue(null);
    const res = await POST(makeReq(withTrust(1.01)) as never);
    expect(res.status).toBe(401);
  });
});
