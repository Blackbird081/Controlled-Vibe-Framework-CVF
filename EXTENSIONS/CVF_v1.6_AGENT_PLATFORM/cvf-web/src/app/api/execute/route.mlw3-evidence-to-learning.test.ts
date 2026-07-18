import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const executeAIMock = vi.hoisted(() => vi.fn());
const evaluateEnforcementMock = vi.hoisted(() => vi.fn());
const verifySessionCookieMock = vi.hoisted(() => vi.fn());
const checkTeamQuotaMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/ai', () => ({
  executeAI: executeAIMock,
  CVF_SYSTEM_PROMPT: 'BASE_SYSTEM_PROMPT',
}));

vi.mock('@/lib/enforcement', () => ({
  evaluateEnforcement: evaluateEnforcementMock,
}));

vi.mock('@/lib/middleware-auth', () => ({
  verifySessionCookie: verifySessionCookieMock,
  withSessionAuditPayload: (_session: unknown, payload?: Record<string, unknown>) => payload,
}));

vi.mock('@/lib/quota-guard', () => ({
  checkTeamQuota: checkTeamQuotaMock,
  hasSoftCapAuditEvent: vi.fn().mockResolvedValue(false),
}));

vi.mock('@/lib/guard-engine-singleton', () => ({
  getSharedGuardEngine: () => ({
    evaluate: () => ({ finalDecision: 'ALLOW', results: [] }),
  }),
}));

import { POST } from './route';

describe('/api/execute MLW3 evidence-to-learning readout', () => {
  const originalEnv = { ...process.env };
  const validOutput = '## Evidence To Learning Result\n\nGoverned retrieval evidence was used and converted only into metadata-level learning proposal evidence.';
  let tempDir = '';

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-mlw3-evidence-learning-'));
    process.env = { ...originalEnv };
    process.env.CVF_CONTROL_PLANE_EVENTS_PATH = path.join(tempDir, 'events.json');
    process.env.OPENAI_API_KEY = 'openai-test-key';
    delete process.env.ALIBABA_API_KEY;
    delete process.env.DASHSCOPE_API_KEY;
    delete process.env.CVF_BENCHMARK_ALIBABA_KEY;
    delete process.env.CVF_ALIBABA_API_KEY;
    delete process.env.CVF_SERVICE_TOKEN;

    executeAIMock.mockReset();
    evaluateEnforcementMock.mockReset();
    verifySessionCookieMock.mockReset();
    checkTeamQuotaMock.mockReset();

    executeAIMock.mockResolvedValue({
      success: true,
      output: validOutput,
      provider: 'openai',
      model: 'gpt-4o-mini',
    });
    evaluateEnforcementMock.mockReturnValue({ status: 'ALLOW', reasons: [] });
    checkTeamQuotaMock.mockResolvedValue({
      exceeded: false,
      currentUSD: 0,
      softCapUSD: 50,
      hardCapUSD: 100,
      overrideActive: false,
    });
    verifySessionCookieMock.mockResolvedValue({
      userId: 'usr_mlw3',
      user: 'MLW3 Tester',
      role: 'admin',
      orgId: 'org_a',
      teamId: 'team_a',
      expiresAt: Date.now() + 1000 * 60 * 60,
      authMode: 'session',
    });
  });

  afterEach(async () => {
    process.env = { ...originalEnv };
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  });

  it('emits proposal-only learning signal backed by governance receipt and context bundle hash', async () => {
    const res = await POST(new Request('http://localhost/api/execute', {
      method: 'POST',
      body: JSON.stringify({
        templateName: 'Knowledge Query',
        intent: 'Analyze tenant-a alpha-scope partition details for users with constraints',
        inputs: {
          question: 'What is the tenant-a codename?',
          audience: 'Tenant A users',
          constraints: 'Use scoped retrieval only.',
        },
        provider: 'openai',
      }),
    }) as never);

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.contextBundleReadout.bundleHash).toMatch(/^[0-9a-f]{64}$/);
    expect(data.evidenceToLearningReadout).toMatchObject({
      readoutVersion: 'cvf.mlw3.evidenceToLearningReadout.rt1.v1',
      proposalAction: 'REVIEW',
      autonomousMutationAuthorized: false,
      runtimeTruthMutationAuthorized: false,
      runtimeModelTuningAuthorized: false,
      rawOutputIncluded: false,
      rawContextIncluded: false,
      requiresGovernanceWorkOrder: false,
      evaluationCandidate: {
        basis: 'receipt_context_bundle_metadata',
        retrievedChunkCount: 1,
        knowledgeInjected: true,
        proposalOnly: true,
      },
      findingToLearningRecord: {
        bridgeVersion: 'cvf.findingToLearningSignalBridge.rt2.v1',
        lane: 'GOVERNANCE_CONTROL_PLANE',
        defectClass: 'RUNTIME_SIGNAL_GAP',
        feedbackClass: 'ACCEPT',
        autonomousMutationAuthorized: false,
      },
    });
    expect(data.evidenceToLearningReadout.evidenceReceiptRefs).toMatchObject({
      governanceReceiptId: data.governanceEvidenceReceipt.receiptId,
      envelopeId: data.governanceEvidenceReceipt.envelopeId,
      contextBundleId: data.contextBundleReadout.bundleId,
      contextBundleHash: data.contextBundleReadout.bundleHash,
    });
    expect(data.evidenceToLearningReadout.findingToLearningRecord.evidenceBasis).toContain(
      `receipt:${data.governanceEvidenceReceipt.receiptId}`,
    );
    expect(data.evidenceToLearningReadout.findingToLearningRecord.evidenceBasis).toContain(
      `contextBundle:${data.contextBundleReadout.bundleHash}`,
    );
    expect(JSON.stringify(data.evidenceToLearningReadout)).not.toMatch(/TENANT-A-SIGNAL|SHADOW-BETA|openai-test-key/i);
  });
});
