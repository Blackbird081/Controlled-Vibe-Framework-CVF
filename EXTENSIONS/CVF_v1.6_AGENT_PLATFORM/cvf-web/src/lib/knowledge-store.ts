import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { KNOWLEDGE_COLLECTIONS } from './knowledge-seed';

export interface KnowledgeChunk {
  id: string;
  content: string;
  keywords: string[];
}

export interface KnowledgeCollectionDefinition {
  id: string;
  name: string;
  description: string;
  orgId: string | null;
  teamId: string | null;
  chunks: KnowledgeChunk[];
}

export interface KnowledgeStoreAuditEntry {
  ts: string;
  action: 'upsert_collection' | 'delete_collection' | 'add_chunk' | 'delete_chunk' | 'register_ephemeral';
  collectionId: string;
  chunkId?: string;
  source: 'admin_api' | 'runtime_ingest';
}

export interface KnowledgeStore {
  getCollections(): KnowledgeCollectionDefinition[];
  getCollection(id: string): KnowledgeCollectionDefinition | undefined;
  upsertCollection(def: KnowledgeCollectionDefinition): void;
  deleteCollection(id: string): void;
  addChunk(collectionId: string, chunk: KnowledgeChunk): void;
  deleteChunk(collectionId: string, chunkId: string): void;
  seed(collections: KnowledgeCollectionDefinition[]): void;
  registerEphemeral(collection: KnowledgeCollectionDefinition): void;
  getEphemeralCollectionIds(): string[];
  getAuditLog(): KnowledgeStoreAuditEntry[];
}

export class InProcessKnowledgeStore implements KnowledgeStore {
  protected readonly _store = new Map<string, KnowledgeCollectionDefinition>();
  protected readonly _ephemeral = new Map<string, KnowledgeCollectionDefinition>();
  private readonly _auditLog: KnowledgeStoreAuditEntry[] = [];

  private _audit(entry: Omit<KnowledgeStoreAuditEntry, 'ts'>): void {
    this._auditLog.push({ ...entry, ts: new Date().toISOString() });
  }

  seed(collections: KnowledgeCollectionDefinition[]): void {
    for (const collection of collections) {
      this._store.set(collection.id, { ...collection, chunks: [...collection.chunks] });
    }
  }

  getCollections(): KnowledgeCollectionDefinition[] {
    return [...Array.from(this._store.values()), ...Array.from(this._ephemeral.values())];
  }

  getCollection(id: string): KnowledgeCollectionDefinition | undefined {
    return this._store.get(id) ?? this._ephemeral.get(id);
  }

  upsertCollection(def: KnowledgeCollectionDefinition): void {
    const existing = this._store.get(def.id);
    this._store.set(def.id, { ...def, chunks: def.chunks ?? existing?.chunks ?? [] });
    this._audit({ action: 'upsert_collection', collectionId: def.id, source: 'admin_api' });
  }

  deleteCollection(id: string): void {
    this._store.delete(id);
    this._audit({ action: 'delete_collection', collectionId: id, source: 'admin_api' });
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
    this._audit({ action: 'add_chunk', collectionId, chunkId: chunk.id, source: 'admin_api' });
  }

  deleteChunk(collectionId: string, chunkId: string): void {
    const collection = this._store.get(collectionId);
    if (!collection) throw new Error(`Collection not found: ${collectionId}`);
    collection.chunks = collection.chunks.filter(c => c.id !== chunkId);
    this._store.set(collectionId, collection);
    this._audit({ action: 'delete_chunk', collectionId, chunkId, source: 'admin_api' });
  }

  registerEphemeral(collection: KnowledgeCollectionDefinition): void {
    this._ephemeral.set(collection.id, collection);
    this._audit({ action: 'register_ephemeral', collectionId: collection.id, source: 'runtime_ingest' });
  }

  getEphemeralCollectionIds(): string[] {
    return Array.from(this._ephemeral.keys());
  }

  getAuditLog(): KnowledgeStoreAuditEntry[] {
    return [...this._auditLog];
  }
}

export class FileBackedKnowledgeStore extends InProcessKnowledgeStore {
  constructor(private readonly _filePath: string) {
    super();
    this._loadOrSeed();
  }

  private _loadOrSeed(): void {
    if (existsSync(this._filePath)) {
      try {
        const raw = JSON.parse(readFileSync(this._filePath, 'utf8')) as KnowledgeCollectionDefinition[];
        for (const col of raw) {
          this._store.set(col.id, { ...col, chunks: [...(col.chunks ?? [])] });
        }
        return;
      } catch {
        // corrupt file — fall through to seed from defaults
      }
    }
    for (const col of KNOWLEDGE_COLLECTIONS) {
      this._store.set(col.id, { ...col, chunks: [...col.chunks] });
    }
    this._persist();
  }

  private _persist(): void {
    try {
      mkdirSync(dirname(this._filePath), { recursive: true });
      const tmp = `${this._filePath}.tmp`;
      writeFileSync(tmp, JSON.stringify(Array.from(this._store.values()), null, 2), 'utf8');
      renameSync(tmp, this._filePath);
    } catch (e) {
      console.warn('[knowledge-store] persist failed:', e);
    }
  }

  override upsertCollection(def: KnowledgeCollectionDefinition): void {
    super.upsertCollection(def);
    this._persist();
  }

  override deleteCollection(id: string): void {
    super.deleteCollection(id);
    this._persist();
  }

  override addChunk(collectionId: string, chunk: KnowledgeChunk): void {
    super.addChunk(collectionId, chunk);
    this._persist();
  }

  override deleteChunk(collectionId: string, chunkId: string): void {
    super.deleteChunk(collectionId, chunkId);
    this._persist();
  }
}

function createStore(): KnowledgeStore {
  if (process.env.NODE_ENV === 'test') {
    return new InProcessKnowledgeStore();
  }
  const storePath =
    process.env.KNOWLEDGE_STORE_PATH ?? join(process.cwd(), '.data', 'knowledge-store.json');
  return new FileBackedKnowledgeStore(storePath);
}

export const knowledgeStore: KnowledgeStore = createStore();
