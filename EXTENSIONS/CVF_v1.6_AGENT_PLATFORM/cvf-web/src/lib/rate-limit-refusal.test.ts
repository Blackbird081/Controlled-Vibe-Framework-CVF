// Text Encoding Exception: Vietnamese user-facing refusal copy requires UTF-8.
import { describe, expect, it } from 'vitest';
import { rateLimitRefusalMessage, readRetryAfterSeconds } from './rate-limit-refusal';

describe('rate-limit refusal reason', () => {
  it('reads the wait from the Retry-After header first, then from the body', () => {
    expect(readRetryAfterSeconds('30', 5)).toBe(30);
    expect(readRetryAfterSeconds(' 12 ')).toBe(12);
    expect(readRetryAfterSeconds(null, 7)).toBe(7);
    expect(readRetryAfterSeconds(undefined, '9')).toBe(9);
  });

  it.each([
    ['missing', null, undefined],
    ['zero', '0', 0],
    ['negative', '-5', -5],
    ['fractional', '1.5', 1.5],
    ['HTTP date', 'Wed, 21 Oct 2026 07:28:00 GMT', undefined],
    ['absurdly long', '999999999', undefined],
  ])('does not invent a wait for a %s value', (_label, header, body) => {
    expect(readRetryAfterSeconds(header as string | null, body)).toBeNull();
  });

  it('states the refusal, that the call was not sent and the wait, in both languages', () => {
    const vi = rateLimitRefusalMessage(30, true);
    expect(vi).toContain('quá nhiều yêu cầu'); expect(vi).toContain('không gửi lần gọi này tới AI'); expect(vi).toContain('khoảng 30 giây');
    const en = rateLimitRefusalMessage(30, false);
    expect(en).toContain('Too many requests'); expect(en).toContain('did not send this call to the AI'); expect(en).toContain('about 30 seconds');
  });

  it('asks for a short wait without a number when the server gave none', () => {
    expect(rateLimitRefusalMessage(null, true)).toContain('Hãy chờ một lát');
    expect(rateLimitRefusalMessage(null, false)).toContain('Wait a moment');
    expect(rateLimitRefusalMessage(null, false)).not.toMatch(/\d/);
  });
});
