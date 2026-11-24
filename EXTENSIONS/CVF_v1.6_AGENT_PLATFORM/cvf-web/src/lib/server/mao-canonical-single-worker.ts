import { createHash } from 'node:crypto';
import { isAbsolute } from 'node:path';
import { composeOrchestrationPlan } from 'cvf-control-plane-foundation';
import type { CanonicalExecutionPortResult } from 'cvf-model-gateway';
import { MaoFileRunStore } from '../../../../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/durable.run.store';
import { MaoOperationalWorkerLauncher } from '../../../../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/operational.worker.launcher';
import { MaoLifecycleController, createRealClock } from '../../../../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/lifecycle.controller.contract';
import { createMaoInvocationIdentity, validateMaoInvocationRequest, type MaoInvocationRequest } from '../../../../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/delegation.adapter.contract';
import type { MaoRiskLevel } from '../../../../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/task.graph.contract';
import type { CanonicalGatewayEvidence, MaoExecutionEvidence } from '@/lib/ai/types';
import { highestRisk, parseRiskLevel, type RiskLevel } from '../risk-check';
import { recordDeniedNoCallTerminal } from './mao-canonical-terminal-event';

export const MAO_SINGLE_WORKER_ENV = 'CVF_WEB_CANONICAL_MAO_SINGLE_WORKER';
const digest = (value: string) => createHash('sha256').update(value).digest('hex');

/** Keep the highest observed risk; missing/invalid authority never becomes R1. */
export function resolveMaoRisk(...values: Array<string | null | undefined>): string | null {
    let highest: RiskLevel | null = null;
    for (const value of values) {
        if (value == null) continue;
        const risk = parseRiskLevel(value);
        if (risk !== value) return null;
        highest = highestRisk(highest, risk);
    }
    return highest;
}

export interface MaoWebReservationOwner {
    readonly canonicalId: string;
    readonly verifiedOwnerHash: string;
    reserveNext(): Promise<{ ordinal: number } | { response: Response }>;
    beforeProviderCall(ordinal: number): Response | null;
}
/** Owner that can also settle a confirmed pre-invoke denial; an owner without it keeps every failure UNKNOWN. */
export interface MaoSingleWorkerOwner extends MaoWebReservationOwner {
    settleNext?(ordinal: number, evidence: CanonicalGatewayEvidence | undefined, callbackAttemptIndex: number | null): Promise<Response | null>;
}
/** A gateway payload is a denied attempt only when it is the gateway's own pre-invoke denial joined to this canonical id. */
export function isDeniedGatewayPayload(payload: CanonicalExecutionPortResult, canonicalId: string): boolean {
    return payload.attemptOutcome === 'denied' && !payload.response
        && payload.canonicalExecutionId === canonicalId
        && payload.error?.errorClass === 'admission_blocked' && payload.error.traceId === canonicalId
        && payload.materialContextManifestDisposition === 'not_built_precondition_stopped'
        && payload.receipt?.canonicalExecutionId === canonicalId && payload.receipt.traceId === canonicalId && Boolean(payload.receipt.receiptId);
}
export interface MaoSafeProviderDiagnostic {
    code: 'request_cancelled' | 'provider_timeout' | 'provider_http_error' | 'output_incomplete' | 'quota_locked' | 'credential_unavailable' | 'destination_denied' | 'invalid_identity' | 'network_error' | 'unknown_error';
    executionSurface: 'claude_cli_subscription';
    nativeProcessState: 'not_started' | 'started' | 'unknown';
}
/**
 * Closed Gateway failure facts for the API-key lanes (OpenAI/Alibaba): only closed enums and numbers, never raw
 * provider text, message, credential fingerprint or any secret.
 */
export interface MaoSafeGatewayFailure {
    providerId: 'openai' | 'alibaba';
    errorClass: 'policy_denied' | 'no_candidate' | 'quota_exceeded' | 'provider_unavailable' | 'invalid_request' | 'credential_shielded' | 'internal_error' | 'admission_blocked';
    retryable: boolean;
    providerDiagnostic: {
        code: 'request_cancelled' | 'provider_timeout' | 'provider_http_error' | 'output_incomplete' | 'quota_locked' | 'credential_unavailable' | 'destination_denied' | 'invalid_identity';
        httpStatus?: number;
        usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
    };
}
export type MaoWebOutcome =
    | { ok: true; payload: CanonicalExecutionPortResult; reference: MaoExecutionEvidence; ordinal: 1 }
    | { ok: false; reason: string; response?: Response; safeProviderDiagnostic?: MaoSafeProviderDiagnostic; safeGatewayFailure?: MaoSafeGatewayFailure;
        /** Only on MAO_ATTEMPT_DENIED: the settled no-call gateway evidence and the ledger-verified retry-after. */
        evidence?: CanonicalGatewayEvidence; retryAfterSeconds?: number };

const GATEWAY_ERROR_CLASSES = ['policy_denied', 'no_candidate', 'quota_exceeded', 'provider_unavailable', 'invalid_request', 'credential_shielded', 'internal_error', 'admission_blocked'];
/** Closed provider failure codes only (not proof of no spend: timeout/cancel may still have been processed); `network_error` / `unknown_error` mean uncertain provider contact, so they never earn a typed diagnostic. */
const GATEWAY_CLOSED_FAILURE_CODES = ['request_cancelled', 'provider_timeout', 'provider_http_error', 'output_incomplete', 'quota_locked', 'credential_unavailable', 'destination_denied', 'invalid_identity'];
const counter = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;

/** Projects a joined, invoked, typed Gateway failure of an API-key lane; anything else returns undefined (stays UNKNOWN). */
function safeGatewayFailureOf(payload: CanonicalExecutionPortResult, canonicalId: string): MaoSafeGatewayFailure | undefined {
    const error = payload.error;
    const manifest = payload.materialContextManifest;
    const providerId = payload.receipt?.providerId;
    if (payload.response || !error || !manifest || (providerId !== 'openai' && providerId !== 'alibaba')) return undefined;
    if (payload.attemptOutcome !== 'invoked' || error.traceId !== canonicalId || payload.materialContextManifestDisposition !== 'attached'
        || manifest.selectedProviderId !== providerId || !/^[a-f0-9]{64}$/.test(manifest.manifestDigest)
        || payload.receipt.metadata?.materialContextManifestDigest !== manifest.manifestDigest) return undefined;
    const diagnostic = error.providerDiagnostic;
    if (!diagnostic || !GATEWAY_CLOSED_FAILURE_CODES.includes(diagnostic.code) || !GATEWAY_ERROR_CLASSES.includes(error.errorClass)) return undefined;
    const status = diagnostic.httpStatus;
    const usage = diagnostic.usage;
    const safeUsage = { inputTokens: counter(usage?.inputTokens), outputTokens: counter(usage?.outputTokens), totalTokens: counter(usage?.totalTokens) };
    const usageEntries = Object.entries(safeUsage).filter(([, count]) => count !== undefined);
    return {
        providerId, errorClass: error.errorClass as MaoSafeGatewayFailure['errorClass'], retryable: error.retryable === true,
        providerDiagnostic: {
            code: diagnostic.code as MaoSafeGatewayFailure['providerDiagnostic']['code'],
            ...(typeof status === 'number' && Number.isInteger(status) && status >= 100 && status <= 599 ? { httpStatus: status } : {}),
            ...(usageEntries.length ? { usage: Object.fromEntries(usageEntries) as MaoSafeGatewayFailure['providerDiagnostic']['usage'] } : {}),
        },
    };
}

/**
 * Cooperative selected caller only: one private closure owns one confirmed Web
 * reservation and one graph creator. This does not repair generic createRun races.
 */
export function createMaoCanonicalSingleWorker(options: {
    owner: MaoSingleWorkerOwner;
    riskLevel: string | null;
    durableRunPath: string | undefined;
    execute: () => Promise<CanonicalExecutionPortResult>;
    signal?: AbortSignal;
    /** Denied-attempt settlement needs ALL of these plus owner.settleNext; without any of them every failure stays MAO_OUTCOME_UNKNOWN. */
    attemptCount?: () => number;
    /** Ledger fact: exactly one new attempt since `since`, not admitted, with its retry-after; otherwise null. */
    deniedAttempt?: (since: number) => { retryAfterSeconds: number } | null;
    toEvidence?: (result: CanonicalExecutionPortResult) => CanonicalGatewayEvidence | undefined;
}) {
    let claimed = false;
    const run = async (): Promise<MaoWebOutcome> => {
        // Synchronous claim before reservation/create/launch awaits, never reset.
        if (claimed) return { ok: false, reason: 'MAO_ALREADY_CLAIMED' };
        claimed = true;
        const { owner, riskLevel, durableRunPath } = options;
        if (!durableRunPath || !isAbsolute(durableRunPath) || durableRunPath.trim() !== durableRunPath
            || !/^[A-Za-z0-9._-]{1,100}$/.test(owner.canonicalId) || !/^[a-f0-9]{64}$/.test(owner.verifiedOwnerHash)) {
            return { ok: false, reason: 'MAO_NOT_READY' };
        }
        if (!riskLevel || !['R0', 'R1', 'R2', 'R3'].includes(riskLevel)) return { ok: false, reason: 'MAO_RISK_DENIED' };
        const binding = digest(JSON.stringify(['web-mao-single-worker-v1', owner.canonicalId, owner.verifiedOwnerHash, 1]));
        const taskId = `web-worker-${binding}`;
        const plan = composeOrchestrationPlan({
            graphInput: {
                authority: {
                    workOrderId: `CVF-WEB-V1-MAO:${binding}`, route: 'SINGLE_AGENT_SINGLE_ROLE', riskLevel: riskLevel as MaoRiskLevel,
                    budget: { maxInvocations: 1, maxConcurrentRoles: 1, maxRevisionDepth: 0, tokenCostCeiling: null, wallClockCeilingMs: 60000 },
                    closerActorId: 'web-local-root', approvalCheckpoints: [],
                },
                tasks: [{ taskId, role: 'worker', riskLevel: riskLevel as MaoRiskLevel, fileScope: [] }],
            }, receiptId: `web-admission-${binding}`,
        });
        if (!plan.graphResult.ok || plan.roleResolution?.decision !== 'SINGLE_WORKER_ADMITTED' || plan.roleResolution.approvalRequired) {
            return { ok: false, reason: 'MAO_RISK_DENIED' };
        }
        const graph = plan.graphResult.graph;
        const request: MaoInvocationRequest = {
            graph, admission: plan.roleResolution, taskId, capability: { role: 'worker', requiredCapabilities: ['canonical_inference'], offeredCapabilities: ['canonical_inference'] },
            inputManifest: [`canonical:${owner.canonicalId}`, `owner:${owner.verifiedOwnerHash}`], idempotencyKey: `web-once-${binding}`, startedAt: new Date().toISOString(),
        };
        if (validateMaoInvocationRequest(request)) return { ok: false, reason: 'MAO_ADMISSION_DENIED' };
        // Only this private caller can consume the successful ordinal-1 reservation.
        const reservation = await owner.reserveNext();
        if ('response' in reservation) return { ok: false, reason: 'WEB_ADMISSION_DENIED', response: reservation.response };
        if (reservation.ordinal !== 1) return { ok: false, reason: 'MAO_ORDINAL_DENIED' };
        let safeProviderDiagnostic: MaoSafeProviderDiagnostic | undefined;
        let safeGatewayFailure: MaoSafeGatewayFailure | undefined;
        let admissionFailure: Response | null = null;
        const { attemptCount, deniedAttempt, toEvidence } = options;
        let attemptsBefore = 0;
        const denial: { payload?: CanonicalExecutionPortResult; retryAfterSeconds?: number } = {};
        const failure = () => safeProviderDiagnostic ? { safeProviderDiagnostic } : safeGatewayFailure ? { safeGatewayFailure } : {};
        try {
            const store = new MaoFileRunStore(durableRunPath);
            const created = await store.createRun(graph);
            if (!created.ok) return { ok: false, reason: 'MAO_RUN_UNAVAILABLE_NO_RESEND' };
            const launcher = new MaoOperationalWorkerLauncher(store, { invoke() { throw new Error('SYNC_PORT_FORBIDDEN'); } }, new MaoLifecycleController({ clock: createRealClock() }));
            const result = await launcher.launchAsync<CanonicalExecutionPortResult>({
                taskGraphId: graph.taskGraphId, taskId, admission: request.admission, capability: request.capability,
                inputManifest: request.inputManifest, launchIdempotencyKey: request.idempotencyKey, timeoutCeilingMs: 60000,
            }, {
                async invoke(invocation) {
                    admissionFailure = owner.beforeProviderCall(reservation.ordinal);
                    if (admissionFailure) throw new Error('WEB_CALL_ADMISSION_REFUSED');
                    attemptsBefore = attemptCount?.() ?? 0;
                    const payload = await options.execute();
                    const joined = payload.canonicalExecutionId === owner.canonicalId
                        && payload.receipt?.canonicalExecutionId === owner.canonicalId && payload.receipt.traceId === owner.canonicalId
                        && Boolean(payload.receipt.receiptId) && payload.materialContextManifest?.canonicalExecutionId === owner.canonicalId
                        && payload.materialContextManifest.traceId === owner.canonicalId;
                    if (joined && payload.error?.traceId === owner.canonicalId && payload.materialContextManifestDisposition === 'attached'
                        && payload.receipt.providerId === 'claude' && payload.materialContextManifest!.selectedProviderId === 'claude'
                        && payload.receipt.selectedModelId === 'sonnet' && payload.materialContextManifest!.selectedModelId === 'sonnet'
                        && /^[a-f0-9]{64}$/.test(payload.materialContextManifest!.manifestDigest)
                        && payload.receipt.metadata?.materialContextManifestDigest === payload.materialContextManifest!.manifestDigest) {
                        const diagnostic = payload.error.providerDiagnostic;
                        const codes = ['request_cancelled', 'provider_timeout', 'provider_http_error', 'output_incomplete', 'quota_locked', 'credential_unavailable', 'destination_denied', 'invalid_identity', 'network_error', 'unknown_error'];
                        if (diagnostic && codes.includes(diagnostic.code) && diagnostic.executionSurface === 'claude_cli_subscription'
                            && ['not_started', 'started', 'unknown'].includes(diagnostic.nativeProcessState ?? '')) {
                            safeProviderDiagnostic = { code: diagnostic.code, executionSurface: 'claude_cli_subscription', nativeProcessState: diagnostic.nativeProcessState! };
                        }
                    }
                    if (joined && !safeProviderDiagnostic) safeGatewayFailure = safeGatewayFailureOf(payload, owner.canonicalId);
                    // A pre-invoke denial never reached the provider: record it only with BOTH the payload join and the ledger fact, then
                    // still throw (the foundation maps any throw to OUTCOME_UNKNOWN) and reclassify below after the launcher returns.
                    const deniedFact = attemptCount && toEvidence && owner.settleNext && isDeniedGatewayPayload(payload, owner.canonicalId) ? deniedAttempt?.(attemptsBefore) ?? null : null;
                    if (deniedFact) { denial.payload = payload; denial.retryAfterSeconds = deniedFact.retryAfterSeconds; throw new Error('CANONICAL_ATTEMPT_DENIED'); }
                    if (!joined || !payload.response || payload.error) throw new Error('CANONICAL_RESULT_NOT_CONFIRMED');
                    const identity = createMaoInvocationIdentity(invocation);
                    const usage = payload.response.providerUsage;
                    return { invocationResult: { ok: true as const, replayed: false, receipt: {
                        ...identity, taskId: invocation.taskId, adapterId: invocation.adapterId ?? 'cvf-web-canonical-gateway', role: 'worker',
                        authorityHash: invocation.graph.authorityEnvelope.authorityHash, idempotencyKey: invocation.idempotencyKey,
                        startedAt: invocation.startedAt, completedAt: new Date().toISOString(), diagnosticClass: null,
                        usage: { tokensReported: usage?.totalTokens ?? null, tokensEstimated: null, latencyMs: null,
                            measurementLabel: usage ? 'PROVIDER_REPORTED' as const : 'UNAVAILABLE' as const },
                    } }, payload };
                },
            }, { signal: options.signal });
            if (admissionFailure) {
                // invoke only runs after the launcher committed INVOCATION_STARTED, so the task is running and the refusal is no-call.
                await recordDeniedNoCallTerminal({ durableRunPath, taskGraphId: graph.taskGraphId, taskId, launchIdempotencyKey: request.idempotencyKey });
                return { ok: false, reason: 'WEB_ADMISSION_DENIED', response: admissionFailure };
            }
            if (denial.payload && denial.retryAfterSeconds !== undefined && attemptCount && toEvidence && owner.settleNext) {
                // Settle before any no-call claim; a failed or ambiguous settle never becomes a denial.
                const evidence = toEvidence(denial.payload);
                const settleFailure = await owner.settleNext(reservation.ordinal, evidence, attemptCount() > attemptsBefore ? attemptsBefore : null);
                if (settleFailure) return { ok: false, reason: 'WEB_SETTLEMENT_UNCERTAIN', response: settleFailure };
                // Settled and ledger-verified: the attempt never reached the provider, so the durable task ends rejected, not running.
                await recordDeniedNoCallTerminal({ durableRunPath, taskGraphId: graph.taskGraphId, taskId, launchIdempotencyKey: request.idempotencyKey });
                return { ok: false, reason: 'MAO_ATTEMPT_DENIED', ...(evidence ? { evidence } : {}), retryAfterSeconds: denial.retryAfterSeconds };
            }
            if (!result.ok) return { ok: false, reason: result.reason === 'OUTCOME_UNKNOWN' ? 'MAO_OUTCOME_UNKNOWN' : 'MAO_LAUNCH_UNCONFIRMED', ...failure() };
            const receipt = result.invocationResult.receipt;
            return { ok: true, payload: result.payload, ordinal: 1, reference: {
                taskGraphId: graph.taskGraphId, taskId, invocationId: receipt.invocationId, attemptId: receipt.attemptId,
                canonicalExecutionId: owner.canonicalId, state: 'succeeded',
            } };
        } catch {
            if (admissionFailure) return { ok: false, reason: 'WEB_ADMISSION_DENIED', response: admissionFailure };
            return { ok: false, reason: 'MAO_OUTCOME_UNKNOWN', ...failure() };
        }
    };
    return Object.freeze({ run });
}
