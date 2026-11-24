import { copyFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, realpathSync, renameSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  SQLiteAtomicRecordAdapter, type AtomicSQLiteExistingOnly,
} from '../src/mao/atomic.sqlite.record.store';

const requireFromPackage = createRequire(path.resolve(process.cwd(), 'package.json'));
const directories = new Set<string>();
const sqliteName = 'cvf-keyvalue-store.sqlite';

function owned() {
  const directory = mkdtempSync(path.join(realpathSync.native(tmpdir()), 'cvf-strict-existing-'));
  directories.add(directory);
  return directory;
}

function descriptor(directory: string): AtomicSQLiteExistingOnly {
  const expectedPath = path.join(directory, sqliteName);
  const stat = lstatSync(expectedPath, { bigint: true });
  return { mode: 'existing-only', expectedPath, identity: { device: stat.dev.toString(), inode: stat.ino.toString() } };
}

function legacy(directory: string) {
  return new SQLiteAtomicRecordAdapter(directory, 'owned');
}

function strict(directory: string, options = descriptor(directory)) {
  return new SQLiteAtomicRecordAdapter(directory, 'owned', 100, options);
}

function sqliteExec(filename: string, sql: string) {
  const SQLite = requireFromPackage('better-sqlite3');
  const db = new SQLite(filename);
  try { db.exec(sql); } finally { db.close(); }
}

function refusal(operation: () => unknown, detail: string) {
  try { operation(); } catch (error) {
    expect(error).toMatchObject({ code: 'NOT_READY', detail });
    return;
  }
  throw Error('expected existing-only refusal');
}

afterEach(() => {
  for (const directory of directories) rmSync(directory, { recursive: true, force: true });
  directories.clear();
});

describe('existing-only native legacy-record ABI', () => {
  it('refuses absent custody and an absent DB without creating either', () => {
    const root = owned();
    const directory = path.join(root, 'absent');
    const expectedPath = path.join(directory, sqliteName);
    const options: AtomicSQLiteExistingOnly = { mode: 'existing-only', expectedPath, identity: { device: '1', inode: '2' } };
    refusal(() => strict(directory, options), 'DIRECTORY_MISSING');
    expect(existsSync(directory)).toBe(false);
    mkdirSync(directory);
    refusal(() => strict(directory, options), 'DATABASE_MISSING');
    expect(existsSync(expectedPath)).toBe(false);
    expect(legacy(directory).readAll()).toEqual([]);
    expect(existsSync(expectedPath)).toBe(true);
  });

  it('uses the native transaction and readback ABI on an explicitly initialized file', () => {
    const directory = owned();
    expect(legacy(directory).readAll()).toEqual([]);
    const adapter = strict(directory);
    expect(adapter.transaction(() => ({
      writes: [{ id: 'bound-row', expectedRevision: null, value: { safe: true } }], result: 'committed',
    }))).toBe('committed');
    expect(strict(directory).readAll()).toEqual([{ id: 'bound-row', revision: 0, value: { safe: true } }]);
  });

  it('rechecks file presence for every open after initial validation', () => {
    const directory = owned();
    legacy(directory).readAll();
    const adapter = strict(directory);
    renameSync(adapter.databasePath, path.join(directory, 'retained-original.sqlite'));
    refusal(() => adapter.readAll(), 'DATABASE_MISSING');
    refusal(() => adapter.transaction(() => {
      throw Error('transaction opened despite missing file');
    }), 'DATABASE_MISSING');
    expect(existsSync(adapter.databasePath)).toBe(false);
  });

  it('refuses the different file identity of a valid copied DB', () => {
    const directory = owned();
    legacy(directory).readAll();
    const adapter = strict(directory);
    const original = path.join(directory, 'retained-original.sqlite');
    renameSync(adapter.databasePath, original);
    copyFileSync(original, adapter.databasePath);
    refusal(() => adapter.readAll(), 'DATABASE_IDENTITY');
    refusal(() => adapter.transaction(() => {
      throw Error('transaction opened on the replacement');
    }), 'DATABASE_IDENTITY');
    expect(legacy(directory).readAll()).toEqual([]);
  });

  it('refuses a noncanonical directory spelling even when its DB has the expected inode', () => {
    const root = owned();
    legacy(root).readAll();
    refusal(() => strict(root + path.sep + '.', descriptor(root)), 'DIRECTORY_INVALID');
  });

  it.each([
    ['CREATE TABLE unrelated (value TEXT)', 'SCHEMA_MISSING', false],
    ['UPDATE atomic_record_schema SET version=2', 'SCHEMA_VERSION', true],
    ['CREATE TRIGGER foreign_trigger AFTER INSERT ON atomic_key_value_store BEGIN SELECT 1; END', 'SCHEMA_SHAPE', true],
    ['PRAGMA journal_mode = DELETE', 'JOURNAL_MODE', true],
  ] as const)('does not repair a foreign or unready schema after %s', (sql, detail, initialize) => {
    const directory = owned();
    if (initialize) legacy(directory).readAll();
    const filename = path.join(directory, sqliteName);
    sqliteExec(filename, sql);
    const adapter = strict(directory);
    refusal(() => adapter.readAll(), detail);
    refusal(() => adapter.readAll(), detail);
  });
});
