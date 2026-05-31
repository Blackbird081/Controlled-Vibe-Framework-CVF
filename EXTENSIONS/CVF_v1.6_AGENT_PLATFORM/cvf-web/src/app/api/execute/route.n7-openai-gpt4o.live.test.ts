/**
 * N7 — OpenAI gpt-4o Governed Path Live Proof
 *
 * Executes one narrow /api/execute call through the existing governed route.
 * Skips automatically when OPENAI_API_KEY / CVF_OPENAI_API_KEY is absent.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveOpenAIApiKey } from '@/lib/openai-env';
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

const OPENAI_API_KEY = resolveOpenAIApiKey();

describe.skipIf(!OPENAI_API_KEY)('N7 OpenAI gpt-4o governed path live proof', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.OPENAI_API_KEY = OPENAI_API_KEY;
    process.env.DEFAULT_AI_PROVIDER = 'openai';

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
      userId: 'usr_n7_openai_live',
      user: 'N7 OpenAI Live Tester',
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

  it('returns one live ALLOW receipt for OpenAI gpt-4o without exposing the raw key', async () => {
    const template = getTemplateById('documentation');
    expect(template).toBeDefined();
    const inputs = {
      subject: 'N7 OpenAI provider onboarding runbook',
      currentNotes: 'Confirm one governed execution can route to OpenAI gpt-4o at R2 and return a bounded operations note.',
      readerGoal: 'Operator can verify the new provider lane without treating it as broad stability evidence.',
      audience: 'CVF maintainer',
      mustPreserve: 'No raw key exposure, no receipt schema change, no production readiness claim.',
    };

    const response = await POST(
      new Request('http://localhost/api/execute', {
        method: 'POST',
        body: JSON.stringify({
          templateId: 'documentation',
          templateName: template?.name,
          intent: generateIntent(template!, inputs),
          inputs,
          provider: 'openai',
          model: 'gpt-4o',
          mode: 'simple',
          cvfPhase: 'PHASE B',
          cvfRiskLevel: 'R2',
          action: 'analyze provider execution request',
          aiCommit: {
            commitId: 'n7-openai-gpt4o-live-proof',
            agentId: 'codex-n7-provider-proof',
            timestamp: Date.now(),
            description: 'N7 OpenAI gpt-4o governed path live proof',
          },
        }),
      }) as never,
    );

    const body = await response.json() as Record<string, unknown>;
    const receipt = body.governanceEvidenceReceipt as Record<string, unknown> | undefined;
    const output = String(body.output ?? '');

    if (response.status !== 200) {
      const guard = body.guardResult as { blockedBy?: string; finalDecision?: string } | undefined;
      throw new Error(`N7 OpenAI proof returned HTTP ${response.status}: ${String(body.error ?? body.model ?? 'unknown')}; guard=${guard?.finalDecision ?? 'unknown'}:${guard?.blockedBy ?? 'none'}`);
    }

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.provider).toBe('openai');
    expect(body.model).toBe('gpt-4o');
    expect(output.length).toBeGreaterThan(100);
    expect(receipt).toMatchObject({
      evidenceMode: 'live',
      decision: 'ALLOW',
      provider: 'openai',
      model: 'gpt-4o',
      routingDecision: 'ALLOW',
    });
    expect(String(receipt?.receiptId ?? '')).toMatch(/^rcpt-/);
    expect(JSON.stringify(body)).not.toContain(OPENAI_API_KEY);
    console.info(JSON.stringify({
      n7OpenAiReceiptId: receipt?.receiptId,
      n7OpenAiTraceId: receipt?.envelopeId,
      provider: body.provider,
      model: body.model,
      evidenceMode: receipt?.evidenceMode,
      decision: receipt?.decision,
      routingDecision: receipt?.routingDecision,
      rawSecretPrinted: false,
    }));
  }, 120_000);
});
