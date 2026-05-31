/**
 * C Workflow Scale — Alibaba Live VI Proof
 *
 * Proves Strategy, Marketing Campaign, and Brand Voice workflow bindings flow
 * through the existing /api/execute route and VI4 readout on a live provider
 * lane. This is a bounded scale proof, not a broad workflow-engine claim.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveAlibabaApiKey } from '@/lib/alibaba-env';
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

const ALIBABA_API_KEY = resolveAlibabaApiKey();

type WorkflowProofCase = {
  templateId: 'strategy_analysis' | 'marketing_campaign_wizard' | 'brand_voice';
  workflowId: string;
  skillId: string;
  inputs: Record<string, string>;
  fallbackIntent?: string;
};

const WORKFLOW_CASES: readonly WorkflowProofCase[] = [
  {
    templateId: 'strategy_analysis',
    workflowId: 'workflow.strategy.strategy_analysis.v1',
    skillId: 'strategy-analysis',
    inputs: {
      topic: 'Evaluate a regional launch for a governed SMB productivity tool',
      context: 'A small SaaS team has 12 pilot customers, limited support capacity, and wants a bounded next-market decision.',
      options: '1. Direct regional launch\n2. Partner-led pilot\n3. Delay and harden onboarding',
      constraints: 'Budget below $50K, decision package only, no implementation authorization.',
      priority: 'Growth',
    },
  },
  {
    templateId: 'marketing_campaign_wizard',
    workflowId: 'workflow.marketing.create_campaign_brief.v1',
    skillId: 'campaign-brief-authoring',
    inputs: {
      campaignName: 'Governed Launch Pilot',
      audience: 'Non-coder founders evaluating AI workflow governance',
      objective: 'Create a clear campaign brief with proof-backed next actions',
      channels: 'Email, LinkedIn, landing-page copy',
      constraints: 'Proof packet only; do not execute spend or publish campaign assets.',
    },
    fallbackIntent: [
      'INTENT:',
      'Create a governed marketing campaign brief for the Governed Launch Pilot.',
      '',
      'CONTEXT:',
      'Audience: Non-coder founders evaluating AI workflow governance.',
      'Objective: Explain the campaign angle, channels, proof needs, and review gate.',
      'Constraints: Proof packet only; no spend, publishing, or production readiness claim.',
      '',
      'OUTPUT FORMAT:',
      '- Campaign Brief -> Channel Strategy -> Content Angles -> Review Gate -> Next Actions',
    ].join('\n'),
  },
  {
    templateId: 'brand_voice',
    workflowId: 'workflow.brand.brand_voice_review.v1',
    skillId: 'brand-voice-review',
    inputs: {
      brand: 'CVF',
      industry: 'AI governance tooling for non-coders',
      audience: 'Operators who need controlled AI execution without becoming engineers',
      samples: [
        'Website: Build with AI, but keep receipts.',
        'Email: Here is the governed proof path before we ship.',
        'Social: Less hype, more traceable outcomes.',
      ].join('\n'),
      values: 'Clarity, evidence, bounded autonomy, practical outcomes',
    },
  },
];

describe.skipIf(!ALIBABA_API_KEY)(
  '/api/execute C workflow scale VI live proof — Alibaba governed path',
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
        userId: 'usr_c_workflow_scale_live',
        user: 'C Workflow Scale Live Tester',
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
      'exposes VI4 workflow surfaces for Strategy, Marketing Campaign, and Brand Voice',
      async () => {
        const receipts: Array<{ templateId: string; receiptId: string; workflowId: string }> = [];

        for (const proofCase of WORKFLOW_CASES) {
          const template = getTemplateById(proofCase.templateId);
          expect(template).toBeDefined();

          const generatedIntent = generateIntent(template!, proofCase.inputs);
          const intent = generatedIntent.trim() || proofCase.fallbackIntent;
          expect(intent).toBeTruthy();

          const response = await POST(
            new Request('http://localhost/api/execute', {
              method: 'POST',
              body: JSON.stringify({
                templateId: proofCase.templateId,
                templateName: template?.name,
                intent,
                inputs: proofCase.inputs,
                provider: 'alibaba',
                model: 'qwen-turbo',
                mode: 'simple',
                cvfRiskLevel: 'R1',
                action: `analyze ${proofCase.templateId} workflow scale proof request`,
                skillPreflightPassed: true,
                skillPreflightDeclaration: 'SKILL PREFLIGHT PASS: C workflow scale VI proof only, no implementation.',
                skillIds: [proofCase.skillId],
                verticalIntegrationChain: {
                  threadId: `c-workflow-scale-${proofCase.templateId}-${Date.now()}`,
                  turnIndex: 1,
                  operatorGoal: `prove C workflow scale VI surfaces for ${proofCase.templateId}`,
                },
                aiCommit: {
                  commitId: `c-workflow-scale-${proofCase.templateId}`,
                  agentId: 'codex-c-workflow-scale',
                  timestamp: Date.now(),
                  description: `C workflow scale VI proof for ${proofCase.templateId}`,
                },
              }),
            }) as never,
          );

          const body = await response.json() as Record<string, unknown>;
          if (response.status !== 200 || body.success !== true) {
            const guard = body.guardResult as { blockedBy?: string; finalDecision?: string } | undefined;
            throw new Error(`C workflow scale ${proofCase.templateId} proof failed: http=${response.status}; success=${String(body.success)}; error=${String(body.error ?? body.model ?? 'unknown')}; guard=${guard?.finalDecision ?? 'unknown'}:${guard?.blockedBy ?? 'none'}`);
          }

          const receipt = body.governanceEvidenceReceipt as Record<string, unknown> | undefined;
          const readout = body.verticalIntegrationReadout as Record<string, unknown> | undefined;
          const stateMachine = body.stateMachine as Record<string, unknown> | undefined;
          const recovery = body.recovery as Record<string, unknown> | undefined;
          const surfaces = readout?.surfaces as Array<{ surfaceId: string; present: boolean }> | undefined;
          const evidencePackage = readout?.evidencePackage as Record<string, unknown> | undefined;

          expect(body.provider).toBe('alibaba');
          expect(body.model).toBe('qwen-turbo');
          expect(receipt).toMatchObject({
            evidenceMode: 'live',
            decision: 'ALLOW',
            provider: 'alibaba',
            model: 'qwen-turbo',
          });
          expect(body).toMatchObject({
            workflowId: proofCase.workflowId,
            workflowVersion: 'phaseC.workflowBinding.v1',
            templateId: proofCase.templateId,
          });
          expect(stateMachine).toMatchObject({
            contractVersion: 'cvf.workflowStateMachineProjection.v1',
            workflowId: proofCase.workflowId,
            finalState: 'review_pending',
            deferredStepIds: [
              'step-4-review-gate',
              'step-5-receipt-emit',
            ],
          });
          expect(recovery).toMatchObject({
            contractVersion: 'cvf.workflowRecoveryReadout.wr1.v1',
            workflowId: proofCase.workflowId,
            currentState: 'review_pending',
            validationGate: 'blocked',
            recoveryAction: 'hold_for_reviewer_gate',
          });
          expect(readout).toMatchObject({
            contractVersion: 'cvf.verticalWorkflowIntegration.vi1.v1',
            status: 'integrated',
          });
          expect(Number(readout?.integratedSurfaceCount ?? 0)).toBeGreaterThanOrEqual(5);
          expect(surfaces?.find(surface => surface.surfaceId === 'workflow_state_machine')).toMatchObject({
            present: true,
          });
          expect(surfaces?.find(surface => surface.surfaceId === 'workflow_recovery')).toMatchObject({
            present: true,
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
          });
          expect(JSON.stringify(body)).not.toContain(ALIBABA_API_KEY);

          receipts.push({
            templateId: proofCase.templateId,
            workflowId: proofCase.workflowId,
            receiptId: String(receipt?.receiptId ?? ''),
          });
        }

        console.info(JSON.stringify({
          cWorkflowScaleLiveReceipts: receipts,
          provider: 'alibaba',
          model: 'qwen-turbo',
          rawSecretPrinted: false,
        }));
      },
      180_000,
    );
  },
);
