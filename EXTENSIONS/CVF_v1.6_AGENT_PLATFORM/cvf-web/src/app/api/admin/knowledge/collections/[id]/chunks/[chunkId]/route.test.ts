import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

import { requireAdminApiSession } from '@/lib/admin-session';
import { knowledgeStore } from '@/lib/knowledge-store';
import type { KnowledgeCollectionDefinition } from '@/lib/knowledge-retrieval';

vi.mock('@/lib/admin-session', () => ({
  requireAdminApiSession: vi.fn().mockResolvedValue({ user: { role: 'admin' } }),
  withAdminAuditPayload: vi.fn((session: unknown, payload: unknown) => payload),
}));

const requireAdminApiSessionMock = vi.mocked(requireAdminApiSession);

import { DELETE } from './route';

const SEED: KnowledgeCollectionDefinition = {
  id: 'col-a',
  name: 'Col A',
  description: '',
  orgId: 'org_cvf',
  teamId: 'team_exec',
  chunks: [{ id: 'c1', content: 'hello world', keywords: ['hello', 'world'] }],
};

function makeRequest() {
  return new NextRequest('http://localhost/api/admin/knowledge/collections/col-a/chunks/c1', {
    method: 'DELETE',
  });
}

describe('DELETE /api/admin/knowledge/collections/[id]/chunks/[chunkId]', () => {
  beforeEach(() => {
    (knowledgeStore as unknown as { _store: Map<string, KnowledgeCollectionDefinition> })._store.clear();
    knowledgeStore.upsertCollection({ ...SEED });
    requireAdminApiSessionMock.mockReset();
    requireAdminApiSessionMock.mockResolvedValue({
      userId: 'usr_2',
      user: 'admin',
      role: 'admin',
      orgId: 'org_cvf',
      teamId: 'team_exec',
      expiresAt: Date.now() + 60_000,
      authMode: 'session',
    });
  });

  it('returns 404 for unknown collection', async () => {
    const res = await DELETE(makeRequest(), { params: Promise.resolve({ id: 'missing', chunkId: 'c1' }) });
    expect(res.status).toBe(404);
  });

  it('deletes a chunk from an in-scope collection', async () => {
    const res = await DELETE(makeRequest(), { params: Promise.resolve({ id: 'col-a', chunkId: 'c1' }) });
    expect(res.status).toBe(200);
    expect(knowledgeStore.getCollection('col-a')?.chunks).toHaveLength(0);
  });

  it('rejects deleting a chunk from an out-of-scope collection', async () => {
    knowledgeStore.upsertCollection({
      ...SEED,
      id: 'foreign-col',
      orgId: 'org_other',
      teamId: 'team_other',
      chunks: [{ id: 'c9', content: 'secret', keywords: ['secret'] }],
    });
    const res = await DELETE(makeRequest(), { params: Promise.resolve({ id: 'foreign-col', chunkId: 'c9' }) });
    expect(res.status).toBe(403);
  });
});
