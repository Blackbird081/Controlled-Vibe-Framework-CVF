import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

function makeRequest(body: unknown): NextRequest {
    return new NextRequest('http://localhost/api/integrations/test', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
    });
}

async function responseJson(body: unknown) {
    const response = await POST(makeRequest(body));
    return response.json() as Promise<{ ok: boolean; status: string; detail?: string; latencyMs: number }>;
}

describe('POST /api/integrations/test', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('returns disabled for provider none', async () => {
        await expect(responseJson({ provider: 'none' })).resolves.toMatchObject({
            ok: true,
            status: 'disabled',
            latencyMs: 0,
        });
    });

    it('requires supabase URL and anon key', async () => {
        const json = await responseJson({ provider: 'supabase', supabase: { url: '', anonKey: '' } });
        expect(json.ok).toBe(false);
        expect(json.detail).toContain('required');
    });

    it('rejects malformed supabase URL', async () => {
        const json = await responseJson({ provider: 'supabase', supabase: { url: 'not-a-url', anonKey: 'k' } });
        expect(json.ok).toBe(false);
        expect(json.detail).toContain('valid URL');
    });

    it('connects supabase when probe returns 200', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response('[]', { status: 200 })));
        await expect(responseJson({
            provider: 'supabase',
            supabase: { url: 'https://x.supabase.co', anonKey: 'k' },
        })).resolves.toMatchObject({ ok: true, status: 'connected' });
    });

    it('connects supabase when probe returns 406', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 406 })));
        await expect(responseJson({
            provider: 'supabase',
            supabase: { url: 'https://x.supabase.co', anonKey: 'k' },
        })).resolves.toMatchObject({ ok: true, status: 'connected' });
    });

    it('returns supabase HTTP status in error detail', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 401 })));
        const json = await responseJson({
            provider: 'supabase',
            supabase: { url: 'https://x.supabase.co', anonKey: 'k' },
        });
        expect(json.ok).toBe(false);
        expect(json.detail).toContain('401');
    });

    it('returns error when supabase fetch throws', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => {
            throw new Error('network');
        }));
        await expect(responseJson({
            provider: 'supabase',
            supabase: { url: 'https://x.supabase.co', anonKey: 'k' },
        })).resolves.toMatchObject({ ok: false, status: 'error' });
    });

    it('requires http endpoint', async () => {
        const json = await responseJson({ provider: 'http', http: { endpoint: '', bearerToken: '' } });
        expect(json.ok).toBe(false);
        expect(json.detail).toContain('required');
    });

    it('connects http when endpoint returns 200', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response('[]', { status: 200 })));
        await expect(responseJson({
            provider: 'http',
            http: { endpoint: 'https://example.com/runtime', bearerToken: '' },
        })).resolves.toMatchObject({ ok: true, status: 'connected' });
    });

    it('returns error when http fetch throws', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => {
            throw new Error('network');
        }));
        await expect(responseJson({
            provider: 'http',
            http: { endpoint: 'https://example.com/runtime', bearerToken: '' },
        })).resolves.toMatchObject({ ok: false, status: 'error' });
    });

    it('rejects unknown provider', async () => {
        const json = await responseJson({ provider: 'unknown' });
        expect(json.ok).toBe(false);
        expect(json.detail).toContain('Unknown');
    });
});
