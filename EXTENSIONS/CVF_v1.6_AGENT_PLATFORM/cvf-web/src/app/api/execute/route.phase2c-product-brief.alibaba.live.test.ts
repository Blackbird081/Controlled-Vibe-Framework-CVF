/**
 * Phase 2.C Product Brief — Alibaba Live Validation
 *
 * Proves the bounded 17.05 Phase 2.C vertical slice on the live provider lane:
 * app_builder_complete -> /api/execute governance route -> output validation
 * -> governanceEvidenceReceipt -> Phase 2.C deliverable pack adapter.
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
  '/api/execute Phase 2.C product brief live — Alibaba governed path',
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
        userId: 'usr_phase2c_live',
        user: 'Phase 2C Live Tester',
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
      'generates a receipt-backed product brief deliverable pack on the live Alibaba lane',
      async () => {
        const template = getTemplateById('app_builder_complete');
        expect(template).toBeDefined();

        const inputs = {
          appName: 'TaskFlow',
          appType: 'Web App',
          problem: 'Team nhỏ cần quản lý task nội bộ mà không phải mở nhiều công cụ nặng.',
          targetUsers: 'Ops lead và thành viên team 2-5 người',
          coreFeatures: 'Tạo task\nXem board theo trạng thái\nNhắc deadline\nLọc theo người phụ trách',
          successCriteria: 'Tạo task trong 1 phút, xem board mượt, và thấy rõ việc nào sắp quá hạn.',
          mustPreserve: 'Không phá format export CSV và rule phân quyền nội bộ đã có.',
          platforms: 'Web browser trên desktop và tablet',
          dataNeeds: 'Task, deadline, người phụ trách, ghi chú nội bộ',
          lookAndFeel: 'Gọn, rõ, tập trung công việc, ít nhiễu',
          outOfScope: 'Chưa cần mobile app riêng và chưa cần multi-user phức tạp',
          constraints: 'Rollout nội bộ trong 3 tuần, không phụ thuộc hạ tầng cloud bắt buộc',
        };

        const response = await POST(
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
              aiCommit: {
                commitId: 'live-phase2c-product-brief',
                agentId: 'cvf-phase2c-validation',
                timestamp: Date.now(),
                description: 'Phase 2.C product brief live validation',
              },
            }),
          }) as never,
        );

        const body = await response.json() as Record<string, unknown>;
        const output = String(body.output ?? '');
        const receipt = body.governanceEvidenceReceipt as Record<string, unknown> | undefined;
        const slice = body.phase2cProductBrief as Record<string, unknown> | undefined;
        const pack = slice?.deliverablePack as Record<string, unknown> | undefined;
        const evidence = pack?.governanceEvidence as Record<string, unknown> | undefined;
        const metrics = body.phase3eOperationalMetrics as Record<string, unknown> | undefined;

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(output.length).toBeGreaterThan(500);
        expect(output).toMatch(/TaskFlow/i);
        expect(receipt).toMatchObject({
          evidenceMode: 'live',
          routeId: '/api/execute',
          provider: 'alibaba',
        });
        expect(slice).toMatchObject({
          sliceId: 'CVF_17_05_PHASE_2C_CREATE_PRODUCT_BRIEF',
          status: 'generated',
          templateId: 'app_builder_complete',
          claimBoundary: 'live_governance_proof_required_before_public_claim',
        });
        expect(Array.isArray(slice?.capabilityRefs)).toBe(true);
        expect((slice?.capabilityRefs as string[])).toContain(
          'CVF-17.05:Phase2B:GovernedCapability:create-product-brief',
        );
        expect(pack).toMatchObject({
          packType: 'app_planning',
          sourceExecutionId: expect.stringContaining('phase2c-'),
        });
        expect(evidence).toMatchObject({
          receiptAvailable: true,
          provider: 'alibaba',
        });
        expect(metrics).toMatchObject({
          pilotId: 'CVF_17_05_PHASE_3E_EMISSION_PILOT',
          status: 'emitted',
          sourceSliceId: 'CVF_17_05_PHASE_2C_CREATE_PRODUCT_BRIEF',
          claimBoundary: 'pilot_only_no_full_operational_intelligence_claim',
        });
        expect((metrics?.metrics as Array<{ metricId: string }>).map(metric => metric.metricId)).toEqual([
          'policy-violation-rate',
          'receipt-integrity',
          'task-completion-rate',
        ]);
        expect(metrics?.skippedMetrics as unknown[]).toHaveLength(7);
      },
      60_000,
    );
  },
);
