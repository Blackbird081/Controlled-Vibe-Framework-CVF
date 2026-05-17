import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET } from './route';
import { knowledgeStore } from '@/lib/knowledge-store';

vi.mock('@/lib/admin-session', () => ({
  requireAdminApiSession: vi.fn().mockResolvedValue({ user: { role: 'admin' } }),
  withAdminAuditPayload: vi.fn((_session: unknown, payload: unknown) => payload),
}));

function makeGetRequest() {
  return new NextRequest('http://localhost/api/admin/knowledge/audit', { method: 'GET' });
}

describe('GET /api/admin/knowledge/audit', () => {
  beforeEach(() => {
    (knowledgeStore as unknown as { _store: Map<string, unknown> })._store.clear();
    (knowledgeStore as unknown as { _ephemeral: Map<string, unknown> })._ephemeral.clear();
    (knowledgeStore as unknown as { _auditLog: unknown[] })._auditLog.length = 0;
  });

  it('returns 200 with empty entries when no mutations', async () => {
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const data = await res.json() as { entries: unknown[] };
    expect(data.entries).toEqual([]);
  });

  it('returns audit entries after mutations', async () => {
    knowledgeStore.upsertCollection({ id: 'test-col', name: 'Test', description: '', orgId: null, teamId: null, chunks: [] });
    knowledgeStore.addChunk('test-col', { id: 'c1', content: 'hello', keywords: ['hello'] });

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const data = await res.json() as { entries: Array<{ action: string; collectionId: string; ts: string }> };
    expect(data.entries).toHaveLength(2);
    expect(data.entries[0].action).toBe('upsert_collection');
    expect(data.entries[1].action).toBe('add_chunk');
    expect(typeof data.entries[0].ts).toBe('string');
  });

  it('returns 403 when not admin', async () => {
    const { requireAdminApiSession } = await import('@/lib/admin-session');
    vi.mocked(requireAdminApiSession).mockResolvedValueOnce(
      NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    );
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(403);
  });
});
