/** Local request/deadline composition for the selected Alibaba text call. */
export const REQUEST_CANCELLED_MESSAGE = 'The request was cancelled before execution completed.';
export const PROVIDER_DEADLINE_MESSAGE = 'The provider call exceeded the configured timeout.';

export type ProviderAbortCause = 'request' | 'deadline' | null;

export function composeProviderRequestSignal(requestSignal: AbortSignal | undefined, timeoutMs: number) {
    const controller = new AbortController();
    let cause: ProviderAbortCause = null;
    const abort = (next: Exclude<ProviderAbortCause, null>) => {
        if (cause) return;
        cause = next;
        controller.abort(); // Never propagate requestSignal.reason into provider or diagnostic data.
    };
    const onRequestAbort = () => abort('request');
    if (requestSignal?.aborted) onRequestAbort();
    else requestSignal?.addEventListener('abort', onRequestAbort, { once: true });
    const timer = setTimeout(() => abort('deadline'), timeoutMs);
    const dispose = () => {
        clearTimeout(timer);
        requestSignal?.removeEventListener('abort', onRequestAbort);
    };
    const throwIfTerminal = () => {
        if (cause === 'request') throw new Error(REQUEST_CANCELLED_MESSAGE);
        if (cause === 'deadline') throw new Error(PROVIDER_DEADLINE_MESSAGE);
    };
    return { signal: controller.signal, cause: () => cause, throwIfTerminal, dispose };
}
