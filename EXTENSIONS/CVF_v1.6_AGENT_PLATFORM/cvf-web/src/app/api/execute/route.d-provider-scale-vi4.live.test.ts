/**
 * D Provider Scale — VI4 Live Proof
 *
 * Proves the existing /api/execute route exposes the VI4 evidence package on
 * live DeepSeek and OpenAI lanes. Alibaba is already covered by VI4.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveDeepSeekApiKey } from '@/lib/deepseek-env';
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

const DEEPSEEK_API_KEY = resolveDeepSeekApiKey();
const OPENAI_API_KEY = resolveOpenAIApiKey();

const testDeepSeek = DEEPSEEK_API_KEY ? it : it.skip;
const testOpenAI = OPENAI_API_KEY ? it : it.skip;

type ProviderProof = {
  provider: 'deepseek' | 'openai';
  model: 'deepseek-chat' | 'gpt-4o';
  key: string;
};

describe.skipIf(!DEEPSEEK_API_KEY && !OPENAI_API_KEY)(
  '/api/execute D provider scale VI4 live proof',
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
        userId: 'usr_d_provider_scale_live',
        user: 'D Provider Scale Live Tester',
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

    async function runProviderProof(proof: ProviderProof) {
      if (proof.provider === 'deepseek') {
        process.env.DEEPSEEK_API_KEY = proof.key;
      } else {
        process.env.OPENAI_API_KEY = proof.key;
      }

      const template = getTemplateById('app_builder_complete');
      expect(template).toBeDefined();
      const inputs = {
        appName: `ProviderScale-${proof.provider}`,
        appType: 'Web App',
        problem: 'Small teams need a simple governed planning board without switching tools.',
        targetUsers: 'Ops lead and 3-5 internal collaborators',
        coreFeatures: 'Create task\nAssign owner\nTrack status\nExport summary',
        successCriteria: 'Create a task in one minute and see the next action clearly.',
        platforms: 'Desktop web browser',
        constraints: 'Keep this as a proof packet only; no implementation or production readiness claim.',
      };

      const response = await POST(
        new Request('http://localhost/api/execute', {
          method: 'POST',
          body: JSON.stringify({
            templateId: 'app_builder_complete',
            templateName: template?.name,
            intent: generateIntent(template!, inputs),
            inputs,
            provider: proof.provider,
            model: proof.model,
            mode: 'simple',
            cvfPhase: 'PHASE B',
            cvfRiskLevel: 'R1',
            action: 'analyze provider scale VI4 proof request',
            skillPreflightPassed: true,
            skillPreflightDeclaration: 'SKILL PREFLIGHT PASS: provider scale VI4 proof only, no implementation.',
            skillIds: ['product-brief-authoring'],
            verticalIntegrationChain: {
              threadId: `d-provider-scale-${proof.provider}-${Date.now()}`,
              turnIndex: 1,
              operatorGoal: `prove VI4 evidence package on ${proof.provider}`,
            },
            aiCommit: {
              commitId: `d-provider-scale-${proof.provider}-vi4-live-proof`,
              agentId: 'codex-d-provider-scale',
              timestamp: Date.now(),
              description: `D provider scale VI4 live proof on ${proof.provider}`,
            },
          }),
        }) as never,
      );

      const body = await response.json() as Record<string, unknown>;
      if (response.status !== 200 || body.success !== true) {
        const guard = body.guardResult as { blockedBy?: string; finalDecision?: string } | undefined;
        throw new Error(`D provider scale ${proof.provider} proof failed: http=${response.status}; success=${String(body.success)}; error=${String(body.error ?? body.model ?? 'unknown')}; guard=${guard?.finalDecision ?? 'unknown'}:${guard?.blockedBy ?? 'none'}`);
      }

      const receipt = body.governanceEvidenceReceipt as Record<string, unknown> | undefined;
      const readout = body.verticalIntegrationReadout as Record<string, unknown> | undefined;
      const evidencePackage = readout?.evidencePackage as Record<string, unknown> | undefined;

      expect(body.provider).toBe(proof.provider);
      expect(body.model).toBe(proof.model);
      expect(receipt).toMatchObject({
        evidenceMode: 'live',
        decision: 'ALLOW',
        provider: proof.provider,
        model: proof.model,
      });
      expect(readout).toMatchObject({
        contractVersion: 'cvf.verticalWorkflowIntegration.vi1.v1',
        status: 'integrated',
        integratedSurfaceCount: 11,
      });
      expect(evidencePackage).toMatchObject({
        contractVersion: 'cvf.verticalEvidencePackage.vi4.v1',
        callLevel: {
          totalCalls: 1,
          successfulCalls: 1,
          failedCalls: 0,
          liveCalls: 1,
          receiptBackedCalls: 1,
          callPassRate: 1,
        },
        eventModel: {
          totalEvents: 11,
          eventsPerCall: 11,
        },
        toolAction: {
          taxonomyVersion: 'cvf.toolActionTaxonomy.w3.v1',
          decision: 'ALLOW',
          runtimeExecutionAuthorized: false,
        },
        toolActionApproval: {
          contractVersion: 'cvf.toolActionApprovalReadout.ta1.v1',
          approvalState: 'not_required',
          runtimeExecutionAuthorized: false,
        },
        providerMethod: {
          contractVersion: 'cvf.providerMethodFallbackNormalization.w5.v1',
          status: 'ready',
          adapterExecutionAuthorized: true,
          diagnosticClass: 'none',
        },
      });
      expect(JSON.stringify(body)).not.toContain(proof.key);
      console.info(JSON.stringify({
        provider: proof.provider,
        model: proof.model,
        receiptId: receipt?.receiptId,
        traceId: receipt?.envelopeId,
        evidenceMode: receipt?.evidenceMode,
        vi4Package: evidencePackage?.contractVersion,
        rawSecretPrinted: false,
      }));
    }

    testDeepSeek(
      'exposes VI4 evidence package on DeepSeek live lane',
      async () => {
        await runProviderProof({
          provider: 'deepseek',
          model: 'deepseek-chat',
          key: DEEPSEEK_API_KEY!,
        });
      },
      120_000,
    );

    testOpenAI(
      'exposes VI4 evidence package on OpenAI live lane',
      async () => {
        await runProviderProof({
          provider: 'openai',
          model: 'gpt-4o',
          key: OPENAI_API_KEY!,
        });
      },
      120_000,
    );
  },
);
