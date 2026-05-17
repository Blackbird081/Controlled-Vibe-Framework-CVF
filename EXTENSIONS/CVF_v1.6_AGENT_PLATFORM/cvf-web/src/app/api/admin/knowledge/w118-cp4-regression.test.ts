import { existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InProcessKnowledgeStore, FileBackedKnowledgeStore } from '@/lib/knowledge-store';
import { queryKnowledgeChunks } from '@/lib/knowledge-retrieval';
import { knowledgeStore } from '@/lib/knowledge-store';

vi.mock('@/lib/policy-reader', () => ({
  getKnowledgeCollectionScopes: vi.fn().mockResolvedValue(new Map()),
}));

describe('W118-CP4 Regression: Unified Persistent Knowledge Store', () => {
  describe('Persistence (simulated serialize/deserialize)', () => {
    it('CP4-1: admin-mutated data is reconstructable from serialized store state', () => {
      const storeA = new InProcessKnowledgeStore();
      storeA.upsertCollection({ id: 'persist-col', name: 'Persisted', description: '', orgId: null, teamId: null, chunks: [] });
      storeA.addChunk('persist-col', { id: 'p-chunk-1', content: 'persist content', keywords: ['persist'] });

      const serialized = JSON.stringify(storeA.getCollections().filter(
        c => !storeA.getEphemeralCollectionIds().includes(c.id),
      ));

      const storeB = new InProcessKnowledgeStore();
      storeB.seed(JSON.parse(serialized));

      const col = storeB.getCollection('persist-col');
      expect(col).toBeDefined();
      expect(col?.chunks).toHaveLength(1);
      expect(col?.chunks[0].id).toBe('p-chunk-1');
    });

    it('CP4-2: ephemeral collections are excluded from persistent serialization', () => {
      const store = new InProcessKnowledgeStore();
      store.upsertCollection({ id: 'admin-col', name: 'Admin', description: '', orgId: null, teamId: null, chunks: [] });
      store.registerEphemeral({ id: 'eph-col', name: 'Ephemeral', description: '', orgId: null, teamId: null, chunks: [] });

      const persistentIds = store.getEphemeralCollectionIds();
      const persisted = store.getCollections().filter(c => !persistentIds.includes(c.id));

      expect(persisted.map(c => c.id)).toContain('admin-col');
      expect(persisted.map(c => c.id)).not.toContain('eph-col');
    });
  });

  describe('Unification: single getCollections() surface', () => {
    it('CP4-3: getCollections() returns both persistent and ephemeral collections', () => {
      const store = new InProcessKnowledgeStore();
      store.upsertCollection({ id: 'p-col', name: 'Persistent', description: '', orgId: null, teamId: null, chunks: [] });
      store.registerEphemeral({ id: 'e-col', name: 'Ephemeral', description: '', orgId: null, teamId: null, chunks: [
        { id: 'e1', content: 'ephemeral content', keywords: ['eph'] },
      ] });

      const all = store.getCollections();
      expect(all.map(c => c.id)).toContain('p-col');
      expect(all.map(c => c.id)).toContain('e-col');
    });
  });

  describe('Downstream ingest path (W116 compatibility)', () => {
    beforeEach(() => {
      (knowledgeStore as unknown as { _store: Map<string, unknown> })._store.clear();
      (knowledgeStore as unknown as { _ephemeral: Map<string, unknown> })._ephemeral.clear();
    });

    it('CP4-4: registerEphemeral() collections are queryable via queryKnowledgeChunks', async () => {
      knowledgeStore.registerEphemeral({
        id: 'downstream-project',
        name: 'Downstream Project',
        description: 'Downstream project knowledge',
        orgId: null,
        teamId: null,
        chunks: [{ id: 'd-chunk-1', content: 'downstream deployment guide', keywords: ['deployment', 'guide', 'downstream'] }],
      });

      const result = await queryKnowledgeChunks({ intent: 'deployment guide' });
      expect(result.matchedChunkCount).toBeGreaterThan(0);
      expect(result.chunks.some(c => c.id === 'd-chunk-1')).toBe(true);
    });

    it('CP4-5: scope filter applies to ephemeral collections', async () => {
      knowledgeStore.registerEphemeral({
        id: 'org-scoped-project',
        name: 'Org Scoped',
        description: 'Org-scoped project',
        orgId: 'org_x',
        teamId: 'team_x',
        chunks: [{ id: 'scoped-chunk', content: 'org x private info', keywords: ['private', 'org', 'info'] }],
      });

      const result = await queryKnowledgeChunks({ intent: 'private org info', orgId: 'org_y', teamId: 'team_y' });
      expect(result.chunks.some(c => c.id === 'scoped-chunk')).toBe(false);
    });
  });

  describe('Persistence (real file I/O)', () => {
    let tmpPath: string;

    beforeEach(() => {
      tmpPath = join(tmpdir(), `cvf-test-store-${randomUUID()}.json`);
    });

    afterEach(() => {
      if (existsSync(tmpPath)) rmSync(tmpPath);
    });

    it('CP4-F1: seed file written on first run when no file exists', () => {
      expect(existsSync(tmpPath)).toBe(false);
      const store = new FileBackedKnowledgeStore(tmpPath);
      expect(existsSync(tmpPath)).toBe(true);
      expect(store.getCollections().length).toBeGreaterThan(0);
    });

    it('CP4-F2: mutate store → create new instance from same path → data matches', () => {
      const store1 = new FileBackedKnowledgeStore(tmpPath);
      store1.upsertCollection({ id: 'fb-col', name: 'FileBacked', description: '', orgId: null, teamId: null, chunks: [] });
      store1.addChunk('fb-col', { id: 'fb-chunk', content: 'file backed content', keywords: ['file', 'backed'] });

      const store2 = new FileBackedKnowledgeStore(tmpPath);
      const col = store2.getCollection('fb-col');
      expect(col).toBeDefined();
      expect(col?.chunks).toHaveLength(1);
      expect(col?.chunks[0].id).toBe('fb-chunk');
    });

    it('CP4-F3: ephemeral collections not persisted (absent in reloaded store)', () => {
      const store1 = new FileBackedKnowledgeStore(tmpPath);
      store1.registerEphemeral({ id: 'eph-col', name: 'Ephemeral', description: '', orgId: null, teamId: null, chunks: [] });

      const store2 = new FileBackedKnowledgeStore(tmpPath);
      expect(store2.getCollection('eph-col')).toBeUndefined();
      expect(store2.getEphemeralCollectionIds()).not.toContain('eph-col');
    });
  });

  describe('Audit trail', () => {
    it('CP4-6: fresh store with 2 explicit mutations has audit log length === 2, seed not counted', () => {
      const store = new InProcessKnowledgeStore();
      store.upsertCollection({ id: 'audit-col', name: 'Audit', description: '', orgId: null, teamId: null, chunks: [] });
      store.addChunk('audit-col', { id: 'a-chunk', content: 'audit test content', keywords: ['audit'] });

      const log = store.getAuditLog();
      expect(log).toHaveLength(2);
      expect(log[0].action).toBe('upsert_collection');
      expect(log[0].collectionId).toBe('audit-col');
      expect(log[1].action).toBe('add_chunk');
      expect(log[1].chunkId).toBe('a-chunk');
      expect(typeof log[0].ts).toBe('string');
      expect(new Date(log[0].ts).toISOString()).toBe(log[0].ts);
    });

    it('CP4-7: seed() does not produce audit entries', () => {
      const store = new InProcessKnowledgeStore();
      store.seed([{ id: 'seed-col', name: 'Seed', description: '', orgId: null, teamId: null, chunks: [] }]);

      expect(store.getAuditLog()).toHaveLength(0);
    });

    it('CP4-8: registerEphemeral() produces an audit entry with source runtime_ingest', () => {
      const store = new InProcessKnowledgeStore();
      store.registerEphemeral({ id: 'eph', name: 'Eph', description: '', orgId: null, teamId: null, chunks: [] });

      const log = store.getAuditLog();
      expect(log).toHaveLength(1);
      expect(log[0].action).toBe('register_ephemeral');
      expect(log[0].source).toBe('runtime_ingest');
    });
  });
});
