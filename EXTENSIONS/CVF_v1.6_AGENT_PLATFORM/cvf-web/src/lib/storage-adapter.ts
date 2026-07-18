/**
 * CVF Storage Adapter
 *
 * Pluggable storage adapter interface for CVF durable evidence and snapshot stores.
 * DUR2 extends DUR1 by making the I/O backend selectable via CVF_STORAGE_ADAPTER_TYPE:
 *   - FileEventListAdapter / FileKeyValueAdapter: wraps DUR1 file-backed I/O (default)
 *   - RedisEventListAdapter / RedisKeyValueAdapter: stubs for future Redis backend
 *   - SQLiteEventListAdapter / SQLiteKeyValueAdapter: local durable SQLite backend
 *
 * ERH_DUR2_MARKER: EXTERNAL_STORAGE_ADAPTER_ACTIVE
 * CVF_STORAGE_ADAPTER_VERSION: 2026-06-05
 *
 * Claim boundary: adapter interface contract and file-backed implementation only.
 * Redis stubs throw CVF_NOT_IMPLEMENTED. SQLite is local process storage only.
 * No live Redis connection, production database, distributed durability, or
 * tamper-proof audit is claimed.
 *
 * Env: CVF_STORAGE_ADAPTER_TYPE — 'file' (default) | 'sqlite' | 'redis' (stub only)
 * Secret-safe: adapters carry structured governance records only; raw prompts,
 * raw AI output, API keys, provider secrets, and private memory payloads are
 * forbidden from adapter records.
 */

import { mkdirSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

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
  /** Write raw string content (used internally for corruption repair). */
  writeRaw(storeKey: string, content: string): Promise<void>;
}

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

  async writeRaw(storeKey: string, content: string): Promise<void> {
    try {
      await mkdir(path.dirname(storeKey), { recursive: true });
    } catch {
      // directory exists or read-only
    }
    await writeFile(storeKey, content, 'utf8');
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

  async writeRaw(storeKey: string, content: string): Promise<void> {
    const parsed = JSON.parse(content) as T[];
    if (!Array.isArray(parsed)) {
      throw new Error('CVF_CONFIGURATION_ERROR: SQLiteEventListAdapter.writeRaw requires a JSON array.');
    }
    await this.writeAll(storeKey, parsed);
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

export class RedisEventListAdapter<T = unknown> implements EventListAdapter<T> {
  readonly adapterType = 'redis';

  async init(_storeKey: string): Promise<void> {
    void _storeKey;
    throw new Error(CVF_NOT_IMPLEMENTED);
  }

  async readAll(_storeKey: string): Promise<T[]> {
    void _storeKey;
    throw new Error(CVF_NOT_IMPLEMENTED);
  }

  async writeAll(_storeKey: string, _items: T[]): Promise<void> {
    void _storeKey;
    void _items;
    throw new Error(CVF_NOT_IMPLEMENTED);
  }

  async writeRaw(_storeKey: string, _content: string): Promise<void> {
    void _storeKey;
    void _content;
    throw new Error(CVF_NOT_IMPLEMENTED);
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

export function buildEventListAdapter<T = unknown>(type?: string): EventListAdapter<T> {
  const resolved = type ?? process.env.CVF_STORAGE_ADAPTER_TYPE ?? 'file';
  if (resolved === 'file') return new FileEventListAdapter<T>();
  if (resolved === 'sqlite') return new SQLiteEventListAdapter<T>();
  if (resolved === 'redis') return new RedisEventListAdapter<T>();
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
