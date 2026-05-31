/**
 * EL-2 Worker Timeout Enforcement — Alibaba Live Proof
 *
 * Proves the `workerTimeoutReadout` advisory field is present in the
 * /api/execute ALLOW response for a live Alibaba call.
 *
 * Skipped automatically when no Alibaba/DashScope-compatible key is loaded.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveAlibabaApiKey } from '@/lib/alibaba-env';
import { getTemplateById, generateIntent } from '@/lib/templates';
import { WORKER_TIMEOUT_READOUT_VERSION } from '@/lib/worker-timeout-handler';

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
  '/api/execute EL-2 workerTimeoutReadout live proof — Alibaba',
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
        userId: 'usr_el2_live',
        user: 'EL-2 Live Tester',
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
      'returns workerTimeoutReadout with runtimeExecutionAuthorized=false in ALLOW response',
      async () => {
        const template = getTemplateById('strategy_analysis');
        expect(template).toBeDefined();

        const inputs = {
          topic: 'Evaluate CVF EL-2 Worker Timeout Enforcement readout advisory',
          context: 'The CVF execution layer has a new advisory field workerTimeoutReadout that surfaces worker timeout posture without killing processes.',
          options: '1. Confirm advisory field is live\n2. Verify runtimeExecutionAuthorized is false',
          constraints: 'Advisory proof only. No runtime process control.',
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
              model: 'qwen-turbo',
              mode: 'simple',
              cvfRiskLevel: 'R1',
              action: `analyze strategy_analysis el2-worker-timeout advisory proof request`,
              skillPreflightPassed: true,
              skillPreflightDeclaration: 'SKILL PREFLIGHT PASS: EL-2 advisory readout proof only. No implementation authorization.',
            }),
            headers: { 'Content-Type': 'application/json' },
          }) as never,
        );

        const body = await response.json();

        // Diagnostic log for failure triage
        if (!body.success) {
          console.error('[EL-2 DIAG] body:', JSON.stringify(body, null, 2));
        }

        // Live proof assertions
        expect(body.success, 'success must be true').toBe(true);
        expect(body.governanceEvidenceReceipt?.evidenceMode, 'evidenceMode must be live').toBe('live');
        expect(body.governanceEvidenceReceipt?.receiptId, 'receiptId must be present').toBeTruthy();
        expect(body.provider, 'provider must be alibaba').toBe('alibaba');

        // EL-2 specific assertions
        const wtr = body.workerTimeoutReadout;
        expect(wtr, 'workerTimeoutReadout must be present').toBeDefined();
        expect(wtr.contractVersion, 'contractVersion must match').toBe(WORKER_TIMEOUT_READOUT_VERSION);
        expect(wtr.triggered, 'triggered must be false for fast execution').toBe(false);
        expect(wtr.nextAction, 'nextAction must be not_triggered').toBe('not_triggered');
        expect(wtr.escalateToOrchestrator, 'escalateToOrchestrator must be false').toBe(false);
        expect(wtr.runtimeExecutionAuthorized, 'runtimeExecutionAuthorized INVARIANT must be false').toBe(false);

        // Security invariant
        const raw = JSON.stringify(body);
        expect(raw).not.toContain(process.env.ALIBABA_API_KEY ?? 'ALIBABA_API_KEY_NOT_SET');

        console.log('[EL-2 LIVE PROOF] receipt:', body.governanceEvidenceReceipt?.receiptId);
        console.log('[EL-2 LIVE PROOF] workerTimeoutReadout:', JSON.stringify(wtr));
      },
      60_000,
    );
  },
);
