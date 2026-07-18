/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
    getRateLimitBackendStatus,
    getRateLimiter,
    resetRateLimitStoresForTest,
    type RateLimitRedisClient,
} from './rate-limit';

function makeRequest(ip = '1.2.3.4', headers: Record<string, string> = {}): NextRequest {
    const h = new Headers(headers);
    if (!headers['x-forwarded-for'] && !headers['x-real-ip'] && !headers['cf-connecting-ip']) {
        h.set('x-forwarded-for', ip);
    }
    return new NextRequest('http://localhost/api/test', { headers: h });
}

class FakeRedisClient implements RateLimitRedisClient {
    readonly counts = new Map<string, number>();
    readonly expirations = new Map<string, number>();

    async incr(key: string): Promise<number> {
        const nextCount = (this.counts.get(key) ?? 0) + 1;
        this.counts.set(key, nextCount);
        return nextCount;
    }

    async expire(key: string, seconds: number): Promise<unknown> {
        this.expirations.set(key, seconds);
        return 1;
    }

    async ttl(key: string): Promise<number> {
        return this.expirations.get(key) ?? 60;
    }
}

describe('rate-limit', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
        delete process.env.CVF_RATE_LIMIT_STORE;
        delete process.env.UPSTASH_REDIS_REST_URL;
        delete process.env.UPSTASH_REDIS_REST_TOKEN;
        resetRateLimitStoresForTest();
    });

    it('allows requests within limit', async () => {
        process.env.CVF_RATE_LIMIT = '5';
        const limiter = getRateLimiter();
        const req = makeRequest('10.0.0.1');
        for (let i = 0; i < 5; i++) {
            const res = await limiter.consume(req);
            expect(res.allowed).toBe(true);
        }
    });

    it('blocks requests over limit', async () => {
        process.env.CVF_RATE_LIMIT = '3';
        const limiter = getRateLimiter();
        const req = makeRequest('10.0.0.2');
        await limiter.consume(req);
        await limiter.consume(req);
        await limiter.consume(req);
        const res = await limiter.consume(req);
        expect(res.allowed).toBe(false);
        expect(res.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('uses userId when provided', async () => {
        process.env.CVF_RATE_LIMIT = '2';
        const limiter = getRateLimiter();
        const req = makeRequest('10.0.0.3');
        await limiter.consume(req, 'user-a');
        await limiter.consume(req, 'user-a');
        const res = await limiter.consume(req, 'user-a');
        expect(res.allowed).toBe(false);
    });

    it('isolates distinct service caller identities', async () => {
        process.env.CVF_RATE_LIMIT = '1';
        const limiter = getRateLimiter();
        const req = makeRequest('10.0.0.30');

        expect((await limiter.consume(req, 'service:alpha')).allowed).toBe(true);
        expect((await limiter.consume(req, 'service:beta')).allowed).toBe(true);
    });

    it('enforces provider quota separately', async () => {
        process.env.CVF_RATE_LIMIT = '100';
        process.env.CVF_PROVIDER_QUOTA_PER_MIN = '2';
        const limiter = getRateLimiter();
        const req = makeRequest('10.0.0.4');
        await limiter.consume(req, undefined, 'openai');
        await limiter.consume(req, undefined, 'openai');
        const res = await limiter.consume(req, undefined, 'openai');
        expect(res.allowed).toBe(false);
    });

    it('allows different providers independently', async () => {
        process.env.CVF_RATE_LIMIT = '100';
        process.env.CVF_PROVIDER_QUOTA_PER_MIN = '2';
        const limiter = getRateLimiter();
        const req = makeRequest('10.0.0.5');
        await limiter.consume(req, undefined, 'openai');
        await limiter.consume(req, undefined, 'openai');
        const res = await limiter.consume(req, undefined, 'gemini');
        expect(res.allowed).toBe(true);
    });

    it('extracts IP from x-forwarded-for first value', async () => {
        process.env.CVF_RATE_LIMIT = '1';
        const limiter = getRateLimiter();
        const req1 = makeRequest('', { 'x-forwarded-for': '1.1.1.1, 2.2.2.2' });
        const req2 = makeRequest('', { 'x-forwarded-for': '1.1.1.1' });
        await limiter.consume(req1);
        const res = await limiter.consume(req2);
        expect(res.allowed).toBe(false);
    });

    it('falls back to x-real-ip', async () => {
        process.env.CVF_RATE_LIMIT = '1';
        const limiter = getRateLimiter();
        const req = makeRequest('', { 'x-real-ip': '3.3.3.3' });
        await limiter.consume(req);
        const res = await limiter.consume(req);
        expect(res.allowed).toBe(false);
    });

    it('falls back to cf-connecting-ip', async () => {
        process.env.CVF_RATE_LIMIT = '1';
        const limiter = getRateLimiter();
        const req = makeRequest('', { 'cf-connecting-ip': '4.4.4.4' });
        await limiter.consume(req);
        const res = await limiter.consume(req);
        expect(res.allowed).toBe(false);
    });

    it('returns retryAfterSeconds when blocked', async () => {
        process.env.CVF_RATE_LIMIT = '1';
        const limiter = getRateLimiter();
        const req = makeRequest('10.0.0.99');
        await limiter.consume(req);
        const res = await limiter.consume(req);
        expect(res.allowed).toBe(false);
        expect(res.retryAfterSeconds).toBeGreaterThanOrEqual(1);
        expect(res.retryAfterSeconds).toBeLessThanOrEqual(60);
    });

    it('reports process-local memory backend by default', () => {
        const status = getRateLimitBackendStatus();

        expect(status).toMatchObject({
            schemaVersion: 'cvf.rateLimitBackend.v1',
            configuredStore: 'memory',
            activeStore: 'memory',
            distributed: false,
            configurationStatus: 'ACTIVE_MEMORY_PROCESS_LOCAL',
            claimBoundary: 'process_local_memory_only_no_distributed_rate_limit_claim',
        });
    });

    it('fails closed when redis backend is requested without Upstash env', async () => {
        process.env.CVF_RATE_LIMIT_STORE = 'redis';
        process.env.CVF_RATE_LIMIT = '100';
        const limiter = getRateLimiter();
        const req = makeRequest('10.0.0.200');

        const res = await limiter.consume(req);

        expect(res.allowed).toBe(false);
        expect(res.retryAfterSeconds).toBe(60);
        expect(res.backendStatus).toMatchObject({
            configuredStore: 'redis',
            activeStore: 'none',
            distributed: false,
            configurationStatus: 'BLOCKED_REDIS_ENV_MISSING',
            claimBoundary: 'redis_requested_but_upstash_url_and_token_missing_no_distributed_rate_limit_claim',
        });
    });

    it('reports redis backend active only with complete env and does not expose token', () => {
        const status = getRateLimitBackendStatus({
            ...process.env,
            CVF_RATE_LIMIT_STORE: 'redis',
            UPSTASH_REDIS_REST_URL: 'https://example-upstash.test',
            UPSTASH_REDIS_REST_TOKEN: 'secret-token-value',
        });

        expect(status).toMatchObject({
            configuredStore: 'redis',
            activeStore: 'redis',
            distributed: true,
            configurationStatus: 'ACTIVE_REDIS_REST',
            claimBoundary: 'redis_rest_adapter_active_hosted_enforcement_depends_on_configured_external_service',
        });
        expect(JSON.stringify(status)).not.toContain('secret-token-value');
    });

    it('fails closed when redis URL env is malformed', async () => {
        const env = {
            ...process.env,
            CVF_RATE_LIMIT_STORE: 'redis',
            UPSTASH_REDIS_REST_URL: 'not-a-url',
            UPSTASH_REDIS_REST_TOKEN: 'secret-token-value',
        };
        const limiter = getRateLimiter({ env });
        const req = makeRequest('10.0.0.204');

        const res = await limiter.consume(req);

        expect(res.allowed).toBe(false);
        expect(res.backendStatus).toMatchObject({
            configuredStore: 'redis',
            activeStore: 'none',
            distributed: false,
            configurationStatus: 'BLOCKED_REDIS_ENV_INVALID',
            claimBoundary: 'redis_requested_but_upstash_url_invalid_no_distributed_rate_limit_claim',
        });
        expect(JSON.stringify(res.backendStatus)).not.toContain('secret-token-value');
    });

    it('enforces redis user limit through injected Redis command semantics', async () => {
        const redisClient = new FakeRedisClient();
        const env = {
            ...process.env,
            CVF_RATE_LIMIT_STORE: 'redis',
            CVF_RATE_LIMIT: '2',
            UPSTASH_REDIS_REST_URL: 'https://example-upstash.test',
            UPSTASH_REDIS_REST_TOKEN: 'secret-token-value',
        };
        const limiter = getRateLimiter({ env, redisClient, redisKeyPrefix: 'test:rl:user' });
        const req = makeRequest('10.0.0.202');

        expect((await limiter.consume(req)).allowed).toBe(true);
        expect((await limiter.consume(req)).allowed).toBe(true);
        const blocked = await limiter.consume(req);

        expect(blocked.allowed).toBe(false);
        expect(blocked.backendStatus.configurationStatus).toBe('ACTIVE_REDIS_REST');
        expect(blocked.backendStatus.distributed).toBe(true);
        expect(redisClient.expirations.size).toBeGreaterThan(0);
    });

    it('enforces redis provider quota independently through injected Redis command semantics', async () => {
        const redisClient = new FakeRedisClient();
        const env = {
            ...process.env,
            CVF_RATE_LIMIT_STORE: 'redis',
            CVF_RATE_LIMIT: '100',
            CVF_PROVIDER_QUOTA_PER_MIN: '1',
            UPSTASH_REDIS_REST_URL: 'https://example-upstash.test',
            UPSTASH_REDIS_REST_TOKEN: 'secret-token-value',
        };
        const limiter = getRateLimiter({ env, redisClient, redisKeyPrefix: 'test:rl:provider' });
        const req = makeRequest('10.0.0.203');

        expect((await limiter.consume(req, undefined, 'openai')).allowed).toBe(true);
        expect((await limiter.consume(req, undefined, 'openai')).allowed).toBe(false);
        expect((await limiter.consume(req, undefined, 'gemini')).allowed).toBe(true);
    });

    it('fails closed when an unsupported backend is configured', async () => {
        process.env.CVF_RATE_LIMIT_STORE = 'database';
        const limiter = getRateLimiter();
        const req = makeRequest('10.0.0.201');

        const res = await limiter.consume(req);

        expect(res.allowed).toBe(false);
        expect(res.backendStatus).toMatchObject({
            configuredStore: 'database',
            activeStore: 'none',
            distributed: false,
            configurationStatus: 'BLOCKED_UNSUPPORTED_STORE',
            claimBoundary: 'unsupported_rate_limit_store_no_distributed_rate_limit_claim',
        });
    });
});
