// Text Encoding Exception: Vietnamese user-facing rate-limit messages use UTF-8.
import { readRetryAfterSeconds } from './rate-limit-refusal';

const DEFAULT_RETRY_DELAY_SECONDS = 2;
export const MAX_ASSISTANT_RETRY_DELAY_SECONDS = 30;

export class AssistantRateLimitError extends Error {
    constructor(public readonly retryAfter: string | null) {
        super('HTTP 429');
        this.name = 'AssistantRateLimitError';
    }
}

export function assistantRetryDelaySeconds(retryAfter: string | null): number {
    const value = retryAfter?.trim();
    if (!value) return DEFAULT_RETRY_DELAY_SECONDS;
    if (/^\d+$/.test(value)) {
        // A wait above the ordinary parser's range must not become a quick retry.
        return readRetryAfterSeconds(value) ?? (Number(value) > 0 ? Infinity : DEFAULT_RETRY_DELAY_SECONDS);
    }
    const date = Date.parse(value);
    return Number.isFinite(date) ? Math.max(1, Math.ceil((date - Date.now()) / 1000)) : DEFAULT_RETRY_DELAY_SECONDS;
}

export function assistantRateLimitMessage(
    isVi: boolean,
    state: 'waiting' | 'limited' | 'interrupted',
    delaySeconds?: number,
): string {
    const wait = delaySeconds && Number.isFinite(delaySeconds);
    if (isVi) {
        if (state === 'waiting') return `Có quá nhiều yêu cầu. Tôi sẽ thử lại sau ${delaySeconds} giây.`;
        const reason = state === 'interrupted' ? 'Câu trả lời đã bị gián đoạn.' : 'Có quá nhiều yêu cầu.';
        return `${reason} ${wait ? `Vui lòng chờ ít nhất ${delaySeconds} giây rồi thử lại.` : 'Vui lòng chờ một lát rồi thử lại.'}`;
    }
    if (state === 'waiting') return `Too many requests. I’ll try again in ${delaySeconds} seconds.`;
    const reason = state === 'interrupted' ? 'The reply was interrupted.' : 'Too many requests.';
    return `${reason} ${wait ? `Please wait at least ${delaySeconds} seconds and try again.` : 'Please wait a moment and try again.'}`;
}

export function waitForAssistantRetry(seconds: number, signal: AbortSignal): Promise<boolean> {
    if (signal.aborted) return Promise.resolve(false);
    return new Promise(resolve => {
        const timer = setTimeout(() => {
            signal.removeEventListener('abort', cancel);
            resolve(true);
        }, seconds * 1000);
        function cancel() {
            clearTimeout(timer);
            resolve(false);
        }
        signal.addEventListener('abort', cancel, { once: true });
    });
}
