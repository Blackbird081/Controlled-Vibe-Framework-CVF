/**
 * W117-CP4 Integration: collection added via admin API is retrievable via queryKnowledgeChunks.
 * Proves the writable store is wired into the execute-path retrieval function.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as createCollection } from './collections/route';
import { POST as addChunk } from './collections/[id]/chunks/route';
import { knowledgeStore } from '@/lib/knowledge-store';
import { queryKnowledgeChunks } from '@/lib/knowledge-retrieval';
import type { KnowledgeCollectionDefinition } from '@/lib/knowledge-retrieval';

vi.mock('@/lib/admin-session', () => ({
  requireAdminApiSession: vi.fn().mockResolvedValue({ user: { role: 'admin' } }),
  withAdminAuditPayload: vi.fn((session: unknown, payload: unknown) => payload),
}));

vi.mock('@/lib/policy-reader', () => ({
  getKnowledgeCollectionScopes: vi.fn().mockResolvedValue(new Map()),
}));

describe('W117-CP4 — writable store integration', () => {
  beforeEach(() => {
    (knowledgeStore as unknown as { _store: Map<string, KnowledgeCollectionDefinition>; })._store.clear();
    (knowledgeStore as unknown as { seed: (c: KnowledgeCollectionDefinition[]) => void }).seed([]);
  });

  it('BASELINE: new collection not yet added → 0 chunks returned', async () => {
    const result = await queryKnowledgeChunks({ intent: 'alpha-bravo ingestion test unique' });
    expect(result.chunks).toHaveLength(0);
  });

  it('DELTA: collection added via createCollection + addChunk is retrievable via queryKnowledgeChunks', async () => {
    const colRes = await createCollection(
      new NextRequest('http://localhost/api/admin/knowledge/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'w117-test-col', name: 'W117 Test Collection', orgId: null, teamId: null }),
      }),
    );
    expect((await colRes.json()).success).toBe(true);

    const chunkRes = await addChunk(
      new NextRequest('http://localhost/api/admin/knowledge/collections/w117-test-col/chunks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'w117-chunk-1',
          content: 'alpha-bravo ingestion test unique content from W117',
          keywords: ['alpha-bravo', 'w117', 'ingestion'],
        }),
      }),
      { params: Promise.resolve({ id: 'w117-test-col' }) },
    );
    expect((await chunkRes.json()).success).toBe(true);

    const result = await queryKnowledgeChunks({ intent: 'alpha-bravo ingestion test unique' });
    expect(result.chunks.length).toBeGreaterThan(0);
    expect(result.chunks[0].collectionId).toBe('w117-test-col');
    expect(result.chunks[0].score).toBeGreaterThan(0);
  });

  it('DELETE collection removes it from retrieval results', async () => {
    await createCollection(
      new NextRequest('http://localhost/api/admin/knowledge/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'w117-del-col', name: 'W117 Delete Collection', orgId: null, teamId: null }),
      }),
    );
    await addChunk(
      new NextRequest('http://localhost/api/admin/knowledge/collections/w117-del-col/chunks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'del-chunk-1',
          content: 'delta-echo unique retrieval marker for deletion test',
          keywords: ['delta-echo', 'deletion'],
        }),
      }),
      { params: Promise.resolve({ id: 'w117-del-col' }) },
    );

    const before = await queryKnowledgeChunks({ intent: 'delta-echo unique retrieval marker' });
    expect(before.chunks.length).toBeGreaterThan(0);

    knowledgeStore.deleteCollection('w117-del-col');

    const after = await queryKnowledgeChunks({ intent: 'delta-echo unique retrieval marker' });
    expect(after.chunks).toHaveLength(0);
  });

  it('knowledgeInjection metadata field is populated when chunks are found', async () => {
    await createCollection(
      new NextRequest('http://localhost/api/admin/knowledge/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'w117-inject-col', name: 'W117 Injection Test', orgId: null, teamId: null }),
      }),
    );
    await addChunk(
      new NextRequest('http://localhost/api/admin/knowledge/collections/w117-inject-col/chunks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'inject-chunk-1',
          content: 'foxtrot-golf unique injection validation content',
          keywords: ['foxtrot-golf', 'injection', 'validation'],
        }),
      }),
      { params: Promise.resolve({ id: 'w117-inject-col' }) },
    );

    const result = await queryKnowledgeChunks({ intent: 'foxtrot-golf injection validation' });
    expect(result.allowedChunkCount).toBeGreaterThan(0);
    expect(result.allowedCollectionIds).toContain('w117-inject-col');
    expect(result.matchedChunkCount).toBeGreaterThan(0);
  });
});
