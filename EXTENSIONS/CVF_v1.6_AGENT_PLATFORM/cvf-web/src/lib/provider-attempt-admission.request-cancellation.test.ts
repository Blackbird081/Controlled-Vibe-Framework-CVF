import { beforeEach, describe, expect, it, vi } from 'vitest';

const consume = vi.hoisted(() => vi.fn());
vi.mock('./rate-limit', () => ({ getRateLimiter: () => ({ consumeProviderAttempt: consume }) }));

import { admitAndInvokeProvider, buildProviderAttemptReconciliation, buildProviderRequestCancelledResponse, createProviderAttemptLedger } from './provider-attempt-admission';

const ledger = () => createProviderAttemptLedger({ identityKind: 'session', identityHash: 'synthetic-user', providerModel: 'alibaba:qwen-flash' });
const setup = (signal?: AbortSignal) => {
    const attempts = ledger();
    const invoke = vi.fn(async () => ({ success: true, output: 'synthetic output' }));
    const run = () => admitAndInvokeProvider({
        ledger: attempts, purpose: 'initial', invoke,
        onDenied: () => buildProviderRequestCancelledResponse({ ledger: attempts, routedProvider: 'alibaba' }),
        routedProvider: 'alibaba', requestedModel: 'qwen-flash',
        errorLogLabel: 'test', errorFallbackMessage: 'test',
        requestSignal: signal,
        onCancelled: () => buildProviderRequestCancelledResponse({ ledger: attempts, routedProvider: 'alibaba', requestedModel: 'qwen-flash' }),
    });
    return { attempts, invoke, run };
};

beforeEach(() => { consume.mockReset().mockResolvedValue({ allowed: true, retryAfterSeconds: 0 }); });

describe('admission cancellation boundary', () => {
    it('preaborted request neither reserves nor starts', async () => {
        const incoming = new AbortController();
        incoming.abort('private reason');
        const { attempts, invoke, run } = setup(incoming.signal);
        const result = await run();
        expect(result.ok).toBe(false);
        expect(consume).not.toHaveBeenCalled();
        expect(invoke).not.toHaveBeenCalled();
        expect(buildProviderAttemptReconciliation(attempts, 'alibaba', 'qwen-flash')).toMatchObject({ admittedAttemptCount: 0, providerCallCount: 0, reconciles: true });
    });

    it('cancellation while admission is pending preserves reservation but prevents call start', async () => {
        let grant!: (value: { allowed: boolean; retryAfterSeconds: number }) => void;
        consume.mockImplementation(() => new Promise(resolve => { grant = resolve; }));
        const incoming = new AbortController();
        const { attempts, invoke, run } = setup(incoming.signal);
        const pending = run();
        expect(consume).toHaveBeenCalledTimes(1);
        incoming.abort('private reason');
        grant({ allowed: true, retryAfterSeconds: 0 });
        const result = await pending;
        expect(result.ok).toBe(false);
        expect(invoke).not.toHaveBeenCalled();
        const reconciliation = buildProviderAttemptReconciliation(attempts, 'alibaba', 'qwen-flash');
        expect(reconciliation).toMatchObject({ admittedAttemptCount: 1, providerCallCount: 0, reconciles: false });
        if (!result.ok) {
            expect(result.response.status).toBe(499);
            expect(await result.response.json()).toMatchObject({ diagnostic: { class: 'request_cancelled', retryable: false, userAction: 'none' } });
        }
    });

    it('ignores a late provider success after call start', async () => {
        let complete!: (value: { success: boolean; output: string }) => void;
        const incoming = new AbortController();
        const { attempts, invoke, run } = setup(incoming.signal);
        invoke.mockImplementation(() => new Promise(resolve => { complete = resolve; }));
        const pending = run();
        await Promise.resolve();
        await Promise.resolve();
        incoming.abort('private reason');
        complete({ success: true, output: 'late output' });
        const result = await pending;
        expect(result.ok).toBe(false);
        expect(buildProviderAttemptReconciliation(attempts, 'alibaba', 'qwen-flash')).toMatchObject({ admittedAttemptCount: 1, providerCallCount: 1, reconciles: true });
    });

    it('keeps an absent-signal neighbor successful', async () => {
        const { attempts, run } = setup();
        expect((await run()).ok).toBe(true);
        expect(buildProviderAttemptReconciliation(attempts, 'alibaba', 'qwen-flash').reconciles).toBe(true);
    });
});


import { buildJevCanonicalAttemptBoundary } from './canonical-web-gateway-execution';
import type { AdapterAdmissionRecord } from 'cvf-model-gateway';
const jevAdmission={status:'admitted',providerId:'typesafe',modelId:'jev-latest',requestedMethod:'system_one',normalizedMethod:'system_one',supportedMethods:['system_one'],conformanceStatus:'conformant',liveExecutionAuthorized:false} as unknown as AdapterAdmissionRecord;
it('Jev cancellation during rate reservation retains admitted index and prevents custody/invocation',async()=>{
    let resolve!: (value:{allowed:boolean;retryAfterSeconds:number})=>void;
    consume.mockImplementation(()=>new Promise(done=>{resolve=done;}));
    const attempts=ledger();const abort=new AbortController();const commit=vi.fn();const retained=vi.fn();
    const run=buildJevCanonicalAttemptBoundary({canonicalExecutionId:'env-jev-cancel',stageId:'wide',ledger:attempts,admission:jevAdmission,signal:abort.signal,verifyAndCommitStart:commit,onRetainedReservation:retained});
    const promise=run({canonicalExecutionId:'env-jev-cancel',traceId:'env-jev-cancel',providerId:'typesafe',modelId:'jev-latest'});
    abort.abort();resolve({allowed:true,retryAfterSeconds:0});
    expect(await promise).toMatchObject({decision:'deny',attemptIndex:0,reason:'RESERVATION_RETAINED_NO_INVOCATION'});
    expect(commit).not.toHaveBeenCalled();expect(retained).toHaveBeenCalledOnce();
    expect(attempts.attempts[0].retainedReservation).toBe('RESERVATION_RETAINED_NO_INVOCATION');
    expect(buildProviderAttemptReconciliation(attempts,'typesafe','jev-latest')).toMatchObject({admittedAttemptCount:1,providerCallCount:0,reconciles:false});
});
