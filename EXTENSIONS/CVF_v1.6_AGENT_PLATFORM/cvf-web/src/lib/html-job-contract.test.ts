import { describe, expect, it } from 'vitest';
import { JOB_EFFECTS, PILOT_JOB_EFFECTS, makeJob, parseAcceptVersion, parseCreateJob, parseLinkVersion,
  parseProductDecision, validateJob } from './html-job-contract';

const id = '123e4567-e89b-42d3-a456-426614174001';
const request = { title: 't', sourcePath: 'p', sourceContent: 's', memoryClass: 'FULL_RECORD', status: 'DRAFT', claimBoundary: 'local', receiptAnchor: 'r' };
const owner = { userId: 'u1', orgId: 'o1', teamId: 't1' };
describe('HTML job contract', () => {
  it('accepts one exact immutable request and rejects added authority and duplicate criteria', () => {
    const input = { jobId: id, sourceRecordId: 'ncr-synthetic-1', goal: 'Review HTML',
      criteria: [{ criterionId: 'c1', text: 'Heading is visible' }], expectedOutput: 'HTML', allowedEffects: JOB_EFFECTS, request };
    const parsed = parseCreateJob(input);
    expect(parsed).not.toBeNull();
    expect(parseCreateJob({ ...input, owner })).toBeNull();
    expect(parseCreateJob({ ...input, criteria: [input.criteria[0], input.criteria[0]] })).toBeNull();
    expect(parseCreateJob({ ...input, goal: 'Bearer abcdefghijklmnopqrstuvwxyz' })).toBeNull();
    const job = makeJob(parsed!, owner, Date.parse('2026-10-18T00:00:00.000Z'));
    expect(validateJob(job, owner, Date.parse('2026-10-18T00:00:01.000Z'))?.requestSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(validateJob(job, { ...owner, teamId: 't2' }, Date.parse('2026-10-18T00:00:01.000Z'))).toBeNull();
  });
  it('rejects supplied hashes in link input and incomplete person review', () => {
    expect(parseLinkVersion({ jobId: id, sourceRecordId: 'ncr-synthetic-1', versionId: id, htmlSha256: '0'.repeat(64) })).toBeNull();
    const base = { decisionId: id, jobId: id, sourceRecordId: 'ncr-synthetic-1', versionId: id,
      requestSha256: '1'.repeat(64), htmlSha256: '2'.repeat(64),
      criteriaReview: [{ criterionId: 'c1', passed: true, reviewNote: 'Checked heading' }], reviewedVersionConfirmed: true };
    expect(parseAcceptVersion(base)).not.toBeNull();
    expect(parseAcceptVersion({ ...base, reviewedVersionConfirmed: false })).toBeNull();
    expect(parseAcceptVersion({ ...base, criteriaReview: [{ criterionId: 'c1', passed: true, reviewNote: '' }] })).toBeNull();
  });
  it('keeps a pilot job separate from synthetic review and binds exact product-decision hashes', () => {
    const sourceRecordId = 'a'.repeat(32);
    const pilotSource = { receipt: { htmlPilotEvidence: { rootRunId: sourceRecordId, parentRunId: null,
      outputSha256: 'b'.repeat(64), profileDigest: 'c'.repeat(64) } } };
    const created = parseCreateJob({ jobId: id, sourceRecordId, goal: 'Fictional HTML',
      criteria: [{ criterionId: 'source', text: 'Exact source' }], expectedOutput: 'HTML', allowedEffects: PILOT_JOB_EFFECTS,
      request, pilotSource });
    expect(created).not.toBeNull();
    expect(makeJob(created!, owner, Date.parse('2026-10-18T00:00:00Z')).pilotRootRunId).toBe(sourceRecordId);
    expect(parseCreateJob({ ...created, allowedEffects: JOB_EFFECTS })).toBeNull();
    const decision = { jobId: id, sourceRecordId, versionId: id, decisionId: id, htmlSha256: 'd'.repeat(64),
      sourceEvidenceSha256: 'e'.repeat(64), decision: 'ACCEPTED', reviewedVersionConfirmed: true };
    expect(parseProductDecision(decision)).not.toBeNull();
    expect(parseProductDecision({ ...decision, reviewedVersionConfirmed: false })).toBeNull();
    expect(parseProductDecision({ ...decision, htmlSha256: 'f'.repeat(63) })).toBeNull();
  });
});
