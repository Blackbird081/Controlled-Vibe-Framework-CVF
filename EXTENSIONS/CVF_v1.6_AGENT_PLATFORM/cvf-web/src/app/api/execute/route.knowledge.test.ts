/**
 * Wave 1 — Execute path retrieval partitioning integration tests
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { appendKnowledgeCollectionScopeEvent } from '@/lib/policy-events';
import { readAuditEvents } from '@/lib/control-plane-events';

const executeAIMock = vi.hoisted(() => vi.fn());
const evaluateEnforcementMock = vi.hoisted(() => vi.fn());
const verifySessionCookieMock = vi.hoisted(() => vi.fn());
const checkTeamQuotaMock = vi.hoisted(() => vi.fn());

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

vi.mock('@/lib/guard-engine-singleton', () => ({
  getSharedGuardEngine: () => ({
    evaluate: () => ({ finalDecision: 'ALLOW', results: [] }),
  }),
}));

import { POST } from './route';

describe('/api/execute — retrieval partitioning enforcement', () => {
  const originalEnv = { ...process.env };
  const validOutput = '## Scoped Knowledge Result\n\nThis structured response uses retrieved project knowledge and includes enough detail to satisfy output validation.\n\n1. Summarize the relevant tenant context.\n2. Keep the recommendation constrained to allowed data.\n3. Return a safe next-step plan.';
  let tempDir = '';

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-execute-knowledge-'));
    process.env = { ...originalEnv };
    process.env.CVF_CONTROL_PLANE_EVENTS_PATH = path.join(tempDir, 'events.json');
    process.env.OPENAI_API_KEY = 'openai-test-key';
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GOOGLE_AI_API_KEY;
    delete process.env.ALIBABA_API_KEY;
    delete process.env.CVF_BENCHMARK_ALIBABA_KEY;
    delete process.env.CVF_ALIBABA_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.DEFAULT_AI_PROVIDER;
    delete process.env.CVF_SERVICE_TOKEN;

    executeAIMock.mockReset();
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
    executeAIMock.mockResolvedValue({
      success: true,
      output: validOutput,
      provider: 'openai',
      model: 'gpt-4o',
    });
    verifySessionCookieMock.mockResolvedValue({
      userId: 'usr_a',
      user: 'Tenant A',
      role: 'admin',
      orgId: 'org_a',
      teamId: 'team_a',
      expiresAt: Date.now() + 1000 * 60 * 60,
      authMode: 'session',
    });
  });

  afterEach(async () => {
    process.env = { ...originalEnv };
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('injects only tenant-matching chunks into the system prompt', async () => {
    const req = new Request('http://localhost/api/execute', {
      method: 'POST',
      body: JSON.stringify({
        templateName: 'Knowledge Query',
        intent: 'Need tenant-a alpha-scope partition details',
        inputs: { question: 'What is the tenant-a codename?' },
        provider: 'openai',
      }),
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);

    const options = executeAIMock.mock.calls[0][3] as Record<string, unknown>;
    expect(options.systemPrompt as string).toContain('TENANT-A-SIGNAL');
    expect(options.systemPrompt as string).not.toContain('SHADOW-BETA');
    expect(data.knowledgeInjection).toMatchObject({
      injected: true,
      source: 'retrieval',
      chunkCount: 1,
    });
    expect(data.governanceEvidenceReceipt).toMatchObject({
      evidenceMode: 'live',
      routeId: '/api/execute',
      decision: 'ALLOW',
      knowledgeSource: 'retrieval',
      knowledgeInjected: true,
      knowledgeChunkCount: 1,
    });
    expect(data.governanceEvidenceReceipt.receiptId).toContain(data.governanceEnvelope.envelopeId);
    expect(JSON.stringify(data.governanceEvidenceReceipt)).not.toMatch(/openai-test-key|sk-/i);
  });

  it('audits dropped cross-tenant chunks when query matches forbidden tenant content', async () => {
    const req = new Request('http://localhost/api/execute', {
      method: 'POST',
      body: JSON.stringify({
        templateName: 'Knowledge Query',
        intent: 'Compare tenant-a and tenant-b partition markers',
        inputs: { question: 'What tenant private markers exist?' },
        provider: 'openai',
      }),
    });

    await POST(req as never);
    const events = await readAuditEvents();
    const filterEvent = events.find(event => event.eventType === 'KNOWLEDGE_SCOPE_FILTER_APPLIED');

    expect(filterEvent).toBeDefined();
    expect((filterEvent?.payload as { droppedChunkCount?: number } | undefined)?.droppedChunkCount).toBeGreaterThan(0);
  });

  it('ignores raw knowledgeContext from session callers to prevent cross-tenant inline bypass', async () => {
    const req = new Request('http://localhost/api/execute', {
      method: 'POST',
      body: JSON.stringify({
        templateName: 'Knowledge Query',
        intent: 'Need tenant-a alpha-scope partition details',
        inputs: { question: 'What is the tenant-a codename?' },
        knowledgeContext: 'INLINE-BYPASS SHOULD NOT APPEAR',
        provider: 'openai',
      }),
    });

    await POST(req as never);
    const options = executeAIMock.mock.calls[0][3] as Record<string, unknown>;

    expect(options.systemPrompt as string).toContain('TENANT-A-SIGNAL');
    expect(options.systemPrompt as string).not.toContain('INLINE-BYPASS SHOULD NOT APPEAR');
  });

  it('blocks inline knowledgeContext for service-token callers to preserve scoped retrieval', async () => {
    process.env.CVF_SERVICE_TOKEN = 'svc';
    verifySessionCookieMock.mockResolvedValueOnce(null);

    const req = new Request('http://localhost/api/execute', {
      method: 'POST',
      headers: { 'x-cvf-service-token': 'svc' },
      body: JSON.stringify({
        templateName: 'Knowledge Query',
        intent: 'Internal governed context handoff',
        inputs: { question: 'What is the service-only context?' },
        knowledgeContext: 'SERVICE-ONLY INLINE CONTEXT',
        provider: 'openai',
      }),
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/Inline knowledgeContext is no longer accepted/i);
    expect(executeAIMock).not.toHaveBeenCalled();
  });

  it('applies admin scope overrides to collection retrieval', async () => {
    await appendKnowledgeCollectionScopeEvent({
      collectionId: 'cvf-engineering-runbooks',
      orgId: 'org_a',
      teamId: 'team_a',
      setBy: 'usr_1',
      setAt: '2026-04-18T10:15:00.000Z',
    });

    const req = new Request('http://localhost/api/execute', {
      method: 'POST',
      body: JSON.stringify({
        templateName: 'Knowledge Query',
        intent: 'Need engineering deploy runbook guidance',
        inputs: { question: 'What is the engineering codename?' },
        provider: 'openai',
      }),
    });

    await POST(req as never);
    const options = executeAIMock.mock.calls[0][3] as Record<string, unknown>;

    expect(options.systemPrompt as string).toContain('BRAVO-CIRCUIT');
  });
});
