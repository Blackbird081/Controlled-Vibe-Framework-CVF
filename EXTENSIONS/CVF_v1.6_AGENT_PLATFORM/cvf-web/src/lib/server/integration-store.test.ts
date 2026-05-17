import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    buildIntegrationAdapter,
    HttpAdapter,
    NullAdapter,
    storeRecordToJobEvent,
    SupabaseAdapter,
    type RuntimeStoreRecord,
} from './integration-store';
import { defaultIntegrationsConfig, type IntegrationsConfig } from '@/lib/integrations-config';

const originalEnv = { ...process.env };

const record: RuntimeStoreRecord = {
    job_id: 'job-1',
    event_type: 'running',
    status: 'running',
    provider_lane: 'alibaba',
    cwd_label: 'Controlled-Vibe-Framework-CVF',
    correlation_id: 'corr-1',
    evidence_refs: ['receipt-1'],
    cost_quota: null,
    requested_at: '2026-05-17T00:00:00.000Z',
    recorded_at: '2026-05-17T00:00:01.000Z',
};

function config(provider: IntegrationsConfig['runtimeStore']['provider']): IntegrationsConfig {
    return {
        runtimeStore: {
            ...defaultIntegrationsConfig.runtimeStore,
            provider,
            supabase: { url: 'https://x.supabase.co', anonKey: 'anon' },
            http: { endpoint: 'https://example.com/runtime', bearerToken: 'token' },
        },
    };
}

describe('integration store adapters', () => {
    afterEach(() => {
        process.env = { ...originalEnv };
        vi.unstubAllGlobals();
    });

    it('NullAdapter is unavailable', () => {
        expect(new NullAdapter().isAvailable()).toBe(false);
    });

    it('NullAdapter returns no jobs', async () => {
        await expect(new NullAdapter().fetchLatestJobs(10)).resolves.toEqual([]);
    });

    it('SupabaseAdapter requires URL', () => {
        expect(new SupabaseAdapter('', 'k').isAvailable()).toBe(false);
    });

    it('SupabaseAdapter requires anon key', () => {
        expect(new SupabaseAdapter('https://x.supabase.co', '').isAvailable()).toBe(false);
    });

    it('SupabaseAdapter is available with URL and anon key', () => {
        expect(new SupabaseAdapter('https://x.supabase.co', 'k').isAvailable()).toBe(true);
    });

    it('SupabaseAdapter returns records from valid array response', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => Response.json([record])));
        await expect(new SupabaseAdapter('https://x.supabase.co', 'k').fetchLatestJobs(10))
            .resolves.toEqual([record]);
    });

    it('SupabaseAdapter returns empty array when fetch throws', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => {
            throw new Error('network');
        }));
        await expect(new SupabaseAdapter('https://x.supabase.co', 'k').fetchLatestJobs(10))
            .resolves.toEqual([]);
    });

    it('SupabaseAdapter returns empty array for HTTP 401', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 401 })));
        await expect(new SupabaseAdapter('https://x.supabase.co', 'k').fetchLatestJobs(10))
            .resolves.toEqual([]);
    });

    it('SupabaseAdapter returns empty array for malformed URL', async () => {
        await expect(new SupabaseAdapter('not-a-url', 'k').fetchLatestJobs(10)).resolves.toEqual([]);
    });

    it('HttpAdapter requires endpoint', () => {
        expect(new HttpAdapter('', '').isAvailable()).toBe(false);
    });

    it('HttpAdapter is available with endpoint', () => {
        expect(new HttpAdapter('https://example.com/runtime', '').isAvailable()).toBe(true);
    });

    it('HttpAdapter returns records from valid array response', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => Response.json([record])));
        await expect(new HttpAdapter('https://example.com/runtime', '').fetchLatestJobs(10))
            .resolves.toEqual([record]);
    });

    it('HttpAdapter returns empty array when fetch throws', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => {
            throw new Error('network');
        }));
        await expect(new HttpAdapter('https://example.com/runtime', '').fetchLatestJobs(10))
            .resolves.toEqual([]);
    });

    it('uses env Supabase config before client config', () => {
        process.env.SUPABASE_URL = 'https://env.supabase.co';
        process.env.SUPABASE_ANON_KEY = 'env-key';
        expect(buildIntegrationAdapter(config('http'))).toBeInstanceOf(SupabaseAdapter);
    });

    it('builds NullAdapter for provider none without env', () => {
        delete process.env.SUPABASE_URL;
        delete process.env.SUPABASE_ANON_KEY;
        expect(buildIntegrationAdapter(config('none'))).toBeInstanceOf(NullAdapter);
    });

    it('builds SupabaseAdapter for client supabase config', () => {
        delete process.env.SUPABASE_URL;
        delete process.env.SUPABASE_ANON_KEY;
        expect(buildIntegrationAdapter(config('supabase'))).toBeInstanceOf(SupabaseAdapter);
    });

    it('builds HttpAdapter for client http config', () => {
        delete process.env.SUPABASE_URL;
        delete process.env.SUPABASE_ANON_KEY;
        expect(buildIntegrationAdapter(config('http'))).toBeInstanceOf(HttpAdapter);
    });

    it('builds NullAdapter for null config', () => {
        delete process.env.SUPABASE_URL;
        delete process.env.SUPABASE_ANON_KEY;
        expect(buildIntegrationAdapter(null)).toBeInstanceOf(NullAdapter);
    });

    it('maps job_id to GovernanceJobEvent jobId', () => {
        expect(storeRecordToJobEvent(record).jobId).toBe('job-1');
    });

    it('maps provider_lane null without crashing', () => {
        expect(storeRecordToJobEvent({ ...record, provider_lane: null }).providerLane).toBeNull();
    });
});
