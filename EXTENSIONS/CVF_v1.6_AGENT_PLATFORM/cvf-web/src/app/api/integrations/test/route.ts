import { NextRequest, NextResponse } from 'next/server';

export interface IntegrationTestRequest {
    provider: 'supabase' | 'http' | 'none';
    supabase?: { url: string; anonKey: string };
    http?: { endpoint: string; bearerToken: string };
}

export interface IntegrationTestResponse {
    ok: boolean;
    status: 'connected' | 'error' | 'disabled';
    latencyMs: number;
    detail?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<IntegrationTestResponse>> {
    const started = Date.now();
    try {
        const body = await request.json() as Partial<IntegrationTestRequest>;
        if (body.provider === 'none') {
            return json({ ok: true, status: 'disabled', latencyMs: 0 });
        }
        if (body.provider === 'supabase') {
            return json(await testSupabase(body.supabase, started));
        }
        if (body.provider === 'http') {
            return json(await testHttp(body.http, started));
        }
        return json(errorResponse(started, 'Unknown integration provider.'));
    } catch {
        return json(errorResponse(started, 'Invalid integration test request.'));
    }
}

async function testSupabase(
    config: IntegrationTestRequest['supabase'],
    started: number,
): Promise<IntegrationTestResponse> {
    const url = config?.url?.trim() ?? '';
    const anonKey = config?.anonKey ?? '';
    if (!url || !anonKey) {
        return errorResponse(started, 'Supabase Project URL and anon key are required.');
    }

    let origin: string;
    try {
        origin = new URL(url).origin;
    } catch {
        return errorResponse(started, 'Supabase Project URL must be a valid URL.');
    }

    try {
        const response = await fetch(`${origin}/rest/v1/runtime_events?select=id&limit=1`, {
            method: 'GET',
            headers: {
                apikey: anonKey,
                Authorization: `Bearer ${anonKey}`,
                Accept: 'application/json',
            },
            signal: AbortSignal.timeout(5000),
        });
        if (response.status === 200 || response.status === 406) {
            return { ok: true, status: 'connected', latencyMs: elapsed(started) };
        }
        return errorResponse(started, `Supabase returned HTTP ${response.status}.`);
    } catch {
        return errorResponse(started, 'Supabase connection failed.');
    }
}

async function testHttp(
    config: IntegrationTestRequest['http'],
    started: number,
): Promise<IntegrationTestResponse> {
    const endpoint = config?.endpoint?.trim() ?? '';
    const bearerToken = config?.bearerToken ?? '';
    if (!endpoint) {
        return errorResponse(started, 'HTTP endpoint is required.');
    }

    try {
        const headers: Record<string, string> = { Accept: 'application/json' };
        if (bearerToken) {
            headers.Authorization = `Bearer ${bearerToken}`;
        }
        const response = await fetch(endpoint, {
            method: 'GET',
            headers,
            signal: AbortSignal.timeout(5000),
        });
        if (response.ok) {
            return { ok: true, status: 'connected', latencyMs: elapsed(started) };
        }
        return errorResponse(started, `HTTP endpoint returned ${response.status}.`);
    } catch {
        return errorResponse(started, 'HTTP connection failed.');
    }
}

function json(payload: IntegrationTestResponse): NextResponse<IntegrationTestResponse> {
    return NextResponse.json(payload);
}

function errorResponse(started: number, detail: string): IntegrationTestResponse {
    return {
        ok: false,
        status: 'error',
        latencyMs: elapsed(started),
        detail,
    };
}

function elapsed(started: number): number {
    return Math.max(0, Date.now() - started);
}
