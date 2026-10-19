import * as fs from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { HtmlDraftSnapshotStore } from './html-draft-snapshot-store';
import { JOB_EFFECTS, type CreateJobInput, type AcceptVersionInput } from '../html-job-contract';
import type { DraftInput } from '../html-draft-recovery-contract';

const now = Date.parse('2026-10-18T00:00:00.000Z');
const jobId = '123e4567-e89b-42d3-a456-426614174001';
const versionId = '123e4567-e89b-42d3-a456-426614174002';
const decisionId = '123e4567-e89b-42d3-a456-426614174003';
const sourceRecordId = 'ncr-synthetic-store';
const owner = { userId: 'u1', orgId: 'o1', teamId: 't1' };
const request = { title: 't', sourcePath: 'p', sourceContent: 's', memoryClass: 'FULL_RECORD' as const, status: 'DRAFT', claimBoundary: 'local', receiptAnchor: 'r' };
const create: CreateJobInput = { jobId, sourceRecordId, goal: 'Review', criteria: [{ criterionId: 'c1', text: 'Heading' }],
  expectedOutput: 'HTML', allowedEffects: JOB_EFFECTS, request };
const draft: DraftInput = { versionId, sourceRecordId, request, html: '<h1>Review</h1>', filename: 'r.html',
  generatedAt: new Date(now).toISOString(), buildNumber: 1 };
async function cleanup(root: string) {
  for (const namespace of await fs.readdir(root)) {
    const dir = path.join(root, namespace);
    for (const file of await fs.readdir(dir)) await fs.unlink(path.join(dir, file));
    await fs.rmdir(dir);
  }
  await fs.rmdir(root);
}
describe('job sidecars in draft owner namespace', () => {
  it('joins immutable job, exact snapshot and one person decision without changing draft trust', async () => {
    const root = await fs.mkdtemp(path.join(process.env.CVF_NCR_R1_FIXTURE_ROOT!, 'cvf-job-sidecar-'));
    try {
      const store = new HtmlDraftSnapshotStore({ kind: 'local-synthetic', root, production: false, jobDecisions: true }, () => now);
      const defaultStore = new HtmlDraftSnapshotStore({ kind: 'local-synthetic', root, production: false }, () => now);
      expect(await defaultStore.createJob(create, owner)).toBe('UNAVAILABLE');
      expect(await store.createJob({ ...create, jobId: '../unsafe' }, owner)).toBe('UNAVAILABLE');
      expect(await store.createJob(create, owner)).toBe('SAVED');
      expect(await store.save(draft, owner)).toBe('SAVED');
      expect(await store.linkVersion({ jobId, sourceRecordId, versionId }, owner)).toBe('SAVED');
      expect(await store.linkVersion({ jobId, sourceRecordId, versionId }, owner)).toBe('COLLISION');
      const link = (await store.getVersion(jobId, sourceRecordId, versionId, owner))!;
      const decision: AcceptVersionInput = { decisionId, jobId, sourceRecordId, versionId,
        requestSha256: link.requestSha256, htmlSha256: link.htmlSha256,
        criteriaReview: [{ criterionId: 'c1', passed: true, reviewNote: 'Heading observed' }], reviewedVersionConfirmed: true };
      expect(await store.acceptVersion(decision, owner)).toBe('SAVED');
      expect((await store.getDecision(jobId, sourceRecordId, versionId, decisionId, owner))?.decision).toBe('ACCEPT_FOR_LOCAL_SYNTHETIC_REVIEW');
      expect((await store.get(versionId, sourceRecordId, owner))?.acceptance).toBe('DRAFT_UNACCEPTED');
      expect(await store.getDecision(jobId, sourceRecordId, versionId, decisionId, { ...owner, teamId: 'other' })).toBeNull();
      expect(await store.acceptVersion({ ...decision, decisionId: '123e4567-e89b-42d3-a456-426614174004', htmlSha256: '0'.repeat(64) }, owner)).toBe('UNAVAILABLE');
    } finally { await cleanup(root); }
  });
  it('denies altered snapshot and expired job at link/decision boundary', async () => {
    const root = await fs.mkdtemp(path.join(process.env.CVF_NCR_R1_FIXTURE_ROOT!, 'cvf-job-tamper-'));
    try {
      const store = new HtmlDraftSnapshotStore({ kind: 'local-synthetic', root, production: false, jobDecisions: true }, () => now);
      expect(await store.createJob(create, owner)).toBe('SAVED');
      expect(await store.save(draft, owner)).toBe('SAVED');
      const ns = (await fs.readdir(root)).find(x => x !== '.cvf-html-draft-synthetic.json')!;
      const file = path.join(root, ns, `${versionId}.json`);
      const value = JSON.parse(await fs.readFile(file, 'utf8'));
      await fs.writeFile(file, JSON.stringify({ ...value, html: '<h1>changed</h1>' }));
      expect(await store.linkVersion({ jobId, sourceRecordId, versionId }, owner)).toBe('UNAVAILABLE');
      const expired = new HtmlDraftSnapshotStore({ kind: 'local-synthetic', root, production: false, jobDecisions: true }, () => now + 86_400_000);
      expect(await expired.getJob(jobId, sourceRecordId, owner)).toBeNull();
    } finally { await cleanup(root); }
  });
});
