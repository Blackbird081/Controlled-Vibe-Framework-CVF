import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const verifySessionCookieMock = vi.hoisted(() => vi.fn());
const verifyServiceTokenRequestMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/middleware-auth', () => ({
  verifySessionCookie: verifySessionCookieMock,
}));

vi.mock('@/lib/service-token-auth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/service-token-auth')>(
    '@/lib/service-token-auth',
  );
  return {
    ...actual,
    verifyServiceTokenRequest: verifyServiceTokenRequestMock,
  };
});

import { POST } from './route';
import { MEMORY_DURABLE_WRITE_ROUTE_VERSION } from './route-constants';
import { deriveServiceTokenIdentity } from '@/lib/service-token-auth';

const SESSION_ACTOR_ID = 'user-1';
const SERVICE_TOKEN = 'test-service-token';

const baseBody = {
  id: 'mke1-e2-memory-1',
  actorId: SESSION_ACTOR_ID,
  actorRole: 'OPERATOR',
  scope: 'project:mke1-e2',
  tier: 'skill',
  summary: 'summary-only durable memory write route proof',
  provenanceScore: 0.95,
  policyDecision: 'allow',
  actorAuthorized: true,
  lifecycleState: 'semantic',
  sensitivity: 'internal',
};

function makeReq(body: unknown, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/memory/write', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('/api/memory/write', () => {
  const originalEnv = { ...process.env };
  let tempDir = '';
  let storePath = '';

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-mke1-e2-memory-write-'));
    storePath = path.join(tempDir, 'durable-memory.json');
    process.env = { ...originalEnv, CVF_DURABLE_MEMORY_STORE_PATH: storePath };
    verifyServiceTokenRequestMock.mockReturnValue(false);
    verifySessionCookieMock.mockResolvedValue({
      userId: SESSION_ACTOR_ID,
      user: 'user',
      role: 'admin',
      orgId: 'org',
      teamId: 'team',
      expiresAt: Date.now() + 3600_000,
      authMode: 'session',
    });
  });

  afterEach(async () => {
    process.env = { ...originalEnv };
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
    verifySessionCookieMock.mockReset();
    verifyServiceTokenRequestMock.mockReset();
  });

  async function expectNoStoreMutation() {
    await expect(readFile(storePath, 'utf8')).rejects.toThrow();
  }

  it('returns 401 when unauthenticated', async () => {
    verifySessionCookieMock.mockResolvedValue(null);
    const res = await POST(makeReq(baseBody) as never);
    expect(res.status).toBe(401);
    await expectNoStoreMutation();
  });

  it('returns 400 on invalid JSON', async () => {
    const res = await POST(makeReq('not-json') as never);
    expect(res.status).toBe(400);
    await expectNoStoreMutation();
  });

  it('fails closed when the durable memory store path is not configured', async () => {
    delete process.env.CVF_DURABLE_MEMORY_STORE_PATH;
    const res = await POST(makeReq(baseBody) as never);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.durableMemoryWriteReceipt).toMatchObject({
      operation: 'write',
      decision: 'denied',
      reason: 'durable_memory_write_store_not_configured',
      summaryOnly: true,
      canReinject: false,
      rawMemoryReleased: false,
    });
  });

  it('denies unauthorized actor policy without writing durable memory', async () => {
    const res = await POST(makeReq({ ...baseBody, actorAuthorized: false, policyDecision: 'deny' }) as never);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.routeVersion).toBe(MEMORY_DURABLE_WRITE_ROUTE_VERSION);
    expect(json.durableMemoryWriteReceipt).toMatchObject({
      operation: 'write',
      decision: 'denied',
      reason: 'durable_memory_policy_denied',
      summaryOnly: true,
      canReinject: false,
      rawMemoryReleased: false,
    });
    await expectNoStoreMutation();
  });

  it('rejects raw content fields before durable store write', async () => {
    const res = await POST(makeReq({ ...baseBody, content: 'RAW_MEMORY_CONTENT_MUST_NOT_LEAK' }) as never);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.durableMemoryWriteReceipt).toMatchObject({
      operation: 'write',
      decision: 'denied',
      reason: 'raw_memory_payload_rejected',
      summaryOnly: true,
      canReinject: false,
      rawMemoryReleased: false,
    });
    expect(JSON.stringify(json)).not.toContain('RAW_MEMORY_CONTENT_MUST_NOT_LEAK');
    await expectNoStoreMutation();
  });

  it('writes authorized summary-only durable memory and returns receipt invariants', async () => {
    const res = await POST(makeReq(baseBody) as never);
    const json = await res.json();
    const persisted = JSON.parse(await readFile(storePath, 'utf8')) as Array<{ summary: string; id: string }>;

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.routeVersion).toBe(MEMORY_DURABLE_WRITE_ROUTE_VERSION);
    expect(json.durableMemoryWriteReceipt).toMatchObject({
      operation: 'write',
      decision: 'allowed',
      reason: 'durable_memory_write_authorized',
      memoryIds: ['mke1-e2-memory-1'],
      durablePersistence: true,
      crossSession: true,
      summaryOnly: true,
      canReinject: false,
      rawMemoryReleased: false,
    });
    expect(json.rawMemoryReleased).toBe(false);
    expect(json.canReinject).toBe(false);
    expect(json.record).toBeUndefined();
    expect(persisted).toHaveLength(1);
    expect(persisted[0]).toMatchObject({
      id: 'mke1-e2-memory-1',
      summary: 'summary-only durable memory write route proof',
    });
  });

  it('rejects omitted provenance score', async () => {
    const { provenanceScore: _drop, ...rest } = baseBody;
    const res = await POST(makeReq(rest) as never);
    expect(res.status).toBe(400);
    await expectNoStoreMutation();
  });

  it.each([-0.01, 1.01, -1])('rejects out-of-range provenance score %s', async (provenanceScore) => {
    const res = await POST(makeReq({ ...baseBody, provenanceScore }) as never);
    expect(res.status).toBe(400);
    await expectNoStoreMutation();
  });

  it('accepts zero at the route boundary but denies it at the durable-store provenance threshold', async () => {
    const res = await POST(makeReq({ ...baseBody, provenanceScore: 0 }) as never);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.durableMemoryWriteReceipt).toMatchObject({
      decision: 'denied',
      reason: 'low_provenance_score',
    });
    await expectNoStoreMutation();
  });

  it('accepts the valid 0.7 boundary provenance score', async () => {
    const res = await POST(makeReq({ ...baseBody, provenanceScore: 0.7 }) as never);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.durableMemoryWriteReceipt.decision).toBe('allowed');
  });

  it.each(['id', 'scope', 'summary', 'actorId'])('rejects blank required string %s', async (field) => {
    const res = await POST(makeReq({ ...baseBody, [field]: '   ' }) as never);
    expect(res.status).toBe(400);
    await expectNoStoreMutation();
  });

  it('rejects missing caller policy field', async () => {
    const { policyDecision: _drop, ...rest } = baseBody;
    const res = await POST(makeReq(rest) as never);
    expect(res.status).toBe(400);
    await expectNoStoreMutation();
  });

  it('rejects missing caller actor-authorization field', async () => {
    const { actorAuthorized: _drop, ...rest } = baseBody;
    const res = await POST(makeReq(rest) as never);
    expect(res.status).toBe(400);
    await expectNoStoreMutation();
  });

  it('rejects false caller actor-authorization intent after identity binding', async () => {
    const res = await POST(makeReq({ ...baseBody, actorAuthorized: false }) as never);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.durableMemoryWriteReceipt).toMatchObject({
      decision: 'denied',
      reason: 'durable_memory_policy_denied',
    });
    await expectNoStoreMutation();
  });

  it('rejects unsupported session role', async () => {
    verifySessionCookieMock.mockResolvedValue({
      userId: SESSION_ACTOR_ID,
      user: 'user',
      role: 'unsupported-role',
      orgId: 'org',
      teamId: 'team',
      expiresAt: Date.now() + 3600_000,
      authMode: 'session',
    });
    const res = await POST(makeReq(baseBody) as never);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.durableMemoryWriteReceipt).toMatchObject({
      decision: 'denied',
      reason: 'durable_memory_policy_denied',
    });
    await expectNoStoreMutation();
  });

  it('rejects session actor-id mismatch', async () => {
    const res = await POST(makeReq({ ...baseBody, actorId: 'someone-else' }) as never);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.durableMemoryWriteReceipt).toMatchObject({
      decision: 'denied',
      reason: 'durable_memory_policy_denied',
    });
    await expectNoStoreMutation();
  });

  it('rejects session actor-role escalation', async () => {
    const res = await POST(makeReq({ ...baseBody, actorRole: 'GOVERNOR' }) as never);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.durableMemoryWriteReceipt).toMatchObject({
      decision: 'denied',
      reason: 'durable_memory_policy_denied',
    });
    await expectNoStoreMutation();
  });

  it('binds and writes a valid service-token request', async () => {
    verifySessionCookieMock.mockResolvedValue(null);
    verifyServiceTokenRequestMock.mockReturnValue(true);
    const boundIdentity = deriveServiceTokenIdentity(SERVICE_TOKEN);

    const res = await POST(
      makeReq(
        { ...baseBody, actorId: boundIdentity, actorRole: 'SERVICE_AGENT' },
        {
          'x-cvf-service-token': SERVICE_TOKEN,
          'x-cvf-service-signature': 'sig',
          'x-cvf-service-timestamp': String(Date.now()),
        },
      ) as never,
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.durableMemoryWriteReceipt.decision).toBe('allowed');
  });

  it('rejects service-token actor-id mismatch', async () => {
    verifySessionCookieMock.mockResolvedValue(null);
    verifyServiceTokenRequestMock.mockReturnValue(true);

    const res = await POST(
      makeReq(
        { ...baseBody, actorId: 'wrong-service-identity', actorRole: 'SERVICE_AGENT' },
        {
          'x-cvf-service-token': SERVICE_TOKEN,
          'x-cvf-service-signature': 'sig',
          'x-cvf-service-timestamp': String(Date.now()),
        },
      ) as never,
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.durableMemoryWriteReceipt).toMatchObject({
      decision: 'denied',
      reason: 'durable_memory_policy_denied',
    });
    await expectNoStoreMutation();
  });

  it('rejects service-token non-SERVICE_AGENT role claim', async () => {
    verifySessionCookieMock.mockResolvedValue(null);
    verifyServiceTokenRequestMock.mockReturnValue(true);
    const boundIdentity = deriveServiceTokenIdentity(SERVICE_TOKEN);

    const res = await POST(
      makeReq(
        { ...baseBody, actorId: boundIdentity, actorRole: 'OPERATOR' },
        {
          'x-cvf-service-token': SERVICE_TOKEN,
          'x-cvf-service-signature': 'sig',
          'x-cvf-service-timestamp': String(Date.now()),
        },
      ) as never,
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.durableMemoryWriteReceipt).toMatchObject({
      decision: 'denied',
      reason: 'durable_memory_policy_denied',
    });
    await expectNoStoreMutation();
  });

  it('rejects malformed containsSecret', async () => {
    const res = await POST(makeReq({ ...baseBody, containsSecret: 'yes' }) as never);
    expect(res.status).toBe(400);
    await expectNoStoreMutation();
  });
});
