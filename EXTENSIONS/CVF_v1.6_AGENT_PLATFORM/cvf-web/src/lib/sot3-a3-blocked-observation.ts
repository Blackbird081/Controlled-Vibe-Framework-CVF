/**
 * SOT3-ACT-A3/A4 failure-path BLOCKED observation shape and atomic writer.
 *
 * Extracted from `route.sot3-activation.alibaba.live.test.ts` so the
 * observation-building and atomic-write logic can be unit-tested directly
 * (import-only, zero permit/provider/network involvement) rather than only
 * through the gated live test file, which requires a real one-use runner
 * permit and DashScope key to exercise its provider-call path at all.
 *
 * Every field on a BLOCKED observation's `diagnostic` sub-object is a fixed
 * literal from `BLOCKED_DIAGNOSTIC` or a plain hash/boolean/length/ID/timing
 * value already available in memory -- never a caught error's message or
 * stack, never a raw response body, prompt, key, header, or bearer value.
 */

import { randomUUID } from 'node:crypto';
import { rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  buildExecutionDiagnostic,
  type ExecutionDiagnosticClass,
} from '@/lib/execution-diagnostics';

/**
 * Interface for the outbound-observation record written to the receipt.
 * Every field is a hash, boolean, length, ID, or timing value  -  never raw
 * prompt/body/key content.
 */
export interface Sot3A3LiveObservation {
  overall: 'PASS' | 'BLOCKED';
  provider: string;
  model: string;
  keyAliasUsed: string | null;
  httpStatus: number | null;
  success: boolean;
  latencyMs: number | null;
  observedCallCount: number;
  providerRequestObserved: boolean;
  approvedContextHash: string | null;
  providerSystemPromptHash: string | null;
  approvedContextIncluded: boolean;
  approvedContextLength: number | null;
  providerSystemPromptLength: number | null;
  governanceReceiptId: string | null;
  envelopeId: string | null;
  sot3RecordId: string | null;
  sot3IntegrityHash: string | null;
  sot3RequestId: string | null;
  traceCount: number | null;
  packetIds: string[];
  kernelDecisionIds: string[];
  truthReceiptIds: string[];
  truthReferenceIds: string[];
  flowPackageIds: string[];
  outputLength: number | null;
  rawKeyPersisted: false;
  rawProviderBodyPersisted: false;
  rawOutputPersisted: false;
  fullPromptPersisted: false;
  diagnostic: {
    stage: string;
    class: string;
    retryable: boolean;
    userAction: string;
    safeMessage: string;
    provider?: string;
    model?: string;
    httpStatus?: number;
    latencyMs?: number;
  } | null;
}

/**
 * Fixed, secret-safe diagnostic class/message for the failure-path BLOCKED
 * observation. Never derived from a caught error's message, a raw response
 * body, or captured process output -- every string here is a static
 * literal chosen from this closed set, so a thrown exception can never
 * smuggle unbounded content into a persisted diagnostic.
 */
export const BLOCKED_DIAGNOSTIC = {
  stage: 'provider',
  class: 'post_call_assertion_or_contract_failure',
  retryable: false,
  userAction: 'inspect_receipt',
  safeMessage: 'The live proof assertions or governance contract checks failed after the provider call attempt.',
} as const;

const SOT3_PROVIDER_FAILURE_CLASSES = new Set<ExecutionDiagnosticClass>([
  'invalid_api_key',
  'insufficient_balance',
  'quota_exceeded',
  'rate_limited',
  'provider_timeout',
  'provider_http_error',
  'model_unavailable',
  'provider_empty_output',
  'provider_parse_error',
  'network_error',
  'unknown_error',
]);

type Sot3BlockedDiagnostic = NonNullable<Sot3A3LiveObservation['diagnostic']>;

/** Projects the route's already-governed execution diagnostic into the
 * SOT3 observation contract. Only the closed provider-failure class is read
 * from the candidate. All messages/actions are rebuilt from CVF's canonical
 * diagnostic table; arbitrary candidate strings are never forwarded. */
export function projectSot3A3ProviderDiagnostic(candidate: unknown): Sot3BlockedDiagnostic | null {
  if (!candidate || typeof candidate !== 'object') return null;
  const value = candidate as Record<string, unknown>;
  if (typeof value.class !== 'string' || !SOT3_PROVIDER_FAILURE_CLASSES.has(value.class as ExecutionDiagnosticClass)) {
    return null;
  }
  const httpStatus = typeof value.httpStatus === 'number' && Number.isInteger(value.httpStatus)
    && value.httpStatus >= 100 && value.httpStatus <= 599 ? value.httpStatus : undefined;
  const latencyMs = typeof value.latencyMs === 'number' && Number.isFinite(value.latencyMs)
    && value.latencyMs >= 0 && value.latencyMs <= 600_000 ? value.latencyMs : undefined;
  const canonical = buildExecutionDiagnostic({
    stage: 'provider',
    class: value.class as ExecutionDiagnosticClass,
    provider: 'alibaba',
    model: 'qwen-flash',
    ...(httpStatus !== undefined ? { httpStatus } : {}),
    ...(latencyMs !== undefined ? { latencyMs } : {}),
  });
  return {
    stage: canonical.stage,
    class: canonical.class,
    retryable: canonical.retryable,
    userAction: canonical.userAction,
    safeMessage: canonical.safeMessage,
    provider: 'alibaba',
    model: 'qwen-flash',
    ...(canonical.httpStatus !== undefined ? { httpStatus: canonical.httpStatus } : {}),
    ...(canonical.latencyMs !== undefined ? { latencyMs: canonical.latencyMs } : {}),
  };
}

/**
 * Writes `observation` to `observationPath` atomically: full content to a
 * sibling `.tmp` file first, then `rename` into place (the same
 * write-temp-then-rename pattern `Sot3ActivationEvidenceStore` uses). A
 * reader can never observe a partially-written or truncated observation
 * file. On any failure the temp file is best-effort removed and the error
 * is swallowed -- this helper is called from a failure path that must not
 * itself throw a second, masking error over the original test failure.
 */
export async function writeObservationAtomic(observationPath: string, observation: Sot3A3LiveObservation): Promise<void> {
  const dir = path.dirname(observationPath);
  const tmpPath = path.join(dir, `.${path.basename(observationPath)}.${randomUUID()}.tmp`);
  try {
    await writeFile(tmpPath, JSON.stringify(observation, null, 2), 'utf8');
    await rename(tmpPath, observationPath);
  } catch {
    try {
      await unlink(tmpPath);
    } catch {
      // best-effort temp cleanup only
    }
  }
}

/**
 * Builds a structured, secret-safe BLOCKED observation from only the
 * allowed fields (stage/class/retryable/userAction/safeMessage, provider,
 * model, httpStatus, latencyMs, observedCallCount) plus the fixed
 * false/null/[] defaults every other `Sot3A3LiveObservation` field already
 * requires. Never includes a raw response body, prompt, key, header,
 * bearer value, exception text, or captured stdout/stderr -- the diagnostic
 * itself is always the fixed `BLOCKED_DIAGNOSTIC` literal, never derived
 * from the caught error.
 */
export function buildBlockedObservation(params: {
  provider: string;
  model: string;
  keyAliasUsed: string | null;
  httpStatus: number | null;
  latencyMs: number | null;
  observedCallCount: number;
  diagnostic?: Sot3BlockedDiagnostic | null;
}): Sot3A3LiveObservation {
  const diagnostic = params.diagnostic
    ? {
        ...params.diagnostic,
        // The fetch observer is the direct source for transport evidence.
        // Route diagnostics can classify a provider failure without carrying
        // HTTP status/latency, so the persistence boundary must not discard
        // independently observed values.
        ...(params.httpStatus !== null ? { httpStatus: params.httpStatus } : {}),
        ...(params.latencyMs !== null ? { latencyMs: params.latencyMs } : {}),
      }
    : {
        stage: BLOCKED_DIAGNOSTIC.stage,
        class: BLOCKED_DIAGNOSTIC.class,
        retryable: BLOCKED_DIAGNOSTIC.retryable,
        userAction: BLOCKED_DIAGNOSTIC.userAction,
        safeMessage: BLOCKED_DIAGNOSTIC.safeMessage,
        provider: params.provider,
        model: params.model,
        ...(params.httpStatus !== null ? { httpStatus: params.httpStatus } : {}),
        ...(params.latencyMs !== null ? { latencyMs: params.latencyMs } : {}),
      };
  return {
    overall: 'BLOCKED',
    provider: params.provider,
    model: params.model,
    keyAliasUsed: params.keyAliasUsed,
    httpStatus: params.httpStatus,
    success: false,
    latencyMs: params.latencyMs,
    observedCallCount: params.observedCallCount,
    providerRequestObserved: params.observedCallCount > 0,
    approvedContextHash: null,
    providerSystemPromptHash: null,
    approvedContextIncluded: false,
    approvedContextLength: null,
    providerSystemPromptLength: null,
    governanceReceiptId: null,
    envelopeId: null,
    sot3RecordId: null,
    sot3IntegrityHash: null,
    sot3RequestId: null,
    traceCount: null,
    packetIds: [],
    kernelDecisionIds: [],
    truthReceiptIds: [],
    truthReferenceIds: [],
    flowPackageIds: [],
    outputLength: null,
    rawKeyPersisted: false,
    rawProviderBodyPersisted: false,
    rawOutputPersisted: false,
    fullPromptPersisted: false,
    diagnostic,
  };
}

/**
 * Reusable failure-boundary executor. Runs `operation()`; if it throws
 * (synchronously or by rejecting), reads the current in-memory counters via
 * `getBlockedObservationParams()` -- called only at throw-time, so it always
 * reflects whatever the fetch observer had actually counted before the
 * failure, never a stale snapshot taken before `operation` ran -- builds a
 * BLOCKED observation, persists it atomically at `observationPath`, and then
 * re-throws the original error unchanged so the caller (a vitest `it()`
 * block) still reports the real failure.
 *
 * This is the ONE production call site both `route.sot3-activation.alibaba
 * .live.test.ts` and its dedicated unit tests exercise, so a future edit
 * that removes the catch-side persistence or moves it behind all of
 * `operation`'s own internal assertions changes this exact function's
 * behavior -- not a parallel, divergent copy that could silently drift from
 * what production actually calls.
 *
 * On success, `operation()`'s return value is returned unchanged and no
 * observation write happens here at all (the PASS observation write is
 * `operation`'s own responsibility, at the end of its own body) -- this
 * executor governs only the failure path.
 *
 * Never issues a provider/network call itself: `getBlockedObservationParams`
 * must be a pure read of already-set in-memory state, and this function
 * never invokes `fetch` or any provider client.
 */
export async function runSot3A3FailureBoundary<T>(
  operation: () => Promise<T>,
  observationPath: string | undefined,
  getBlockedObservationParams: () => {
    provider: string;
    model: string;
    keyAliasUsed: string | null;
    httpStatus: number | null;
    latencyMs: number | null;
    observedCallCount: number;
    diagnostic?: Sot3BlockedDiagnostic | null;
  },
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (observationPath) {
      await writeObservationAtomic(observationPath, buildBlockedObservation(getBlockedObservationParams()));
    }
    throw error;
  }
}
