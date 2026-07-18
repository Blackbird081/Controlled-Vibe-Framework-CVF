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
  '/api/execute RTE1 runtimeTelemetry receipt live proof - Alibaba',
  () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
      process.env.ALIBABA_API_KEY = ALIBABA_API_KEY;

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
        userId: 'usr_rte1_live',
        user: 'RTE1 Live Tester',
        role: 'admin',
        orgId: 'org_cvf',
        teamId: 'team_rte1',
        expiresAt: Date.now() + 3_600_000,
        authMode: 'session',
      });
    });

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it('returns secret-safe runtimeTelemetry on the governance receipt', async () => {
      const template = getTemplateById('strategy_analysis');
      expect(template).toBeDefined();
      const inputs = {
        topic: 'CVF RTE1 runtime telemetry receipt proof',
        context: 'CVF adds bounded telemetry to the existing governance evidence receipt.',
        options: '1. Confirm telemetry field present\n2. Verify latency and token evidence\n3. Verify no raw prompt or key is present',
        constraints: 'Receipt metadata only. No provider routing, policy, prompt, or memory behavior change.',
        priority: 'Governance evidence',
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
          action: 'analyze strategy_analysis rte1 runtime telemetry receipt proof request',
          skillPreflightPassed: true,
          skillPreflightDeclaration: 'SKILL PREFLIGHT PASS: RTE1 receipt telemetry proof only.',
        }),
      });

      const response = await POST(req as never);
      const data = await response.json();
      const receipt = data.governanceEvidenceReceipt as Record<string, unknown>;
      const telemetry = receipt.runtimeTelemetry as Record<string, unknown>;

      expect(data.success).toBe(true);
      expect(receipt.decision).toBe('ALLOW');
      expect(telemetry).toMatchObject({
        schemaVersion: 'cvf.runtimeTelemetry.v1',
        costEstimateSource: 'cvf_model_pricing_table_or_fallback',
        redactionApplied: true,
        claimBoundary: 'summary_only_no_raw_prompt_output_key_or_provider_payload',
      });
      expect(typeof telemetry.providerLatencyMs).toBe('number');
      expect(typeof telemetry.routeElapsedMs).toBe('number');
      expect(typeof telemetry.estimatedCostUSD).toBe('number');
      expect((telemetry.governanceTraceEntryCount as number)).toBeGreaterThan(0);

      const serialized = JSON.stringify(telemetry);
      expect(serialized).not.toContain(ALIBABA_API_KEY);
      expect(serialized).not.toContain(inputs.topic);
      expect(serialized).not.toContain(inputs.context);

      console.log('[RTE1 live proof]', {
        receiptId: receipt.receiptId,
        envelopeId: receipt.envelopeId,
        decision: receipt.decision,
        provider: data.provider,
        model: data.model,
        runtimeTelemetry: telemetry,
      });
    }, 60_000);
  },
);
