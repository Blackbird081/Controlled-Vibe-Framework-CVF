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
