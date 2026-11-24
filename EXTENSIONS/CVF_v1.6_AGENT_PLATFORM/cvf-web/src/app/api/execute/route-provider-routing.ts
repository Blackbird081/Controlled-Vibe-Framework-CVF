/**
 * Provider-routing gate responses and MAO failure projection for `/api/execute`.
 * Extracted from route.ts (governed file-size budget) with unchanged behaviour, apart from the explicitly documented
 * `ROUTED_PROVIDER_MISMATCH` code and the provider-neutral MAO failure wording.
 */
import { NextResponse } from 'next/server';
import type { AIProvider, MaoRolePlanEvidence, MaoRolePlanPartialOutput } from '@/lib/ai/types';
import type { WebProviderRoutingResult } from '@/lib/ai/provider-router-adapter';
import type { evaluateEnforcement } from '@/lib/enforcement';
import type { GuardPipelineResult } from '@/lib/guard-runtime-adapter';
import { buildExecutionDiagnostic, buildGatewayExecutionDiagnostic } from '@/lib/execution-diagnostics';
import { CANONICAL_WEB_OPENAI_DEFAULT_MODEL, CANONICAL_WEB_PROFILE_DENIED_MESSAGE, isOpenAiModelAllowed } from '@/lib/canonical-web-gateway-execution';
import { buildEvidenceReceipt, type buildGovernanceEnvelope } from '@/lib/web-governance-envelope';
import type { MaoWebOutcome } from '@/lib/server/mao-canonical-single-worker';
import { serverProviderKeyHelp } from '@/lib/non-coder-language';

type Enforcement = ReturnType<typeof evaluateEnforcement>;
type Envelope = ReturnType<typeof buildGovernanceEnvelope>;

interface RoutingGateInput {
    routingResult: WebProviderRoutingResult;
    provider: AIProvider;
    enforcement: Enforcement;
    guardResult: GuardPipelineResult;
    govEnvelope: Envelope;
}

/** DENY (403), ESCALATE (409) and unresolved (500) routing outcomes; null when a provider was selected. */
export function routingGateResponse({ routingResult, provider, enforcement, guardResult, govEnvelope }: RoutingGateInput): NextResponse | null {
    const providerRouting = { decision: routingResult.decision, rationale: routingResult.rationale };
    const receipt = (model: string) => buildEvidenceReceipt({
        envelope: govEnvelope, decision: enforcement.status, riskLevel: enforcement.riskGate?.riskLevel,
        provider, model, routingDecision: routingResult.decision,
    });
    if (routingResult.decision === 'DENY') {
        return NextResponse.json({
            success: false, error: routingResult.deniedReason || 'Provider denied by governance routing policy.', provider, model: 'router-denied',
            enforcement, guardResult, providerRouting, governanceEnvelope: govEnvelope, policySnapshotId: govEnvelope.policySnapshotId,
            governanceEvidenceReceipt: receipt('router-denied'),
            diagnostic: buildExecutionDiagnostic({ stage: 'routing', class: 'routing_denied', provider, model: 'router-denied', httpStatus: 403 }),
        }, { status: 403 });
    }
    if (routingResult.decision === 'ESCALATE') {
        return NextResponse.json({
            success: false, error: 'Provider selection requires explicit approval.', provider, model: 'router-escalated',
            enforcement, guardResult, providerRouting, governanceEnvelope: govEnvelope, policySnapshotId: govEnvelope.policySnapshotId,
            governanceEvidenceReceipt: receipt('router-escalated'),
        }, { status: 409 });
    }
    if (!routingResult.selectedProvider) {
        return NextResponse.json({
            success: false, error: 'Provider routing failed to resolve an executable provider.', provider, model: 'router-error',
            enforcement, guardResult, providerRouting,
        }, { status: 500 });
    }
    return null;
}

/**
 * Strict: the routed provider must be the requested canonical provider (or `claude` in subscription mode); the router
 * may never substitute another one. Returns a distinct, non-secret code with the unchanged 403.
 */
export function routedProviderMismatchResponse(nativeClaude: boolean, routedProvider: AIProvider, requested: AIProvider): NextResponse | null {
    const allowed = nativeClaude ? routedProvider === 'claude'
        : routedProvider === requested && (routedProvider === 'alibaba' || routedProvider === 'openai');
    return allowed ? null : NextResponse.json({ success: false, code: 'ROUTED_PROVIDER_MISMATCH', error: CANONICAL_WEB_PROFILE_DENIED_MESSAGE }, { status: 403 });
}

/**
 * Cheap, side-effect-free checks that run right after provider routing and before knowledge/SOT3/memory resolution,
 * lineage reservation or any provider call: a keyless request (400) and a model the server key may not be billed for
 * (400 `MODEL_NOT_ALLOWED`). Returns null when the request may proceed.
 */
export function routedProviderPreflightResponse(input: {
    nativeClaude: boolean; routedProvider: AIProvider; apiKey: string | undefined; requestedModel: string | undefined;
    enforcement: Enforcement; govEnvelope: Envelope; routingDecision: string;
}): NextResponse | null {
    const { nativeClaude, routedProvider, apiKey, requestedModel, enforcement, govEnvelope, routingDecision } = input;
    const refuse = (model: string, error: string, status: number, code?: string) => NextResponse.json({
        success: false, ...(code ? { code } : {}), error, provider: routedProvider, model, governanceEnvelope: govEnvelope, policySnapshotId: govEnvelope.policySnapshotId,
        governanceEvidenceReceipt: buildEvidenceReceipt({ envelope: govEnvelope, decision: enforcement.status, riskLevel: enforcement.riskGate?.riskLevel, provider: routedProvider, model, routingDecision }),
    }, { status });
    if (!nativeClaude && !apiKey) return refuse('not configured', `API key not configured for provider: ${routedProvider}. ${serverProviderKeyHelp(routedProvider, 'en')}`, 400);
    if (routedProvider === 'openai' && !nativeClaude && !isOpenAiModelAllowed(requestedModel ?? CANONICAL_WEB_OPENAI_DEFAULT_MODEL)) {
        return refuse('model-not-allowed', 'The requested OpenAI model is not enabled for this governed route.', 400, 'MODEL_NOT_ALLOWED');
    }
    return null;
}

/** Role-plan failure evidence read from a failed plan (`rolePlanFailureEvidence`): partial evidence and an unreviewed partial output. */
export interface RolePlanFailureEvidence { readonly rolePlan?: MaoRolePlanEvidence; readonly partialOutput?: MaoRolePlanPartialOutput }

/**
 * Adds the role-plan failure evidence (`maoRolePlan`, and `partialOutput` when a settled step left screened output) to the JSON
 * body of a failure response, keeping its status and headers. A body that is not a JSON object, or empty evidence, returns the
 * response unchanged.
 */
export async function withRolePlanFailureEvidence(response: Response, failed: RolePlanFailureEvidence): Promise<Response> {
    if (!failed.rolePlan && !failed.partialOutput) return response;
    let data: unknown;
    try { data = await response.clone().json(); } catch { return response; }
    if (!data || typeof data !== 'object' || Array.isArray(data)) return response;
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    return NextResponse.json({
        ...(data as Record<string, unknown>),
        ...(failed.rolePlan ? { maoRolePlan: failed.rolePlan } : {}),
        ...(failed.partialOutput ? { partialOutput: failed.partialOutput } : {}),
    }, { status: response.status, headers });
}

/** Projects a failed MAO outcome; native-subscription wording and diagnostics apply only to the Claude lane. A role-plan failure passes its evidence explicitly. */
export async function maoFailureResponse(input: {
    mao: Extract<MaoWebOutcome, { ok: false }>; nativeClaude: boolean; routedProvider: AIProvider; model: string; canonicalId: string; evidence?: RolePlanFailureEvidence;
}): Promise<Response> {
    return withRolePlanFailureEvidence(projectMaoFailure(input), input.evidence ?? {});
}

function projectMaoFailure(input: {
    mao: Extract<MaoWebOutcome, { ok: false }>; nativeClaude: boolean; routedProvider: AIProvider; model: string; canonicalId: string;
}): Response {
    const { mao, nativeClaude, routedProvider, model, canonicalId } = input;
    if (mao.response) return mao.response;
    const gateway = mao.safeGatewayFailure;
    if (gateway && !nativeClaude && gateway.providerId === routedProvider) {
        // Closed provider failure code: same class/cause as the non-MAO path, but the outcome stays UNKNOWN (the provider may have
        // processed or billed the call), so a diagnostic the non-MAO path marks retryable is forced to the no-retry pair.
        const classified = buildGatewayExecutionDiagnostic({ provider: routedProvider, model, error: {
            errorClass: gateway.errorClass, retryable: gateway.retryable,
            providerDiagnostic: { code: gateway.providerDiagnostic.code, httpStatus: gateway.providerDiagnostic.httpStatus },
        } });
        const diagnostic = classified.retryable ? { ...classified, retryable: false, userAction: 'do_not_retry_without_new_evidence' as const } : classified;
        return NextResponse.json({
            success: false, code: mao.reason, error: diagnostic.safeMessage, provider: routedProvider, diagnostic,
            ...(gateway.providerDiagnostic.usage ? { usage: gateway.providerDiagnostic.usage } : {}),
            canonicalId, automaticRetryAllowed: false,
        }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
    const safe = mao.safeProviderDiagnostic;
    const classes = { quota_locked: 'quota_exceeded', credential_unavailable: 'invalid_api_key', provider_timeout: 'provider_timeout', request_cancelled: 'request_cancelled', output_incomplete: 'provider_parse_error', provider_http_error: 'provider_http_error', network_error: 'network_error', destination_denied: 'policy_blocked', invalid_identity: 'policy_blocked', unknown_error: 'unknown_error' } as const;
    const subject = nativeClaude ? 'Native subscription' : 'Provider';
    const safeMessage = safe?.code === 'quota_locked' ? `${subject} quota blocked this request. Inspect the recorded attempt before another run.`
        : safe?.code === 'credential_unavailable' ? `${subject} authentication is unavailable. Inspect ${nativeClaude ? 'native sign-in' : 'the provider key'} and the recorded attempt before another run.`
        : `${subject} execution is unconfirmed. Inspect the recorded attempt before another run.`;
    const diagnostic = safe ? { ...buildExecutionDiagnostic({ stage: 'provider', class: classes[safe.code], provider: routedProvider, model,
        retryable: false, userAction: 'do_not_retry_without_new_evidence', safeMessage }), executionSurface: safe.executionSurface, nativeProcessState: safe.nativeProcessState } : undefined;
    return NextResponse.json({
        success: false, code: mao.reason, error: diagnostic?.safeMessage ?? 'MAO execution is unavailable or unconfirmed. Do not resend automatically.',
        provider: routedProvider,
        ...(safe ? { diagnostic, executionSurface: safe.executionSurface, nativeProcessState: safe.nativeProcessState } : {}),
        canonicalId, automaticRetryAllowed: false,
    }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
}
