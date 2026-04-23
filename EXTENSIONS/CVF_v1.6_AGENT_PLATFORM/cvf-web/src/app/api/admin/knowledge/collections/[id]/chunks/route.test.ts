import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import { knowledgeStore } from '@/lib/knowledge-store';
import type { KnowledgeCollectionDefinition } from '@/lib/knowledge-retrieval';

vi.mock('@/lib/admin-session', () => ({
  requireAdminApiSession: vi.fn().mockResolvedValue({ user: { role: 'admin' } }),
  withAdminAuditPayload: vi.fn((session: unknown, payload: unknown) => payload),
}));

const SEED: KnowledgeCollectionDefinition = {
  id: 'col-a',
  name: 'Col A',
  description: '',
  orgId: null,
  teamId: null,
  chunks: [],
};

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/admin/knowledge/collections/col-a/chunks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/admin/knowledge/collections/[id]/chunks', () => {
  beforeEach(() => {
    (knowledgeStore as unknown as { _store: Map<string, KnowledgeCollectionDefinition> })._store.clear();
    knowledgeStore.upsertCollection({ ...SEED });
  });

  it('returns 404 for unknown collection', async () => {
    const res = await POST(makeRequest({ id: 'c1', content: 'hello', keywords: [] }), {
      params: Promise.resolve({ id: 'nonexistent' }),
    });
    expect(res.status).toBe(404);
  });

  it('returns 400 when chunk id is missing', async () => {
    const res = await POST(makeRequest({ content: 'hello', keywords: [] }), { params: Promise.resolve({ id: 'col-a' }) });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/chunk id/i);
  });

  it('returns 400 when content is missing', async () => {
    const res = await POST(makeRequest({ id: 'c1', keywords: [] }), { params: Promise.resolve({ id: 'col-a' }) });
    expect(res.status).toBe(400);
  });

  it('returns 400 when keywords is not an array', async () => {
    const res = await POST(makeRequest({ id: 'c1', content: 'hello', keywords: 'bad' }), {
      params: Promise.resolve({ id: 'col-a' }),
    });
    expect(res.status).toBe(400);
  });

  it('adds a chunk to the collection', async () => {
    const res = await POST(makeRequest({ id: 'c1', content: 'hello world', keywords: ['hello', 'world'] }), {
      params: Promise.resolve({ id: 'col-a' }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.chunkId).toBe('c1');
    expect(knowledgeStore.getCollection('col-a')?.chunks).toHaveLength(1);
  });
});
