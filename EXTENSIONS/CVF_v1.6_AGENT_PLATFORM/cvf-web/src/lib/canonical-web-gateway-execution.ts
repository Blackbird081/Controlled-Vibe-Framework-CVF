import { prepareClaudeSubscription, isClaudeSubscriptionMode, resolveClaudeSubscriptionModel } from './server/claude-cli-profile';
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
 * (`assertNonVisionExecutionPathIsDirect`); the candidate physically wires
 * the port and the direct-only assertion fails closed in this revision.
 */
import { CanonicalExecutionAdapter, ProviderExecutionBridge, ProviderRegistry, QuotaLedger, ProviderHealthMonitor, RoutingPolicyEngine, GatewayReceiptBuilder, CredentialBoundary, createClaudeCliExecutionAdapter, probeClaudeCliSubscription, createAlibabaExecutionAdapter, createOpenAiExecutionAdapter } from 'cvf-model-gateway';
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
    retainJevAttemptReservation,
    recordProviderCallStart,
    type ProviderAttemptLedger,
    type ProviderAttemptPurpose,
} from './provider-attempt-admission';
import { ALIBABA_API_KEY_ENV_NAMES, resolveAlibabaRuntimeEnv } from './alibaba-env';
import { OPENAI_API_KEY_ENV_NAMES } from './openai-env';
import { GOVERNED_ROUTE_DEFAULT_MODEL, GOVERNED_ROUTE_OPENAI_MODELS } from './governed-route-providers';
import { composeProviderRequestSignal } from './provider-request-cancellation';
import { CVF_SYSTEM_PROMPT } from './ai/types';
import { buildGatewayExecutionDiagnostic } from './execution-diagnostics';
import type { ExecutionRequest, ExecutionResponse } from './ai/types';

export const CANONICAL_WEB_GATEWAY_EXECUTION_VERSION = 'cvf.canonicalWebGatewayExecution.csccR1T2.v1' as const;

// This candidate revision selects the port. The direct assertion remains a
// fail-closed check for callers that still expect the direct-only revision.
export const NON_VISION_EXECUTION_PATH_SELECTION: 'direct' | 'port' = 'port';

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
    return async (): Promise<CanonicalExecutionAttemptBoundaryOutcome> => {
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



export const CANONICAL_WEB_PROFILE_DENIED_MESSAGE = 'This route supports Alibaba, OpenAI and Claude subscription text requests only.' as const;

/**
 * Candidate profile is checked before any HTML or vision preparation. OpenAI is admitted by provider id only; a missing
 * server key is reported by the route's "API key not configured" 400 response, never by silently routing elsewhere.
 */
export function canonicalWebProfileDenied(body: Partial<ExecutionRequest>, defaultProvider: string | undefined): boolean {
    const raw = body as Record<string, unknown>;
    const provider = body.provider || defaultProvider || 'openai';
    return !(provider === 'alibaba' || provider === 'openai' || (provider === 'claude' && isClaudeSubscriptionMode())) || Boolean(body.htmlPilotIntent) || body.templateId === 'web_build_handoff'
        || Boolean(body.imageUrl || body.imageBase64 || body.mimeType || raw.vision);
}

/**
 * The canonical Web route always runs Alibaba in free-quota-only mode, so its default must be a model in the free-quota
 * ledger. The general Alibaba default (qwen-flash) is not, and every UI run without an explicit model was quota-locked.
 */
export const CANONICAL_WEB_DEFAULT_MODEL = 'qwen-plus-character' as const;

/** Build the existing Gateway owners for one Alibaba text route, with no alternate provider. */
export function createAlibabaCanonicalWebExecutor(options: {
    model?: string;
    maxTokens?: number;
    env?: Record<string, string | undefined>;
    adapter?: import('cvf-model-gateway').ProviderExecutionAdapter;
}): CanonicalWebGatewayExecutor {
    const readEnv = () => options.env ?? resolveAlibabaRuntimeEnv();
    const env: Record<string, string | undefined> = { ...readEnv(), CVF_ALIBABA_FREE_QUOTA_ONLY: '1' };
    const credential = new CredentialBoundary(env);
    const reference = { providerId: 'alibaba', keyId: 'web-alibaba', envNames: [...ALIBABA_API_KEY_ENV_NAMES] };
    const model = options.model || CANONICAL_WEB_DEFAULT_MODEL;
    const registry = new ProviderRegistry([{ id: 'alibaba', displayName: 'Alibaba', status: 'enabled', riskClass: 'low', models: [{ id: model, riskClass: 'low' }] }]);
    const quota = new QuotaLedger();
    const health = new ProviderHealthMonitor();
    const configuredAdapter = options.adapter ?? createAlibabaExecutionAdapter({ credential, credentialRef: reference, env, maxTokens: options.maxTokens, composeRequestSignal: composeProviderRequestSignal });
    const adapter: import('cvf-model-gateway').ProviderExecutionAdapter = {
        providerId: 'alibaba',
        execute(input) {
            // Refresh the same boundary object at invocation, including removals; never expose secret values.
            const latest = { ...readEnv(), CVF_ALIBABA_FREE_QUOTA_ONLY: '1' };
            for (const key of Object.keys(env)) delete env[key];
            Object.assign(env, latest);
            return configuredAdapter.execute(input);
        },
    };
    const bridge = new ProviderExecutionBridge({
        routing: new RoutingPolicyEngine(registry, health, quota), credential, health, quota,
        receipt: new GatewayReceiptBuilder(), credentialRefs: new Map([['alibaba', reference]]), adapters: new Map([['alibaba', adapter]]),
    });
    return createCanonicalWebGatewayExecutor(bridge);
}

/** Default model for the OpenAI canonical route; matches DEFAULT_MODELS.openai. */
export const CANONICAL_WEB_OPENAI_DEFAULT_MODEL = GOVERNED_ROUTE_DEFAULT_MODEL;

/**
 * Settings offers models with a non-reasoning text request, including Luna and Terra with reasoning disabled.
 * The server may explicitly extend the list via CVF_OPENAI_ALLOWED_MODELS.
 */
export const CANONICAL_WEB_OPENAI_ALLOWED_MODELS = GOVERNED_ROUTE_OPENAI_MODELS;
const OPENAI_MODEL_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/;
export function isOpenAiModelAllowed(model: string, env: Record<string, string | undefined> = process.env): boolean {
    if ((CANONICAL_WEB_OPENAI_ALLOWED_MODELS as readonly string[]).includes(model)) return true;
    const extra = (env.CVF_OPENAI_ALLOWED_MODELS ?? '').split(',').map(entry => entry.trim()).filter(entry => OPENAI_MODEL_ID_RE.test(entry));
    return extra.includes(model);
}

/**
 * Build the existing Gateway owners for one OpenAI text route, with no alternate provider. The endpoint is fixed to the
 * Gateway-admitted OpenAI host (OPENAI_BASE_URL may only re-point within it); usage comes from the provider response only.
 */
export function createOpenAiCanonicalWebExecutor(options: {
    model?: string;
    maxTokens?: number;
    env?: Record<string, string | undefined>;
    adapter?: import('cvf-model-gateway').ProviderExecutionAdapter;
}): CanonicalWebGatewayExecutor {
    const readEnv = () => options.env ?? {
        ...Object.fromEntries(OPENAI_API_KEY_ENV_NAMES.map(name => [name, process.env[name]])),
        OPENAI_BASE_URL: process.env.OPENAI_BASE_URL, CVF_AI_PROVIDER_TIMEOUT_MS: process.env.CVF_AI_PROVIDER_TIMEOUT_MS,
    };
    const env: Record<string, string | undefined> = { ...readEnv() };
    const credential = new CredentialBoundary(env);
    const reference = { providerId: 'openai', keyId: 'web-openai', envNames: [...OPENAI_API_KEY_ENV_NAMES] };
    const model = options.model || CANONICAL_WEB_OPENAI_DEFAULT_MODEL;
    const registry = new ProviderRegistry([{ id: 'openai', displayName: 'OpenAI', status: 'enabled', riskClass: 'low', models: [{ id: model, riskClass: 'low' }] }]);
    const quota = new QuotaLedger();
    const health = new ProviderHealthMonitor();
    const configuredAdapter = options.adapter ?? createOpenAiExecutionAdapter({ credential, credentialRef: reference, env, maxTokens: options.maxTokens, composeRequestSignal: composeProviderRequestSignal });
    const adapter: import('cvf-model-gateway').ProviderExecutionAdapter = {
        providerId: 'openai',
        execute(input) {
            // Refresh the same boundary object at invocation, including removals; never expose secret values.
            const latest = { ...readEnv() };
            for (const key of Object.keys(env)) delete env[key];
            Object.assign(env, latest);
            return configuredAdapter.execute(input);
        },
    };
    const bridge = new ProviderExecutionBridge({
        routing: new RoutingPolicyEngine(registry, health, quota), credential, health, quota,
        receipt: new GatewayReceiptBuilder(), credentialRefs: new Map([['openai', reference]]), adapters: new Map([['openai', adapter]]),
    });
    return createCanonicalWebGatewayExecutor(bridge);
}

/** Preserve unknown provider usage and safe Gateway lineage on each terminal result. */
export function canonicalWebExecutionResponse(result: CanonicalExecutionPortResult, fallbackModel: string, startedAt: number, provider: ExecutionResponse['provider'] = 'alibaba'): ExecutionResponse {
    const actual = result.response?.providerUsage ?? result.error?.providerDiagnostic?.usage;
    return {
        success: Boolean(result.response),
        ...(result.response ? { output: result.response.text } : { error: result.error?.message ?? 'Provider execution did not complete.' }),
        provider, model: result.response?.model?.modelId ?? fallbackModel,
        executionTime: Math.max(0, Date.now() - startedAt),
        usage: actual,
        // Classify from the Gateway's closed provider code + HTTP status (and its retryable verdict), not from free text.
        ...(!result.response && result.error ? { diagnostic: buildGatewayExecutionDiagnostic({
            provider, model: fallbackModel, error: result.error, latencyMs: Math.max(0, Date.now() - startedAt),
        }) } : {}),
        canonicalGateway: {
            canonicalExecutionId: result.canonicalExecutionId,
            executionSurface: result.response?.executionSurface ?? result.error?.providerDiagnostic?.executionSurface,
            observedModelId: result.response?.observedModelId,
            nativeProcessState: result.response?.nativeProcessState ?? result.error?.providerDiagnostic?.nativeProcessState,
            receipt: result.receipt,
            materialContextManifest: result.materialContextManifest,
            materialContextManifestDisposition: result.materialContextManifestDisposition,
            attemptOutcome: result.attemptOutcome,
            providerDiagnostic: result.error?.providerDiagnostic,
            actualUsage: actual,
            usageProvenance: actual ? 'provider_reported_partial_or_complete' : 'unknown',
        },
    };
}

export function canonicalWebSystemPrompt(prompt?: string): string {
    return prompt ?? CVF_SYSTEM_PROMPT;
}

/** Jev composition remains separately exported and independent of the selected Web route. */
export interface JevCanonicalProfile {
    canonicalExecutionId: string;
    stageId: 'wide' | 'narrow';
    connection?: 'typesafe'|'openrouter-systemone';
    ledger: ProviderAttemptLedger;
    admission: import('cvf-model-gateway').AdapterAdmissionRecord | undefined;
    signal?: AbortSignal;
    verifyAndCommitStart: (input: CanonicalExecutionAttemptBoundaryInput, attemptIndex: number) => void;
    onRetainedReservation: (reason: string, attemptIndex: number) => void;
}
export function assertJevAdmission(record: import('cvf-model-gateway').AdapterAdmissionRecord | undefined, connection:'typesafe'|'openrouter-systemone'='typesafe'): void {
    const provider=connection==='typesafe'?'typesafe':'openrouter';const model=connection==='typesafe'?'jev-latest':'typesafe/jev-1.14';
    if (!record || record.status !== 'admitted' || record.providerId !== provider || record.modelId !== model
        || record.requestedMethod !== 'system_one' || record.normalizedMethod !== 'system_one'
        || !record.supportedMethods.includes('system_one') || record.liveExecutionAuthorized !== false
        || record.conformanceStatus === 'blocked') throw new Error('JEV_ADMISSION_REFUSED');
}
export function buildJevCanonicalAttemptBoundary(profile: JevCanonicalProfile) {
    return async (input: CanonicalExecutionAttemptBoundaryInput): Promise<CanonicalExecutionAttemptBoundaryOutcome> => {
        try {
            assertJevAdmission(profile.admission,profile.connection);
            if (profile.signal?.aborted || input.providerId !== (profile.connection==='openrouter-systemone'?'openrouter':'typesafe') || input.modelId !== (profile.connection==='openrouter-systemone'?'typesafe/jev-1.14':'jev-latest')
                || input.canonicalExecutionId !== profile.canonicalExecutionId || input.traceId !== profile.canonicalExecutionId
                || profile.ledger.attempts.length !== (profile.stageId === 'wide' ? 0 : 1)
                || (profile.stageId === 'narrow' && profile.ledger.providerCallCount !== 1)) throw new Error('JEV_TUPLE_REFUSED');
        } catch { return { decision:'deny',attemptIndex:profile.ledger.attempts.length,reason:'jev_pre_admission_refused' }; }
        const admission = await admitProviderAttempt(profile.ledger, profile.stageId === 'wide' ? 'initial' : 'continuation');
        if (!admission.admitted) return {decision:'deny',attemptIndex:admission.attemptIndex,reason:'provider_attempt_quota_exhausted',retryAfterSeconds:admission.retryAfterSeconds};
        try {
            assertJevAdmission(profile.admission,profile.connection);
            if(profile.signal?.aborted)throw new Error('CANCELLED');
            profile.verifyAndCommitStart(input,admission.attemptIndex);
        } catch {
            retainJevAttemptReservation(profile.ledger,admission.attemptIndex);
            try { profile.onRetainedReservation('RESERVATION_RETAINED_NO_INVOCATION',admission.attemptIndex); } catch { /* persisted uncertainty is never resumed */ }
            return {decision:'deny',attemptIndex:admission.attemptIndex,reason:'RESERVATION_RETAINED_NO_INVOCATION'};
        }
        recordProviderCallStart(profile.ledger,admission.attemptIndex);
        return {decision:'allow',attemptIndex:admission.attemptIndex};
    };
}

export async function executeJevCanonicalStage(port: CanonicalExecutionPort, profile:JevCanonicalProfile, prompt:string):Promise<CanonicalExecutionPortResult> {
    assertJevAdmission(profile.admission,profile.connection);
    const provider=profile.connection==='openrouter-systemone'?'openrouter':'typesafe';const model=profile.connection==='openrouter-systemone'?'typesafe/jev-1.14':'jev-latest';
    const request:CanonicalExecutionPortRequest = {
        canonicalExecutionId:profile.canonicalExecutionId,prompt,
        policy:{traceId:profile.canonicalExecutionId,policyResult:'allow',reason:'verified_jev_action_grant',allowedProviderIds:[provider]},
        preferredProviderId:provider,routing:{requestedModelId:model,requiredCapabilities:['system_one'],executionStage:profile.stageId},
        attemptBoundary:buildJevCanonicalAttemptBoundary(profile),signal:profile.signal,
    };
    return port.execute(request);
}


/** A sole-provider registry makes fallback impossible without changing generic routing. */
export function createJevCanonicalPort(options:{
    adapter:import('cvf-model-gateway').ProviderExecutionAdapter;
    credential:import('cvf-model-gateway').CredentialBoundary;
    reference:import('cvf-model-gateway').CredentialReference;
    admission:import('cvf-model-gateway').AdapterAdmissionRecord;
    connection?:'typesafe'|'openrouter-systemone';
}):CanonicalExecutionPort {
    assertJevAdmission(options.admission,options.connection);
    const provider=options.connection==='openrouter-systemone'?'openrouter':'typesafe';const model=options.connection==='openrouter-systemone'?'typesafe/jev-1.14':'jev-latest';const env=options.connection==='openrouter-systemone'?'OPENROUTER_API_KEY':'TYPESAFE_API_KEY';
    if(options.reference.providerId!==provider||options.reference.envNames.join(',')!==env||options.adapter.providerId!==provider)throw new Error('JEV_CREDENTIAL_REFUSED');
    const registry=new ProviderRegistry([{id:provider,displayName:'Jev',status:'enabled',riskClass:'low',models:[{id:model,riskClass:'low'}]}]);
    const quota=new QuotaLedger();quota.setLimit(provider,model,{requestsPerDay:2});
    const health=new ProviderHealthMonitor();
    return new CanonicalExecutionAdapter(new ProviderExecutionBridge({routing:new RoutingPolicyEngine(registry,health,quota),credential:options.credential,health,quota,
        receipt:new GatewayReceiptBuilder(),credentialRefs:new Map([[provider,options.reference]]),adapters:new Map([[provider,options.adapter]]),admissionRecords:new Map([[provider,options.admission]])}));
}

/** The native subscription lane has one provider and one shared absolute deadline. */
export async function createClaudeSubscriptionCanonicalWebExecutor(options: { model?: string; signal?: AbortSignal } = {}): Promise<CanonicalWebGatewayExecutor> {
    const model = resolveClaudeSubscriptionModel(options.model);
    const native = await prepareClaudeSubscription(options.signal);
    const registry = new ProviderRegistry([{ id: 'claude', displayName: 'Claude subscription', status: 'enabled', riskClass: 'low', models: [{ id: model, riskClass: 'low' }] }]);
    const quota = new QuotaLedger(); const health = new ProviderHealthMonitor();
    const reference = { source: 'native_subscription' as const, providerId: 'claude' as const };
    return createCanonicalWebGatewayExecutor(new ProviderExecutionBridge({
        routing: new RoutingPolicyEngine(registry, health, quota), credential: new CredentialBoundary({}), health, quota,
        receipt: new GatewayReceiptBuilder(), credentialRefs: new Map([['claude', reference]]),
        nativeSubscriptionResolver: async (_reference, request) => {
            const status = await probeClaudeCliSubscription({ ...native, signal: request.signal, timeoutMs: request.timeoutMs });
            return { source: 'native_subscription', providerId: 'claude', available: status.state === 'available' && performance.now() < native.deadlineMonotonicMs!, executionSurface: 'claude_cli_subscription' };
        }, adapters: new Map([['claude', createClaudeCliExecutionAdapter(native)]]),
    }));
}
