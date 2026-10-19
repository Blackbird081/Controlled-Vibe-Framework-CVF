import * as fs from 'node:fs/promises';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { describe, expect, it, vi } from 'vitest';
import type { AdminSession } from '@/lib/admin-session';
import { boundDisclosureOf, makeBoundConfig, type BoundDisclosure } from '@/lib/artifacts-bound-receipt-contract';
import { jobRouteHandlers } from './html-job-api';

vi.mock('@/lib/admin-session', () => ({ requireAdminApiSession: vi.fn() }));
const ROOTS = path.resolve(process.cwd(), '..', '..', '..', '.cvf', 'runtime', 'ncr-r2-w05-bound-source-20261019', 'worker', 'roots');
const now = Date.parse('2026-10-19T01:00:00.000Z');
const session: Extract<AdminSession, { authMode: 'session' }> = { authMode: 'session', expiresAt: now + 60_000, userId: 'u1', orgId: 'o1', teamId: 't1', role: 'owner', user: 'fixture' };
const config = makeBoundConfig({ policyRevision: 'policy-r1', transformRevision: 'transform-1', endpointId: 'fixture-endpoint', storeId: 'fixture-store', authReference: 'bundle-1',
  authScope: 'two-hop', webOrigin: 'http://web.invalid:3000', engineOrigin: 'http://engine.invalid:8100', instanceId: '123e4567-e89b-42d3-a456-426614174000',
  storeBindingId: 'ab'.repeat(32), timeoutMs: 4000 })!;
const disclosure = boundDisclosureOf(config);
const url = 'http://localhost/api/artifacts/jobs';
const capabilities = (extra = '', headers: Record<string, string> = {}) => new NextRequest(`${url}?kind=capabilities${extra}`, { headers });
async function profileFor(label: string) {
  await fs.mkdir(ROOTS, { recursive: true });
  const root = await fs.realpath(await fs.mkdtemp(path.join(ROOTS, `${label}-`)));
  return { profile: { kind: 'local-synthetic' as const, root, production: false as const, jobDecisions: true as const }, recordPrefix: 'ncr-synthetic-', jobDecisions: true as const };
}
const auth = () => vi.fn(async () => session);
const data = async (response: Response) => (await response.json()) as { success: boolean; data?: Record<string, unknown>; error?: string };

describe('capability disclosure comes only from explicit injection (BC09/BC10)', () => {
  it('keeps the local synthetic capability exactly as before when nothing is injected', async () => {
    const route = jobRouteHandlers({ profile: await profileFor('cap-default'), auth: auth(), clock: () => now });
    expect(await data(await route.GET(capabilities()))).toEqual({ success: true, data: { jobDecisions: true, effectBoundary: 'LOCAL_SYNTHETIC' } });
    for (const bound of [null, undefined]) {
      const again = jobRouteHandlers({ profile: await profileFor('cap-null'), auth: auth(), clock: () => now, bound });
      expect((await data(await again.GET(capabilities()))).data).toEqual({ jobDecisions: true, effectBoundary: 'LOCAL_SYNTHETIC' });
    }
  });
  it('emits a nonsecret bound disclosure only for the injected, exactly labelled case', async () => {
    const route = jobRouteHandlers({ profile: await profileFor('cap-bound'), auth: auth(), clock: () => now, bound: disclosure });
    const response = await route.GET(capabilities());
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const body = await data(response);
    expect(body).toEqual({ success: true, data: { jobDecisions: true, effectBoundary: 'BOUND_ENGINE_RECEIPT', boundDisclosure: disclosure } });
    expect(JSON.stringify(body)).not.toMatch(/authReference|authScope|keyReference|secret|token|storeBindingId|instanceId|\.sqlite|password/i);
    expect(disclosure.cost).toBe('UNKNOWN_NOT_AUTHORIZED');
    expect(disclosure.requestedRisk).toBe('R1');
    expect(disclosure.attemptLimit).toBe(1);
  });
  it('falls back to the local label when the injected object is not the exact bound disclosure', async () => {
    const wrong: unknown[] = [{ ...disclosure, mode: 'ACTIVATED' }, { ...disclosure, effectBoundary: 'LOCAL_SYNTHETIC' }, {}, 'BOUND_ENGINE_RECEIPT', 7];
    for (const bound of wrong) {
      const route = jobRouteHandlers({ profile: await profileFor('cap-wrong'), auth: auth(), clock: () => now, bound: bound as BoundDisclosure });
      expect((await data(await route.GET(capabilities()))).data).toEqual({ jobDecisions: true, effectBoundary: 'LOCAL_SYNTHETIC' });
    }
  });
  it('never reads a disclosure from a query, a header or a body', async () => {
    const route = jobRouteHandlers({ profile: await profileFor('cap-untrusted'), auth: auth(), clock: () => now });
    const injected = encodeURIComponent(JSON.stringify(disclosure));
    expect((await route.GET(capabilities(`&boundDisclosure=${injected}`))).status).toBe(422);
    expect((await route.GET(capabilities('&effectBoundary=BOUND_ENGINE_RECEIPT'))).status).toBe(422);
    const headed = await data(await route.GET(capabilities('', { 'x-cvf-bound-disclosure': JSON.stringify(disclosure), 'x-cvf-effect-boundary': 'BOUND_ENGINE_RECEIPT' })));
    expect(headed.data).toEqual({ jobDecisions: true, effectBoundary: 'LOCAL_SYNTHETIC' });
    const post = new NextRequest(url, { method: 'POST', headers: { origin: 'http://localhost', 'Content-Type': 'application/json', 'sec-fetch-site': 'same-origin' },
      body: JSON.stringify({ action: 'CREATE_JOB', boundDisclosure: disclosure }) });
    expect((await route.POST(post)).status).toBe(422);
  });
  it('snapshots the injected disclosure at construction so later mutation cannot change what is disclosed', async () => {
    const mutable = JSON.parse(JSON.stringify(disclosure)) as BoundDisclosure & { destination: { engineOrigin: string } };
    const route = jobRouteHandlers({ profile: await profileFor('cap-snapshot'), auth: auth(), clock: () => now, bound: mutable });
    mutable.destination.engineOrigin = 'http://changed.invalid:1';
    mutable.cost = 'FREE' as never;
    expect((await data(await route.GET(capabilities()))).data?.boundDisclosure).toEqual(disclosure);
  });
  it('adds no capability without the job profile, without a session and without the exact query', async () => {
    const disabled = jobRouteHandlers({ auth: auth(), clock: () => now, bound: disclosure });
    const response = await disabled.GET(capabilities());
    expect(response.status).toBe(503);
    expect(await data(response)).toEqual({ success: false, error: 'JOB_PROFILE_DISABLED' });
    const denied = jobRouteHandlers({ profile: await profileFor('cap-auth'), clock: () => now, bound: disclosure,
      auth: vi.fn(async () => NextResponse.json({ success: false, error: 'AUTH' }, { status: 401 })) });
    expect((await denied.GET(capabilities())).status).toBe(401);
    const route = jobRouteHandlers({ profile: await profileFor('cap-query'), auth: auth(), clock: () => now, bound: disclosure });
    expect((await route.GET(new NextRequest(`${url}?kind=capabilities&kind=capabilities`))).status).toBe(422);
    expect((await route.GET(capabilities('&x=1'))).status).toBe(422);
  });
  it('leaves the existing job operations and their strict validation untouched when a disclosure is injected', async () => {
    const route = jobRouteHandlers({ profile: await profileFor('cap-jobs'), auth: auth(), clock: () => now, bound: disclosure });
    const create = { action: 'CREATE_JOB', jobId: '123e4567-e89b-42d3-a456-426614174001', sourceRecordId: 'ncr-synthetic-api', goal: 'Review',
      criteria: [{ criterionId: 'c1', text: 'Heading' }], expectedOutput: 'HTML', allowedEffects: ['LOCAL_HTML_BUILD', 'LOCAL_DRAFT_SAVE', 'LOCAL_SYNTHETIC_REVIEW'],
      request: { title: 't', sourcePath: 'p', sourceContent: 's', memoryClass: 'FULL_RECORD', status: 'DRAFT', claimBoundary: 'local', receiptAnchor: 'r' } };
    const post = (body: unknown) => new NextRequest(url, { method: 'POST', headers: { origin: 'http://localhost', 'Content-Type': 'application/json', 'sec-fetch-site': 'same-origin' },
      body: JSON.stringify(body) });
    expect((await route.POST(post(create))).status).toBe(201);
    expect((await route.POST(post(create))).status).toBe(409);
    expect((await route.POST(post({ ...create, jobId: '123e4567-e89b-42d3-a456-426614174009', extra: true }))).status).toBe(422);
    const read = await route.GET(new NextRequest(`${url}?kind=job&jobId=${create.jobId}&sourceRecordId=${create.sourceRecordId}`));
    expect(read.status).toBe(200);
    expect((await data(read)).data).toMatchObject({ jobId: create.jobId, sourceRecordId: create.sourceRecordId });
  });
});
