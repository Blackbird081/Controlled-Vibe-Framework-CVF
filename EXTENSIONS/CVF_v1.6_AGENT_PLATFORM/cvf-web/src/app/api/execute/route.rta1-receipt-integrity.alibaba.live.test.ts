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

describe.skipIf(!ALIBABA_API_KEY)(
  '/api/execute RTA1 receiptIntegrity live proof - Alibaba',
  () => {
    const originalEnv = { ...process.env };
    const signingSecret = 'rta1-live-test-secret';

    beforeEach(() => {
      process.env.ALIBABA_API_KEY = ALIBABA_API_KEY;
      process.env.CVF_RECEIPT_HMAC_SECRET = signingSecret;

      evaluateEnforcementMock.mockReset();
      verifySessionCookieMock.mockReset();
      checkTeamQuotaMock.mockReset();

      evaluateEnforcementMock.mockReturnValue({ status: 'ALLOW', reasons: [], riskGate: { riskLevel: 'R1' } });
      checkTeamQuotaMock.mockResolvedValue({
        exceeded: false,
        currentUSD: 0,
        softCapUSD: 50,
        hardCapUSD: 100,
        overrideActive: false,
      });
      verifySessionCookieMock.mockResolvedValue({
        userId: 'usr_rta1_live',
        user: 'RTA1 Live Tester',
        role: 'admin',
        orgId: 'org_cvf',
        teamId: 'team_rta1',
        expiresAt: Date.now() + 3_600_000,
        authMode: 'session',
      });
    });

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it('returns secret-safe signed receiptIntegrity on the governance receipt', async () => {
      const template = getTemplateById('strategy_analysis');
      expect(template).toBeDefined();
      const inputs = {
        topic: 'CVF RTA1 receipt integrity proof',
        context: 'CVF adds a local receipt hash and optional HMAC digest status to the governance receipt.',
        options: '1. Confirm receiptIntegrity field present\n2. Verify signer status\n3. Verify no raw credential material is present',
        constraints: 'Receipt metadata only. No external immutability claim.',
        priority: 'Auditability evidence',
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
          action: 'analyze strategy_analysis rta1 receipt integrity proof request',
          skillPreflightPassed: true,
          skillPreflightDeclaration: 'SKILL PREFLIGHT PASS: RTA1 receipt integrity proof only.',
        }),
      });

      const response = await POST(req as never);
      const data = await response.json();

      expect(response.status, JSON.stringify({
        success: data.success,
        error: data.error,
        diagnostic: data.diagnostic,
        hasReceipt: Boolean(data.governanceEvidenceReceipt),
      })).toBe(200);
      expect(data.governanceEvidenceReceipt, JSON.stringify({
        success: data.success,
        error: data.error,
        diagnostic: data.diagnostic,
      })).toBeDefined();

      const receipt = data.governanceEvidenceReceipt as Record<string, unknown>;
      const integrity = receipt.receiptIntegrity as Record<string, unknown>;

      expect(data.success).toBe(true);
      expect(receipt.decision).toBe('ALLOW');
      expect(integrity).toMatchObject({
        schemaVersion: 'cvf.receiptIntegrity.v1',
        canonicalization: 'stable-json-v1',
        digestAlgorithm: 'sha256',
        hmacAlgorithm: 'hmac-sha256',
        signatureStatus: 'SIGNED',
        externalAnchorStatus: 'NOT_PROVIDED',
        redactionApplied: true,
        claimBoundary: 'local_receipt_integrity_only_no_third_party_immutability_without_external_anchor',
      });
      expect(integrity.receiptHash).toMatch(/^[a-f0-9]{64}$/);
      expect(integrity.signatureDigest).toMatch(/^[a-f0-9]{64}$/);

      const serialized = JSON.stringify(integrity);
      expect(serialized).not.toContain(ALIBABA_API_KEY);
      expect(serialized).not.toContain(signingSecret);
      expect(serialized).not.toContain(inputs.topic);
      expect(serialized).not.toContain(inputs.context);

      console.log('[RTA1 live proof]', {
        receiptId: receipt.receiptId,
        envelopeId: receipt.envelopeId,
        decision: receipt.decision,
        provider: data.provider,
        model: data.model,
        receiptIntegrity: integrity,
      });
    }, 60_000);
  },
);
