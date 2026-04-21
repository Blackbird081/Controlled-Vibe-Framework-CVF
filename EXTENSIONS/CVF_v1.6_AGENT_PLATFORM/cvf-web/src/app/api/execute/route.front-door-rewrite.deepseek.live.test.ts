/**
 * Front-Door Rewrite — DeepSeek Live Validation
 *
 * Validates that the governed /api/execute path can turn the front-door
 * rewrite surfaces into useful non-coder packets on the live DeepSeek lane.
 *
 * Skipped automatically when DEEPSEEK_API_KEY is absent.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveDeepSeekApiKey } from '@/lib/deepseek-env';
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

describe.skipIf(!DEEPSEEK_API_KEY)(
  '/api/execute front-door rewrite live — DeepSeek governed path',
  () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
      process.env.DEEPSEEK_API_KEY = DEEPSEEK_API_KEY;

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
        userId: 'usr_front_door_deepseek_live',
        user: 'Front Door DeepSeek Live Tester',
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
              provider: 'deepseek',
              model: 'deepseek-chat',
              mode: 'simple',
              aiCommit: {
                commitId: 'live-deepseek-front-door-app-brief',
                agentId: 'cvf-front-door-validation',
                timestamp: Date.now(),
                description: 'Front-door app brief DeepSeek live validation',
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
        expect(output).toMatch(/APP BRIEF|Business Intent|User Journeys|Specification|Requirements/i);
        expect(output).toMatch(/User Outcomes|Core Functionality|Workflows|Features|Goals|Objectives|Overview|User Flow/i);
        expect(output).toMatch(/Acceptance Criteria|Success Criteria/i);
        expect(output).toMatch(/Handoff|Boundaries|Builder|builder/i);
        expect(output).not.toMatch(/choose frameworks|choose a database|pick a stack/i);
      },
      120_000,
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
              provider: 'deepseek',
              model: 'deepseek-chat',
              mode: 'simple',
              aiCommit: {
                commitId: 'live-deepseek-front-door-integration',
                agentId: 'cvf-front-door-validation',
                timestamp: Date.now(),
                description: 'Front-door integration packet DeepSeek live validation',
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
        expect(output).toMatch(/Checklist|Danh Sách Kiểm Tra|Kiểm Tra/i);
        expect(output).not.toMatch(/choose API style|REST vs GraphQL|pick pagination/i);
      },
      180_000,
    );

    it(
      'turns code_review into a plain-language build review packet with a builder handoff brief',
      async () => {
        const template = getTemplateById('code_review');
        expect(template).toBeDefined();

        const inputs = {
          workSample: `function processPayment(amount, currency) {\n  if (!amount) return;\n  return runPayment(amount, currency);\n}`,
          goal: 'Xử lý thanh toán và chỉ trả kết quả thành công khi giao dịch thật sự hoàn tất',
          worry: 'Thỉnh thoảng hệ thống báo thành công dù gateway timeout, không biết có bị thu tiền 2 lần không.',
          mustPreserve: 'Không đổi contract trả về cho mobile app, không bỏ logging phục vụ đối soát.',
          focus: ['Sai logic nghiệp vụ', 'Rủi ro dữ liệu / bảo mật'],
        };

        const response = await POST(
          new Request('http://localhost/api/execute', {
            method: 'POST',
            body: JSON.stringify({
              templateId: 'code_review',
              templateName: template?.name,
              intent: generateIntent(template!, inputs),
              inputs,
              provider: 'deepseek',
              model: 'deepseek-chat',
              mode: 'simple',
              aiCommit: {
                commitId: 'live-deepseek-front-door-code-review',
                agentId: 'cvf-front-door-validation',
                timestamp: Date.now(),
                description: 'Front-door code review packet DeepSeek live validation',
              },
            }),
          }) as never,
        );

        const body = await response.json() as Record<string, unknown>;
        const output = String(body.output ?? '');

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(output.length).toBeGreaterThan(400);
        expect(output).toMatch(/Intended Outcome|What This Part|Mục tiêu/i);
        expect(output).toMatch(/Main Risks|Risk|Rủi ro/i);
        expect(output).toMatch(/Builder Handoff|Handoff Brief|Bàn giao/i);
        expect(output).toMatch(/Checklist|Acceptance/i);
        expect(output).not.toMatch(/refactor to async\/await|choose a logging framework|pick an ORM/i);
      },
      150_000,
    );

    it(
      'turns documentation into a structured operational doc packet with a handoff checklist',
      async () => {
        const template = getTemplateById('documentation');
        expect(template).toBeDefined();

        const inputs = {
          subject: 'Quy trình xử lý sự cố P1 và leo thang nội bộ',
          currentNotes: 'Khi có sự cố P1: ops nhận alert -> tạo incident channel -> gọi SRE lead trong 5 phút -> SRE đánh giá và quyết định escalate lên CTO nếu ảnh hưởng > 30 phút. Hay bị hỏi: ai quyết định P1, ai cần được thông báo, khi nào phải roll back.',
          readerGoal: 'Nhân viên ops có thể xử lý P1 trong 15 phút đầu mà không phải hỏi lại SRE.',
          audience: 'Người vận hành nội bộ',
          mustPreserve: 'Giữ nguyên thứ tự leo thang ops -> SRE lead -> CTO và SLA 5 phút gọi lại.',
        };

        const response = await POST(
          new Request('http://localhost/api/execute', {
            method: 'POST',
            body: JSON.stringify({
              templateId: 'documentation',
              templateName: template?.name,
              intent: generateIntent(template!, inputs),
              inputs,
              provider: 'deepseek',
              model: 'deepseek-chat',
              mode: 'simple',
              aiCommit: {
                commitId: 'live-deepseek-front-door-documentation',
                agentId: 'cvf-front-door-validation',
                timestamp: Date.now(),
                description: 'Front-door documentation packet DeepSeek live validation',
              },
            }),
          }) as never,
        );

        const body = await response.json() as Record<string, unknown>;
        const output = String(body.output ?? '');

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(output.length).toBeGreaterThan(400);
        expect(output).toMatch(/What This Document Is For|Mục tiêu|For/i);
        expect(output).toMatch(/Main Flow|Steps|Bước/i);
        expect(output).toMatch(/Checklist|Handoff/i);
        expect(output).toMatch(/SRE|P1|incident/i);
        expect(output).not.toMatch(/configure your logging stack|set up Prometheus|install Grafana/i);
      },
      120_000,
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
              provider: 'deepseek',
              model: 'deepseek-chat',
              mode: 'simple',
              aiCommit: {
                commitId: 'live-deepseek-front-door-ux-packet',
                agentId: 'cvf-front-door-validation',
                timestamp: Date.now(),
                description: 'Front-door UX packet DeepSeek live validation',
              },
            }),
          }) as never,
        );

        const body = await response.json() as Record<string, unknown>;
        const output = String(body.output ?? '');

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(output.length).toBeGreaterThan(600);
        expect(output).toMatch(/Review Gate|Pre-Build Approval|Approval Checklist/i);
        expect(output).toMatch(/QA Rules|Pre-Build Approval|Post-Build Validation|Release Process/i);
        expect(output).toMatch(/approval|required/i);
        expect(output).toMatch(/routes|auth|API|store/i);
        expect(output).not.toMatch(/choose frameworks|pick a framework|select a stack/i);
      },
      240_000,
    );

    it(
      'turns data_analysis into a decision-focused insight packet with prioritised action recommendations',
      async () => {
        const template = getTemplateById('data_analysis');
        expect(template).toBeDefined();

        const inputs = {
          dataset: 'Export CRM 6 tháng: deals theo giai đoạn, doanh số theo sales rep, doanh thu theo tháng. Tổng 340 deals, 8 reps, doanh thu Q1 thấp hơn Q2 ~18%.',
          questions: '1. Giai đoạn nào đang bị tắc lâu nhất?\n2. Rep nào đang underperform so với quota?\n3. Có nên tăng target Q3 không?',
          importantSlices: 'So sánh Q1 vs Q2, tách riêng enterprise vs SMB.',
          knownLimitations: 'Dữ liệu tháng 1 có thể thiếu vì CRM mới migrate, deal < 30 ngày chưa đủ cycle để kết luận.',
        };

        const response = await POST(
          new Request('http://localhost/api/execute', {
            method: 'POST',
            body: JSON.stringify({
              templateId: 'data_analysis',
              templateName: template?.name,
              intent: generateIntent(template!, inputs),
              inputs,
              provider: 'deepseek',
              model: 'deepseek-chat',
              mode: 'simple',
              aiCommit: {
                commitId: 'live-deepseek-front-door-data-analysis',
                agentId: 'cvf-front-door-validation',
                timestamp: Date.now(),
                description: 'Front-door data analysis packet DeepSeek live validation',
              },
            }),
          }) as never,
        );

        const body = await response.json() as Record<string, unknown>;
        const output = String(body.output ?? '');

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(output.length).toBeGreaterThan(450);
        expect(output).toMatch(/What Data We Looked At|Data We|Nguồn Dữ Liệu/i);
        expect(output).toMatch(/Suggests|Clearly Suggests|Insight|Kết Luận/i);
        expect(output).toMatch(/Recommended Actions|Actions|Khuyến nghị/i);
        expect(output).toMatch(/Checklist|Follow.?Up/i);
        expect(output).not.toMatch(/run a regression analysis|train a model|apply clustering/i);
      },
      90_000,
    );
  },
);
