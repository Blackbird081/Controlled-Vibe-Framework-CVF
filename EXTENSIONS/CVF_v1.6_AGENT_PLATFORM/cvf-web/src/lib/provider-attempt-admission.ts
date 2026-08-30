import { NextResponse } from 'next/server';
import { getRateLimiter } from '@/lib/rate-limit';
import { buildEvidenceReceipt } from '@/lib/web-governance-envelope';
import { buildExecutionDiagnostic } from '@/lib/execution-diagnostics';
import type { WebGovernanceEnvelope } from '@/lib/web-governance-envelope';
import type { AifMemoryReinjectionReceipt } from '@/lib/aif-memory-reinjection';
import type { DurableMemoryReceipt } from 'cvf-learning-plane-foundation/web-runtime';

/**
 * Provider-Attempt Admission - DSH-WRA-R1 (rework R1: F01 repair)
 * =================================================================
 * Every actual provider call made by `/api/execute` (the initial call and
 * every output-validation retry) must be independently admitted and counted
 * as a provider attempt BEFORE the call fires. A denied admission must never
 * reach a provider call.
 *
 * This module deliberately separates two distinct events that DSH-WRA-R1-
 * RV-F01 found conflated in the initial implementation:
 *
 *   1. ADMISSION (`admitProviderAttempt`): reserves per-attempt quota via the
 *      existing `consumeProviderAttempt` primitive on `lib/rate-limit.ts`.
 *      This is a reservation/gate decision only. It does NOT increment
 *      `ledger.providerCallCount`, because admission can be granted for a
 *      route condition that is later rejected before any provider is ever
 *      invoked (for example, an admitted 'initial' attempt on a vision
 *      request routed to a non-Alibaba provider, which the route rejects
 *      with 409 before calling any vision adapter).
 *   2. CALL-START ACCOUNTING (`recordProviderCallStart`): increments
 *      `ledger.providerCallCount` at the exact boundary where the real
 *      provider invocation (`executeAI()` / the vision adapter) is about to
 *      fire, and only there. The caller must call this immediately before
 *      the actual invocation, after any admission has already been checked
 *      and after every other pre-provider route validation has passed.
 *
 * Every terminal admitted attempt is call-started exactly once by design
 * (the route calls `recordProviderCallStart` unconditionally right before
 * every `executeAI`/vision call site, with no branch that can admit and then
 * skip invocation), so `providerCallCount` always equals the number of times
 * a provider was actually about to be invoked, never merely the number of
 * granted admissions.
 *
 * Concurrency: `consumeProviderAttempt` delegates to `RateLimitStore.consume`,
 * whose in-memory implementation performs a synchronous (non-awaited)
 * read-increment-write on a single bucket, and whose Redis implementation
 * uses an atomic `INCR`. Neither path yields control between the read and
 * the write, so two concurrent requests admitted through this module cannot
 * both observe and act on the same pre-increment count - the check and the
 * count mutation are the same atomic step, not a separate check-then-call
 * race.
 *
 * @module lib/provider-attempt-admission
 */

export type ProviderAttemptPurpose = 'initial' | 'retry';

export interface ProviderAttemptRecord {
    attemptIndex: number;
    purpose: ProviderAttemptPurpose;
    admitted: boolean;
    retryAfterSeconds?: number;
    /** True once `recordProviderCallStart` has fired for this attempt. */
    callStarted?: boolean;
}

export interface ProviderAttemptLedger {
    schemaVersion: 'cvf.providerAttemptLedger.v1';
    identityKind: 'session' | 'service';
    identityHash: string;
    providerModel: string;
    attempts: ProviderAttemptRecord[];
    admittedCount: number;
    deniedCount: number;
    providerCallCount: number;
    inboundRequestCount: 1;
    /** True once at least one attempt was admitted and a provider call may fire. */
    hasAdmittedAttempt: boolean;
    claimBoundary: 'per_attempt_admission_ledger_no_secret_or_provider_payload_content';
}

export function createProviderAttemptLedger(params: {
    identityKind: 'session' | 'service';
    identityHash: string;
    providerModel: string;
}): ProviderAttemptLedger {
    return {
        schemaVersion: 'cvf.providerAttemptLedger.v1',
        identityKind: params.identityKind,
        identityHash: params.identityHash,
        providerModel: params.providerModel,
        attempts: [],
        admittedCount: 0,
        deniedCount: 0,
        providerCallCount: 0,
        inboundRequestCount: 1,
        hasAdmittedAttempt: false,
        claimBoundary: 'per_attempt_admission_ledger_no_secret_or_provider_payload_content',
    };
}

export interface AdmitProviderAttemptResult {
    admitted: boolean;
    retryAfterSeconds: number;
    /** Index into `ledger.attempts` for the attempt this admission recorded. */
    attemptIndex: number;
}

/**
 * Reserve exactly one provider-attempt admission slot. Must be called before
 * every candidate provider call (initial call and each retry) and every
 * OTHER pre-provider route validation for that call site (e.g. vision-lane
 * provider eligibility) must already have passed before this is called.
 *
 * This function reserves quota and records the admission decision in the
 * ledger's `attempts`/`admittedCount`/`deniedCount` fields. It deliberately
 * does NOT increment `ledger.providerCallCount` - that only happens at the
 * real invocation boundary via `recordProviderCallStart`, so an admission
 * that is granted but never actually leads to a provider call (because a
 * later, unrelated route condition rejects the request first) is never
 * miscounted as a provider call.
 */
export async function admitProviderAttempt(
    ledger: ProviderAttemptLedger,
    purpose: ProviderAttemptPurpose,
): Promise<AdmitProviderAttemptResult> {
    const limiter = getRateLimiter();
    const result = await limiter.consumeProviderAttempt(
        ledger.identityKind,
        ledger.identityHash,
        ledger.providerModel,
    );
    const attemptIndex = ledger.attempts.length;
    ledger.attempts.push({
        attemptIndex,
        purpose,
        admitted: result.allowed,
        ...(result.allowed ? {} : { retryAfterSeconds: result.retryAfterSeconds }),
    });
    if (result.allowed) {
        ledger.admittedCount += 1;
        ledger.hasAdmittedAttempt = true;
    } else {
        ledger.deniedCount += 1;
    }
    return { admitted: result.allowed, retryAfterSeconds: result.retryAfterSeconds, attemptIndex };
}

/**
 * Record that a provider call is actually starting for a previously admitted
 * attempt. Must be called immediately before the real invocation
 * (`executeAI()` or the vision adapter call) and nowhere else. This is the
 * ONLY place `ledger.providerCallCount` is incremented, so the count always
 * reflects attempts that were genuinely about to invoke a provider - not
 * merely attempts that were admitted.
 *
 * Idempotency guard: calling this twice for the same `attemptIndex` (a
 * defensive-programming error, not an expected route path) increments
 * `providerCallCount` only once; the second call is a no-op other than a
 * dev-visible console warning, so a caller bug cannot silently inflate the
 * reconciled call count.
 */
export function recordProviderCallStart(ledger: ProviderAttemptLedger, attemptIndex: number): void {
    const attempt = ledger.attempts[attemptIndex];
    if (!attempt || !attempt.admitted) {
        // Defensive: never allow call-start accounting for a non-admitted or
        // unknown attempt. This should be unreachable from route.ts because
        // every call site checks `admitted` before invoking this function.
        return;
    }
    if (attempt.callStarted) {
        console.warn('recordProviderCallStart called more than once for the same attemptIndex; ignoring duplicate.');
        return;
    }
    attempt.callStarted = true;
    ledger.providerCallCount += 1;
}

export interface ProviderAttemptReconciliation {
    schemaVersion: 'cvf.providerAttemptReconciliation.v1';
    inboundRequestCount: number;
    providerCallCount: number;
    retryCount: number;
    admittedAttemptCount: number;
    deniedAttemptCount: number;
    provider: string;
    model: string;
    reconciles: boolean;
    claimBoundary: 'summary_counts_only_no_secret_provider_payload_or_raw_body';
}

/**
 * Build the reconciliation summary attached to the response/audit evidence.
 * `retryCount` is providerCallCount-1 when at least one call was admitted
 * (the first admitted call is the initial attempt, not a retry); it is 0
 * when no call was ever admitted.
 *
 * Reconciliation invariant (post-R2-F01-repair): admitted attempts must
 * equal actual provider-call-start count exactly under success, retry, and
 * denial - not merely be less-than-or-equal. On route.ts's current design,
 * every admission call site is immediately followed by its matching
 * `recordProviderCallStart` call with no route branch in between, so
 * `providerCallCount` always equals `admittedCount` on every real path.
 * A `<=` comparison would silently accept an admitted-but-never-call-started
 * attempt as "reconciled", hiding exactly the composition gap this receipt
 * exists to expose (DSH-WRA-R1-R2-F01). Exact equality makes that defect
 * class visible instead: if a future code path admits an attempt and then
 * fails to call `recordProviderCallStart` for it (a caller bug, not a
 * route.ts path today), `reconciles` now correctly reports `false`.
 */
export function buildProviderAttemptReconciliation(
    ledger: ProviderAttemptLedger,
    provider: string,
    model: string,
): ProviderAttemptReconciliation {
    const retryCount = ledger.providerCallCount > 0 ? ledger.providerCallCount - 1 : 0;
    const reconciles =
        ledger.providerCallCount === ledger.admittedCount
        && ledger.admittedCount + ledger.deniedCount === ledger.attempts.length
        && ledger.inboundRequestCount === 1;
    return {
        schemaVersion: 'cvf.providerAttemptReconciliation.v1',
        inboundRequestCount: ledger.inboundRequestCount,
        providerCallCount: ledger.providerCallCount,
        retryCount,
        admittedAttemptCount: ledger.admittedCount,
        deniedAttemptCount: ledger.deniedCount,
        provider,
        model,
        reconciles,
        claimBoundary: 'summary_counts_only_no_secret_provider_payload_or_raw_body',
    };
}

export interface BuildProviderAttemptDeniedResponseParams {
    ledger: ProviderAttemptLedger;
    retryAfterSeconds: number;
    routedProvider: string;
    requestedModel?: string;
    govEnvelope: WebGovernanceEnvelope;
    enforcementRiskLevel?: string;
    routingDecision?: string;
    knowledgeSource?: string;
    knowledgeInjected?: boolean;
    requestedKnowledgeCollectionId: string | null;
    knowledgeChunkCount?: number;
    aifMemoryReinjectionReceipt?: AifMemoryReinjectionReceipt;
    durableMemoryReadReceipt?: DurableMemoryReceipt;
    enforcement: unknown;
    guardResult: unknown;
}

/**
 * Build the safe, structured 429 response returned when a provider-attempt
 * admission is denied. No provider call has fired when this is called.
 */
export function buildProviderAttemptDeniedResponse(params: BuildProviderAttemptDeniedResponseParams) {
    const reconciliation = buildProviderAttemptReconciliation(
        params.ledger,
        params.routedProvider,
        params.requestedModel ?? 'default',
    );
    const governanceEvidenceReceipt = buildEvidenceReceipt({
        envelope: params.govEnvelope,
        decision: 'DENY',
        riskLevel: params.enforcementRiskLevel,
        provider: params.routedProvider,
        model: 'provider-attempt-denied',
        routingDecision: params.routingDecision,
        knowledgeSource: params.knowledgeSource,
        knowledgeInjected: params.knowledgeInjected,
        knowledgeCollectionId: params.requestedKnowledgeCollectionId,
        knowledgeChunkCount: params.knowledgeChunkCount,
        aifMemoryReinjection: params.aifMemoryReinjectionReceipt,
        durableMemoryRead: params.durableMemoryReadReceipt,
        providerAttemptReconciliation: reconciliation,
    });
    return NextResponse.json(
        {
            success: false,
            error: 'Provider attempt quota exceeded. Please slow down.',
            provider: params.routedProvider,
            model: 'provider-attempt-denied',
            enforcement: params.enforcement,
            guardResult: params.guardResult,
            governanceEnvelope: params.govEnvelope,
            policySnapshotId: params.govEnvelope.policySnapshotId,
            governanceEvidenceReceipt,
            providerAttemptReconciliation: reconciliation,
            diagnostic: buildExecutionDiagnostic({
                stage: 'rate_limit',
                class: 'rate_limited',
                provider: params.routedProvider,
                httpStatus: 429,
                receiptId: governanceEvidenceReceipt.receiptId,
                traceId: governanceEvidenceReceipt.envelopeId,
            }),
        },
        { status: 429, headers: { 'Retry-After': String(Math.max(1, params.retryAfterSeconds)) } },
    );
}

/**
 * Build the safe, structured 500 response returned when an admitted
 * provider invocation (initial or retry) throws/rejects. Extracted as a
 * shared helper (DSH-WRA-R1-RV-F01 rework) so both the initial and retry
 * call sites in route.ts carry identical reconciliation-bearing error
 * handling without duplicating the response shape inline at each site.
 */
export function buildProviderInvocationErrorResponse(params: {
    ledger: ProviderAttemptLedger;
    error: unknown;
    routedProvider: string;
    requestedModel?: string;
    logLabel: string;
    fallbackMessage: string;
}) {
    console.error(params.logLabel, params.error);
    const reconciliation = buildProviderAttemptReconciliation(
        params.ledger,
        params.routedProvider,
        params.requestedModel ?? 'default',
    );
    return NextResponse.json(
        {
            success: false,
            error: params.error instanceof Error ? params.error.message : params.fallbackMessage,
            provider: params.routedProvider,
            model: params.requestedModel ?? params.routedProvider,
            providerAttemptReconciliation: reconciliation,
            diagnostic: buildExecutionDiagnostic({
                stage: 'provider',
                class: 'unknown_error',
                provider: params.routedProvider,
                model: params.requestedModel ?? params.routedProvider,
                httpStatus: 500,
            }),
        },
        { status: 500 },
    );
}

export type AdmitAndInvokeProviderOutcome<TResult> =
    | { ok: true; result: TResult }
    | { ok: false; response: ReturnType<typeof NextResponse.json> };

/**
 * Compose admission, call-start accounting, invocation, and reconciliation-
 * bearing error handling into a single call, for one candidate provider
 * call (initial or retry). Collapses the near-duplicate admit/try/catch
 * blocks that DSH-WRA-R1-RV-F01's fix otherwise needs at both the initial
 * and retry call sites in route.ts down to one call each.
 */
export async function admitAndInvokeProvider<TResult>(params: {
    ledger: ProviderAttemptLedger;
    purpose: ProviderAttemptPurpose;
    invoke: () => Promise<TResult>;
    onDenied: (retryAfterSeconds: number) => ReturnType<typeof NextResponse.json>;
    routedProvider: string;
    requestedModel?: string;
    errorLogLabel: string;
    errorFallbackMessage: string;
}): Promise<AdmitAndInvokeProviderOutcome<TResult>> {
    const admission = await admitProviderAttempt(params.ledger, params.purpose);
    if (!admission.admitted) {
        return { ok: false, response: params.onDenied(admission.retryAfterSeconds) };
    }
    try {
        recordProviderCallStart(params.ledger, admission.attemptIndex);
        const result = await params.invoke();
        return { ok: true, result };
    } catch (error) {
        return {
            ok: false,
            response: buildProviderInvocationErrorResponse({
                ledger: params.ledger, error, routedProvider: params.routedProvider, requestedModel: params.requestedModel,
                logLabel: params.errorLogLabel, fallbackMessage: params.errorFallbackMessage,
            }),
        };
    }
}
