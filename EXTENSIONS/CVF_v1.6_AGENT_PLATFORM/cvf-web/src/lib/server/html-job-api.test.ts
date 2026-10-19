import * as fs from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { AdminSession } from '@/lib/admin-session';
import { jobRouteHandlers } from './html-job-api';
import { HtmlDraftSnapshotStore } from './html-draft-snapshot-store';

vi.mock('@/lib/admin-session', () => ({ requireAdminApiSession: vi.fn() }));
const now = Date.parse('2026-10-18T00:00:00.000Z');
const session: Extract<AdminSession, { authMode: 'session' }> = { authMode: 'session', expiresAt: now + 60_000,
  userId: 'u1', orgId: 'o1', teamId: 't1', role: 'owner', user: 'fixture' };
const owner = { userId: 'u1', orgId: 'o1', teamId: 't1' };
const jobId = '123e4567-e89b-42d3-a456-426614174001';
const versionId = '123e4567-e89b-42d3-a456-426614174002';
const decisionId = '123e4567-e89b-42d3-a456-426614174003';
const sourceRecordId = 'ncr-synthetic-api';
const request = { title: 't', sourcePath: 'p', sourceContent: 's', memoryClass: 'FULL_RECORD' as const, status: 'DRAFT', claimBoundary: 'local', receiptAnchor: 'r' };
const url = 'http://localhost/api/artifacts/jobs';
const post = (body: unknown, origin = 'http://localhost') => new NextRequest(url, { method: 'POST',
  headers: { origin, 'Content-Type': 'application/json', 'sec-fetch-site': 'same-origin' }, body: JSON.stringify(body) });
async function cleanup(root: string) { for (const ns of await fs.readdir(root)) { const dir = path.join(root, ns);
  for (const file of await fs.readdir(dir)) await fs.unlink(path.join(dir, file)); await fs.rmdir(dir); } await fs.rmdir(root); }
describe('one job route', () => {
  it('denies disabled profile, cross origin, abnormal session and query extras', async () => {
    const auth = vi.fn(async () => session);
    expect((await jobRouteHandlers({ auth, clock: () => now }).POST(post({ action: 'CREATE_JOB' }))).status).toBe(503);
    expect((await jobRouteHandlers({ auth, clock: () => now }).POST(post({}, 'http://foreign'))).status).toBe(403);
    const root = await fs.mkdtemp(path.join(process.env.CVF_NCR_R1_FIXTURE_ROOT!, 'cvf-job-api-deny-'));
    try {
      const profile = { profile: { kind: 'local-synthetic' as const, root, production: false as const, jobDecisions: true as const }, recordPrefix: 'ncr-synthetic-', jobDecisions: true as const };
      const route = jobRouteHandlers({ profile, auth: vi.fn(async () => ({ ...session, realUserId: 'other' } as AdminSession)), clock: () => now });
      expect((await route.POST(post({ action: 'CREATE_JOB' }))).status).toBe(403);
      const normal = jobRouteHandlers({ profile, auth, clock: () => now });
      expect((await normal.GET(new NextRequest(`${url}?kind=capabilities&extra=1`))).status).toBe(422);
    } finally { await fs.rmdir(root); }
  });
  it('creates, links and accepts exact owner-bound records with authenticated readback', async () => {
    const root = await fs.mkdtemp(path.join(process.env.CVF_NCR_R1_FIXTURE_ROOT!, 'cvf-job-api-'));
    try {
      const auth = vi.fn(async () => session);
      const profile = { profile: { kind: 'local-synthetic' as const, root, production: false as const, jobDecisions: true as const }, recordPrefix: 'ncr-synthetic-', jobDecisions: true as const };
      const route = jobRouteHandlers({ profile, auth, clock: () => now });
      const create = { action: 'CREATE_JOB', jobId, sourceRecordId, goal: 'Review', criteria: [{ criterionId: 'c1', text: 'Heading' }],
        expectedOutput: 'HTML', allowedEffects: ['LOCAL_HTML_BUILD', 'LOCAL_DRAFT_SAVE', 'LOCAL_SYNTHETIC_REVIEW'], request };
      expect((await route.POST(post(create))).status).toBe(201);
      expect((await route.POST(post(create))).status).toBe(409);
      const store = new HtmlDraftSnapshotStore(profile.profile, () => now);
      expect(await store.save({ versionId, sourceRecordId, request, html: '<h1>Review</h1>', filename: 'r.html',
        generatedAt: new Date(now).toISOString(), buildNumber: 1 }, owner)).toBe('SAVED');
      expect((await route.POST(post({ action: 'LINK_VERSION', jobId, sourceRecordId, versionId }))).status).toBe(201);
      const linked = (await (await route.GET(new NextRequest(`${url}?kind=version&jobId=${jobId}&sourceRecordId=${sourceRecordId}&versionId=${versionId}`))).json()).data;
      expect((await route.POST(post({ action: 'ACCEPT_VERSION', decisionId, jobId, sourceRecordId, versionId,
        requestSha256: linked.requestSha256, htmlSha256: linked.htmlSha256,
        criteriaReview: [{ criterionId: 'c1', passed: true, reviewNote: 'Observed heading' }], reviewedVersionConfirmed: true }))).status).toBe(201);
      auth.mockImplementation(async () => ({ ...session, userId: 'other' }));
      expect((await route.GET(new NextRequest(`${url}?kind=decision&jobId=${jobId}&sourceRecordId=${sourceRecordId}&versionId=${versionId}&decisionId=${decisionId}`))).status).toBe(404);
    } finally { await cleanup(root); }
  });
});
