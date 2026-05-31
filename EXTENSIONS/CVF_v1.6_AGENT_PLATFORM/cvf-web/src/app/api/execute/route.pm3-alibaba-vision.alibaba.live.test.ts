/**
 * PM-3 Alibaba Vision Method Live Proof
 *
 * Proves a live receipt is generated from an Alibaba qwen-vl-plus vision call,
 * confirming the vision method capability path is accessible per W5/D2 registry.
 *
 * Skipped automatically when no Alibaba key is loaded.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveAlibabaApiKey } from '@/lib/alibaba-env';
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

// A small, publicly accessible image for governance proof purposes (1x1 red pixel PNG).
const PROOF_IMAGE_URL = 'https://www.gstatic.com/webp/gallery/1.jpg';

describe.skipIf(!ALIBABA_API_KEY)(
  '/api/execute PM-3 Alibaba vision method live proof',
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
        userId: 'usr_pm3_live',
        user: 'PM-3 Live Tester',
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
      'produces a live receipt from Alibaba qwen-vl-plus confirming vision capability path is accessible',
      async () => {
        const template = getTemplateById('strategy_analysis');
        expect(template).toBeDefined();

        const inputs = {
          topic: 'CVF PM-3 vision capability governance proof',
          context: 'Describe what you observe in the image to confirm vision route is live.',
          options: '1. Confirm vision route produces a receipt\n2. Confirm evidenceMode=live',
          constraints: 'Governance proof only. Describe the image briefly.',
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
              provider: 'alibaba',
              model: 'qwen-vl-plus',
              imageUrl: PROOF_IMAGE_URL,
              mode: 'simple',
              cvfRiskLevel: 'R1',
              action: `analyze strategy_analysis pm3-alibaba-vision proof request`,
              skillPreflightPassed: true,
              skillPreflightDeclaration: 'SKILL PREFLIGHT PASS: PM-3 vision capability proof only. No implementation.',
            }),
            headers: { 'Content-Type': 'application/json' },
          }) as never,
        );

        const body = await response.json();

        if (!body.success) {
          console.error('[PM-3 DIAG] body:', JSON.stringify(body, null, 2));
        }

        expect(body.success, 'success must be true').toBe(true);
        expect(body.governanceEvidenceReceipt?.evidenceMode, 'evidenceMode must be live').toBe('live');
        expect(body.governanceEvidenceReceipt?.receiptId, 'receiptId must be present').toBeTruthy();
        expect(body.governanceEvidenceReceipt?.vision, 'vision flag must be true').toBe(true);
        expect(body.provider, 'provider must be alibaba').toBe('alibaba');

        const raw = JSON.stringify(body);
        expect(raw).not.toContain(process.env.ALIBABA_API_KEY ?? 'ALIBABA_API_KEY_NOT_SET');

        console.log('[PM-3 LIVE PROOF] receipt:', body.governanceEvidenceReceipt?.receiptId);
        console.log('[PM-3 LIVE PROOF] provider:', body.provider, '/ model:', body.model);
        console.log('[PM-3 LIVE PROOF] vision:', body.governanceEvidenceReceipt?.vision);
        console.log('[PM-3 LIVE PROOF] evidenceMode:', body.governanceEvidenceReceipt?.evidenceMode);
        console.log('[PM-3 LIVE PROOF] rawSecretPrinted: false');
      },
      60_000,
    );
  },
);
