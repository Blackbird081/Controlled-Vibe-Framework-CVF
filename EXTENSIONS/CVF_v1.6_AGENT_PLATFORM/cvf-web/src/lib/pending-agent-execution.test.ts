import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
    CanonicalizationError,
    GUARD_POLICY_SNAPSHOT_SCHEMA_VERSION,
    InMemoryPendingAgentExecutionStore,
    ResumeAuthorityGrant,
    abandonBeforeStart,
    applyPendingAgentExecutionTransition,
    applyTerminalTransition,
    beginPendingExecution,
    canonicalDigest,
    canonicalizeToJson,
    claimPendingExecution,
    computeGuardPolicyFingerprint,
    computeRecordDigest,
    isAuthenticUnconsumedGrant,
    resolveAmbiguousExecutingCrash,
    validateEnvironmentIdentity,
    validateGuardPolicySnapshot,
} from './pending-agent-execution';
import type {
    ApprovalRecordLookup,
    BeginPendingExecutionResult,
    ClaimPendingExecutionInput,
    GuardPolicySnapshot,
    PendingAgentExecutionImmutablePayload,
    PendingAgentExecutionRecord,
} from './pending-agent-execution';

/** Narrow a `BeginPendingExecutionResult` to its failure variant for assertions. */
function expectBeginFailure(
    result: BeginPendingExecutionResult,
): Extract<BeginPendingExecutionResult, { ok: false }> {
    if (result.ok) {
        throw new Error('expected beginPendingExecution to fail, but it succeeded');
    }
    return result;
}
import type { ApprovalActorBinding } from '@/app/api/approvals/approval-binding';
import { computeApprovalRequestHash } from '@/app/api/approvals/approval-binding';
import type { ApprovalRequestRecord, ApprovalRequestSnapshot } from '@/app/api/approvals/store';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ACTOR: ApprovalActorBinding = {
    actorId: 'operator-1',
    actorOrgId: 'org-1',
    actorTeamId: 'team-1',
    actorAuthMode: 'session',
};

const OTHER_ACTOR: ApprovalActorBinding = {
    actorId: 'operator-2',
    actorOrgId: 'org-1',
    actorTeamId: 'team-1',
    actorAuthMode: 'session',
};

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

function buildApprovalRecord(overrides: Partial<ApprovalRequestRecord> = {}): ApprovalRequestRecord {
    const snapshot = buildSnapshot();
    return {
        id: 'approval-1',
        templateId: 'tpl-1',
        templateName: 'Template One',
        intent: 'do the thing',
        reason: 'because',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        status: 'approved',
        submittedAt: new Date().toISOString(),
        requestHash: computeApprovalRequestHash(snapshot),
        requestSnapshot: snapshot,
        submittedByActorId: ACTOR.actorId,
        submittedByOrgId: ACTOR.actorOrgId,
        submittedByTeamId: ACTOR.actorTeamId,
        submittedByAuthMode: ACTOR.actorAuthMode,
        ...overrides,
    };
}

function buildPolicySnapshot(overrides: Partial<GuardPolicySnapshot> = {}): GuardPolicySnapshot {
    return validateGuardPolicySnapshot({
        schemaVersion: GUARD_POLICY_SNAPSHOT_SCHEMA_VERSION,
        rows: [
            { guardId: 'guard-a', guardVersion: '1.0.0', configDigest: 'a'.repeat(64) },
            { guardId: 'guard-b', guardVersion: '2.0.0', configDigest: 'b'.repeat(64) },
        ],
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
        normalizedIntent: { action: 'run-template', targetFiles: ['a.ts', 'b.ts'] },
        binding: {
            actor: ACTOR,
            sessionId: 'session-1',
            cwd: '/repo',
            fileScope: ['a.ts', 'b.ts'],
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

function makeLookup(record: ApprovalRequestRecord | null): ApprovalRecordLookup {
    return () => record;
}

function buildClaimInput(overrides: Partial<ClaimPendingExecutionInput> = {}): ClaimPendingExecutionInput {
    let counter = 0;
    return {
        pendingExecutionId: 'pending-1',
        actor: ACTOR,
        requestId: 'req-1',
        now: new Date().toISOString(),
        lookupApproval: makeLookup(buildApprovalRecord()),
        currentPolicySnapshot: buildPolicySnapshot(),
        generateClaimId: () => `claim-${counter++}`,
        ...overrides,
    };
}

function createStoreWithRecord(payload = buildPayload(), pendingExecutionId = 'pending-1') {
    const store = new InMemoryPendingAgentExecutionStore();
    const createdAt = new Date().toISOString();
    const record = store.create(pendingExecutionId, createdAt, payload);
    return { store, record };
}

// ---------------------------------------------------------------------------
// 1. Digest determinism and sensitivity
// ---------------------------------------------------------------------------

describe('1. canonical digest determinism and field sensitivity', () => {
    it('produces byte-identical digest under key-order variation', () => {
        const a = { z: 1, a: { y: 2, x: 3 }, m: [1, 2, 3] };
        const b = { a: { x: 3, y: 2 }, m: [1, 2, 3], z: 1 };
        expect(canonicalDigest(a)).toBe(canonicalDigest(b));
        expect(canonicalizeToJson(a)).toBe(canonicalizeToJson(b));
    });

    it('preserves array order as authority-bearing (reordered arrays differ)', () => {
        const a = { m: [1, 2, 3] };
        const b = { m: [3, 2, 1] };
        expect(canonicalDigest(a)).not.toBe(canonicalDigest(b));
    });

    it('is sensitive to every immutable field: pendingExecutionId', () => {
        const payload = buildPayload();
        const createdAt = new Date().toISOString();
        const d1 = computeRecordDigest('pending-1', createdAt, payload);
        const d2 = computeRecordDigest('pending-2', createdAt, payload);
        expect(d1).not.toBe(d2);
    });

    it('is sensitive to createdAt (timestamp)', () => {
        const payload = buildPayload();
        const d1 = computeRecordDigest('pending-1', '2026-01-01T00:00:00.000Z', payload);
        const d2 = computeRecordDigest('pending-1', '2026-01-01T00:00:00.001Z', payload);
        expect(d1).not.toBe(d2);
    });

    it('is sensitive to the complete original guard result', () => {
        const createdAt = new Date().toISOString();
        const p1 = buildPayload({ originalGuardResult: { finalDecision: 'ALLOW', reasons: ['ok'] } });
        const p2 = buildPayload({ originalGuardResult: { finalDecision: 'ALLOW', reasons: ['different'] } });
        expect(computeRecordDigest('pending-1', createdAt, p1)).not.toBe(computeRecordDigest('pending-1', createdAt, p2));
    });

    it('is sensitive to the full policy snapshot', () => {
        const createdAt = new Date().toISOString();
        const p1 = buildPayload({ policySnapshot: buildPolicySnapshot() });
        const p2 = buildPayload({ policySnapshot: buildPolicySnapshot({ riskLevel: 'high' }) });
        expect(computeRecordDigest('pending-1', createdAt, p1)).not.toBe(computeRecordDigest('pending-1', createdAt, p2));
    });

    it('is sensitive to actor/session/runtime binding', () => {
        const createdAt = new Date().toISOString();
        const p1 = buildPayload();
        const p2 = buildPayload({ binding: { ...p1.binding, sessionId: 'session-2' } });
        expect(computeRecordDigest('pending-1', createdAt, p1)).not.toBe(computeRecordDigest('pending-1', createdAt, p2));
    });

    it('is sensitive to approval id/hash/snapshot', () => {
        const createdAt = new Date().toISOString();
        const p1 = buildPayload();
        const p2 = buildPayload({ approvalId: 'approval-2' });
        expect(computeRecordDigest('pending-1', createdAt, p1)).not.toBe(computeRecordDigest('pending-1', createdAt, p2));
    });
});

// ---------------------------------------------------------------------------
// 2. Rejection of unsupported JS values
// ---------------------------------------------------------------------------

describe('2. canonicalizer hard-rejects unsupported values', () => {
    it('rejects undefined', () => {
        expect(() => canonicalizeToJson(undefined)).toThrow(CanonicalizationError);
    });

    it('rejects undefined-valued object property', () => {
        expect(() => canonicalizeToJson({ a: undefined })).toThrow(CanonicalizationError);
    });

    it('rejects sparse array holes', () => {
        const sparse = [1, , 3]; // eslint-disable-line no-sparse-arrays
        expect(() => canonicalizeToJson(sparse)).toThrow(CanonicalizationError);
    });

    it('rejects NaN', () => {
        expect(() => canonicalizeToJson({ a: NaN })).toThrow(CanonicalizationError);
    });

    it('rejects Infinity and -Infinity', () => {
        expect(() => canonicalizeToJson({ a: Infinity })).toThrow(CanonicalizationError);
        expect(() => canonicalizeToJson({ a: -Infinity })).toThrow(CanonicalizationError);
    });

    it('rejects bigint', () => {
        expect(() => canonicalizeToJson({ a: BigInt(1) })).toThrow(CanonicalizationError);
    });

    it('rejects symbol', () => {
        expect(() => canonicalizeToJson({ a: Symbol('x') })).toThrow(CanonicalizationError);
    });

    it('rejects functions', () => {
        expect(() => canonicalizeToJson({ a: () => 1 })).toThrow(CanonicalizationError);
    });

    it('rejects Date instances', () => {
        expect(() => canonicalizeToJson({ a: new Date() })).toThrow(CanonicalizationError);
    });

    it('rejects class instances (non-plain prototype)', () => {
        class Foo {
            x = 1;
        }
        expect(() => canonicalizeToJson({ a: new Foo() })).toThrow(CanonicalizationError);
    });

    it('rejects cyclic references', () => {
        const obj: Record<string, unknown> = { a: 1 };
        obj.self = obj;
        expect(() => canonicalizeToJson(obj)).toThrow(CanonicalizationError);
    });

    it('rejects lone surrogates, symbol keys, accessors, and non-enumerable fields', () => {
        expect(() => canonicalizeToJson({ value: '\ud800' })).toThrow(CanonicalizationError);
        const symbolKeyed = { value: 'ok', [Symbol('hidden')]: 'hidden' };
        expect(() => canonicalizeToJson(symbolKeyed)).toThrow(CanonicalizationError);
        const accessor: Record<string, unknown> = {};
        Object.defineProperty(accessor, 'value', { enumerable: true, get: () => 'x' });
        expect(() => canonicalizeToJson(accessor)).toThrow(CanonicalizationError);
        const hidden = { value: 'ok' };
        Object.defineProperty(hidden, 'secret', { enumerable: false, value: 'x' });
        expect(() => canonicalizeToJson(hidden)).toThrow(CanonicalizationError);
    });

    it('rejects unknown environment identity keys', () => {
        expect(() =>
            validateEnvironmentIdentity({
                nodeEnv: 'test',
                runtimeName: 'vitest',
                deploymentBoundary: 'single_process_non_production',
                extraKey: 'x',
            }),
        ).toThrow(CanonicalizationError);
    });

    it('rejects secret-like environment key', () => {
        expect(() =>
            validateEnvironmentIdentity({
                nodeEnv: 'test',
                runtimeName: 'vitest',
                deploymentBoundary: 'single_process_non_production',
                apiKey: 'shhh',
            } as unknown as Record<string, unknown>),
        ).toThrow(CanonicalizationError);
    });

    it('rejects secret-like environment value', () => {
        expect(() =>
            validateEnvironmentIdentity({
                nodeEnv: 'test-secret-token-value',
                runtimeName: 'vitest',
                deploymentBoundary: 'single_process_non_production',
            }),
        ).toThrow(CanonicalizationError);
    });

    it('rejects deploymentBoundary values other than the fixed literal', () => {
        expect(() =>
            validateEnvironmentIdentity({
                nodeEnv: 'test',
                runtimeName: 'vitest',
                deploymentBoundary: 'production',
            }),
        ).toThrow(CanonicalizationError);
    });
});

// ---------------------------------------------------------------------------
// 3. Policy fingerprint stability and drift rejection
// ---------------------------------------------------------------------------

describe('3. guard policy snapshot/fingerprint', () => {
    it('is stable across repeated computation of the same snapshot', () => {
        const snapshot = buildPolicySnapshot();
        expect(computeGuardPolicyFingerprint(snapshot)).toBe(computeGuardPolicyFingerprint(snapshot));
    });

    it('changes when any field drifts', () => {
        const s1 = buildPolicySnapshot();
        const s2 = buildPolicySnapshot({ controlMode: 'advisory' });
        expect(computeGuardPolicyFingerprint(s1)).not.toBe(computeGuardPolicyFingerprint(s2));
    });

    it('rejects duplicate guard IDs', () => {
        expect(() =>
            validateGuardPolicySnapshot({
                schemaVersion: GUARD_POLICY_SNAPSHOT_SCHEMA_VERSION,
                rows: [
                    { guardId: 'guard-a', guardVersion: '1.0.0', configDigest: 'a'.repeat(64) },
                    { guardId: 'guard-a', guardVersion: '1.0.1', configDigest: 'c'.repeat(64) },
                ],
                phase: 'build',
                riskLevel: 'low',
                role: 'BUILDER',
                channel: 'web',
                controlMode: 'enforced',
                policySnapshotId: 'p1',
            }),
        ).toThrow(CanonicalizationError);
    });

    it('rejects a non-lowercase or non-64-hex configDigest', () => {
        expect(() =>
            validateGuardPolicySnapshot({
                schemaVersion: GUARD_POLICY_SNAPSHOT_SCHEMA_VERSION,
                rows: [{ guardId: 'guard-a', guardVersion: '1.0.0', configDigest: 'NOTHEX' }],
                phase: 'build',
                riskLevel: 'low',
                role: 'BUILDER',
                channel: 'web',
                controlMode: 'enforced',
                policySnapshotId: 'p1',
            }),
        ).toThrow(CanonicalizationError);

        expect(() =>
            validateGuardPolicySnapshot({
                schemaVersion: GUARD_POLICY_SNAPSHOT_SCHEMA_VERSION,
                rows: [{ guardId: 'guard-a', guardVersion: '1.0.0', configDigest: 'A'.repeat(64) }],
                phase: 'build',
                riskLevel: 'low',
                role: 'BUILDER',
                channel: 'web',
                controlMode: 'enforced',
                policySnapshotId: 'p1',
            }),
        ).toThrow(CanonicalizationError);
    });

    it('rejects the wrong schemaVersion', () => {
        expect(() =>
            validateGuardPolicySnapshot({
                schemaVersion: 'wrong.version',
                rows: [{ guardId: 'guard-a', guardVersion: '1.0.0', configDigest: 'a'.repeat(64) }],
                phase: 'build',
                riskLevel: 'low',
                role: 'BUILDER',
                channel: 'web',
                controlMode: 'enforced',
                policySnapshotId: 'p1',
            }),
        ).toThrow(CanonicalizationError);
    });

    it('preserves deterministic caller-supplied row order', () => {
        const snapshot = validateGuardPolicySnapshot({
            schemaVersion: GUARD_POLICY_SNAPSHOT_SCHEMA_VERSION,
            rows: [
                { guardId: 'guard-z', guardVersion: '1.0.0', configDigest: 'a'.repeat(64) },
                { guardId: 'guard-a', guardVersion: '1.0.0', configDigest: 'b'.repeat(64) },
            ],
            phase: 'build',
            riskLevel: 'low',
            role: 'BUILDER',
            channel: 'web',
            controlMode: 'enforced',
            policySnapshotId: 'p1',
        });
        expect(snapshot.rows.map((r) => r.guardId)).toEqual(['guard-z', 'guard-a']);
    });
});

// ---------------------------------------------------------------------------
// 4. Create read-back integrity and clone isolation
// ---------------------------------------------------------------------------

describe('4. create read-back integrity and clone isolation', () => {
    it('read-back record digest matches the digest computed at create time', () => {
        const payload = buildPayload();
        const { store, record } = createStoreWithRecord(payload);
        const readBack = store.get(record.pendingExecutionId);
        expect(readBack).not.toBeNull();
        expect(readBack?.recordDigest).toBe(record.recordDigest);
        expect(readBack?.recordDigest).toBe(
            computeRecordDigest(record.pendingExecutionId, record.createdAt, payload),
        );
    });

    it('rejects invalid authority objects before cloning can flatten them', () => {
        const datePayload = buildPayload({ originalGuardResult: { observedAt: new Date() } });
        expect(() => createStoreWithRecord(datePayload)).toThrow(CanonicalizationError);
        class GuardResult { decision = 'ALLOW'; }
        const classPayload = buildPayload({ originalGuardResult: new GuardResult() });
        expect(() => createStoreWithRecord(classPayload)).toThrow(CanonicalizationError);
    });

    it('rejects a create-time approval snapshot/hash mismatch', () => {
        expect(() => createStoreWithRecord(buildPayload({ approvalRequestHash: 'a'.repeat(64) })))
            .toThrow(/does not match approvalRequestSnapshot/);
    });

    it('mutating the input payload after creation does not affect the stored record', () => {
        const payload = buildPayload();
        const { store, record } = createStoreWithRecord(payload);
        const originalDigest = record.recordDigest;

        (payload.normalizedIntent as { action: string }).action = 'tampered';
        payload.binding.sessionId = 'tampered-session';

        const stillStored = store.get(record.pendingExecutionId);
        expect(stillStored?.recordDigest).toBe(originalDigest);
        expect(stillStored?.payload.normalizedIntent.action).toBe('run-template');
        expect(stillStored?.payload.binding.sessionId).toBe('session-1');
    });

    it('mutating a record returned from get() does not affect the store', () => {
        const { store, record } = createStoreWithRecord();
        const fetched = store.get(record.pendingExecutionId);
        expect(fetched).not.toBeNull();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        (fetched!.state as { status: string }).status = 'TAMPERED';
        const fetchedAgain = store.get(record.pendingExecutionId);
        expect(fetchedAgain?.state.status).toBe('CREATED');
    });
});

// ---------------------------------------------------------------------------
// 5. Exactly one claim winner; stale CAS does not mutate
// ---------------------------------------------------------------------------

describe('5. exactly one claim winner under concurrent/reentrant claims', () => {
    it('yields exactly one winner among back-to-back claim attempts', () => {
        const { store } = createStoreWithRecord();
        const results = [buildClaimInput(), buildClaimInput()].map((input) => claimPendingExecution(store, input));
        const winners = results.filter((r) => r.ok);
        expect(winners).toHaveLength(1);
        expect(results.filter((r) => !r.ok)).toHaveLength(1);
        // The second call observes the record as already CLAIMED at its own
        // precondition check, since both calls run synchronously within one
        // process and the first claim's CAS has already landed by the time
        // the second call reaches the store.
        expect(results.find((r) => !r.ok)?.reason).toBe('ALREADY_CLAIMED_OR_TERMINAL');
    });

    it('yields exactly one winner when a second caller races directly at the CAS boundary', () => {
        // Simulate true CAS-level contention (both callers pass every
        // approval precondition and only differ at the atomic write) by
        // driving `store.compareAndSwap` directly with the same
        // expectedVersion/expectedStatus pairing twice.
        const { store, record } = createStoreWithRecord();
        const now = new Date().toISOString();
        const first = store.compareAndSwap(record.pendingExecutionId, 0, 'CREATED', {
            kind: 'CLAIM',
            claimId: 'claim-race-1',
            claimedAt: now,
            claimedBy: ACTOR,
            requestId: 'req-race-1',
        });
        const second = store.compareAndSwap(record.pendingExecutionId, 0, 'CREATED', {
            kind: 'CLAIM',
            claimId: 'claim-race-2',
            claimedAt: now,
            claimedBy: OTHER_ACTOR,
            requestId: 'req-race-2',
        });
        expect(first.ok).toBe(true);
        expect(second.ok).toBe(false);
        // The first CAS already advanced both recordVersion and status, so
        // the second caller's stale expectedVersion is rejected before the
        // status is even compared - still exactly one winner either way.
        expect(second.reason).toBe('VERSION_MISMATCH');
        expect(store.get(record.pendingExecutionId)?.state.claimId).toBe('claim-race-1');
    });

    it('reentrant claim on an already-CLAIMED record is rejected without mutation', () => {
        const { store } = createStoreWithRecord();
        const first = claimPendingExecution(store, buildClaimInput());
        expect(first.ok).toBe(true);
        const versionAfterFirst = first.record?.state.recordVersion;

        const second = claimPendingExecution(store, buildClaimInput());
        expect(second.ok).toBe(false);
        expect(second.reason).toBe('ALREADY_CLAIMED_OR_TERMINAL');

        const stored = store.get('pending-1');
        expect(stored?.state.recordVersion).toBe(versionAfterFirst);
    });

    it('stale version CAS attempt is rejected and does not mutate state', () => {
        const { store, record } = createStoreWithRecord();
        const staleVersion = record.state.recordVersion; // correct now, but will be stale after a real claim
        const claimResult = claimPendingExecution(store, buildClaimInput());
        expect(claimResult.ok).toBe(true);

        // Attempt a CAS using the now-stale version, but still asserting the
        // (now also stale) 'CREATED' expected status. The version check runs
        // first, so a version that no longer matches is rejected as a version
        // mismatch even though the expected status is also wrong.
        const result = store.compareAndSwap(record.pendingExecutionId, staleVersion, 'CREATED', {
            kind: 'CLAIM',
            claimId: 'forged-claim',
            claimedAt: new Date().toISOString(),
            claimedBy: ACTOR,
            requestId: 'req-x',
        });
        expect(result.ok).toBe(false);
        expect(result.reason).toBe('VERSION_MISMATCH');

        const stored = store.get(record.pendingExecutionId);
        expect(stored?.state.claimId).toBe(claimResult.record?.state.claimId);
    });

    it('stale status CAS attempt (correct version, wrong expected status) is rejected and does not mutate state', () => {
        const { store, record } = createStoreWithRecord();
        const claimResult = claimPendingExecution(store, buildClaimInput());
        expect(claimResult.ok).toBe(true);
        const currentVersion = claimResult.record?.state.recordVersion ?? 0;

        // Correct current version, but caller wrongly still expects 'CREATED'.
        const result = store.compareAndSwap(record.pendingExecutionId, currentVersion, 'CREATED', {
            kind: 'BEGIN_EXECUTING',
            claimId: claimResult.grant?.claimId ?? 'unknown',
            attemptIndex: 0,
        });
        expect(result.ok).toBe(false);
        expect(result.reason).toBe('STATUS_MISMATCH');
        expect(store.get(record.pendingExecutionId)?.state.status).toBe('CLAIMED');
    });

    it('stale status CAS attempt is rejected and does not mutate state', () => {
        const { store, record } = createStoreWithRecord();
        const result = store.compareAndSwap(record.pendingExecutionId, 0, 'CLAIMED', {
            kind: 'BEGIN_EXECUTING',
            claimId: 'nonexistent-claim',
            attemptIndex: 0,
        });
        expect(result.ok).toBe(false);
        expect(result.reason).toBe('STATUS_MISMATCH');
        expect(store.get(record.pendingExecutionId)?.state.status).toBe('CREATED');
    });
});

// ---------------------------------------------------------------------------
// 6. Drift/rejection paths fail closed with no grant
// ---------------------------------------------------------------------------

describe('6. drifted/rejected/expired/mismatched approval fails closed with no grant', () => {
    it('rejects when the approval record cannot be found', () => {
        const { store } = createStoreWithRecord();
        const result = claimPendingExecution(store, buildClaimInput({ lookupApproval: makeLookup(null) }));
        expect(result.ok).toBe(false);
        expect(result.reason).toBe('APPROVAL_NOT_FOUND');
        expect(result.grant).toBeNull();
        expect(store.get('pending-1')?.state.status).toBe('STALE');
    });

    it('rejects when the approval is not approved', () => {
        const { store } = createStoreWithRecord();
        const result = claimPendingExecution(
            store,
            buildClaimInput({ lookupApproval: makeLookup(buildApprovalRecord({ status: 'pending' })) }),
        );
        expect(result.ok).toBe(false);
        expect(result.reason).toBe('APPROVAL_NOT_APPROVED');
        expect(result.grant).toBeNull();
    });

    it('rejects when the approval is expired', () => {
        const { store } = createStoreWithRecord();
        const result = claimPendingExecution(
            store,
            buildClaimInput({
                lookupApproval: makeLookup(
                    buildApprovalRecord({ expiresAt: new Date(Date.now() - 1000).toISOString() }),
                ),
            }),
        );
        expect(result.ok).toBe(false);
        expect(result.reason).toBe('APPROVAL_EXPIRED');
        expect(result.grant).toBeNull();
    });

    it('rejects on actor mismatch', () => {
        const { store } = createStoreWithRecord();
        const result = claimPendingExecution(store, buildClaimInput({ actor: OTHER_ACTOR }));
        expect(result.ok).toBe(false);
        expect(result.reason).toBe('STORED_ACTOR_BINDING_MISMATCH');
        expect(result.grant).toBeNull();
    });

    it('rejects on request hash mismatch', () => {
        const { store } = createStoreWithRecord();
        const result = claimPendingExecution(
            store,
            buildClaimInput({ lookupApproval: makeLookup(buildApprovalRecord({ requestHash: 'tampered-hash' })) }),
        );
        expect(result.ok).toBe(false);
        expect(result.reason).toBe('APPROVAL_REQUEST_HASH_MISMATCH');
        expect(result.grant).toBeNull();
    });

    it('rejects when the current approval snapshot no longer matches its stored hash', () => {
        const { store } = createStoreWithRecord();
        const changedSnapshot = buildSnapshot({ intent: 'changed-current-intent' });
        const result = claimPendingExecution(
            store,
            buildClaimInput({ lookupApproval: makeLookup(buildApprovalRecord({ requestSnapshot: changedSnapshot })) }),
        );
        expect(result.ok).toBe(false);
        expect(result.reason).toBe('APPROVAL_CURRENT_SNAPSHOT_MISMATCH');
        expect(result.grant).toBeNull();
    });

    it('rejects approval ID mismatch and invalid expiry syntax', () => {
        const first = createStoreWithRecord().store;
        const idMismatch = claimPendingExecution(first, buildClaimInput({
            lookupApproval: makeLookup(buildApprovalRecord({ id: 'different-approval' })),
        }));
        expect(idMismatch.reason).toBe('APPROVAL_ID_MISMATCH');

        const second = createStoreWithRecord().store;
        const invalidTime = claimPendingExecution(second, buildClaimInput({
            lookupApproval: makeLookup(buildApprovalRecord({ expiresAt: 'not-a-date' })),
        }));
        expect(invalidTime.reason).toBe('APPROVAL_TIME_INVALID');
    });

    it('rejects on policy fingerprint drift', () => {
        const { store } = createStoreWithRecord();
        const result = claimPendingExecution(
            store,
            buildClaimInput({ currentPolicySnapshot: buildPolicySnapshot({ riskLevel: 'critical' }) }),
        );
        expect(result.ok).toBe(false);
        expect(result.reason).toBe('POLICY_FINGERPRINT_DRIFT');
        expect(result.grant).toBeNull();
        expect(store.get('pending-1')?.state.terminalReason).toBe('STALE_POLICY_FINGERPRINT_CHANGED');
    });

    it('rejects on record digest drift (tampered stored immutable field)', () => {
        const { store, record } = createStoreWithRecord();
        const internal = store as unknown as { records: Map<string, PendingAgentExecutionRecord> };
        const stored = internal.records.get(record.pendingExecutionId)!;
        stored.payload.normalizedIntent.action = 'tampered-internal-intent';
        const result = claimPendingExecution(store, buildClaimInput());
        expect(result.ok).toBe(false);
        expect(result.reason).toBe('RECORD_DIGEST_MISMATCH');
        expect(result.grant).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 7. Forged grant and replay fail runtime membership
// ---------------------------------------------------------------------------

describe('7. forged grant and replay fail runtime membership checks', () => {
    it('a structurally identical forged grant object fails the authenticity check', () => {
        const { store } = createStoreWithRecord();
        const claimResult = claimPendingExecution(store, buildClaimInput());
        expect(claimResult.ok).toBe(true);
        const realGrant = claimResult.grant as ResumeAuthorityGrant;

        // Attempt to forge a grant via prototype manipulation (no exported
        // constructor/factory exists, so this is the closest a caller could
        // get to "structural imitation").
        const forged = Object.create(ResumeAuthorityGrant.prototype) as ResumeAuthorityGrant;

        expect(isAuthenticUnconsumedGrant(forged)).toBe(false);
        expect(isAuthenticUnconsumedGrant(realGrant)).toBe(true);

        const forgedAttempt = expectBeginFailure(beginPendingExecution(store, forged, 0));
        expect(forgedAttempt.reason).toBe('FORGED_OR_CONSUMED_GRANT');
    });

    it('a plain object literal matching the public shape is never an instance of the grant class', () => {
        const fakeGrant = { pendingExecutionId: 'pending-1', claimId: 'claim-0' };
        expect(fakeGrant instanceof ResumeAuthorityGrant).toBe(false);
        expect(isAuthenticUnconsumedGrant(fakeGrant)).toBe(false);
    });

    it('replay of an already-consumed grant fails', () => {
        const { store } = createStoreWithRecord();
        const claimResult = claimPendingExecution(store, buildClaimInput());
        const grant = claimResult.grant as ResumeAuthorityGrant;

        const first = beginPendingExecution(store, grant, 0);
        expect(first.ok).toBe(true);

        const replay = expectBeginFailure(beginPendingExecution(store, grant, 0));
        expect(replay.reason).toBe('FORGED_OR_CONSUMED_GRANT');
    });

    it('exports no grant constructor or factory function', async () => {
        const mod = (await import('./pending-agent-execution')) as unknown as Record<string, unknown>;
        expect(ResumeAuthorityGrant).not.toHaveProperty('__internalCreate');
        expect(mod).not.toHaveProperty('createResumeAuthorityGrant');
        expect(mod).not.toHaveProperty('buildResumeAuthorityGrant');
        expect(mod).not.toHaveProperty('makeResumeAuthorityGrant');
    });

    it('rejects direct construction and serialization of authentic grants', () => {
        const Constructor = ResumeAuthorityGrant as unknown as new (token: symbol) => ResumeAuthorityGrant;
        expect(() => new Constructor(Symbol('caller-token'))).toThrow(CanonicalizationError);
        const { store } = createStoreWithRecord();
        const grant = claimPendingExecution(store, buildClaimInput()).grant!;
        expect(() => JSON.stringify(grant)).toThrow(/not serializable/);
        expect(Object.keys(grant)).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// 8. Grant consumed before executing CAS; injected CAS failure cannot reuse it
// ---------------------------------------------------------------------------

describe('8. grant consumption precedes the executing CAS', () => {
    it('grant membership is gone even when the subsequent CAS fails', () => {
        const { store } = createStoreWithRecord();
        const claimResult = claimPendingExecution(store, buildClaimInput());
        const grant = claimResult.grant as ResumeAuthorityGrant;

        // Force the CAS to fail by first abandoning the record out from under
        // the grant (simulating an injected/racing CAS failure).
        const current = store.get(grant.pendingExecutionId);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        abandonBeforeStart(store, grant.pendingExecutionId, current!.state.recordVersion, grant.claimId, 'test-abandon', new Date().toISOString());

        expect(isAuthenticUnconsumedGrant(grant)).toBe(true); // still authentic before consumption attempt

        const attempt = expectBeginFailure(beginPendingExecution(store, grant, 0));
        expect(attempt.reason).toBe('CAS_FAILED');

        // Grant is now consumed regardless of the CAS outcome: it can never
        // be presented again successfully.
        expect(isAuthenticUnconsumedGrant(grant)).toBe(false);
        const secondAttempt = expectBeginFailure(beginPendingExecution(store, grant, 0));
        expect(secondAttempt.reason).toBe('FORGED_OR_CONSUMED_GRANT');
    });

    it('rejects a negative or non-integer attemptIndex before touching the grant', () => {
        const { store } = createStoreWithRecord();
        const claimResult = claimPendingExecution(store, buildClaimInput());
        const grant = claimResult.grant as ResumeAuthorityGrant;
        expect(() => beginPendingExecution(store, grant, -1)).toThrow(CanonicalizationError);
        expect(() => beginPendingExecution(store, grant, 1.5)).toThrow(CanonicalizationError);
        // Grant must remain untouched by the validation-only rejection.
        expect(isAuthenticUnconsumedGrant(grant)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// 9. Crash-before-EXECUTING vs ambiguity-after-EXECUTING
// ---------------------------------------------------------------------------

describe('9. crash-boundary disposition', () => {
    it('a crash before EXECUTING permits only ABANDONED_BEFORE_START, never a fresh claim', () => {
        const { store, record } = createStoreWithRecord();
        const claimResult = claimPendingExecution(store, buildClaimInput());
        const grant = claimResult.grant as ResumeAuthorityGrant;
        void grant; // simulate: claimed, but process crashes before beginPendingExecution

        const stored = store.get(record.pendingExecutionId);
        const abandonResult = abandonBeforeStart(
            store,
            record.pendingExecutionId,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            stored!.state.recordVersion,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            stored!.state.claimId!,
            'process_exit_before_executing',
            new Date().toISOString(),
        );
        expect(abandonResult.ok).toBe(true);
        expect(abandonResult.record?.state.status).toBe('ABANDONED_BEFORE_START');

        // No fresh claim is ever possible again for this pendingExecutionId.
        const freshClaimAttempt = claimPendingExecution(store, buildClaimInput());
        expect(freshClaimAttempt.ok).toBe(false);
        expect(freshClaimAttempt.reason).toBe('ALREADY_CLAIMED_OR_TERMINAL');
    });

    it('ambiguity after EXECUTING permits only UNKNOWN_TERMINAL, never a fresh claim', () => {
        const { store, record } = createStoreWithRecord();
        const claimResult = claimPendingExecution(store, buildClaimInput());
        const grant = claimResult.grant as ResumeAuthorityGrant;
        const begin = beginPendingExecution(store, grant, 0);
        if (!begin.ok) {
            throw new Error('expected beginPendingExecution to succeed');
        }

        const executingRecord = begin.record;
        const crashResult = resolveAmbiguousExecutingCrash(store, {
            pendingExecutionId: record.pendingExecutionId,
            expectedVersion: executingRecord.state.recordVersion,
            claimId: grant.claimId,
            attemptIndex: 0,
            reason: 'process_exit_after_call_start_ambiguous',
            at: new Date().toISOString(),
        });
        expect(crashResult.ok).toBe(true);
        expect(crashResult.record?.state.status).toBe('UNKNOWN_TERMINAL');

        const freshClaimAttempt = claimPendingExecution(store, buildClaimInput());
        expect(freshClaimAttempt.ok).toBe(false);
        expect(freshClaimAttempt.reason).toBe('ALREADY_CLAIMED_OR_TERMINAL');

        // UNKNOWN_TERMINAL is terminal: replaying the expected pre-terminal
        // status ('EXECUTING') fails on the ordinary status guard, since the
        // record has already moved on.
        const replayAttempt = applyTerminalTransition(store, {
            pendingExecutionId: record.pendingExecutionId,
            expectedVersion: crashResult.record?.state.recordVersion ?? 0,
            claimId: grant.claimId,
            attemptIndex: 0,
            status: 'SUCCEEDED',
            reason: 'illegitimate_replay',
            at: new Date().toISOString(),
        });
        expect(replayAttempt.ok).toBe(false);
        expect(replayAttempt.reason).toBe('STATUS_MISMATCH');

        // Directly probing the terminal-state guard: even a CAS call that
        // correctly names the record's own current terminal status as its
        // expected status is rejected, because no transition is legal out of
        // any terminal state (defense-in-depth beyond the ordinary status
        // check above).
        const directTerminalProbe = store.compareAndSwap(
            record.pendingExecutionId,
            crashResult.record?.state.recordVersion ?? 0,
            'UNKNOWN_TERMINAL' as never,
            {
                kind: 'TERMINAL',
                claimId: grant.claimId,
                attemptIndex: 0,
                status: 'SUCCEEDED',
                reason: 'illegitimate_replay_2',
                terminalAt: new Date().toISOString(),
            },
        );
        expect(directTerminalProbe.ok).toBe(false);
        expect(directTerminalProbe.reason).toBe('TERMINAL_STATE_IMMUTABLE');
    });
});

// ---------------------------------------------------------------------------
// 10. Distinct terminal outcomes and correlation data
// ---------------------------------------------------------------------------

describe('10. terminal outcomes remain distinct with correlation data', () => {
    function claimAndBegin() {
        const { store, record } = createStoreWithRecord();
        const claimResult = claimPendingExecution(store, buildClaimInput());
        const grant = claimResult.grant as ResumeAuthorityGrant;
        const begin = beginPendingExecution(store, grant, 3);
        return { store, record, grant, begin };
    }

    it('SUCCEEDED, FAILED, DENIED, UNKNOWN_TERMINAL are mutually distinct and reachable', () => {
        const outcomes: Array<'SUCCEEDED' | 'FAILED' | 'DENIED' | 'UNKNOWN_TERMINAL'> = [
            'SUCCEEDED',
            'FAILED',
            'DENIED',
            'UNKNOWN_TERMINAL',
        ];
        const reached = new Set<string>();
        for (const outcome of outcomes) {
            const { store, record, grant } = claimAndBegin();
            const stored = store.get(record.pendingExecutionId);
            const result = applyTerminalTransition(store, {
                pendingExecutionId: record.pendingExecutionId,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                expectedVersion: stored!.state.recordVersion,
                claimId: grant.claimId,
                attemptIndex: 3,
                status: outcome,
                reason: `reached_${outcome.toLowerCase()}`,
                at: new Date().toISOString(),
            });
            expect(result.ok).toBe(true);
            expect(result.record?.state.status).toBe(outcome);
            reached.add(result.record?.state.status ?? '');
        }
        expect(reached.size).toBe(4);
    });

    it('correlation data carries approvalId, pendingExecutionId, claimId, requestId, attemptIndex, recordVersion, and reason', () => {
        const { store, record, grant } = claimAndBegin();
        const stored = store.get(record.pendingExecutionId);
        const result = applyTerminalTransition(store, {
            pendingExecutionId: record.pendingExecutionId,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            expectedVersion: stored!.state.recordVersion,
            claimId: grant.claimId,
            attemptIndex: 3,
            status: 'SUCCEEDED',
            reason: 'provider_call_completed',
            at: new Date().toISOString(),
        });
        expect(result.ok).toBe(true);
        const finalRecord = result.record;
        expect(finalRecord?.payload.approvalId).toBe('approval-1');
        expect(finalRecord?.pendingExecutionId).toBe(record.pendingExecutionId);
        expect(finalRecord?.state.claimId).toBe(grant.claimId);
        expect(finalRecord?.state.requestId).toBe('req-1');
        expect(finalRecord?.state.attemptIndex).toBe(3);
        expect(typeof finalRecord?.state.recordVersion).toBe('number');
        expect(finalRecord?.state.terminalReason).toBe('provider_call_completed');
    });

    it('terminal transition requires matching claim ID and attempt index', () => {
        const { store, record, grant } = claimAndBegin();
        const stored = store.get(record.pendingExecutionId);
        const wrongClaim = applyTerminalTransition(store, {
            pendingExecutionId: record.pendingExecutionId,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            expectedVersion: stored!.state.recordVersion,
            claimId: 'wrong-claim-id',
            attemptIndex: 3,
            status: 'SUCCEEDED',
            reason: 'x',
            at: new Date().toISOString(),
        });
        expect(wrongClaim.ok).toBe(false);
        expect(wrongClaim.reason).toBe('CLAIM_ID_MISMATCH');

        const wrongAttempt = applyTerminalTransition(store, {
            pendingExecutionId: record.pendingExecutionId,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            expectedVersion: stored!.state.recordVersion,
            claimId: grant.claimId,
            attemptIndex: 99,
            status: 'SUCCEEDED',
            reason: 'x',
            at: new Date().toISOString(),
        });
        expect(wrongAttempt.ok).toBe(false);
        expect(wrongAttempt.reason).toBe('ATTEMPT_INDEX_MISMATCH');
    });
});

// ---------------------------------------------------------------------------
// 11. Static proof of zero forbidden imports/calls
// ---------------------------------------------------------------------------

describe('11. static proof of call-boundary isolation', () => {
    it('imports/calls no route, AER, provider, admission, audit-store, network, or credential surface', () => {
        const sourcePath = join(__dirname, 'pending-agent-execution.ts');
        const source = readFileSync(sourcePath, 'utf8');

        const forbiddenTokens = [
            'AgentExecutionRuntime',
            'admitProviderAttempt',
            'recordProviderCallStart',
            'admitAndInvokeProvider',
            'executeAI',
            'fetch(',
            'appendAuditEvent',
            "from 'next/server'",
            'NextResponse',
            "from '@/lib/provider-attempt-admission'",
            "from '@/lib/control-plane-events'",
        ];

        for (const token of forbiddenTokens) {
            expect(source).not.toContain(token);
        }
    });

    it('only imports read-only reuse types from the approval binding/store modules', () => {
        const sourcePath = join(__dirname, 'pending-agent-execution.ts');
        const source = readFileSync(sourcePath, 'utf8');
        const importLines = source
            .split('\n')
            .filter((line) => line.trim().startsWith('import'));

        for (const line of importLines) {
            if (line.includes('approval-binding') || line.includes('/store')) {
                expect(line).toContain('import type');
            }
        }
    });
});

// ---------------------------------------------------------------------------
// 12. Shared transition helper parity (GC010-SCR-R2-T1C)
// ---------------------------------------------------------------------------

describe('12. shared pure transition helper parity with in-memory CAS', () => {
    it('produces the exact same success reason/record shape as compareAndSwap', () => {
        const now = new Date().toISOString();
        const claimTransition = {
            kind: 'CLAIM' as const, claimId: 'claim-parity-1', claimedAt: now, claimedBy: ACTOR, requestId: 'req-parity-1',
        };
        const { store, record } = createStoreWithRecord();
        const direct = store.compareAndSwap(record.pendingExecutionId, 0, 'CREATED', claimTransition);
        expect(direct.ok).toBe(true);
        expect(direct.reason).toBe('OK');

        // Given the same pre-transition record and inputs, the shared helper
        // must reach the identical decision (module 1's contract: the
        // in-memory store must not apply any rule the helper does not own).
        const helperResult = applyPendingAgentExecutionTransition(createStoreWithRecord().record, 0, 'CREATED', claimTransition);
        expect(helperResult.ok).toBe(direct.ok);
        expect(helperResult.reason).toBe(direct.reason);
        expect(helperResult.record?.state.status).toBe(direct.record?.state.status);
        expect(helperResult.record?.state.claimId).toBe(direct.record?.state.claimId);
        expect(helperResult.record?.state.recordVersion).toBe(direct.record?.state.recordVersion);
    });

    it('reproduces every existing failure reason string byte-for-byte for VERSION_MISMATCH, STATUS_MISMATCH, TERMINAL_STATE_IMMUTABLE, ILLEGAL_TRANSITION, CLAIM_ID_MISMATCH, and ATTEMPT_INDEX_MISMATCH', () => {
        const { record } = createStoreWithRecord();
        const now = new Date().toISOString();

        const versionMismatch = applyPendingAgentExecutionTransition(record, 99, 'CREATED', {
            kind: 'CLAIM', claimId: 'c1', claimedAt: now, claimedBy: ACTOR, requestId: 'r1',
        });
        expect(versionMismatch.reason).toBe('VERSION_MISMATCH');

        const statusMismatch = applyPendingAgentExecutionTransition(record, 0, 'CLAIMED', {
            kind: 'BEGIN_EXECUTING', claimId: 'c1', attemptIndex: 0,
        });
        expect(statusMismatch.reason).toBe('STATUS_MISMATCH');

        const claimed = applyPendingAgentExecutionTransition(record, 0, 'CREATED', {
            kind: 'CLAIM', claimId: 'c1', claimedAt: now, claimedBy: ACTOR, requestId: 'r1',
        });
        expect(claimed.ok).toBe(true);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const claimedRecord = claimed.record!;

        const illegalTransition = applyPendingAgentExecutionTransition(
            claimedRecord,
            claimedRecord.state.recordVersion,
            'CLAIMED',
            { kind: 'CLAIM', claimId: 'c2', claimedAt: now, claimedBy: ACTOR, requestId: 'r2' },
        );
        expect(illegalTransition.reason).toBe('ILLEGAL_TRANSITION');

        const wrongClaimId = applyPendingAgentExecutionTransition(
            claimedRecord,
            claimedRecord.state.recordVersion,
            'CLAIMED',
            { kind: 'BEGIN_EXECUTING', claimId: 'wrong-claim', attemptIndex: 0 },
        );
        expect(wrongClaimId.reason).toBe('CLAIM_ID_MISMATCH');

        const beganExecuting = applyPendingAgentExecutionTransition(
            claimedRecord,
            claimedRecord.state.recordVersion,
            'CLAIMED',
            { kind: 'BEGIN_EXECUTING', claimId: 'c1', attemptIndex: 0 },
        );
        expect(beganExecuting.ok).toBe(true);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const executingRecord = beganExecuting.record!;

        const wrongAttempt = applyPendingAgentExecutionTransition(
            executingRecord,
            executingRecord.state.recordVersion,
            'EXECUTING',
            { kind: 'TERMINAL', claimId: 'c1', attemptIndex: 99, status: 'SUCCEEDED', reason: 'x', terminalAt: now },
        );
        expect(wrongAttempt.reason).toBe('ATTEMPT_INDEX_MISMATCH');

        const terminal = applyPendingAgentExecutionTransition(
            executingRecord,
            executingRecord.state.recordVersion,
            'EXECUTING',
            { kind: 'TERMINAL', claimId: 'c1', attemptIndex: 0, status: 'SUCCEEDED', reason: 'done', terminalAt: now },
        );
        expect(terminal.ok).toBe(true);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const terminalRecord = terminal.record!;

        const afterTerminal = applyPendingAgentExecutionTransition(
            terminalRecord,
            terminalRecord.state.recordVersion,
            'SUCCEEDED',
            { kind: 'TERMINAL', claimId: 'c1', attemptIndex: 0, status: 'FAILED', reason: 'replay', terminalAt: now },
        );
        expect(afterTerminal.reason).toBe('TERMINAL_STATE_IMMUTABLE');
    });

    it('returns a cloned record on both success and failure so callers cannot mutate helper output back into the caller-supplied input', () => {
        const { record } = createStoreWithRecord();
        const result = applyPendingAgentExecutionTransition(record, 0, 'CREATED', {
            kind: 'CLAIM',
            claimId: 'claim-clone-check',
            claimedAt: new Date().toISOString(),
            claimedBy: ACTOR,
            requestId: 'req-clone-check',
        });
        expect(result.ok).toBe(true);
        expect(result.record).not.toBe(record);
        if (result.record) {
            (result.record.state as { status: string }).status = 'TAMPERED';
        }
        expect(record.state.status).toBe('CREATED');

        const failure = applyPendingAgentExecutionTransition(record, 99, 'CREATED', {
            kind: 'CLAIM',
            claimId: 'claim-clone-check-2',
            claimedAt: new Date().toISOString(),
            claimedBy: ACTOR,
            requestId: 'req-clone-check-2',
        });
        expect(failure.ok).toBe(false);
        expect(failure.record).not.toBe(record);
    });

    it('the helper performs no I/O and does not itself mutate any store: calling it twice with the same untouched input is idempotent', () => {
        const { record } = createStoreWithRecord();
        const now = new Date().toISOString();
        const first = applyPendingAgentExecutionTransition(record, 0, 'CREATED', {
            kind: 'CLAIM', claimId: 'claim-idempotent', claimedAt: now, claimedBy: ACTOR, requestId: 'req-idempotent',
        });
        const second = applyPendingAgentExecutionTransition(record, 0, 'CREATED', {
            kind: 'CLAIM', claimId: 'claim-idempotent', claimedAt: now, claimedBy: ACTOR, requestId: 'req-idempotent',
        });
        expect(first.ok).toBe(true);
        expect(second.ok).toBe(true);
        expect(first.record?.state.recordVersion).toBe(second.record?.state.recordVersion);
        expect(first.record?.state.claimId).toBe(second.record?.state.claimId);
        // The original input record itself is never mutated by the helper.
        expect(record.state.status).toBe('CREATED');
        expect(record.state.recordVersion).toBe(0);
    });
});
