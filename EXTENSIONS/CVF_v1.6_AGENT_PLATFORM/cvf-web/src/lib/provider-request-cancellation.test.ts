import { afterEach, describe, expect, it, vi } from 'vitest';
import { composeProviderRequestSignal, REQUEST_CANCELLED_MESSAGE, PROVIDER_DEADLINE_MESSAGE } from './provider-request-cancellation';

afterEach(() => vi.useRealTimers());

describe('request/deadline composition', () => {
    it('retains request as first cause and disposes the timer', () => {
        vi.useFakeTimers();
        const incoming = new AbortController();
        const scope = composeProviderRequestSignal(incoming.signal, 1000);
        incoming.abort('private reason');
        expect(scope.signal.aborted).toBe(true);
        expect(scope.cause()).toBe('request');
        expect(() => scope.throwIfTerminal()).toThrow(REQUEST_CANCELLED_MESSAGE);
        scope.dispose();
        expect(vi.getTimerCount()).toBe(0);
        vi.advanceTimersByTime(2000);
        expect(scope.cause()).toBe('request');
    });

    it('retains deadline as first cause and disposes the request listener', () => {
        vi.useFakeTimers();
        const incoming = new AbortController();
        const remove = vi.spyOn(incoming.signal, 'removeEventListener');
        const scope = composeProviderRequestSignal(incoming.signal, 1000);
        vi.advanceTimersByTime(1000);
        expect(scope.cause()).toBe('deadline');
        expect(() => scope.throwIfTerminal()).toThrow(PROVIDER_DEADLINE_MESSAGE);
        scope.dispose();
        expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
        incoming.abort('late private reason');
        expect(scope.cause()).toBe('deadline');
    });
});
