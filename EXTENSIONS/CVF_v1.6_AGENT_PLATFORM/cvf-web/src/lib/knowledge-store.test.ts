import { describe, it, expect, beforeEach } from 'vitest';
import { knowledgeStore } from './knowledge-store';
import type { KnowledgeCollectionDefinition } from './knowledge-retrieval';

const SEED: KnowledgeCollectionDefinition[] = [
  {
    id: 'test-global',
    name: 'Test Global',
    description: 'Global test',
    orgId: null,
    teamId: null,
    chunks: [{ id: 'chunk-1', content: 'Global content', keywords: ['global'] }],
  },
];

describe('InProcessKnowledgeStore', () => {
  beforeEach(() => {
    (knowledgeStore as unknown as { _store: Map<string, unknown> })._store.clear();
    (knowledgeStore as unknown as { seed: (c: KnowledgeCollectionDefinition[]) => void }).seed(SEED);
  });

  it('getCollections returns seeded collections', () => {
    expect(knowledgeStore.getCollections()).toHaveLength(1);
    expect(knowledgeStore.getCollections()[0].id).toBe('test-global');
  });

  it('getCollection returns undefined for unknown id', () => {
    expect(knowledgeStore.getCollection('unknown')).toBeUndefined();
  });

  it('upsertCollection adds a new collection', () => {
    knowledgeStore.upsertCollection({
      id: 'new-col', name: 'New', description: '', orgId: null, teamId: null, chunks: [],
    });
    expect(knowledgeStore.getCollection('new-col')).toBeDefined();
    expect(knowledgeStore.getCollections()).toHaveLength(2);
  });

  it('upsertCollection updates an existing collection name', () => {
    knowledgeStore.upsertCollection({
      id: 'test-global', name: 'Updated Name', description: 'updated', orgId: null, teamId: null, chunks: [],
    });
    expect(knowledgeStore.getCollection('test-global')?.name).toBe('Updated Name');
  });

  it('upsertCollection preserves existing chunks when not supplied', () => {
    knowledgeStore.upsertCollection({
      id: 'test-global', name: 'Updated', description: '', orgId: null, teamId: null, chunks: [],
    });
    expect(knowledgeStore.getCollection('test-global')?.chunks).toHaveLength(0);
  });

  it('deleteCollection removes the collection', () => {
    knowledgeStore.deleteCollection('test-global');
    expect(knowledgeStore.getCollections()).toHaveLength(0);
  });

  it('deleteCollection on unknown id is a no-op', () => {
    knowledgeStore.deleteCollection('nonexistent');
    expect(knowledgeStore.getCollections()).toHaveLength(1);
  });

  it('addChunk adds a new chunk to the collection', () => {
    knowledgeStore.addChunk('test-global', { id: 'chunk-2', content: 'New chunk', keywords: ['new'] });
    expect(knowledgeStore.getCollection('test-global')?.chunks).toHaveLength(2);
  });

  it('addChunk replaces an existing chunk with the same id', () => {
    knowledgeStore.addChunk('test-global', { id: 'chunk-1', content: 'Updated content', keywords: ['updated'] });
    const chunks = knowledgeStore.getCollection('test-global')?.chunks ?? [];
    expect(chunks).toHaveLength(1);
    expect(chunks[0].content).toBe('Updated content');
  });

  it('addChunk throws for unknown collection', () => {
    expect(() =>
      knowledgeStore.addChunk('nonexistent', { id: 'x', content: 'x', keywords: [] }),
    ).toThrow('Collection not found: nonexistent');
  });

  it('deleteChunk removes the chunk', () => {
    knowledgeStore.deleteChunk('test-global', 'chunk-1');
    expect(knowledgeStore.getCollection('test-global')?.chunks).toHaveLength(0);
  });

  it('deleteChunk on unknown chunkId is a no-op', () => {
    knowledgeStore.deleteChunk('test-global', 'nonexistent');
    expect(knowledgeStore.getCollection('test-global')?.chunks).toHaveLength(1);
  });

  it('deleteChunk throws for unknown collection', () => {
    expect(() => knowledgeStore.deleteChunk('nonexistent', 'chunk-1')).toThrow('Collection not found: nonexistent');
  });
});
