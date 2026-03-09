/**
 * Tests for JsonFileAdapter persistence
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JsonFileAdapter } from './json-file.adapter.js';
import { rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { GuardAuditEntry } from '../guards/types.js';
import type { SessionState } from './persistence.interface.js';

function makeTestDir(): string {
  return join(tmpdir(), `cvf-test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
}

function makeAuditEntry(overrides?: Partial<GuardAuditEntry>): GuardAuditEntry {
  return {
    requestId: `req-${Date.now()}`,
    timestamp: new Date().toISOString(),
    context: {
      requestId: 'req-001',
      phase: 'BUILD',
      riskLevel: 'R0',
      role: 'HUMAN',
      action: 'test',
    },
    pipelineResult: {
      requestId: 'req-001',
      finalDecision: 'ALLOW',
      results: [],
      executedAt: new Date().toISOString(),
      durationMs: 1,
    },
    ...overrides,
  };
}

describe('JsonFileAdapter', () => {
  let adapter: JsonFileAdapter;
  let testDir: string;

  beforeEach(async () => {
    testDir = makeTestDir();
    adapter = new JsonFileAdapter({ dataDir: testDir });
    await adapter.init();
  });

  afterEach(async () => {
    await adapter.close();
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  describe('init', () => {
    it('creates data directory', () => {
      expect(existsSync(testDir)).toBe(true);
    });

    it('creates audit log file on first save', async () => {
      await adapter.saveAuditEntry(makeAuditEntry());
      expect(existsSync(join(testDir, 'audit-log.json'))).toBe(true);
    });

    it('is idempotent', async () => {
      await adapter.init();
      await adapter.init();
      expect(existsSync(testDir)).toBe(true);
    });
  });

  describe('audit entries', () => {
    it('saves and retrieves an entry', async () => {
      const entry = makeAuditEntry({ requestId: 'save-test' });
      await adapter.saveAuditEntry(entry);
      const entries = await adapter.getAuditEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].requestId).toBe('save-test');
    });

    it('saves multiple entries', async () => {
      await adapter.saveAuditEntry(makeAuditEntry({ requestId: 'a' }));
      await adapter.saveAuditEntry(makeAuditEntry({ requestId: 'b' }));
      await adapter.saveAuditEntry(makeAuditEntry({ requestId: 'c' }));
      const entries = await adapter.getAuditEntries();
      expect(entries).toHaveLength(3);
    });

    it('filters by requestId', async () => {
      await adapter.saveAuditEntry(makeAuditEntry({ requestId: 'find-me' }));
      await adapter.saveAuditEntry(makeAuditEntry({ requestId: 'not-me' }));
      const entries = await adapter.getAuditEntries({ requestId: 'find-me' });
      expect(entries).toHaveLength(1);
      expect(entries[0].requestId).toBe('find-me');
    });

    it('limits results', async () => {
      for (let i = 0; i < 10; i++) {
        await adapter.saveAuditEntry(makeAuditEntry({ requestId: `r-${i}` }));
      }
      const entries = await adapter.getAuditEntries({ limit: 3 });
      expect(entries).toHaveLength(3);
    });

    it('supports offset', async () => {
      for (let i = 0; i < 5; i++) {
        await adapter.saveAuditEntry(makeAuditEntry({ requestId: `r-${i}` }));
      }
      const entries = await adapter.getAuditEntries({ offset: 3 });
      expect(entries).toHaveLength(2);
      expect(entries[0].requestId).toBe('r-3');
    });

    it('supports limit + offset', async () => {
      for (let i = 0; i < 10; i++) {
        await adapter.saveAuditEntry(makeAuditEntry({ requestId: `r-${i}` }));
      }
      const entries = await adapter.getAuditEntries({ offset: 2, limit: 3 });
      expect(entries).toHaveLength(3);
      expect(entries[0].requestId).toBe('r-2');
    });

    it('returns count', async () => {
      await adapter.saveAuditEntry(makeAuditEntry());
      await adapter.saveAuditEntry(makeAuditEntry());
      expect(await adapter.getAuditEntryCount()).toBe(2);
    });

    it('clears all entries', async () => {
      await adapter.saveAuditEntry(makeAuditEntry());
      await adapter.saveAuditEntry(makeAuditEntry());
      await adapter.clearAuditEntries();
      expect(await adapter.getAuditEntryCount()).toBe(0);
    });

    it('persists across adapter instances', async () => {
      await adapter.saveAuditEntry(makeAuditEntry({ requestId: 'persist-test' }));
      await adapter.close();

      const adapter2 = new JsonFileAdapter({ dataDir: testDir });
      await adapter2.init();
      const entries = await adapter2.getAuditEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].requestId).toBe('persist-test');
      await adapter2.close();
    });

    it('returns empty array when no entries', async () => {
      const entries = await adapter.getAuditEntries();
      expect(entries).toEqual([]);
    });

    it('returns 0 count when no entries', async () => {
      expect(await adapter.getAuditEntryCount()).toBe(0);
    });
  });

  describe('session state', () => {
    it('saves and retrieves session', async () => {
      const session: SessionState = {
        sessionId: 'test-session',
        currentPhase: 'BUILD',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await adapter.saveSessionState(session);
      const result = await adapter.getSessionState('test-session');
      expect(result).toBeDefined();
      expect(result!.currentPhase).toBe('BUILD');
    });

    it('returns null for non-existent session', async () => {
      const result = await adapter.getSessionState('nonexistent');
      expect(result).toBeNull();
    });

    it('updates existing session', async () => {
      const session: SessionState = {
        sessionId: 'update-test',
        currentPhase: 'DISCOVERY',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await adapter.saveSessionState(session);
      session.currentPhase = 'DESIGN';
      await adapter.saveSessionState(session);

      const result = await adapter.getSessionState('update-test');
      expect(result!.currentPhase).toBe('DESIGN');
    });

    it('updates updatedAt on save', async () => {
      const session: SessionState = {
        sessionId: 'timestamp-test',
        currentPhase: 'DISCOVERY',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      await adapter.saveSessionState(session);
      const result = await adapter.getSessionState('timestamp-test');
      expect(result!.updatedAt).not.toBe('2026-01-01T00:00:00.000Z');
    });

    it('creates default session', async () => {
      const session = await adapter.getOrCreateDefaultSession();
      expect(session.sessionId).toBe('cvf-default-session');
      expect(session.currentPhase).toBe('DISCOVERY');
    });

    it('returns existing default session', async () => {
      const session1 = await adapter.getOrCreateDefaultSession();
      session1.currentPhase = 'BUILD';
      await adapter.saveSessionState(session1);

      const session2 = await adapter.getOrCreateDefaultSession();
      expect(session2.currentPhase).toBe('BUILD');
    });

    it('persists sessions across instances', async () => {
      const session: SessionState = {
        sessionId: 'persist-session',
        currentPhase: 'REVIEW',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await adapter.saveSessionState(session);
      await adapter.close();

      const adapter2 = new JsonFileAdapter({ dataDir: testDir });
      await adapter2.init();
      const result = await adapter2.getSessionState('persist-session');
      expect(result!.currentPhase).toBe('REVIEW');
      await adapter2.close();
    });

    it('stores metadata', async () => {
      const session: SessionState = {
        sessionId: 'meta-test',
        currentPhase: 'BUILD',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: { projectName: 'My App', guardCount: 6 },
      };
      await adapter.saveSessionState(session);
      const result = await adapter.getSessionState('meta-test');
      expect(result!.metadata).toEqual({ projectName: 'My App', guardCount: 6 });
    });
  });

  describe('close', () => {
    it('flushes data on close', async () => {
      await adapter.saveAuditEntry(makeAuditEntry({ requestId: 'flush-test' }));
      await adapter.close();

      const adapter2 = new JsonFileAdapter({ dataDir: testDir });
      await adapter2.init();
      const entries = await adapter2.getAuditEntries();
      expect(entries).toHaveLength(1);
      await adapter2.close();
    });

    it('can be called multiple times safely', async () => {
      await adapter.close();
      await adapter.close();
    });
  });

  describe('pretty print option', () => {
    it('defaults to pretty print', async () => {
      await adapter.saveAuditEntry(makeAuditEntry());
      const { readFile: rf } = await import('node:fs/promises');
      const content = await rf(join(testDir, 'audit-log.json'), 'utf-8');
      expect(content).toContain('\n');
    });

    it('supports compact mode', async () => {
      const compact = new JsonFileAdapter({ dataDir: testDir, prettyPrint: false });
      await compact.init();
      await compact.saveAuditEntry(makeAuditEntry());
      const { readFile: rf } = await import('node:fs/promises');
      const content = await rf(join(testDir, 'audit-log.json'), 'utf-8');
      expect(content).not.toContain('\n');
      await compact.close();
    });
  });
});
