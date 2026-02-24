/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { getRateLimiter } from './rate-limit';
import { NextRequest } from 'next/server';

function makeRequest(ip = '1.2.3.4', headers: Record<string, string> = {}): NextRequest {
    const h = new Headers(headers);
    if (!headers['x-forwarded-for'] && !headers['x-real-ip'] && !headers['cf-connecting-ip']) {
        h.set('x-forwarded-for', ip);
    }
    return new NextRequest('http://localhost/api/test', { headers: h });
}

describe('rate-limit', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
    });

    it('allows requests within limit', () => {
        process.env.CVF_RATE_LIMIT = '5';
        const limiter = getRateLimiter();
        const req = makeRequest('10.0.0.1');
        for (let i = 0; i < 5; i++) {
            const res = limiter.consume(req);
            expect(res.allowed).toBe(true);
        }
    });

    it('blocks requests over limit', () => {
        process.env.CVF_RATE_LIMIT = '3';
        const limiter = getRateLimiter();
        const req = makeRequest('10.0.0.2');
        // Consume 3 (allowed) + 1 more (blocked)
        limiter.consume(req);
        limiter.consume(req);
        limiter.consume(req);
        const res = limiter.consume(req);
        expect(res.allowed).toBe(false);
        expect(res.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('uses userId when provided', () => {
        process.env.CVF_RATE_LIMIT = '2';
        const limiter = getRateLimiter();
        const req = makeRequest('10.0.0.3');
        limiter.consume(req, 'user-a');
        limiter.consume(req, 'user-a');
        const res = limiter.consume(req, 'user-a');
        expect(res.allowed).toBe(false);
    });

    it('enforces provider quota separately', () => {
        process.env.CVF_RATE_LIMIT = '100';
        process.env.CVF_PROVIDER_QUOTA_PER_MIN = '2';
        const limiter = getRateLimiter();
        const req = makeRequest('10.0.0.4');
        limiter.consume(req, undefined, 'openai');
        limiter.consume(req, undefined, 'openai');
        const res = limiter.consume(req, undefined, 'openai');
        expect(res.allowed).toBe(false);
    });

    it('allows different providers independently', () => {
        process.env.CVF_RATE_LIMIT = '100';
        process.env.CVF_PROVIDER_QUOTA_PER_MIN = '2';
        const limiter = getRateLimiter();
        const req = makeRequest('10.0.0.5');
        limiter.consume(req, undefined, 'openai');
        limiter.consume(req, undefined, 'openai');
        // openai is now at limit, but gemini should still work
        const res = limiter.consume(req, undefined, 'gemini');
        expect(res.allowed).toBe(true);
    });

    it('extracts IP from x-forwarded-for first value', () => {
        process.env.CVF_RATE_LIMIT = '1';
        const limiter = getRateLimiter();
        const req1 = makeRequest('', { 'x-forwarded-for': '1.1.1.1, 2.2.2.2' });
        const req2 = makeRequest('', { 'x-forwarded-for': '1.1.1.1' });
        limiter.consume(req1);
        // Same IP (1.1.1.1) should be rate limited
        const res = limiter.consume(req2);
        expect(res.allowed).toBe(false);
    });

    it('falls back to x-real-ip', () => {
        process.env.CVF_RATE_LIMIT = '1';
        const limiter = getRateLimiter();
        const req = makeRequest('', { 'x-real-ip': '3.3.3.3' });
        limiter.consume(req);
        const res = limiter.consume(req);
        expect(res.allowed).toBe(false);
    });

    it('falls back to cf-connecting-ip', () => {
        process.env.CVF_RATE_LIMIT = '1';
        const limiter = getRateLimiter();
        const req = makeRequest('', { 'cf-connecting-ip': '4.4.4.4' });
        limiter.consume(req);
        const res = limiter.consume(req);
        expect(res.allowed).toBe(false);
    });

    it('returns retryAfterSeconds when blocked', () => {
        process.env.CVF_RATE_LIMIT = '1';
        const limiter = getRateLimiter();
        const req = makeRequest('10.0.0.99');
        limiter.consume(req);
        const res = limiter.consume(req);
        expect(res.allowed).toBe(false);
        expect(res.retryAfterSeconds).toBeGreaterThanOrEqual(1);
        expect(res.retryAfterSeconds).toBeLessThanOrEqual(60);
    });
});
