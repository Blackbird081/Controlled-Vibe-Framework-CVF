/**
 * VI5-T2 English Spec Freeze — Alibaba Live Proof
 *
 * Proves additive languageState/guidedStepState/specBoundary plus the
 * response-level englishSpecFreeze artifact on one live Vietnamese Strategy
 * /api/execute call. This does not prove all-pack guided catalog coverage.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveAlibabaApiKey } from '@/lib/alibaba-env';
import { generateIntent, getTemplateById } from '@/lib/templates';

const evaluateEnforcementMock = vi.hoisted(() => vi.fn());
const verifySessionCookieMock = vi.hoisted(() => vi.fn());
const checkTeamQuotaMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/enforcement', () => ({
  evaluateEnforcement: evaluateEnforcementMock,
}));

vi.mock('@/lib/middleware-auth', () => ({
  verifySessionCookie: verifySessionCookieMock,
  withSessionAuditPayload: (
    session: { impersonation?: { realActorId: string; sessionId: string } } | null | undefined,
    payload?: Record<string, unknown>,
  ) => {
    const nextPayload = { ...(payload ?? {}) };
    if (session?.impersonation) {
      nextPayload.impersonatedBy = session.impersonation.realActorId;
      nextPayload.impersonationSessionId = session.impersonation.sessionId;
    }
    return Object.keys(nextPayload).length > 0 ? nextPayload : undefined;
  },
}));

vi.mock('@/lib/quota-guard', () => ({
  checkTeamQuota: checkTeamQuotaMock,
  hasSoftCapAuditEvent: vi.fn().mockResolvedValue(false),
}));

import { POST } from './route';

const ALIBABA_API_KEY = resolveAlibabaApiKey();

describe.skipIf(!ALIBABA_API_KEY)(
  '/api/execute VI5-T2 English Spec freeze live proof — Alibaba governed path',
  () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
      process.env.ALIBABA_API_KEY = ALIBABA_API_KEY;

      evaluateEnforcementMock.mockReset();
      verifySessionCookieMock.mockReset();
      checkTeamQuotaMock.mockReset();

      evaluateEnforcementMock.mockReturnValue({ status: 'ALLOW', reasons: [] });
      checkTeamQuotaMock.mockResolvedValue({
        exceeded: false,
        currentUSD: 0,
        softCapUSD: 50,
        hardCapUSD: 100,
        overrideActive: false,
      });
      verifySessionCookieMock.mockResolvedValue({
        userId: 'usr_vi5_t1_live',
        user: 'VI5 T1 Live Tester',
        role: 'admin',
        orgId: 'org_cvf',
        teamId: 'team_exec',
        expiresAt: Date.now() + 3_600_000,
        authMode: 'session',
      });
    });

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it('returns additive VI5 language, Strategy guided, and English freeze readouts', async () => {
      const template = getTemplateById('strategy_analysis');
      expect(template).toBeDefined();

      const inputs = {
        topic: 'Mở rộng thị trường miền Trung cho sản phẩm SaaS B2B',
        context: 'Doanh nghiệp có 200 khách hàng hiện tại, doanh thu tăng chậm, ngân sách thử nghiệm hạn chế.',
        options: '1. Mở rộng trực tiếp\n2. Thử nghiệm qua đối tác\n3. Tạm hoãn để cải thiện onboarding',
        constraints: 'Ngân sách dưới 50.000 USD, chỉ cần khuyến nghị chiến lược, không triển khai vận hành.',
        priority: 'Tăng trưởng có kiểm soát',
      };

      const response = await POST(
        new Request('http://localhost/api/execute', {
          method: 'POST',
          body: JSON.stringify({
            templateId: 'strategy_analysis',
            templateName: template?.name,
            intent: generateIntent(template!, inputs),
            inputs,
            provider: 'alibaba',
            model: 'qwen-turbo',
            mode: 'simple',
            cvfRiskLevel: 'R1',
            action: 'analyze a Vietnamese Strategy workflow request for VI5 T2 English Spec freeze proof',
            skillPreflightPassed: true,
            skillPreflightDeclaration: 'SKILL PREFLIGHT PASS: VI5-T1 readout proof only, no implementation.',
            skillIds: ['strategy-analysis'],
            specFirst: {
              entryMode: 'template_first',
              sourceLanguage: 'vi',
              outputLanguage: 'vi',
              originalPrompt: 'Tôi muốn phân tích chiến lược mở rộng thị trường miền Trung.',
            },
            verticalIntegrationChain: {
              threadId: `vi5-t1-language-state-${Date.now()}`,
              turnIndex: 1,
              operatorGoal: 'prove VI5-T2 English Spec freeze readout',
            },
            aiCommit: {
              commitId: 'vi5-t1-language-state',
              agentId: 'codex-vi5-t1',
              timestamp: Date.now(),
              description: 'VI5-T2 English Spec freeze live proof',
            },
          }),
        }) as never,
      );

      const body = await response.json() as Record<string, unknown>;
      if (response.status !== 200 || body.success !== true) {
        const guard = body.guardResult as { blockedBy?: string; finalDecision?: string } | undefined;
        throw new Error(`VI5-T2 live proof failed: http=${response.status}; success=${String(body.success)}; error=${String(body.error ?? body.model ?? 'unknown')}; guard=${guard?.finalDecision ?? 'unknown'}:${guard?.blockedBy ?? 'none'}`);
      }

      const receipt = body.governanceEvidenceReceipt as Record<string, unknown> | undefined;
      expect(receipt).toMatchObject({
        evidenceMode: 'live',
        decision: 'ALLOW',
        provider: 'alibaba',
        model: 'qwen-turbo',
      });
      expect(body.languageState).toMatchObject({
        contractVersion: 'cvf.languageState.vi5.t1.v1',
        userInputLanguage: 'vi',
        userFacingResponseLanguage: 'vi',
        engineRoomLanguage: 'en',
        specContractLanguage: 'en',
        uiLayerLanguage: 'vi',
      });
      expect(body.guidedStepState).toMatchObject({
        contractVersion: 'cvf.guidedStepState.vi5.t1.v1',
        workflowId: 'workflow.strategy.strategy_analysis.v1',
        templateId: 'strategy_analysis',
        guidedModeAvailable: true,
        currentStep: 1,
        totalSteps: 3,
        stepIntent: 'strategy.type',
        allowFreeformAlternative: true,
        userMustChoose: true,
        transitionState: 'initial_step_presented',
      });
      expect(body.specBoundary).toMatchObject({
        contractVersion: 'cvf.specBoundary.vi5.t1.v1',
        specBlockLanguage: 'en',
        observedSpecBodyLanguage: 'mixed',
        englishFreezeEnforced: true,
        sourcePromptPreserved: true,
        normalizedSpecAvailable: true,
      });
      expect(body.englishSpecFreeze).toMatchObject({
        contractVersion: 'cvf.englishSpecFreeze.vi5.t2.v1',
        status: 'frozen',
        frozenSpecLanguage: 'en',
        sourcePromptLanguage: 'vi',
        sourcePromptPreserved: true,
        agentHandoffReady: true,
        userReviewRequired: true,
      });
      expect((body.englishSpecFreeze as { validation: Record<string, unknown> }).validation).toMatchObject({
        englishOnlyBody: true,
        requiredSectionsPresent: true,
        sourceEvidenceSeparated: true,
        blockedReasons: [],
      });
      expect(JSON.stringify(body)).not.toContain(ALIBABA_API_KEY);

      console.info(JSON.stringify({
        vi5T2EnglishSpecFreezeLiveReceipt: receipt?.receiptId,
        provider: 'alibaba',
        model: 'qwen-turbo',
        englishSpecFreezeStatus: (body.englishSpecFreeze as Record<string, unknown>).status,
        observedSpecBodyLanguage: (body.specBoundary as Record<string, unknown>).observedSpecBodyLanguage,
        englishFreezeEnforced: (body.specBoundary as Record<string, unknown>).englishFreezeEnforced,
        rawSecretPrinted: false,
      }));
    }, 120_000);
  },
);
