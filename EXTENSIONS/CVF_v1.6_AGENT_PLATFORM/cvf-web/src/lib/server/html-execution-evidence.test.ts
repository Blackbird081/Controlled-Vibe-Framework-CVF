// Text Encoding Exception: fictional Vietnamese pilot copy is required for the locked title and CTA proof.
import { describe, expect, it } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import path from 'node:path';
import { buildReceiptIntegrityAnchor } from '@/lib/receipt-integrity-anchor';
import type { GovernanceEvidenceReceipt } from '@/lib/ai';
import type { HtmlPilotRuntimeProfile } from './ncr-html-pilot-runtime-profile';
import { HtmlPilotOperationLedger } from './ncr-html-pilot-operation-ledger';
import { htmlPilotRequestSha256, issueHtmlExecutionEvidence, verifyHtmlExecutionEvidence,
  verifyHtmlPilotSource, pilotAmbientContextPresent, measurePilotProvider, htmlPilotSystemPrompt } from './html-execution-evidence';

const secret = 'invented-offline-secret-2026';
const owner = { userId: 'developer', orgId: 'org', teamId: 'team' };
const base = { receiptId: 'receipt-1', evidenceMode: 'live', routeId: '/api/execute', provider: 'alibaba',
  model: 'qwen-flash', decision: 'ALLOW', policySnapshotId: 'policy-1' } as unknown as GovernanceEvidenceReceipt;
const receipt = { ...base, receiptIntegrity: buildReceiptIntegrityAnchor({ receipt: base, signingSecret: secret }) };
const goodOutput = '# Không gian đọc Ánh Sao\n## Giới thiệu\nKhông gian hư cấu.\n## Hoạt động\nĐọc sách cùng nhau.\n## Liên hệ\nGặp tại khu sinh hoạt.\nCTA: Đăng ký tham gia -> Liên hệ';
const profileDigest = 'c'.repeat(64);
function ownedRoot() {
  const root = process.env.CVF_NCR_TEST_ROOT;
  if (!root || !path.isAbsolute(root)) throw new Error('OWNED_TEST_ROOT_REQUIRED');
  return root;
}

describe('HTML source evidence', () => {
  it('pins the provider format to the locked fictional create/revision renderer', () => {
    const create = htmlPilotSystemPrompt(null);
    const revision = htmlPilotSystemPrompt('parent-run');
    expect(create).toContain('# Không gian đọc Ánh Sao');
    expect(revision).toContain('# Ngày hội đọc Ánh Sao');
    for (const prompt of [create, revision]) {
      expect(prompt).toContain('## Giới thiệu');
      expect(prompt).toContain('## Hoạt động');
      expect(prompt).toContain('## Liên hệ');
      expect(prompt).toContain('CTA: Đăng ký tham gia -> Liên hệ');
      expect(prompt).toContain('Do not add a code fence, raw HTML');
    }
  });
  it('binds exact output, receipt, owner, run and profile with a local HMAC', () => {
    const evidence = issueHtmlExecutionEvidence({ owner, operationKey: 'op1', requestSha256: 'a'.repeat(64),
      runId: 'b'.repeat(32), rootRunId: 'b'.repeat(32), parentRunId: null, parentOutputSha256: null,
      htmlJobId: null, receipt, output: goodOutput, provider: 'alibaba', model: 'qwen-flash',
      profileDigest: 'c'.repeat(64), secret });
    expect(evidence).not.toBeNull();
    expect(verifyHtmlExecutionEvidence({ evidence, receipt, output: goodOutput, owner, secret, expectedProfileDigest: 'c'.repeat(64) })).toBe(true);
    expect(verifyHtmlExecutionEvidence({ evidence, receipt, output: '# changed', owner, secret, expectedProfileDigest: 'c'.repeat(64) })).toBe(false);
    expect(verifyHtmlExecutionEvidence({ evidence, receipt, output: '# page', owner: { ...owner, userId: 'foreign' }, secret,
      expectedProfileDigest: 'c'.repeat(64) })).toBe(false);
    expect(verifyHtmlExecutionEvidence({ evidence: { ...evidence, parentRunId: 'd'.repeat(32) }, receipt, output: '# page',
      owner, secret, expectedProfileDigest: 'c'.repeat(64) })).toBe(false);
  });
  it('does not issue signed pilot source for provider output the exact job cannot render', () => {
    for (const output of [goodOutput.replace('Không gian đọc', 'Ngày hội đọc'),
      `${goodOutput}\nextra`, '<h1>Không gian đọc Ánh Sao</h1>']) {
      expect(issueHtmlExecutionEvidence({ owner, operationKey: 'op1', requestSha256: 'a'.repeat(64),
        runId: 'b'.repeat(32), rootRunId: 'b'.repeat(32), parentRunId: null, parentOutputSha256: null,
        htmlJobId: null, receipt, output, provider: 'alibaba', model: 'qwen-flash',
        profileDigest, secret })).toBeNull();
    }
  });
  it('rejects unsigned receipt without minting a pilot signature', () => {
    const unsigned = { ...base, receiptIntegrity: buildReceiptIntegrityAnchor({ receipt: base }) };
    expect(issueHtmlExecutionEvidence({ owner, operationKey: 'op1', requestSha256: 'a'.repeat(64),
      runId: 'b'.repeat(32), rootRunId: 'b'.repeat(32), parentRunId: null, parentOutputSha256: null,
      htmlJobId: null, receipt: unsigned, output: '# page', provider: 'alibaba', model: 'qwen-flash',
      profileDigest: 'c'.repeat(64), secret })).toBeNull();
  });
  it('joins signed source to a real owned outcome and rejects foreign, stale, and malformed source', async () => {
    const operationRoot = await mkdtemp(path.join(ownedRoot(), 'source-verifier-'));
    const ledger = new HtmlPilotOperationLedger(operationRoot);
    const claim = await ledger.claim({ operationKey: 'source-verifier', owner, requestSha256: 'a'.repeat(64),
      parentRunId: null, rootRunId: null });
    expect(claim.kind).toBe('CLAIMED');
    if (claim.kind !== 'CLAIMED') return;
    const evidence = issueHtmlExecutionEvidence({ owner, operationKey: claim.claim.operationKey,
      requestSha256: claim.claim.requestSha256, runId: claim.claim.runId, rootRunId: claim.claim.runId,
      parentRunId: null, parentOutputSha256: null, htmlJobId: null, receipt, output: goodOutput,
      provider: 'alibaba', model: 'qwen-flash', profileDigest, secret });
    expect(evidence).not.toBeNull();
    if (!evidence) return;
    expect(await ledger.saveOutcome(claim.claim, evidence.outputSha256, htmlPilotRequestSha256(evidence))).toBe(true);
    const profile = { operationRoot, provider: 'alibaba', model: 'qwen-flash', manifestSha256: profileDigest } as HtmlPilotRuntimeProfile;
    const previous = process.env.CVF_RECEIPT_HMAC_SECRET;
    process.env.CVF_RECEIPT_HMAC_SECRET = secret;
    try {
      const signed = { ...receipt, htmlPilotEvidence: evidence };
      expect(await verifyHtmlPilotSource({ receipt: signed, output: goodOutput, owner, profile,
        expectedJobId: null })).toEqual(evidence);
      expect(await verifyHtmlPilotSource({ receipt: signed, output: `${goodOutput}\nchanged`, owner, profile,
        expectedJobId: null })).toBeNull();
      expect(await verifyHtmlPilotSource({ receipt: signed, output: goodOutput,
        owner: { ...owner, userId: 'foreign' }, profile, expectedJobId: null })).toBeNull();
      expect(await verifyHtmlPilotSource({ receipt: signed, output: goodOutput, owner,
        profile: { ...profile, model: 'foreign-model' }, expectedJobId: null })).toBeNull();
      expect(await verifyHtmlPilotSource({ receipt: signed, output: goodOutput, owner, profile,
        expectedJobId: 'other-job' })).toBeNull();
      const altered = { ...signed, htmlPilotEvidence: { ...evidence, rootRunId: 'd'.repeat(32) } };
      expect(await verifyHtmlPilotSource({ receipt: altered, output: goodOutput, owner, profile })).toBeNull();
      const wrongRoot = await mkdtemp(path.join(ownedRoot(), 'wrong-title-'));
      const wrongLedger = new HtmlPilotOperationLedger(wrongRoot);
      const wrongClaim = await wrongLedger.claim({ operationKey: 'wrong-title', owner,
        requestSha256: 'b'.repeat(64), parentRunId: null, rootRunId: null });
      expect(wrongClaim.kind).toBe('CLAIMED');
      if (wrongClaim.kind !== 'CLAIMED') return;
      const wrongTitle = goodOutput.replace('Không gian đọc Ánh Sao', 'Ngày hội đọc Ánh Sao');
      const wrongTitleEvidence = issueHtmlExecutionEvidence({ owner, operationKey: wrongClaim.claim.operationKey,
        requestSha256: wrongClaim.claim.requestSha256, runId: wrongClaim.claim.runId,
        rootRunId: wrongClaim.claim.runId, parentRunId: null, parentOutputSha256: null, htmlJobId: null, receipt, output: wrongTitle,
        provider: 'alibaba', model: 'qwen-flash', profileDigest, secret });
      expect(wrongTitleEvidence).toBeNull();
      expect(await wrongLedger.readOutcome(wrongClaim.claim.runId, owner)).toBeNull();
    } finally {
      if (previous === undefined) delete process.env.CVF_RECEIPT_HMAC_SECRET;
      else process.env.CVF_RECEIPT_HMAC_SECRET = previous;
    }
  });
  it('refuses ambient context and measures the fully awaited provider promise', async () => {
    expect(pilotAmbientContextPresent({ knowledgeInjected: false })).toBe(false);
    expect(pilotAmbientContextPresent({ knowledgeInjected: true })).toBe(true);
    expect(pilotAmbientContextPresent({ knowledgeInjected: false, finalKnowledgeContext: 'retrieved' })).toBe(true);
    expect(pilotAmbientContextPresent({ knowledgeInjected: false, durableMemoryPromptBlock: 'memory' })).toBe(true);
    expect(pilotAmbientContextPresent({ knowledgeInjected: false, aifMemoryPromptBlock: 'memory' })).toBe(true);
    const order: string[] = [];
    const result = await measurePilotProvider(async () => {
      await Promise.resolve();
      order.push('provider-resolved');
      return 'complete';
    }, elapsed => { expect(elapsed).toBeGreaterThanOrEqual(0); order.push('recorded'); });
    expect(result).toBe('complete');
    expect(order).toEqual(['provider-resolved', 'recorded']);
  });
});
