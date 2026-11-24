/**
 * SOT3 SHADOW observe-only route proof (Finding A2).
 *
 * SHADOW evaluates and persists SOT3 evidence but never gates the request: a REJECTED activation (or an explicitly requested
 * collection with no governed context) proceeds with the ordinary retrieved context exactly as OFF, and the rejection stays visible
 * in the lineage terminal (`sot3:shadow-rejected:<recordId>` plus the named gap SOT3_SHADOW_REJECTED). ENFORCE keeps its fail-closed
 * 409 with zero provider calls. The built-in seed chunks carry declared system provenance, so the default global guardrail chunk is
 * APPROVED, while edited or user-supplied chunks are still rejected. Only the provider transport is doubled.
 */
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { readAuditEvents } from '@/lib/control-plane-events';
import { knowledgeStore } from '@/lib/knowledge-store';
import { KNOWLEDGE_COLLECTIONS } from '@/lib/knowledge-seed';
import { listKnowledgeCollections } from '@/lib/knowledge-retrieval';
import { Sot3ActivationEvidenceStore } from '@/lib/sot3-activation-evidence-store';
import { readLineage, loadLineageConfig, resolveSessionIdentity } from '@/lib/server/canonical-web-lineage';
import { resetRateLimitStoresForTest } from '@/lib/rate-limit';

const providerSpy = vi.hoisted(() => vi.fn());
const evaluateEnforcementMock = vi.hoisted(() => vi.fn());
const verifySessionCookieMock = vi.hoisted(() => vi.fn());
const checkTeamQuotaMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/ai', () => ({
  CVF_SYSTEM_PROMPT: 'BASE_SYSTEM_PROMPT',
}));

vi.mock('@/lib/enforcement', () => ({
  evaluateEnforcement: evaluateEnforcementMock,
}));

vi.mock('@/lib/middleware-auth', () => ({
  verifySessionCookie: verifySessionCookieMock,
  resolveVerifiedSessionProvenance: async () => ({ qualified: true, userId: 'user-tester', orgId: 'org-1', teamId: 'team-1', role: 'admin', oauthProvider: 'github', oauthSubject: 'route-test-subject', expiresAt: 4102444800000 }),
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
import { useCanonicalRouteHarness } from '@/test/canonical-route-test-support';

describe('/api/execute - SOT3 SHADOW observe-only and seed provenance (route-level)', () => {
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

    providerSpy.mockReset();
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
    providerSpy.mockResolvedValue({
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

  function post(extra: Record<string, unknown>) {
    return POST(new Request('http://localhost/api/execute', {
      method: 'POST',
      body: JSON.stringify({ templateId: 'meeting_notes', templateName: 'Knowledge Query', provider: 'openai', inputs: { question: 'q' }, ...extra }),
    }) as never);
  }

  function terminalOf(canonicalId: string) {
    const config = loadLineageConfig();
    if (!config.ok) throw new Error('lineage config');
    const identity = resolveSessionIdentity(config.value, { qualified: true, userId: 'user-tester', orgId: 'org-1', teamId: 'team-1' });
    if (!identity.ok) throw new Error('identity');
    const view = readLineage(config.value, identity.value, canonicalId);
    if (!view.ok) throw new Error('lineage read');
    return view.value.terminal;
  }

  const unprovenanced = [{
    id: 'shadow-reject-col', name: 'Shadow Reject Col', description: 'd', orgId: 'org_a', teamId: 'team_a',
    chunks: [{ id: 'no-prov-shadow', content: 'SHADOW-REJECT-SIGNAL ordinary retrieved content', keywords: ['shadow-reject-signal'] }],
  }];

  it('SHADOW + REJECTED (missing provenance) proceeds as OFF: 200, one provider call, ordinary context, evidence persisted, lineage gap', async () => {
    process.env.CVF_SOT3_KNOWLEDGE_ACTIVATION_MODE = 'SHADOW';
    knowledgeStore.seed(unprovenanced);

    const res = await post({ intent: 'Need shadow-reject-signal ordinary retrieved content details' });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.model).not.toBe('sot3-rejected');
    expect(providerSpy).toHaveBeenCalledTimes(1);
    const options = providerSpy.mock.calls[0][3] as Record<string, unknown>;
    expect(options.systemPrompt as string).toContain('SHADOW-REJECT-SIGNAL ordinary retrieved content');
    expect(data.knowledgeInjection.injected).toBe(true);

    const records = new Sot3ActivationEvidenceStore(process.env.CVF_SOT3_ACTIVATION_EVIDENCE_PATH).list();
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ mode: 'SHADOW', terminalOutcome: 'REJECTED', failureStage: 'MISSING_PROVENANCE' });
    const events = await readAuditEvents();
    expect(events.some((event) => event.eventType === 'SOT3_KNOWLEDGE_ACTIVATION_EVALUATED')).toBe(true);

    const terminal = terminalOf(data.canonicalLineage.canonicalId);
    expect(terminal?.refs.sot3).toBe(`sot3:shadow-rejected:${records[0].recordId}`);
    expect(terminal?.gaps).toContain('SOT3_SHADOW_REJECTED');
  });

  it('SHADOW + explicitly requested collection resolving to NO_CONTEXT also proceeds with zero injected context', async () => {
    process.env.CVF_SOT3_KNOWLEDGE_ACTIVATION_MODE = 'SHADOW';
    knowledgeStore.seed([{ id: 'shadow-empty-col', name: 'Shadow Empty', description: 'd', orgId: 'org_a', teamId: 'team_a', chunks: [] }]);

    const res = await post({ intent: 'Need any content from the empty requested collection', knowledgeCollectionId: 'shadow-empty-col' });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(providerSpy).toHaveBeenCalledTimes(1);
    expect(data.knowledgeInjection.injected).toBe(false);
    const records = new Sot3ActivationEvidenceStore(process.env.CVF_SOT3_ACTIVATION_EVIDENCE_PATH).list();
    const terminal = terminalOf(data.canonicalLineage.canonicalId);
    expect(terminal?.refs.sot3).toBe(`sot3:shadow-no_context:${records[0].recordId}`);
    expect(terminal?.gaps).toContain('SOT3_SHADOW_NO_CONTEXT');
  });

  it('ENFORCE + REJECTED for the same unprovenanced chunk still returns 409 with zero provider calls', async () => {
    process.env.CVF_SOT3_KNOWLEDGE_ACTIVATION_MODE = 'ENFORCE';
    knowledgeStore.seed(unprovenanced);

    const res = await post({ intent: 'Need shadow-reject-signal ordinary retrieved content details' });
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.model).toBe('sot3-rejected');
    expect(providerSpy).toHaveBeenCalledTimes(0);
    expect(JSON.stringify(data)).not.toContain('SHADOW-REJECT-SIGNAL');
  });

  describe('built-in seed provenance', () => {
    const globalIntent = 'Explain governance control-plane enterprise guardrails';

    // The retrieval layer lazily seeds the built-in collections once per module instance and would overwrite a test's replacement
    // on that first query. Prime it here so each test's own store contents are what the route actually reads.
    beforeEach(async () => { await listKnowledgeCollections(); });

    it('SHADOW approves the global guardrail seed chunk: no rejection, no SHADOW gap', async () => {
      process.env.CVF_SOT3_KNOWLEDGE_ACTIVATION_MODE = 'SHADOW';
      knowledgeStore.seed(KNOWLEDGE_COLLECTIONS);

      const res = await post({ intent: globalIntent });
      const data = await res.json();

      expect(res.status).toBe(200);
      const records = new Sot3ActivationEvidenceStore(process.env.CVF_SOT3_ACTIVATION_EVIDENCE_PATH).list();
      expect(records).toHaveLength(1);
      expect(records[0]).toMatchObject({ mode: 'SHADOW', terminalOutcome: 'APPROVED', failureStage: null });
      expect(records[0].traces[0]).toMatchObject({ chunkId: 'global-guardrails-001', sourceId: 'system-seed:global-guardrails-001' });
      const terminal = terminalOf(data.canonicalLineage.canonicalId);
      expect(terminal?.refs.sot3).toBe(`sot3:shadow-approved:${records[0].recordId}`);
      expect(terminal?.gaps).not.toContain('SOT3_SHADOW_REJECTED');
    });

    it('ENFORCE injects the global guardrail seed chunk after the full Refinery, Kernel and Flow lifecycle', async () => {
      process.env.CVF_SOT3_KNOWLEDGE_ACTIVATION_MODE = 'ENFORCE';
      knowledgeStore.seed(KNOWLEDGE_COLLECTIONS);

      const res = await post({ intent: globalIntent });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(providerSpy).toHaveBeenCalledTimes(1);
      expect((providerSpy.mock.calls[0][3] as Record<string, unknown>).systemPrompt as string).toContain('governed retrieval, append-only audit evidence');
      expect(data.knowledgeInjection.injected).toBe(true);
    });

    it('covers a store persisted before seed provenance existed (chunk stored without sot3Source) from the code-owned declaration', async () => {
      process.env.CVF_SOT3_KNOWLEDGE_ACTIVATION_MODE = 'ENFORCE';
      // The route re-seeds missing built-in collections in tests, so every built-in collection is replaced explicitly.
      knowledgeStore.seed(KNOWLEDGE_COLLECTIONS.map((collection) => ({ ...collection, chunks: collection.chunks.map((chunk) => ({ id: chunk.id, content: chunk.content, keywords: chunk.keywords })) })));

      const res = await post({ intent: globalIntent });

      expect(res.status).toBe(200);
      expect(providerSpy).toHaveBeenCalledTimes(1);
    });

    it('does not vouch for edited content that reuses a seed chunk id: integrity fails and ENFORCE rejects', async () => {
      process.env.CVF_SOT3_KNOWLEDGE_ACTIVATION_MODE = 'ENFORCE';
      const seed = KNOWLEDGE_COLLECTIONS[0];
      knowledgeStore.seed(KNOWLEDGE_COLLECTIONS.map((collection) => collection.id !== seed.id ? collection
        : { ...collection, chunks: [{ id: seed.chunks[0].id, keywords: seed.chunks[0].keywords, content: 'EDITED governance guardrails enterprise content' }] }));

      const res = await post({ intent: globalIntent });
      const data = await res.json();

      expect(res.status).toBe(409);
      expect(providerSpy).toHaveBeenCalledTimes(0);
      expect(JSON.stringify(data)).not.toContain('EDITED');
      const records = new Sot3ActivationEvidenceStore(process.env.CVF_SOT3_ACTIVATION_EVIDENCE_PATH).list();
      expect(records[0]).toMatchObject({ terminalOutcome: 'REJECTED', failureStage: 'REFINERY_NOT_READY' });
    });
  });

  // Canonical Gateway harness: lineage journal + provider transport double.
  useCanonicalRouteHarness(providerSpy);
});
