import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const executeAIMock = vi.hoisted(() => vi.fn());
const evaluateEnforcementMock = vi.hoisted(() => vi.fn());
const verifySessionCookieMock = vi.hoisted(() => vi.fn());
const checkTeamQuotaMock = vi.hoisted(() => vi.fn());
const appendAuditEventMock = vi.hoisted(() => vi.fn());
const appendCostEventMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/ai', () => ({
  executeAI: executeAIMock,
  CVF_SYSTEM_PROMPT: 'BASE_SYSTEM_PROMPT',
}));

vi.mock('@/lib/enforcement', () => ({
  evaluateEnforcement: evaluateEnforcementMock,
}));

vi.mock('@/lib/middleware-auth', () => ({
  verifySessionCookie: verifySessionCookieMock,
  withSessionAuditPayload: (
    session: {
      impersonation?: {
        realActorId: string;
        sessionId: string;
        impersonatedUserId: string;
      };
    } | null | undefined,
    payload?: Record<string, unknown>,
  ) => {
    const nextPayload = { ...(payload ?? {}) };
    if (session?.impersonation) {
      nextPayload.impersonatedBy = session.impersonation.realActorId;
      nextPayload.impersonationSessionId = session.impersonation.sessionId;
      nextPayload.realActorId = session.impersonation.realActorId;
      nextPayload.impersonatedActorId = session.impersonation.impersonatedUserId;
    }
    return Object.keys(nextPayload).length > 0 ? nextPayload : undefined;
  },
}));

vi.mock('@/lib/quota-guard', () => ({
  checkTeamQuota: checkTeamQuotaMock,
  hasSoftCapAuditEvent: vi.fn().mockResolvedValue(false),
}));

vi.mock('@/lib/control-plane-events', async () => {
  const actual = await vi.importActual<typeof import('@/lib/control-plane-events')>(
    '@/lib/control-plane-events',
  );
  return {
    ...actual,
    appendAuditEvent: appendAuditEventMock,
    appendCostEvent: appendCostEventMock,
  };
});

import { POST } from './route';
import { resetRateLimitStoresForTest } from '@/lib/rate-limit';
import { resetSharedMandatoryGateway } from '@/lib/mandatory-gateway-singleton';
import { resetSharedGuardEngine } from '@/lib/guard-engine-singleton';

function makeExecuteRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/execute', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

function mandatoryGatewayEvents(): Array<Record<string, unknown>> {
  return appendAuditEventMock.mock.calls
    .map(([event]) => event as Record<string, unknown>)
    .filter((event) => event.eventType === 'MANDATORY_GATEWAY_EVALUATED');
}

describe('/api/execute mandatory gateway invocation', () => {
  const originalEnv = {
    ...process.env,
    CVF_RATE_LIMIT: '10000',
    CVF_PROVIDER_QUOTA_PER_MIN: '10000',
  };
  const validOutput = [
    '## Governed Response',
    '',
    'This deterministic response contains enough structured detail to pass validation.',
    '',
    '1. Inspect the request context.',
    '2. Apply the governed analysis.',
    '3. Return a concise operator recommendation.',
  ].join('\n');
  let tempDir = '';

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-mandatory-gateway-invocation-'));
    executeAIMock.mockReset();
    evaluateEnforcementMock.mockReset();
    verifySessionCookieMock.mockReset();
    checkTeamQuotaMock.mockReset();
    appendAuditEventMock.mockReset().mockResolvedValue({ id: 'gateway-audit-event-id' });
    appendCostEventMock.mockReset();
    resetRateLimitStoresForTest();
    resetSharedMandatoryGateway();
    resetSharedGuardEngine();

    evaluateEnforcementMock.mockReturnValue({ status: 'ALLOW', reasons: [] });
    checkTeamQuotaMock.mockResolvedValue({
      exceeded: false,
      currentUSD: 0,
      softCapUSD: 0,
      hardCapUSD: 0,
      overrideActive: false,
    });
    verifySessionCookieMock.mockResolvedValue({
      userId: 'operator-user',
      user: 'operator',
      role: 'admin',
      orgId: 'org-1',
      teamId: 'team-1',
      expiresAt: Date.now() + 1000 * 60 * 60,
    });

    process.env = { ...originalEnv };
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GOOGLE_AI_API_KEY;
    delete process.env.ALIBABA_API_KEY;
    delete process.env.DASHSCOPE_API_KEY;
    delete process.env.CVF_BENCHMARK_ALIBABA_KEY;
    delete process.env.CVF_ALIBABA_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.DEFAULT_AI_PROVIDER;
    delete process.env.CVF_SESSION_SECRET;
    process.env.OPENAI_API_KEY = 'fake-openai-key';
    process.env.CVF_FALSE_POSITIVE_REPORTS_PATH = path.join(
      tempDir,
      'false-positive-events.jsonl',
    );
  });

  afterEach(async () => {
    resetSharedMandatoryGateway();
    resetSharedGuardEngine();
    resetRateLimitStoresForTest();
    process.env = { ...originalEnv };
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('allows an authorized analysis through the real gateway before provider execution', async () => {
    const requestId = 't2-gateway-allow-request';
    const auditEventId = 't2-gateway-allow-audit';
    appendAuditEventMock.mockResolvedValue({ id: auditEventId });
    executeAIMock.mockResolvedValue({
      success: true,
      output: validOutput,
      provider: 'openai',
      model: 'gpt-4o',
    });

    const response = await POST(makeExecuteRequest({
      requestId,
      templateName: 'Strategy',
      intent: 'Analyze the market',
      inputs: { targetMarket: 'SMBs' },
      provider: 'openai',
      cvfPhase: 'INTAKE',
      cvfRiskLevel: 'R0',
      action: 'analyze template execution request',
    }) as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(executeAIMock).toHaveBeenCalledTimes(1);

    const events = mandatoryGatewayEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      outcome: 'ALLOW',
      payload: {
        gatewayDecision: 'ALLOW',
        gatewayAllowed: true,
        gatewayBypassed: false,
        gatewayControlMode: 'governed',
        gatewayRequestId: requestId,
        gatewayBlockedBy: undefined,
        gatewayEscalatedBy: undefined,
      },
    });
    expect(Object.keys(events[0].payload as Record<string, unknown>).sort()).toEqual([
      'gatewayAllowed',
      'gatewayBlockedBy',
      'gatewayBypassed',
      'gatewayControlMode',
      'gatewayDecision',
      'gatewayEscalatedBy',
      'gatewayRequestId',
    ]);
    expect(data.governanceEnvelope.auditEventIds).toContain(auditEventId);
    expect(data.governanceEvidenceReceipt.decision).toBe('ALLOW');
  });

  it('blocks unauthorized governance deletion before provider execution', async () => {
    const requestId = 't2-gateway-block-request';
    const auditEventId = 't2-gateway-block-audit';
    appendAuditEventMock.mockResolvedValue({ id: auditEventId });

    const response = await POST(makeExecuteRequest({
      requestId,
      templateName: 'Strategy',
      intent: 'Analyze the market',
      inputs: { targetMarket: 'SMBs' },
      provider: 'openai',
      cvfPhase: 'INTAKE',
      cvfRiskLevel: 'R0',
      action: 'delete_governance',
      aiCommit: {
        commitId: 't2-negative-authority-proof',
        agentId: 'cvf-route-test',
        timestamp: 1,
      },
    }) as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(executeAIMock).not.toHaveBeenCalled();
    expect(data.guardResult.finalDecision).toBe('BLOCK');

    const events = mandatoryGatewayEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      outcome: 'BLOCK',
      payload: {
        gatewayDecision: 'BLOCK',
        gatewayAllowed: false,
        gatewayBypassed: false,
        gatewayControlMode: 'governed',
        gatewayRequestId: requestId,
        gatewayBlockedBy: 'authority_gate',
        gatewayEscalatedBy: undefined,
      },
    });
    expect(Object.keys(events[0].payload as Record<string, unknown>).sort()).toEqual([
      'gatewayAllowed',
      'gatewayBlockedBy',
      'gatewayBypassed',
      'gatewayControlMode',
      'gatewayDecision',
      'gatewayEscalatedBy',
      'gatewayRequestId',
    ]);
    expect(data.governanceEnvelope.auditEventIds).toContain(auditEventId);
    expect(data.governanceEvidenceReceipt.decision).toBe('BLOCK');
  });
});
