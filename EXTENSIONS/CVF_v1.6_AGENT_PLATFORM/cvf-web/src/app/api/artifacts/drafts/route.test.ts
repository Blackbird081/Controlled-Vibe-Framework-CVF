import * as routeEntry from './route';
// Text Encoding Exception: Vietnamese fixture bytes verify UTF-8 recovery fidelity.
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { draftRouteHandlers, normalPrincipal } from '@/lib/server/html-draft-recovery-api';
import type { DraftInput } from '@/lib/html-draft-recovery-contract';
import type { AdminSession } from '@/lib/admin-session';
import { requireHtmlPilotOwner } from '@/lib/server/ncr-html-pilot-auth';
import type { HtmlPilotRuntimeProfile } from '@/lib/server/ncr-html-pilot-runtime-profile';

vi.mock('@/lib/admin-session', () => ({ requireAdminApiSession: vi.fn() }));
vi.mock('@/lib/server/ncr-html-pilot-auth', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/server/ncr-html-pilot-auth')>();
  return { ...actual, requireHtmlPilotOwner: vi.fn() };
});

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
const pilotOwner = { userId: 'u1', orgId: 'o1', teamId: 't1' };
const clearVerifierKeys = () => {
  vi.stubEnv('CVF_RECEIPT_HMAC_SECRET', undefined);
  vi.stubEnv('CVF_AUDIT_SIGNING_KEY', undefined);
};
const ownedTestRoots: string[] = [];
async function makeOwnedTestRoot(prefix: string): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  ownedTestRoots.push(root);
  return root;
}
afterEach(async () => {
  vi.unstubAllEnvs(); vi.mocked(requireHtmlPilotOwner).mockReset();
  for (const root of ownedTestRoots.splice(0)) {
    if (path.dirname(root) !== os.tmpdir() || !/^cvf-(?:draft-route|draft-prefix|pilot-draft-route)-/.test(path.basename(root))) {
      throw new Error('UNSAFE_TEST_ROOT_CLEANUP');
    }
    await fs.rm(root, { recursive: true, force: true });
  }
});

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
    clearVerifierKeys();
    const root = await makeOwnedTestRoot('cvf-draft-route-');
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
    const root = await makeOwnedTestRoot('cvf-draft-prefix-');
    const auth = vi.fn(async () => session);
    const route = draftRouteHandlers({ profile: { kind: 'local-synthetic', root, production: false }, recordPrefix: 'ncr-synthetic-', auth, clock: () => now });
    expect((await route.POST(post(input))).status).toBe(404);
    expect((await route.GET(new NextRequest(`${url}?sourceRecordId=evt_1&list=1`))).status).toBe(404);
    const selected = { ...input, sourceRecordId: 'ncr-synthetic-alpha' };
    expect((await route.POST(post(selected))).status).toBe(201);
    expect((await route.GET(new NextRequest(`${url}?sourceRecordId=ncr-synthetic-alpha&id=${selected.versionId}`))).status).toBe(200);
  });
});

describe('draft route pilot verifier readiness', () => {
  const makePilotRoute = async (recordPrefix?: string) => {
    const root = await makeOwnedTestRoot('cvf-pilot-draft-route-');
    const profile = { owner: pilotOwner,
      store: { kind: 'real-provider-fictional-content', root, production: false, jobDecisions: true } } as unknown as HtmlPilotRuntimeProfile;
    const route = draftRouteHandlers({ pilot: profile, recordPrefix, clock: () => now });
    vi.mocked(requireHtmlPilotOwner).mockResolvedValue(pilotOwner);
    return route;
  };

  it('keeps authorization, query and prefix failures ahead of the unavailable response', async () => {
    clearVerifierKeys();
    const route = await makePilotRoute('pilot-');
    vi.mocked(requireHtmlPilotOwner).mockResolvedValueOnce(NextResponse.json({ success: false }, { status: 401 }));
    expect((await route.GET(new NextRequest(`${url}?sourceRecordId=pilot-1&list=1`))).status).toBe(401);
    expect((await route.GET(new NextRequest(`${url}?sourceRecordId=bad%20id&list=1`))).status).toBe(400);
    expect((await route.GET(new NextRequest(`${url}?sourceRecordId=evt_1&list=1`))).status).toBe(404);
    const unavailable = await route.GET(new NextRequest(`${url}?sourceRecordId=pilot-1&list=1`));
    expect(unavailable.status).toBe(503);
    expect(await unavailable.json()).toEqual({ success: false, error: 'PILOT_SOURCE_VERIFIER_UNAVAILABLE' });
  });

  it('allows the configured fallback verifier path and returns a normal filtered list', async () => {
    clearVerifierKeys();
    vi.stubEnv('CVF_AUDIT_SIGNING_KEY', 'offline-configured-verifier-key');
    const route = await makePilotRoute();
    const response = await route.GET(new NextRequest(`${url}?sourceRecordId=evt_1&list=1`));
    expect(response.status).toBe(200);
    expect((await response.json()).data).toEqual([]);
  });
});
