/**
 * MLW4-MLW6 RT1 — Runtime Chain Alibaba Live Proof
 *
 * Proves that governed /api/execute emits MLW4 continuity, MLW5 audit feedback,
 * and MLW6 simulation/failure gate readouts during a real Alibaba execution.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { resolveAlibabaApiKey } from '@/lib/alibaba-env';

const evaluateEnforcementMock = vi.hoisted(() => vi.fn());
const verifySessionCookieMock = vi.hoisted(() => vi.fn());
const checkTeamQuotaMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/enforcement', () => ({
  evaluateEnforcement: evaluateEnforcementMock,
}));

vi.mock('@/lib/middleware-auth', () => ({
  verifySessionCookie: verifySessionCookieMock,
  withSessionAuditPayload: (_session: unknown, payload?: Record<string, unknown>) => payload,
}));

vi.mock('@/lib/quota-guard', () => ({
  checkTeamQuota: checkTeamQuotaMock,
  hasSoftCapAuditEvent: vi.fn().mockResolvedValue(false),
}));

import { POST } from './route';

const ALIBABA_API_KEY = resolveAlibabaApiKey();

describe.skipIf(!ALIBABA_API_KEY)(
  '/api/execute MLW4-MLW6 runtime chain readouts — Alibaba live proof',
  () => {
    const originalEnv = { ...process.env };
    let tempDir = '';

    beforeEach(async () => {
      tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-mlw4-mlw6-runtime-chain-live-'));
      process.env.CVF_CONTROL_PLANE_EVENTS_PATH = path.join(tempDir, 'events.json');
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
        userId: 'usr_mlw4_mlw6_live',
        user: 'MLW4 MLW6 Live Tester',
        role: 'admin',
        orgId: 'org_cvf',
        teamId: 'team_exec',
        expiresAt: Date.now() + 3_600_000,
        authMode: 'session',
      });
    });

    afterEach(async () => {
      process.env = { ...originalEnv };
      if (tempDir) await rm(tempDir, { recursive: true, force: true });
    });

    it(
      'emits continuity, audit feedback, and simulation gate metadata from live execution',
      async () => {
        const res = await POST(new Request('http://localhost/api/execute', {
          method: 'POST',
          body: JSON.stringify({
            templateName: 'Governance Analysis',
            intent: 'Summarize executive learning-plane metadata evidence for governance users with constraints',
            inputs: {
              topic: 'Learning-plane metadata evidence',
              audience: 'Executive governance users',
              constraints: 'Use neutral wording only. Avoid approval, approve, bypass, override, and authorization language.',
            },
            provider: 'alibaba',
          }),
        }) as never);

        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(String(data.output ?? '').length).toBeGreaterThan(20);
        expect(data.knowledgeInjection).toMatchObject({
          injected: true,
          source: 'retrieval',
        });
        expect(data.executionContinuityHandoffReadout).toMatchObject({
          readoutVersion: 'cvf.mlw4.executionContinuityHandoffReadout.rt1.v1',
          stalenessVerdict: 'CURRENT',
          runtimeRestoreAuthorized: false,
          runtimeHandoffMutationAuthorized: false,
          rawHandoffStored: false,
          autonomousMutationAuthorized: false,
        });
        expect(data.auditFeedbackValidationReadout).toMatchObject({
          readoutVersion: 'cvf.mlw5.auditFeedbackValidationReadout.rt1.v1',
          mutationAuthorized: false,
          runtimeTrustMutationAuthorized: false,
          runtimePolicyMutationAuthorized: false,
          autonomousMutationAuthorized: false,
        });
        expect(data.auditFeedbackValidationReadout.evidenceReceiptRefs).toMatchObject({
          governanceReceiptId: data.governanceEvidenceReceipt.receiptId,
          contextBundleHash: data.contextBundleReadout.bundleHash,
          evidenceSignalId: data.evidenceToLearningReadout.signalId,
          continuityGateId: data.executionContinuityHandoffReadout.continuityGateId,
        });
        expect(data.simulationFailureGateReadout).toMatchObject({
          readoutVersion: 'cvf.mlw6.simulationFailureGateReadout.rt1.v1',
          candidateRef: data.auditFeedbackValidationReadout.auditFeedbackId,
          criticalFailureCount: 0,
          automaticPromotionAuthorized: false,
          runtimeSimulationMutationAuthorized: false,
          runtimeTruthMutationAuthorized: false,
          autonomousMutationAuthorized: false,
          liveSimulationExecuted: false,
        });
        expect(data.simulationFailureGateReadout.scenarioResults).toHaveLength(7);
        expect(JSON.stringify({
          mlw4: data.executionContinuityHandoffReadout,
          mlw5: data.auditFeedbackValidationReadout,
          mlw6: data.simulationFailureGateReadout,
        })).not.toMatch(/ALPHA-ORBIT|ALIBABA_API_KEY|DASHSCOPE_API_KEY|sk-/i);
      },
      30_000,
    );
  },
);
