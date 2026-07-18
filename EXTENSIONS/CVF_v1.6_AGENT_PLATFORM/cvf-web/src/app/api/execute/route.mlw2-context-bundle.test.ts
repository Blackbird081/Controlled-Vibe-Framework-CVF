import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

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
  withSessionAuditPayload: (_session: unknown, payload?: Record<string, unknown>) => payload,
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

describe('/api/execute MLW2 context bundle readout', () => {
  const originalEnv = { ...process.env };
  const validOutput = '## Context Bundle Result\n\nThis response uses scoped retrieval and includes enough detail for validation.\n\n1. Keep retrieved evidence scoped.\n2. Preserve metadata-only bundle evidence.\n3. Avoid raw context release.';
  let tempDir = '';

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-mlw2-context-bundle-'));
    process.env = { ...originalEnv };
    process.env.CVF_CONTROL_PLANE_EVENTS_PATH = path.join(tempDir, 'events.json');
    process.env.OPENAI_API_KEY = 'openai-test-key';
    delete process.env.ALIBABA_API_KEY;
    delete process.env.DASHSCOPE_API_KEY;
    delete process.env.CVF_BENCHMARK_ALIBABA_KEY;
    delete process.env.CVF_ALIBABA_API_KEY;
    delete process.env.CVF_SERVICE_TOKEN;

    executeAIMock.mockReset();
    evaluateEnforcementMock.mockReset();
    verifySessionCookieMock.mockReset();
    checkTeamQuotaMock.mockReset();

    executeAIMock.mockResolvedValue({
      success: true,
      output: validOutput,
      provider: 'openai',
      model: 'gpt-4o-mini',
    });
    evaluateEnforcementMock.mockReturnValue({ status: 'ALLOW', reasons: [] });
    checkTeamQuotaMock.mockResolvedValue({
      exceeded: false,
      currentUSD: 0,
      softCapUSD: 50,
      hardCapUSD: 100,
      overrideActive: false,
    });
    verifySessionCookieMock.mockResolvedValue({
      userId: 'usr_mlw2',
      user: 'MLW2 Tester',
      role: 'admin',
      orgId: 'org_a',
      teamId: 'team_a',
      expiresAt: Date.now() + 1000 * 60 * 60,
      authMode: 'session',
    });
  });

  afterEach(async () => {
    process.env = { ...originalEnv };
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  });

  it('emits source-bounded context bundle evidence for scoped retrieval', async () => {
    const res = await POST(new Request('http://localhost/api/execute', {
      method: 'POST',
      body: JSON.stringify({
        templateName: 'Knowledge Query',
        intent: 'Analyze tenant-a alpha-scope partition details for users with constraints',
        inputs: {
          question: 'What is the tenant-a codename?',
          audience: 'Tenant A users',
          constraints: 'Use scoped retrieval only.',
        },
        provider: 'openai',
      }),
    }) as never);

    const data = await res.json();
    const options = executeAIMock.mock.calls[0][3] as { systemPrompt?: string };

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(options.systemPrompt).toContain('TENANT-A-SIGNAL');
    expect(options.systemPrompt).not.toContain('SHADOW-BETA');
    expect(data.knowledgeInjection).toMatchObject({
      injected: true,
      source: 'retrieval',
      chunkCount: 1,
      allowedCollectionIds: ['tenant-org-a-private'],
    });
    expect(data.requestContextReadout).toMatchObject({
      readoutVersion: 'cvf.routeRequestContextProfile.vi2.v1',
      readiness: 'ready',
    });
    expect(data.requestContextReadout.detectedSignals).toContain('knowledge_context');
    expect(data.contextBundleReadout).toMatchObject({
      readoutVersion: 'cvf.mlw2.contextBundleReadout.rt1.v1',
      cacheBoundary: 'DYNAMIC_REBUILD_REQUIRED',
      rawContextReleased: false,
      canReinject: false,
      runtimeContextMutationAuthorized: false,
      retrievalTrace: {
        source: 'retrieval',
        chunkCount: 1,
        injected: true,
      },
    });
    expect(data.contextBundleReadout.sourceMap).toEqual([
      expect.objectContaining({
        sourceType: 'knowledge_retrieval',
        evidencePointer: `receipt:${data.governanceEvidenceReceipt.receiptId}:knowledge`,
        injected: true,
        chunkCount: 1,
        allowedCollectionIds: ['tenant-org-a-private'],
      }),
    ]);
    expect(data.contextBundleReadout.bundleHash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(data.contextBundleReadout)).not.toMatch(/TENANT-A-SIGNAL|SHADOW-BETA|openai-test-key/i);
  });
});
