import * as routeEntry from './route';
// Text Encoding Exception: Vietnamese fixture bytes verify UTF-8 recovery fidelity.
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { draftRouteHandlers, normalPrincipal } from '@/lib/server/html-draft-recovery-api';
import type { DraftInput } from '@/lib/html-draft-recovery-contract';
import type { AdminSession } from '@/lib/admin-session';

vi.mock('@/lib/admin-session', () => ({ requireAdminApiSession: vi.fn() }));

const now = Date.parse('2026-10-18T00:00:00.000Z');
const session: Extract<AdminSession, { authMode: 'session' }> = { authMode: 'session', expiresAt: now + 60_000, userId: 'u1', orgId: 'o1', teamId: 't1', role: 'owner', user: 'fixture' };
const input: DraftInput = {
  versionId: '123e4567-e89b-42d3-a456-426614174003', sourceRecordId: 'evt_1',
  request: { title: 'x', sourcePath: 'a', sourceContent: 'b', memoryClass: 'FULL_RECORD', status: 'DRAFT', claimBoundary: 'unaccepted', receiptAnchor: 'r' },
  html: '<p>é</p>', filename: 'x.html', generatedAt: new Date(now).toISOString(), buildNumber: 1,
};
const url = 'http://localhost/api/artifacts/drafts';
const post = (body: unknown, origin = 'http://localhost') => new NextRequest(url, {
  method: 'POST', headers: { origin, 'Content-Type': 'application/json', 'sec-fetch-site': 'same-origin' }, body: JSON.stringify(body),
});
type RouteExtraExports = Exclude<keyof typeof routeEntry, 'GET' | 'POST'>;
const routeExportTypeGuard: Record<RouteExtraExports, never> = {};
describe('draft route synthetic profile', () => {
  it('exports only framework-supported route handlers', () => {
    expect(Object.keys(routeEntry).sort()).toEqual(['GET', 'POST']);
    expect(routeExportTypeGuard).toEqual({});
  });
  it('fails closed on profile, origin and abnormal session before storage', async () => {
    const auth = vi.fn(async () => session);
    expect((await draftRouteHandlers({ auth, clock: () => now }).POST(post(input))).status).toBe(503);
    expect((await draftRouteHandlers({ auth, clock: () => now }).POST(post(input, 'http://foreign'))).status).toBe(403);
    expect(normalPrincipal({ ...session, realUserId: 'other' } as AdminSession, now)).toBeNull();
    expect(normalPrincipal({ ...session, expiresAt: now } as AdminSession, now)).toBeNull();
  });
  it('saves and retrieves only exact owner and record without export calls', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'cvf-draft-route-'));
    const auth = vi.fn(async () => session);
    const route = draftRouteHandlers({ profile: { kind: 'local-synthetic', root, production: false }, auth, clock: () => now });
    expect((await route.POST(post(input))).status).toBe(201);
    expect((await route.POST(post(input))).status).toBe(409);
    const get = async (record: string, id: string) => route.GET(new NextRequest(`${url}?sourceRecordId=${record}&id=${id}`));
    expect((await (await get('evt_1', input.versionId)).json()).data.html).toBe(input.html);
    expect((await get('evt_2', input.versionId)).status).toBe(404);
    const list = await route.GET(new NextRequest(`${url}?sourceRecordId=evt_1&list=1`));
    expect((await list.json()).data).toHaveLength(1);
    expect(list.headers.get('cache-control')).toBe('no-store');
    auth.mockImplementation(async () => ({ ...session, userId: 'u2' }));
    expect((await get('evt_1', input.versionId)).status).toBe(404);
  });
  it('limits the enabled app profile to its declared synthetic record prefix', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'cvf-draft-prefix-'));
    const auth = vi.fn(async () => session);
    const route = draftRouteHandlers({ profile: { kind: 'local-synthetic', root, production: false }, recordPrefix: 'ncr-synthetic-', auth, clock: () => now });
    expect((await route.POST(post(input))).status).toBe(404);
    expect((await route.GET(new NextRequest(`${url}?sourceRecordId=evt_1&list=1`))).status).toBe(404);
    const selected = { ...input, sourceRecordId: 'ncr-synthetic-alpha' };
    expect((await route.POST(post(selected))).status).toBe(201);
    expect((await route.GET(new NextRequest(`${url}?sourceRecordId=ncr-synthetic-alpha&id=${selected.versionId}`))).status).toBe(200);
  });
});
