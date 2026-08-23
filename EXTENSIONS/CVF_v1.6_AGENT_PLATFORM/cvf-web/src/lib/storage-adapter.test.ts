/**
 * Focused tests for storage-adapter.ts (ERH-DUR2)
 *
 * Verifies file/SQLite adapters, Redis event-list append, Redis key-value stub,
 * buildEventListAdapter factory, buildKeyValueAdapter
 * factory, and CVF_STORAGE_ADAPTER_TYPE env routing.
 *
 * CVF_STORAGE_ADAPTER_VERSION: 2026-06-05
 * ERH_DUR2_MARKER: EXTERNAL_STORAGE_ADAPTER_ACTIVE
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import os from 'node:os';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import {
  FileEventListAdapter,
  FileKeyValueAdapter,
  SQLiteEventListAdapter,
  SQLiteKeyValueAdapter,
  RedisEventListAdapter,
  RedisKeyValueAdapter,
  CONTROL_PLANE_RETENTION_SECONDS,
  type RedisEventListClient,
  buildEventListAdapter,
  buildKeyValueAdapter,
} from './storage-adapter';

async function makeTmpDir(): Promise<string> {
  const dir = path.join(os.tmpdir(), `cvf-dur2-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await mkdir(dir, { recursive: true });
  return dir;
}

// ─── FileEventListAdapter ──────────────────────────────────────────────────────

describe('FileEventListAdapter', () => {
  let tmpDir: string;
  let storeKey: string;
  let adapter: FileEventListAdapter<{ id: string; val: number }>;

  beforeEach(async () => {
    tmpDir = await makeTmpDir();
    storeKey = path.join(tmpDir, 'events.json');
    adapter = new FileEventListAdapter();
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('has adapterType "file"', () => {
    expect(adapter.adapterType).toBe('file');
  });

  it('init creates file with empty array when store absent', async () => {
    await adapter.init(storeKey);
    const result = await adapter.readAll(storeKey);
    expect(result).toEqual([]);
  });

  it('readAll returns [] for non-existent store', async () => {
    const result = await adapter.readAll(path.join(tmpDir, 'missing', 'events.json'));
    expect(result).toEqual([]);
  });

  it('writeAll persists items and readAll retrieves them', async () => {
    const items = [{ id: 'a', val: 1 }, { id: 'b', val: 2 }];
    await adapter.writeAll(storeKey, items);
    const result = await adapter.readAll(storeKey);
    expect(result).toEqual(items);
  });

  it('writeAll replaces existing contents', async () => {
    await adapter.writeAll(storeKey, [{ id: 'x', val: 10 }]);
    await adapter.writeAll(storeKey, [{ id: 'y', val: 20 }, { id: 'z', val: 30 }]);
    const result = await adapter.readAll(storeKey);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: 'y' });
  });

  it('append adds one item through the list adapter contract', async () => {
    await adapter.writeAll(storeKey, [{ id: 'x', val: 10 }]);
    await adapter.append(storeKey, { id: 'y', val: 20 });
    expect(await adapter.readAll(storeKey)).toEqual([
      { id: 'x', val: 10 },
      { id: 'y', val: 20 },
    ]);
  });

  it('writeRaw writes raw string content to store key', async () => {
    await adapter.writeRaw(storeKey, '[]');
    const result = await adapter.readAll(storeKey);
    expect(result).toEqual([]);
  });

  it('readAll repairs partially-corrupted JSON and returns recoverable items', async () => {
    const partial = '[{"id":"ok","val":1}]TRAILING_GARBAGE';
    await writeFile(storeKey, partial, 'utf8');
    const result = await adapter.readAll(storeKey);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'ok', val: 1 });
  });

  it('readAll returns [] for completely corrupted store', async () => {
    await writeFile(storeKey, 'NOT_JSON_AT_ALL', 'utf8');
    const result = await adapter.readAll(storeKey);
    expect(result).toEqual([]);
  });

  it('secret safety: adapter records contain only structured data (no raw content)', async () => {
    const safeRecord = { id: 'test', val: 42 };
    await adapter.writeAll(storeKey, [safeRecord]);
    const result = await adapter.readAll(storeKey);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('rawPrompt');
    expect(serialized).not.toContain('apiKey');
    expect(serialized).not.toContain('privateMemory');
  });
});

// ─── FileKeyValueAdapter ───────────────────────────────────────────────────────

describe('FileKeyValueAdapter', () => {
  let tmpDir: string;
  let adapter: FileKeyValueAdapter<{ id: string; label: string }>;

  beforeEach(async () => {
    tmpDir = await makeTmpDir();
    adapter = new FileKeyValueAdapter();
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('has adapterType "file"', () => {
    expect(adapter.adapterType).toBe('file');
  });

  it('write and read round-trip by ID', async () => {
    const record = { id: 'snap-001', label: 'test-snapshot' };
    await adapter.write(tmpDir, 'snap-001', record);
    const result = await adapter.read(tmpDir, 'snap-001');
    expect(result).toEqual(record);
  });

  it('read returns null for non-existent ID', async () => {
    const result = await adapter.read(tmpDir, 'not-found');
    expect(result).toBeNull();
  });

  it('write creates the directory if it does not exist', async () => {
    const nested = path.join(tmpDir, 'deeply', 'nested');
    const record = { id: 'x', label: 'nested' };
    await adapter.write(nested, 'x', record);
    const result = await adapter.read(nested, 'x');
    expect(result).toEqual(record);
  });

  it('write overwrites existing record', async () => {
    await adapter.write(tmpDir, 'snap-001', { id: 'snap-001', label: 'v1' });
    await adapter.write(tmpDir, 'snap-001', { id: 'snap-001', label: 'v2' });
    const result = await adapter.read(tmpDir, 'snap-001');
    expect(result?.label).toBe('v2');
  });

  it('secret safety: write does not add raw prompt, secret, or key fields', async () => {
    const safeRecord = { id: 'snap-safe', label: 'BOUNDED_LOCAL' };
    await adapter.write(tmpDir, 'snap-safe', safeRecord);
    const result = await adapter.read(tmpDir, 'snap-safe');
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('rawPrompt');
    expect(serialized).not.toContain('apiKey');
    expect(serialized).not.toContain('providerSecret');
  });
});

// ─── SQLiteEventListAdapter ───────────────────────────────────────────────────

describe('SQLiteEventListAdapter', () => {
  let tmpDir: string;
  let storeKey: string;
  let adapter: SQLiteEventListAdapter<{ id: string; val: number }>;

  beforeEach(async () => {
    tmpDir = await makeTmpDir();
    storeKey = path.join(tmpDir, 'events.sqlite');
    adapter = new SQLiteEventListAdapter();
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('has adapterType "sqlite"', () => {
    expect(adapter.adapterType).toBe('sqlite');
  });

  it('writeAll persists ordered items and readAll retrieves them', async () => {
    const items = [{ id: 'a', val: 1 }, { id: 'b', val: 2 }];
    await adapter.writeAll(storeKey, items);
    await adapter.writeAll(storeKey, [...items, { id: 'c', val: 3 }]);
    const result = await adapter.readAll(storeKey);
    expect(result).toEqual([...items, { id: 'c', val: 3 }]);
  });

  it('writeRaw accepts a JSON array for compatibility callers', async () => {
    await adapter.writeRaw(storeKey, JSON.stringify([{ id: 'raw', val: 4 }]));
    const result = await adapter.readAll(storeKey);
    expect(result).toEqual([{ id: 'raw', val: 4 }]);
  });

  it('append assigns the next ordered position atomically in local SQLite', async () => {
    await adapter.append(storeKey, { id: 'a', val: 1 });
    await adapter.append(storeKey, { id: 'b', val: 2 });
    expect(await adapter.readAll(storeKey)).toEqual([
      { id: 'a', val: 1 },
      { id: 'b', val: 2 },
    ]);
  });
});

// ─── SQLiteKeyValueAdapter ────────────────────────────────────────────────────

describe('SQLiteKeyValueAdapter', () => {
  let tmpDir: string;
  let adapter: SQLiteKeyValueAdapter<{ id: string; label: string }>;

  beforeEach(async () => {
    tmpDir = await makeTmpDir();
    adapter = new SQLiteKeyValueAdapter();
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('has adapterType "sqlite"', () => {
    expect(adapter.adapterType).toBe('sqlite');
  });

  it('write and read round-trip by ID', async () => {
    await adapter.write(tmpDir, 'snap-001', { id: 'snap-001', label: 'sqlite' });
    const result = await adapter.read(tmpDir, 'snap-001');
    expect(result).toEqual({ id: 'snap-001', label: 'sqlite' });
  });

  it('read returns null for non-existent ID', async () => {
    expect(await adapter.read(tmpDir, 'missing')).toBeNull();
  });
});

// ─── RedisEventListAdapter stub ───────────────────────────────────────────────

class FakeEventRedisClient implements RedisEventListClient {
  evalCalls: Array<{ script: string; keys: string[]; args: Array<string | number> }> = [];
  rows: string[] = [];

  async eval<TData>(script: string, keys: string[], args: Array<string | number>): Promise<TData> {
    this.evalCalls.push({ script, keys, args });
    return 1 as TData;
  }

  async zrange<TData>(): Promise<TData[]> {
    return this.rows as TData[];
  }
}

describe('RedisEventListAdapter', () => {
  const adapter = new RedisEventListAdapter();

  it('has adapterType "redis"', () => {
    expect(adapter.adapterType).toBe('redis');
  });

  it('reports blocked capability without a client and performs no I/O', () => {
    expect(adapter.describeCapability()).toEqual(expect.objectContaining({
      implementationStatus: 'BLOCKED_CONFIGURATION',
      distributed: true,
      atomicAppend: false,
      livenessChecked: false,
    }));
  });

  it('fails closed when Redis configuration is absent', async () => {
    await expect(adapter.append('events', { id: 'a' })).rejects.toThrow('CVF_CONFIGURATION_ERROR');
  });

  it('uses one atomic script for append, expiry, and expired-record removal', async () => {
    const client = new FakeEventRedisClient();
    const active = new RedisEventListAdapter(client);
    await active.append('cvf:audit', { id: 'a', timestamp: '2026-08-10T00:00:00.000Z' });

    expect(client.evalCalls).toHaveLength(1);
    expect(client.evalCalls[0].keys).toEqual(['cvf:audit']);
    expect(client.evalCalls[0].script).toContain("redis.call('ZADD'");
    expect(client.evalCalls[0].script).toContain("redis.call('ZREMRANGEBYSCORE'");
    expect(client.evalCalls[0].script).toContain("redis.call('EXPIRE'");
    expect(client.evalCalls[0].args.at(-1)).toBe(CONTROL_PLANE_RETENTION_SECONDS);
  });

  it('reports static distributed capability without a probe', () => {
    const client = new FakeEventRedisClient();
    const active = new RedisEventListAdapter(client);
    expect(active.describeCapability()).toEqual(expect.objectContaining({
      implementationStatus: 'ACTIVE_DISTRIBUTED',
      atomicAppend: true,
      retentionSeconds: 2_592_000,
      livenessChecked: false,
    }));
    expect(client.evalCalls).toHaveLength(0);
  });

  it('reads deterministic sorted-set records through the injected client', async () => {
    const client = new FakeEventRedisClient();
    client.rows = [JSON.stringify({ id: 'a', val: 1 })];
    const active = new RedisEventListAdapter<{ id: string; val: number }>(client);
    expect(await active.readAll('cvf:audit')).toEqual([{ id: 'a', val: 1 }]);
  });
});

// ─── RedisKeyValueAdapter stub ────────────────────────────────────────────────

describe('RedisKeyValueAdapter stub', () => {
  const adapter = new RedisKeyValueAdapter();

  it('has adapterType "redis"', () => {
    expect(adapter.adapterType).toBe('redis');
  });

  it('write throws CVF_NOT_IMPLEMENTED', async () => {
    await expect(adapter.write('dir', 'id', {})).rejects.toThrow('CVF_NOT_IMPLEMENTED');
  });

  it('read throws CVF_NOT_IMPLEMENTED', async () => {
    await expect(adapter.read('dir', 'id')).rejects.toThrow('CVF_NOT_IMPLEMENTED');
  });
});

// ─── buildEventListAdapter factory ───────────────────────────────────────────

describe('buildEventListAdapter factory', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.CVF_STORAGE_ADAPTER_TYPE;
    delete process.env.CVF_STORAGE_ADAPTER_TYPE;
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.CVF_STORAGE_ADAPTER_TYPE;
    } else {
      process.env.CVF_STORAGE_ADAPTER_TYPE = originalEnv;
    }
  });

  it('returns FileEventListAdapter when type absent (default)', () => {
    const adapter = buildEventListAdapter();
    expect(adapter.adapterType).toBe('file');
    expect(adapter).toBeInstanceOf(FileEventListAdapter);
  });

  it('returns FileEventListAdapter for type "file"', () => {
    const adapter = buildEventListAdapter('file');
    expect(adapter.adapterType).toBe('file');
  });

  it('returns RedisEventListAdapter for type "redis"', () => {
    const adapter = buildEventListAdapter('redis');
    expect(adapter.adapterType).toBe('redis');
    expect(adapter).toBeInstanceOf(RedisEventListAdapter);
  });

  it('returns SQLiteEventListAdapter for type "sqlite"', () => {
    const adapter = buildEventListAdapter('sqlite');
    expect(adapter.adapterType).toBe('sqlite');
    expect(adapter).toBeInstanceOf(SQLiteEventListAdapter);
  });

  it('reads CVF_STORAGE_ADAPTER_TYPE env to select adapter', () => {
    process.env.CVF_STORAGE_ADAPTER_TYPE = 'sqlite';
    const adapter = buildEventListAdapter();
    expect(adapter.adapterType).toBe('sqlite');
  });

  it('throws CVF_CONFIGURATION_ERROR for unknown type', () => {
    expect(() => buildEventListAdapter('unknown-backend')).toThrow('CVF_CONFIGURATION_ERROR');
  });

  it('explicit type argument overrides env variable', () => {
    process.env.CVF_STORAGE_ADAPTER_TYPE = 'redis';
    const adapter = buildEventListAdapter('file');
    expect(adapter.adapterType).toBe('file');
  });
});

// ─── buildKeyValueAdapter factory ────────────────────────────────────────────

describe('buildKeyValueAdapter factory', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.CVF_STORAGE_ADAPTER_TYPE;
    delete process.env.CVF_STORAGE_ADAPTER_TYPE;
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.CVF_STORAGE_ADAPTER_TYPE;
    } else {
      process.env.CVF_STORAGE_ADAPTER_TYPE = originalEnv;
    }
  });

  it('returns FileKeyValueAdapter when type absent (default)', () => {
    const adapter = buildKeyValueAdapter();
    expect(adapter.adapterType).toBe('file');
    expect(adapter).toBeInstanceOf(FileKeyValueAdapter);
  });

  it('returns FileKeyValueAdapter for type "file"', () => {
    const adapter = buildKeyValueAdapter('file');
    expect(adapter.adapterType).toBe('file');
  });

  it('returns RedisKeyValueAdapter for type "redis"', () => {
    const adapter = buildKeyValueAdapter('redis');
    expect(adapter.adapterType).toBe('redis');
    expect(adapter).toBeInstanceOf(RedisKeyValueAdapter);
  });

  it('returns SQLiteKeyValueAdapter for type "sqlite"', () => {
    const adapter = buildKeyValueAdapter('sqlite');
    expect(adapter.adapterType).toBe('sqlite');
    expect(adapter).toBeInstanceOf(SQLiteKeyValueAdapter);
  });

  it('reads CVF_STORAGE_ADAPTER_TYPE env to select adapter', () => {
    process.env.CVF_STORAGE_ADAPTER_TYPE = 'file';
    const adapter = buildKeyValueAdapter();
    expect(adapter.adapterType).toBe('file');
  });

  it('throws CVF_CONFIGURATION_ERROR for unknown type', () => {
    expect(() => buildKeyValueAdapter('bad-type')).toThrow('CVF_CONFIGURATION_ERROR');
  });
});
