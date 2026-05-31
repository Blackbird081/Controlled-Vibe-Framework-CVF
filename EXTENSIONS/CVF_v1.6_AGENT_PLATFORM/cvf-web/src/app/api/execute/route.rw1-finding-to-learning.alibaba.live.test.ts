import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveAlibabaApiKey } from '@/lib/alibaba-env';
import { FINDING_TO_LEARNING_BRIDGE_VERSION } from '@/lib/finding-to-learning-bridge';
import { getTemplateById, generateIntent } from '@/lib/templates';

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
  '/api/execute RW1 findingToLearningReadout live proof — Alibaba',
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
        userId: 'usr_rw1_live',
        user: 'RW1 Live Tester',
        role: 'admin',
        orgId: 'org_cvf',
        teamId: 'team_rw1',
        expiresAt: Date.now() + 3_600_000,
        authMode: 'session',
      });
    });

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it('returns findingToLearningReadout with autonomousMutationAuthorized=false', async () => {
      const template = getTemplateById('strategy_analysis');
      expect(template).toBeDefined();
      const inputs = {
        topic: 'CVF RW1 finding-to-learning route wire-in proof',
        context: 'CVF now adds findingToLearningReadout to governed /api/execute ALLOW responses.',
        options: '1. Confirm findingToLearningReadout field present\n2. Verify advisory bridge version\n3. Verify autonomousMutationAuthorized=false',
        constraints: 'Advisory readout only. No learning mutation or enforcement.',
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
          action: 'analyze strategy_analysis rw1 finding-to-learning advisory proof request',
          skillPreflightPassed: true,
          skillPreflightDeclaration: 'SKILL PREFLIGHT PASS: RW1 finding-to-learning advisory readout proof only.',
        }),
      });

      const response = await POST(req as never);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.governanceEvidenceReceipt.decision).toBe('ALLOW');
      expect(data.findingToLearningReadout).toBeDefined();
      expect(data.findingToLearningReadout.bridgeVersion).toBe(FINDING_TO_LEARNING_BRIDGE_VERSION);
      expect(data.findingToLearningReadout.lane).toBe('GOVERNANCE_CONTROL_PLANE');
      expect(data.findingToLearningReadout.defectClass).toBe('RULE_GAP');
      expect(data.findingToLearningReadout.feedbackClass).toBe('ACCEPT');
      expect(data.findingToLearningReadout.requiresGovernanceWorkOrder).toBe(false);
      expect(data.findingToLearningReadout.autonomousMutationAuthorized).toBe(false);
      expect(data.findingToLearningReadout.evidenceBasis).toBe(`receipt:${data.governanceEvidenceReceipt.receiptId}`);

      console.log('[RW1 live proof]', {
        receiptId: data.governanceEvidenceReceipt.receiptId,
        envelopeId: data.governanceEvidenceReceipt.envelopeId,
        decision: data.governanceEvidenceReceipt.decision,
        provider: data.provider,
        model: data.model,
        findingToLearningReadout: data.findingToLearningReadout,
      });
    }, 60_000);
  },
);
