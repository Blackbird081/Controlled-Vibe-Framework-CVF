import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import { knowledgeStore } from '@/lib/knowledge-store';
import type { KnowledgeCollectionDefinition } from '@/lib/knowledge-retrieval';

vi.mock('@/lib/admin-session', () => ({
  requireAdminApiSession: vi.fn().mockResolvedValue({ user: { role: 'admin' } }),
  withAdminAuditPayload: vi.fn((session: unknown, payload: unknown) => payload),
}));

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/admin/knowledge/collections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/admin/knowledge/collections', () => {
  beforeEach(() => {
    (knowledgeStore as unknown as { _store: Map<string, KnowledgeCollectionDefinition> })._store.clear();
  });

  it('returns 400 when id is missing', async () => {
    const res = await POST(makeRequest({ name: 'Test' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/id/i);
  });

  it('returns 400 when name is missing', async () => {
    const res = await POST(makeRequest({ id: 'test-col' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/name/i);
  });

  it('creates a new collection', async () => {
    const res = await POST(makeRequest({ id: 'new-col', name: 'New Collection', orgId: null, teamId: null }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.collectionId).toBe('new-col');
    expect(knowledgeStore.getCollection('new-col')).toBeDefined();
  });

  it('returns 409 when collection already exists', async () => {
    knowledgeStore.upsertCollection({ id: 'dup', name: 'Dup', description: '', orgId: null, teamId: null, chunks: [] });
    const res = await POST(makeRequest({ id: 'dup', name: 'Dup' }));
    expect(res.status).toBe(409);
  });

  it('sets orgId and teamId when provided', async () => {
    await POST(makeRequest({ id: 'scoped-col', name: 'Scoped', orgId: 'org_x', teamId: 'team_x' }));
    const col = knowledgeStore.getCollection('scoped-col');
    expect(col?.orgId).toBe('org_x');
    expect(col?.teamId).toBe('team_x');
  });

  it('defaults orgId/teamId to null when empty strings', async () => {
    await POST(makeRequest({ id: 'global-col', name: 'Global', orgId: '', teamId: '' }));
    const col = knowledgeStore.getCollection('global-col');
    expect(col?.orgId).toBeNull();
    expect(col?.teamId).toBeNull();
  });
});
