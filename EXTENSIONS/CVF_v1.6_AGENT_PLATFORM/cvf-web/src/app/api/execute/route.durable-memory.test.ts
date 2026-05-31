import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
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

describe('/api/execute durable memory route wiring', () => {
  const originalEnv = { ...process.env };
  const validOutput = '## Durable Memory Result\n\nThis response includes enough detail for validation.\n\n1. Preserve bounded route context.\n2. Keep memory summary-only.\n3. Return a governed next-step plan.';
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  let tempDir = '';
  let storePath = '';

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-r2-durable-route-'));
    storePath = path.join(tempDir, 'durable-memory.json');
    process.env = { ...originalEnv };
    process.env.OPENAI_API_KEY = 'openai-test-key';
    process.env.CVF_DURABLE_MEMORY_STORE_PATH = storePath;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GOOGLE_AI_API_KEY;
    delete process.env.ALIBABA_API_KEY;
    delete process.env.DASHSCOPE_API_KEY;
    delete process.env.CVF_BENCHMARK_ALIBABA_KEY;
    delete process.env.CVF_ALIBABA_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.DEEPSEEK_API_KEY;

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
      userId: 'usr_r2',
      user: 'R2 Tester',
      role: 'admin',
      orgId: 'org_r2',
      teamId: 'team_r2',
      expiresAt: Date.now() + 1000 * 60 * 60,
    });
  });

  afterEach(async () => {
    process.env = { ...originalEnv };
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  });

  async function writeDurableRecords() {
    await writeFile(storePath, `${JSON.stringify([
      {
        id: 'r2-skill-safe',
        tier: 'skill',
        scope: 'project:r2-route',
        actorId: 'operator-1',
        summary: 'durable-route-memory: Prefer strategy_analysis for the first governed receipt path.',
        lifecycleState: 'semantic',
        provenanceScore: 0.96,
        createdAt: 1770000000000,
        updatedAt: 1770000000000,
      },
    ], null, 2)}\n`, 'utf8');
  }

  it('injects authorized durable memory summaries and emits receipt evidence', async () => {
    await writeDurableRecords();

    const res = await POST(new Request('http://localhost/api/execute', {
      method: 'POST',
      body: JSON.stringify({
        templateId: 'strategy_analysis',
        templateName: 'Strategy Analysis',
        intent: 'Use durable-route-memory to prepare a bounded plan',
        inputs: {
          topic: 'R2 durable route memory',
          context: 'Need a route proof.',
          options: 'Use memory; do not overclaim.',
          constraints: 'Summary-only memory.',
          priority: 'R2',
        },
        provider: 'openai',
        durableMemory: {
          enabled: true,
          tier: 'skill',
          scope: 'project:r2-route',
          query: 'durable-route-memory',
          policy: { actorAuthorized: true },
        },
      }),
    }) as never);

    const data = await res.json();
    const options = executeAIMock.mock.calls[0][3] as { systemPrompt?: string };

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(options.systemPrompt).toContain('## GOVERNED DURABLE MEMORY CONTEXT');
    expect(options.systemPrompt).toContain('r2-skill-safe: durable-route-memory');
    expect(options.systemPrompt).toContain('canReinject=false');
    expect(data.durableMemoryRead).toMatchObject({
      decision: 'allowed',
      memoryIds: ['r2-skill-safe'],
      summaryOnly: true,
      canReinject: false,
      rawMemoryReleased: false,
    });
    expect(data.durableMemoryRead.receiptId).toMatch(/^m1-read-/);
    expect(data.governanceEvidenceReceipt.durableMemoryRead.memoryIds).toEqual(['r2-skill-safe']);
    expect(JSON.stringify(data)).not.toContain('openai-test-key');
  });

  it('degrades safely when the durable store JSON is corrupt', async () => {
    await writeFile(storePath, '{bad-json', 'utf8');

    const res = await POST(new Request('http://localhost/api/execute', {
      method: 'POST',
      body: JSON.stringify({
        templateId: 'strategy_analysis',
        templateName: 'Strategy Analysis',
        intent: 'Use durable-route-memory if available',
        inputs: { topic: 'R2', context: 'corrupt store', options: 'continue', constraints: 'safe', priority: 'R2' },
        provider: 'openai',
        durableMemory: {
          enabled: true,
          tier: 'skill',
          scope: 'project:r2-route',
          query: 'durable-route-memory',
          policy: { actorAuthorized: true },
        },
      }),
    }) as never);

    const data = await res.json();
    const options = executeAIMock.mock.calls[0][3] as { systemPrompt?: string };

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(options.systemPrompt ?? '').not.toContain('GOVERNED DURABLE MEMORY CONTEXT');
    expect(data.durableMemoryRead).toMatchObject({
      decision: 'allowed',
      memoryIds: [],
      summaryOnly: true,
      canReinject: false,
    });
  });

  it('does not inject durable memory when actor policy denies access', async () => {
    await writeDurableRecords();

    const res = await POST(new Request('http://localhost/api/execute', {
      method: 'POST',
      body: JSON.stringify({
        templateId: 'strategy_analysis',
        templateName: 'Strategy Analysis',
        intent: 'Attempt unauthorized durable memory',
        inputs: { topic: 'R2', context: 'deny', options: 'continue', constraints: 'safe', priority: 'R2' },
        provider: 'openai',
        durableMemory: {
          enabled: true,
          tier: 'skill',
          scope: 'project:r2-route',
          query: 'durable-route-memory',
          policy: { actorAuthorized: false },
        },
      }),
    }) as never);

    const data = await res.json();
    const options = executeAIMock.mock.calls[0][3] as { systemPrompt?: string };

    expect(res.status).toBe(200);
    expect(options.systemPrompt ?? '').not.toContain('r2-skill-safe');
    expect(data.durableMemoryRead).toMatchObject({
      decision: 'denied',
      reason: 'durable_memory_policy_denied',
      memoryIds: [],
      canReinject: false,
    });
    expect(data.durableMemoryRead.receiptId).toMatch(uuidPattern);
    expect(data.governanceEvidenceReceipt.durableMemoryRead.reason).toBe('durable_memory_policy_denied');
  });

  it('writes authorized durable memory summaries after successful governed execution', async () => {
    const res = await POST(new Request('http://localhost/api/execute', {
      method: 'POST',
      body: JSON.stringify({
        templateId: 'strategy_analysis',
        templateName: 'Strategy Analysis',
        intent: 'Write a governed durable memory summary',
        inputs: { topic: 'S1', context: 'write route', options: 'continue', constraints: 'summary only', priority: 'R1' },
        provider: 'openai',
        durableMemoryWrite: {
          enabled: true,
          tier: 'skill',
          scope: 'project:s1-route',
          policy: { actorAuthorized: true },
          maxSummaryLength: 80,
        },
      }),
    }) as never);

    const data = await res.json();
    const records = JSON.parse(await readFile(storePath, 'utf8')) as Array<{ summary: string; scope: string; tier: string }>;

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.durableMemoryWriteReceipt).toMatchObject({
      operation: 'write',
      decision: 'allowed',
      reason: 'durable_memory_write_authorized',
      tier: 'skill',
      scope: 'project:s1-route',
      summaryOnly: true,
      canReinject: false,
      rawMemoryReleased: false,
    });
    expect(data.governanceEvidenceReceipt.durableMemoryWriteReceipt.memoryIds).toHaveLength(1);
    expect(records).toHaveLength(1);
    expect(records[0].scope).toBe('project:s1-route');
    expect(records[0].tier).toBe('skill');
    expect(records[0].summary.length).toBeLessThanOrEqual(105);
    expect(records[0].summary).toContain('truncated_summary_only');
  });

  it('denies durable memory write when actor policy is not authorized', async () => {
    const res = await POST(new Request('http://localhost/api/execute', {
      method: 'POST',
      body: JSON.stringify({
        templateId: 'strategy_analysis',
        templateName: 'Strategy Analysis',
        intent: 'Attempt unauthorized durable memory write',
        inputs: { topic: 'S1', context: 'deny write', options: 'continue', constraints: 'safe', priority: 'R1' },
        provider: 'openai',
        durableMemoryWrite: {
          enabled: true,
          tier: 'skill',
          scope: 'project:s1-route',
          policy: { actorAuthorized: false },
        },
      }),
    }) as never);

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.durableMemoryWriteReceipt).toMatchObject({
      operation: 'write',
      decision: 'denied',
      reason: 'durable_memory_write_policy_denied',
      memoryIds: [],
      canReinject: false,
      rawMemoryReleased: false,
    });
    await expect(readFile(storePath, 'utf8')).rejects.toThrow();
  });

  it('skips durable memory write when enforcement blocks execution', async () => {
    evaluateEnforcementMock.mockReturnValue({ status: 'BLOCK', reasons: ['blocked for test'], riskGate: { riskLevel: 'R4' } });

    const res = await POST(new Request('http://localhost/api/execute', {
      method: 'POST',
      body: JSON.stringify({
        templateId: 'strategy_analysis',
        templateName: 'Strategy Analysis',
        intent: 'Blocked durable memory write',
        inputs: { topic: 'S1', context: 'block', options: 'continue', constraints: 'safe', priority: 'R4' },
        provider: 'openai',
        durableMemoryWrite: {
          enabled: true,
          tier: 'skill',
          scope: 'project:s1-route',
          policy: { actorAuthorized: true },
        },
      }),
    }) as never);

    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.durableMemoryWriteReceipt).toBeUndefined();
    expect(data.governanceEvidenceReceipt.durableMemoryWriteReceipt).toBeUndefined();
    await expect(readFile(storePath, 'utf8')).rejects.toThrow();
  });

  it('does not write durable memory without explicit write opt-in', async () => {
    const res = await POST(new Request('http://localhost/api/execute', {
      method: 'POST',
      body: JSON.stringify({
        templateId: 'strategy_analysis',
        templateName: 'Strategy Analysis',
        intent: 'No durable memory write opt in',
        inputs: { topic: 'S1', context: 'absent write request', options: 'continue', constraints: 'safe', priority: 'R1' },
        provider: 'openai',
      }),
    }) as never);

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.durableMemoryWriteReceipt).toBeUndefined();
    expect(data.governanceEvidenceReceipt.durableMemoryWriteReceipt).toBeUndefined();
    await expect(readFile(storePath, 'utf8')).rejects.toThrow();
  });
});
