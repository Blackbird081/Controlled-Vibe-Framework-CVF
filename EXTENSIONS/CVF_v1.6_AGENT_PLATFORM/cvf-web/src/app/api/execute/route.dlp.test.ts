import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { readAuditEvents } from '@/lib/control-plane-events';
import { appendDLPPolicyEvent } from '@/lib/policy-events';

const executeAIMock = vi.hoisted(() => vi.fn());
const evaluateEnforcementMock = vi.hoisted(() => vi.fn());
const verifySessionCookieMock = vi.hoisted(() => vi.fn());
const checkTeamQuotaMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/ai', async () => {
  const actual = await vi.importActual<typeof import('@/lib/ai')>('@/lib/ai');
  return {
    ...actual,
    executeAI: executeAIMock,
    CVF_SYSTEM_PROMPT: 'BASE_SYSTEM_PROMPT',
  };
});

vi.mock('@/lib/enforcement', () => ({
  evaluateEnforcement: evaluateEnforcementMock,
}));

vi.mock('@/lib/middleware-auth', () => {
  return {
    verifySessionCookie: verifySessionCookieMock,
    withSessionAuditPayload: (session: { impersonation?: { realActorId: string; sessionId: string } } | null | undefined, payload?: Record<string, unknown>) => {
      const nextPayload = { ...(payload ?? {}) };
      if (session?.impersonation) {
        nextPayload.impersonatedBy = session.impersonation.realActorId;
        nextPayload.impersonationSessionId = session.impersonation.sessionId;
      }
      return Object.keys(nextPayload).length > 0 ? nextPayload : undefined;
    },
  };
});

vi.mock('@/lib/quota-guard', () => ({
  checkTeamQuota: checkTeamQuotaMock,
  hasSoftCapAuditEvent: vi.fn().mockResolvedValue(false),
}));

import { POST } from './route';

describe('/api/execute DLP integration', () => {
  const originalPath = process.env.CVF_CONTROL_PLANE_EVENTS_PATH;
  const originalEnv = { ...process.env };
  let tempDir = '';

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-execute-dlp-'));
    process.env.CVF_CONTROL_PLANE_EVENTS_PATH = path.join(tempDir, 'events.json');
    process.env.OPENAI_API_KEY = 'openai-test-key';

    executeAIMock.mockReset();
    evaluateEnforcementMock.mockReset();
    verifySessionCookieMock.mockReset();
    checkTeamQuotaMock.mockReset();

    evaluateEnforcementMock.mockReturnValue({ status: 'ALLOW', reasons: [] });
    checkTeamQuotaMock.mockResolvedValue({
      exceeded: false,
      currentUSD: 0,
      softCapUSD: 0,
      hardCapUSD: 0,
      overrideActive: false,
    });
    verifySessionCookieMock.mockResolvedValue({
      userId: 'usr_2',
      user: 'Alice Admin',
      role: 'admin',
      orgId: 'org_cvf',
      teamId: 'team_exec',
      expiresAt: Date.now() + 3_600_000,
      authMode: 'session',
    });

    await appendDLPPolicyEvent({
      timestamp: '2026-04-18T00:00:00.000Z',
      patterns: [
        {
          id: 'custom-customer-id',
          label: 'Customer ID',
          regex: String.raw`cust-\d{4}`,
          enabled: true,
        },
      ],
      setBy: 'usr_2',
      setAt: '2026-04-18T00:00:00.000Z',
    });
  });

  afterEach(async () => {
    process.env = { ...originalEnv };
    if (originalPath) {
      process.env.CVF_CONTROL_PLANE_EVENTS_PATH = originalPath;
    } else {
      delete process.env.CVF_CONTROL_PLANE_EVENTS_PATH;
    }
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('redacts sensitive input before provider execution and records an audit event', async () => {
    executeAIMock.mockImplementation(async (_provider, _apiKey, prompt: string) => ({
      success: true,
      output: `Echoed prompt: ${prompt}`,
      provider: 'openai',
      model: 'gpt-4o',
      usage: {
        inputTokens: 30,
        outputTokens: 20,
        totalTokens: 50,
      },
    }));

    const response = await POST(new Request('http://localhost/api/execute', {
      method: 'POST',
      body: JSON.stringify({
        templateName: 'Strategy',
        intent: 'Analyze launch risks',
        inputs: {
          customer: 'cust-1234',
          notes: 'Charge card 4111 1111 1111 1111 and email alice@example.com',
        },
        provider: 'openai',
      }),
    }) as never);

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.output).toContain('[REDACTED:Credit Card]');
    expect(body.output).toContain('[REDACTED:Email]');
    expect(body.output).toContain('[REDACTED:Customer ID]');
    expect(body.output).not.toContain('4111 1111 1111 1111');

    const auditEvents = await readAuditEvents();
    expect(auditEvents.some(event => event.eventType === 'DLP_REDACTION_APPLIED')).toBe(true);
  });
});
