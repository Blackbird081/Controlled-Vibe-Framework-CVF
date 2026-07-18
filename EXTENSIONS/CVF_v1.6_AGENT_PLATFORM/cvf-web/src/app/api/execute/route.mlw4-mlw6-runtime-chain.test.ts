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

describe('/api/execute MLW4-MLW6 runtime chain readouts', () => {
  const originalEnv = { ...process.env };
  const validOutput = [
    '## Runtime Chain Result',
    '',
    'Governed metadata evidence is available for continuity, audit feedback, and simulation review.',
  ].join('\n');
  let tempDir = '';

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-mlw4-mlw6-runtime-chain-'));
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
      userId: 'usr_mlw4_mlw6',
      user: 'MLW4 MLW6 Tester',
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

  it('emits linked continuity, audit-feedback, and simulation-gate readouts', async () => {
    const res = await POST(new Request('http://localhost/api/execute', {
      method: 'POST',
      body: JSON.stringify({
        templateName: 'Knowledge Query',
        intent: 'Summarize scoped learning-plane runtime metadata gates for governance users',
        inputs: {
          question: 'Which runtime metadata gates are present?',
          audience: 'Governance users',
          constraints: 'Use scoped retrieval only.',
        },
        provider: 'openai',
      }),
    }) as never);

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.executionContinuityHandoffReadout).toMatchObject({
      readoutVersion: 'cvf.mlw4.executionContinuityHandoffReadout.rt1.v1',
      stalenessVerdict: 'CURRENT',
      missingEvidence: [],
      runtimeRestoreAuthorized: false,
      runtimeHandoffMutationAuthorized: false,
      rawHandoffStored: false,
      autonomousMutationAuthorized: false,
    });
    expect(data.executionContinuityHandoffReadout.learningSignalRefs).toContain(
      data.evidenceToLearningReadout.signalId,
    );
    expect(data.auditFeedbackValidationReadout).toMatchObject({
      readoutVersion: 'cvf.mlw5.auditFeedbackValidationReadout.rt1.v1',
      mutationAuthorized: false,
      runtimeTrustMutationAuthorized: false,
      runtimePolicyMutationAuthorized: false,
      autonomousMutationAuthorized: false,
      evidenceReceiptRefs: {
        governanceReceiptId: data.governanceEvidenceReceipt.receiptId,
        contextBundleHash: data.contextBundleReadout.bundleHash,
        evidenceSignalId: data.evidenceToLearningReadout.signalId,
        continuityGateId: data.executionContinuityHandoffReadout.continuityGateId,
      },
    });
    expect(data.simulationFailureGateReadout).toMatchObject({
      readoutVersion: 'cvf.mlw6.simulationFailureGateReadout.rt1.v1',
      candidateRef: data.auditFeedbackValidationReadout.auditFeedbackId,
      scenarioSetId: 'cvf.mlw6.defaultScenarioSet.rt1.v1',
      criticalFailureCount: 0,
      automaticPromotionAuthorized: false,
      runtimeSimulationMutationAuthorized: false,
      runtimeTruthMutationAuthorized: false,
      autonomousMutationAuthorized: false,
      liveSimulationExecuted: false,
    });
    expect(data.simulationFailureGateReadout.scenarioResults).toHaveLength(7);
    expect(data.simulationFailureGateReadout.passCount)
      .toBeGreaterThanOrEqual(data.simulationFailureGateReadout.minimumPassThreshold);
    expect(JSON.stringify({
      mlw4: data.executionContinuityHandoffReadout,
      mlw5: data.auditFeedbackValidationReadout,
      mlw6: data.simulationFailureGateReadout,
    })).not.toMatch(/TENANT-A-SIGNAL|SHADOW-BETA|openai-test-key|sk-/i);
  });
});
