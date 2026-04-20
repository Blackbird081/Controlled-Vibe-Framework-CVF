/**
 * Web Build Handoff — Alibaba Live Validation
 *
 * Simulates a non-coder using the new handoff template and verifies that the
 * governed /api/execute path can turn the brief into a useful build packet.
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
  '/api/execute web build handoff live — Alibaba governed path',
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
        userId: 'usr_web_handoff_live',
        user: 'Web Handoff Tester',
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
      'turns a non-coder brief into a structured website handoff packet',
      async () => {
        const template = getTemplateById('web_build_handoff');
        expect(template).toBeDefined();

        const inputs = {
          websiteGoal: 'Giúp doanh nghiệp nhỏ hiểu dịch vụ AI automation và đăng ký tư vấn nhanh.',
          audience: 'Founder, ops lead, chủ doanh nghiệp không rành kỹ thuật.',
          mustDo: 'Xem dịch vụ\nSo sánh gói\nĐặt lịch tư vấn\nGửi thông tin liên hệ',
          screens: 'Home, Services, Pricing, FAQ, Contact modal, Thank-you page',
          mustPreserve: 'Webhook CRM, route hiện tại, form API, admin auth',
          lookAndFeel: 'Sáng rõ, tin cậy, hiện đại, dễ đọc trên mobile',
          references: 'Ưu tiên section rõ ràng, headline mạnh, CTA nổi nhưng không lòe loẹt',
        };

        const response = await POST(
          new Request('http://localhost/api/execute', {
            method: 'POST',
            body: JSON.stringify({
              templateId: 'web_build_handoff',
              templateName: 'Bàn giao Web cho Agent',
              intent: generateIntent(template!, inputs),
              inputs,
              provider: 'alibaba',
              model: 'qwen-turbo',
              mode: 'simple',
              aiCommit: {
                commitId: 'live-web-handoff-validation',
                agentId: 'cvf-noncoder-sim',
                timestamp: Date.now(),
                description: 'Non-coder web build handoff live validation',
              },
            }),
          }) as never,
        );

        const body = await response.json() as Record<string, unknown>;
        const output = String(body.output ?? '');

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(output.length).toBeGreaterThan(400);
        expect(output).toMatch(/Website Goal/i);
        expect(output).toMatch(/Target Users/i);
        expect(output).toMatch(/Required Pages and Flows/i);
        expect(output).toMatch(/UX \/ Visual Direction/i);
        expect(output).toMatch(/Protected Constraints/i);
        expect(output).toMatch(/Agent Build Instructions/i);
        expect(output).toMatch(/Acceptance Checklist/i);
        expect(output).not.toMatch(/choose frameworks|pick a framework|select a stack/i);
      },
      45_000,
    );
  },
);
