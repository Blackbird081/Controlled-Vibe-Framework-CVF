import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import { knowledgeStore } from '@/lib/knowledge-store';
import type { KnowledgeCollectionDefinition } from '@/lib/knowledge-retrieval';
import { requireAdminApiSession } from '@/lib/admin-session';

vi.mock('@/lib/admin-session', () => ({
  requireAdminApiSession: vi.fn().mockResolvedValue({ user: { role: 'admin' } }),
  withAdminAuditPayload: vi.fn((session: unknown, payload: unknown) => payload),
}));

const requireAdminApiSessionMock = vi.mocked(requireAdminApiSession);

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
    await POST(makeRequest({ id: 'scoped-col', name: 'Scoped', orgId: 'org_cvf', teamId: 'team_eng' }));
    const col = knowledgeStore.getCollection('scoped-col');
    expect(col?.orgId).toBe('org_cvf');
    expect(col?.teamId).toBe('team_eng');
  });

  it('defaults orgId to the admin org when empty strings', async () => {
    await POST(makeRequest({ id: 'global-col', name: 'Global', orgId: '', teamId: '' }));
    const col = knowledgeStore.getCollection('global-col');
    expect(col?.orgId).toBe('org_cvf');
    expect(col?.teamId).toBeNull();
  });

  it('rejects creating a collection outside the admin org scope', async () => {
    requireAdminApiSessionMock.mockResolvedValueOnce({
      userId: 'usr_external_admin',
      user: 'external-admin',
      role: 'admin',
      orgId: 'org_other',
      teamId: 'team_external',
      expiresAt: Date.now() + 60_000,
      authMode: 'session',
    });
    const res = await POST(makeRequest({ id: 'foreign-col', name: 'Foreign', orgId: 'org_cvf', teamId: '' }));
    expect(res.status).toBe(403);
  });
});
