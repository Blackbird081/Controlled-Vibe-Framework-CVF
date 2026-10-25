import { readFileSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Source-only checks of the execute route context selection. Retrieval, activation, persistence, memory and
 * egress dependencies are mocked: these tests prove which branch is taken, never what a provider would receive.
 */
const mocks = vi.hoisted(() => ({
  queryKnowledgeChunks: vi.fn(),
  formatKnowledgeChunks: vi.fn(),
  appendAuditEvent: vi.fn(),
  getCollection: vi.fn(),
  evaluateSot3: vi.fn(),
  sot3Mode: vi.fn(() => 'OFF' as 'OFF' | 'SHADOW' | 'ENFORCE'),
  persistRecord: vi.fn(),
  evaluateDurable: vi.fn(),
  evaluateAif: vi.fn(),
  aifAudit: vi.fn(),
  aifDenied: vi.fn(),
  hasBlocked: vi.fn(async () => false),
  buildReceipt: vi.fn(() => ({ receiptId: 'rcpt-fixture' })),
}));

vi.mock('next/server', () => ({
  NextResponse: { json: (body: unknown, init?: { status?: number }) => ({ status: init?.status ?? 200, body }) },
}));
vi.mock('@/lib/ai', () => ({ CVF_SYSTEM_PROMPT: 'CVF-STATIC-INSTRUCTIONS' }));
vi.mock('@/lib/knowledge-context-injector', () => ({
  buildKnowledgeSystemPrompt: (base: string, context: string) => `${base}|KNOWLEDGE:${context}`,
  hasKnowledgeContext: (context: string | undefined) => !!context?.trim(),
}));
vi.mock('@/lib/knowledge-retrieval', () => ({ queryKnowledgeChunks: mocks.queryKnowledgeChunks, formatKnowledgeChunks: mocks.formatKnowledgeChunks }));
vi.mock('@/lib/knowledge-store', () => ({ knowledgeStore: { getCollection: mocks.getCollection } }));
vi.mock('@/lib/control-plane-events', () => ({ appendAuditEvent: mocks.appendAuditEvent }));
vi.mock('@/lib/middleware-auth', () => ({ withSessionAuditPayload: (_session: unknown, payload: unknown) => payload }));
vi.mock('@/lib/sot3-knowledge-adapter', () => ({
  evaluateSot3KnowledgeActivation: mocks.evaluateSot3, resolveSot3KnowledgeActivationMode: mocks.sot3Mode,
}));
vi.mock('@/lib/sot3-activation-evidence-store', () => ({
  Sot3ActivationEvidenceStore: class { append = mocks.persistRecord; },
  classifySot3EvidenceError: () => 'PERSISTED', computeSot3EvidenceRecordIntegrityHash: () => 'hash',
  deriveSot3EvidenceRecordId: () => 'record', SOT3_ACTIVATION_EVIDENCE_SCHEMA_VERSION: '1',
}));
vi.mock('cvf-refinery', () => ({ DeterministicClock: class {}, SequentialIdFactory: class {} }));
vi.mock('@/lib/durable-memory-route', () => ({
  evaluateDurableMemoryRoute: mocks.evaluateDurable, resolveDurableMemoryActorRole: () => 'BUILDER',
  buildDurableMemorySystemPrompt: (base: string, block: string) => `${base}|DURABLE:${block}`,
}));
vi.mock('@/lib/aif-memory-reinjection', () => ({
  evaluateAifMemoryReinjection: mocks.evaluateAif,
  buildAifMemoryReinjectionSystemPrompt: (base: string, block: string) => `${base}|AIF:${block}`,
}));
vi.mock('@/lib/aif-memory-reinjection-route', () => ({
  appendAifMemoryReinjectionAudit: mocks.aifAudit, buildAifMemoryReinjectionDeniedResponse: mocks.aifDenied,
}));
vi.mock('./governed-context-egress', () => ({ hasBlockedGovernedContext: mocks.hasBlocked }));
vi.mock('@/lib/web-governance-envelope', () => ({ buildEvidenceReceipt: mocks.buildReceipt }));
vi.mock('@/lib/execution-diagnostics', () => ({ buildExecutionDiagnostic: (value: unknown) => ({ diagnostic: value }) }));

import { isolatedPilotKnowledgeContext } from './route-knowledge-context';
import { resolveMemoryContext, selectKnowledgeContext, sot3RejectionResponse } from './route-context-selection';

type SelectParams = Parameters<typeof selectKnowledgeContext>[1];
type MemoryInput = Parameters<typeof resolveMemoryContext>[0];
type RejectionInput = Parameters<typeof sot3RejectionResponse>[0];
type Plain = { status: number; body: Record<string, unknown> };

const chunk = { id: 'chunk-1', content: 'AMBIENT-PRIVATE-FIXTURE', keywords: ['fixture'], collectionId: 'col-1', collectionName: 'Fixture', score: 3 };
const nonEmptyRetrieval = { chunks: [chunk], matchedChunkCount: 1, allowedChunkCount: 1, droppedChunkCount: 0,
  allowedCollectionIds: ['col-1'], droppedCollectionIds: [] };
const params = (overrides: Partial<SelectParams> = {}): SelectParams => ({
  intent: 'fictional goal', orgId: 'org', teamId: 'team', requestedCollectionId: undefined, templateLabel: 'web_build_handoff',
  session: null, ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.sot3Mode.mockReturnValue('OFF');
  mocks.queryKnowledgeChunks.mockResolvedValue(nonEmptyRetrieval);
  mocks.formatKnowledgeChunks.mockImplementation((chunks: Array<{ content: string }>) => chunks.map(c => c.content).join('\n'));
  mocks.evaluateDurable.mockReturnValue({ requested: false, injected: false, records: [] });
  mocks.evaluateAif.mockReturnValue({ status: 'not_requested', receipt: { requested: false } });
  mocks.hasBlocked.mockResolvedValue(false);
});

describe('selectKnowledgeContext', () => {
  it('keeps scoped retrieval for an ordinary request with a nonempty fixture', async () => {
    const result = await selectKnowledgeContext(false, params({ requestedCollectionId: 'col-1' }));
    expect(mocks.queryKnowledgeChunks).toHaveBeenCalledTimes(1);
    expect(mocks.queryKnowledgeChunks).toHaveBeenCalledWith({ intent: 'fictional goal', orgId: 'org', teamId: 'team', collectionId: 'col-1' });
    expect(result.knowledgeInjected).toBe(true);
    expect(result.knowledgeSource).toBe('retrieval');
    expect(result.retrievalResult.allowedChunkCount).toBe(1);
    expect(result.knowledgeSystemPrompt).toContain('AMBIENT-PRIVATE-FIXTURE');
    expect(result.requestedKnowledgeCollectionId).toBe('col-1');
  });

  it('keeps the SOT3 lane on for an ordinary request when its mode is on', async () => {
    mocks.sot3Mode.mockReturnValue('SHADOW');
    mocks.evaluateSot3.mockReturnValue({ terminalOutcome: 'APPROVED', injectionPermitted: true, approvedContext: 'APPROVED', failureStage: null, traces: [] });
    mocks.persistRecord.mockResolvedValue({ diagnosticClass: 'PERSISTED' });
    const result = await selectKnowledgeContext(false, params());
    expect(mocks.evaluateSot3).toHaveBeenCalledTimes(1);
    expect(result.sot3).not.toBeNull();
  });

  it('does no query, audit, activation or store access for a server-selected pilot even when ambient data exists', async () => {
    mocks.sot3Mode.mockReturnValue('ENFORCE');
    const result = await selectKnowledgeContext(true, params({ requestedCollectionId: 'col-1' }));
    expect(mocks.queryKnowledgeChunks).not.toHaveBeenCalled();
    expect(mocks.formatKnowledgeChunks).not.toHaveBeenCalled();
    expect(mocks.appendAuditEvent).not.toHaveBeenCalled();
    expect(mocks.evaluateSot3).not.toHaveBeenCalled();
    expect(mocks.getCollection).not.toHaveBeenCalled();
    expect(result).toEqual(isolatedPilotKnowledgeContext());
    expect(result.knowledgeInjected).toBe(false);
    expect(result.knowledgeSource).toBe('none');
    expect(result.finalKnowledgeContext).toBeUndefined();
    expect(result.knowledgeSystemPrompt).toBe('CVF-STATIC-INSTRUCTIONS');
    expect(result.requestedKnowledgeCollectionId).toBeNull();
    expect(result.sot3).toBeNull();
    expect(result.retrievalResult).toEqual({ chunks: [], matchedChunkCount: 0, allowedChunkCount: 0, droppedChunkCount: 0,
      allowedCollectionIds: [], droppedCollectionIds: [] });
  });

  it('returns a fresh empty result on every call so one request cannot mutate another', () => {
    const first = isolatedPilotKnowledgeContext();
    first.retrievalResult.chunks.push(chunk);
    expect(isolatedPilotKnowledgeContext().retrievalResult.chunks).toEqual([]);
  });

  it('is selected only by the server-side pilot binding, never by a request field', () => {
    const source = readFileSync(path.join(__dirname, 'route.ts'), 'utf8');
    const calls = source.match(/selectKnowledgeContext\(([^,]+),/g) ?? [];
    expect(calls).toEqual(['selectKnowledgeContext(!!htmlPilotPrepared,']);
    expect(source).toContain('const htmlPilotPrepared = await prepareHtmlPilotExecution(body, session, isServiceAllowed);');
    expect(source).not.toMatch(/selectKnowledgeContext\([^)]*body\.(isolat|pilot|skip|ambient)/i);
    expect(source).not.toMatch(/resolveKnowledgeContext\(/);
  });

  it('shrinks the registered execute owner by at least fifty lines while staying under the hard limit', () => {
    const lines = readFileSync(path.join(__dirname, 'route.ts'), 'utf8').split('\n').length;
    expect(lines).toBeLessThanOrEqual(924);
  });
});

describe('sot3RejectionResponse', () => {
  const base = (sot3: unknown, requested: string | null): RejectionInput => ({
    knowledge: { ...isolatedPilotKnowledgeContext(), sot3: sot3 as never, requestedKnowledgeCollectionId: requested },
    envelope: { policySnapshotId: 'policy-1' } as never, enforcement: { riskGate: { riskLevel: 'R1' } } as never,
    guardResult: {} as never, provider: 'alibaba', routingResult: { decision: 'ROUTED' } as never,
  });
  it('lets a request through when there is no activation, an approved activation or an unrequested empty one', () => {
    expect(sot3RejectionResponse(base(null, null))).toBeNull();
    expect(sot3RejectionResponse(base({ terminalOutcome: 'APPROVED' }, 'col-1'))).toBeNull();
    expect(sot3RejectionResponse(base({ terminalOutcome: 'NO_CONTEXT' }, null))).toBeNull();
  });
  it('fails closed with 409 for a rejected activation and for an explicitly requested empty collection', () => {
    for (const input of [base({ terminalOutcome: 'REJECTED' }, null), base({ terminalOutcome: 'NO_CONTEXT' }, 'col-1')]) {
      const response = sot3RejectionResponse(input) as unknown as Plain;
      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.model).toBe('sot3-rejected');
      expect(response.body.error).toBe('Governed knowledge activation rejected this request before provider execution.');
    }
    expect(mocks.buildReceipt).toHaveBeenCalledTimes(2);
  });
});

describe('resolveMemoryContext', () => {
  const input = (overrides: Partial<MemoryInput> = {}, knowledgeOverrides: Record<string, unknown> = {}): MemoryInput => ({
    body: { intent: 'fictional goal' } as never, session: null,
    knowledge: { ...isolatedPilotKnowledgeContext(), ...knowledgeOverrides } as MemoryInput['knowledge'],
    actor: { id: 'actor-1', executionRole: 'builder', targetResource: 'web_build_handoff' },
    envelope: {} as never, enforcement: {} as never, guardResult: {} as never, routedProvider: 'alibaba',
    routingResult: { decision: 'ROUTED' } as never, htmlPilotPrepared: true, ...overrides,
  });
  const refusal = (outcome: Awaited<ReturnType<typeof resolveMemoryContext>>) => outcome.response as unknown as Plain | undefined;

  it('lets a prepared pilot continue with no ambient context and keeps the static prompt only', async () => {
    const outcome = await resolveMemoryContext(input());
    expect(outcome.response).toBeUndefined();
    expect(outcome).toMatchObject({ enrichedSystemPrompt: undefined });
  });
  it('keeps the ambient refusal active for a prepared pilot whatever the source of the context', async () => {
    const injected = { knowledgeInjected: true, finalKnowledgeContext: 'AMBIENT-PRIVATE-FIXTURE', knowledgeSystemPrompt: 'KP' };
    expect(refusal(await resolveMemoryContext(input({}, injected)))).toMatchObject({ status: 403, body: { error: 'PILOT_AMBIENT_CONTEXT_REFUSED' } });
    mocks.evaluateDurable.mockReturnValue({ requested: true, injected: true, records: [], promptBlock: 'DURABLE-BLOCK' });
    expect(refusal(await resolveMemoryContext(input()))).toMatchObject({ status: 403, body: { error: 'PILOT_AMBIENT_CONTEXT_REFUSED' } });
    mocks.evaluateDurable.mockReturnValue({ requested: false, injected: false, records: [] });
    mocks.evaluateAif.mockReturnValue({ status: 'allowed', promptBlock: 'AIF-BLOCK', receipt: { requested: true } });
    expect(refusal(await resolveMemoryContext(input()))).toMatchObject({ status: 403, body: { error: 'PILOT_AMBIENT_CONTEXT_REFUSED' } });
  });
  it('does not apply the pilot refusal to an ordinary request and builds its enriched prompt', async () => {
    const injected = { knowledgeInjected: true, finalKnowledgeContext: 'CTX', knowledgeSystemPrompt: 'KP' };
    const outcome = await resolveMemoryContext(input({ htmlPilotPrepared: false }, injected));
    expect(outcome.response).toBeUndefined();
    expect(outcome).toMatchObject({ enrichedSystemPrompt: 'KP' });
    mocks.evaluateDurable.mockReturnValue({ requested: true, injected: true, records: [], promptBlock: 'DB' });
    expect(await resolveMemoryContext(input({ htmlPilotPrepared: false }, injected))).toMatchObject({ enrichedSystemPrompt: 'KP|DURABLE:DB' });
  });
  it('returns the memory denial and the egress block before any prompt is built', async () => {
    mocks.evaluateAif.mockReturnValue({ status: 'denied', receipt: { requested: true } });
    mocks.aifDenied.mockReturnValue({ status: 409, body: { error: 'AIF_DENIED' } });
    expect(refusal(await resolveMemoryContext(input({ htmlPilotPrepared: false })))).toMatchObject({ status: 409 });
    expect(mocks.hasBlocked).not.toHaveBeenCalled();
    mocks.evaluateAif.mockReturnValue({ status: 'not_requested', receipt: { requested: false } });
    mocks.hasBlocked.mockResolvedValue(true);
    expect(refusal(await resolveMemoryContext(input({ htmlPilotPrepared: false })))).toMatchObject({ status: 400,
      body: { error: 'Governed context requires correction before provider execution.', model: 'blocked' } });
  });
});
