/**
 * Front-Door Rewrite — OpenAI Live Validation
 *
 * Validates that the governed /api/execute path can turn the trusted
 * front-door rewrite surfaces into useful non-coder packets on the live
 * OpenAI lane.
 *
 * Skipped automatically when OPENAI_API_KEY / CVF_OPENAI_API_KEY is absent.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

const OPENAI_API_KEY = resolveOpenAIApiKey();
const OPENAI_CANARY_MODEL = 'gpt-4o-mini';

async function executeTemplate(templateId: string, inputs: Record<string, unknown>) {
  const template = getTemplateById(templateId);
  expect(template).toBeDefined();

  const response = await POST(
    new Request('http://localhost/api/execute', {
      method: 'POST',
      body: JSON.stringify({
        templateId,
        templateName: template?.name,
        intent: generateIntent(template!, inputs as Record<string, string>),
        inputs,
        provider: 'openai',
        model: OPENAI_CANARY_MODEL,
        mode: 'simple',
        aiCommit: {
          commitId: `live-openai-front-door-${templateId}`,
          agentId: 'cvf-front-door-validation',
          timestamp: Date.now(),
          description: `Front-door ${templateId} OpenAI live validation`,
        },
      }),
    }) as never,
  );

  const body = await response.json() as Record<string, unknown>;
  const output = String(body.output ?? '');

  expect(response.status).toBe(200);
  expect(body.success).toBe(true);
  expect(body.provider).toBe('openai');
  expect(body.model).toBe(OPENAI_CANARY_MODEL);
  expect(output).not.toMatch(/choose frameworks|choose a database|pick a stack|pick an ORM/i);

  return output;
}

describe.skipIf(!OPENAI_API_KEY)(
  '/api/execute front-door rewrite live — OpenAI governed path',
  () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
      process.env.OPENAI_API_KEY = OPENAI_API_KEY;

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
        userId: 'usr_front_door_openai_live',
        user: 'Front Door OpenAI Live Tester',
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
      'app_builder_complete turns into a builder-ready non-coder app brief',
      async () => {
        const output = await executeTemplate('app_builder_complete', {
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
        });

        expect(output.length).toBeGreaterThan(500);
        expect(output).toMatch(/TaskFlow/i);
        expect(output).toMatch(/app brief|requirements|specification|business intent/i);
        expect(output).toMatch(/acceptance criteria|success criteria/i);
        expect(output).toMatch(/handoff|boundaries|builder/i);
      },
      90_000,
    );

    it(
      'api_design turns into an integration handoff packet instead of a style-selection form',
      async () => {
        const output = await executeTemplate('api_design', {
          appName: 'LeadSync integration',
          whoUsesIt: 'Website lead form, sales ops, và CRM nội bộ',
          jobsToSupport: 'Tạo lead mới\nCập nhật trạng thái lead\nGhi chú tư vấn\nChặn lead trùng',
          informationExchanged: 'Tên, email, số điện thoại, nhu cầu tư vấn, trạng thái xử lý, ghi chú sales',
          rulesApprovals: 'Chỉ sales manager được đánh dấu Won; export phải có log; lead trùng phải merge',
          mustPreserve: 'Giữ nguyên CRM lead ID, webhook cũ, và log phê duyệt',
        });

        expect(output.length).toBeGreaterThan(450);
        expect(output).toMatch(/LeadSync|integration|tích hợp/i);
        expect(output).toMatch(/operations|payloads|workflow|giao thức/i);
        expect(output).toMatch(/approval|phê duyệt|quyền/i);
        expect(output).toMatch(/checklist|kiểm tra/i);
      },
      90_000,
    );

    it(
      'code_review turns into a plain-language build review packet with a builder handoff brief',
      async () => {
        const output = await executeTemplate('code_review', {
          workSample: `function processPayment(amount, currency) {\n  if (!amount) return;\n  return runPayment(amount, currency);\n}`,
          goal: 'Xử lý thanh toán và chỉ trả kết quả thành công khi giao dịch thật sự hoàn tất',
          worry: 'Thỉnh thoảng hệ thống báo thành công dù gateway timeout, không biết có bị thu tiền 2 lần không.',
          mustPreserve: 'Không đổi contract trả về cho mobile app, không bỏ logging phục vụ đối soát.',
          focus: ['Sai logic nghiệp vụ', 'Rủi ro dữ liệu / bảo mật'],
        });

        expect(output.length).toBeGreaterThan(400);
        expect(output).toMatch(/intended outcome|goal|mục tiêu/i);
        expect(output).toMatch(/risk|rủi ro/i);
        expect(output).toMatch(/handoff|builder|bàn giao/i);
        expect(output).toMatch(/checklist|acceptance/i);
      },
      90_000,
    );

    it(
      'documentation turns into a structured operational doc packet with a handoff checklist',
      async () => {
        const output = await executeTemplate('documentation', {
          subject: 'Quy trình xử lý sự cố P1 và leo thang nội bộ',
          currentNotes: 'Khi có sự cố P1: ops nhận alert -> tạo incident channel -> gọi SRE lead trong 5 phút -> SRE đánh giá và quyết định escalate lên CTO nếu ảnh hưởng > 30 phút. Hay bị hỏi: ai quyết định P1, ai cần được thông báo, khi nào phải roll back.',
          readerGoal: 'Nhân viên ops có thể xử lý P1 trong 15 phút đầu mà không phải hỏi lại SRE.',
          audience: 'Người vận hành nội bộ',
          mustPreserve: 'Giữ nguyên thứ tự leo thang ops -> SRE lead -> CTO và SLA 5 phút gọi lại.',
        });

        expect(output.length).toBeGreaterThan(400);
        expect(output).toMatch(/document|mục tiêu|purpose|for/i);
        expect(output).toMatch(/flow|steps|bước/i);
        expect(output).toMatch(/checklist|handoff/i);
        expect(output).toMatch(/SRE|P1|incident/i);
      },
      90_000,
    );

    it(
      'web_ux_redesign_system turns into a guarded UX packet with a visible review gate',
      async () => {
        const output = await executeTemplate('web_ux_redesign_system', {
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
        });

        expect(output.length).toBeGreaterThan(600);
        expect(output).toMatch(/review gate|approval|validation|QA/i);
        expect(output).toMatch(/routes|auth|API|store/i);
        expect(output).toMatch(/checklist|rules|release/i);
      },
      90_000,
    );

    it(
      'data_analysis turns into a decision-focused insight packet with prioritised action recommendations',
      async () => {
        const output = await executeTemplate('data_analysis', {
          dataset: 'Export CRM 6 tháng: deals theo giai đoạn, doanh số theo sales rep, doanh thu theo tháng. Tổng 340 deals, 8 reps, doanh thu Q1 thấp hơn Q2 ~18%.',
          questions: '1. Giai đoạn nào đang bị tắc lâu nhất?\n2. Rep nào đang underperform so với quota?\n3. Có nên tăng target Q3 không?',
          importantSlices: 'So sánh Q1 vs Q2, tách riêng enterprise vs SMB.',
          knownLimitations: 'Dữ liệu tháng 1 có thể thiếu vì CRM mới migrate, deal < 30 ngày chưa đủ cycle để kết luận.',
        });

        expect(output.length).toBeGreaterThan(450);
        expect(output).toMatch(/data|dữ liệu/i);
        expect(output).toMatch(/insight|suggest|kết luận|cho thấy/i);
        expect(output).toMatch(/recommended actions|actions|khuyến nghị/i);
        expect(output).toMatch(/checklist|follow.?up/i);
      },
      90_000,
    );
  },
);
