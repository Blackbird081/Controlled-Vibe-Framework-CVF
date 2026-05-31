/**
 * CBP-1 Context Budget Readout — Alibaba Live Proof
 *
 * Proves the `contextBudgetReadout` advisory field is present in the
 * /api/execute ALLOW response for a live Alibaba call.
 *
 * Skipped automatically when no Alibaba/DashScope-compatible key is loaded.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveAlibabaApiKey } from '@/lib/alibaba-env';
import { getTemplateById, generateIntent } from '@/lib/templates';
import { CONTEXT_BUDGET_READOUT_VERSION } from '@/lib/context-budget-readout';

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
  '/api/execute CBP-1 contextBudgetReadout live proof — Alibaba',
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
        userId: 'usr_cbp1_live',
        user: 'CBP-1 Live Tester',
        role: 'admin',
        orgId: 'org_cvf',
        teamId: 'team_cbp1',
        expiresAt: Date.now() + 3_600_000,
        authMode: 'session',
      });
    });

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it('returns contextBudgetReadout with advisory fields in ALLOW response', async () => {
      const template = getTemplateById('strategy_analysis');
      expect(template).toBeDefined();
      const inputs = {
        topic: 'Evaluate CVF CBP-1 Context Budget readout advisory',
        context: 'CVF has a new contextBudgetReadout advisory field that surfaces token budget posture per task class.',
        options: '1. Confirm advisory field is live\n2. Verify runtimeExecutionAuthorized is false',
        constraints: 'Advisory proof only. No runtime enforcement.',
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
          action: 'analyze strategy_analysis cbp1-context-budget advisory proof request',
          skillPreflightPassed: true,
          skillPreflightDeclaration: 'SKILL PREFLIGHT PASS: CBP-1 advisory readout proof only.',
        }),
      });

      const response = await POST(req as never);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.governanceEvidenceReceipt.decision).toBe('ALLOW');

      // CBP-1 core assertion: contextBudgetReadout present and well-formed
      expect(data.contextBudgetReadout).toBeDefined();
      expect(data.contextBudgetReadout.contractVersion).toBe(CONTEXT_BUDGET_READOUT_VERSION);
      expect(data.contextBudgetReadout.taskClass).toBeDefined();
      expect(data.contextBudgetReadout.budgetTokens).toBeGreaterThan(0);
      expect(typeof data.contextBudgetReadout.withinBudget).toBe('boolean');
      expect(data.contextBudgetReadout.runtimeExecutionAuthorized).toBe(false);

      console.log('[CBP-1 live proof]', {
        receiptId: data.governanceEvidenceReceipt.receiptId,
        decision: data.governanceEvidenceReceipt.decision,
        contextBudgetReadout: data.contextBudgetReadout,
      });
    }, 30_000);
  },
);
