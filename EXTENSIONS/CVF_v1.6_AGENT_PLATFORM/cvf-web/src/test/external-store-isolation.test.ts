// EAFR-R8. Proves that a non-live run never constructs a live external client
// from ambient environment values, even when those values are present, and
// that the default rate-limit and storage paths use local fallbacks, while
// their Redis seams remain testable through explicitly injected in-process
// fakes.
//
// Reviewer correction (2026-08-26): the first version of this file made two
// claims the evidence did not support, and one test's assertion contradicted
// its own name. Both are fixed here. `CVF_ALLOW_LIVE_TESTS` is a selection
// signal this file itself invented; it is not consulted by
// `provider-execution-guard.ts` for Upstash at all, so setting it never
// re-admits Upstash traffic. The guard denies the Upstash destination
// unconditionally in this manifest, which this file cannot change --
// `provider-execution-guard.ts` is explicitly not writable here. No test in
// this file claims deliberate live external-store use is preserved.
import { describe, expect, it } from 'vitest';
import {
    getRateLimitBackendStatus,
    getRateLimiter,
    resetRateLimitStoresForTest,
} from '@/lib/rate-limit';
import {
    buildEventListAdapter,
    type RedisEventListClient,
} from '@/lib/storage-adapter';

describe('EAFR-R8 non-live external store isolation', () => {
    it('setup already cleared the ambient Upstash and store-selector values for this non-live run', () => {
        // This assertion documents the isolation mechanism itself: src/test/setup.ts
        // deletes these values before any test module loads. It is not evidence of
        // the isolation on its own; the behavioral proofs below are.
        expect(process.env.UPSTASH_REDIS_REST_URL).toBeUndefined();
        expect(process.env.UPSTASH_REDIS_REST_TOKEN).toBeUndefined();
        expect(process.env.CVF_RATE_LIMIT_STORE).toBeUndefined();
    });

    it('falls back to the in-process memory rate-limit store and constructs no Redis client', async () => {
        resetRateLimitStoresForTest();
        // With the store selector and credentials both absent (the default
        // non-live state proven above), getRateLimitBackendStatus resolves to
        // ACTIVE_MEMORY_PROCESS_LOCAL and getRateLimiter never calls
        // createRedisClientFromEnv. No @upstash/redis client object is
        // constructed at any point in this call.
        const backendStatus = getRateLimitBackendStatus(process.env);
        expect(backendStatus.configurationStatus).toBe('ACTIVE_MEMORY_PROCESS_LOCAL');

        const limiter = getRateLimiter();
        const result = await limiter.consumeQuery('session', 'r8-memory-fallback-proof');

        expect(result.allowed).toBe(true);
        expect(result.backendStatus.activeStore).toBe('memory');
    });

    it('falls back to the in-process file event-list adapter when the storage type is not deliberately set to redis', () => {
        // buildEventListAdapter's own default resolves to 'file' when
        // CVF_STORAGE_ADAPTER_TYPE is unset -- the state setup.ts guarantees for a
        // non-live run. This constructs a FileEventListAdapter, not a redis-typed
        // adapter, and constructs no Upstash client of any kind.
        const adapter = buildEventListAdapter(undefined, { env: process.env });
        expect(adapter.adapterType).toBe('file');
    });

    it('a redis-typed adapter built with no injected client and no ambient Upstash config reports BLOCKED_CONFIGURATION, not a constructed client', () => {
        // This is a distinct claim from the previous test: deliberately requesting
        // the redis adapter type, with the credentials still cleared, must not
        // silently construct a working external client. RedisEventListAdapter's
        // constructor accepts a client or null; with no injected client and no
        // ambient config, createRedisEventListClient returns null, so the adapter
        // is constructed in a blocked state rather than a live one.
        const adapter = buildEventListAdapter('redis', { env: process.env });
        expect(adapter.adapterType).toBe('redis');
        const capability = adapter.describeCapability();
        expect(capability.implementationStatus).toBe('BLOCKED_CONFIGURATION');
        expect(capability.claimBoundary).toBe(
            'redis_client_configuration_absent_no_distributed_durability_claim',
        );
    });

    it('the R7/R8 egress invariant is unchanged: the Upstash destination itself is still denied by the unmodified guard', async () => {
        // provider-execution-guard.ts is not part of the R8 write ownership and
        // carries zero diff in this tranche; this asserts its behavior toward the
        // exact host this isolation targets, using the guard installed by
        // setup.ts, not a re-implementation. This denial is unconditional in this
        // manifest: no environment variable this tranche can set re-admits it,
        // because the guard's destination classification is not writable here.
        await expect(
            fetch('https://balanced-shrew-118656.upstash.io/some/path'),
        ).rejects.toThrow('CVF_PROVIDER_EXECUTION_DENIED');
    });

    it('an explicitly injected fake client is still honoured, proving deliberate injection remains possible', async () => {
        resetRateLimitStoresForTest();
        const calls: string[] = [];
        const fakeClient = {
            async incr(key: string) {
                calls.push(key);
                return 1;
            },
            async expire() {
                return 1;
            },
            async ttl() {
                return 60;
            },
        };
        const env = {
            ...process.env,
            CVF_RATE_LIMIT_STORE: 'redis',
            UPSTASH_REDIS_REST_URL: 'https://balanced-shrew-118656.upstash.io',
            UPSTASH_REDIS_REST_TOKEN: 'test-token-not-a-real-credential',
        } as NodeJS.ProcessEnv;

        const limiter = getRateLimiter({ env, redisClient: fakeClient });
        const result = await limiter.consumeQuery('session', 'r8-injected-fake-proof');

        expect(result.allowed).toBe(true);
        expect(calls.length).toBeGreaterThan(0);
    });

    it('exercises Redis storage operations through an injected fake without constructing an external client', async () => {
        const evalCalls: Array<{ keys: string[]; args: Array<string | number> }> = [];
        const fakeClient: RedisEventListClient = {
            async eval<TData = unknown>(
                _script: string,
                keys: string[],
                args: Array<string | number>,
            ): Promise<TData> {
                evalCalls.push({ keys, args });
                return 1 as TData;
            },
            async zrange<TData = unknown>(): Promise<TData[]> {
                return [JSON.stringify({ id: 'stored-by-fake' }) as TData];
            },
        };
        const env = {
            ...process.env,
            CVF_STORAGE_ADAPTER_TYPE: 'redis',
            UPSTASH_REDIS_REST_URL: 'https://ambient.example.invalid',
            UPSTASH_REDIS_REST_TOKEN: 'ambient-token-must-not-be-used',
        } as NodeJS.ProcessEnv;

        const adapter = buildEventListAdapter<{ id: string }>(undefined, {
            env,
            redisClient: fakeClient,
        });
        await adapter.append('cvf:r8-isolation', { id: 'written-through-fake' });

        expect(evalCalls).toHaveLength(1);
        expect(evalCalls[0]?.keys).toEqual(['cvf:r8-isolation']);
        expect(await adapter.readAll('cvf:r8-isolation')).toEqual([
            { id: 'stored-by-fake' },
        ]);
    });
});
