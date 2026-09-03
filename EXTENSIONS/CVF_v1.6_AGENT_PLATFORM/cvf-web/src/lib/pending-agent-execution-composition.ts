/** GC010-SCR-R2-T1C route-independent composition owner.
 *
 * Constructs a `PendingAgentExecutionSqliteStore` and exposes bounded wrapper
 * functions over the create/get/claim/begin/terminal/reconciliation
 * operations already implemented and owned by T1A's core
 * (`pending-agent-execution.ts`). This module composes; it does not
 * reimplement any lifecycle or transition-legality rule.
 *
 * Import boundary (per the accepted T1B decision and this tranche's work
 * order): this file imports ONLY from T1A's core and the new specialized
 * SQLite store. It never imports or calls a route file, the approval API,
 * a provider-admission-and-invocation surface, any audit-event-append
 * surface, a network-fetch call, a process environment lookup, or an
 * execution-runtime/AER surface. It is not exported through any package
 * barrel and has no caller anywhere else in the codebase for this tranche:
 * it is intentionally orphaned/unwired pending a separately authorized
 * route/provider/audit reopen gate (T1B Question 13).
 *
 * Every typed store failure from module 2 (`PendingAgentExecutionStoreError`)
 * is caught here and converted into a zero-grant, zero-execution-authority
 * result: a store failure never accidentally propagates as an implicit
 * success or a usable capability.
 *
 * Claim boundary: local non-production composition wiring only; no runtime,
 * route, provider, audit, package export, public, deploy, or production
 * claim is made by this file.
 */

import {
    abandonBeforeStart,
    applyTerminalTransition,
    beginPendingExecution,
    claimPendingExecution,
    expirePendingExecution,
    resolveAmbiguousExecutingCrash,
    type BeginPendingExecutionResult,
    type ClaimPendingExecutionInput,
    type ClaimPendingExecutionResult,
    type CompareAndSwapResult,
    type PendingAgentExecutionImmutablePayload,
    type PendingAgentExecutionRecord,
    type ResumeAuthorityGrant,
    type TerminalTransitionInput,
} from './pending-agent-execution';
import {
    PendingAgentExecutionSqliteStore,
    PendingAgentExecutionStoreError,
} from './pending-agent-execution-sqlite-store';

// ---------------------------------------------------------------------------
// Zero-grant failure containment
// ---------------------------------------------------------------------------

export type PendingAgentExecutionZeroGrantFailureReason =
    | 'STORE_BUSY_TIMEOUT'
    | 'STORE_IO_FAILURE'
    | 'STORE_CORRUPT_ROW'
    | 'STORE_SCHEMA_MISMATCH'
    | 'STORE_UNKNOWN_ERROR';

export interface PendingAgentExecutionZeroGrantFailure {
    ok: false;
    reason: PendingAgentExecutionZeroGrantFailureReason;
    grant: null;
    record: null;
}

function toRuntimeFailure(error: unknown): PendingAgentExecutionZeroGrantFailure {
    if (error instanceof PendingAgentExecutionStoreError) {
        const reasonByCode: Record<string, PendingAgentExecutionZeroGrantFailureReason> = {
            BUSY_TIMEOUT: 'STORE_BUSY_TIMEOUT',
            IO_FAILURE: 'STORE_IO_FAILURE',
            CORRUPT_ROW: 'STORE_CORRUPT_ROW',
            SCHEMA_MISMATCH: 'STORE_SCHEMA_MISMATCH',
        };
        return {
            ok: false,
            reason: reasonByCode[error.code] ?? 'STORE_UNKNOWN_ERROR',
            grant: null,
            record: null,
        };
    }
    return { ok: false, reason: 'STORE_UNKNOWN_ERROR', grant: null, record: null };
}

// ---------------------------------------------------------------------------
// Bounded runtime bundle
// ---------------------------------------------------------------------------

export type CreatePendingExecutionOutcome =
    | { ok: true; record: PendingAgentExecutionRecord }
    | PendingAgentExecutionZeroGrantFailure;

export type GetPendingExecutionOutcome =
    | { ok: true; record: PendingAgentExecutionRecord | null }
    | PendingAgentExecutionZeroGrantFailure;

export type ClaimPendingExecutionOutcome =
    | ClaimPendingExecutionResult
    | PendingAgentExecutionZeroGrantFailure;

export type BeginPendingExecutionOutcome =
    | BeginPendingExecutionResult
    | PendingAgentExecutionZeroGrantFailure;

export type TerminalOrReconciliationOutcome =
    | CompareAndSwapResult
    | PendingAgentExecutionZeroGrantFailure;

export interface PendingAgentExecutionComposedRuntime {
    readonly store: PendingAgentExecutionSqliteStore;
    create(
        pendingExecutionId: string,
        createdAt: string,
        payload: PendingAgentExecutionImmutablePayload,
    ): CreatePendingExecutionOutcome;
    get(pendingExecutionId: string): GetPendingExecutionOutcome;
    claim(input: ClaimPendingExecutionInput): ClaimPendingExecutionOutcome;
    begin(grant: ResumeAuthorityGrant, attemptIndex: number): BeginPendingExecutionOutcome;
    terminal(input: TerminalTransitionInput): TerminalOrReconciliationOutcome;
    resolveAmbiguousExecutingCrash(
        input: Omit<TerminalTransitionInput, 'status'>,
    ): TerminalOrReconciliationOutcome;
    abandonBeforeStart(
        pendingExecutionId: string,
        expectedVersion: number,
        claimId: string,
        reason: string,
        at: string,
    ): TerminalOrReconciliationOutcome;
    expire(
        pendingExecutionId: string,
        expectedVersion: number,
        reason: string,
        at: string,
    ): TerminalOrReconciliationOutcome;
    close(): void;
}

/**
 * Constructs the durable single-node runtime bundle: one specialized SQLite
 * store plus bounded wrapper functions over T1A's already-implemented
 * lifecycle operations. `dbPath` must be a caller-supplied, non-empty local
 * filesystem path (no default/global/environment/repository/user-home path
 * is consulted anywhere in this module or the store it constructs).
 */
export function buildPendingAgentExecutionRuntime(dbPath: string): PendingAgentExecutionComposedRuntime {
    const store = new PendingAgentExecutionSqliteStore(dbPath);

    return {
        store,

        create(pendingExecutionId, createdAt, payload) {
            try {
                const record = store.create(pendingExecutionId, createdAt, payload);
                return { ok: true, record };
            } catch (error) {
                return toRuntimeFailure(error);
            }
        },

        get(pendingExecutionId) {
            try {
                const record = store.get(pendingExecutionId);
                return { ok: true, record };
            } catch (error) {
                return toRuntimeFailure(error);
            }
        },

        claim(input) {
            try {
                const result = claimPendingExecution(store, input);
                return result;
            } catch (error) {
                return toRuntimeFailure(error);
            }
        },

        begin(grant, attemptIndex) {
            try {
                return beginPendingExecution(store, grant, attemptIndex);
            } catch (error) {
                return toRuntimeFailure(error);
            }
        },

        terminal(input) {
            try {
                return applyTerminalTransition(store, input);
            } catch (error) {
                return toRuntimeFailure(error);
            }
        },

        resolveAmbiguousExecutingCrash(input) {
            try {
                return resolveAmbiguousExecutingCrash(store, input);
            } catch (error) {
                return toRuntimeFailure(error);
            }
        },

        abandonBeforeStart(pendingExecutionId, expectedVersion, claimId, reason, at) {
            try {
                return abandonBeforeStart(store, pendingExecutionId, expectedVersion, claimId, reason, at);
            } catch (error) {
                return toRuntimeFailure(error);
            }
        },

        expire(pendingExecutionId, expectedVersion, reason, at) {
            try {
                return expirePendingExecution(store, pendingExecutionId, expectedVersion, reason, at);
            } catch (error) {
                return toRuntimeFailure(error);
            }
        },

        close() {
            store.close();
        },
    };
}
