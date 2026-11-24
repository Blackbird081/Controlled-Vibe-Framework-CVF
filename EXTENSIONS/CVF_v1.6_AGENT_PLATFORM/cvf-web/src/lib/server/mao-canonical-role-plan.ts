import { createHash } from 'node:crypto';
import { isAbsolute } from 'node:path';
import { composeOrchestrationPlan } from 'cvf-control-plane-foundation';
import type { CanonicalExecutionPortResult } from 'cvf-model-gateway';
import { MaoFileRunStore } from '../../../../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/durable.run.store';
import { MaoOperationalWorkerLauncher } from '../../../../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/operational.worker.launcher';
import { MaoLifecycleController, createRealClock } from '../../../../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/lifecycle.controller.contract';
import { createMaoInvocationIdentity, validateMaoInvocationRequest, type MaoInvocationRequest } from '../../../../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/delegation.adapter.contract';
import type { MaoRiskLevel } from '../../../../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/task.graph.contract';
import type { CanonicalGatewayEvidence, MaoRolePlanEvidence, MaoRolePlanPartialOutput, MaoRolePlanUsage } from '@/lib/ai/types';
import { ROLE_PLAN_PROMPT_CONTRACT, ROLE_PLAN_REVIEWER_SYSTEM_PROMPT, buildReviewPrompt, buildRevisionPrompt, parseReviewerVerdict, type RolePlanFinding, type RolePlanLanguage, type RolePlanReview } from '@/lib/mao-role-plan-prompts';
import { isDeniedGatewayPayload, type MaoSafeGatewayFailure, type MaoWebOutcome, type MaoWebReservationOwner } from './mao-canonical-single-worker';
import { recordDeniedNoCallTerminal } from './mao-canonical-terminal-event';

export const MAO_ROLE_PLAN_ENV = 'CVF_WEB_CANONICAL_MAO_ROLE_PLAN';
const SINGLE_WORKER_ENV = 'CVF_WEB_CANONICAL_MAO_SINGLE_WORKER';
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
/** Cumulative wall clock of one plan (graph budget) and the ceiling of one launched step. */
const ROLE_PLAN_WALL_CLOCK_MS = 240000;
/** A step is not started with less budget than this; it is treated as the deadline (Fable F2), never launched with a ~1 ms ceiling. */
export const MIN_STEP_REMAINING_MS = 15000;
const STEP_TIMEOUT_CEILING_MS = 60000;

/** Both lanes on at once is a configuration conflict: the route answers 503 before any provider call. */
export function maoRolePlanConfigConflict(env: Record<string, string | undefined> = process.env): boolean {
    return env[MAO_ROLE_PLAN_ENV] === '1' && env[SINGLE_WORKER_ENV] === '1';
}

/** The plan needs four provider attempts per minute (draft, review, revise, recheck); a lower configured quota is a configuration conflict. */
export const ROLE_PLAN_MIN_QUOTA_PER_MIN = 4;
const QUOTA_ENV = 'CVF_PROVIDER_QUOTA_PER_MIN';
/** Role plan on and a finite integer provider quota below the minimum: the route answers 503 before any provider call. */
export function maoRolePlanQuotaTooLow(env: Record<string, string | undefined> = process.env): boolean {
    if (env[MAO_ROLE_PLAN_ENV] !== '1') return false;
    const raw = env[QUOTA_ENV];
    if (raw === undefined || raw.trim() === '') return false;
    const quota = Number(raw);
    return Number.isFinite(quota) && Number.isInteger(quota) && quota < ROLE_PLAN_MIN_QUOTA_PER_MIN;
}

/** The model the route names as a fit reviewer in its refusal message. */
export const ROLE_PLAN_FIT_REVIEWER_MODEL = 'qwen-plus-character';
/** An Alibaba model id containing "flash" (case-insensitive) is unfit as reviewer (live run HL2 passed an incomplete draft). */
export function maoRolePlanReviewerModelUnfit(modelId: string | undefined | null): boolean {
    return typeof modelId === 'string' && /flash/i.test(modelId);
}

export type MaoRolePlanStep = 'draft' | 'review' | 'revise' | 'recheck';
export interface MaoRolePlanCall {
    step: MaoRolePlanStep;
    prompt: string;
    /** Absent for worker steps (the route keeps its worker system prompt); the reviewer always receives its own. */
    systemPrompt?: string;
    purpose: 'initial' | 'continuation';
}
/** The lineage owner: reserve before and settle after every provider call. */
export interface MaoRolePlanOwner extends MaoWebReservationOwner {
    settleNext(ordinal: number, evidence: CanonicalGatewayEvidence | undefined, callbackAttemptIndex: number | null): Promise<Response | null>;
}
/**
 * A failed plan. Once the graph exists, every failure outcome carries the partial role-plan evidence built so far (stoppedEarly
 * FAILED) and, when a settled step produced non-empty output that passed egress screening, a partial output. Read both through
 * `rolePlanFailureEvidence(outcome)`: they are kept beside the outcome, not on it, so the closed failure shape (`ok`, `reason`,
 * owner `response`, safe gateway failure) stays unchanged for equality checks and a spread of the outcome cannot silently drop
 * evidence it never held. `MAO_ATTEMPT_DENIED` additionally carries the settled denied evidence and the retry-after fact of the
 * provider-attempt ledger. A `WEB_SETTLEMENT_UNCERTAIN` failure never carries a partial output (its response is "never AI output").
 */
export type MaoRolePlanFailure = Extract<MaoWebOutcome, { ok: false }> & {
    readonly evidence?: CanonicalGatewayEvidence;
    readonly retryAfterSeconds?: number;
};
export interface MaoRolePlanFailureEvidence {
    readonly rolePlan?: MaoRolePlanEvidence;
    readonly partialOutput?: MaoRolePlanPartialOutput;
}
const failureEvidence = new WeakMap<object, MaoRolePlanFailureEvidence>();
/** The partial role-plan evidence and unreviewed partial output of a failed plan; empty for any other outcome. */
export function rolePlanFailureEvidence(outcome: object): MaoRolePlanFailureEvidence {
    return failureEvidence.get(outcome) ?? {};
}
/** Minimal view of one provider-attempt ledger entry the denied-attempt fact needs. */
export interface MaoRolePlanLedgerAttempt { readonly admitted: boolean; readonly retryAfterSeconds?: number }
/**
 * The ledger fact of a denied step: exactly one new attempt since the step started (`since` = attempts before it), that attempt
 * not admitted and carrying a retry-after. Zero or several new attempts, an admitted attempt or a missing retry-after give null.
 */
export function deniedAttemptFact(attempts: readonly MaoRolePlanLedgerAttempt[], since: number): { retryAfterSeconds: number } | null {
    const attempt = attempts.length === since + 1 ? attempts[since] : undefined;
    return attempt && !attempt.admitted && attempt.retryAfterSeconds !== undefined ? { retryAfterSeconds: attempt.retryAfterSeconds } : null;
}
export type MaoRolePlanOutcome =
    | { ok: true; payload: CanonicalExecutionPortResult; ordinal: number; rolePlan: MaoRolePlanEvidence }
    | MaoRolePlanFailure;

const GATEWAY_ERROR_CLASSES = ['policy_denied', 'no_candidate', 'quota_exceeded', 'provider_unavailable', 'invalid_request', 'credential_shielded', 'internal_error', 'admission_blocked'];
const GATEWAY_CLOSED_FAILURE_CODES = ['request_cancelled', 'provider_timeout', 'provider_http_error', 'output_incomplete', 'quota_locked', 'credential_unavailable', 'destination_denied', 'invalid_identity'];
const counter = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
const usageOf = (payload: CanonicalExecutionPortResult): MaoRolePlanUsage => {
    const usage = payload.response?.providerUsage;
    return { inputTokens: counter(usage?.inputTokens) ?? null, outputTokens: counter(usage?.outputTokens) ?? null, totalTokens: counter(usage?.totalTokens) ?? null };
};
/** Component-wise sum; a component is null as soon as any executed step lacks it. */
const sumUsage = (all: readonly MaoRolePlanUsage[]): MaoRolePlanUsage => {
    const sum = (pick: (u: MaoRolePlanUsage) => number | null) => all.reduce<number | null>((acc, u) => (acc === null || pick(u) === null ? null : acc + pick(u)!), 0);
    return { inputTokens: sum(u => u.inputTokens), outputTokens: sum(u => u.outputTokens), totalTokens: sum(u => u.totalTokens) };
};

/** Closed API-lane failure facts only (same projection rules as the single worker); anything else stays UNKNOWN. */
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
 * Bounded draft -> review -> revise -> recheck plan for one Web request. The recheck (one re-review of the revision, never a
 * second revision) runs only on the REVISE path, at the fourth ordinal. Cooperative selected caller only: one private one-shot
 * closure owns the confirmed ordinal-1 reservation and the single graph creator, and is never reset. Steps are strictly
 * sequential: each reserves before and settles after its provider call, and the next step starts only after the
 * previous settle committed. The launcher enforces no dependency order beyond sequential starts, so this consumer does.
 */
export function createMaoCanonicalRolePlan(options: {
    owner: MaoRolePlanOwner;
    riskLevel: string | null;
    durableRunPath: string | undefined;
    /** The sanitized worker prompt of the request; the draft step sends it unchanged. */
    prompt: string;
    templateName: string;
    intent: string;
    inputs: Record<string, string>;
    /** Language of the user-facing body, resolved by the route from the same request the worker prompt was built from. */
    responseLanguage: RolePlanLanguage;
    execute: (call: MaoRolePlanCall) => Promise<CanonicalExecutionPortResult>;
    toEvidence: (result: CanonicalExecutionPortResult) => CanonicalGatewayEvidence | undefined;
    attemptCount: () => number;
    /**
     * The route's provider-attempt ledger fact for the step that just ended: given the attempt count before the step, returns the
     * retry-after of exactly one new attempt that was not admitted, otherwise null. A denied gateway payload is a definite no-call
     * outcome only when this fact confirms it; without the fact the payload keeps the unknown-outcome behaviour.
     */
    deniedAttempt?: (attemptsBefore: number) => { retryAfterSeconds: number } | null;
    /** Egress screening of a built step prompt; null blocks the step before any reservation. */
    sanitize?: (prompt: string) => Promise<string | null>;
    signal?: AbortSignal;
    /** Millisecond clock of the cumulative deadline; injectable for tests, Date.now by default. */
    now?: () => number;
}) {
    let claimed = false;
    const run = async (): Promise<MaoRolePlanOutcome> => {
        // Synchronous claim before any reservation/create/launch await, never reset.
        if (claimed) return { ok: false, reason: 'MAO_ALREADY_CLAIMED' };
        claimed = true;
        const nowMs = options.now ?? Date.now;
        const startedMs = nowMs();
        const remainingMs = () => ROLE_PLAN_WALL_CLOCK_MS - (nowMs() - startedMs);
        const { owner, riskLevel, durableRunPath } = options;
        if (!durableRunPath || !isAbsolute(durableRunPath) || durableRunPath.trim() !== durableRunPath
            || !/^[A-Za-z0-9._-]{1,100}$/.test(owner.canonicalId) || !/^[a-f0-9]{64}$/.test(owner.verifiedOwnerHash)) {
            return { ok: false, reason: 'MAO_NOT_READY' };
        }
        if (!riskLevel || !['R0', 'R1', 'R2', 'R3'].includes(riskLevel)) return { ok: false, reason: 'MAO_RISK_DENIED' };
        const binding = digest(JSON.stringify(['web-mao-role-plan-v1', owner.canonicalId, owner.verifiedOwnerHash]));
        const risk = riskLevel as MaoRiskLevel;
        const plan = composeOrchestrationPlan({
            graphInput: {
                authority: {
                    workOrderId: `CVF-WEB-V1-MAO-PLAN:${binding}`, route: 'SINGLE_AGENT_MULTI_ROLE', riskLevel: risk,
                    budget: { maxInvocations: 4, maxConcurrentRoles: 2, maxRevisionDepth: 1, tokenCostCeiling: null, wallClockCeilingMs: ROLE_PLAN_WALL_CLOCK_MS },
                    closerActorId: 'web-local-root', approvalCheckpoints: [],
                },
                tasks: [
                    { taskId: 'draft', role: 'worker', riskLevel: risk, fileScope: ['web-artifact/draft'] },
                    { taskId: 'review', role: 'reviewer', riskLevel: risk, fileScope: ['web-artifact/review'], requiresIsolatedSourcePacket: true },
                    { taskId: 'revise', role: 'worker', riskLevel: risk, fileScope: ['web-artifact/revision'] },
                    { taskId: 'recheck', role: 'reviewer', riskLevel: risk, fileScope: ['web-artifact/recheck'], requiresIsolatedSourcePacket: true },
                ],
                dependencyManifest: [{ taskId: 'review', dependsOn: ['draft'] }, { taskId: 'revise', dependsOn: ['review'] }, { taskId: 'recheck', dependsOn: ['revise'] }],
            }, receiptId: `web-plan-admission-${binding}`,
        });
        if (!plan.graphResult.ok || plan.roleResolution?.decision !== 'BOUNDED_ROLE_PLAN_ADMITTED' || plan.roleResolution.approvalRequired) {
            return { ok: false, reason: 'MAO_RISK_DENIED' };
        }
        const graph = plan.graphResult.graph;
        const admission = plan.roleResolution;
        const roleOf = { draft: 'worker', review: 'reviewer', revise: 'worker', recheck: 'reviewer' } as const;
        const requestFor = (step: MaoRolePlanStep, ordinal: number): MaoInvocationRequest => ({
            graph, admission, taskId: step, capability: { role: roleOf[step], requiredCapabilities: ['canonical_inference'], offeredCapabilities: ['canonical_inference'] },
            inputManifest: [`canonical:${owner.canonicalId}`, `owner:${owner.verifiedOwnerHash}`, `step:${step}`, `ordinal:${ordinal}`],
            idempotencyKey: `web-plan-${step}-${binding}`, startedAt: new Date().toISOString(),
        });
        const planned = [['draft', 1], ['review', 2], ['revise', 3], ['recheck', 4]] as const;
        if (planned.some(([step, ordinal]) => validateMaoInvocationRequest(requestFor(step, ordinal)))) return { ok: false, reason: 'MAO_ADMISSION_DENIED' };

        let safeGatewayFailure: MaoSafeGatewayFailure | undefined;
        let launcher: MaoOperationalWorkerLauncher | undefined;
        const steps: MaoRolePlanEvidence['steps'] = [];
        // Plan state, declared before the failure builder so every failure outcome can carry the partial evidence built so far.
        let finalPayload: CanonicalExecutionPortResult | undefined;
        let finalOrdinal = 1;
        let reviewerVerdict: MaoRolePlanEvidence['reviewerVerdict'] = 'NOT_RUN';
        const diagnostics: Pick<MaoRolePlanEvidence, 'reviewerDiagnostic' | 'recheckDiagnostic'> = {};
        let findings: RolePlanFinding[] = [];
        let revisionApplied = false;
        let revisionReviewed: boolean | null = null;
        let recheckVerdict: MaoRolePlanEvidence['recheckVerdict'] = null;
        let recheckFindings: RolePlanFinding[] = [];
        let stoppedEarly: MaoRolePlanEvidence['stoppedEarly'] = null;
        /** Latest settled worker output with non-empty text (draft, then revision): the O5 partial output of a later failure. */
        let latest: { text: string; fromStep: 'draft' | 'revise' } | undefined;
        const screened = async (prompt: string) => (options.sanitize ? options.sanitize(prompt) : prompt);
        const textOf = (payload: CanonicalExecutionPortResult) => payload.response?.text ?? '';
        const evidence = (stopped: MaoRolePlanEvidence['stoppedEarly']): MaoRolePlanEvidence => ({
            taskGraphId: graph.taskGraphId, steps: [...steps], totalUsage: sumUsage(steps.map(entry => entry.usage)), reviewerVerdict, findings, revisionApplied, revisionReviewed,
            recheckVerdict, recheckFindings, stoppedEarly: stopped, promptContract: ROLE_PLAN_PROMPT_CONTRACT,
            ...diagnostics,
        });
        const failure = async (reason: string, extra: { response?: Response; evidence?: CanonicalGatewayEvidence; retryAfterSeconds?: number } = {}): Promise<MaoRolePlanOutcome> => {
            const outcome = { ok: false as const, reason, ...extra, ...(safeGatewayFailure ? { safeGatewayFailure } : {}) };
            let partialOutput: MaoRolePlanPartialOutput | undefined;
            if (latest && reason !== 'WEB_SETTLEMENT_UNCERTAIN') {
                let text: string | null = null;
                try { text = await screened(latest.text); } catch { text = null; }
                if (text !== null && text.trim()) partialOutput = { text, fromStep: latest.fromStep, reviewed: false };
            }
            failureEvidence.set(outcome, { rolePlan: evidence('FAILED'), ...(partialOutput ? { partialOutput } : {}) });
            return outcome as MaoRolePlanOutcome;
        };

        type StepResult = { ok: true; payload: CanonicalExecutionPortResult } | { ok: false; outcome: MaoRolePlanOutcome; denied?: true };
        /** One reserved, launched and settled step; a failure holds the plan with no retry. A confirmed denied attempt is a settled no-call outcome. */
        const runStep = async (step: MaoRolePlanStep, ordinal: number, prompt: string, systemPrompt?: string): Promise<StepResult> => {
            const stop = (outcome: MaoRolePlanOutcome) => ({ ok: false as const, outcome });
            if (options.signal?.aborted) return stop(await failure('MAO_REQUEST_CANCELLED'));
            const reservation = await owner.reserveNext();
            if ('response' in reservation) return stop(await failure('WEB_ADMISSION_DENIED', { response: reservation.response }));
            if (reservation.ordinal !== ordinal) return stop(await failure('MAO_ORDINAL_DENIED'));
            const denial: { payload?: CanonicalExecutionPortResult; retryAfterSeconds?: number } = {};
            let admissionFailure: Response | null = null;
            try {
                if (step === 'draft') {
                    const store = new MaoFileRunStore(durableRunPath);
                    const created = await store.createRun(graph);
                    if (!created.ok) return stop(await failure('MAO_RUN_UNAVAILABLE_NO_RESEND'));
                    launcher = new MaoOperationalWorkerLauncher(store, { invoke() { throw new Error('SYNC_PORT_FORBIDDEN'); } }, new MaoLifecycleController({ clock: createRealClock() }));
                }
                const request = requestFor(step, ordinal);
                const attemptsBefore = options.attemptCount();
                const result = await launcher!.launchAsync<CanonicalExecutionPortResult>({
                    taskGraphId: graph.taskGraphId, taskId: step, admission, capability: request.capability,
                    inputManifest: request.inputManifest, launchIdempotencyKey: request.idempotencyKey,
                    timeoutCeilingMs: Math.max(1, Math.floor(Math.min(STEP_TIMEOUT_CEILING_MS, remainingMs()))),
                }, {
                    async invoke(invocation) {
                        admissionFailure = owner.beforeProviderCall(ordinal);
                        if (admissionFailure) throw new Error('WEB_CALL_ADMISSION_REFUSED');
                        const payload = await options.execute({ step, prompt, systemPrompt, purpose: step === 'draft' ? 'initial' : 'continuation' });
                        const joined = payload.canonicalExecutionId === owner.canonicalId
                            && payload.receipt?.canonicalExecutionId === owner.canonicalId && payload.receipt.traceId === owner.canonicalId
                            && Boolean(payload.receipt.receiptId) && payload.materialContextManifest?.canonicalExecutionId === owner.canonicalId
                            && payload.materialContextManifest.traceId === owner.canonicalId;
                        if (joined) safeGatewayFailure = safeGatewayFailureOf(payload, owner.canonicalId);
                        // A denied attempt never reached the provider: record it, then still throw so the launcher returns (the
                        // foundation maps any throw to OUTCOME_UNKNOWN, which runStep reclassifies from the recorded denial below).
                        const deniedFact = isDeniedGatewayPayload(payload, owner.canonicalId) ? options.deniedAttempt?.(attemptsBefore) ?? null : null;
                        if (deniedFact) { denial.payload = payload; denial.retryAfterSeconds = deniedFact.retryAfterSeconds; throw new Error('CANONICAL_ATTEMPT_DENIED'); }
                        if (!joined || !payload.response || payload.error) throw new Error('CANONICAL_RESULT_NOT_CONFIRMED');
                        const identity = createMaoInvocationIdentity(invocation);
                        const usage = payload.response.providerUsage;
                        return { invocationResult: { ok: true as const, replayed: false, receipt: {
                            ...identity, taskId: invocation.taskId, adapterId: invocation.adapterId ?? 'cvf-web-canonical-gateway', role: roleOf[step],
                            authorityHash: invocation.graph.authorityEnvelope.authorityHash, idempotencyKey: invocation.idempotencyKey,
                            startedAt: invocation.startedAt, completedAt: new Date().toISOString(), diagnosticClass: null,
                            usage: { tokensReported: usage?.totalTokens ?? null, tokensEstimated: null, latencyMs: null,
                                measurementLabel: usage ? 'PROVIDER_REPORTED' as const : 'UNAVAILABLE' as const },
                        } }, payload };
                    },
                }, { signal: options.signal });
                if (admissionFailure) {
                    // invoke runs only after the launcher committed INVOCATION_STARTED, and the refusal came before execute: no call.
                    await recordDeniedNoCallTerminal({ durableRunPath, taskGraphId: graph.taskGraphId, taskId: step, launchIdempotencyKey: request.idempotencyKey });
                    return stop(await failure('WEB_ADMISSION_DENIED', { response: admissionFailure }));
                }
                if (denial.payload && denial.retryAfterSeconds !== undefined) {
                    const deniedEvidence = options.toEvidence(denial.payload);
                    const deniedSettle = await owner.settleNext(ordinal, deniedEvidence, options.attemptCount() > attemptsBefore ? attemptsBefore : null);
                    if (deniedSettle) return stop(await failure('WEB_SETTLEMENT_UNCERTAIN', { response: deniedSettle }));
                    // Settled and ledger-verified: the step never reached the provider, so its durable task ends rejected, not running.
                    await recordDeniedNoCallTerminal({ durableRunPath, taskGraphId: graph.taskGraphId, taskId: step, launchIdempotencyKey: request.idempotencyKey });
                    return { ok: false as const, denied: true as const, outcome: await failure('MAO_ATTEMPT_DENIED', { evidence: deniedEvidence, retryAfterSeconds: denial.retryAfterSeconds }) };
                }
                if (!result.ok) return stop(await failure(result.reason === 'OUTCOME_UNKNOWN' ? 'MAO_OUTCOME_UNKNOWN' : 'MAO_LAUNCH_UNCONFIRMED'));
                const settleFailure = await owner.settleNext(ordinal, options.toEvidence(result.payload), options.attemptCount() > attemptsBefore ? attemptsBefore : null);
                if (settleFailure) return stop(await failure('WEB_SETTLEMENT_UNCERTAIN', { response: settleFailure }));
                steps.push({ step, role: roleOf[step], taskId: step, ordinal, state: 'succeeded', invocationId: result.invocationResult.receipt.invocationId, usage: usageOf(result.payload) });
                if ((step === 'draft' || step === 'revise') && textOf(result.payload).trim()) latest = { text: textOf(result.payload), fromStep: step };
                return { ok: true, payload: result.payload };
            } catch {
                if (admissionFailure) return stop(await failure('WEB_ADMISSION_DENIED', { response: admissionFailure }));
                return stop(await failure('MAO_OUTCOME_UNKNOWN'));
            }
        };

        /** Reviewer text reaches the response and the revision prompt, so each finding passes the same egress screening; blocked findings are dropped. */
        const screenReview = async (text: string): Promise<RolePlanReview> => {
            const parsed = parseReviewerVerdict(text);
            const screenedFindings: RolePlanFinding[] = [];
            for (const finding of parsed.findings) {
                if (!options.sanitize) { screenedFindings.push(finding); continue; }
                const [criterion, problem, fix] = [await options.sanitize(finding.criterion), await options.sanitize(finding.problem), await options.sanitize(finding.fix)].map(text => text?.trim() ?? null);
                if (criterion && problem && fix) screenedFindings.push({ criterion, problem, fix });
            }
            return parsed.verdict === 'REVISE' && screenedFindings.length === 0
                ? { verdict: 'UNPARSEABLE', findings: [], diagnostic: 'FINDINGS_FILTERED' }
                : { ...parsed, findings: screenedFindings };
        };

        const draft = await runStep('draft', 1, options.prompt);
        if (!draft.ok) return draft.outcome;
        const draftText = textOf(draft.payload);
        finalPayload = draft.payload;
        const concluded = (): MaoRolePlanOutcome => ({ ok: true, payload: finalPayload!, ordinal: finalOrdinal, rolePlan: evidence(stoppedEarly) });

        // An empty draft is not reviewed; the route still validates the final output.
        if (!draftText.trim()) { stoppedEarly = 'EMPTY_DRAFT'; return concluded(); }
        if (remainingMs() < MIN_STEP_REMAINING_MS) { stoppedEarly = 'DEADLINE'; return concluded(); }

        // A denied later attempt (O1) is a settled no-call outcome: the latest settled output is returned with the step verdict NOT_RUN.
        const reviewPrompt = await screened(buildReviewPrompt({ templateName: options.templateName, intent: options.intent, inputs: options.inputs, draft: draftText, responseLanguage: options.responseLanguage }));
        if (reviewPrompt === null) return failure('MAO_STEP_PROMPT_BLOCKED');
        const review = await runStep('review', 2, reviewPrompt, ROLE_PLAN_REVIEWER_SYSTEM_PROMPT);
        if (!review.ok) { if (!review.denied) return review.outcome; stoppedEarly = 'ATTEMPT_DENIED'; return concluded(); }
        const verdict = await screenReview(textOf(review.payload));
        reviewerVerdict = verdict.verdict;
        if (verdict.diagnostic) diagnostics.reviewerDiagnostic = verdict.diagnostic;
        findings = verdict.findings;
        if (verdict.verdict !== 'REVISE') return concluded();

        if (remainingMs() < MIN_STEP_REMAINING_MS) { stoppedEarly = 'DEADLINE'; return concluded(); }
        const revisePrompt = await screened(buildRevisionPrompt({ originalPrompt: options.prompt, draft: draftText, findings: verdict.findings, inputs: options.inputs, responseLanguage: options.responseLanguage }));
        if (revisePrompt === null) return failure('MAO_STEP_PROMPT_BLOCKED');
        const revision = await runStep('revise', 3, revisePrompt);
        if (!revision.ok) { if (!revision.denied) return revision.outcome; stoppedEarly = 'ATTEMPT_DENIED'; return concluded(); }
        finalPayload = revision.payload;
        finalOrdinal = 3;
        revisionApplied = true;
        revisionReviewed = false;
        recheckVerdict = 'NOT_RUN';

        // One bounded re-review of the revision at ordinal 4; never a second revision. When the recheck is not attempted (empty
        // revision, deadline or a denied attempt) the settled revision is returned; a refused reservation or unknown outcome fails closed.
        const revisionText = textOf(revision.payload);
        if (!revisionText.trim()) { stoppedEarly = 'EMPTY_DRAFT'; return concluded(); }
        if (remainingMs() < MIN_STEP_REMAINING_MS) { stoppedEarly = 'DEADLINE'; return concluded(); }
        const recheckPrompt = await screened(buildReviewPrompt({ templateName: options.templateName, intent: options.intent, inputs: options.inputs, draft: revisionText, responseLanguage: options.responseLanguage }));
        if (recheckPrompt === null) return failure('MAO_STEP_PROMPT_BLOCKED');
        const recheck = await runStep('recheck', 4, recheckPrompt, ROLE_PLAN_REVIEWER_SYSTEM_PROMPT);
        // Root amendment (Fable F1): a refused ordinal-4 reservation finalizes the Web envelope FAILED in the lineage owner, so the
        // plan fails closed like Stop before review or revise instead of returning a success that contradicts the durable record.
        if (!recheck.ok) { if (!recheck.denied) return recheck.outcome; stoppedEarly = 'ATTEMPT_DENIED'; return concluded(); }
        const rechecked = await screenReview(textOf(recheck.payload));
        recheckVerdict = rechecked.verdict;
        if (rechecked.diagnostic) diagnostics.recheckDiagnostic = rechecked.diagnostic;
        recheckFindings = rechecked.findings;
        revisionReviewed = true;
        return concluded();
    };
    return Object.freeze({ run });
}
