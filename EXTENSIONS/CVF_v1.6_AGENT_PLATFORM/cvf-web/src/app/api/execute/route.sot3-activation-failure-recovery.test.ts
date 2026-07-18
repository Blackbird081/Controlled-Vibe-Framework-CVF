/**
 * SOT3-ACT-A4 - Route-Level Zero-Call And Rollback Proof
 *
 * Focused route-level regression proving the execute route's new SOT3
 * pre-provider admission boundary added by A4: ENFORCE + REJECTED and an
 * explicitly requested governed collection resolving to NO_CONTEXT must both
 * return a secret-safe 409 with zero provider calls; an unrequested empty
 * retrieval must preserve ordinary route behavior; and ENFORCE-to-OFF
 * rollback must restore legacy provider execution with exactly one provider
 * spy call. Only the downstream provider (`executeAI`) is mocked; every
 * other seam (Refinery, Kernel, Flow, adapter, A2 evidence store, route) runs
 * through its real implementation.
 *
 * Authorization: docs/work_orders/CVF_AGENT_WORK_ORDER_SOT3_ACT_A4_FAILURE_AND_RECOVERY_BOUNDARY_PROOF_2026-07-13.md
 */
import { createHash } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { readAuditEvents } from '@/lib/control-plane-events';
import { knowledgeStore, type Sot3KnowledgeSourceMetadata } from '@/lib/knowledge-store';
import { resetRateLimitStoresForTest } from '@/lib/rate-limit';

function computeExpectedContentHash(records: Array<Record<string, unknown>>): string {
  const sorted = records.map((record) => {
    const keys = Object.keys(record).sort();
    return keys.map((key) => [key, record[key]]);
  });
  return `sha256:${createHash('sha256').update(JSON.stringify(sorted)).digest('hex')}`;
}

function buildProvenance(sourceId: string, content: string): Sot3KnowledgeSourceMetadata {
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

describe('/api/execute - SOT3-ACT-A4 failure/recovery boundary (route-level)', () => {
  const originalEnv = { ...process.env };
  const validOutput = '## Scoped Knowledge Result\n\nThis structured response uses retrieved project knowledge and includes enough detail to satisfy output validation.\n\n1. Summarize the relevant tenant context.\n2. Keep the recommendation constrained to allowed data.\n3. Return a safe next-step plan.';
  let tempDir = '';

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-execute-sot3-a4-'));
    process.env = { ...originalEnv };
    process.env.CVF_CONTROL_PLANE_EVENTS_PATH = path.join(tempDir, 'events.json');
    process.env.CVF_SOT3_ACTIVATION_EVIDENCE_PATH = path.join(tempDir, 'sot3-activation-evidence.json');
    // .env.local configures CVF_RATE_LIMIT_STORE=redis with real Upstash
    // credentials (loaded globally by src/test/setup.ts for every test),
    // so by default this route hits a REAL external rate limiter keyed by
    // userId with a real 60-second TTL window -- `resetRateLimitStoresForTest`
    // only clears the in-memory fallback and has no effect on that Redis
    // state. Forcing memory mode here (read fresh from process.env on every
    // request) routes this file's real POST calls onto the local store that
    // the reset call actually controls, so this file's own assertions do not
    // flake on cross-run real-Redis rate-limit accumulation that is
    // unrelated to what this file asserts.
    process.env.CVF_RATE_LIMIT_STORE = 'memory';
    process.env.CVF_RATE_LIMIT = '1000';
    resetRateLimitStoresForTest();
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

  it('ENFORCE + REJECTED (wrong content hash -> REFINERY_NOT_READY) returns a secret-safe 409 with zero provider calls', async () => {
    process.env.CVF_SOT3_KNOWLEDGE_ACTIVATION_MODE = 'ENFORCE';
    const provenance = buildProvenance('src-a4-reject', 'A4-REJECT-SIGNAL content');
    knowledgeStore.seed([
      {
        id: 'a4-reject-col',
        name: 'A4 Reject Col',
        description: 'd',
        orgId: 'org_a',
        teamId: 'team_a',
        chunks: [{
          id: 'a4-reject-chunk',
          content: 'A4-REJECT-SIGNAL content',
          keywords: ['a4-reject-signal'],
          sot3Source: { ...provenance, expectedContentHash: 'sha256:0000000000000000000000000000000000000000000000000000000000000000' },
        }],
      },
    ]);

    const req = new Request('http://localhost/api/execute', {
      method: 'POST',
      body: JSON.stringify({
        templateName: 'Knowledge Query',
        intent: 'Need a4-reject-signal content details',
        inputs: { question: 'What is the a4-reject-signal?' },
        provider: 'openai',
      }),
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(executeAIMock).toHaveBeenCalledTimes(0);
    expect(data.success).toBe(false);
    expect(JSON.stringify(data)).not.toContain('A4-REJECT-SIGNAL');
    expect(data.diagnostic).toMatchObject({ stage: 'governance', class: 'policy_blocked', httpStatus: 409 });
  });

  it('ENFORCE + explicitly requested collection resolving to NO_CONTEXT returns a secret-safe 409 with zero provider calls', async () => {
    process.env.CVF_SOT3_KNOWLEDGE_ACTIVATION_MODE = 'ENFORCE';
    knowledgeStore.seed([
      {
        id: 'a4-empty-requested-col',
        name: 'A4 Empty Requested Col',
        description: 'd',
        orgId: 'org_a',
        teamId: 'team_a',
        chunks: [],
      },
    ]);

    const req = new Request('http://localhost/api/execute', {
      method: 'POST',
      body: JSON.stringify({
        templateName: 'Knowledge Query',
        intent: 'Need any content from the empty requested collection',
        inputs: { question: 'What is in this collection?' },
        provider: 'openai',
        knowledgeCollectionId: 'a4-empty-requested-col',
      }),
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(executeAIMock).toHaveBeenCalledTimes(0);
    expect(data.success).toBe(false);
  });

  it('ENFORCE + unrequested empty retrieval (no knowledgeCollectionId) preserves ordinary route behavior (200, provider called once)', async () => {
    process.env.CVF_SOT3_KNOWLEDGE_ACTIVATION_MODE = 'ENFORCE';
    // No collections seeded at all: retrieval returns zero chunks and no
    // specific collection was requested by the caller.

    const req = new Request('http://localhost/api/execute', {
      method: 'POST',
      body: JSON.stringify({
        templateName: 'Knowledge Query',
        intent: 'General question unrelated to any governed collection',
        inputs: { question: 'What is the weather like?' },
        provider: 'openai',
      }),
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(executeAIMock).toHaveBeenCalledTimes(1);
    expect(data.success).toBe(true);
    expect(data.knowledgeInjection.injected).toBe(false);
  });

  it('ENFORCE-to-OFF rollback restores legacy provider execution with exactly one provider spy call', async () => {
    delete process.env.CVF_SOT3_KNOWLEDGE_ACTIVATION_MODE;
    knowledgeStore.seed([
      {
        id: 'a4-rollback-col',
        name: 'A4 Rollback Col',
        description: 'd',
        orgId: 'org_a',
        teamId: 'team_a',
        chunks: [{ id: 'a4-rollback-chunk', content: 'A4-ROLLBACK-SIGNAL legacy content', keywords: ['a4-rollback-signal'] }],
      },
    ]);

    const req = new Request('http://localhost/api/execute', {
      method: 'POST',
      body: JSON.stringify({
        templateName: 'Knowledge Query',
        intent: 'Need a4-rollback-signal legacy content details',
        inputs: { question: 'What is the a4-rollback-signal?' },
        provider: 'openai',
      }),
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(executeAIMock).toHaveBeenCalledTimes(1);
    const options = executeAIMock.mock.calls[0][3] as Record<string, unknown>;
    expect(options.systemPrompt as string).toContain('A4-ROLLBACK-SIGNAL legacy content');
    expect(data.knowledgeInjection.injected).toBe(true);

    const events = await readAuditEvents();
    expect(events.some((event) => event.eventType === 'SOT3_KNOWLEDGE_ACTIVATION_EVALUATED')).toBe(false);
  });

  it('rollback proof: invalid activation-mode value resolves to OFF fail-safe and still preserves exactly one provider spy call', async () => {
    process.env.CVF_SOT3_KNOWLEDGE_ACTIVATION_MODE = 'BOGUS_MODE_VALUE';
    knowledgeStore.seed([
      {
        id: 'a4-rollback-invalid-mode-col',
        name: 'A4 Rollback Invalid Mode Col',
        description: 'd',
        orgId: 'org_a',
        teamId: 'team_a',
        chunks: [{ id: 'a4-rollback-invalid-mode-chunk', content: 'A4-ROLLBACK-INVALID-MODE-SIGNAL content', keywords: ['a4-rollback-invalid-mode-signal'] }],
      },
    ]);

    const req = new Request('http://localhost/api/execute', {
      method: 'POST',
      body: JSON.stringify({
        templateName: 'Knowledge Query',
        intent: 'Need a4-rollback-invalid-mode-signal content details',
        inputs: { question: 'What is the a4-rollback-invalid-mode-signal?' },
        provider: 'openai',
      }),
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(executeAIMock).toHaveBeenCalledTimes(1);
    expect(data.knowledgeInjection.injected).toBe(true);
  });
});
