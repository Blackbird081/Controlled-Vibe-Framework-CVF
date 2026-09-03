/**
 * Canonical Web Gateway Execution - CSCC-R1-T2
 *
 * Web-side composition factory/adapter that wires the Gateway-owned
 * `CanonicalExecutionPort` for the non-vision execute-route text path. This
 * is the ONLY module in `cvf-web` that constructs a
 * `CanonicalExecutionPortRequest`; it is the mandatory-callback boundary
 * required by the frozen T1 contract
 * (`docs/reference/CVF_CANONICAL_EXECUTION_PORT_INTERFACE_CONTRACT_2026-09-03.md`).
 *
 * The atomic attempt-boundary callback built here has exactly one
 * awaited/fallible operation - `admitProviderAttempt` - followed by a
 * synchronous, non-throwing `recordProviderCallStart` call and an immediate
 * return, with no other await or branch in between. This closes the interval
 * in which an admitted attempt could be stranded without call-start
 * accounting, per the frozen contract's atomic-callback rule.
 *
 * This module also owns the exclusive composition-root selection constant
 * (`NON_VISION_EXECUTION_PATH_SELECTION`) and its runtime-checked invariant
 * (`assertNonVisionExecutionPathIsDirect`); `route.ts` imports and calls the
 * assertion at each non-vision call site but does not redeclare the
 * selection itself, so the single source of truth for "exactly one path is
 * ever wired" lives beside this port composition, not duplicated in the
 * route file.
 */
import { CanonicalExecutionAdapter, ProviderExecutionBridge } from 'cvf-model-gateway';
import type {
    CanonicalExecutionAttemptBoundaryInput,
    CanonicalExecutionAttemptBoundaryOutcome,
    CanonicalExecutionPort,
    CanonicalExecutionPortRequest,
    CanonicalExecutionPortResult,
    GatewayPolicyContext,
} from 'cvf-model-gateway';
import {
    admitProviderAttempt,
    recordProviderCallStart,
    type ProviderAttemptLedger,
    type ProviderAttemptPurpose,
} from './provider-attempt-admission';

export const CANONICAL_WEB_GATEWAY_EXECUTION_VERSION = 'cvf.canonicalWebGatewayExecution.csccR1T2.v1' as const;

// CSCC-R1-T2: non-vision text selects exactly ONE of {direct executeAI,
// this canonical port-backed adapter} per route build (frozen T1
// Compatibility/Rollback Matrix); never both. Direct remains the sole
// active path until an independently accepted successor wires a
// production ProviderExecutionBridge into route.ts; this module is fully
// implemented/tested but available-but-not-yet-default rollback-safe
// surface. Not env-driven, so no runtime misconfig can dual-activate either.
export const NON_VISION_EXECUTION_PATH_SELECTION: 'direct' | 'port' = 'direct';

/** Runtime-checked invariant: refuses to silently drift from the selection above. */
export function assertNonVisionExecutionPathIsDirect(): void {
    if ((NON_VISION_EXECUTION_PATH_SELECTION as string) !== 'direct') {
        throw new Error('NON_VISION_EXECUTION_PATH_SELECTION changed without wiring the port call sites.');
    }
}

/**
 * CSCC-R1-T2 rework (Finding 4): `Sot3ActivationEvidenceRecord.canonicalExecutionId`
 * must only be populated for a request that actually continues through the
 * canonical port -- never unconditionally stamped from the Web envelope
 * regardless of which execution path is taken. Returns a spreadable arg
 * object so the route's `resolveKnowledgeContext` call site stays a
 * single-line conditional rather than duplicating the selection check.
 */
export function sot3CanonicalExecutionIdFanoutArg(envelopeId: string): { canonicalExecutionId?: string } {
    return NON_VISION_EXECUTION_PATH_SELECTION === 'port' ? { canonicalExecutionId: envelopeId } : {};
}

export interface CanonicalWebGatewayExecutionParams {
    canonicalExecutionId: string;
    prompt: string;
    systemPrompt?: string;
    policy: GatewayPolicyContext;
    preferredProviderId?: string;
    routing?: CanonicalExecutionPortRequest['routing'];
    metadata?: Record<string, unknown>;
    signal?: AbortSignal;
    /** The ledger this execution's admission/call-start accounting mutates. */
    ledger: ProviderAttemptLedger;
    purpose: ProviderAttemptPurpose;
}

/**
 * Builds the mandatory Web attempt-boundary callback for exactly one
 * candidate provider call (initial or retry) against one ledger. Every call
 * to the returned callback awaits only `admitProviderAttempt`; on an allowed
 * outcome it then performs the synchronous `recordProviderCallStart` call
 * and returns immediately, with no other await or branch in between - the
 * canonical implementation the frozen contract requires.
 */
export function buildCanonicalWebAttemptBoundary(
    ledger: ProviderAttemptLedger,
    purpose: ProviderAttemptPurpose,
): (input: CanonicalExecutionAttemptBoundaryInput) => Promise<CanonicalExecutionAttemptBoundaryOutcome> {
    return async (_input: CanonicalExecutionAttemptBoundaryInput): Promise<CanonicalExecutionAttemptBoundaryOutcome> => {
        const admission = await admitProviderAttempt(ledger, purpose);
        if (!admission.admitted) {
            return {
                decision: 'deny',
                attemptIndex: admission.attemptIndex,
                reason: 'provider_attempt_quota_exhausted',
                retryAfterSeconds: admission.retryAfterSeconds,
            };
        }
        recordProviderCallStart(ledger, admission.attemptIndex);
        return { decision: 'allow', attemptIndex: admission.attemptIndex };
    };
}

/**
 * Web-owned canonical execution composition. Constructs exactly one
 * `CanonicalExecutionPortRequest` per call and delegates to the injected
 * Gateway `CanonicalExecutionPort`, always supplying the mandatory
 * attempt-boundary callback built above. Never calls `admitProviderAttempt`
 * or `recordProviderCallStart` anywhere except inside that callback.
 */
export class CanonicalWebGatewayExecutor {
    constructor(private readonly port: CanonicalExecutionPort) {}

    async execute(params: CanonicalWebGatewayExecutionParams): Promise<CanonicalExecutionPortResult> {
        const attemptBoundary = buildCanonicalWebAttemptBoundary(params.ledger, params.purpose);
        const request: CanonicalExecutionPortRequest = {
            canonicalExecutionId: params.canonicalExecutionId,
            prompt: params.prompt,
            systemPrompt: params.systemPrompt,
            policy: params.policy,
            preferredProviderId: params.preferredProviderId,
            routing: params.routing,
            metadata: params.metadata,
            attemptBoundary,
            signal: params.signal,
        };
        return this.port.execute(request);
    }
}

/**
 * Constructs a `CanonicalWebGatewayExecutor` bound to a concrete
 * `ProviderExecutionBridge`. Kept as a thin factory so route/composition
 * code and tests can supply their own bridge (with test-double adapters,
 * routing, credential, health, and quota owners) without this module ever
 * importing a concrete provider adapter or making a live call itself.
 */
export function createCanonicalWebGatewayExecutor(bridge: ProviderExecutionBridge): CanonicalWebGatewayExecutor {
    return new CanonicalWebGatewayExecutor(new CanonicalExecutionAdapter(bridge));
}
