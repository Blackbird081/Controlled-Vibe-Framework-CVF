import { lstatSync } from 'node:fs';
import path from 'node:path';

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

// Jev opt-in only: legacy adapters/factories keep their original semantics.
export type AtomicSQLiteCode = 'BUSY' | 'IO' | 'CORRUPT' | 'SCHEMA' | 'CONFLICT' | 'COMMIT_UNKNOWN';
export class AtomicSQLiteError extends Error {
  constructor(readonly code: AtomicSQLiteCode) { super(code); }
}
export type AtomicSQLiteRow = { id: string; revision: number; value: unknown };
export type AtomicSQLiteWrite = { id: string; expectedRevision: number | null; value: unknown };
export type AtomicSQLiteHooks = {
  afterAcquire?: () => void;
  beforeCommit?: () => void;
  afterCommit?: () => void;
};

/** Synchronous local transaction, with strict insert/CAS and post-commit readback. */
export class SQLiteAtomicRecordAdapter {
  readonly databasePath: string;
  constructor(readonly directory: string, readonly namespace: string, readonly busyTimeoutMs = 2000) {
    if (!path.isAbsolute(directory) || !/^[a-zA-Z0-9._:-]{1,100}$/.test(namespace)
        || !Number.isSafeInteger(busyTimeoutMs) || busyTimeoutMs < 0 || busyTimeoutMs > 10000) throw new AtomicSQLiteError('SCHEMA');
    this.databasePath = path.join(directory, 'cvf-keyvalue-store.sqlite');
    try {
      if (directory.startsWith('\\\\') || !lstatSync(directory).isDirectory() || lstatSync(directory).isSymbolicLink()) throw new AtomicSQLiteError('SCHEMA');
      for (const suffix of ['', '-wal', '-shm', '-journal']) {
        try { const info=lstatSync(this.databasePath+suffix); if(!info.isFile() || info.isSymbolicLink()) throw new AtomicSQLiteError('SCHEMA'); }
        catch(error) { if(!(error && typeof error==='object' && 'code' in error && error.code==='ENOENT')) throw error; }
      }
    } catch(error) { if(error instanceof AtomicSQLiteError) throw error; throw new AtomicSQLiteError('IO'); }
  }
  private open(): SQLiteDatabase {
    // No mkdir/default/TEMP fallback. The caller supplies existing approved custody.
    const Database = loadSQLiteDatabase();
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
    try { db = this.open(); return this.rows(db); }
    catch (error) { throw this.classify(error); }
    finally { db?.close(); }
  }
  transaction<T>(transition: (rows: AtomicSQLiteRow[]) => { writes: AtomicSQLiteWrite[]; result: T }, hooks: AtomicSQLiteHooks = {}): T {
    let db: SQLiteDatabase | undefined; let acquired = false; let committing = false; let committed = false; let applicationError = false;
    try {
      db = this.open(); db.exec('BEGIN IMMEDIATE'); acquired = true;
      hooks.afterAcquire?.();
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
      hooks.beforeCommit?.(); committing = true; db.exec('COMMIT'); acquired = false; committed = true;
      hooks.afterCommit?.();
      const after = this.rows(db);
      if (expected.some(row => !after.some(got => got.id === row.id && got.revision === row.revision && JSON.stringify(got.value) === row.json))) throw new AtomicSQLiteError('COMMIT_UNKNOWN');
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
