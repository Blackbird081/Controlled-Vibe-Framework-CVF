/**
 * VI1 W-Series Vertical Execute Chain — Alibaba Live Validation
 *
 * Proves one 2-turn governed /api/execute chain where the second live response
 * exposes governance receipt, workflow state, workflow recovery, memory event
 * hook posture, artifact verification, and operational metrics together.
 *
 * Skipped automatically when no Alibaba/DashScope-compatible key is loaded.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveAlibabaApiKey } from '@/lib/alibaba-env';
import { generateIntent, getTemplateById } from '@/lib/templates';

const verifySessionCookieMock = vi.hoisted(() => vi.fn());
const checkTeamQuotaMock = vi.hoisted(() => vi.fn());

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
  '/api/execute VI1 vertical integration live chain — Alibaba governed path',
  () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
      process.env.ALIBABA_API_KEY = ALIBABA_API_KEY;

      verifySessionCookieMock.mockReset();
      checkTeamQuotaMock.mockReset();

      checkTeamQuotaMock.mockResolvedValue({
        exceeded: false,
        currentUSD: 0,
        softCapUSD: 50,
        hardCapUSD: 100,
        overrideActive: false,
      });
      verifySessionCookieMock.mockResolvedValue({
        userId: 'usr_vi1_live',
        user: 'VI1 Live Tester',
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
      'links two live product brief turns through the vertical integration readout',
      async () => {
        const template = getTemplateById('app_builder_complete');
        expect(template).toBeDefined();
        const threadId = `vi1-live-thread-${Date.now()}`;
        const inputs = {
          appName: 'TaskFlow',
          appType: 'Web App',
          problem: 'Team nhỏ cần quản lý task nội bộ mà không phải mở nhiều công cụ nặng.',
          targetUsers: 'Ops lead và thành viên team 2-5 người',
          coreFeatures: 'Tạo task\nXem board theo trạng thái\nNhắc deadline\nLọc theo người phụ trách',
          successCriteria: 'Tạo task trong 1 phút, xem board mượt, và thấy rõ việc nào sắp quá hạn.',
          platforms: 'Web browser trên desktop và tablet',
          constraints: 'Rollout nội bộ trong 3 tuần, tránh phụ thuộc hạ tầng cloud bắt buộc.',
        };

        const firstResponse = await POST(
          new Request('http://localhost/api/execute', {
            method: 'POST',
            body: JSON.stringify({
              templateId: 'app_builder_complete',
              templateName: template?.name,
              intent: generateIntent(template!, inputs),
              inputs,
              provider: 'alibaba',
              model: 'qwen-turbo',
              mode: 'simple',
              action: 'analyze template execution request',
              skillPreflightPassed: true,
              skillPreflightDeclaration: 'SKILL PREFLIGHT PASS: product brief only, no implementation.',
              skillIds: ['product-brief-authoring'],
              verticalIntegrationChain: {
                threadId,
                turnIndex: 1,
                operatorGoal: 'prove first-turn vertical surfaces',
              },
              aiCommit: {
                commitId: 'live-vi1-turn-1',
                agentId: 'cvf-vi1-validation',
                timestamp: Date.now(),
                description: 'VI1 vertical integration live validation turn 1',
              },
            }),
          }) as never,
        );
        const firstBody = await firstResponse.json() as Record<string, unknown>;
        const firstReceipt = firstBody.governanceEvidenceReceipt as Record<string, unknown> | undefined;
        const firstReadout = firstBody.verticalIntegrationReadout as Record<string, unknown> | undefined;

        expect(firstResponse.status).toBe(200);
        expect(firstBody.success).toBe(true);
        expect(firstReceipt).toMatchObject({
          evidenceMode: 'live',
          routeId: '/api/execute',
          provider: 'alibaba',
        });
        expect(firstReadout).toMatchObject({
          contractVersion: 'cvf.verticalWorkflowIntegration.vi1.v1',
          status: 'integrated',
          integratedSurfaceCount: 11,
          chain: {
            threadId,
            turnIndex: 1,
            continuityProven: false,
          },
        });

        const firstReceiptId = String(firstReceipt?.receiptId ?? '');
        expect(firstReceiptId).toMatch(/^rcpt-env-/);

        const secondInputs = {
          ...inputs,
          successCriteria: 'Tạo task trong 1 phút, xem board mượt, thấy deadline, và có hành động tiếp theo rõ ràng.',
          constraints: 'Rollout nội bộ trong 3 tuần; ưu tiên một luồng nhập liệu tối giản cho non-coder.',
        };
        const secondResponse = await POST(
          new Request('http://localhost/api/execute', {
            method: 'POST',
            body: JSON.stringify({
              templateId: 'app_builder_complete',
              templateName: template?.name,
              intent: `${generateIntent(template!, secondInputs)}\n\nRefine after receipt ${firstReceiptId}.`,
              inputs: secondInputs,
              provider: 'alibaba',
              model: 'qwen-turbo',
              mode: 'simple',
              action: 'analyze template execution request',
              skillPreflightPassed: true,
              skillPreflightDeclaration: 'SKILL PREFLIGHT PASS: product brief refinement only, no implementation.',
              skillIds: ['product-brief-authoring'],
              verticalIntegrationChain: {
                threadId,
                rootReceiptId: firstReceiptId,
                parentReceiptId: firstReceiptId,
                turnIndex: 2,
                operatorGoal: 'prove second-turn vertical chain links to first live receipt',
              },
              aiCommit: {
                commitId: 'live-vi1-turn-2',
                agentId: 'cvf-vi1-validation',
                timestamp: Date.now(),
                description: 'VI1 vertical integration live validation turn 2',
              },
            }),
          }) as never,
        );
        const secondBody = await secondResponse.json() as Record<string, unknown>;
        const secondReceipt = secondBody.governanceEvidenceReceipt as Record<string, unknown> | undefined;
        const secondReadout = secondBody.verticalIntegrationReadout as Record<string, unknown> | undefined;
        const secondAuditMemoryReceipt = secondBody.auditMemoryReceipt as Record<string, unknown> | undefined;
        const captureRecord = secondAuditMemoryReceipt?.captureRecord as Record<string, unknown> | undefined;
        const memoryEventHook = secondReadout?.memoryEventHook as Record<string, unknown> | undefined;
        const memoryReceipt = memoryEventHook?.receipt as Record<string, unknown> | undefined;
        const evidencePackage = secondReadout?.evidencePackage as Record<string, unknown> | undefined;
        const surfaces = secondReadout?.surfaces as Array<{ surfaceId: string; present: boolean; summary?: string; evidenceRefs?: string[] }> | undefined;

        expect(secondResponse.status).toBe(200);
        expect(secondBody.success).toBe(true);
        expect(secondReceipt).toMatchObject({
          evidenceMode: 'live',
          routeId: '/api/execute',
          provider: 'alibaba',
        });
        const secondReceiptId = String(secondReceipt?.receiptId ?? '');
        expect(secondReceiptId).toMatch(/^rcpt-env-/);
        console.info(`[VI1 live receipts] turn1=${firstReceiptId} turn2=${secondReceiptId}`);
        expect(secondReadout).toMatchObject({
          contractVersion: 'cvf.verticalWorkflowIntegration.vi1.v1',
          status: 'integrated',
          integratedSurfaceCount: 11,
          requiredSurfaceCount: 5,
          liveReceipt: {
            present: true,
            evidenceMode: 'live',
            provider: 'alibaba',
          },
          chain: {
            threadId,
            rootReceiptId: firstReceiptId,
            parentReceiptId: firstReceiptId,
            turnIndex: 2,
            continuityProven: true,
            reason: 'second_or_later_turn_links_to_prior_receipt',
          },
        });
        expect(surfaces?.map(surface => surface.surfaceId)).toEqual([
          'governance_receipt',
          'workflow_state_machine',
          'workflow_recovery',
          'request_context_profile',
          'memory_event_hook',
          'tool_action_taxonomy',
          'tool_action_approval',
          'provider_method_fallback',
          'operational_scorecard',
          'artifact_verification',
          'operational_metrics',
        ]);
        expect(surfaces?.every(surface => surface.present)).toBe(true);
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
        expect(String((evidencePackage?.eventModel as Record<string, unknown> | undefined)?.denominatorNote ?? '')).toContain('event totals are not the call-level pass-rate denominator');
        const memorySurface = surfaces?.find(surface => surface.surfaceId === 'memory_event_hook');
        expect(memorySurface?.summary).toContain('capture=captured');
        expect(memoryReceipt).toMatchObject({
          contractVersion: 'cvf.memoryEventHooks.w2.v1',
          eventType: 'execution_result',
          rawMemoryReleased: false,
          canReinject: false,
        });
        expect(captureRecord).toMatchObject({
          contractVersion: 'cvf.agentMemoryCaptureRecord.vi3.v1',
          eventType: 'execution_result',
          policyContext: {
            canReinject: false,
          },
          rawSecretStored: false,
          privateReasoningCaptured: false,
          promotion: {
            automaticPromotion: false,
          },
        });
        expect(memorySurface?.evidenceRefs).toEqual(expect.arrayContaining([
          captureRecord?.eventId,
          captureRecord?.auditReceiptId,
        ]));
      },
      120_000,
    );
  },
);
