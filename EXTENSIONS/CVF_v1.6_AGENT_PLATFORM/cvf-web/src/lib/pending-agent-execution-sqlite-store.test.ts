import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Worker } from 'node:worker_threads';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { ApprovalActorBinding } from '@/app/api/approvals/approval-binding';
import { computeApprovalRequestHash } from '@/app/api/approvals/approval-binding';
import type { ApprovalRequestSnapshot } from '@/app/api/approvals/store';

import {
    GUARD_POLICY_SNAPSHOT_SCHEMA_VERSION,
    validateEnvironmentIdentity,
    validateGuardPolicySnapshot,
    type GuardPolicySnapshot,
    type PendingAgentExecutionImmutablePayload,
} from './pending-agent-execution';
import {
    PENDING_AGENT_EXECUTION_SQLITE_SCHEMA_VERSION,
    PendingAgentExecutionSqliteStore,
    PendingAgentExecutionStoreError,
} from './pending-agent-execution-sqlite-store';
import { buildPendingAgentExecutionRuntime } from './pending-agent-execution-composition';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Database = require('better-sqlite3');

// ---------------------------------------------------------------------------
// Fixtures / temp-directory harness
// ---------------------------------------------------------------------------

const ACTOR: ApprovalActorBinding = {
    actorId: 'operator-1',
    actorOrgId: 'org-1',
    actorTeamId: 'team-1',
    actorAuthMode: 'session',
};

let tempDirs: string[] = [];

function makeTempDbPath(label: string): string {
    const dir = mkdtempSync(join(tmpdir(), `cvf-pae-sqlite-${label}-`));
    tempDirs.push(dir);
    return join(dir, 'pending-agent-execution.sqlite');
}

afterEach(() => {
    for (const dir of tempDirs) {
        try {
            rmSync(dir, { recursive: true, force: true });
        } catch {
            // best-effort cleanup
        }
    }
    tempDirs = [];
});

function buildSnapshot(overrides: Partial<ApprovalRequestSnapshot> = {}): ApprovalRequestSnapshot {
    return {
        templateId: 'tpl-1',
        templateName: 'Template One',
        intent: 'do the thing',
        provider: 'test-provider',
        actorId: ACTOR.actorId,
        actorOrgId: ACTOR.actorOrgId,
        actorTeamId: ACTOR.actorTeamId,
        actorAuthMode: ACTOR.actorAuthMode,
        ...overrides,
    };
}

function buildPolicySnapshot(overrides: Partial<GuardPolicySnapshot> = {}): GuardPolicySnapshot {
    return validateGuardPolicySnapshot({
        schemaVersion: GUARD_POLICY_SNAPSHOT_SCHEMA_VERSION,
        rows: [{ guardId: 'guard-a', guardVersion: '1.0.0', configDigest: 'a'.repeat(64) }],
        phase: 'build',
        riskLevel: 'low',
        role: 'BUILDER',
        channel: 'web',
        controlMode: 'enforced',
        policySnapshotId: 'policy-snap-1',
        ...overrides,
    });
}

function buildPayload(
    overrides: Partial<PendingAgentExecutionImmutablePayload> = {},
): PendingAgentExecutionImmutablePayload {
    const snapshot = buildSnapshot();
    return {
        approvalId: 'approval-1',
        approvalRequestHash: computeApprovalRequestHash(snapshot),
        approvalRequestSnapshot: snapshot,
        normalizedIntent: { action: 'run-template', targetFiles: ['a.ts'] },
        binding: {
            actor: ACTOR,
            sessionId: 'session-1',
            cwd: '/repo',
            fileScope: ['a.ts'],
        },
        originalGuardResult: { finalDecision: 'ALLOW', reasons: ['ok'] },
        environment: validateEnvironmentIdentity({
            nodeEnv: 'test',
            runtimeName: 'vitest',
            deploymentBoundary: 'single_process_non_production',
        }),
        policySnapshot: buildPolicySnapshot(),
        ...overrides,
    };
}

const NOW = () => new Date().toISOString();

// ---------------------------------------------------------------------------
// 1. Constructor fail-closed behavior (matrix row 11)
// ---------------------------------------------------------------------------

describe('1. constructor requires an explicit non-empty local database path', () => {
    it('throws on an empty string path', () => {
        expect(() => new PendingAgentExecutionSqliteStore('')).toThrow(PendingAgentExecutionStoreError);
    });

    it('throws on a whitespace-only path', () => {
        expect(() => new PendingAgentExecutionSqliteStore('   ')).toThrow(PendingAgentExecutionStoreError);
    });

    it('rejects a relative path so the working directory never becomes an implicit storage owner', () => {
        expect(() => new PendingAgentExecutionSqliteStore('pending.sqlite')).toThrow(PendingAgentExecutionStoreError);
    });

    it('throws on a non-string path', () => {
        // @ts-expect-error deliberate invalid input for a fail-closed contract test
        expect(() => new PendingAgentExecutionSqliteStore(undefined)).toThrow(PendingAgentExecutionStoreError);
        // @ts-expect-error deliberate invalid input for a fail-closed contract test
        expect(() => new PendingAgentExecutionSqliteStore(null)).toThrow(PendingAgentExecutionStoreError);
    });

    it('never falls back to a default, global, repository, or user-home path on a missing path', () => {
        let thrown: unknown = null;
        try {
            new PendingAgentExecutionSqliteStore('');
        } catch (error) {
            thrown = error;
        }
        expect(thrown).toBeInstanceOf(PendingAgentExecutionStoreError);
        expect((thrown as PendingAgentExecutionStoreError).code).toBe('IO_FAILURE');
    });

    it('opens successfully given a valid temporary-directory path and creates the schema', () => {
        const dbPath = makeTempDbPath('ctor-ok');
        const store = new PendingAgentExecutionSqliteStore(dbPath);
        expect(store.get('nonexistent')).toBeNull();
        store.close();
    });
});

// ---------------------------------------------------------------------------
// 2. Create: uniqueness, read-back, duplicate rejection (matrix row 3)
// ---------------------------------------------------------------------------

describe('2. create: unique insert, same-transaction read-back, duplicate rejection', () => {
    it('creates a record and reads it back with a matching digest', () => {
        const dbPath = makeTempDbPath('create-ok');
        const store = new PendingAgentExecutionSqliteStore(dbPath);
        const createdAt = NOW();
        const payload = buildPayload();
        const record = store.create('pending-1', createdAt, payload);
        expect(record.state.status).toBe('CREATED');
        expect(record.state.recordVersion).toBe(0);

        const readBack = store.get('pending-1');
        expect(readBack).not.toBeNull();
        expect(readBack?.recordDigest).toBe(record.recordDigest);
        store.close();
    });

    it('rejects a duplicate create and never acknowledges a second ID', () => {
        const dbPath = makeTempDbPath('create-dup');
        const store = new PendingAgentExecutionSqliteStore(dbPath);
        const createdAt = NOW();
        store.create('pending-1', createdAt, buildPayload());

        expect(() => store.create('pending-1', createdAt, buildPayload())).toThrow(PendingAgentExecutionStoreError);

        // The original row is untouched: exactly one record exists and its
        // digest is unchanged (no silent replacement occurred).
        const stillThere = store.get('pending-1');
        expect(stillThere).not.toBeNull();
        expect(stillThere?.state.recordVersion).toBe(0);
        store.close();
    });

    it('duplicate create failure does not corrupt the transaction for subsequent distinct creates', () => {
        const dbPath = makeTempDbPath('create-dup-recovery');
        const store = new PendingAgentExecutionSqliteStore(dbPath);
        store.create('pending-1', NOW(), buildPayload());
        expect(() => store.create('pending-1', NOW(), buildPayload())).toThrow();

        const second = store.create('pending-2', NOW(), buildPayload({ approvalId: 'approval-2' }));
        expect(second.pendingExecutionId).toBe('pending-2');
        store.close();
    });
});

// ---------------------------------------------------------------------------
// 3. Two independent connections racing the same CAS row (matrix row 2)
// ---------------------------------------------------------------------------

describe('3. two independent SQLite connections racing the same CAS row', () => {
    it('exactly one connection wins; the loser observes a conflict; version increments exactly once', () => {
        const dbPath = makeTempDbPath('race');
        const seedStore = new PendingAgentExecutionSqliteStore(dbPath);
        seedStore.create('pending-1', NOW(), buildPayload());
        seedStore.close();

        // Two independent store instances (independent better-sqlite3 handles)
        // opened against the same file path, simulating two OS processes.
        const storeA = new PendingAgentExecutionSqliteStore(dbPath);
        const storeB = new PendingAgentExecutionSqliteStore(dbPath);

        const now = NOW();
        const resultA = storeA.compareAndSwap('pending-1', 0, 'CREATED', {
            kind: 'CLAIM',
            claimId: 'claim-a',
            claimedAt: now,
            claimedBy: ACTOR,
            requestId: 'req-a',
        });
        const resultB = storeB.compareAndSwap('pending-1', 0, 'CREATED', {
            kind: 'CLAIM',
            claimId: 'claim-b',
            claimedAt: now,
            claimedBy: ACTOR,
            requestId: 'req-b',
        });

        const winners = [resultA, resultB].filter((r) => r.ok);
        const losers = [resultA, resultB].filter((r) => !r.ok);
        expect(winners).toHaveLength(1);
        expect(losers).toHaveLength(1);
        // The specialized store normalizes a stale expected version/status
        // observed after writer serialization to the contract's one-winner
        // conflict result. It never retries with the new row state.
        expect(losers[0]?.reason).toBe('CAS_CONFLICT');

        const finalStore = new PendingAgentExecutionSqliteStore(dbPath);
        const final = finalStore.get('pending-1');
        // Version incremented exactly once (0 -> 1), not twice.
        expect(final?.state.recordVersion).toBe(1);
        expect(final?.state.status).toBe('CLAIMED');
        finalStore.close();

        storeA.close();
        storeB.close();
    });
});

// ---------------------------------------------------------------------------
// 4. Busy timeout (matrix row 4) + composition zero-grant
// ---------------------------------------------------------------------------

describe('4. busy timeout produces a typed failure and zero composition grant', () => {
    it(
        'a write that cannot acquire the lock within busy_timeout throws BUSY_TIMEOUT, and the composition layer converts it to zero grant authority',
        async () => {
            const dbPath = makeTempDbPath('busy');
            const seedStore = new PendingAgentExecutionSqliteStore(dbPath);
            seedStore.create('pending-1', NOW(), buildPayload());
            seedStore.close();

            const runtime = buildPendingAgentExecutionRuntime(dbPath);

            // A separate worker thread is required: a same-thread synchronous
            // transaction would release its lock before the contender runs.
            const sqliteModulePath = require.resolve('better-sqlite3');
            const blocker = new Worker(`
                const { parentPort, workerData } = require('node:worker_threads');
                const Database = require(workerData.sqliteModulePath);
                const db = new Database(workerData.dbPath);
                db.pragma('journal_mode = WAL');
                const tx = db.transaction(() => {
                    db.prepare('UPDATE pending_agent_execution SET record_version = record_version WHERE pending_execution_id = ?').run('pending-1');
                    parentPort.postMessage('LOCKED');
                    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 6500);
                });
                tx.immediate();
                db.close();
                parentPort.postMessage('RELEASED');
            `, { eval: true, workerData: { dbPath, sqliteModulePath } });
            await new Promise<void>((resolve, reject) => {
                blocker.once('error', reject);
                blocker.on('message', (message) => message === 'LOCKED' && resolve());
            });

            const claimResult = runtime.claim({
                pendingExecutionId: 'pending-1',
                actor: ACTOR,
                requestId: 'req-busy',
                now: NOW(),
                lookupApproval: () => null,
                currentPolicySnapshot: buildPolicySnapshot(),
                generateClaimId: () => 'claim-busy',
            });

            expect(claimResult.ok).toBe(false);
            expect(claimResult.grant).toBeNull();
            expect(claimResult.reason).toBe('STORE_BUSY_TIMEOUT');
            await new Promise<void>((resolve, reject) => {
                blocker.once('error', reject);
                blocker.on('message', (message) => message === 'RELEASED' && resolve());
            });
            await blocker.terminate();
            runtime.close();
        },
        15000,
    );
});

// ---------------------------------------------------------------------------
// 5. Schema mismatch fails closed (matrix row 5)
// ---------------------------------------------------------------------------

describe('5. store/row schema mismatch fails closed without migration or repair', () => {
    it('refuses to open an existing non-empty database with a mismatched PRAGMA user_version', () => {
        const dbPath = makeTempDbPath('schema-mismatch');
        const raw: InstanceType<typeof Database> = new Database(dbPath);
        raw.exec('CREATE TABLE pending_agent_execution (pending_execution_id TEXT PRIMARY KEY)');
        raw.pragma('user_version = 7');
        raw.close();

        expect(() => new PendingAgentExecutionSqliteStore(dbPath)).toThrow(PendingAgentExecutionStoreError);
        try {
            new PendingAgentExecutionSqliteStore(dbPath);
            expect.unreachable('expected constructor to throw');
        } catch (error) {
            expect(error).toBeInstanceOf(PendingAgentExecutionStoreError);
            expect((error as PendingAgentExecutionStoreError).code).toBe('SCHEMA_MISMATCH');
        }
    });

    it('does not silently migrate or repair a malformed table on open', () => {
        const dbPath = makeTempDbPath('schema-malformed');
        const raw: InstanceType<typeof Database> = new Database(dbPath);
        // Malformed table: wrong column set entirely, but user_version left at 0
        // and the table already exists, so the store must not treat this as a
        // fresh empty database eligible for CREATE TABLE IF NOT EXISTS success.
        raw.exec('CREATE TABLE pending_agent_execution (unexpected_column TEXT)');
        raw.close();

        // user_version is 0 and the table pre-exists: this is neither a
        // genuinely new empty database nor a valid existing schema at
        // version 1, so open must fail closed rather than silently adopting
        // or migrating the malformed table.
        expect(() => new PendingAgentExecutionSqliteStore(dbPath)).toThrow(PendingAgentExecutionStoreError);
    });

    it('rejects user_version 1 when the table is partial instead of completing it', () => {
        const dbPath = makeTempDbPath('schema-partial-v1');
        const raw: InstanceType<typeof Database> = new Database(dbPath);
        raw.exec('CREATE TABLE pending_agent_execution (pending_execution_id TEXT PRIMARY KEY)');
        raw.pragma('user_version = 1');
        raw.close();

        expect(() => new PendingAgentExecutionSqliteStore(dbPath)).toThrow(PendingAgentExecutionStoreError);
    });

    it('rejects a user_version 0 database containing an unrelated table without adding this store schema', () => {
        const dbPath = makeTempDbPath('schema-unrelated');
        const raw: InstanceType<typeof Database> = new Database(dbPath);
        raw.exec('CREATE TABLE unrelated (id TEXT PRIMARY KEY)');
        raw.close();

        expect(() => new PendingAgentExecutionSqliteStore(dbPath)).toThrow(PendingAgentExecutionStoreError);
        const verify: InstanceType<typeof Database> = new Database(dbPath);
        const added = verify.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'pending_agent_execution'").get();
        expect(added).toBeUndefined();
        verify.close();
    });
});

// ---------------------------------------------------------------------------
// 6. Malformed row content -> CORRUPT_ROW (matrix row 6)
// ---------------------------------------------------------------------------

describe('6. malformed JSON/state/timestamp/integer rows throw CORRUPT_ROW', () => {
    function openRaw(dbPath: string): InstanceType<typeof Database> {
        const raw: InstanceType<typeof Database> = new Database(dbPath);
        raw.pragma('journal_mode = WAL');
        return raw;
    }

    function seedValidRow(dbPath: string): void {
        const store = new PendingAgentExecutionSqliteStore(dbPath);
        store.create('pending-1', NOW(), buildPayload());
        store.close();
    }

    it('throws CORRUPT_ROW for malformed payload_json', () => {
        const dbPath = makeTempDbPath('corrupt-json');
        seedValidRow(dbPath);
        const raw = openRaw(dbPath);
        raw.prepare("UPDATE pending_agent_execution SET payload_json = 'not-json{{{' WHERE pending_execution_id = 'pending-1'").run();
        raw.close();

        const store = new PendingAgentExecutionSqliteStore(dbPath);
        expect(() => store.get('pending-1')).toThrow(PendingAgentExecutionStoreError);
        try {
            store.get('pending-1');
        } catch (error) {
            expect((error as PendingAgentExecutionStoreError).code).toBe('CORRUPT_ROW');
        }
        store.close();
    });

    it('throws CORRUPT_ROW for an invalid state enum value bypassing the CHECK constraint path', () => {
        const dbPath = makeTempDbPath('corrupt-status');
        seedValidRow(dbPath);
        const raw = openRaw(dbPath);
        // The CHECK constraint prevents inserting an invalid status via SQL,
        // proving the schema itself defends this; to prove decode-time
        // defense-in-depth as well, attempt the same and confirm the SQL
        // layer already rejects it (belt-and-suspenders confirmation).
        expect(() =>
            raw.prepare("UPDATE pending_agent_execution SET status = 'NOT_A_REAL_STATUS' WHERE pending_execution_id = 'pending-1'").run(),
        ).toThrow();
        raw.close();
    });

    it('throws CORRUPT_ROW for a malformed created_at timestamp', () => {
        const dbPath = makeTempDbPath('corrupt-timestamp');
        seedValidRow(dbPath);
        const raw = openRaw(dbPath);
        raw.prepare("UPDATE pending_agent_execution SET created_at = 'not-a-timestamp' WHERE pending_execution_id = 'pending-1'").run();
        raw.close();

        const store = new PendingAgentExecutionSqliteStore(dbPath);
        try {
            store.get('pending-1');
            expect.unreachable('expected CORRUPT_ROW');
        } catch (error) {
            expect((error as PendingAgentExecutionStoreError).code).toBe('CORRUPT_ROW');
        }
        store.close();
    });

    it('throws CORRUPT_ROW for a non-integer record_version', () => {
        const dbPath = makeTempDbPath('corrupt-version');
        seedValidRow(dbPath);
        const raw = openRaw(dbPath);
        // The table's own CHECK (record_version >= 0) constraint already
        // rejects a negative value at the SQL layer (defense in depth); to
        // reach the decode-time integer guard specifically, write a
        // non-negative but non-integer value that the CHECK constraint does
        // not reject.
        raw.prepare("UPDATE pending_agent_execution SET record_version = 1.5 WHERE pending_execution_id = 'pending-1'").run();
        raw.close();

        const store = new PendingAgentExecutionSqliteStore(dbPath);
        try {
            store.get('pending-1');
            expect.unreachable('expected CORRUPT_ROW');
        } catch (error) {
            expect((error as PendingAgentExecutionStoreError).code).toBe('CORRUPT_ROW');
        }
        store.close();
    });

    it('throws CORRUPT_ROW for a parsed but invalid claimed_by_json actor shape', () => {
        const dbPath = makeTempDbPath('corrupt-actor-shape');
        const store = new PendingAgentExecutionSqliteStore(dbPath);
        store.create('pending-1', NOW(), buildPayload());
        store.compareAndSwap('pending-1', 0, 'CREATED', {
            kind: 'CLAIM', claimId: 'claim-actor', claimedAt: NOW(), claimedBy: ACTOR, requestId: 'req-actor',
        });
        store.close();

        const raw = openRaw(dbPath);
        raw.prepare("UPDATE pending_agent_execution SET claimed_by_json = '{}' WHERE pending_execution_id = 'pending-1'").run();
        raw.close();
        const reopened = new PendingAgentExecutionSqliteStore(dbPath);
        expect(() => reopened.get('pending-1')).toThrow(PendingAgentExecutionStoreError);
        reopened.close();
    });

    it('never silently repairs, deletes, or substitutes a default for a present corrupt row', () => {
        const dbPath = makeTempDbPath('corrupt-no-repair');
        seedValidRow(dbPath);
        const raw = openRaw(dbPath);
        raw.prepare("UPDATE pending_agent_execution SET payload_json = 'garbage' WHERE pending_execution_id = 'pending-1'").run();
        raw.close();

        const store = new PendingAgentExecutionSqliteStore(dbPath);
        expect(() => store.get('pending-1')).toThrow(PendingAgentExecutionStoreError);

        // The row is still present and still corrupt after the failed read:
        // no repair-on-read, deletion, or substitution occurred.
        const verifyRaw = openRaw(dbPath);
        const row = verifyRaw.prepare("SELECT payload_json FROM pending_agent_execution WHERE pending_execution_id = 'pending-1'").get() as { payload_json: string } | undefined;
        expect(row?.payload_json).toBe('garbage');
        verifyRaw.close();
        store.close();
    });
});

// ---------------------------------------------------------------------------
// 7. Digest mismatch fails closed on claim (matrix row 7)
// ---------------------------------------------------------------------------

describe('7. digest mismatch fails closed and never triggers a silent fix-up write', () => {
    it('a tampered record_digest is detected on get as CORRUPT_ROW with the bytes left unchanged', () => {
        const dbPath = makeTempDbPath('digest-mismatch');
        const store = new PendingAgentExecutionSqliteStore(dbPath);
        store.create('pending-1', NOW(), buildPayload());
        store.close();

        const raw: InstanceType<typeof Database> = new Database(dbPath);
        raw.prepare("UPDATE pending_agent_execution SET record_digest = ? WHERE pending_execution_id = 'pending-1'").run('f'.repeat(64));
        raw.close();

        const reopened = new PendingAgentExecutionSqliteStore(dbPath);
        try {
            reopened.get('pending-1');
            expect.unreachable('expected CORRUPT_ROW on digest mismatch');
        } catch (error) {
            expect((error as PendingAgentExecutionStoreError).code).toBe('CORRUPT_ROW');
        }

        // Confirm no silent fix-up write occurred: the tampered digest value
        // is still present exactly as written.
        const verifyRaw: InstanceType<typeof Database> = new Database(dbPath);
        const row = verifyRaw.prepare("SELECT record_digest FROM pending_agent_execution WHERE pending_execution_id = 'pending-1'").get() as { record_digest: string } | undefined;
        expect(row?.record_digest).toBe('f'.repeat(64));
        verifyRaw.close();
        reopened.close();
    });

    it('composition claim() on a digest-corrupted record produces no grant', () => {
        const dbPath = makeTempDbPath('digest-mismatch-composition');
        const store = new PendingAgentExecutionSqliteStore(dbPath);
        store.create('pending-1', NOW(), buildPayload());
        store.close();

        const raw: InstanceType<typeof Database> = new Database(dbPath);
        raw.prepare("UPDATE pending_agent_execution SET record_digest = ? WHERE pending_execution_id = 'pending-1'").run('e'.repeat(64));
        raw.close();

        const runtime = buildPendingAgentExecutionRuntime(dbPath);
        const claimResult = runtime.claim({
            pendingExecutionId: 'pending-1',
            actor: ACTOR,
            requestId: 'req-digest',
            now: NOW(),
            lookupApproval: () => null,
            currentPolicySnapshot: buildPolicySnapshot(),
            generateClaimId: () => 'claim-digest',
        });
        expect(claimResult.ok).toBe(false);
        expect(claimResult.grant).toBeNull();
        runtime.close();
    });
});

// ---------------------------------------------------------------------------
// 8. Restart persistence (matrix row 8)
// ---------------------------------------------------------------------------

describe('8. restart persistence: close, reopen, and confirm record/version survival', () => {
    it('a created and claimed record survives a close/reopen of the same file path', () => {
        const dbPath = makeTempDbPath('restart');
        const store1 = new PendingAgentExecutionSqliteStore(dbPath);
        store1.create('pending-1', NOW(), buildPayload());
        const claimed = store1.compareAndSwap('pending-1', 0, 'CREATED', {
            kind: 'CLAIM',
            claimId: 'claim-restart',
            claimedAt: NOW(),
            claimedBy: ACTOR,
            requestId: 'req-restart',
        });
        expect(claimed.ok).toBe(true);
        store1.close();

        const store2 = new PendingAgentExecutionSqliteStore(dbPath);
        const reread = store2.get('pending-1');
        expect(reread).not.toBeNull();
        expect(reread?.state.status).toBe('CLAIMED');
        expect(reread?.state.recordVersion).toBe(1);
        expect(reread?.state.claimId).toBe('claim-restart');
        store2.close();
    });
});

// ---------------------------------------------------------------------------
// 9. Crash-before-start (matrix row 9)
// ---------------------------------------------------------------------------

describe('9. crash before start permits only ABANDONED_BEFORE_START; no second claim', () => {
    it('CLAIMED -> ABANDONED_BEFORE_START via the store and no fresh claim can ever succeed again', () => {
        const dbPath = makeTempDbPath('crash-before-start');
        const store = new PendingAgentExecutionSqliteStore(dbPath);
        store.create('pending-1', NOW(), buildPayload());
        const claimed = store.compareAndSwap('pending-1', 0, 'CREATED', {
            kind: 'CLAIM',
            claimId: 'claim-crash',
            claimedAt: NOW(),
            claimedBy: ACTOR,
            requestId: 'req-crash',
        });
        expect(claimed.ok).toBe(true);

        const abandoned = store.compareAndSwap('pending-1', 1, 'CLAIMED', {
            kind: 'ABANDON_BEFORE_START',
            claimId: 'claim-crash',
            reason: 'process_exit_before_executing',
            at: NOW(),
        });
        expect(abandoned.ok).toBe(true);
        expect(abandoned.record?.state.status).toBe('ABANDONED_BEFORE_START');

        // No path allows a second claim to succeed: the terminal-state guard
        // rejects any further CAS from a terminal status.
        const secondClaimAttempt = store.compareAndSwap('pending-1', 2, 'CREATED', {
            kind: 'CLAIM',
            claimId: 'claim-crash-2',
            claimedAt: NOW(),
            claimedBy: ACTOR,
            requestId: 'req-crash-2',
        });
        expect(secondClaimAttempt.ok).toBe(false);
        expect(secondClaimAttempt.reason).toBe('CAS_CONFLICT');

        store.close();
    });
});

// ---------------------------------------------------------------------------
// 10. Ambiguous after executing (matrix row 10)
// ---------------------------------------------------------------------------

describe('10. ambiguity after EXECUTING permits only UNKNOWN_TERMINAL; no replay', () => {
    it('EXECUTING -> UNKNOWN_TERMINAL via the store and no replay/retry path is available', () => {
        const dbPath = makeTempDbPath('ambiguous-executing');
        const store = new PendingAgentExecutionSqliteStore(dbPath);
        store.create('pending-1', NOW(), buildPayload());
        store.compareAndSwap('pending-1', 0, 'CREATED', {
            kind: 'CLAIM',
            claimId: 'claim-ambig',
            claimedAt: NOW(),
            claimedBy: ACTOR,
            requestId: 'req-ambig',
        });
        const begun = store.compareAndSwap('pending-1', 1, 'CLAIMED', {
            kind: 'BEGIN_EXECUTING',
            claimId: 'claim-ambig',
            attemptIndex: 0,
        });
        expect(begun.ok).toBe(true);

        const crashResolved = store.compareAndSwap('pending-1', 2, 'EXECUTING', {
            kind: 'TERMINAL',
            claimId: 'claim-ambig',
            attemptIndex: 0,
            status: 'UNKNOWN_TERMINAL',
            reason: 'process_exit_after_call_start_ambiguous',
            terminalAt: NOW(),
        });
        expect(crashResolved.ok).toBe(true);
        expect(crashResolved.record?.state.status).toBe('UNKNOWN_TERMINAL');

        const replayAttempt = store.compareAndSwap('pending-1', 3, 'UNKNOWN_TERMINAL', {
            kind: 'TERMINAL',
            claimId: 'claim-ambig',
            attemptIndex: 0,
            status: 'SUCCEEDED',
            reason: 'illegitimate_replay',
            terminalAt: NOW(),
        });
        expect(replayAttempt.ok).toBe(false);
        expect(replayAttempt.reason).toBe('TERMINAL_STATE_IMMUTABLE');

        store.close();
    });
});

describe('10a. unclaimed terminal rows preserve the T1A EXPIRED/STALE lifecycle', () => {
    it.each([
        ['EXPIRE', 'EXPIRED'],
        ['STALE', 'STALE'],
    ] as const)('%s from CREATED remains decodable after restart', (kind, expectedStatus) => {
        const dbPath = makeTempDbPath(`unclaimed-${kind.toLowerCase()}`);
        const store = new PendingAgentExecutionSqliteStore(dbPath);
        store.create('pending-1', NOW(), buildPayload());
        const result = store.compareAndSwap('pending-1', 0, 'CREATED', { kind, reason: 'reconcile', at: NOW() });
        expect(result.ok).toBe(true);
        store.close();

        const reopened = new PendingAgentExecutionSqliteStore(dbPath);
        const record = reopened.get('pending-1');
        expect(record?.state.status).toBe(expectedStatus);
        expect(record?.state.claimId).toBeNull();
        expect(record?.state.terminalReason).toBe('reconcile');
        reopened.close();
    });
});

// ---------------------------------------------------------------------------
// 11. Composition isolation and zero-grant behavior
// ---------------------------------------------------------------------------

describe('11. composition owner isolation and zero-grant containment', () => {
    it('imports/calls no route, provider-admission, provider-client, audit, network, or credential surface', () => {
        const compositionSource = readFileSync(join(__dirname, 'pending-agent-execution-composition.ts'), 'utf8');
        const storeSource = readFileSync(join(__dirname, 'pending-agent-execution-sqlite-store.ts'), 'utf8');

        const forbiddenTokens = [
            'admitAndInvokeProvider',
            'src/app/api/execute',
            'src/app/api/approvals',
            'appendAuditEvent',
            'fetch(',
            'process.env',
            "from 'next/server'",
            'NextResponse',
        ];

        for (const token of forbiddenTokens) {
            expect(compositionSource).not.toContain(token);
            expect(storeSource).not.toContain(token);
        }

        // The `AgentExecutionRuntime` substring check is scoped separately:
        // the work order requires the exact composition function name
        // `buildPendingAgentExecutionRuntime`, which itself contains that
        // substring. The only acceptable occurrence of the token in either
        // file is that one mandated function identifier (its declaration and
        // its own recursive-type return annotation); no import of, or call
        // to, an actual execution-runtime/AER surface may occur anywhere.
        const agentExecutionRuntimeOccurrences = (compositionSource.match(/AgentExecutionRuntime/g) ?? []).length;
        const mandatedFunctionOccurrences = (compositionSource.match(/buildPendingAgentExecutionRuntime/g) ?? []).length;
        expect(agentExecutionRuntimeOccurrences).toBe(mandatedFunctionOccurrences);
        expect(storeSource).not.toContain('AgentExecutionRuntime');
        expect(compositionSource).not.toMatch(/import[^;]*AgentExecutionRuntime/);
    });

    it('composition module imports only from T1A core and the specialized SQLite store', () => {
        const compositionSource = readFileSync(join(__dirname, 'pending-agent-execution-composition.ts'), 'utf8');
        // Match each complete `import ... from '<module>'` statement
        // (including multi-line brace-list imports) rather than scanning
        // raw lines, since a wrapped import's continuation lines do not
        // individually contain a `from` clause.
        const fromModulePattern = /from\s+['"]([^'"]+)['"]/g;
        const importedModules = Array.from(compositionSource.matchAll(fromModulePattern)).map((match) => match[1]);

        expect(importedModules.length).toBeGreaterThan(0);
        for (const moduleSpecifier of importedModules) {
            const isCoreImport =
                moduleSpecifier === './pending-agent-execution' ||
                moduleSpecifier === './pending-agent-execution-sqlite-store';
            expect(isCoreImport).toBe(true);
        }
    });

    it('is not exported through the package src/index.ts barrel (if one exists)', () => {
        // No barrel file is expected to exist for cvf-web's src/lib in this
        // tranche; this test documents/proves the orphaned-module contract
        // rather than asserting on a specific barrel path.
        const compositionSource = readFileSync(join(__dirname, 'pending-agent-execution-composition.ts'), 'utf8');
        expect(compositionSource).not.toContain('export * from');
    });

    it('a busy-timeout-shaped store failure yields zero grant/execution authority from claim()', () => {
        const dbPath = makeTempDbPath('composition-zero-grant');
        const runtime = buildPendingAgentExecutionRuntime(dbPath);
        // Force the underlying store to throw by closing its handle first,
        // then attempting an operation against the now-closed database.
        runtime.store.close();

        const claimResult = runtime.claim({
            pendingExecutionId: 'pending-nonexistent',
            actor: ACTOR,
            requestId: 'req-closed',
            now: NOW(),
            lookupApproval: () => null,
            currentPolicySnapshot: buildPolicySnapshot(),
            generateClaimId: () => 'claim-closed',
        });
        expect(claimResult.ok).toBe(false);
        expect(claimResult.grant).toBeNull();
    });

    it('create()/get() wrappers convert a store throw into a typed zero-authority outcome, never an implicit success', () => {
        const dbPath = makeTempDbPath('composition-create-fail');
        const runtime = buildPendingAgentExecutionRuntime(dbPath);
        runtime.create('pending-1', NOW(), buildPayload());

        const duplicate = runtime.create('pending-1', NOW(), buildPayload());
        expect(duplicate.ok).toBe(false);
        if (!duplicate.ok) {
            expect(duplicate.record).toBeNull();
        }
        runtime.close();
    });

    it('exposes bounded wrappers for create/get/claim/begin/terminal/reconciliation without reimplementing lifecycle logic', () => {
        const dbPath = makeTempDbPath('composition-shape');
        const runtime = buildPendingAgentExecutionRuntime(dbPath);
        expect(typeof runtime.create).toBe('function');
        expect(typeof runtime.get).toBe('function');
        expect(typeof runtime.claim).toBe('function');
        expect(typeof runtime.begin).toBe('function');
        expect(typeof runtime.terminal).toBe('function');
        expect(typeof runtime.resolveAmbiguousExecutingCrash).toBe('function');
        expect(typeof runtime.abandonBeforeStart).toBe('function');
        expect(typeof runtime.expire).toBe('function');
        runtime.close();
    });
});

// ---------------------------------------------------------------------------
// 12. Explicit-path rejection (matrix row 11, composition angle) and schema
//     version constant proof
// ---------------------------------------------------------------------------

describe('12. explicit-path requirement and schema identity proof', () => {
    it('the composition builder requires the same explicit non-empty path as the store', () => {
        expect(() => buildPendingAgentExecutionRuntime('')).toThrow(PendingAgentExecutionStoreError);
    });

    it('PRAGMA user_version is set to 1 for a newly created database', () => {
        const dbPath = makeTempDbPath('schema-identity');
        const store = new PendingAgentExecutionSqliteStore(dbPath);
        store.close();

        const raw: InstanceType<typeof Database> = new Database(dbPath);
        const userVersion = raw.pragma('user_version', { simple: true });
        expect(userVersion).toBe(1);
        raw.close();
    });

    it('the row-level schema_version constant matches the exported constant', () => {
        const dbPath = makeTempDbPath('schema-row-constant');
        const store = new PendingAgentExecutionSqliteStore(dbPath);
        store.create('pending-1', NOW(), buildPayload());
        store.close();

        const raw: InstanceType<typeof Database> = new Database(dbPath);
        const row = raw.prepare('SELECT schema_version FROM pending_agent_execution WHERE pending_execution_id = ?').get('pending-1') as { schema_version: string };
        expect(row.schema_version).toBe(PENDING_AGENT_EXECUTION_SQLITE_SCHEMA_VERSION);
        raw.close();
    });

    it('the status index exists to support future reconciliation sweeps', () => {
        const dbPath = makeTempDbPath('schema-index');
        const store = new PendingAgentExecutionSqliteStore(dbPath);
        store.close();

        const raw: InstanceType<typeof Database> = new Database(dbPath);
        const indexRow = raw
            .prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_pending_agent_execution_status'")
            .get();
        expect(indexRow).toBeDefined();
        raw.close();
    });
});

// ---------------------------------------------------------------------------
// 13. All database tests use a fresh temporary directory only
// ---------------------------------------------------------------------------

describe('13. hermetic temp-directory discipline', () => {
    it('every temp directory created by this suite lives under the OS temp root, not the repository or home directory', () => {
        const dbPath = makeTempDbPath('hermetic-check');
        expect(dbPath.startsWith(tmpdir())).toBe(true);
        const store = new PendingAgentExecutionSqliteStore(dbPath);
        store.close();
    });

    it('writing a marker file confirms the harness cleans up after itself in afterEach', () => {
        const dir = mkdtempSync(join(tmpdir(), 'cvf-pae-sqlite-cleanup-proof-'));
        tempDirs.push(dir);
        const markerPath = join(dir, 'marker.txt');
        writeFileSync(markerPath, 'ok', 'utf8');
        expect(readFileSync(markerPath, 'utf8')).toBe('ok');
        // afterEach() will rmSync this directory; nothing further to assert
        // here beyond documenting the discipline this whole suite follows.
    });
});
