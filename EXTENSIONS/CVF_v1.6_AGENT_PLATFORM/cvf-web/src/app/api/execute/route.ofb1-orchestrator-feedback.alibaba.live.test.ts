/**
 * OFB-1 Orchestrator Feedback Bus — Alibaba Live Proof
 *
 * Proves the `orchestratorFeedback` advisory field is present in the
 * /api/execute ALLOW response for a live Alibaba call.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveAlibabaApiKey } from '@/lib/alibaba-env';
import { getTemplateById, generateIntent } from '@/lib/templates';
import { ORCHESTRATOR_FEEDBACK_BUS_VERSION } from '@/lib/orchestrator-feedback-bus';

const evaluateEnforcementMock = vi.hoisted(() => vi.fn());
const verifySessionCookieMock = vi.hoisted(() => vi.fn());
const checkTeamQuotaMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/enforcement', () => ({ evaluateEnforcement: evaluateEnforcementMock }));
vi.mock('@/lib/middleware-auth', () => ({
  verifySessionCookie: verifySessionCookieMock,
  withSessionAuditPayload: (s: { impersonation?: { realActorId: string; sessionId: string } } | null | undefined, p?: Record<string, unknown>) => {
    const n = { ...(p ?? {}) };
    if (s?.impersonation) { n.impersonatedBy = s.impersonation.realActorId; n.impersonationSessionId = s.impersonation.sessionId; }
    return Object.keys(n).length > 0 ? n : undefined;
  },
}));
vi.mock('@/lib/quota-guard', () => ({
  checkTeamQuota: checkTeamQuotaMock,
  hasSoftCapAuditEvent: vi.fn().mockResolvedValue(false),
}));

import { POST } from './route';
const ALIBABA_API_KEY = resolveAlibabaApiKey();

describe.skipIf(!ALIBABA_API_KEY)(
  '/api/execute OFB-1 orchestratorFeedback live proof — Alibaba',
  () => {
    const originalEnv = { ...process.env };
    beforeEach(() => {
      process.env.ALIBABA_API_KEY = ALIBABA_API_KEY;
      evaluateEnforcementMock.mockReset();
      verifySessionCookieMock.mockReset();
      checkTeamQuotaMock.mockReset();
      evaluateEnforcementMock.mockReturnValue({ status: 'ALLOW', reasons: [] });
      checkTeamQuotaMock.mockResolvedValue({ exceeded: false, currentUSD: 0, softCapUSD: 50, hardCapUSD: 100, overrideActive: false });
      verifySessionCookieMock.mockResolvedValue({ userId: 'usr_ofb1_live', user: 'OFB-1 Live Tester', role: 'admin', orgId: 'org_cvf', teamId: 'team_ofb1', expiresAt: Date.now() + 3_600_000, authMode: 'session' });
    });
    afterEach(() => { process.env = { ...originalEnv }; });

    it('returns orchestratorFeedback with all signal types in ALLOW response', async () => {
      const template = getTemplateById('strategy_analysis');
      expect(template).toBeDefined();
      const inputs = { topic: 'Evaluate CVF OFB-1 Orchestrator Feedback Bus', context: 'CVF has a new orchestratorFeedback field that aggregates subagent signals.', options: '1. Confirm field present\n2. Verify overallSignal and runtimeExecutionAuthorized', constraints: 'Advisory proof only.', priority: 'Governance' };
      const req = new Request('http://localhost/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: 'strategy_analysis', templateName: template?.name, intent: generateIntent(template!, inputs), inputs, provider: 'alibaba', model: 'qwen-turbo', mode: 'simple', cvfRiskLevel: 'R1', action: 'analyze strategy_analysis ofb1-orchestrator-feedback advisory proof', skillPreflightPassed: true, skillPreflightDeclaration: 'SKILL PREFLIGHT PASS: OFB-1 advisory readout proof only.' }),
      });
      const response = await POST(req as never);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.governanceEvidenceReceipt.decision).toBe('ALLOW');
      expect(data.orchestratorFeedback).toBeDefined();
      expect(data.orchestratorFeedback.contractVersion).toBe(ORCHESTRATOR_FEEDBACK_BUS_VERSION);
      expect(['NOMINAL', 'CAUTION', 'ESCALATE']).toContain(data.orchestratorFeedback.overallSignal);
      expect(data.orchestratorFeedback.workerTimeoutSignal).toBeDefined();
      expect(data.orchestratorFeedback.reviewerRejectionSignal).toBeDefined();
      expect(data.orchestratorFeedback.contextBudgetSignal).toBeDefined();
      expect(data.orchestratorFeedback.runtimeExecutionAuthorized).toBe(false);
      console.log('[OFB-1 live proof]', { receiptId: data.governanceEvidenceReceipt.receiptId, orchestratorFeedback: data.orchestratorFeedback });
    }, 30_000);
  },
);
