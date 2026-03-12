/**
 * CVF SQLite Audit Database
 * ==========================
 * Persistent audit log storage using SQLite (better-sqlite3).
 * Replaces the file-based JSON approach from Sprint 1.
 *
 * Sprint 4 — Production Hardening
 *
 * @module cvf-guard-contract/audit/sqlite-db
 */

import type { TraceEntry } from './trace-emitter.js';

/**
 * Minimal interface for better-sqlite3 to avoid hard dependency in tests.
 * The actual Database class is dynamically imported only when needed.
 */
export interface DatabaseRow {
  trace_id: string;
  trace_hash: string;
  request_id: string;
  channel: string;
  timestamp: string;
  final_decision: string;
  blocked_by: string | null;
  escalated_by: string | null;
  duration_ms: number;
  context_json: string;
  result_json: string;
}

export interface AuditQueryOptions {
  limit?: number;
  offset?: number;
  channel?: string;
  decision?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Thin SQLite wrapper for CVF audit entries.
 * Uses WAL mode for concurrent read performance.
 */
export class AuditDatabase {
  private db: ReturnType<typeof import('better-sqlite3')> | null = null;
  private dbPath: string;
  private initialized = false;

  constructor(dbPath = 'logs/audit/cvf-audit.db') {
    this.dbPath = dbPath;
  }

  /** Lazily initialize — creates DB and schema on first call. */
  init(): void {
    if (this.initialized) return;

    // Dynamic require to support environments without better-sqlite3
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require('better-sqlite3');
    const { mkdirSync } = require('fs');
    const { dirname } = require('path');

    mkdirSync(dirname(this.dbPath), { recursive: true });

    this.db = new Database(this.dbPath);

    // Enable WAL mode for better read concurrency
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        trace_id      TEXT NOT NULL UNIQUE,
        trace_hash    TEXT NOT NULL,
        request_id    TEXT NOT NULL,
        channel       TEXT NOT NULL DEFAULT 'unknown',
        timestamp     TEXT NOT NULL,
        final_decision TEXT NOT NULL,
        blocked_by    TEXT,
        escalated_by  TEXT,
        duration_ms   INTEGER NOT NULL DEFAULT 0,
        context_json  TEXT NOT NULL,
        result_json   TEXT NOT NULL,
        created_at    TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_request_id    ON audit_log(request_id);
      CREATE INDEX IF NOT EXISTS idx_timestamp     ON audit_log(timestamp);
      CREATE INDEX IF NOT EXISTS idx_final_decision ON audit_log(final_decision);
      CREATE INDEX IF NOT EXISTS idx_channel       ON audit_log(channel);
    `);

    this.initialized = true;
  }

  /** Insert a trace entry into the audit log. */
  insert(entry: TraceEntry): void {
    this.init();
    const stmt = this.db!.prepare(`
      INSERT OR IGNORE INTO audit_log
        (trace_id, trace_hash, request_id, channel, timestamp, final_decision,
         blocked_by, escalated_by, duration_ms, context_json, result_json)
      VALUES
        (@trace_id, @trace_hash, @request_id, @channel, @timestamp, @final_decision,
         @blocked_by, @escalated_by, @duration_ms, @context_json, @result_json)
    `);

    stmt.run({
      trace_id: entry.traceId,
      trace_hash: entry.traceHash,
      request_id: entry.requestId,
      channel: entry.channel,
      timestamp: entry.timestamp,
      final_decision: entry.pipelineResult.finalDecision,
      blocked_by: entry.pipelineResult.blockedBy ?? null,
      escalated_by: entry.pipelineResult.escalatedBy ?? null,
      duration_ms: entry.pipelineResult.durationMs,
      context_json: JSON.stringify(entry.context),
      result_json: JSON.stringify(entry.pipelineResult),
    });
  }

  /** Fetch audit entries with optional filters. */
  query(options: AuditQueryOptions = {}): DatabaseRow[] {
    this.init();

    const conditions: string[] = [];
    const params: Record<string, unknown> = {};

    if (options.channel) {
      conditions.push('channel = @channel');
      params.channel = options.channel;
    }
    if (options.decision) {
      conditions.push('final_decision = @decision');
      params.decision = options.decision.toUpperCase();
    }
    if (options.dateFrom) {
      conditions.push('timestamp >= @dateFrom');
      params.dateFrom = options.dateFrom;
    }
    if (options.dateTo) {
      conditions.push('timestamp <= @dateTo');
      params.dateTo = options.dateTo;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = options.limit ?? 50;
    const offset = options.offset ?? 0;

    const stmt = this.db!.prepare(
      `SELECT * FROM audit_log ${where} ORDER BY timestamp DESC LIMIT @limit OFFSET @offset`
    );

    return stmt.all({ ...params, limit, offset }) as DatabaseRow[];
  }

  /** Get a single entry by requestId. */
  getByRequestId(requestId: string): DatabaseRow | undefined {
    this.init();
    const stmt = this.db!.prepare('SELECT * FROM audit_log WHERE request_id = ? ORDER BY timestamp DESC LIMIT 1');
    return stmt.get(requestId) as DatabaseRow | undefined;
  }

  /** Count total entries (with optional filters). */
  count(options: Pick<AuditQueryOptions, 'decision' | 'channel'> = {}): number {
    this.init();
    const conditions: string[] = [];
    const params: Record<string, unknown> = {};

    if (options.channel) {
      conditions.push('channel = @channel');
      params.channel = options.channel;
    }
    if (options.decision) {
      conditions.push('final_decision = @decision');
      params.decision = options.decision.toUpperCase();
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const stmt = this.db!.prepare(`SELECT COUNT(*) as cnt FROM audit_log ${where}`);
    const row = stmt.get(params) as { cnt: number };
    return row.cnt;
  }

  /** Stats summary — counts grouped by decision. */
  stats(): { total: number; allow: number; block: number; escalate: number } {
    this.init();
    const stmt = this.db!.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN final_decision = 'ALLOW' THEN 1 ELSE 0 END) as allow,
        SUM(CASE WHEN final_decision = 'BLOCK' THEN 1 ELSE 0 END) as block,
        SUM(CASE WHEN final_decision = 'ESCALATE' THEN 1 ELSE 0 END) as escalate
      FROM audit_log
    `);
    const row = stmt.get({}) as { total: number; allow: number; block: number; escalate: number };
    return row;
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.initialized = false;
      this.db = null;
    }
  }
}

/** Singleton instance for application use. */
let _defaultDb: AuditDatabase | null = null;
export function getDefaultAuditDb(): AuditDatabase {
  if (!_defaultDb) {
    _defaultDb = new AuditDatabase();
  }
  return _defaultDb;
}
