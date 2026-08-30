import { describe, it, expect, beforeEach } from 'vitest';
import {
    admitProviderAttempt,
    buildProviderAttemptReconciliation,
    createProviderAttemptLedger,
    recordProviderCallStart,
} from './provider-attempt-admission';
import { getRateLimiter, resetRateLimitStoresForTest } from './rate-limit';

describe('provider-attempt-admission', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
        delete process.env.CVF_RATE_LIMIT_STORE;
        delete process.env.UPSTASH_REDIS_REST_URL;
        delete process.env.UPSTASH_REDIS_REST_TOKEN;
        resetRateLimitStoresForTest();
    });

    // -- Deterministic: initial success ----------------------------------
    it('admits the initial attempt when quota is available', async () => {
        process.env.CVF_PROVIDER_QUOTA_PER_MIN = '10';
        const ledger = createProviderAttemptLedger({
            identityKind: 'session',
            identityHash: 'user-a',
            providerModel: 'alibaba:qwen-flash',
        });
        const result = await admitProviderAttempt(ledger, 'initial');
        expect(result.admitted).toBe(true);
        expect(ledger.admittedCount).toBe(1);
        expect(ledger.deniedCount).toBe(0);
        // Admission alone must NOT increment providerCallCount (DSH-WRA-R1-RV-F01).
        expect(ledger.providerCallCount).toBe(0);
        recordProviderCallStart(ledger, result.attemptIndex);
        expect(ledger.providerCallCount).toBe(1);
    });

    // -- Deterministic: one retry ----------------------------------------
    it('admits an initial attempt plus one retry as two independent attempts', async () => {
        process.env.CVF_PROVIDER_QUOTA_PER_MIN = '10';
        const ledger = createProviderAttemptLedger({
            identityKind: 'session',
            identityHash: 'user-b',
            providerModel: 'alibaba:qwen-flash',
        });
        const first = await admitProviderAttempt(ledger, 'initial');
        recordProviderCallStart(ledger, first.attemptIndex);
        const second = await admitProviderAttempt(ledger, 'retry');
        recordProviderCallStart(ledger, second.attemptIndex);
        expect(first.admitted).toBe(true);
        expect(second.admitted).toBe(true);
        expect(ledger.providerCallCount).toBe(2);
        expect(ledger.attempts.map((a) => a.purpose)).toEqual(['initial', 'retry']);

        const reconciliation = buildProviderAttemptReconciliation(ledger, 'alibaba', 'qwen-flash');
        expect(reconciliation.providerCallCount).toBe(2);
        expect(reconciliation.retryCount).toBe(1);
        expect(reconciliation.reconciles).toBe(true);
    });

    // -- Deterministic: retry exhaustion (quota runs out mid-retry-loop) --
    it('denies further attempts once the per-attempt quota is exhausted (retry exhaustion)', async () => {
        process.env.CVF_PROVIDER_QUOTA_PER_MIN = '2';
        const ledger = createProviderAttemptLedger({
            identityKind: 'session',
            identityHash: 'user-c',
            providerModel: 'alibaba:qwen-flash',
        });
        const first = await admitProviderAttempt(ledger, 'initial');
        recordProviderCallStart(ledger, first.attemptIndex);
        const second = await admitProviderAttempt(ledger, 'retry');
        recordProviderCallStart(ledger, second.attemptIndex);
        const third = await admitProviderAttempt(ledger, 'retry');
        expect(first.admitted).toBe(true);
        expect(second.admitted).toBe(true);
        expect(third.admitted).toBe(false);
        expect(ledger.providerCallCount).toBe(2);
        expect(ledger.deniedCount).toBe(1);
    });

    // -- Deterministic: admission alone never increments providerCallCount --
    it('REGRESSION GUARD (F01): admission alone must never increment providerCallCount without a matching call-start', async () => {
        process.env.CVF_PROVIDER_QUOTA_PER_MIN = '10';
        const ledger = createProviderAttemptLedger({
            identityKind: 'session',
            identityHash: 'user-f01-admission-only',
            providerModel: 'alibaba:qwen-flash',
        });
        await admitProviderAttempt(ledger, 'initial');
        await admitProviderAttempt(ledger, 'retry');
        // Two attempts were admitted, but recordProviderCallStart was never
        // called for either, so providerCallCount must remain 0 - proving
        // that admission (reservation) and call-start (invocation) are
        // independently tracked, not conflated as they were before F01.
        expect(ledger.admittedCount).toBe(2);
        expect(ledger.providerCallCount).toBe(0);
    });

    // -- Deterministic: recordProviderCallStart is idempotent per attempt --
    it('recordProviderCallStart increments providerCallCount only once per attemptIndex even if called twice', async () => {
        process.env.CVF_PROVIDER_QUOTA_PER_MIN = '10';
        const ledger = createProviderAttemptLedger({
            identityKind: 'session',
            identityHash: 'user-idempotent',
            providerModel: 'alibaba:qwen-flash',
        });
        const admission = await admitProviderAttempt(ledger, 'initial');
        recordProviderCallStart(ledger, admission.attemptIndex);
        recordProviderCallStart(ledger, admission.attemptIndex);
        expect(ledger.providerCallCount).toBe(1);
    });

    // -- Deterministic: call-start is a no-op for a non-admitted attempt ----
    it('recordProviderCallStart is a no-op for an attemptIndex that was never admitted', async () => {
        process.env.CVF_PROVIDER_QUOTA_PER_MIN = '1';
        const ledger = createProviderAttemptLedger({
            identityKind: 'session',
            identityHash: 'user-denied-callstart',
            providerModel: 'alibaba:qwen-flash',
        });
        await admitProviderAttempt(ledger, 'initial');
        const denied = await admitProviderAttempt(ledger, 'retry');
        expect(denied.admitted).toBe(false);
        recordProviderCallStart(ledger, denied.attemptIndex);
        expect(ledger.providerCallCount).toBe(0);
    });

    // -- Deterministic: admission denial before the first call ever fires -
    it('denies admission before any provider call when quota is already exhausted', async () => {
        process.env.CVF_PROVIDER_QUOTA_PER_MIN = '1';
        const limiter = getRateLimiter();
        // Pre-exhaust the quota using the same identity/model key as the ledger.
        await limiter.consumeProviderAttempt('session', 'user-d', 'alibaba:qwen-flash');

        const ledger = createProviderAttemptLedger({
            identityKind: 'session',
            identityHash: 'user-d',
            providerModel: 'alibaba:qwen-flash',
        });
        const result = await admitProviderAttempt(ledger, 'initial');
        expect(result.admitted).toBe(false);
        expect(ledger.providerCallCount).toBe(0);
        expect(ledger.admittedCount).toBe(0);
        expect(ledger.deniedCount).toBe(1);
    });

    // -- Deterministic: denial before a retry specifically -----------------
    it('denies a retry attempt even after the initial attempt succeeded', async () => {
        process.env.CVF_PROVIDER_QUOTA_PER_MIN = '1';
        const ledger = createProviderAttemptLedger({
            identityKind: 'session',
            identityHash: 'user-e',
            providerModel: 'alibaba:qwen-flash',
        });
        const initial = await admitProviderAttempt(ledger, 'initial');
        recordProviderCallStart(ledger, initial.attemptIndex);
        const retry = await admitProviderAttempt(ledger, 'retry');
        expect(initial.admitted).toBe(true);
        expect(retry.admitted).toBe(false);
        expect(ledger.providerCallCount).toBe(1);
        expect(ledger.deniedCount).toBe(1);
    });

    // -- Concurrency: parallel admissions cannot exceed the ceiling --------
    it('does not allow concurrent requests to exceed the per-attempt ceiling (no check-then-call race)', async () => {
        process.env.CVF_PROVIDER_QUOTA_PER_MIN = '5';
        const ledgers = Array.from({ length: 10 }, () =>
            createProviderAttemptLedger({
                identityKind: 'session',
                identityHash: 'user-concurrent',
                providerModel: 'alibaba:qwen-flash',
            }),
        );
        const results = await Promise.all(ledgers.map((ledger) => admitProviderAttempt(ledger, 'initial')));
        const admittedCount = results.filter((r) => r.admitted).length;
        expect(admittedCount).toBe(5);
        expect(results.length - admittedCount).toBe(5);
    });

    // -- Reconciliation shape / secret exclusion ----------------------------
    it('reconciliation carries only summary counts, never secrets or provider payload', async () => {
        process.env.CVF_PROVIDER_QUOTA_PER_MIN = '10';
        const ledger = createProviderAttemptLedger({
            identityKind: 'session',
            identityHash: 'user-f',
            providerModel: 'alibaba:qwen-flash',
        });
        await admitProviderAttempt(ledger, 'initial');
        const reconciliation = buildProviderAttemptReconciliation(ledger, 'alibaba', 'qwen-flash');
        const serialized = JSON.stringify(reconciliation);
        expect(serialized).not.toMatch(/sk-[a-z0-9_-]+/i);
        expect(serialized).not.toMatch(/api[_-]?key/i);
        expect(reconciliation.claimBoundary).toBe('summary_counts_only_no_secret_provider_payload_or_raw_body');
        const keys = Object.keys(reconciliation).sort();
        expect(keys).toEqual(
            [
                'admittedAttemptCount',
                'claimBoundary',
                'deniedAttemptCount',
                'inboundRequestCount',
                'model',
                'provider',
                'providerCallCount',
                'reconciles',
                'retryCount',
                'schemaVersion',
            ].sort(),
        );
    });

    // -- Reconciliation math when nothing was ever admitted ----------------
    it('reconciliation reports zero retryCount when no attempt was ever admitted', async () => {
        process.env.CVF_PROVIDER_QUOTA_PER_MIN = '1';
        const limiter = getRateLimiter();
        await limiter.consumeProviderAttempt('session', 'user-g', 'alibaba:qwen-flash');
        const ledger = createProviderAttemptLedger({
            identityKind: 'session',
            identityHash: 'user-g',
            providerModel: 'alibaba:qwen-flash',
        });
        await admitProviderAttempt(ledger, 'initial');
        const reconciliation = buildProviderAttemptReconciliation(ledger, 'alibaba', 'qwen-flash');
        expect(reconciliation.providerCallCount).toBe(0);
        expect(reconciliation.retryCount).toBe(0);
        expect(reconciliation.reconciles).toBe(true);
    });

    // -- R2-F01: exact-equality reconciliation must catch a missing call-start --
    it('R2-F01 NEGATIVE: reconciles is false when an attempt is admitted but recordProviderCallStart is never called for it', async () => {
        process.env.CVF_PROVIDER_QUOTA_PER_MIN = '10';
        const ledger = createProviderAttemptLedger({
            identityKind: 'session',
            identityHash: 'user-r2-f01-negative',
            providerModel: 'alibaba:qwen-flash',
        });
        const admission = await admitProviderAttempt(ledger, 'initial');
        expect(admission.admitted).toBe(true);
        // Deliberately do NOT call recordProviderCallStart for this admitted
        // attempt. Under the prior `<=` comparison this would still report
        // reconciles: true (a false positive that hides exactly the
        // composition gap the receipt exists to expose). Under the R2-F01
        // exact-equality repair, admittedCount(1) !== providerCallCount(0),
        // so reconciles must be false.
        expect(ledger.admittedCount).toBe(1);
        expect(ledger.providerCallCount).toBe(0);
        const reconciliation = buildProviderAttemptReconciliation(ledger, 'alibaba', 'qwen-flash');
        expect(reconciliation.reconciles).toBe(false);
    });

    // -- R2-F01: reconciles stays true for every real proof scenario under
    // exact equality (success, retry, initial denial, retry denial, thrown
    // initial, thrown retry are proven at the route level in
    // route.provider-attempt-admission.test.ts; these two unit-level cases
    // cover the admission/call-start pairing directly). ----------------------
    it('R2-F01: reconciles stays true for initial success under exact equality', async () => {
        process.env.CVF_PROVIDER_QUOTA_PER_MIN = '10';
        const ledger = createProviderAttemptLedger({
            identityKind: 'session',
            identityHash: 'user-r2-f01-success',
            providerModel: 'alibaba:qwen-flash',
        });
        const admission = await admitProviderAttempt(ledger, 'initial');
        recordProviderCallStart(ledger, admission.attemptIndex);
        const reconciliation = buildProviderAttemptReconciliation(ledger, 'alibaba', 'qwen-flash');
        expect(ledger.admittedCount).toBe(ledger.providerCallCount);
        expect(reconciliation.reconciles).toBe(true);
    });

    it('R2-F01: reconciles stays true for a successful retry under exact equality', async () => {
        process.env.CVF_PROVIDER_QUOTA_PER_MIN = '10';
        const ledger = createProviderAttemptLedger({
            identityKind: 'session',
            identityHash: 'user-r2-f01-retry',
            providerModel: 'alibaba:qwen-flash',
        });
        const first = await admitProviderAttempt(ledger, 'initial');
        recordProviderCallStart(ledger, first.attemptIndex);
        const second = await admitProviderAttempt(ledger, 'retry');
        recordProviderCallStart(ledger, second.attemptIndex);
        const reconciliation = buildProviderAttemptReconciliation(ledger, 'alibaba', 'qwen-flash');
        expect(ledger.admittedCount).toBe(ledger.providerCallCount);
        expect(reconciliation.reconciles).toBe(true);
    });

    it('R2-F01: reconciles stays true when the initial admission is denied before any call', async () => {
        process.env.CVF_PROVIDER_QUOTA_PER_MIN = '1';
        const limiter = getRateLimiter();
        await limiter.consumeProviderAttempt('session', 'user-r2-f01-initial-denied', 'alibaba:qwen-flash');
        const ledger = createProviderAttemptLedger({
            identityKind: 'session',
            identityHash: 'user-r2-f01-initial-denied',
            providerModel: 'alibaba:qwen-flash',
        });
        const result = await admitProviderAttempt(ledger, 'initial');
        expect(result.admitted).toBe(false);
        const reconciliation = buildProviderAttemptReconciliation(ledger, 'alibaba', 'qwen-flash');
        expect(reconciliation.reconciles).toBe(true);
    });

    it('R2-F01: reconciles stays true when a retry admission is denied after one started call', async () => {
        process.env.CVF_PROVIDER_QUOTA_PER_MIN = '1';
        const ledger = createProviderAttemptLedger({
            identityKind: 'session',
            identityHash: 'user-r2-f01-retry-denied',
            providerModel: 'alibaba:qwen-flash',
        });
        const initial = await admitProviderAttempt(ledger, 'initial');
        recordProviderCallStart(ledger, initial.attemptIndex);
        const retry = await admitProviderAttempt(ledger, 'retry');
        expect(retry.admitted).toBe(false);
        const reconciliation = buildProviderAttemptReconciliation(ledger, 'alibaba', 'qwen-flash');
        expect(reconciliation.reconciles).toBe(true);
    });

    // -- Regression guard: prove the tests actually catch the removed gate --
    it('REGRESSION GUARD: a naive un-admitted call sequence would silently multiply provider calls (documents the defect this module prevents)', async () => {
        // This test simulates the PRE-FIX behavior: calling the provider
        // directly on every retry with no admission check at all, using a
        // local counter standing in for the real provider call. It proves
        // that without admission, retries are unmetered - the defect this
        // whole module exists to close. It intentionally does NOT call
        // admitProviderAttempt, to show what "no gate" looks like.
        let unmeteredProviderCalls = 0;
        const NAIVE_MAX_RETRIES = 2;
        for (let attempt = 0; attempt <= NAIVE_MAX_RETRIES; attempt++) {
            unmeteredProviderCalls += 1; // no admission gate, unlike the real route now
        }
        expect(unmeteredProviderCalls).toBe(3);
        // The real ledger-gated equivalent, by contrast, stops at the quota:
        process.env.CVF_PROVIDER_QUOTA_PER_MIN = '2';
        const ledger = createProviderAttemptLedger({
            identityKind: 'session',
            identityHash: 'user-regression',
            providerModel: 'alibaba:qwen-flash',
        });
        let gatedProviderCalls = 0;
        for (let attempt = 0; attempt <= NAIVE_MAX_RETRIES; attempt++) {
            const admission = await admitProviderAttempt(ledger, attempt === 0 ? 'initial' : 'retry');
            if (!admission.admitted) break;
            gatedProviderCalls += 1;
        }
        expect(gatedProviderCalls).toBe(2);
        expect(gatedProviderCalls).toBeLessThan(unmeteredProviderCalls);
    });
});
