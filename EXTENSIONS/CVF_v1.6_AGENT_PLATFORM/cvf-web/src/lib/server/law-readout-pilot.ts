import { createHash, randomUUID } from 'node:crypto';
import { SQLiteAtomicRecordAdapter, type AtomicSQLiteRow } from '../storage-adapter';
import { reserveActionQuota, transitionActionQuota, validateActionQuota, type ActionQuotaSnapshot } from '../../../../../CVF_MODEL_GATEWAY/src/quota-ledger';
import { evaluateProviderExecutionAuthority, type ProviderExecutionGrant } from '../../../../../CVF_CONTROL_PLANE_FOUNDATION/src/delegation.contract';

/** Opt-in source composition only. No provider client, key lookup, route or live admission. */
export type ReadoutStage = 'initial' | 'revision';
export interface ReadoutPlan {
    runId: string;
    workerAgentId: string;
    delegationId: string;
    reviewerAgentId: string;
    grant: ProviderExecutionGrant;
    sourceHead: string;
    packetSha256: string;
    oracleSha256: string;
    systemPromptSha256: string;
    initialInputSha256: string;
    revisionInstructionsSha256: string;
    provider: 'alibaba';
    model: string;
    pricing: { identity: string; inputNanoUsdPerToken: number; outputNanoUsdPerToken: number };
    maxInputTokens: number;
    maxOutputTokens: number;
    totalMicrounits: number;
    timeoutMs: number;
}
export interface ReadoutRequest {
    workerAgentId: string;
    delegationId: string;
    grantId: string;
    sourceHead: string;
    packetSha256: string;
    oracleSha256: string;
    systemPrompt: string;
    userPrompt: string;
    parentOutput?: string;
    review?: { reviewerAgentId: string; parentOutputSha256: string; decision: 'REVISE'; expectedInformationGain: string };
}
export interface ReadoutTransportRequest {
    provider: 'alibaba'; model: string; systemPrompt: string; userPrompt: string;
    maxTokens: number; signal: AbortSignal;
}
export interface ReadoutResponse {
    provider: string; model: string; output: string; finishReason: string;
    usage?: { inputTokens: number; outputTokens: number };
}
export type ReadoutTransport = (request: ReadoutTransportRequest) => Promise<ReadoutResponse>;
export interface ReadoutReceipt {
    id: string; stage: ReadoutStage; planSha256: string; inputSha256: string; outputSha256: string;
    provider: string; model: string; pricingIdentity: string; inputTokens: number; outputTokens: number;
    costMicrounits: number; parentOutputSha256: string | null; reviewSha256: string | null;
}
type StageRecord = {
    status: 'NOT_STARTED' | 'STARTED' | 'VALID' | 'FAILED' | 'UNKNOWN';
    inputSha256?: string; parentOutputSha256?: string; reviewSha256?: string;
    receipt?: ReadoutReceipt;
};
type RunRecord = { planSha256: string; quota: ActionQuotaSnapshot; stages: Record<ReadoutStage, StageRecord> };

export class ReadoutDenied extends Error {
    constructor(readonly code: string) { super(code); }
}
const STAGES: ReadoutStage[] = ['initial', 'revision'];
const sha = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');
export const readoutTextSha256 = sha;
export const readoutInputSha256 = (system: string, user: string) => sha(JSON.stringify([system, user]));
const canonical = (value: unknown): string => JSON.stringify(value, (_key, item) =>
    item && typeof item === 'object' && !Array.isArray(item)
        ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);
const requireThat = (condition: unknown, code: string): void => { if (!condition) throw new ReadoutDenied(code); };
const positive = (value: number, cap: number) => Number.isSafeInteger(value) && value > 0 && value <= cap;
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/** Caller supplies approved local custody. Same-account tampering is outside this source proof. */
export class LawReadoutPilot {
    private readonly plan: ReadoutPlan;
    private readonly planSha256: string;
    private readonly allocation: number;
    private readonly id: string;
    private deliveredInitialReceiptId: string | null = null;

    constructor(plan: ReadoutPlan, private readonly store: SQLiteAtomicRecordAdapter,
        private readonly now: () => Date = () => new Date()) {
        this.plan = clone(plan);
        const p = this.plan;
        requireThat(/^[a-zA-Z0-9._:-]{1,80}$/.test(p.runId), 'PLAN_ID');
        requireThat([p.workerAgentId, p.delegationId, p.reviewerAgentId, p.model, p.pricing.identity]
            .every(v => typeof v === 'string' && v.trim().length > 0 && v.length <= 200), 'PLAN_IDENTITY');
        requireThat(p.workerAgentId !== p.reviewerAgentId && p.provider === 'alibaba', 'PLAN_ROLE');
        requireThat(/^[a-f0-9]{40}$/.test(p.sourceHead) && [p.packetSha256, p.oracleSha256,
            p.systemPromptSha256, p.initialInputSha256, p.revisionInstructionsSha256]
            .every(v => /^[a-f0-9]{64}$/.test(v)), 'PLAN_PIN');
        requireThat(positive(p.maxInputTokens, 30000) && positive(p.maxOutputTokens, 3000)
            && positive(p.totalMicrounits, 500000) && positive(p.timeoutMs, 180000), 'PLAN_CAP');
        requireThat(positive(p.pricing.inputNanoUsdPerToken, 1e9)
            && positive(p.pricing.outputNanoUsdPerToken, 1e9), 'PLAN_PRICING');
        requireThat(p.grant.authority === 'ORCHESTRATOR_GRANT_REQUIRED' && p.grant.maxCalls === 2, 'PLAN_GRANT');
        requireThat(p.grant.subjectAgentId === p.workerAgentId && p.grant.delegationId === p.delegationId,
            'PLAN_GRANT_IDENTITY');
        requireThat(typeof p.grant.grantId === 'string' && p.grant.grantId.length > 0
            && store.namespace === 'law-readout-pilot', 'PLAN_CUSTODY');
        this.allocation = this.cost(p.maxInputTokens, p.maxOutputTokens);
        requireThat(this.allocation > 0 && this.allocation * 2 <= p.totalMicrounits, 'PLAN_BUDGET');
        this.planSha256 = sha(canonical(p));
        // Changing the task/run label cannot replenish the same grant in this custody.
        this.id = `grant:${sha(p.grant.grantId!)}`;
    }

    initialize(): void {
        this.store.transaction(rows => {
            const old = rows.find(row => row.id === this.id);
            if (old) { this.record(old); return { writes: [], result: undefined }; }
            const value: RunRecord = { planSha256: this.planSha256,
                quota: reserveActionQuota({ scopeId: this.plan.runId, reservationId: this.planSha256,
                    currency: 'USD', totalMicrounits: this.plan.totalMicrounits,
                    stageAllocations: { initial: this.allocation, revision: this.allocation } }),
                stages: { initial: { status: 'NOT_STARTED' }, revision: { status: 'NOT_STARTED' } } };
            return { writes: [{ id: this.id, expectedRevision: null, value }], result: undefined };
        });
    }

    snapshot(): Readonly<RunRecord> {
        return clone(this.record(this.store.readAll().find(row => row.id === this.id)));
    }

    async run(stage: ReadoutStage, supplied: ReadoutRequest, transport: ReadoutTransport,
        signal?: AbortSignal): Promise<{ output: string; receipt: ReadoutReceipt }> {
        requireThat(STAGES.includes(stage), 'STAGE');
        requireThat(!signal?.aborted, 'CANCELLED_BEFORE_START');
        const request = clone(supplied);
        const p = this.plan;
        requireThat(request.sourceHead === p.sourceHead && request.packetSha256 === p.packetSha256
            && request.oracleSha256 === p.oracleSha256, 'INPUT_PIN');
        requireThat(typeof request.systemPrompt === 'string' && sha(request.systemPrompt) === p.systemPromptSha256
            && typeof request.userPrompt === 'string', 'PROMPT_PIN');
        let userPrompt = request.userPrompt;
        if (stage === 'initial') {
            requireThat(!request.review && request.parentOutput === undefined
                && readoutInputSha256(request.systemPrompt, userPrompt) === p.initialInputSha256, 'INITIAL_PIN');
        } else {
            requireThat(sha(userPrompt) === p.revisionInstructionsSha256
                && typeof request.parentOutput === 'string', 'REVISION_PIN');
            userPrompt = JSON.stringify({ parentOutput: request.parentOutput, instructions: userPrompt });
        }
        // Conservative byte bound, with protocol headroom. Real provider tokenization is not proved here.
        requireThat(Buffer.byteLength(JSON.stringify([request.systemPrompt, userPrompt]), 'utf8') + 1024
            <= p.maxInputTokens, 'INPUT_CAP');
        const inputSha256 = readoutInputSha256(request.systemPrompt, userPrompt);
        this.update(record => {
            requireThat(record.stages[stage].status === 'NOT_STARTED', 'REPLAY');
            const consumed = STAGES.filter(key => record.quota.stages[key].state !== 'RESERVED').length;
            requireThat(evaluateProviderExecutionAuthority(p.grant, {
                workerAgentId: request.workerAgentId, delegationId: request.delegationId,
                grantId: request.grantId, provider: p.provider, consumedCalls: consumed,
                nowIso: this.now().toISOString(),
            }).allowed, 'AUTHORITY');
            if (stage === 'revision') {
                const parent = record.stages.initial;
                const review = request.review;
                requireThat(parent.status === 'VALID' && parent.receipt && review
                    && review.reviewerAgentId === p.reviewerAgentId && review.decision === 'REVISE'
                    && review.parentOutputSha256 === parent.receipt.outputSha256
                    && sha(request.parentOutput!) === parent.receipt.outputSha256
                    && typeof review.expectedInformationGain === 'string'
                    && review.expectedInformationGain.trim().length > 0
                    && review.expectedInformationGain.length <= 2000, 'REVIEW_REQUIRED');
                // A restart cannot prove that the prior delivery was acknowledged. This
                // slice intentionally has no recovery/resume grant or operator bypass.
                requireThat(this.deliveredInitialReceiptId === parent.receipt!.id, 'RECONCILIATION_REQUIRED');
                record.stages[stage].parentOutputSha256 = parent.receipt!.outputSha256;
                record.stages[stage].reviewSha256 = sha(canonical(review));
            }
            record.quota = transitionActionQuota(record.quota, stage, 'start');
            record.stages[stage].status = 'STARTED';
            record.stages[stage].inputSha256 = inputSha256;
        }); // Commit/readback must finish before any transport call. Ambiguity denies execution.

        const abort = new AbortController();
        let timer: ReturnType<typeof setTimeout> | undefined;
        let cancelled = false;
        let rejectAbort: (error: Error) => void = () => {};
        const onAbort = () => { cancelled = true; abort.abort(); rejectAbort(new ReadoutDenied('CANCELLED_OR_TIMEOUT')); };
        const stopped = new Promise<never>((_resolve, reject) => { rejectAbort = reject; });
        // Abort can already have occurred during the synchronous custody commit.
        void stopped.catch(() => {});
        signal?.addEventListener('abort', onAbort, { once: true });
        try {
            timer = setTimeout(onAbort, p.timeoutMs);
            if (signal?.aborted) onAbort();
            requireThat(!cancelled, 'CANCELLED_OR_TIMEOUT');
            const response = await Promise.race([Promise.resolve().then(() => {
                requireThat(!cancelled, 'CANCELLED_OR_TIMEOUT');
                requireThat(Date.parse(p.grant.expiresAt!) > this.now().getTime(), 'AUTHORITY');
                return transport({ provider: p.provider, model: p.model, systemPrompt: request.systemPrompt,
                    userPrompt, maxTokens: p.maxOutputTokens, signal: abort.signal });
            }), stopped]);
            requireThat(!cancelled, 'CANCELLED_OR_TIMEOUT');
            requireThat(response && response.provider === p.provider && response.model === p.model, 'RESPONSE_IDENTITY');
            const usage = response.usage;
            requireThat(usage && Number.isSafeInteger(usage.inputTokens) && usage.inputTokens >= 0
                && usage.inputTokens <= p.maxInputTokens && Number.isSafeInteger(usage.outputTokens)
                && usage.outputTokens >= 0 && usage.outputTokens <= p.maxOutputTokens, 'USAGE_UNKNOWN');
            const valid = typeof response.output === 'string' && response.output.trim().length > 0
                && Buffer.byteLength(response.output, 'utf8') <= p.maxOutputTokens * 8
                && response.finishReason === 'stop';
            const receipt: ReadoutReceipt = { id: randomUUID(), stage, planSha256: this.planSha256, inputSha256,
                outputSha256: sha(typeof response.output === 'string' ? response.output : ''),
                provider: p.provider, model: p.model, pricingIdentity: p.pricing.identity,
                inputTokens: usage!.inputTokens, outputTokens: usage!.outputTokens,
                costMicrounits: this.cost(usage!.inputTokens, usage!.outputTokens),
                parentOutputSha256: request.review?.parentOutputSha256 ?? null,
                reviewSha256: request.review ? sha(canonical(request.review)) : null };
            this.update(record => {
                requireThat(record.stages[stage].status === 'STARTED', 'SETTLEMENT_CONFLICT');
                record.quota = transitionActionQuota(record.quota, stage, 'settle', receipt.costMicrounits);
                Object.assign(record.stages[stage], { status: valid ? 'VALID' : 'FAILED', receipt });
            });
            requireThat(!cancelled, 'CANCELLED_OR_TIMEOUT');
            requireThat(valid, 'OUTPUT_REJECTED');
            if (stage === 'initial') this.deliveredInitialReceiptId = receipt.id;
            return { output: response.output, receipt };
        } catch (error) {
            if (stage === 'initial') this.deliveredInitialReceiptId = null;
            // Preserve consumed reservation on timeout, missing usage, transport or commit ambiguity.
            try { this.update(record => {
                if (record.stages[stage].status === 'STARTED') {
                    record.quota = transitionActionQuota(record.quota, stage, 'unknown');
                    record.stages[stage].status = 'UNKNOWN';
                } else if (record.stages[stage].status === 'VALID') {
                    // Commit may have completed despite an ambiguous acknowledgement.
                    // Retain known cost but prohibit a revision based on this failed delivery.
                    record.stages[stage].status = 'UNKNOWN';
                }
            }); } catch {
                // No refund/retry. Even if VALID remains durable, no successful in-memory
                // delivery acknowledgement exists, so revision also requires reconciliation.
            }
            throw new ReadoutDenied(error instanceof ReadoutDenied ? error.code : 'EXECUTION_UNKNOWN');
        } finally {
            clearTimeout(timer);
            signal?.removeEventListener('abort', onAbort);
        }
    }

    private cost(input: number, output: number): number {
        const nano = input * this.plan.pricing.inputNanoUsdPerToken + output * this.plan.pricing.outputNanoUsdPerToken;
        requireThat(Number.isSafeInteger(nano), 'COST_RANGE');
        return Math.ceil(nano / 1000);
    }

    private record(row: AtomicSQLiteRow | undefined): RunRecord {
        requireThat(row && typeof row.value === 'object' && row.value !== null, 'RUN_MISSING');
        const value = clone(row!.value) as RunRecord;
        requireThat(value.planSha256 === this.planSha256, 'PLAN_DRIFT');
        value.quota = validateActionQuota(value.quota);
        requireThat(value.quota.scopeId === this.plan.runId && value.quota.reservationId === this.planSha256
            && value.quota.currency === 'USD' && value.quota.totalMicrounits === this.plan.totalMicrounits
            && Object.keys(value.quota.stages).sort().join(',') === 'initial,revision'
            && value.stages && Object.keys(value.stages).sort().join(',') === 'initial,revision', 'RECORD_INVALID');
        for (const key of STAGES) {
            const current = value.stages[key];
            const state = value.quota.stages[key];
            requireThat(state.allocation === this.allocation && current && (
                (current.status === 'NOT_STARTED' && state.state === 'RESERVED')
                || (current.status === 'STARTED' && state.state === 'STARTED')
                || (current.status === 'UNKNOWN' && (state.state === 'UNKNOWN'
                    || (state.state === 'SETTLED' && current.receipt && current.receipt.costMicrounits === state.cost)))
                || (['VALID', 'FAILED'].includes(current.status) && state.state === 'SETTLED' && current.receipt
                    && current.receipt.planSha256 === this.planSha256 && current.receipt.stage === key
                    && current.receipt.costMicrounits === state.cost)), 'RECORD_INVALID');
        }
        return value;
    }

    private update(change: (record: RunRecord) => void): void {
        this.store.transaction(rows => {
            const row = rows.find(item => item.id === this.id);
            const record = this.record(row);
            change(record);
            return { writes: [{ id: this.id, expectedRevision: row!.revision, value: record }], result: undefined };
        });
    }
}
