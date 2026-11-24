// Text Encoding Exception: Vietnamese user-facing refusal copy requires UTF-8.
/**
 * User-facing reason for a rate-limit refusal (HTTP 429, diagnostic class `rate_limited`), from either the
 * per-minute request limiter or the provider-attempt quota gate. Both refuse before this call reaches the AI.
 * The wait time comes only from the server's Retry-After; nothing is invented when it is missing.
 */
const MAX_REASONABLE_WAIT_SECONDS = 24 * 60 * 60;

/** Returns the server-stated wait in whole seconds, from the Retry-After header or the body field; otherwise null. */
export function readRetryAfterSeconds(header: string | null | undefined, bodyValue?: unknown): number | null {
  const candidates = [header?.trim(), bodyValue];
  for (const value of candidates) {
    const seconds = typeof value === 'number' ? value : typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : NaN;
    if (Number.isInteger(seconds) && seconds > 0 && seconds <= MAX_REASONABLE_WAIT_SECONDS) return seconds;
  }
  return null;
}

export function rateLimitRefusalMessage(retryAfterSeconds: number | null, isVi: boolean): string {
  if (isVi) {
    const wait = retryAfterSeconds ? `Hãy chờ khoảng ${retryAfterSeconds} giây rồi chạy lại.` : 'Hãy chờ một lát rồi chạy lại.';
    return `Bạn đã gửi quá nhiều yêu cầu trong thời gian ngắn, nên CVF tạm chưa nhận yêu cầu này. CVF không gửi lần gọi này tới AI. ${wait}`;
  }
  const wait = retryAfterSeconds ? `Wait about ${retryAfterSeconds} seconds, then run again.` : 'Wait a moment, then run again.';
  return `Too many requests in a short time, so CVF did not accept this request yet. CVF did not send this call to the AI. ${wait}`;
}
