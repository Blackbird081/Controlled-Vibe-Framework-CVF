/**
 * MLW2-RT1 — Context Bundle Alibaba Live Proof
 *
 * Proves that the governed /api/execute route emits source-bounded
 * contextBundleReadout evidence during a real Alibaba provider execution.
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
  '/api/execute MLW2 context bundle readout — Alibaba live proof',
  () => {
    const originalEnv = { ...process.env };
    let tempDir = '';

    beforeEach(async () => {
      tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-mlw2-context-live-'));
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
        userId: 'usr_mlw2_live',
        user: 'MLW2 Live Tester',
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
      'emits source-bounded context bundle evidence with live retrieval-backed execution',
      async () => {
        const res = await POST(new Request('http://localhost/api/execute', {
          method: 'POST',
          body: JSON.stringify({
            templateName: 'Governance Analysis',
            intent: 'Analyze executive finops quota controls for governance users with constraints',
            inputs: {
              topic: 'FinOps escalation procedures',
              audience: 'Executive governance users',
              constraints: 'Use governed retrieval evidence only.',
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
        expect(data.contextBundleReadout).toMatchObject({
          readoutVersion: 'cvf.mlw2.contextBundleReadout.rt1.v1',
          cacheBoundary: 'DYNAMIC_REBUILD_REQUIRED',
          rawContextReleased: false,
          canReinject: false,
          runtimeContextMutationAuthorized: false,
        });
        expect(data.contextBundleReadout.retrievalTrace.chunkCount).toBeGreaterThanOrEqual(1);
        expect(data.contextBundleReadout.bundleHash).toMatch(/^[0-9a-f]{64}$/);
        expect(JSON.stringify(data.contextBundleReadout)).not.toMatch(/ALPHA-ORBIT|ALIBABA_API_KEY|sk-/i);
      },
      30_000,
    );
  },
);
