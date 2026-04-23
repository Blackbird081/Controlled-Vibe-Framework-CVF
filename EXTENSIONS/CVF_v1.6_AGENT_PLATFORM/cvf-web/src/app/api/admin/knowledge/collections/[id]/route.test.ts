import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { PUT, DELETE } from './route';
import { knowledgeStore } from '@/lib/knowledge-store';
import type { KnowledgeCollectionDefinition } from '@/lib/knowledge-retrieval';

vi.mock('@/lib/admin-session', () => ({
  requireAdminApiSession: vi.fn().mockResolvedValue({ user: { role: 'admin' } }),
  withAdminAuditPayload: vi.fn((session: unknown, payload: unknown) => payload),
}));

const SEED: KnowledgeCollectionDefinition = {
  id: 'test-col',
  name: 'Test Collection',
  description: 'desc',
  orgId: null,
  teamId: null,
  chunks: [{ id: 'c1', content: 'content', keywords: ['kw'] }],
};

function makeRequest(method: string, body?: unknown) {
  return new NextRequest('http://localhost/api/admin/knowledge/collections/test-col', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

describe('PUT /api/admin/knowledge/collections/[id]', () => {
  beforeEach(() => {
    (knowledgeStore as unknown as { _store: Map<string, KnowledgeCollectionDefinition> })._store.clear();
    knowledgeStore.upsertCollection({ ...SEED });
  });

  it('returns 404 for unknown collection', async () => {
    const res = await PUT(makeRequest('PUT', { name: 'X' }), { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);
  });

  it('updates the name', async () => {
    const res = await PUT(makeRequest('PUT', { name: 'Updated Name' }), { params: Promise.resolve({ id: 'test-col' }) });
    expect(res.status).toBe(200);
    expect(knowledgeStore.getCollection('test-col')?.name).toBe('Updated Name');
  });

  it('updates orgId and teamId', async () => {
    await PUT(makeRequest('PUT', { orgId: 'org_y', teamId: 'team_y' }), { params: Promise.resolve({ id: 'test-col' }) });
    const col = knowledgeStore.getCollection('test-col');
    expect(col?.orgId).toBe('org_y');
    expect(col?.teamId).toBe('team_y');
  });

  it('preserves chunks when updating name only', async () => {
    await PUT(makeRequest('PUT', { name: 'New Name' }), { params: Promise.resolve({ id: 'test-col' }) });
    expect(knowledgeStore.getCollection('test-col')?.chunks).toHaveLength(1);
  });
});

describe('DELETE /api/admin/knowledge/collections/[id]', () => {
  beforeEach(() => {
    (knowledgeStore as unknown as { _store: Map<string, KnowledgeCollectionDefinition> })._store.clear();
    knowledgeStore.upsertCollection({ ...SEED });
  });

  it('returns 404 for unknown collection', async () => {
    const res = await DELETE(makeRequest('DELETE'), { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);
  });

  it('deletes the collection', async () => {
    const res = await DELETE(makeRequest('DELETE'), { params: Promise.resolve({ id: 'test-col' }) });
    expect(res.status).toBe(200);
    expect(knowledgeStore.getCollection('test-col')).toBeUndefined();
  });
});
