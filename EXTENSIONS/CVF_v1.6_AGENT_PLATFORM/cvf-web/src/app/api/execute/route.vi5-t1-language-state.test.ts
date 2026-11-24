import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const providerSpy = vi.hoisted(() => vi.fn());
const evaluateEnforcementMock = vi.hoisted(() => vi.fn());
const verifySessionCookieMock = vi.hoisted(() => vi.fn());
const checkTeamQuotaMock = vi.hoisted(() => vi.fn());
const appendAuditEventMock = vi.hoisted(() => vi.fn());
let auditEventSequence = 0;

vi.mock('@/lib/ai', () => ({
  CVF_SYSTEM_PROMPT: 'BASE_SYSTEM_PROMPT',
}));

vi.mock('@/lib/enforcement', () => ({
  evaluateEnforcement: evaluateEnforcementMock,
}));

vi.mock('@/lib/middleware-auth', () => ({
  verifySessionCookie: verifySessionCookieMock,
  resolveVerifiedSessionProvenance: async () => ({ qualified: true, userId: 'user-tester', orgId: 'org-1', teamId: 'team-1', role: 'admin', oauthProvider: 'github', oauthSubject: 'route-test-subject', expiresAt: 4102444800000 }),
  withSessionAuditPayload: (_session: unknown, payload?: Record<string, unknown>) => payload,
}));

vi.mock('@/lib/quota-guard', () => ({
  checkTeamQuota: checkTeamQuotaMock,
  hasSoftCapAuditEvent: vi.fn().mockResolvedValue(false),
}));

vi.mock('@/lib/control-plane-events', async () => {
  const actual = await vi.importActual<typeof import('@/lib/control-plane-events')>('@/lib/control-plane-events');
  return {
    ...actual,
    appendAuditEvent: appendAuditEventMock,
    appendCostEvent: vi.fn(),
  };
});

import { POST } from './route';
import { useCanonicalRouteHarness } from '@/test/canonical-route-test-support';

describe('/api/execute VI5-T1 language state deterministic route readout', () => {
  const originalEnv = { ...process.env };
  const validOutput = '## Governed Response\n\nStructured strategy guidance.\n\n1. Compare options.\n2. Score constraints.\n3. Return recommendation.';
  let tempDir = '';

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-vi5-route-'));
    providerSpy.mockReset();
    evaluateEnforcementMock.mockReset();
    verifySessionCookieMock.mockReset();
    checkTeamQuotaMock.mockReset();
    appendAuditEventMock.mockReset();
    auditEventSequence = 0;
    appendAuditEventMock.mockImplementation(async () => ({
      id: `vi5-language-state-audit-${++auditEventSequence}`,
    }));
    process.env = { ...originalEnv, OPENAI_API_KEY: 'test-key', CVF_FALSE_POSITIVE_REPORTS_PATH: path.join(tempDir, 'false-positive-events.jsonl') };
    evaluateEnforcementMock.mockReturnValue({ status: 'ALLOW', reasons: [] });
    checkTeamQuotaMock.mockResolvedValue({ exceeded: false, currentUSD: 0, softCapUSD: 0, hardCapUSD: 0, overrideActive: false });
    verifySessionCookieMock.mockResolvedValue({ userId: 'user-tester', user: 'tester', role: 'admin', orgId: 'org-1', teamId: 'team-1', expiresAt: Date.now() + 3_600_000 });
  });

  afterEach(async () => {
    process.env = { ...originalEnv };
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  });

  it('returns languageState, guidedStepState, and specBoundary for Vietnamese Strategy requests', async () => {
    providerSpy.mockResolvedValue({
      success: true,
      output: validOutput,
      provider: 'openai',
      model: 'gpt-4o',
    });

    const res = await POST(new Request('http://localhost/api/execute', {
      method: 'POST',
      body: JSON.stringify({
        templateId: 'strategy_analysis',
        templateName: 'Phan tich chien luoc',
        intent: 'Phân tích chiến lược mở rộng thị trường miền Trung cho khách hàng SME',
        inputs: {
          topic: 'Mở rộng thị trường miền Trung',
          context: 'Doanh thu tăng chậm, ngân sách hạn chế, cần ưu tiên phân khúc.',
        },
        provider: 'openai',
        specFirst: {
          entryMode: 'template_first',
          sourceLanguage: 'vi',
          outputLanguage: 'vi',
          originalPrompt: 'Tôi muốn phân tích chiến lược mở rộng thị trường miền Trung.',
        },
      }),
    }) as never);

    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.languageState).toMatchObject({
      contractVersion: 'cvf.languageState.vi5.t1.v1',
      userInputLanguage: 'vi',
      userFacingResponseLanguage: 'vi',
      engineRoomLanguage: 'en',
      specContractLanguage: 'en',
      uiLayerLanguage: 'vi',
    });
    expect(data.guidedStepState).toMatchObject({
      contractVersion: 'cvf.guidedStepState.vi5.t1.v1',
      workflowId: 'workflow.strategy.strategy_analysis.v1',
      templateId: 'strategy_analysis',
      guidedModeAvailable: true,
      currentStep: 1,
      totalSteps: 3,
      stepIntent: 'strategy.type',
      transitionState: 'initial_step_presented',
    });
    expect(data.guidedStepState.presentedOptions.map((option: { id: string }) => option.id)).toEqual(['strategic_decision', 'market_entry', 'competitive_response', 'other']);
    expect(data.guidedStepState.capturedSpecFields).toEqual(['strategy.type', 'strategy.constraints', 'strategy.outputFormat']);
    expect(data.englishSpecFreeze).toMatchObject({
      contractVersion: 'cvf.englishSpecFreeze.vi5.t2.v1',
      status: 'frozen',
      frozenSpecLanguage: 'en',
      sourcePromptLanguage: 'vi',
      sourcePromptPreserved: true,
      agentHandoffReady: true,
      userReviewRequired: true,
    });
    expect(data.englishSpecFreeze.validation).toMatchObject({
      englishOnlyBody: true,
      requiredSectionsPresent: true,
      sourceEvidenceSeparated: true,
      blockedReasons: [],
    });
    expect(data.englishSpecFreeze.frozenSpec).not.toContain('miền Trung');
    expect(data.specBoundary).toMatchObject({
      contractVersion: 'cvf.specBoundary.vi5.t1.v1',
      observedSpecBodyLanguage: 'mixed',
      englishFreezeEnforced: true,
      sourcePromptPreserved: true,
    });
    expect(data.specBoundary.frozen).toBe(true);
  });

  // Canonical Gateway harness: lineage journal + provider transport double (replaces the removed executeAI mock).
  useCanonicalRouteHarness(providerSpy);
});
