import { lstatSync, realpathSync } from 'node:fs';
import path from 'node:path';

interface SQLiteStatement {
  run(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
  get(...params: unknown[]): unknown;
}

interface SQLiteDatabase {
  pragma(sql: string, options?: { simple?: boolean }): unknown;
  exec(sql: string): unknown;
  prepare(sql: string): SQLiteStatement;
  transaction<TArgs extends unknown[]>(fn: (...args: TArgs) => void): (...args: TArgs) => void;
  close(): void;
}

type SQLiteOpenOptions = { fileMustExist?: boolean; timeout?: number };
type SQLiteDatabaseConstructor = new (filename: string, options?: SQLiteOpenOptions) => SQLiteDatabase;

function loadSQLiteDatabase(): SQLiteDatabaseConstructor {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('better-sqlite3') as SQLiteDatabaseConstructor;
}

// Jev opt-in only: legacy adapters/factories keep their original semantics.
// NOT_READY belongs to the explicit readiness profiles.
export type AtomicSQLiteCode = 'BUSY' | 'IO' | 'CORRUPT' | 'SCHEMA' | 'CONFLICT' | 'COMMIT_UNKNOWN' | 'NOT_READY';
// Safe, path-free reason attached to NOT_READY so callers can tell the missing-custody cases apart.
export type AtomicSQLiteNotReadyDetail =
  | 'DIRECTORY_INVALID' | 'DIRECTORY_MISSING' | 'DATABASE_INVALID' | 'DATABASE_MISSING' | 'DATABASE_IDENTITY'
  | 'SCHEMA_MISSING' | 'SCHEMA_VERSION' | 'SCHEMA_SHAPE' | 'JOURNAL_MODE' | 'SYNCHRONOUS';
export class AtomicSQLiteError extends Error {
  constructor(readonly code: AtomicSQLiteCode, readonly detail?: AtomicSQLiteNotReadyDetail) { super(code); }
}
export type AtomicSQLiteRow = { id: string; revision: number; value: unknown };
export type AtomicSQLiteWrite = { id: string; expectedRevision: number | null; value: unknown };
export type AtomicSQLiteHooks = {
  afterAcquire?: () => void;
  beforeCommit?: () => void;
  afterCommit?: () => void;
};
export type AtomicSQLiteExistingOnly = Readonly<{
  mode: 'existing-only';
  expectedPath: string;
  identity: Readonly<{ device: string; inode: string }>;
}>;

function assertExistingIdentity(directory: string, binding: AtomicSQLiteExistingOnly): void {
  const databasePath = checkKeyedCustody(directory, true);
  try {
    if (realpathSync.native(directory) !== directory) throw notReady('DIRECTORY_INVALID');
    const stat = lstatSync(databasePath, { bigint: true });
    if (!stat.isFile() || realpathSync.native(databasePath) !== binding.expectedPath
      || stat.dev.toString() !== binding.identity.device || stat.ino.toString() !== binding.identity.inode) {
      throw notReady('DATABASE_IDENTITY');
    }
  } catch (error) {
    if (error instanceof AtomicSQLiteError) throw error;
    if (isErrno(error, 'ENOENT', 'ENOTDIR')) throw notReady('DATABASE_MISSING');
    throw new AtomicSQLiteError('IO');
  }
}

/** Synchronous local transaction, with strict insert/CAS and post-commit readback. */
export class SQLiteAtomicRecordAdapter {
  readonly databasePath: string;
  private readonly existingOnly?: AtomicSQLiteExistingOnly;
  constructor(readonly directory: string, readonly namespace: string, readonly busyTimeoutMs = 2000, options?: AtomicSQLiteExistingOnly) {
    if (!path.isAbsolute(directory) || !/^[a-zA-Z0-9._:-]{1,100}$/.test(namespace)
        || !Number.isSafeInteger(busyTimeoutMs) || busyTimeoutMs < 0 || busyTimeoutMs > 10000) throw new AtomicSQLiteError('SCHEMA');
    this.databasePath = path.join(directory, 'cvf-keyvalue-store.sqlite');
    if (options !== undefined) {
      if (options?.mode !== 'existing-only' || options.expectedPath !== this.databasePath
        || !options.identity || typeof options.identity.device !== 'string' || !/^\d+$/.test(options.identity.device)
        || typeof options.identity.inode !== 'string' || !/^[1-9]\d*$/.test(options.identity.inode)) throw new AtomicSQLiteError('SCHEMA');
      this.existingOnly = { ...options, identity: { ...options.identity } };
      this.checkExistingIdentity();
      return;
    }
    try {
      if (directory.startsWith('\\\\') || !lstatSync(directory).isDirectory() || lstatSync(directory).isSymbolicLink()) throw new AtomicSQLiteError('SCHEMA');
      for (const suffix of ['', '-wal', '-shm', '-journal']) {
        try { const info=lstatSync(this.databasePath+suffix); if(!info.isFile() || info.isSymbolicLink()) throw new AtomicSQLiteError('SCHEMA'); }
        catch(error) { if(!(error && typeof error==='object' && 'code' in error && error.code==='ENOENT')) throw error; }
      }
    } catch(error) { if(error instanceof AtomicSQLiteError) throw error; throw new AtomicSQLiteError('IO'); }
  }
  private checkExistingIdentity(): void {
    if (this.existingOnly) assertExistingIdentity(this.directory, this.existingOnly);
  }
  private open(): SQLiteDatabase {
    // No mkdir/default/TEMP fallback. The caller supplies existing approved custody.
    const Database = loadSQLiteDatabase();
    if (this.existingOnly) {
      this.checkExistingIdentity();
      let db: SQLiteDatabase | undefined;
      try {
        db = new Database(this.databasePath, { fileMustExist: true, timeout: this.busyTimeoutMs });
        this.checkExistingIdentity();
        db.pragma('synchronous = FULL');
        assertKeyedReady(db);
        const unexpected = db.prepare("SELECT name FROM sqlite_master WHERE name NOT IN ('atomic_key_value_store','atomic_record_schema','sqlite_autoindex_atomic_key_value_store_1') LIMIT 1").get();
        if (unexpected) throw notReady('SCHEMA_SHAPE');
        this.checkExistingIdentity();
        return db;
      } catch (error) {
        db?.close();
        throw classifyKeyed(error);
      }
    }
    const db = new Database(this.databasePath);
    try {
      db.pragma('journal_mode = WAL'); db.pragma('synchronous = FULL');
      db.pragma(`busy_timeout = ${this.busyTimeoutMs}`);
      db.exec(`CREATE TABLE IF NOT EXISTS atomic_key_value_store (
        namespace TEXT NOT NULL, id TEXT NOT NULL, revision INTEGER NOT NULL CHECK(revision >= 0),
        item_json TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(namespace,id));
        CREATE TABLE IF NOT EXISTS atomic_record_schema (version INTEGER NOT NULL);
        INSERT INTO atomic_record_schema(version) SELECT 1 WHERE NOT EXISTS(SELECT 1 FROM atomic_record_schema);`);
      const versions = db.prepare('SELECT version FROM atomic_record_schema').all() as { version: number }[];
      const columns = db.prepare('PRAGMA table_info(atomic_key_value_store)').all() as { name: string;type:string;notnull:number;pk:number }[];
      if (versions.length !== 1 || versions[0].version !== 1
          || columns.map(c => [c.name,c.type,c.notnull,c.pk].join(':')).join(',') !== 'namespace:TEXT:1:1,id:TEXT:1:2,revision:INTEGER:1:0,item_json:TEXT:1:0,updated_at:TEXT:1:0') throw new AtomicSQLiteError('SCHEMA');
      return db;
    } catch (error) { db.close(); throw error; }
  }
  private rows(db: SQLiteDatabase): AtomicSQLiteRow[] {
    const rows = db.prepare('SELECT id,revision,item_json FROM atomic_key_value_store WHERE namespace=@namespace ORDER BY id').all({ namespace: this.namespace }) as { id: string; revision: number; item_json: string }[];
    if(new Set(rows.map(row=>row.id)).size!==rows.length)throw new AtomicSQLiteError('CORRUPT');
    return rows.map(row => {
      if (!/^[a-zA-Z0-9._:-]{1,200}$/.test(row.id) || !Number.isSafeInteger(row.revision) || row.revision < 0) throw new AtomicSQLiteError('CORRUPT');
      try { const value:unknown=JSON.parse(row.item_json); if(JSON.stringify(value)!==row.item_json)throw new Error('noncanonical');return { id: row.id, revision: row.revision, value }; }
      catch { throw new AtomicSQLiteError('CORRUPT'); }
    });
  }
  readAll(): AtomicSQLiteRow[] {
    let db: SQLiteDatabase | undefined;
    try { db = this.open(); const rows = this.rows(db); this.checkExistingIdentity(); return rows; }
    catch (error) { throw this.classify(error); }
    finally { db?.close(); }
  }
  transaction<T>(transition: (rows: AtomicSQLiteRow[]) => { writes: AtomicSQLiteWrite[]; result: T }, hooks: AtomicSQLiteHooks = {}): T {
    let db: SQLiteDatabase | undefined; let acquired = false; let committing = false; let committed = false; let applicationError = false;
    try {
      db = this.open(); db.exec('BEGIN IMMEDIATE'); acquired = true;
      hooks.afterAcquire?.();
      this.checkExistingIdentity();
      const before = this.rows(db);
      let change: { writes: AtomicSQLiteWrite[]; result: T };
      try { change = transition(structuredClone(before)); } catch (error) { applicationError = true; throw error; }
      if (!change || !Array.isArray(change.writes) || change.writes.length > 10
          || new Set(change.writes.map(w => w.id)).size !== change.writes.length) throw new AtomicSQLiteError('SCHEMA');
      const expected: { id: string; revision: number; json: string }[] = [];
      for (const write of change.writes) {
        if (!/^[a-zA-Z0-9._:-]{1,200}$/.test(write.id) || (write.expectedRevision !== null
            && (!Number.isSafeInteger(write.expectedRevision) || write.expectedRevision < 0))) throw new AtomicSQLiteError('SCHEMA');
        const old = before.find(row => row.id === write.id);
        if ((old?.revision ?? null) !== write.expectedRevision) throw new AtomicSQLiteError('CONFLICT');
        const json = JSON.stringify(write.value);
        if (!json || Buffer.byteLength(json, 'utf8') > 100000) throw new AtomicSQLiteError('SCHEMA');
        const revision = old ? old.revision + 1 : 0;
        if (!Number.isSafeInteger(revision)) throw new AtomicSQLiteError('SCHEMA');
        db.prepare(`INSERT INTO atomic_key_value_store(namespace,id,revision,item_json,updated_at)
          VALUES(@namespace,@id,@revision,@json,@at)
          ON CONFLICT(namespace,id) DO UPDATE SET revision=excluded.revision,item_json=excluded.item_json,updated_at=excluded.updated_at`).run(
          { namespace: this.namespace, id: write.id, revision, json, at: new Date().toISOString() });
        expected.push({ id: write.id, revision, json });
      }
      hooks.beforeCommit?.(); this.checkExistingIdentity();
      committing = true; db.exec('COMMIT'); acquired = false; committed = true;
      hooks.afterCommit?.();
      this.checkExistingIdentity();
      const after = this.rows(db);
      if (expected.some(row => !after.some(got => got.id === row.id && got.revision === row.revision && JSON.stringify(got.value) === row.json))) throw new AtomicSQLiteError('COMMIT_UNKNOWN');
      this.checkExistingIdentity();
      return change.result;
    } catch (error) {
      if (acquired) { try { db?.exec('ROLLBACK'); } catch { /* outcome remains denied */ } }
      if (committed || committing) throw new AtomicSQLiteError('COMMIT_UNKNOWN');
      if (applicationError && !(error instanceof AtomicSQLiteError)) throw error;
      throw this.classify(error);
    } finally { db?.close(); }
  }
  private classify(error: unknown): AtomicSQLiteError {
    if (error instanceof AtomicSQLiteError) return error;
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
    if (code.includes('BUSY') || code.includes('LOCKED')) return new AtomicSQLiteError('BUSY');
    if (code.includes('CORRUPT') || code.includes('NOTADB')) return new AtomicSQLiteError('CORRUPT');
    if (code.includes('SCHEMA') || code.includes('ERROR')) return new AtomicSQLiteError('SCHEMA');
    return new AtomicSQLiteError('IO');
  }
}

/** Largest row the shared table profile has ever accepted; keyed profiles may only be stricter. */
export const ATOMIC_SQLITE_MAX_ROW_BYTES = 100000;
/** Largest number of explicitly selected keys per keyed read or transaction. */
export const ATOMIC_SQLITE_MAX_KEYS = 4;

export type AtomicSQLiteKeyedOptions = {
  /** Profile ceiling in UTF-8 bytes of the canonical JSON; 1..ATOMIC_SQLITE_MAX_ROW_BYTES. */
  maxRowBytes: number;
  /** Optional stricter limit per key (1..maxRowBytes), checked before parse on read and on write. */
  maxRowBytesFor?: (id: string) => number;
};
export type AtomicSQLiteUnavailableCode = 'CORRUPT' | 'OVERSIZE';
/** Present, absent and unavailable keys stay distinguishable; oversize rows are never parsed. */
export type AtomicSQLiteKeyedEntry =
  | { id: string; state: 'PRESENT'; revision: number; value: unknown }
  | { id: string; state: 'ABSENT' }
  | { id: string; state: 'UNAVAILABLE'; code: AtomicSQLiteUnavailableCode };
export type AtomicSQLiteKeyedPut = { id: string; expectedRevision: number | null; value: unknown };
export type AtomicSQLiteKeyedDelete = { id: string; expectedRevision: number; delete: true };
export type AtomicSQLiteKeyedWrite = AtomicSQLiteKeyedPut | AtomicSQLiteKeyedDelete;
export type AtomicSQLiteKeyedHooks = AtomicSQLiteHooks & {
  /** Runs after the operational open and validation, before BEGIN IMMEDIATE (deterministic tests). */
  afterOpen?: () => void;
};
export type AtomicSQLiteKeyedInitResult = { databasePath: string; created: boolean };

const KEYED_DATABASE_FILE = 'cvf-keyvalue-store.sqlite';
const KEYED_ID_PATTERN = /^[a-zA-Z0-9._:-]{1,200}$/;
const KEYED_NAMESPACE_PATTERN = /^[a-zA-Z0-9._:-]{1,100}$/;
const KEYED_TABLE_SHAPE = 'namespace:TEXT:1:1,id:TEXT:1:2,revision:INTEGER:1:0,item_json:TEXT:1:0,updated_at:TEXT:1:0';

function notReady(detail: AtomicSQLiteNotReadyDetail): AtomicSQLiteError {
  return new AtomicSQLiteError('NOT_READY', detail);
}
function isErrno(error: unknown, ...codes: string[]): boolean {
  return !!error && typeof error === 'object' && 'code' in error && codes.includes(String(error.code));
}
/** Keyed classification: the legacy mapping plus CANTOPEN as NOT_READY (the legacy classify() is untouched). */
function classifyKeyed(error: unknown): AtomicSQLiteError {
  if (error instanceof AtomicSQLiteError) return error;
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  if (code.includes('CANTOPEN')) return notReady('DATABASE_MISSING');
  if (code.includes('BUSY') || code.includes('LOCKED')) return new AtomicSQLiteError('BUSY');
  if (code.includes('CORRUPT') || code.includes('NOTADB')) return new AtomicSQLiteError('CORRUPT');
  if (code.includes('SCHEMA') || code.includes('ERROR')) return new AtomicSQLiteError('SCHEMA');
  return new AtomicSQLiteError('IO');
}
/** Custody check without any filesystem mutation; the directory must already exist. */
function checkKeyedCustody(directory: string, requireDatabase: boolean): string {
  if (typeof directory !== 'string' || !path.isAbsolute(directory) || directory.startsWith('\\\\')) throw notReady('DIRECTORY_INVALID');
  try {
    const info = lstatSync(directory);
    if (!info.isDirectory() || info.isSymbolicLink()) throw notReady('DIRECTORY_INVALID');
  } catch (error) {
    if (error instanceof AtomicSQLiteError) throw error;
    if (isErrno(error, 'ENOENT', 'ENOTDIR')) throw notReady('DIRECTORY_MISSING');
    throw new AtomicSQLiteError('IO');
  }
  const databasePath = path.join(directory, KEYED_DATABASE_FILE);
  for (const suffix of ['', '-wal', '-shm', '-journal']) {
    try {
      const info = lstatSync(databasePath + suffix);
      if (!info.isFile() || info.isSymbolicLink()) throw notReady('DATABASE_INVALID');
    } catch (error) {
      if (error instanceof AtomicSQLiteError) throw error;
      if (!isErrno(error, 'ENOENT')) throw new AtomicSQLiteError('IO');
      if (suffix === '' && requireDatabase) throw notReady('DATABASE_MISSING');
    }
  }
  return databasePath;
}
/** Read-only readiness validation: schema, version, exact table shape, WAL and FULL. No DDL, no writes. */
function assertKeyedReady(db: SQLiteDatabase): void {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('atomic_key_value_store','atomic_record_schema')").all() as { name: string }[];
  if (tables.length !== 2) throw notReady('SCHEMA_MISSING');
  const versions = db.prepare('SELECT version FROM atomic_record_schema').all() as { version: unknown }[];
  if (versions.length !== 1 || versions[0].version !== 1) throw notReady('SCHEMA_VERSION');
  const columns = db.prepare('PRAGMA table_info(atomic_key_value_store)').all() as { name: string; type: string; notnull: number; pk: number }[];
  if (columns.map(c => [c.name, c.type, c.notnull, c.pk].join(':')).join(',') !== KEYED_TABLE_SHAPE) throw notReady('SCHEMA_SHAPE');
  if (String(db.pragma('journal_mode', { simple: true })).toLowerCase() !== 'wal') throw notReady('JOURNAL_MODE');
  if (Number(db.pragma('synchronous', { simple: true })) !== 2) throw notReady('SYNCHRONOUS');
}

type KeyedRawRow = { id: string; revision: unknown; rtype: string; itype: string; bytes: unknown; json: string | null };

/**
 * Opt-in keyed profile over the same table, schema-version table, file name and error class as the legacy adapter.
 * Operational calls never create a directory or database, never run DDL, never change the journal mode, never wait on a lock
 * and never scan the namespace: only the (at most four) explicitly selected primary keys are read, cloned or verified.
 */
export class SQLiteKeyedAtomicRecordStore {
  readonly databasePath: string;
  readonly maxRowBytes: number;
  private readonly maxRowBytesFor?: (id: string) => number;
  constructor(readonly directory: string, readonly namespace: string, options: AtomicSQLiteKeyedOptions) {
    if (typeof namespace !== 'string' || !KEYED_NAMESPACE_PATTERN.test(namespace) || !options
        || !Number.isSafeInteger(options.maxRowBytes) || options.maxRowBytes < 1 || options.maxRowBytes > ATOMIC_SQLITE_MAX_ROW_BYTES
        || (options.maxRowBytesFor !== undefined && typeof options.maxRowBytesFor !== 'function')) throw new AtomicSQLiteError('SCHEMA');
    if (typeof directory !== 'string' || !path.isAbsolute(directory) || directory.startsWith('\\\\')) throw notReady('DIRECTORY_INVALID');
    this.databasePath = path.join(directory, KEYED_DATABASE_FILE);
    this.maxRowBytes = options.maxRowBytes;
    this.maxRowBytesFor = options.maxRowBytesFor;
  }

  /**
   * Explicit offline initialization: the only place that creates the database file, runs DDL or sets WAL.
   * Requires an existing absolute, non-UNC, non-symlink directory (never mkdir). Idempotent for an already valid database.
   */
  static initialize(directory: string): AtomicSQLiteKeyedInitResult {
    const databasePath = checkKeyedCustody(directory, false);
    let created = true;
    try { lstatSync(databasePath); created = false; }
    catch (error) { if (!isErrno(error, 'ENOENT')) throw new AtomicSQLiteError('IO'); }
    let db: SQLiteDatabase | undefined;
    try {
      db = new (loadSQLiteDatabase())(databasePath);
      if (String(db.pragma('journal_mode = WAL', { simple: true })).toLowerCase() !== 'wal') throw notReady('JOURNAL_MODE');
      db.pragma('synchronous = FULL');
      db.exec(`CREATE TABLE IF NOT EXISTS atomic_key_value_store (
        namespace TEXT NOT NULL, id TEXT NOT NULL, revision INTEGER NOT NULL CHECK(revision >= 0),
        item_json TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(namespace,id));
        CREATE TABLE IF NOT EXISTS atomic_record_schema (version INTEGER NOT NULL);
        INSERT INTO atomic_record_schema(version) SELECT 1 WHERE NOT EXISTS(SELECT 1 FROM atomic_record_schema);`);
      assertKeyedReady(db);
      return { databasePath, created };
    } catch (error) { throw classifyKeyed(error); }
    finally { db?.close(); }
  }

  /** Reads only the selected keys; a corrupt or oversize target is reported per key and never aborts the call. */
  readKeys(ids: string[]): AtomicSQLiteKeyedEntry[] {
    const selected = this.validateIds(ids);
    let db: SQLiteDatabase | undefined;
    try { db = this.open(); return this.selectEntries(db, selected); }
    catch (error) { throw classifyKeyed(error); }
    finally { db?.close(); }
  }

  /**
   * Keyed BEGIN IMMEDIATE transaction. Writes and CAS deletes must be a subset of the selected keys; revisions are enforced by
   * SQL predicates; lock contention is an immediate BUSY; after COMMIT only the written or deleted keys are verified and any
   * failure from the COMMIT statement onward is COMMIT_UNKNOWN.
   */
  transactionKeys<T>(
    ids: string[],
    transition: (entries: AtomicSQLiteKeyedEntry[]) => { writes: AtomicSQLiteKeyedWrite[]; result: T },
    hooks: AtomicSQLiteKeyedHooks = {},
  ): T {
    const selected = this.validateIds(ids);
    let db: SQLiteDatabase | undefined; let acquired = false; let committing = false; let committed = false; let applicationError = false;
    try {
      db = this.open();
      hooks.afterOpen?.();
      db.exec('BEGIN IMMEDIATE'); acquired = true;
      hooks.afterAcquire?.();
      const before = this.selectEntries(db, selected);
      const byId = new Map(before.map(entry => [entry.id, entry]));
      let change: { writes: AtomicSQLiteKeyedWrite[]; result: T };
      try { change = transition(structuredClone(before)); } catch (error) { applicationError = true; throw error; }
      if (!change || !Array.isArray(change.writes) || change.writes.length > selected.length
          || new Set(change.writes.map(w => w?.id)).size !== change.writes.length) throw new AtomicSQLiteError('SCHEMA');
      const expected: { id: string; revision: number; json: string | null }[] = [];
      for (const write of change.writes) expected.push(this.apply(db, write, byId));
      hooks.beforeCommit?.(); committing = true; db.exec('COMMIT'); acquired = false; committed = true;
      hooks.afterCommit?.();
      const raw = this.selectRaw(db, expected.map(row => row.id));
      for (const row of expected) {
        const got = raw.get(row.id);
        const matches = row.json === null
          ? got === undefined
          : got !== undefined && got.rtype === 'integer' && got.revision === row.revision && got.itype === 'text' && got.json === row.json;
        if (!matches) throw new AtomicSQLiteError('COMMIT_UNKNOWN');
      }
      return change.result;
    } catch (error) {
      if (acquired) { try { db?.exec('ROLLBACK'); } catch { /* outcome remains denied */ } }
      if (committed || committing) throw new AtomicSQLiteError('COMMIT_UNKNOWN');
      if (applicationError && !(error instanceof AtomicSQLiteError)) throw error;
      throw classifyKeyed(error);
    } finally { db?.close(); }
  }

  private validateIds(ids: string[]): string[] {
    if (!Array.isArray(ids) || ids.length < 1 || ids.length > ATOMIC_SQLITE_MAX_KEYS
        || ids.some(id => typeof id !== 'string' || !KEYED_ID_PATTERN.test(id)) || new Set(ids).size !== ids.length) throw new AtomicSQLiteError('SCHEMA');
    return [...ids];
  }
  private limitFor(id: string): number {
    const limit = this.maxRowBytesFor ? this.maxRowBytesFor(id) : this.maxRowBytes;
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > this.maxRowBytes) throw new AtomicSQLiteError('SCHEMA');
    return limit;
  }
  /** Operational open: existing file only, zero wait from the first operation, validation without any write. */
  private open(): SQLiteDatabase {
    const databasePath = checkKeyedCustody(this.directory, true);
    const db = new (loadSQLiteDatabase())(databasePath, { fileMustExist: true, timeout: 0 });
    try {
      db.pragma('busy_timeout = 0'); db.pragma('synchronous = FULL');
      assertKeyedReady(db);
      return db;
    } catch (error) { db.close(); throw error; }
  }
  /** Primary-key lookup of the selected ids. Type, revision and UTF-8 byte length are selected before any JSON.parse. */
  private selectRaw(db: SQLiteDatabase, ids: string[]): Map<string, KeyedRawRow> {
    const rows = db.prepare(`SELECT id, revision, typeof(revision) AS rtype, typeof(item_json) AS itype,
      length(CAST(item_json AS BLOB)) AS bytes,
      CASE WHEN typeof(item_json)='text' AND length(CAST(item_json AS BLOB)) <= ? THEN item_json ELSE NULL END AS json
      FROM atomic_key_value_store WHERE namespace = ? AND id IN (${ids.map(() => '?').join(',')})`)
      .all(this.maxRowBytes, this.namespace, ...ids) as KeyedRawRow[];
    return new Map(rows.map(row => [row.id, row]));
  }
  private selectEntries(db: SQLiteDatabase, ids: string[]): AtomicSQLiteKeyedEntry[] {
    const raw = this.selectRaw(db, ids);
    return ids.map(id => this.decode(id, raw.get(id)));
  }
  private decode(id: string, row: KeyedRawRow | undefined): AtomicSQLiteKeyedEntry {
    if (!row) return { id, state: 'ABSENT' };
    if (row.rtype !== 'integer' || typeof row.revision !== 'number' || !Number.isSafeInteger(row.revision) || row.revision < 0
        || row.itype !== 'text' || typeof row.bytes !== 'number' || !Number.isSafeInteger(row.bytes)) return { id, state: 'UNAVAILABLE', code: 'CORRUPT' };
    if (row.bytes > this.limitFor(id)) return { id, state: 'UNAVAILABLE', code: 'OVERSIZE' };
    if (typeof row.json !== 'string') return { id, state: 'UNAVAILABLE', code: 'CORRUPT' };
    try {
      const value: unknown = JSON.parse(row.json);
      if (JSON.stringify(value) !== row.json) throw new Error('noncanonical');
      return { id, state: 'PRESENT', revision: row.revision, value };
    } catch { return { id, state: 'UNAVAILABLE', code: 'CORRUPT' }; }
  }
  /** Validates one write against the selected state and executes it with a SQL revision predicate. */
  private apply(db: SQLiteDatabase, write: AtomicSQLiteKeyedWrite, byId: Map<string, AtomicSQLiteKeyedEntry>): { id: string; revision: number; json: string | null } {
    if (!write || typeof write !== 'object' || typeof write.id !== 'string') throw new AtomicSQLiteError('SCHEMA');
    const entry = byId.get(write.id);
    if (!entry) throw new AtomicSQLiteError('SCHEMA'); // outside the selected keys
    const isDelete = 'delete' in write;
    if (isDelete && (write.delete !== true || 'value' in write || !Number.isSafeInteger(write.expectedRevision) || write.expectedRevision < 0)) throw new AtomicSQLiteError('SCHEMA');
    if (!isDelete && write.expectedRevision !== null && (!Number.isSafeInteger(write.expectedRevision) || write.expectedRevision < 0)) throw new AtomicSQLiteError('SCHEMA');
    // A corrupt or oversize target keeps its bytes and charge; it can only be repaired offline.
    if (entry.state === 'UNAVAILABLE') throw new AtomicSQLiteError('CORRUPT');
    const current = entry.state === 'PRESENT' ? entry.revision : null;
    if (current !== write.expectedRevision) throw new AtomicSQLiteError('CONFLICT');
    if (isDelete) {
      const result = db.prepare('DELETE FROM atomic_key_value_store WHERE namespace = ? AND id = ? AND revision = ?').run(this.namespace, write.id, current) as { changes: number };
      if (result.changes !== 1) throw new AtomicSQLiteError('CONFLICT');
      return { id: write.id, revision: current as number, json: null };
    }
    const json = JSON.stringify((write as AtomicSQLiteKeyedPut).value);
    if (typeof json !== 'string' || !json || Buffer.byteLength(json, 'utf8') > this.limitFor(write.id)) throw new AtomicSQLiteError('SCHEMA');
    const at = new Date().toISOString();
    if (current === null) {
      const result = db.prepare(`INSERT INTO atomic_key_value_store(namespace,id,revision,item_json,updated_at)
        SELECT ?, ?, 0, ?, ? WHERE NOT EXISTS(SELECT 1 FROM atomic_key_value_store WHERE namespace = ? AND id = ?)`)
        .run(this.namespace, write.id, json, at, this.namespace, write.id) as { changes: number };
      if (result.changes !== 1) throw new AtomicSQLiteError('CONFLICT');
      return { id: write.id, revision: 0, json };
    }
    const revision = current + 1;
    if (!Number.isSafeInteger(revision)) throw new AtomicSQLiteError('SCHEMA');
    const result = db.prepare('UPDATE atomic_key_value_store SET revision = ?, item_json = ?, updated_at = ? WHERE namespace = ? AND id = ? AND revision = ?')
      .run(revision, json, at, this.namespace, write.id, current) as { changes: number };
    if (result.changes !== 1) throw new AtomicSQLiteError('CONFLICT');
    return { id: write.id, revision, json };
  }
}

export type SQLiteSecurityTuple = {
  ownerSid: string; protectionState: boolean; inheritanceState: boolean;
  aces: { sid: string; rights: string; accessType: string; isInherited: boolean; inheritanceFlags: string; propagationFlags: string }[];
};
/** Complete tuple comparison; no filesystem security mutation is performed. */
export function normalizeSQLiteSecurityTuple(value: SQLiteSecurityTuple): string {
  const fields = ['sid', 'rights', 'accessType', 'isInherited', 'inheritanceFlags', 'propagationFlags'] as const;
  if (Object.keys(value).sort().join(',') !== 'aces,inheritanceState,ownerSid,protectionState' || typeof value.ownerSid !== 'string' || !value.ownerSid || typeof value.protectionState !== 'boolean'
      || typeof value.inheritanceState !== 'boolean' || !Array.isArray(value.aces)) throw new AtomicSQLiteError('SCHEMA');
  const aces = value.aces.map(ace => {
    if (Object.keys(ace).sort().join(',') !== [...fields].sort().join(',')
      || fields.some(f => f === 'isInherited' ? typeof ace[f] !== 'boolean' : typeof ace[f] !== 'string')) throw new AtomicSQLiteError('SCHEMA');
    return fields.map(f => ace[f]);
  }).map(ace => JSON.stringify(ace)).sort();
  return JSON.stringify([value.ownerSid, value.protectionState, value.inheritanceState, aces]);
}
export function sqliteSecurityTuplesEqual(left: SQLiteSecurityTuple, right: SQLiteSecurityTuple): boolean {
  return normalizeSQLiteSecurityTuple(left) === normalizeSQLiteSecurityTuple(right);
}
