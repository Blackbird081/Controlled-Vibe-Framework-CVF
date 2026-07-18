/**
 * Wave 1 — Execute path retrieval partitioning integration tests
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { appendKnowledgeCollectionScopeEvent } from '@/lib/policy-events';
import { readAuditEvents } from '@/lib/control-plane-events';
import { knowledgeStore, type Sot3KnowledgeSourceMetadata } from '@/lib/knowledge-store';
import { Sot3ActivationEvidenceStore } from '@/lib/sot3-activation-evidence-store';
import { resetRateLimitStoresForTest } from '@/lib/rate-limit';

function computeExpectedContentHash(records: Array<Record<string, unknown>>): string {
  const sorted = records.map((record) => {
    const keys = Object.keys(record).sort();
    return keys.map((key) => [key, record[key]]);
  });
  return `sha256:${createHash('sha256').update(JSON.stringify(sorted)).digest('hex')}`;
}

function buildProvenance(sourceId: string, content: string, overrides: Partial<Sot3KnowledgeSourceMetadata> = {}): Sot3KnowledgeSourceMetadata {
  return {
    sourceId,
    sourceType: 'INTERNAL',
    owner: 'team-eng',
    capturedAtUtc: '2026-07-13T00:00:00.000Z',
    purpose: ['execute-route-context'],
    confidentiality: 'INTERNAL',
    expectedContentHash: computeExpectedContentHash([{ source_id: sourceId, id: sourceId, content }]),
    rawReference: { type: 'object', location: `knowledge-store://${sourceId}` },
    captureStatus: 'CAPTURED',
    declaredVersion: null,
    validFromUtc: null,
    validUntilUtc: null,
    ...overrides,
  };
}

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
    process.env.CVF_SOT3_ACTIVATION_EVIDENCE_PATH = path.join(tempDir, 'sot3-activation-evidence.json');
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

  it('injects AIF memory summaries only when explicit reinjection policy allows it', async () => {
    const req = new Request('http://localhost/api/execute', {
      method: 'POST',
      body: JSON.stringify({
        templateName: 'Knowledge Query',
        intent: 'Use governed continuity memory for this execution',
        inputs: { question: 'What should we preserve?' },
        provider: 'openai',
        aifMemoryReinjection: {
          enabled: true,
          purpose: 'continuity proof',
          scope: 'tenant-a',
          policy: {
            actorAuthorized: true,
            canReinject: true,
            provenanceScoreThreshold: 0.7,
          },
          memory: [
            {
              id: 'mem-safe',
              summary: 'Preserve the governed launch constraint summary.',
              provenanceScore: 0.95,
              lifecycleState: 'semantic',
            },
            {
              id: 'mem-raw',
              summary: 'Do not include raw payloads.',
              content: 'RAW-CONTENT-SHOULD-NOT-APPEAR',
              provenanceScore: 0.99,
              lifecycleState: 'semantic',
            },
          ],
        },
      }),
    });

    const res = await POST(req as never);
    const data = await res.json();
    const options = executeAIMock.mock.calls[0][3] as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(options.systemPrompt as string).toContain('## GOVERNED AIF MEMORY REINJECTION');
    expect(options.systemPrompt as string).toContain('mem-safe: Preserve the governed launch constraint summary.');
    expect(options.systemPrompt as string).not.toContain('RAW-CONTENT-SHOULD-NOT-APPEAR');
    expect(data.aifMemoryReinjection).toMatchObject({
      requested: true,
      injected: true,
      mode: 'summary_only',
      memoryIds: ['mem-safe'],
      reason: 'aif_memory_reinjection_summary_only_authorized',
    });
    expect(data.governanceEvidenceReceipt.aifMemoryReinjection.memoryIds).toEqual(['mem-safe']);
  });

  it('blocks AIF memory reinjection when actor policy does not authorize it', async () => {
    const req = new Request('http://localhost/api/execute', {
      method: 'POST',
      body: JSON.stringify({
        templateName: 'Knowledge Query',
        intent: 'Attempt unauthorized continuity memory',
        inputs: { question: 'What should we preserve?' },
        provider: 'openai',
        aifMemoryReinjection: {
          enabled: true,
          policy: {
            actorAuthorized: false,
            canReinject: true,
          },
          memory: [{ id: 'mem-safe', summary: 'Safe summary', lifecycleState: 'semantic' }],
        },
      }),
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe('aif_memory_reinjection_policy_denied');
    expect(data.governanceEvidenceReceipt.aifMemoryReinjection.injected).toBe(false);
    expect(executeAIMock).not.toHaveBeenCalled();
  });

  it('blocks AIF memory reinjection when all requested memories are secret or disputed', async () => {
    const req = new Request('http://localhost/api/execute', {
      method: 'POST',
      body: JSON.stringify({
        templateName: 'Knowledge Query',
        intent: 'Attempt unsafe continuity memory',
        inputs: { question: 'What should we preserve?' },
        provider: 'openai',
        aifMemoryReinjection: {
          enabled: true,
          policy: {
            actorAuthorized: true,
            canReinject: true,
          },
          memory: [
            { id: 'mem-secret', summary: 'Secret summary', containsSecret: true, lifecycleState: 'semantic' },
            { id: 'mem-disputed', summary: 'Disputed summary', lifecycleState: 'disputed' },
          ],
        },
      }),
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe('aif_memory_reinjection_no_eligible_summary_memory');
    expect(data.governanceEvidenceReceipt.aifMemoryReinjection.excluded).toEqual(expect.arrayContaining([
      { id: 'mem-secret', reason: 'privacy_filtered' },
      { id: 'mem-disputed', reason: 'lifecycle_disputed' },
    ]));
    expect(executeAIMock).not.toHaveBeenCalled();
  });
});

describe('/api/execute - SOT3 knowledge activation modes', () => {
  const originalEnv = { ...process.env };
  const validOutput = '## Scoped Knowledge Result\n\nThis structured response uses retrieved project knowledge and includes enough detail to satisfy output validation.\n\n1. Summarize the relevant tenant context.\n2. Keep the recommendation constrained to allowed data.\n3. Return a safe next-step plan.';
  let tempDir = '';

  beforeEach(async () => {
    resetRateLimitStoresForTest();
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-execute-sot3-'));
    process.env = { ...originalEnv };
    process.env.CVF_CONTROL_PLANE_EVENTS_PATH = path.join(tempDir, 'events.json');
    process.env.CVF_SOT3_ACTIVATION_EVIDENCE_PATH = path.join(tempDir, 'sot3-activation-evidence.json');
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

    (knowledgeStore as unknown as { _store: Map<string, unknown> })._store.clear();
    (knowledgeStore as unknown as { _ephemeral: Map<string, unknown> })._ephemeral.clear();
  });

  afterEach(async () => {
    process.env = { ...originalEnv };
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('ENFORCE mode injects only SOT3-approved context into the provider mock', async () => {
    process.env.CVF_SOT3_KNOWLEDGE_ACTIVATION_MODE = 'ENFORCE';
    const provenance = buildProvenance('src-route-enforce', 'ROUTE-ENFORCE-SIGNAL governed content');
    knowledgeStore.seed([
      {
        id: 'route-enforce-col',
        name: 'Route Enforce Col',
        description: 'd',
        orgId: 'org_a',
        teamId: 'team_a',
        chunks: [{ id: 'src-route-enforce', content: 'ROUTE-ENFORCE-SIGNAL governed content', keywords: ['route-enforce-signal'], sot3Source: provenance }],
      },
    ]);

    const req = new Request('http://localhost/api/execute', {
      method: 'POST',
      body: JSON.stringify({
        templateName: 'Knowledge Query',
        intent: 'Need route-enforce-signal governed content details',
        inputs: { question: 'What is the route-enforce-signal?' },
        provider: 'openai',
      }),
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(executeAIMock).toHaveBeenCalledTimes(1);
    const options = executeAIMock.mock.calls[0][3] as Record<string, unknown>;
    expect(options.systemPrompt as string).toContain('ROUTE-ENFORCE-SIGNAL governed content');
    expect(data.knowledgeInjection.injected).toBe(true);

    const evidenceRaw = readFileSync(process.env.CVF_SOT3_ACTIVATION_EVIDENCE_PATH as string, 'utf8');
    const evidenceDocument = JSON.parse(evidenceRaw);
    expect(evidenceDocument.records).toHaveLength(1);
    expect(evidenceDocument.records[0].traces).toHaveLength(1);
    expect(evidenceRaw).not.toContain('ROUTE-ENFORCE-SIGNAL governed content');

    const freshReader = new Sot3ActivationEvidenceStore(process.env.CVF_SOT3_ACTIVATION_EVIDENCE_PATH);
    const rehydrated = freshReader.findByRecordId(evidenceDocument.records[0].recordId);
    expect(rehydrated?.recordId).toBe(evidenceDocument.records[0].recordId);
  });

  it('ENFORCE mode with missing provenance rejects with a secret-safe 409 before any provider call (SOT3-ACT-A4)', async () => {
    process.env.CVF_SOT3_KNOWLEDGE_ACTIVATION_MODE = 'ENFORCE';
    knowledgeStore.seed([
      {
        id: 'route-enforce-noprov-col',
        name: 'Route Enforce No Provenance',
        description: 'd',
        orgId: 'org_a',
        teamId: 'team_a',
        chunks: [{ id: 'no-prov-route', content: 'ROUTE-NOPROV-SIGNAL raw content that must never appear', keywords: ['route-noprov-signal'] }],
      },
    ]);

    const req = new Request('http://localhost/api/execute', {
      method: 'POST',
      body: JSON.stringify({
        templateName: 'Knowledge Query',
        intent: 'Need route-noprov-signal raw content details',
        inputs: { question: 'What is the route-noprov-signal?' },
        provider: 'openai',
      }),
    });

    const res = await POST(req as never);
    const data = await res.json();

    // SOT3-ACT-A4: ENFORCE + REJECTED (here MISSING_PROVENANCE) now stops
    // before executeAI with a secret-safe 409. MISSING_PROVENANCE is not
    // exempted from the new pre-provider rejection rule; this regression
    // still proves ENFORCE + missing-provenance is rejected, with the
    // corrected expected shape (409, zero calls) instead of the prior
    // shape (200, provider called once, raw content silently dropped).
    expect(res.status).toBe(409);
    expect(executeAIMock).toHaveBeenCalledTimes(0);
    expect(data.success).toBe(false);
    expect(JSON.stringify(data)).not.toContain('ROUTE-NOPROV-SIGNAL');

    const events = await readAuditEvents();
    const sot3Event = events.find((event) => event.eventType === 'SOT3_KNOWLEDGE_ACTIVATION_EVALUATED');
    expect(sot3Event).toBeDefined();
    expect(JSON.stringify(sot3Event?.payload ?? {})).not.toContain('ROUTE-NOPROV-SIGNAL');
  });

  it('SHADOW mode audits evaluation but still injects the current raw retrieved context', async () => {
    process.env.CVF_SOT3_KNOWLEDGE_ACTIVATION_MODE = 'SHADOW';
    const provenance = buildProvenance('src-route-shadow', 'ROUTE-SHADOW-SIGNAL governed content');
    knowledgeStore.seed([
      {
        id: 'route-shadow-col',
        name: 'Route Shadow Col',
        description: 'd',
        orgId: 'org_a',
        teamId: 'team_a',
        chunks: [{ id: 'src-route-shadow', content: 'ROUTE-SHADOW-SIGNAL governed content', keywords: ['route-shadow-signal'], sot3Source: provenance }],
      },
    ]);

    const req = new Request('http://localhost/api/execute', {
      method: 'POST',
      body: JSON.stringify({
        templateName: 'Knowledge Query',
        intent: 'Need route-shadow-signal governed content details',
        inputs: { question: 'What is the route-shadow-signal?' },
        provider: 'openai',
      }),
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    const options = executeAIMock.mock.calls[0][3] as Record<string, unknown>;
    expect(options.systemPrompt as string).toContain('ROUTE-SHADOW-SIGNAL governed content');
    expect(data.knowledgeInjection.injected).toBe(true);

    const events = await readAuditEvents();
    const sot3Event = events.find((event) => event.eventType === 'SOT3_KNOWLEDGE_ACTIVATION_EVALUATED');
    expect(sot3Event).toBeDefined();
    expect((sot3Event?.payload as { terminalOutcome?: string } | undefined)?.terminalOutcome).toBe('APPROVED');
  });

  it('mode missing resolves to OFF and preserves existing provider context behavior', async () => {
    delete process.env.CVF_SOT3_KNOWLEDGE_ACTIVATION_MODE;
    knowledgeStore.seed([
      {
        id: 'route-off-col',
        name: 'Route Off Col',
        description: 'd',
        orgId: 'org_a',
        teamId: 'team_a',
        chunks: [{ id: 'no-mode-route', content: 'ROUTE-OFF-SIGNAL legacy content' , keywords: ['route-off-signal'] }],
      },
    ]);

    const req = new Request('http://localhost/api/execute', {
      method: 'POST',
      body: JSON.stringify({
        templateName: 'Knowledge Query',
        intent: 'Need route-off-signal legacy content details',
        inputs: { question: 'What is the route-off-signal?' },
        provider: 'openai',
      }),
    });

    const res = await POST(req as never);
    const options = executeAIMock.mock.calls[0][3] as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(options.systemPrompt as string).toContain('ROUTE-OFF-SIGNAL legacy content');

    const events = await readAuditEvents();
    expect(events.some((event) => event.eventType === 'SOT3_KNOWLEDGE_ACTIVATION_EVALUATED')).toBe(false);
  });
});
