/**
 * SQLite AuditDatabase Tests
 * ===========================
 * Uses an in-memory :memory: SQLite DB for fast, isolated testing.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { TraceEntry } from './trace-emitter';

// Import dynamically to handle environments where better-sqlite3 isn't compiled
// These tests run only when the module is available
let AuditDatabase: typeof import('./sqlite-db.js').AuditDatabase = undefined!;

try {
  const mod = await import('./sqlite-db.js');
  AuditDatabase = mod.AuditDatabase;
} catch {
  // better-sqlite3 not compiled for this env — skip
}

function mockEntry(overrides?: Partial<TraceEntry>): TraceEntry {
  return {
    traceId: `trace-${Math.random().toString(36).slice(2, 8)}`,
    traceHash: 'abc123def456abcd',
    requestId: `req-${Math.random().toString(36).slice(2, 8)}`,
    channel: 'mcp',
    timestamp: new Date().toISOString(),
    context: {
      requestId: 'req-001',
      phase: 'BUILD',
      riskLevel: 'R0',
      role: 'HUMAN',
      action: 'write code',
      channel: 'mcp',
    },
    pipelineResult: {
      requestId: 'req-001',
      finalDecision: 'ALLOW',
      results: [],
      executedAt: new Date().toISOString(),
      durationMs: 5,
    },
    ...overrides,
  };
}

describe.skipIf(!AuditDatabase)('AuditDatabase', () => {
  let db: InstanceType<typeof AuditDatabase>;

  beforeEach(() => {
    // Use in-memory DB for tests
    db = new AuditDatabase(':memory:');
  });

  it('initializes schema on first use', () => {
    db.init();
    expect(db.count()).toBe(0);
  });

  it('inserts and retrieves entries', () => {
    const entry = mockEntry({ requestId: 'req-insert-test', channel: 'cli' });
    db.insert(entry);

    const rows = db.query();
    expect(rows.length).toBe(1);
    expect(rows[0].request_id).toBe('req-insert-test');
    expect(rows[0].channel).toBe('cli');
  });

  it('inserts multiple entries', () => {
    db.insert(mockEntry());
    db.insert(mockEntry());
    db.insert(mockEntry());
    expect(db.count()).toBe(3);
  });

  it('ignores duplicate traceId (idempotent)', () => {
    const entry = mockEntry({ traceId: 'fixed-trace-id' });
    db.insert(entry);
    db.insert(entry); // duplicate
    expect(db.count()).toBe(1);
  });

  it('filters by channel', () => {
    db.insert(mockEntry({ channel: 'mcp' }));
    db.insert(mockEntry({ channel: 'web' }));
    db.insert(mockEntry({ channel: 'mcp' }));

    expect(db.count({ channel: 'mcp' })).toBe(2);
    expect(db.count({ channel: 'web' })).toBe(1);
  });

  it('filters by decision', () => {
    const block = mockEntry();
    block.pipelineResult.finalDecision = 'BLOCK';
    db.insert(mockEntry()); // ALLOW
    db.insert(block);

    expect(db.count({ decision: 'ALLOW' })).toBe(1);
    expect(db.count({ decision: 'BLOCK' })).toBe(1);
  });

  it('retrieves by requestId', () => {
    db.insert(mockEntry({ requestId: 'target-req' }));
    db.insert(mockEntry({ requestId: 'other-req' }));

    const row = db.getByRequestId('target-req');
    expect(row).toBeDefined();
    expect(row!.request_id).toBe('target-req');
  });

  it('returns undefined for missing requestId', () => {
    expect(db.getByRequestId('nonexistent')).toBeUndefined();
  });

  it('respects limit in query', () => {
    for (let i = 0; i < 10; i++) db.insert(mockEntry());
    expect(db.query({ limit: 3 }).length).toBe(3);
  });

  it('returns stats summary', () => {
    db.insert(mockEntry()); // ALLOW
    const blockEntry = mockEntry();
    blockEntry.pipelineResult.finalDecision = 'BLOCK';
    db.insert(blockEntry);

    const stats = db.stats();
    expect(stats.total).toBe(2);
    expect(stats.allow).toBe(1);
    expect(stats.block).toBe(1);
    expect(stats.escalate).toBe(0);
  });
});
