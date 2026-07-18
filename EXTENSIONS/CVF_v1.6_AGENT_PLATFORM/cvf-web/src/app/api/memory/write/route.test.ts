import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const verifySessionCookieMock = vi.hoisted(() => vi.fn());
const verifyServiceTokenRequestMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/middleware-auth', () => ({
  verifySessionCookie: verifySessionCookieMock,
}));

vi.mock('@/lib/service-token-auth', () => ({
  verifyServiceTokenRequest: verifyServiceTokenRequestMock,
}));

import { POST } from './route';
import { MEMORY_DURABLE_WRITE_ROUTE_VERSION } from './route-constants';

const baseBody = {
  id: 'mke1-e2-memory-1',
  actorId: 'actor-1',
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
      userId: 'user-1',
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

  it('returns 401 when unauthenticated', async () => {
    verifySessionCookieMock.mockResolvedValue(null);
    const res = await POST(makeReq(baseBody) as never);
    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid JSON', async () => {
    const res = await POST(makeReq('not-json') as never);
    expect(res.status).toBe(400);
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
    const res = await POST(makeReq({ ...baseBody, actorAuthorized: false }) as never);
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
    await expect(readFile(storePath, 'utf8')).rejects.toThrow();
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
});
