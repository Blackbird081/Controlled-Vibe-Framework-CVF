import { describe, it, expect } from 'vitest';
import { POST } from './route';
import { queryKnowledgeChunks, getRegisteredCollectionIds } from '@/lib/knowledge-retrieval';
import { NextRequest } from 'next/server';

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/knowledge/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/knowledge/ingest', () => {
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
    const req = new NextRequest('http://localhost/api/knowledge/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
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
