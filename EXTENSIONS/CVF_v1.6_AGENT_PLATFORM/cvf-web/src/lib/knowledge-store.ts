import type { KnowledgeChunk, KnowledgeCollectionDefinition } from './knowledge-retrieval';

export interface KnowledgeStore {
  getCollections(): KnowledgeCollectionDefinition[];
  getCollection(id: string): KnowledgeCollectionDefinition | undefined;
  upsertCollection(def: KnowledgeCollectionDefinition): void;
  deleteCollection(id: string): void;
  addChunk(collectionId: string, chunk: KnowledgeChunk): void;
  deleteChunk(collectionId: string, chunkId: string): void;
}

class InProcessKnowledgeStore implements KnowledgeStore {
  private readonly _store = new Map<string, KnowledgeCollectionDefinition>();

  seed(collections: KnowledgeCollectionDefinition[]): void {
    for (const collection of collections) {
      this._store.set(collection.id, { ...collection, chunks: [...collection.chunks] });
    }
  }

  getCollections(): KnowledgeCollectionDefinition[] {
    return Array.from(this._store.values());
  }

  getCollection(id: string): KnowledgeCollectionDefinition | undefined {
    return this._store.get(id);
  }

  upsertCollection(def: KnowledgeCollectionDefinition): void {
    const existing = this._store.get(def.id);
    this._store.set(def.id, {
      ...def,
      chunks: def.chunks ?? existing?.chunks ?? [],
    });
  }

  deleteCollection(id: string): void {
    this._store.delete(id);
  }

  addChunk(collectionId: string, chunk: KnowledgeChunk): void {
    const collection = this._store.get(collectionId);
    if (!collection) throw new Error(`Collection not found: ${collectionId}`);
    const alreadyExists = collection.chunks.some(c => c.id === chunk.id);
    if (alreadyExists) {
      collection.chunks = collection.chunks.map(c => (c.id === chunk.id ? chunk : c));
    } else {
      collection.chunks = [...collection.chunks, chunk];
    }
    this._store.set(collectionId, collection);
  }

  deleteChunk(collectionId: string, chunkId: string): void {
    const collection = this._store.get(collectionId);
    if (!collection) throw new Error(`Collection not found: ${collectionId}`);
    collection.chunks = collection.chunks.filter(c => c.id !== chunkId);
    this._store.set(collectionId, collection);
  }
}

export const knowledgeStore = new InProcessKnowledgeStore();
