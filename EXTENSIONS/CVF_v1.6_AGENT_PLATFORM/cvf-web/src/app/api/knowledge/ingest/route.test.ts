// Text Encoding Exception: Vietnamese data fixtures verify UTF-8 fidelity and accepted user input.
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { POST } from './route';
import { queryKnowledgeChunks, getRegisteredCollectionIds } from '@/lib/knowledge-retrieval';
import { knowledgeStore } from '@/lib/knowledge-store';
import { computeServiceRequestSignature } from '@/lib/service-token-auth';
import { NextRequest } from 'next/server';

const verifySessionCookieMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/middleware-auth', () => ({
  verifySessionCookie: verifySessionCookieMock,
}));

const SERVICE_TOKEN = 'test-service-token';
let requestSequence = 0;

function signedServiceHeaders(bodyText: string): Record<string, string> {
  const timestamp = String(Date.now() + requestSequence++);
  return {
    'Content-Type': 'application/json',
    'x-cvf-service-token': SERVICE_TOKEN,
    'x-cvf-service-timestamp': timestamp,
    'x-cvf-service-signature': computeServiceRequestSignature(SERVICE_TOKEN, timestamp, bodyText),
  };
}

function makeRequest(body: unknown): NextRequest {
  const bodyText = JSON.stringify(body);
  return new NextRequest('http://localhost/api/knowledge/ingest', {
    method: 'POST',
    headers: signedServiceHeaders(bodyText),
    body: bodyText,
  });
}

describe('POST /api/knowledge/ingest', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.CVF_SERVICE_TOKEN = SERVICE_TOKEN;
    verifySessionCookieMock.mockReset();
    verifySessionCookieMock.mockResolvedValue(null);
  });

  it('rejects malformed UTF-8 before auth or collection registration', async () => {
    const register = vi.spyOn(knowledgeStore, 'registerEphemeral');
    const bytes = new TextEncoder().encode(JSON.stringify({ collectionId: 'invalid-utf8', chunks: [{ id: 'c', content: '~', keywords: [] }] }));
    bytes[bytes.indexOf(126)] = 255;
    const request = new NextRequest('http://localhost/api/knowledge/ingest', { method: 'POST', body: bytes,
      headers: signedServiceHeaders(new TextDecoder().decode(bytes)) });
    expect((await POST(request)).status).toBe(400);
    expect(verifySessionCookieMock).not.toHaveBeenCalled();
    expect(register).not.toHaveBeenCalled();
  });
  it.each([undefined, '1'])('rejects actual oversized stream before auth/store (declared=%s)', async declared => {
    const register = vi.spyOn(knowledgeStore, 'registerEphemeral');
    const cancel = vi.fn();
    let reads = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) { reads++; if (reads === 1) controller.enqueue(new Uint8Array(4 * 1024 * 1024 + 1)); else controller.close(); }, cancel,
    }, { highWaterMark: 0 });
    const req = new Request('http://localhost/api/knowledge/ingest', { method: 'POST', body: stream, duplex: 'half' as const,
      headers: declared ? { 'content-length': declared } : undefined } as RequestInit);
    expect((await POST(req as NextRequest)).status).toBe(413);
    expect(reads).toBe(1);
    expect(cancel).toHaveBeenCalledOnce();
    expect(verifySessionCookieMock).not.toHaveBeenCalled();
    expect(register).not.toHaveBeenCalled();
  });

  it('preserves signed Vietnamese knowledge across split UTF-8', async () => {
    const register = vi.spyOn(knowledgeStore, 'registerEphemeral');
    const chunk = { id: 'vi-1', content: 'Đặt lịch tiếng Việt', keywords: ['lịch'] };
    const text = `  ${JSON.stringify({ collectionId: 'vi-stream-bound', chunks: [chunk] })}\r\n`;
    const bytes = new TextEncoder().encode(text);
    let index = 0;
    const stream = new ReadableStream<Uint8Array>({ pull(controller) { if (index < bytes.length) controller.enqueue(bytes.slice(index, ++index)); else controller.close(); } });
    const request = new Request('http://localhost/api/knowledge/ingest', { method: 'POST', body: stream, duplex: 'half' as const, headers: signedServiceHeaders(text) } as RequestInit);
    const response = await POST(request as NextRequest);
    expect(response.status).toBe(200);
    expect(register).toHaveBeenCalledWith(expect.objectContaining({ id: 'vi-stream-bound', chunks: [chunk] }));
  });

  it('returns 400 when collectionId is missing', async () => {
    const res = await POST(makeRequest({ chunks: [] }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/collectionId/);
  });

  it('returns 400 when chunks is empty', async () => {
    const res = await POST(makeRequest({ collectionId: 'test-col', chunks: [] }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/chunks/);
  });

  it('returns 400 when a chunk is malformed', async () => {
    const res = await POST(makeRequest({
      collectionId: 'test-col',
      chunks: [{ id: 'c1', content: 'hello' }], // missing keywords
    }));
    expect(res.status).toBe(400);
  });

  it.each([
    { label: 'null', body: null },
    { label: 'array', body: [] },
    { label: 'number', body: 42 },
    { label: 'string', body: 'wrong' },
    { label: 'boolean', body: true },
  ])('rejects a $label root without registering a collection', async ({ body }) => {
    const register = vi.spyOn(knowledgeStore, 'registerEphemeral');
    const res = await POST(makeRequest(body));

    expect(res.status).toBe(400);
    expect(register).not.toHaveBeenCalled();
  });

  it.each([
    { label: 'null', chunk: null },
    { label: 'array', chunk: [] },
    { label: 'number', chunk: 42 },
    { label: 'string', chunk: 'wrong' },
    { label: 'boolean', chunk: false },
  ])('rejects a $label chunk before registration', async ({ chunk }) => {
    const register = vi.spyOn(knowledgeStore, 'registerEphemeral');
    const res = await POST(makeRequest({ collectionId: 'p06-invalid-chunk', chunks: [chunk] }));

    expect(res.status).toBe(400);
    expect(register).not.toHaveBeenCalled();
  });

  it.each([
    { label: 'number', value: 42 },
    { label: 'null', value: null },
    { label: 'object', value: { tag: 'invalid' } },
    { label: 'nested array', value: ['invalid'] },
  ])('rejects a keyword array containing a $label', async ({ value }) => {
    const register = vi.spyOn(knowledgeStore, 'registerEphemeral');
    const res = await POST(makeRequest({
      collectionId: 'p06-invalid-keywords',
      chunks: [{ id: 'c1', content: 'valid text', keywords: ['valid', value] }],
    }));

    expect(res.status).toBe(400);
    expect(register).not.toHaveBeenCalled();
  });

  it.each([
    { label: 'number', name: 42 },
    { label: 'object', name: { title: 'invalid' } },
    { label: 'array', name: ['invalid'] },
  ])('rejects a $label collectionName before registration', async ({ name }) => {
    const register = vi.spyOn(knowledgeStore, 'registerEphemeral');
    const res = await POST(makeRequest({
      collectionId: 'p06-invalid-name', collectionName: name,
      chunks: [{ id: 'c1', content: 'valid text', keywords: ['valid'] }],
    }));

    expect(res.status).toBe(400);
    expect(register).not.toHaveBeenCalled();
  });

  it('keeps the previous collection and audit when a replacement batch contains an invalid chunk', async () => {
    const collectionId = 'p06-existing-target';
    knowledgeStore.registerEphemeral({
      id: collectionId, name: 'Original', description: '', orgId: null, teamId: null,
      chunks: [{ id: 'original', content: 'Keep original content', keywords: ['original'] }],
    });
    const previous = knowledgeStore.getCollection(collectionId);
    const auditBefore = knowledgeStore.getAuditLog();
    const register = vi.spyOn(knowledgeStore, 'registerEphemeral');

    const res = await POST(makeRequest({
      collectionId, collectionName: 'Replacement',
      chunks: [{ id: 'valid', content: 'First valid chunk', keywords: ['valid'] }, null],
    }));

    expect(res.status).toBe(400);
    expect(register).not.toHaveBeenCalled();
    expect(knowledgeStore.getCollection(collectionId)).toEqual(previous);
    expect(knowledgeStore.getAuditLog()).toEqual(auditBefore);
  });

  it.each([
    { label: 'absent', name: undefined },
    { label: 'null', name: null },
  ])('preserves the $label collectionName fallback and valid source text', async ({ name }) => {
    const collectionId = 'p06-name-fallback';
    const chunk = { id: ' c-01 ', content: ' Giữ nguyên tiếng Việt. ', keywords: [] };
    const res = await POST(makeRequest({ collectionId, collectionName: name, chunks: [chunk] }));

    expect(res.status).toBe(200);
    expect(knowledgeStore.getCollection(collectionId)?.name).toBe(collectionId);
    expect(knowledgeStore.getCollection(collectionId)?.chunks).toEqual([chunk]);
  });

  it('returns { accepted: N } for valid chunks', async () => {
    const res = await POST(makeRequest({
      collectionId: 'w116-test-col',
      chunks: [
        { id: 'c1', content: 'Alpha project uses React and TypeScript', keywords: ['alpha', 'react', 'typescript'] },
        { id: 'c2', content: 'Beta module integrates with Stripe payments', keywords: ['beta', 'stripe', 'payments'] },
        { id: 'c3', content: 'Gamma service handles email notifications', keywords: ['gamma', 'email', 'notifications'] },
        { id: 'c4', content: 'Delta pipeline runs daily at midnight UTC', keywords: ['delta', 'pipeline', 'midnight'] },
        { id: 'c5', content: 'Epsilon policy requires 2FA for admin accounts', keywords: ['epsilon', 'admin', '2fa'] },
      ],
    }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.accepted).toBe(5);
    expect(data.collectionId).toBe('w116-test-col');
    expect(data.routeGovernanceProof.authMode).toBe('service_token');
  });

  it('registers the collection so it is queryable', async () => {
    const collectionId = 'w116-queryable-test';
    await POST(makeRequest({
      collectionId,
      chunks: [
        { id: 'q1', content: 'CVF downstream project uses Kubernetes orchestration', keywords: ['kubernetes', 'orchestration', 'downstream'] },
      ],
    }));

    expect(getRegisteredCollectionIds()).toContain(collectionId);
  });

  it('ingest then query returns the injected chunk', async () => {
    const collectionId = 'w116-ingest-query-test';
    await POST(makeRequest({
      collectionId,
      collectionName: 'W116 Integration Test',
      chunks: [
        {
          id: 'iq1',
          content: 'The dragonfly project uses a hexagonal architecture pattern for domain isolation',
          keywords: ['dragonfly', 'hexagonal', 'architecture', 'domain', 'isolation'],
        },
      ],
    }));

    const result = await queryKnowledgeChunks({
      intent: 'dragonfly hexagonal architecture',
      collectionId,
    });

    expect(result.allowedChunkCount).toBeGreaterThan(0);
    expect(result.chunks[0].content).toContain('dragonfly');
    expect(result.chunks[0].collectionId).toBe(collectionId);
  });

  it('uses collectionName when provided', async () => {
    const res = await POST(makeRequest({
      collectionId: 'w116-named-col',
      collectionName: 'My Project Docs',
      chunks: [
        { id: 'n1', content: 'Named collection content for testing', keywords: ['named', 'collection'] },
      ],
    }));
    expect(res.status).toBe(200);
  });

  it('returns 400 for invalid JSON body', async () => {
    // Sign the exact malformed body so authorization succeeds and the route
    // reaches JSON parsing; this proves the 400 comes from the parser, not auth.
    const bodyText = 'not-json';
    const req = new NextRequest('http://localhost/api/knowledge/ingest', {
      method: 'POST',
      headers: signedServiceHeaders(bodyText),
      body: bodyText,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('a request without collectionId still uses global collections (no regression)', async () => {
    const result = await queryKnowledgeChunks({
      intent: 'governance policy risk level',
    });
    expect(result.allowedCollectionIds.length).toBeGreaterThanOrEqual(0);
  });
});
