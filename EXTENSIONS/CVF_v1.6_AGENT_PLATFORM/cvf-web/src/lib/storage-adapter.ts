/**
 * CVF Storage Adapter
 *
 * Pluggable storage adapter interface for CVF durable evidence and snapshot stores.
 * DUR2 extends DUR1 by making the I/O backend selectable via CVF_STORAGE_ADAPTER_TYPE:
 *   - FileEventListAdapter / FileKeyValueAdapter: wraps DUR1 file-backed I/O (default)
 *   - RedisEventListAdapter: atomic distributed append with bounded retention
 *   - RedisKeyValueAdapter: stub for a future Redis key-value backend
 *   - SQLiteEventListAdapter / SQLiteKeyValueAdapter: local durable SQLite backend
 *
 * ERH_DUR2_MARKER: EXTERNAL_STORAGE_ADAPTER_ACTIVE
 * CVF_STORAGE_ADAPTER_VERSION: 2026-06-05
 *
 * Claim boundary: adapter interface contract and file-backed implementation only.
 * Redis list capability is static and does not claim external liveness or
 * writability. SQLite is local process storage only.
 *
 * Env: CVF_STORAGE_ADAPTER_TYPE - 'file' (default) | 'sqlite' | 'redis'
 * Secret-safe: adapters carry structured governance records only; raw prompts,
 * raw AI output, API keys, provider secrets, and private memory payloads are
 * forbidden from adapter records.
 */

import { mkdirSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Redis } from '@upstash/redis';

// ─── Interfaces ────────────────────────────────────────────────────────────────

/**
 * Adapter for list-backed stores (e.g. control-plane event store).
 * All operations target a single named store key (file path or Redis key prefix).
 */
export interface EventListAdapter<T = unknown> {
  readonly adapterType: string;
  /** Ensure the store exists and is initialized. */
  init(storeKey: string): Promise<void>;
  /** Read all items. Returns [] if store is empty or unreadable. */
  readAll(storeKey: string): Promise<T[]>;
  /** Replace all items in the store. */
  writeAll(storeKey: string, items: T[]): Promise<void>;
  /** Append one item. Distributed implementations make retention atomic. */
  append(storeKey: string, item: T, retentionSeconds?: number): Promise<void>;
  /** Write raw string content (used internally for corruption repair). */
  writeRaw(storeKey: string, content: string): Promise<void>;
  /** Describe implementation capability without performing external I/O. */
  describeCapability(): EventListAdapterCapability;
}

export type EventListAdapterCapability = {
  schemaVersion: 'cvf.eventListCapability.v1';
  adapterType: 'file' | 'sqlite' | 'redis';
  implementationStatus: 'ACTIVE_LOCAL_ONLY' | 'ACTIVE_DISTRIBUTED' | 'BLOCKED_CONFIGURATION';
  distributed: boolean;
  atomicAppend: boolean;
  retentionSeconds: number | null;
  livenessChecked: false;
  claimBoundary: string;
};

export const CONTROL_PLANE_RETENTION_SECONDS = 30 * 24 * 60 * 60;

/**
 * Adapter for key-value stores (e.g. policy snapshot registry).
 * Items are addressed by (dir, id) pair.
 */
export interface KeyValueAdapter<T = unknown> {
  readonly adapterType: string;
  /** Write an item by ID within a named directory/namespace. */
  write(dir: string, id: string, item: T): Promise<void>;
  /** Read an item by ID. Returns null if not found. */
  read(dir: string, id: string): Promise<T | null>;
}

// ─── File Implementations ──────────────────────────────────────────────────────

function findTopLevelArrayEnd(raw: string): number | null {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];

    if (inString) {
      if (escaped) { escaped = false; continue; }
      if (char === '\\') { escaped = true; continue; }
      if (char === '"') { inString = false; }
      continue;
    }

    if (char === '"') { inString = true; continue; }
    if (char === '[') { depth += 1; continue; }
    if (char === ']') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  return null;
}

export class FileEventListAdapter<T = unknown> implements EventListAdapter<T> {
  readonly adapterType = 'file';

  async init(storeKey: string): Promise<void> {
    try {
      await mkdir(path.dirname(storeKey), { recursive: true });
    } catch {
      // directory already exists or filesystem is read-only
    }
    try {
      await readFile(storeKey, 'utf8');
    } catch {
      try {
        await writeFile(storeKey, '[]', 'utf8');
      } catch {
        // read-only filesystem — store operates in ephemeral mode
      }
    }
  }

  async readAll(storeKey: string): Promise<T[]> {
    await this.init(storeKey);
    let raw: string;
    try {
      raw = await readFile(storeKey, 'utf8');
    } catch {
      return [];
    }
    try {
      return JSON.parse(raw) as T[];
    } catch {
      return this._repair(raw, storeKey);
    }
  }

  async writeAll(storeKey: string, items: T[]): Promise<void> {
    await this.init(storeKey);
    await writeFile(storeKey, JSON.stringify(items, null, 2), 'utf8');
  }

  async append(storeKey: string, item: T): Promise<void> {
    const items = await this.readAll(storeKey);
    items.push(item);
    await this.writeAll(storeKey, items);
  }

  async writeRaw(storeKey: string, content: string): Promise<void> {
    try {
      await mkdir(path.dirname(storeKey), { recursive: true });
    } catch {
      // directory exists or read-only
    }
    await writeFile(storeKey, content, 'utf8');
  }

  describeCapability(): EventListAdapterCapability {
    return {
      schemaVersion: 'cvf.eventListCapability.v1',
      adapterType: 'file',
      implementationStatus: 'ACTIVE_LOCAL_ONLY',
      distributed: false,
      atomicAppend: false,
      retentionSeconds: null,
      livenessChecked: false,
      claimBoundary: 'file_event_list_is_process_local_and_does_not_claim_distributed_durability',
    };
  }

  private async _repair(raw: string, storeKey: string): Promise<T[]> {
    const arrayEnd = findTopLevelArrayEnd(raw);
    if (arrayEnd === null) {
      await this.writeRaw(storeKey, '[]');
      return [];
    }
    const recoveredRaw = raw.slice(0, arrayEnd + 1);
    try {
      const recovered = JSON.parse(recoveredRaw) as T[];
      const backupPath = `${storeKey}.corrupt-${Date.now()}.json`;
      await this.writeRaw(backupPath, raw);
      await this.writeRaw(storeKey, JSON.stringify(recovered, null, 2));
      return recovered;
    } catch {
      await this.writeRaw(storeKey, '[]');
      return [];
    }
  }
}

export class FileKeyValueAdapter<T = unknown> implements KeyValueAdapter<T> {
  readonly adapterType = 'file';

  async write(dir: string, id: string, item: T): Promise<void> {
    try {
      await mkdir(dir, { recursive: true });
    } catch {
      // directory already exists or filesystem is read-only
    }
    try {
      await writeFile(path.join(dir, `${id}.json`), JSON.stringify(item, null, 2), 'utf8');
    } catch {
      // read-only filesystem — snapshot operates in ephemeral mode
    }
  }

  async read(dir: string, id: string): Promise<T | null> {
    try {
      const raw = await readFile(path.join(dir, `${id}.json`), 'utf8');
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
}

// ─── SQLite Implementations ───────────────────────────────────────────────────

interface SQLiteStatement {
  run(params?: Record<string, unknown>): unknown;
  all(params?: Record<string, unknown>): unknown[];
  get(...params: unknown[]): unknown;
}

interface SQLiteDatabase {
  pragma(sql: string): unknown;
  exec(sql: string): unknown;
  prepare(sql: string): SQLiteStatement;
  transaction<TArgs extends unknown[]>(fn: (...args: TArgs) => void): (...args: TArgs) => void;
  close(): void;
}

type SQLiteDatabaseConstructor = new (filename: string) => SQLiteDatabase;

function loadSQLiteDatabase(): SQLiteDatabaseConstructor {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('better-sqlite3') as SQLiteDatabaseConstructor;
}

function openSQLiteDatabase(dbPath: string): SQLiteDatabase {
  mkdirSync(path.dirname(dbPath), { recursive: true });
  const Database = loadSQLiteDatabase();
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  return db;
}

function withSQLiteDatabase<T>(dbPath: string, fn: (db: SQLiteDatabase) => T): T {
  const db = openSQLiteDatabase(dbPath);
  try {
    return fn(db);
  } finally {
    db.close();
  }
}

export class SQLiteEventListAdapter<T = unknown> implements EventListAdapter<T> {
  readonly adapterType = 'sqlite';

  async init(storeKey: string): Promise<void> {
    withSQLiteDatabase(storeKey, (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS event_list_store (
          store_key TEXT NOT NULL,
          position INTEGER NOT NULL,
          item_json TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          PRIMARY KEY (store_key, position)
        );
      `);
    });
  }

  async readAll(storeKey: string): Promise<T[]> {
    await this.init(storeKey);
    return withSQLiteDatabase(storeKey, (db) => {
      const rows = db.prepare(
        'SELECT item_json FROM event_list_store WHERE store_key = @storeKey ORDER BY position ASC',
      ).all({ storeKey }) as { item_json: string }[];
      return rows.map((row) => JSON.parse(row.item_json) as T);
    });
  }

  async writeAll(storeKey: string, items: T[]): Promise<void> {
    await this.init(storeKey);
    withSQLiteDatabase(storeKey, (db) => {
      const replace = db.transaction((nextItems: T[]) => {
        db.prepare('DELETE FROM event_list_store WHERE store_key = @storeKey').run({ storeKey });
        const insert = db.prepare(
          'INSERT INTO event_list_store (store_key, position, item_json) VALUES (@storeKey, @position, @itemJson)',
        );
        nextItems.forEach((item, position) => {
          insert.run({ storeKey, position, itemJson: JSON.stringify(item) });
        });
      });
      replace(items);
    });
  }

  async append(storeKey: string, item: T): Promise<void> {
    await this.init(storeKey);
    withSQLiteDatabase(storeKey, (db) => {
      db.prepare(`
        INSERT INTO event_list_store (store_key, position, item_json)
        VALUES (
          @storeKey,
          COALESCE((SELECT MAX(position) + 1 FROM event_list_store WHERE store_key = @storeKey), 0),
          @itemJson
        )
      `).run({ storeKey, itemJson: JSON.stringify(item) });
    });
  }

  async writeRaw(storeKey: string, content: string): Promise<void> {
    const parsed = JSON.parse(content) as T[];
    if (!Array.isArray(parsed)) {
      throw new Error('CVF_CONFIGURATION_ERROR: SQLiteEventListAdapter.writeRaw requires a JSON array.');
    }
    await this.writeAll(storeKey, parsed);
  }

  describeCapability(): EventListAdapterCapability {
    return {
      schemaVersion: 'cvf.eventListCapability.v1',
      adapterType: 'sqlite',
      implementationStatus: 'ACTIVE_LOCAL_ONLY',
      distributed: false,
      atomicAppend: true,
      retentionSeconds: null,
      livenessChecked: false,
      claimBoundary: 'sqlite_event_list_is_atomic_local_storage_not_distributed_durability',
    };
  }
}

export class SQLiteKeyValueAdapter<T = unknown> implements KeyValueAdapter<T> {
  readonly adapterType = 'sqlite';

  private dbPath(dir: string): string {
    return path.join(dir, 'cvf-keyvalue-store.sqlite');
  }

  private init(dir: string): void {
    withSQLiteDatabase(this.dbPath(dir), (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS key_value_store (
          id TEXT PRIMARY KEY,
          item_json TEXT NOT NULL,
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);
    });
  }

  async write(dir: string, id: string, item: T): Promise<void> {
    this.init(dir);
    withSQLiteDatabase(this.dbPath(dir), (db) => {
      db.prepare(`
        INSERT INTO key_value_store (id, item_json, updated_at)
        VALUES (@id, @itemJson, datetime('now'))
        ON CONFLICT(id) DO UPDATE SET item_json = excluded.item_json, updated_at = datetime('now')
      `).run({ id, itemJson: JSON.stringify(item) });
    });
  }

  async read(dir: string, id: string): Promise<T | null> {
    this.init(dir);
    return withSQLiteDatabase(this.dbPath(dir), (db) => {
      const row = db.prepare('SELECT item_json FROM key_value_store WHERE id = ?').get(id) as
        | { item_json: string }
        | undefined;
      return row ? JSON.parse(row.item_json) as T : null;
    });
  }
}

// ─── Redis Stubs ───────────────────────────────────────────────────────────────

const CVF_NOT_IMPLEMENTED =
  'CVF_NOT_IMPLEMENTED: RedisStorageAdapter is a stub only. ' +
  'Set CVF_STORAGE_ADAPTER_TYPE=file or leave unset to use the file-backed adapter.';

const CVF_REDIS_CONFIGURATION_ERROR =
  'CVF_CONFIGURATION_ERROR: RedisEventListAdapter requires an injected client or complete Upstash REST configuration.';

const REDIS_APPEND_WITH_RETENTION_SCRIPT = `
redis.call('ZADD', KEYS[1], ARGV[1], ARGV[2])
redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', ARGV[3])
redis.call('EXPIRE', KEYS[1], ARGV[4])
return 1
`;

const REDIS_REPLACE_WITH_RETENTION_SCRIPT = `
redis.call('DEL', KEYS[1])
for i = 1, #ARGV - 1, 2 do
  redis.call('ZADD', KEYS[1], ARGV[i], ARGV[i + 1])
end
redis.call('EXPIRE', KEYS[1], ARGV[#ARGV])
return 1
`;

export interface RedisEventListClient {
  eval<TData = unknown>(script: string, keys: string[], args: Array<string | number>): Promise<TData>;
  zrange<TData = unknown>(key: string, start: number, end: number): Promise<TData[]>;
}

export class RedisEventListAdapter<T = unknown> implements EventListAdapter<T> {
  readonly adapterType = 'redis';

  constructor(private readonly client: RedisEventListClient | null = null) {}

  private requireClient(): RedisEventListClient {
    if (!this.client) throw new Error(CVF_REDIS_CONFIGURATION_ERROR);
    return this.client;
  }

  async init(_storeKey: string): Promise<void> {
    void _storeKey;
    this.requireClient();
  }

  async readAll(storeKey: string): Promise<T[]> {
    const rows = await this.requireClient().zrange<string>(storeKey, 0, -1);
    return rows.map((row) => typeof row === 'string' ? JSON.parse(row) as T : row as T);
  }

  async writeAll(storeKey: string, items: T[]): Promise<void> {
    const args: Array<string | number> = [];
    items.forEach((item, index) => {
      const timestamp = typeof item === 'object' && item && 'timestamp' in item
        ? Date.parse(String((item as { timestamp: unknown }).timestamp))
        : Number.NaN;
      args.push(Number.isFinite(timestamp) ? timestamp : Date.now() + index, JSON.stringify(item));
    });
    args.push(CONTROL_PLANE_RETENTION_SECONDS);
    await this.requireClient().eval(REDIS_REPLACE_WITH_RETENTION_SCRIPT, [storeKey], args);
  }

  async append(
    storeKey: string,
    item: T,
    retentionSeconds = CONTROL_PLANE_RETENTION_SECONDS,
  ): Promise<void> {
    const now = Date.now();
    await this.requireClient().eval(REDIS_APPEND_WITH_RETENTION_SCRIPT, [storeKey], [
      now,
      JSON.stringify(item),
      now - retentionSeconds * 1000,
      retentionSeconds,
    ]);
  }

  async writeRaw(storeKey: string, content: string): Promise<void> {
    const parsed = JSON.parse(content) as T[];
    if (!Array.isArray(parsed)) {
      throw new Error('CVF_CONFIGURATION_ERROR: RedisEventListAdapter.writeRaw requires a JSON array.');
    }
    await this.writeAll(storeKey, parsed);
  }

  describeCapability(): EventListAdapterCapability {
    return {
      schemaVersion: 'cvf.eventListCapability.v1',
      adapterType: 'redis',
      implementationStatus: this.client ? 'ACTIVE_DISTRIBUTED' : 'BLOCKED_CONFIGURATION',
      distributed: true,
      atomicAppend: Boolean(this.client),
      retentionSeconds: this.client ? CONTROL_PLANE_RETENTION_SECONDS : null,
      livenessChecked: false,
      claimBoundary: this.client
        ? 'static_redis_implementation_capability_only_external_liveness_and_writability_not_checked'
        : 'redis_client_configuration_absent_no_distributed_durability_claim',
    };
  }
}

export class RedisKeyValueAdapter<T = unknown> implements KeyValueAdapter<T> {
  readonly adapterType = 'redis';

  async write(_dir: string, _id: string, _item: T): Promise<void> {
    void _dir;
    void _id;
    void _item;
    throw new Error(CVF_NOT_IMPLEMENTED);
  }

  async read(_dir: string, _id: string): Promise<T | null> {
    void _dir;
    void _id;
    throw new Error(CVF_NOT_IMPLEMENTED);
  }
}

// ─── Factories ─────────────────────────────────────────────────────────────────

export type BuildEventListAdapterOptions = {
  redisClient?: RedisEventListClient | null;
  env?: NodeJS.ProcessEnv;
};

function createRedisEventListClient(env: NodeJS.ProcessEnv): RedisEventListClient | null {
  const url = env.UPSTASH_REDIS_REST_URL?.trim();
  const token = env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  try {
    new URL(url);
  } catch {
    return null;
  }
  return new Redis({ url, token }) as RedisEventListClient;
}

export function buildEventListAdapter<T = unknown>(
  type?: string,
  options: BuildEventListAdapterOptions = {},
): EventListAdapter<T> {
  const env = options.env ?? process.env;
  const resolved = type ?? env.CVF_STORAGE_ADAPTER_TYPE ?? 'file';
  if (resolved === 'file') return new FileEventListAdapter<T>();
  if (resolved === 'sqlite') return new SQLiteEventListAdapter<T>();
  if (resolved === 'redis') {
    const client = options.redisClient === undefined
      ? createRedisEventListClient(env)
      : options.redisClient;
    return new RedisEventListAdapter<T>(client);
  }
  throw new Error(
    `CVF_CONFIGURATION_ERROR: unknown CVF_STORAGE_ADAPTER_TYPE "${resolved}". ` +
    'Supported values: file, sqlite, redis.',
  );
}

export function buildKeyValueAdapter<T = unknown>(type?: string): KeyValueAdapter<T> {
  const resolved = type ?? process.env.CVF_STORAGE_ADAPTER_TYPE ?? 'file';
  if (resolved === 'file') return new FileKeyValueAdapter<T>();
  if (resolved === 'sqlite') return new SQLiteKeyValueAdapter<T>();
  if (resolved === 'redis') return new RedisKeyValueAdapter<T>();
  throw new Error(
    `CVF_CONFIGURATION_ERROR: unknown CVF_STORAGE_ADAPTER_TYPE "${resolved}". ` +
    'Supported values: file, sqlite, redis.',
  );
}
