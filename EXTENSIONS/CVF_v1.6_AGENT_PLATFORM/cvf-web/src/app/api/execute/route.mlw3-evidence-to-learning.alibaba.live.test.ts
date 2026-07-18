/**
 * MLW3-RT1 — Evidence-to-Learning Alibaba Live Proof
 *
 * Proves that governed /api/execute emits proposal-only learning signal
 * evidence from real Alibaba execution receipt and MLW2 context bundle hash.
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
  '/api/execute MLW3 evidence-to-learning readout — Alibaba live proof',
  () => {
    const originalEnv = { ...process.env };
    let tempDir = '';

    beforeEach(async () => {
      tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-mlw3-evidence-learning-live-'));
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
        userId: 'usr_mlw3_live',
        user: 'MLW3 Live Tester',
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
      'emits proposal-only learning signal from live retrieval-backed execution',
      async () => {
        const res = await POST(new Request('http://localhost/api/execute', {
          method: 'POST',
          body: JSON.stringify({
            templateName: 'Governance Analysis',
            intent: 'Summarize executive finops quota evidence metadata for governance users with constraints',
            inputs: {
              topic: 'FinOps evidence metadata',
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
        expect(data.evidenceToLearningReadout).toMatchObject({
          readoutVersion: 'cvf.mlw3.evidenceToLearningReadout.rt1.v1',
          proposalAction: 'REVIEW',
          autonomousMutationAuthorized: false,
          runtimeTruthMutationAuthorized: false,
          runtimeModelTuningAuthorized: false,
          rawOutputIncluded: false,
          rawContextIncluded: false,
          requiresGovernanceWorkOrder: false,
        });
        expect(data.evidenceToLearningReadout.evidenceReceiptRefs.contextBundleHash)
          .toBe(data.contextBundleReadout.bundleHash);
        expect(data.evidenceToLearningReadout.findingToLearningRecord.evidenceBasis).toContain(
          `receipt:${data.governanceEvidenceReceipt.receiptId}`,
        );
        expect(data.evidenceToLearningReadout.findingToLearningRecord.evidenceBasis).toContain(
          `contextBundle:${data.contextBundleReadout.bundleHash}`,
        );
        expect(JSON.stringify(data.evidenceToLearningReadout)).not.toMatch(/ALPHA-ORBIT|ALIBABA_API_KEY|DASHSCOPE_API_KEY|sk-/i);
      },
      30_000,
    );
  },
);
