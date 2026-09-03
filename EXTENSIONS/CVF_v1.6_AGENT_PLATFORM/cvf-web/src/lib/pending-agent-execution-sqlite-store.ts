/** GC010-SCR-R2-T1C specialized durable single-node SQLite store.
 *
 * Implements T1A's synchronous `PendingAgentExecutionStore` interface
 * (`create`, `get`, `compareAndSwap`) with a real conditional
 * `UPDATE ... WHERE pending_execution_id = ? AND record_version = ? AND
 * status = ?` CAS predicate over a local `better-sqlite3` file, per the
 * accepted T1B decision (`docs/assessments/CVF_GC010_SCR_R2_T1B_...md`,
 * Independent Reviewer Contract Correction; Questions 4-12).
 *
 * Single-node, multiple-OS-process boundary only: `better-sqlite3` opens one
 * local file with WAL journal mode and an explicit busy timeout. This module
 * makes no claim of network-filesystem, multi-host, or distributed-lock
 * safety. No route, provider, audit, network, or credential surface is
 * imported or called by this module.
 *
 * Claim boundary: local single-node durable storage adapter only; no route,
 * provider admission/invocation, audit emission, package export, public,
 * deploy, or production claim is made by this file.
 */

import { mkdirSync } from 'node:fs';
import path from 'node:path';

import {
    applyPendingAgentExecutionTransition,
    canonicalizeToJson,
    computeGuardPolicyFingerprint,
    computeRecordDigest,
    validateEnvironmentIdentity,
    validateGuardPolicySnapshot,
    type CompareAndSwapResult,
    type PendingAgentExecutionImmutablePayload,
    type PendingAgentExecutionMutableState,
    type PendingAgentExecutionRecord,
    type PendingAgentExecutionStatus,
    type PendingAgentExecutionStore,
    type PendingAgentExecutionTransition,
} from './pending-agent-execution';

// ---------------------------------------------------------------------------
// Typed store errors
// ---------------------------------------------------------------------------

export type PendingAgentExecutionSqliteStoreErrorCode =
    | 'BUSY_TIMEOUT'
    | 'IO_FAILURE'
    | 'CORRUPT_ROW'
    | 'SCHEMA_MISMATCH';

export class PendingAgentExecutionStoreError extends Error {
    public readonly code: PendingAgentExecutionSqliteStoreErrorCode;

    constructor(code: PendingAgentExecutionSqliteStoreErrorCode, message: string) {
        super(message);
        this.name = 'PendingAgentExecutionStoreError';
        this.code = code;
    }
}

// ---------------------------------------------------------------------------
// better-sqlite3 minimal structural typing (mirrors storage-adapter.ts's own
// local structural interface; this module does not import from or modify
// storage-adapter.ts).
// ---------------------------------------------------------------------------

interface SQLiteRunResult {
    changes: number;
    lastInsertRowid: number | bigint;
}

interface SQLiteStatement {
    run(params?: Record<string, unknown>): SQLiteRunResult;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
}

interface SQLiteDatabase {
    pragma(sql: string, options?: { simple?: boolean }): unknown;
    exec(sql: string): unknown;
    prepare(sql: string): SQLiteStatement;
    transaction<TArgs extends unknown[], TReturn>(
        fn: (...args: TArgs) => TReturn,
    ): ((...args: TArgs) => TReturn) & { immediate: (...args: TArgs) => TReturn };
    close(): void;
}

type SQLiteDatabaseConstructor = new (filename: string) => SQLiteDatabase;

function loadSQLiteDatabase(): SQLiteDatabaseConstructor {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('better-sqlite3') as SQLiteDatabaseConstructor;
}

function sqliteErrorMessage(error: unknown): string {
    return String((error as { message?: unknown } | undefined)?.message ?? error);
}

function isSqliteBusyError(error: unknown): boolean {
    const code = String((error as { code?: unknown } | undefined)?.code ?? '');
    return code.startsWith('SQLITE_BUSY') || /SQLITE_BUSY|database is locked/i.test(sqliteErrorMessage(error));
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

export const PENDING_AGENT_EXECUTION_SQLITE_SCHEMA_VERSION = 'cvf.pendingAgentExecutionSqlite.v1' as const;
const REQUIRED_USER_VERSION = 1;

const STATUS_VALUES: readonly PendingAgentExecutionStatus[] = [
    'CREATED',
    'CLAIMED',
    'EXECUTING',
    'SUCCEEDED',
    'FAILED',
    'DENIED',
    'UNKNOWN_TERMINAL',
    'EXPIRED',
    'STALE',
    'ABANDONED_BEFORE_START',
];
const STATUS_VALUE_SET: ReadonlySet<string> = new Set(STATUS_VALUES);

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS pending_agent_execution (
  pending_execution_id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  created_at TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  guard_policy_fingerprint TEXT NOT NULL,
  record_digest TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('CREATED','CLAIMED','EXECUTING','SUCCEEDED','FAILED','DENIED','EXPIRED','STALE','ABANDONED_BEFORE_START','UNKNOWN_TERMINAL')),
  record_version INTEGER NOT NULL DEFAULT 0 CHECK (record_version >= 0),
  claim_id TEXT,
  claimed_at TEXT,
  claimed_by_json TEXT,
  attempt_index INTEGER,
  request_id TEXT,
  terminal_reason TEXT,
  terminal_at TEXT
);
`;

const CREATE_INDEX_SQL = `
CREATE INDEX IF NOT EXISTS idx_pending_agent_execution_status
  ON pending_agent_execution(status);
`;

interface PendingAgentExecutionRow {
    pending_execution_id: string;
    schema_version: string;
    created_at: string;
    payload_json: string;
    guard_policy_fingerprint: string;
    record_digest: string;
    status: string;
    record_version: number;
    claim_id: string | null;
    claimed_at: string | null;
    claimed_by_json: string | null;
    attempt_index: number | null;
    request_id: string | null;
    terminal_reason: string | null;
    terminal_at: string | null;
}

type PersistedClaimedBy = NonNullable<PendingAgentExecutionMutableState['claimedBy']>;

interface SQLiteTableInfoRow {
    name: string;
    type: string;
    notnull: number;
    pk: number;
}

const REQUIRED_COLUMNS: ReadonlyArray<readonly [string, string, number, number]> = [
    ['pending_execution_id', 'TEXT', 0, 1],
    ['schema_version', 'TEXT', 1, 0],
    ['created_at', 'TEXT', 1, 0],
    ['payload_json', 'TEXT', 1, 0],
    ['guard_policy_fingerprint', 'TEXT', 1, 0],
    ['record_digest', 'TEXT', 1, 0],
    ['status', 'TEXT', 1, 0],
    ['record_version', 'INTEGER', 1, 0],
    ['claim_id', 'TEXT', 0, 0],
    ['claimed_at', 'TEXT', 0, 0],
    ['claimed_by_json', 'TEXT', 0, 0],
    ['attempt_index', 'INTEGER', 0, 0],
    ['request_id', 'TEXT', 0, 0],
    ['terminal_reason', 'TEXT', 0, 0],
    ['terminal_at', 'TEXT', 0, 0],
];

function isPendingAgentExecutionRow(value: unknown): value is PendingAgentExecutionRow {
    return typeof value === 'object' && value !== null && 'pending_execution_id' in value;
}

function validatePersistedClaimedBy(value: unknown): PersistedClaimedBy {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new PendingAgentExecutionStoreError('CORRUPT_ROW', 'stored claimed_by_json is not an actor binding object');
    }
    const actor = value as Record<string, unknown>;
    const validNullableScope = (scope: unknown) => scope === null || typeof scope === 'string';
    if (
        typeof actor.actorId !== 'string' || actor.actorId.length === 0 ||
        !validNullableScope(actor.actorOrgId) ||
        !validNullableScope(actor.actorTeamId) ||
        (actor.actorAuthMode !== 'session' && actor.actorAuthMode !== 'service')
    ) {
        throw new PendingAgentExecutionStoreError('CORRUPT_ROW', 'stored claimed_by_json has an invalid actor binding shape');
    }
    return actor as PersistedClaimedBy;
}

function validateDatabaseSchema(db: SQLiteDatabase): void {
    const tableInfo = db.prepare("PRAGMA table_info('pending_agent_execution')").all() as SQLiteTableInfoRow[];
    const columnsMatch = tableInfo.length === REQUIRED_COLUMNS.length && tableInfo.every((column, index) => {
        const expected = REQUIRED_COLUMNS[index];
        return expected !== undefined && column.name === expected[0] && column.type.toUpperCase() === expected[1] &&
            column.notnull === expected[2] && column.pk === expected[3];
    });
    if (!columnsMatch) {
        throw new PendingAgentExecutionStoreError('SCHEMA_MISMATCH', 'pending_agent_execution has an unknown or partial column schema');
    }

    const tableSqlRow = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'pending_agent_execution'").get() as { sql?: unknown } | undefined;
    const tableSql = typeof tableSqlRow?.sql === 'string' ? tableSqlRow.sql.replace(/\s+/g, ' ').toLowerCase() : '';
    const hasEveryStatus = STATUS_VALUES.every((status) => tableSql.includes(`'${status.toLowerCase()}'`));
    if (!tableSql.includes('check (record_version >= 0)') || !tableSql.includes('check (status in (') || !hasEveryStatus) {
        throw new PendingAgentExecutionStoreError('SCHEMA_MISMATCH', 'pending_agent_execution is missing required check constraints');
    }

    const indexRows = db.prepare("PRAGMA index_list('pending_agent_execution')").all() as Array<{ name?: unknown; unique?: unknown }>;
    const statusIndex = indexRows.find((row) => row.name === 'idx_pending_agent_execution_status');
    const statusIndexColumns = db.prepare("PRAGMA index_info('idx_pending_agent_execution_status')").all() as Array<{ name?: unknown }>;
    if (!statusIndex || statusIndex.unique !== 0 || statusIndexColumns.length !== 1 || statusIndexColumns[0]?.name !== 'status') {
        throw new PendingAgentExecutionStoreError('SCHEMA_MISMATCH', 'pending_agent_execution status index is missing');
    }
}

// ---------------------------------------------------------------------------
// Row <-> record codec
// ---------------------------------------------------------------------------

function isCanonicalIsoTimestamp(value: unknown): value is string {
    if (typeof value !== 'string') return false;
    const millis = Date.parse(value);
    return Number.isFinite(millis) && new Date(millis).toISOString() === value;
}

function encodeRecordToRow(record: PendingAgentExecutionRecord): PendingAgentExecutionRow {
    return {
        pending_execution_id: record.pendingExecutionId,
        schema_version: PENDING_AGENT_EXECUTION_SQLITE_SCHEMA_VERSION,
        created_at: record.createdAt,
        payload_json: canonicalizeToJson(record.payload),
        guard_policy_fingerprint: record.guardPolicyFingerprint,
        record_digest: record.recordDigest,
        status: record.state.status,
        record_version: record.state.recordVersion,
        claim_id: record.state.claimId,
        claimed_at: record.state.claimedAt,
        claimed_by_json: record.state.claimedBy === null ? null : canonicalizeToJson(record.state.claimedBy),
        attempt_index: record.state.attemptIndex,
        request_id: record.state.requestId,
        terminal_reason: record.state.terminalReason,
        terminal_at: record.state.terminalAt,
    };
}

/**
 * Decodes and fully validates a persisted row. Any unknown schema, malformed
 * JSON/state, non-integer version, invalid timestamp, nullable-state
 * invariant violation, or digest mismatch throws `CORRUPT_ROW`. This
 * function never repairs, deletes, skips, or substitutes a default for an
 * invalid row: a corrupt row is a fail-closed condition, not an absent one.
 */
function decodeRowToRecord(rowUnknown: unknown): PendingAgentExecutionRecord {
    if (!isPendingAgentExecutionRow(rowUnknown)) {
        throw new PendingAgentExecutionStoreError('CORRUPT_ROW', 'stored row has an unrecognized shape');
    }
    const row = rowUnknown;

    if (row.schema_version !== PENDING_AGENT_EXECUTION_SQLITE_SCHEMA_VERSION) {
        throw new PendingAgentExecutionStoreError(
            'SCHEMA_MISMATCH',
            `stored row schema_version "${row.schema_version}" does not match required "${PENDING_AGENT_EXECUTION_SQLITE_SCHEMA_VERSION}"`,
        );
    }
    if (typeof row.pending_execution_id !== 'string' || row.pending_execution_id.length === 0) {
        throw new PendingAgentExecutionStoreError('CORRUPT_ROW', 'stored row has an invalid pending_execution_id');
    }
    if (!isCanonicalIsoTimestamp(row.created_at)) {
        throw new PendingAgentExecutionStoreError('CORRUPT_ROW', 'stored row has an invalid created_at timestamp');
    }
    if (!STATUS_VALUE_SET.has(row.status)) {
        throw new PendingAgentExecutionStoreError('CORRUPT_ROW', `stored row has an invalid status "${row.status}"`);
    }
    if (!Number.isInteger(row.record_version) || row.record_version < 0) {
        throw new PendingAgentExecutionStoreError('CORRUPT_ROW', 'stored row has an invalid record_version');
    }
    if (row.attempt_index !== null && (!Number.isInteger(row.attempt_index) || row.attempt_index < 0)) {
        throw new PendingAgentExecutionStoreError('CORRUPT_ROW', 'stored row has an invalid attempt_index');
    }
    if (row.claimed_at !== null && !isCanonicalIsoTimestamp(row.claimed_at)) {
        throw new PendingAgentExecutionStoreError('CORRUPT_ROW', 'stored row has an invalid claimed_at timestamp');
    }
    if (row.terminal_at !== null && !isCanonicalIsoTimestamp(row.terminal_at)) {
        throw new PendingAgentExecutionStoreError('CORRUPT_ROW', 'stored row has an invalid terminal_at timestamp');
    }

    // Nullable-state invariants mirror the actual T1A transition graph.
    // EXPIRED and a CREATED-origin STALE row legitimately have no claim;
    // CLAIMED-origin states carry the complete claim tuple and request ID.
    const claimFieldsPresence = [
        row.claim_id !== null,
        row.claimed_at !== null,
        row.claimed_by_json !== null,
        row.request_id !== null,
    ];
    const allClaimFieldsPresent = claimFieldsPresence.every(Boolean);
    const noClaimFieldsPresent = claimFieldsPresence.every((present) => !present);
    if (!allClaimFieldsPresent && !noClaimFieldsPresent) {
        throw new PendingAgentExecutionStoreError('CORRUPT_ROW', 'stored row has partially populated claim fields');
    }

    const claimRequiredStatuses: ReadonlySet<string> = new Set([
        'CLAIMED', 'EXECUTING', 'SUCCEEDED', 'FAILED', 'DENIED', 'UNKNOWN_TERMINAL', 'ABANDONED_BEFORE_START',
    ]);
    if ((row.status === 'CREATED' || row.status === 'EXPIRED') && !noClaimFieldsPresent) {
        throw new PendingAgentExecutionStoreError('CORRUPT_ROW', `stored row in status "${row.status}" must not carry claim fields`);
    }
    if (claimRequiredStatuses.has(row.status) && !allClaimFieldsPresent) {
        throw new PendingAgentExecutionStoreError('CORRUPT_ROW', `stored row in status "${row.status}" is missing its complete claim tuple`);
    }
    if (row.status === 'STALE' && !allClaimFieldsPresent && !noClaimFieldsPresent) {
        throw new PendingAgentExecutionStoreError('CORRUPT_ROW', 'stored STALE row has a partial claim tuple');
    }

    const attemptRequired = ['EXECUTING', 'SUCCEEDED', 'FAILED', 'DENIED', 'UNKNOWN_TERMINAL'].includes(row.status);
    if (attemptRequired !== (row.attempt_index !== null)) {
        throw new PendingAgentExecutionStoreError('CORRUPT_ROW', `stored row in status "${row.status}" has inconsistent attempt metadata`);
    }
    const terminalRequired = ['SUCCEEDED', 'FAILED', 'DENIED', 'UNKNOWN_TERMINAL', 'EXPIRED', 'STALE', 'ABANDONED_BEFORE_START'].includes(row.status);
    const terminalPresent = row.terminal_reason !== null && row.terminal_at !== null;
    if (terminalRequired !== terminalPresent || ((row.terminal_reason === null) !== (row.terminal_at === null))) {
        throw new PendingAgentExecutionStoreError('CORRUPT_ROW', `stored row in status "${row.status}" has inconsistent terminal metadata`);
    }

    let payload: PendingAgentExecutionImmutablePayload;
    let claimedBy: PersistedClaimedBy | null;
    try {
        payload = JSON.parse(row.payload_json) as PendingAgentExecutionImmutablePayload;
        claimedBy = row.claimed_by_json === null
            ? null
            : validatePersistedClaimedBy(JSON.parse(row.claimed_by_json));
    } catch (error) {
        if (error instanceof PendingAgentExecutionStoreError) {
            throw error;
        }
        throw new PendingAgentExecutionStoreError('CORRUPT_ROW', 'stored row payload/claimedBy JSON failed to parse');
    }

    let normalizedPayload: PendingAgentExecutionImmutablePayload;
    try {
        canonicalizeToJson(payload);
        normalizedPayload = {
            ...payload,
            environment: validateEnvironmentIdentity(payload.environment),
            policySnapshot: validateGuardPolicySnapshot(payload.policySnapshot),
        };
    } catch {
        throw new PendingAgentExecutionStoreError('CORRUPT_ROW', 'stored row payload failed canonical validation');
    }

    let recomputedFingerprint: string;
    try {
        recomputedFingerprint = computeGuardPolicyFingerprint(normalizedPayload.policySnapshot);
    } catch {
        throw new PendingAgentExecutionStoreError('CORRUPT_ROW', 'stored row guard policy fingerprint could not be recomputed');
    }
    if (recomputedFingerprint !== row.guard_policy_fingerprint) {
        throw new PendingAgentExecutionStoreError('CORRUPT_ROW', 'stored row guard_policy_fingerprint does not match recomputed value');
    }

    const state: PendingAgentExecutionMutableState = {
        status: row.status as PendingAgentExecutionStatus,
        recordVersion: row.record_version,
        claimId: row.claim_id,
        claimedAt: row.claimed_at,
        claimedBy,
        attemptIndex: row.attempt_index,
        requestId: row.request_id,
        terminalReason: row.terminal_reason,
        terminalAt: row.terminal_at,
    };

    const record: PendingAgentExecutionRecord = {
        pendingExecutionId: row.pending_execution_id,
        createdAt: row.created_at,
        payload: normalizedPayload,
        guardPolicyFingerprint: row.guard_policy_fingerprint,
        recordDigest: row.record_digest,
        state,
    };

    let recomputedDigest: string;
    try {
        recomputedDigest = computeRecordDigest(record.pendingExecutionId, record.createdAt, record.payload);
    } catch {
        throw new PendingAgentExecutionStoreError('CORRUPT_ROW', 'stored row record digest could not be recomputed');
    }
    if (recomputedDigest !== row.record_digest) {
        throw new PendingAgentExecutionStoreError('CORRUPT_ROW', 'stored row record_digest does not match recomputed value');
    }

    return record;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

/**
 * Durable single-node SQLite implementation of `PendingAgentExecutionStore`.
 *
 * Constructor requires a non-empty caller-supplied local filesystem path; it
 * fails closed (throws) if the path is missing, empty, or not a string. No
 * environment variable, default, global, repository-relative, or user-home
 * path is ever consulted.
 */
export class PendingAgentExecutionSqliteStore implements PendingAgentExecutionStore {
    public readonly deploymentBoundary = 'single_node_multi_process_local_file' as const;

    private readonly db: SQLiteDatabase;

    constructor(dbPath: string) {
        if (typeof dbPath !== 'string' || dbPath.trim().length === 0) {
            throw new PendingAgentExecutionStoreError(
                'IO_FAILURE',
                'PendingAgentExecutionSqliteStore requires a non-empty caller-supplied local database file path',
            );
        }
        if (!path.isAbsolute(dbPath)) {
            throw new PendingAgentExecutionStoreError(
                'IO_FAILURE',
                'PendingAgentExecutionSqliteStore requires an absolute caller-supplied local database file path',
            );
        }

        try {
            mkdirSync(path.dirname(dbPath), { recursive: true });
        } catch (error) {
            throw new PendingAgentExecutionStoreError(
                'IO_FAILURE',
                `unable to prepare directory for database path "${dbPath}": ${String(error)}`,
            );
        }

        const Database = loadSQLiteDatabase();
        let db: SQLiteDatabase;
        try {
            db = new Database(dbPath);
        } catch (error) {
            throw new PendingAgentExecutionStoreError('IO_FAILURE', `unable to open database at "${dbPath}": ${String(error)}`);
        }

        try {
            db.pragma('journal_mode = WAL');
            db.pragma('synchronous = FULL');
            db.pragma('busy_timeout = 5000');

            const currentUserVersion = Number(db.pragma('user_version', { simple: true }));
            const userTableRows = db
                .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
                .all() as Array<{ name?: unknown }>;
            const isNewDatabase = currentUserVersion === 0 && userTableRows.length === 0;

            if (isNewDatabase) {
                db.exec(CREATE_TABLE_SQL);
                db.exec(CREATE_INDEX_SQL);
                db.pragma(`user_version = ${REQUIRED_USER_VERSION}`);
            } else if (currentUserVersion !== REQUIRED_USER_VERSION) {
                throw new PendingAgentExecutionStoreError(
                    'SCHEMA_MISMATCH',
                    `database "${dbPath}" has user_version ${currentUserVersion}, expected exactly ${REQUIRED_USER_VERSION}; no migration is performed`,
                );
            }
            validateDatabaseSchema(db);
        } catch (error) {
            try {
                db.close();
            } catch {
                // best-effort close on failure path
            }
            if (error instanceof PendingAgentExecutionStoreError) {
                throw error;
            }
            throw new PendingAgentExecutionStoreError('IO_FAILURE', `unable to initialize schema at "${dbPath}": ${String(error)}`);
        }

        this.db = db;
    }

    /** Closes the underlying database handle. Not part of the shared
     * `PendingAgentExecutionStore` interface; exposed for test/process
     * lifecycle management (e.g. restart-persistence proof). */
    close(): void {
        this.db.close();
    }

    create(
        pendingExecutionId: string,
        createdAt: string,
        payload: PendingAgentExecutionImmutablePayload,
    ): PendingAgentExecutionRecord {
        // Validate exactly as T1A's in-memory store does, before any I/O.
        if (typeof pendingExecutionId !== 'string' || pendingExecutionId.trim().length === 0) {
            throw new PendingAgentExecutionStoreError('IO_FAILURE', 'pendingExecutionId must be a non-empty string');
        }
        const createdAtMillis = Date.parse(createdAt);
        if (!Number.isFinite(createdAtMillis) || new Date(createdAtMillis).toISOString() !== createdAt) {
            throw new PendingAgentExecutionStoreError('IO_FAILURE', 'createdAt must be a canonical ISO timestamp');
        }
        let validatedPayload: PendingAgentExecutionImmutablePayload;
        let guardPolicyFingerprint: string;
        let recordDigest: string;
        try {
            canonicalizeToJson(payload);
            validatedPayload = {
                ...payload,
                environment: validateEnvironmentIdentity(payload.environment),
                policySnapshot: validateGuardPolicySnapshot(payload.policySnapshot),
            };
            guardPolicyFingerprint = computeGuardPolicyFingerprint(validatedPayload.policySnapshot);
            recordDigest = computeRecordDigest(pendingExecutionId, createdAt, validatedPayload);
        } catch (error) {
            throw new PendingAgentExecutionStoreError('IO_FAILURE', `invalid pending execution payload: ${sqliteErrorMessage(error)}`);
        }

        const record: PendingAgentExecutionRecord = {
            pendingExecutionId,
            createdAt,
            payload: validatedPayload,
            guardPolicyFingerprint,
            recordDigest,
            state: {
                status: 'CREATED',
                recordVersion: 0,
                claimId: null,
                claimedAt: null,
                claimedBy: null,
                attemptIndex: null,
                requestId: null,
                terminalReason: null,
                terminalAt: null,
            },
        };

        const row = encodeRecordToRow(record);

        const runInsertAndReadBack = this.db.transaction(() => {
            try {
                this.db
                    .prepare(`
                        INSERT INTO pending_agent_execution (
                            pending_execution_id, schema_version, created_at, payload_json,
                            guard_policy_fingerprint, record_digest, status, record_version,
                            claim_id, claimed_at, claimed_by_json, attempt_index, request_id,
                            terminal_reason, terminal_at
                        ) VALUES (
                            @pending_execution_id, @schema_version, @created_at, @payload_json,
                            @guard_policy_fingerprint, @record_digest, @status, @record_version,
                            @claim_id, @claimed_at, @claimed_by_json, @attempt_index, @request_id,
                            @terminal_reason, @terminal_at
                        )
                    `)
                    .run(row as unknown as Record<string, unknown>);
            } catch (error) {
                const message = sqliteErrorMessage(error);
                if (/UNIQUE constraint failed/i.test(message)) {
                    throw new PendingAgentExecutionStoreError(
                        'IO_FAILURE',
                        `pendingExecutionId "${pendingExecutionId}" already exists; create acknowledges no new ID on duplicate`,
                    );
                }
                if (isSqliteBusyError(error)) {
                    throw new PendingAgentExecutionStoreError('BUSY_TIMEOUT', `create timed out under contention: ${message}`);
                }
                throw new PendingAgentExecutionStoreError('IO_FAILURE', `create insert failed: ${message}`);
            }

            const readBackRow = this.db
                .prepare('SELECT * FROM pending_agent_execution WHERE pending_execution_id = ?')
                .get(pendingExecutionId);
            if (!isPendingAgentExecutionRow(readBackRow) || readBackRow.record_digest !== recordDigest) {
                throw new PendingAgentExecutionStoreError(
                    'IO_FAILURE',
                    'create read-back digest verification failed within the create transaction',
                );
            }
        });

        try {
            runInsertAndReadBack();
        } catch (error) {
            if (error instanceof PendingAgentExecutionStoreError) {
                throw error;
            }
            const message = sqliteErrorMessage(error);
            if (isSqliteBusyError(error)) {
                throw new PendingAgentExecutionStoreError('BUSY_TIMEOUT', `create timed out under contention: ${message}`);
            }
            throw new PendingAgentExecutionStoreError('IO_FAILURE', `create failed: ${message}`);
        }

        // Acknowledge only after the FULL-synchronous transaction commit
        // completed; re-fetch and decode once more via the shared codec so
        // the returned record matches exactly what `get` would return.
        return this.get(pendingExecutionId) as PendingAgentExecutionRecord;
    }

    get(pendingExecutionId: string): PendingAgentExecutionRecord | null {
        let rawRow: unknown;
        try {
            rawRow = this.db
                .prepare('SELECT * FROM pending_agent_execution WHERE pending_execution_id = ?')
                .get(pendingExecutionId);
        } catch (error) {
            const message = sqliteErrorMessage(error);
            if (isSqliteBusyError(error)) {
                throw new PendingAgentExecutionStoreError('BUSY_TIMEOUT', `get timed out under contention: ${message}`);
            }
            throw new PendingAgentExecutionStoreError('IO_FAILURE', `get failed: ${message}`);
        }

        if (rawRow === undefined) {
            return null;
        }

        // decodeRowToRecord throws CORRUPT_ROW/SCHEMA_MISMATCH for a present
        // but invalid row; it never returns null for a row that exists.
        return decodeRowToRecord(rawRow);
    }

    compareAndSwap(
        pendingExecutionId: string,
        expectedVersion: number,
        expectedStatus: PendingAgentExecutionStatus,
        transition: PendingAgentExecutionTransition,
    ): CompareAndSwapResult {
        const runCas = this.db.transaction((): CompareAndSwapResult => {
            const rawRow = this.db
                .prepare('SELECT * FROM pending_agent_execution WHERE pending_execution_id = ?')
                .get(pendingExecutionId);

            if (rawRow === undefined) {
                return { ok: false, reason: 'NOT_FOUND', record: null };
            }

            const currentRecord = decodeRowToRecord(rawRow);

            const decision = applyPendingAgentExecutionTransition(
                currentRecord,
                expectedVersion,
                expectedStatus,
                transition,
            );

            if (!decision.ok) {
                // An IMMEDIATE transaction serializes competing writers
                // before this SELECT. A stale expected version/status means
                // another connection already won the same CAS boundary.
                if (decision.reason === 'VERSION_MISMATCH' || decision.reason === 'STATUS_MISMATCH') {
                    return { ok: false, reason: 'CAS_CONFLICT', record: decision.record };
                }
                // No mutation: the current, unchanged, freshly re-validated
                // record is returned so callers observe the true current
                // state without a second SELECT.
                return decision;
            }

            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const nextRecord = decision.record!;
            const nextRow = encodeRecordToRow(nextRecord);

            const updateResult = this.db
                .prepare(`
                    UPDATE pending_agent_execution
                    SET status = @status,
                        record_version = @record_version,
                        claim_id = @claim_id,
                        claimed_at = @claimed_at,
                        claimed_by_json = @claimed_by_json,
                        request_id = @request_id,
                        attempt_index = @attempt_index,
                        terminal_reason = @terminal_reason,
                        terminal_at = @terminal_at
                    WHERE pending_execution_id = @pending_execution_id
                      AND record_version = @expected_version
                      AND status = @expected_status
                `)
                .run({
                    ...nextRow,
                    pending_execution_id: pendingExecutionId,
                    expected_version: expectedVersion,
                    expected_status: expectedStatus,
                });

            if (updateResult.changes !== 1) {
                // Zero changed rows means another process's CAS already won
                // between this transaction's SELECT and UPDATE (should not
                // happen inside one transaction on the same connection, but
                // is the correct fail-closed response either way): report a
                // conflict, never a blind retry.
                const refreshedRow = this.db
                    .prepare('SELECT * FROM pending_agent_execution WHERE pending_execution_id = ?')
                    .get(pendingExecutionId);
                const refreshedRecord = refreshedRow === undefined ? null : decodeRowToRecord(refreshedRow);
                return { ok: false, reason: 'CAS_CONFLICT', record: refreshedRecord };
            }

            const verifyRow = this.db
                .prepare('SELECT * FROM pending_agent_execution WHERE pending_execution_id = ?')
                .get(pendingExecutionId);
            const verifiedRecord = decodeRowToRecord(verifyRow);

            return { ok: true, reason: 'OK', record: verifiedRecord };
        });

        try {
            return runCas.immediate();
        } catch (error) {
            if (error instanceof PendingAgentExecutionStoreError) {
                throw error;
            }
            const message = sqliteErrorMessage(error);
            if (isSqliteBusyError(error)) {
                throw new PendingAgentExecutionStoreError('BUSY_TIMEOUT', `compareAndSwap timed out under contention: ${message}`);
            }
            throw new PendingAgentExecutionStoreError('IO_FAILURE', `compareAndSwap failed: ${message}`);
        }
    }
}
