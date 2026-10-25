import { describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import type { AdminSession } from '@/lib/admin-session';
import { skillSuggestionHandlers } from './handlers';

vi.mock('@/lib/admin-session', () => ({ requireAdminApiSession: vi.fn() }));

const session = { authMode: 'session', expiresAt: Date.now() + 600_000,
  userId: 'u1', orgId: 'o1', teamId: 't1', role: 'owner', user: 'fixture' } as AdminSession;
const url = 'http://localhost/api/skills/suggest';
const post = (body: unknown, origin = 'http://localhost') => new NextRequest(url, {
  method: 'POST', headers: { origin, 'sec-fetch-site': 'same-origin', 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

describe('skill suggestion route boundary', () => {
  it('denies cross-origin and unauthenticated requests before provider use', async () => {
    const run = vi.fn();
    const auth = vi.fn(async () => session);
    const handlers = skillSuggestionHandlers({ auth, key: () => 'test-secret', run });
    expect((await handlers.POST(post({ goal: 'Plan an application' }, 'http://foreign'))).status).toBe(403);
    const denied = skillSuggestionHandlers({ auth: vi.fn(async () => NextResponse.json({}, { status: 401 })), key: () => 'test-secret', run });
    expect((await denied.POST(post({ goal: 'Plan an application' }))).status).toBe(401);
    expect(run).not.toHaveBeenCalled();
  });

  it('reports a missing TypeSafe key and rejects invalid input without calling the adapter', async () => {
    const run = vi.fn();
    const auth = vi.fn(async () => session);
    const missing = skillSuggestionHandlers({ auth, key: () => '', run });
    expect(await (await missing.GET(new NextRequest(url))).json()).toMatchObject({ connected: false });
    expect((await missing.POST(post({ goal: 'Plan an application' }))).status).toBe(503);
    const connected = skillSuggestionHandlers({ auth, key: () => 'test-secret', run });
    expect((await connected.POST(post({ goal: 'short' }))).status).toBe(422);
    expect((await connected.POST(post({ goal: 'Plan an application', extra: true }))).status).toBe(422);
    expect((await connected.POST(post({ goal: 'x'.repeat(3000) }))).status).toBe(413);
    expect(run).not.toHaveBeenCalled();
  });

  it('returns one advisory result without exposing the key', async () => {
    const run = vi.fn(async () => ({ status: 'no_match' as const, reason: 'No fit', model: 'jev-1.13.0', inputTokens: 10, outputTokens: 2 }));
    const handlers = skillSuggestionHandlers({ auth: vi.fn(async () => session), key: () => 'test-secret', run });
    const response = await handlers.POST(post({ goal: 'Plan an application' }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ provider: 'TypeSafe Jev', result: { status: 'no_match' } });
    expect(run).toHaveBeenCalledOnce();
  });
});
