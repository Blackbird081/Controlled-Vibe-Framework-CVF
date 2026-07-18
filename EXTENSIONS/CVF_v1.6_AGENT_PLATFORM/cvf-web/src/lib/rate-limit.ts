import { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';

type Bucket = { count: number; resetAt: number };
const WINDOW_MS = 60 * 1000;
const UNSUPPORTED_BACKEND_RETRY_AFTER_SECONDS = 60;

export type RateLimitBackendStatus = {
    schemaVersion: 'cvf.rateLimitBackend.v1';
    configuredStore: string;
    activeStore: 'memory' | 'redis' | 'none';
    distributed: boolean;
    configurationStatus:
        | 'ACTIVE_MEMORY_PROCESS_LOCAL'
        | 'ACTIVE_REDIS_REST'
        | 'BLOCKED_REDIS_ENV_MISSING'
        | 'BLOCKED_REDIS_ENV_INVALID'
        | 'BLOCKED_UNSUPPORTED_STORE';
    claimBoundary: string;
};

type RateLimitResult = {
    allowed: boolean;
    retryAfterSeconds: number;
    backendStatus: RateLimitBackendStatus;
};

export interface RateLimitStore {
    consume(key: string, limit: number, now?: number): Promise<RateLimitResult>;
    reset(): void;
}

export interface RateLimitRedisClient {
    incr(key: string): Promise<number>;
    expire(key: string, seconds: number): Promise<unknown>;
    ttl(key: string): Promise<number>;
}

export class MemoryRateLimitStore implements RateLimitStore {
    private readonly buckets = new Map<string, Bucket>();

    async consume(key: string, limit: number, now = Date.now()): Promise<RateLimitResult> {
        const bucket = this.buckets.get(key) || { count: 0, resetAt: now + WINDOW_MS };
        if (now > bucket.resetAt) {
            bucket.count = 0;
            bucket.resetAt = now + WINDOW_MS;
        }
        bucket.count += 1;
        this.buckets.set(key, bucket);
        if (bucket.count > limit) {
            const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
            return { allowed: false, retryAfterSeconds, backendStatus: memoryBackendStatus() };
        }
        return { allowed: true, retryAfterSeconds: 0, backendStatus: memoryBackendStatus() };
    }

    reset(): void {
        this.buckets.clear();
    }
}

export class UpstashRedisRateLimitStore implements RateLimitStore {
    constructor(
        private readonly client: RateLimitRedisClient,
        private readonly backendStatus: RateLimitBackendStatus,
        private readonly keyPrefix = 'cvf:rate-limit',
    ) { }

    async consume(key: string, limit: number): Promise<RateLimitResult> {
        const redisKey = `${this.keyPrefix}:${encodeURIComponent(key)}`;
        const count = await this.client.incr(redisKey);
        if (count === 1) {
            await this.client.expire(redisKey, WINDOW_MS / 1000);
        }
        if (count > limit) {
            const ttl = await this.client.ttl(redisKey);
            return {
                allowed: false,
                retryAfterSeconds: Math.max(1, ttl > 0 ? ttl : WINDOW_MS / 1000),
                backendStatus: this.backendStatus,
            };
        }
        return { allowed: true, retryAfterSeconds: 0, backendStatus: this.backendStatus };
    }

    reset(): void {
        // Redis state is owned by the configured external store, not process-local tests.
    }
}

const userStore = new MemoryRateLimitStore();
const providerStore = new MemoryRateLimitStore();

function limits(env: NodeJS.ProcessEnv = process.env) {
    return {
        maxRequests: Number(env.CVF_RATE_LIMIT ?? 30),
        providerQuota: Number(env.CVF_PROVIDER_QUOTA_PER_MIN ?? 30),
    };
}

function getClientIp(headers: Headers): string {
    const forwarded = headers.get('x-forwarded-for') || headers.get('x-real-ip');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return headers.get('cf-connecting-ip') || 'unknown';
}

function memoryBackendStatus(): RateLimitBackendStatus {
    return {
        schemaVersion: 'cvf.rateLimitBackend.v1',
        configuredStore: 'memory',
        activeStore: 'memory',
        distributed: false,
        configurationStatus: 'ACTIVE_MEMORY_PROCESS_LOCAL',
        claimBoundary: 'process_local_memory_only_no_distributed_rate_limit_claim',
    };
}

function redisBackendStatus(): RateLimitBackendStatus {
    return {
        schemaVersion: 'cvf.rateLimitBackend.v1',
        configuredStore: 'redis',
        activeStore: 'redis',
        distributed: true,
        configurationStatus: 'ACTIVE_REDIS_REST',
        claimBoundary: 'redis_rest_adapter_active_hosted_enforcement_depends_on_configured_external_service',
    };
}

function hasValidUrl(value: string): boolean {
    try {
        new URL(value);
        return true;
    } catch {
        return false;
    }
}

function blockedBackendStatus(configuredStore: string, env: NodeJS.ProcessEnv): RateLimitBackendStatus {
    if (configuredStore === 'redis') {
        const redisUrl = env.UPSTASH_REDIS_REST_URL?.trim();
        const redisToken = env.UPSTASH_REDIS_REST_TOKEN?.trim();
        const missingUrl = !redisUrl;
        const missingToken = !redisToken;
        if (redisUrl && !hasValidUrl(redisUrl)) {
            return {
                schemaVersion: 'cvf.rateLimitBackend.v1',
                configuredStore,
                activeStore: 'none',
                distributed: false,
                configurationStatus: 'BLOCKED_REDIS_ENV_INVALID',
                claimBoundary: 'redis_requested_but_upstash_url_invalid_no_distributed_rate_limit_claim',
            };
        }
        return {
            schemaVersion: 'cvf.rateLimitBackend.v1',
            configuredStore,
            activeStore: 'none',
            distributed: false,
            configurationStatus: 'BLOCKED_REDIS_ENV_MISSING',
            claimBoundary: missingUrl && missingToken
                ? 'redis_requested_but_upstash_url_and_token_missing_no_distributed_rate_limit_claim'
                : 'redis_requested_but_upstash_env_incomplete_no_distributed_rate_limit_claim',
        };
    }
    return {
        schemaVersion: 'cvf.rateLimitBackend.v1',
        configuredStore,
        activeStore: 'none',
        distributed: false,
        configurationStatus: 'BLOCKED_UNSUPPORTED_STORE',
        claimBoundary: 'unsupported_rate_limit_store_no_distributed_rate_limit_claim',
    };
}

export function getRateLimitBackendStatus(env: NodeJS.ProcessEnv = process.env): RateLimitBackendStatus {
    const configuredStore = (env.CVF_RATE_LIMIT_STORE ?? 'memory').trim().toLowerCase() || 'memory';
    if (configuredStore === 'memory') {
        return memoryBackendStatus();
    }
    const redisUrl = env.UPSTASH_REDIS_REST_URL?.trim();
    const redisToken = env.UPSTASH_REDIS_REST_TOKEN?.trim();
    if (configuredStore === 'redis' && redisUrl && redisToken && hasValidUrl(redisUrl)) {
        return redisBackendStatus();
    }
    return blockedBackendStatus(configuredStore, env);
}

function blockedResult(backendStatus: RateLimitBackendStatus): RateLimitResult {
    return {
        allowed: false,
        retryAfterSeconds: UNSUPPORTED_BACKEND_RETRY_AFTER_SECONDS,
        backendStatus,
    };
}

export type RateLimiterOptions = {
    env?: NodeJS.ProcessEnv;
    redisClient?: RateLimitRedisClient;
    redisKeyPrefix?: string;
};

function createRedisClientFromEnv(env: NodeJS.ProcessEnv): RateLimitRedisClient | null {
    const url = env.UPSTASH_REDIS_REST_URL?.trim();
    const token = env.UPSTASH_REDIS_REST_TOKEN?.trim();
    if (!url || !token) return null;
    return new Redis({ url, token });
}

export function getRateLimiter(options: RateLimiterOptions = {}) {
    const env = options.env ?? process.env;
    return {
        backendStatus() {
            return getRateLimitBackendStatus(env);
        },
        async consume(request: NextRequest, userId?: string, provider?: string) {
            const backendStatus = getRateLimitBackendStatus(env);
            if (
                backendStatus.configurationStatus !== 'ACTIVE_MEMORY_PROCESS_LOCAL'
                && backendStatus.configurationStatus !== 'ACTIVE_REDIS_REST'
            ) {
                return blockedResult(backendStatus);
            }
            const { maxRequests, providerQuota } = limits(env);
            const key = userId || getClientIp(request.headers);
            const redisClient = backendStatus.configurationStatus === 'ACTIVE_REDIS_REST'
                ? options.redisClient ?? createRedisClientFromEnv(env)
                : null;
            const activeUserStore = redisClient
                ? new UpstashRedisRateLimitStore(redisClient, backendStatus, `${options.redisKeyPrefix ?? 'cvf:rate-limit'}:user`)
                : userStore;
            const activeProviderStore = redisClient
                ? new UpstashRedisRateLimitStore(redisClient, backendStatus, `${options.redisKeyPrefix ?? 'cvf:rate-limit'}:provider`)
                : providerStore;
            const res1 = await activeUserStore.consume(key, maxRequests);
            if (!res1.allowed) return res1;
            if (provider) {
                const res2 = await activeProviderStore.consume(`${key}:${provider}`, providerQuota);
                if (!res2.allowed) return res2;
            }
            return { allowed: true, retryAfterSeconds: 0, backendStatus };
        }
    };
}

export function resetRateLimitStoresForTest(): void {
    userStore.reset();
    providerStore.reset();
}
