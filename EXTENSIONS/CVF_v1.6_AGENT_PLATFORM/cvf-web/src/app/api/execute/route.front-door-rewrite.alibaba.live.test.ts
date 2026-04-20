/**
 * Front-Door Rewrite — Alibaba Live Validation
 *
 * Validates that the governed /api/execute path can turn the newly trusted
 * front-door rewrite surfaces into useful non-coder packets on the live
 * Alibaba lane.
 *
 * Skipped automatically when ALIBABA_API_KEY is absent.
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

describe.skipIf(!ALIBABA_API_KEY)(
  '/api/execute front-door rewrite live — Alibaba governed path',
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
        userId: 'usr_front_door_live',
        user: 'Front Door Live Tester',
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
      'turns app_builder_complete into a builder-ready non-coder app brief',
      async () => {
        const template = getTemplateById('app_builder_complete');
        expect(template).toBeDefined();

        const inputs = {
          appName: 'TaskFlow',
          appType: 'Desktop App',
          problem: 'Team nhỏ cần quản lý task nội bộ mà không phải mở nhiều công cụ nặng.',
          targetUsers: 'Ops lead và thành viên team 2-5 người',
          coreFeatures: 'Tạo task\nXem board theo trạng thái\nNhắc deadline\nLọc theo người phụ trách',
          successCriteria: 'Tạo task trong 1 phút, xem board mượt, dùng được khi offline cho flow chính.',
          mustPreserve: 'Không phá format export CSV và rule phân quyền nội bộ đã có.',
          platforms: 'Windows + macOS',
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
              aiCommit: {
                commitId: 'live-front-door-app-brief',
                agentId: 'cvf-front-door-validation',
                timestamp: Date.now(),
                description: 'Front-door app brief live validation',
              },
            }),
          }) as never,
        );

        const body = await response.json() as Record<string, unknown>;
        const output = String(body.output ?? '');

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(output.length).toBeGreaterThan(500);
        expect(output).toMatch(/TaskFlow/i);
        expect(output).toMatch(/Requirements Overview|Specification/i);
        expect(output).toMatch(/User Outcomes|Core Functionality|Workflows/i);
        expect(output).toMatch(/Acceptance Criteria/i);
        expect(output).toMatch(/Handoff Boundaries|Boundaries/i);
        expect(output).toMatch(/Acceptance Criteria/i);
        expect(output).not.toMatch(/choose frameworks|choose a database|pick a stack/i);
      },
      45_000,
    );

    it(
      'turns api_design into an integration handoff packet instead of a style-selection form',
      async () => {
        const template = getTemplateById('api_design');
        expect(template).toBeDefined();

        const inputs = {
          appName: 'LeadSync integration',
          whoUsesIt: 'Website lead form, sales ops, và CRM nội bộ',
          jobsToSupport: 'Tạo lead mới\nCập nhật trạng thái lead\nGhi chú tư vấn\nChặn lead trùng',
          informationExchanged: 'Tên, email, số điện thoại, nhu cầu tư vấn, trạng thái xử lý, ghi chú sales',
          rulesApprovals: 'Chỉ sales manager được đánh dấu Won; export phải có log; lead trùng phải merge',
          mustPreserve: 'Giữ nguyên CRM lead ID, webhook cũ, và log phê duyệt',
        };

        const response = await POST(
          new Request('http://localhost/api/execute', {
            method: 'POST',
            body: JSON.stringify({
              templateId: 'api_design',
              templateName: template?.name,
              intent: generateIntent(template!, inputs),
              inputs,
              provider: 'alibaba',
              model: 'qwen-turbo',
              mode: 'simple',
              aiCommit: {
                commitId: 'live-front-door-integration',
                agentId: 'cvf-front-door-validation',
                timestamp: Date.now(),
                description: 'Front-door integration packet live validation',
              },
            }),
          }) as never,
        );

        const body = await response.json() as Record<string, unknown>;
        const output = String(body.output ?? '');

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(output.length).toBeGreaterThan(450);
        expect(output).toMatch(/LeadSync|tích hợp/i);
        expect(output).toMatch(/Operations|Payloads|Giao thức/i);
        expect(output).toMatch(/approval|Quyền Hạn|Phê Duyệt/i);
        expect(output).toMatch(/Checklist/i);
        expect(output).not.toMatch(/choose API style|REST vs GraphQL|pick pagination/i);
      },
      45_000,
    );

    it(
      'turns web_ux_redesign_system into a guarded UX packet with a visible review gate',
      async () => {
        const template = getTemplateById('web_ux_redesign_system');
        expect(template).toBeDefined();

        const inputs = {
          projectSurface: 'AI operations dashboard cho team nội bộ',
          users: 'Ops manager, analyst, admin',
          coreFlows: 'Search knowledge\nRun workflow\nReview result\nManage settings',
          pagesModals: 'Home, Search, Docs, Settings modal',
          mustPreserve: 'Routes, auth, API payloads, existing store contracts',
          visualDirection: 'Premium, structured, dark-primary, rõ hierarchy',
          contentDensity: 'Balanced to Dense',
          motionBudget: 'Intentional',
          themeStrategy: 'Dark-primary + light-supporting',
          references: 'Stat strip, pill filters, split-pane docs, structured cards',
        };

        const response = await POST(
          new Request('http://localhost/api/execute', {
            method: 'POST',
            body: JSON.stringify({
              templateId: 'web_ux_redesign_system',
              templateName: template?.name,
              intent: generateIntent(template!, inputs),
              inputs,
              provider: 'alibaba',
              model: 'qwen-turbo',
              mode: 'simple',
              aiCommit: {
                commitId: 'live-front-door-ux-packet',
                agentId: 'cvf-front-door-validation',
                timestamp: Date.now(),
                description: 'Front-door UX packet live validation',
              },
            }),
          }) as never,
        );

        const body = await response.json() as Record<string, unknown>;
        const output = String(body.output ?? '');

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(output.length).toBeGreaterThan(600);
        expect(output).toMatch(/Review Gate/i);
        expect(output).toMatch(/QA Rules|Pre-Build Approval|Post-Build Validation|Release Process/i);
        expect(output).toMatch(/approval|required/i);
        expect(output).toMatch(/routes|auth|API|store/i);
        expect(output).not.toMatch(/choose frameworks|pick a framework|select a stack/i);
      },
      45_000,
    );
  },
);
