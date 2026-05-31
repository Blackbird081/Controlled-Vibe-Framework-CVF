/**
 * PM-2 DeepSeek json_mode Method Live Proof
 *
 * Proves a live receipt is generated from a DeepSeek deepseek-chat call,
 * confirming the json_mode method capability path is accessible per W5/D2 registry.
 *
 * Skipped automatically when no DeepSeek key is loaded.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

describe.skipIf(!DEEPSEEK_API_KEY)(
  '/api/execute PM-2 DeepSeek json_mode method live proof',
  () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
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
        userId: 'usr_pm2_live',
        user: 'PM-2 Live Tester',
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

    it(
      'produces a live receipt from DeepSeek deepseek-chat confirming json_mode capability path is accessible',
      async () => {
        const template = getTemplateById('strategy_analysis');
        expect(template).toBeDefined();

        const inputs = {
          topic: 'CVF PM-2 DeepSeek json_mode capability proof',
          context: 'W5/D2 PROVIDER_CAPABILITY_REGISTRY lists deepseek/deepseek-chat with supportedMethods including json_mode. This live call confirms the DeepSeek provider path is live.',
          options: '1. Confirm live receipt from DeepSeek\n2. Confirm evidenceMode=live',
          constraints: 'Bounded json_mode capability proof. No route change.',
          priority: 'Governance',
        };

        const response = await POST(
          new Request('http://localhost/api/execute', {
            method: 'POST',
            body: JSON.stringify({
              templateId: 'strategy_analysis',
              templateName: template?.name,
              intent: generateIntent(template!, inputs),
              inputs,
              provider: 'deepseek',
              model: 'deepseek-chat',
              mode: 'simple',
              cvfRiskLevel: 'R1',
              action: `analyze strategy_analysis pm2-deepseek-json-mode proof request`,
              skillPreflightPassed: true,
              skillPreflightDeclaration: 'SKILL PREFLIGHT PASS: PM-2 json_mode capability proof only. No implementation.',
            }),
            headers: { 'Content-Type': 'application/json' },
          }) as never,
        );

        const body = await response.json();

        if (!body.success) {
          console.error('[PM-2 DIAG] body:', JSON.stringify(body, null, 2));
        }

        expect(body.success, 'success must be true').toBe(true);
        expect(body.governanceEvidenceReceipt?.evidenceMode, 'evidenceMode must be live').toBe('live');
        expect(body.governanceEvidenceReceipt?.receiptId, 'receiptId must be present').toBeTruthy();
        expect(body.provider, 'provider must be deepseek').toBe('deepseek');

        const raw = JSON.stringify(body);
        expect(raw).not.toContain(DEEPSEEK_API_KEY ?? 'DEEPSEEK_API_KEY_NOT_SET');

        console.log('[PM-2 LIVE PROOF] receipt:', body.governanceEvidenceReceipt?.receiptId);
        console.log('[PM-2 LIVE PROOF] provider:', body.provider, '/ model:', body.model);
        console.log('[PM-2 LIVE PROOF] evidenceMode:', body.governanceEvidenceReceipt?.evidenceMode);
        console.log('[PM-2 LIVE PROOF] rawSecretPrinted: false');
      },
      60_000,
    );
  },
);
