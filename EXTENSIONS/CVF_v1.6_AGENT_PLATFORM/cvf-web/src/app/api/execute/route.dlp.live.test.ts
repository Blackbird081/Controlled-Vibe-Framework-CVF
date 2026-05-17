/**
 * DLP Live Smoke Test — Phase D1.2 E2E validation
 *
 * Calls the real Alibaba DashScope API (qwen-turbo) to confirm that sensitive
 * data is redacted by the DLP pipeline BEFORE it reaches the AI provider and
 * that a DLP_REDACTION_APPLIED audit event is emitted.
 *
 * Skipped automatically when ALIBABA_API_KEY is absent from the environment.
 * Compatibility aliases remain supported via resolveAlibabaApiKey().
 * Run with: ALIBABA_API_KEY=sk-... npx vitest run route.dlp.live
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { readAuditEvents, type UnifiedAuditEvent } from '@/lib/control-plane-events';
import { resolveAlibabaApiKey } from '@/lib/alibaba-env';

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
  '/api/execute DLP live smoke — Alibaba qwen-turbo',
  () => {
    const originalEnv = { ...process.env };
    let tempDir = '';

    beforeEach(async () => {
      tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-dlp-live-'));
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
        userId: 'usr_smoke',
        user: 'Smoke Tester',
        role: 'admin',
        orgId: 'org_cvf',
        teamId: 'team_exec',
        expiresAt: Date.now() + 3_600_000,
        authMode: 'session',
      });
    });

    afterEach(async () => {
      process.env = { ...originalEnv };
      if (tempDir) {
        await rm(tempDir, { recursive: true, force: true });
      }
    });

    it(
      'redacts credit card and email before AI provider call — DLP_REDACTION_APPLIED emitted',
      async () => {
        const rawCard = '4111 1111 1111 1111';
        const rawEmail = 'smoke-test@example.com';

        const response = await POST(
          new Request('http://localhost/api/execute', {
            method: 'POST',
            body: JSON.stringify({
              templateName: 'Data Quality Review',
              intent: 'Summarize the data fields provided',
              inputs: {
                customerInfo: `Payment card: ${rawCard}, contact: ${rawEmail}`,
              },
              provider: 'alibaba',
            }),
          }) as never,
        );

        const body = await response.json() as Record<string, unknown>;

        const events = await readAuditEvents();
        const dlpEvent = events.find(
          (e): e is UnifiedAuditEvent => e.eventType === 'DLP_REDACTION_APPLIED',
        );

        expect(dlpEvent).toBeDefined();
        expect(
          (dlpEvent?.payload as { matchCount?: number } | undefined)?.matchCount,
        ).toBeGreaterThan(0);

        const serialised = JSON.stringify(body);
        expect(serialised).not.toContain(rawCard);
        expect(serialised).not.toContain(rawEmail);
      },
      30_000,
    );

    it(
      'AWS access key is redacted from prompt — DLP_REDACTION_APPLIED includes aws-key match',
      async () => {
        const awsKey = 'AKIAIOSFODNN7EXAMPLE';

        const response = await POST(
          new Request('http://localhost/api/execute', {
            method: 'POST',
            body: JSON.stringify({
              templateName: 'Config Review',
              intent: 'Review the configuration values',
              inputs: {
                configDump: `AWS_ACCESS_KEY_ID=${awsKey}`,
              },
              provider: 'alibaba',
            }),
          }) as never,
        );

        await response.json();

        const events = await readAuditEvents();
        const dlpEvent = events.find(
          (e): e is UnifiedAuditEvent => e.eventType === 'DLP_REDACTION_APPLIED',
        );

        expect(dlpEvent).toBeDefined();
        const patterns = (dlpEvent?.payload as { patterns?: string[] } | undefined)?.patterns ?? [];
        expect(patterns).toContain('AWS Access Key');
      },
      30_000,
    );
  },
);
