import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveAlibabaApiKey } from '@/lib/alibaba-env';
import { getTemplateById, generateIntent } from '@/lib/templates';
import { LEARNING_PLANE_READOUT_VERSION } from '@/lib/learning-plane-readout';

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
  '/api/execute RT1 learningPlaneReadout live proof — Alibaba',
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
        userId: 'usr_rt1_live',
        user: 'RT1 Live Tester',
        role: 'admin',
        orgId: 'org_cvf',
        teamId: 'team_rt1',
        expiresAt: Date.now() + 3_600_000,
        authMode: 'session',
      });
    });

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it('returns learningPlaneReadout with DOCTRINE_APPLIED and runtimeScoringAuthorized=false', async () => {
      const template = getTemplateById('strategy_analysis');
      expect(template).toBeDefined();
      const inputs = {
        topic: 'CVF Learning Plane RT1 runtime wiring live proof',
        context: 'CVF has a new learningPlaneReadout advisory field in /api/execute ALLOW responses.',
        options: '1. Confirm learningPlaneReadout field present\n2. Verify outcome=DOCTRINE_APPLIED\n3. Verify runtimeScoringAuthorized=false',
        constraints: 'Advisory proof only. No runtime scoring enforcement.',
        priority: 'Governance',
      };

      const req = new Request('http://localhost/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: 'strategy_analysis',
          templateName: template?.name,
          intent: generateIntent(template!, inputs),
          inputs,
          provider: 'alibaba',
          model: 'qwen-turbo',
          mode: 'simple',
          cvfRiskLevel: 'R1',
          action: 'analyze strategy_analysis rt1-learning-plane advisory proof request',
          skillPreflightPassed: true,
          skillPreflightDeclaration: 'SKILL PREFLIGHT PASS: RT1 Learning Plane advisory readout proof only.',
        }),
      });

      const response = await POST(req as never);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.governanceEvidenceReceipt.decision).toBe('ALLOW');

      // RT1 core assertion: learningPlaneReadout present and well-formed
      expect(data.learningPlaneReadout).toBeDefined();
      expect(data.learningPlaneReadout.contractVersion).toBe(LEARNING_PLANE_READOUT_VERSION);
      expect(data.learningPlaneReadout.outcome).toBe('DOCTRINE_APPLIED');
      expect(data.learningPlaneReadout.isProvisional).toBe(false);
      expect(data.learningPlaneReadout.runtimeScoringAuthorized).toBe(false);
      expect(data.learningPlaneReadout.compositeScore).toBeGreaterThan(0);
      expect(data.learningPlaneReadout.advisoryNote.length).toBeGreaterThan(0);

      console.log('[RT1 live proof]', {
        receiptId: data.governanceEvidenceReceipt.receiptId,
        envelopeId: data.governanceEvidenceReceipt.envelopeId,
        decision: data.governanceEvidenceReceipt.decision,
        provider: data.provider,
        model: data.model,
        learningPlaneReadout: data.learningPlaneReadout,
      });
    }, 30_000);
  },
);
