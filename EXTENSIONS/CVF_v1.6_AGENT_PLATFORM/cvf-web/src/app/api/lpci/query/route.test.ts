import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const fsMocks = vi.hoisted(() => ({ existsSync: vi.fn(), readFileSync: vi.fn() }));
const verifySessionCookieMock = vi.hoisted(() => vi.fn());
const executeLpciProviderBindingMock = vi.hoisted(() => vi.fn());
const appendLpciTerminalAuditMock = vi.hoisted(() => vi.fn());
const consumeQueryMock = vi.hoisted(() => vi.fn());
const consumeProviderAttemptMock = vi.hoisted(() => vi.fn());

vi.mock('node:fs', () => ({ ...fsMocks, default: fsMocks }));
vi.mock('@/lib/middleware-auth', () => ({ verifySessionCookie: verifySessionCookieMock }));
vi.mock('@/lib/lpci/provider-binding', () => ({
  executeLpciProviderBinding: executeLpciProviderBindingMock,
}));
vi.mock('@/lib/lpci/release-audit', () => ({
  appendLpciTerminalAudit: appendLpciTerminalAuditMock,
}));
vi.mock('@/lib/rate-limit', () => ({
  getRateLimiter: () => ({
    backendStatus: () => ({
      schemaVersion: 'cvf.rateLimitBackend.v1', configuredStore: 'redis',
      activeStore: 'redis', distributed: true, configurationStatus: 'ACTIVE_REDIS_REST',
      claimBoundary: 'test_static_capability',
    }),
    consumeQuery: consumeQueryMock,
    consumeProviderAttempt: consumeProviderAttemptMock,
  }),
}));
vi.mock('@/lib/control-plane-events', () => ({
  getControlPlaneEventStoreCapability: () => ({
    schemaVersion: 'cvf.eventListCapability.v1', adapterType: 'redis',
    implementationStatus: 'ACTIVE_DISTRIBUTED', distributed: true,
    atomicAppend: true, retentionSeconds: 2_592_000, livenessChecked: false,
    claimBoundary: 'test_static_capability',
  }),
}));

import { sha256Hex } from '@/lib/lpci/audit-receipt';
import { serializeExactJson } from '@/lib/lpci/query-conformance';
import {
  computeServiceRequestSignature,
  deriveServiceTokenIdentity,
} from '@/lib/service-token-auth';
import { digestReleaseIdentity } from '@/lib/lpci/release-policy';
import { POST } from './route';

const corpusId = 'TEST_CORPUS';
let indexValue: unknown;
let registered = true;

const baseRecord = (overrides: Record<string, unknown> = {}) => ({
  normalizedPath: 'public/leave.pdf', sourceHash: 'must-not-leak', documentType: 'policy',
  status: 'effective', answerClass: 'DIRECT_CITED_ANSWER', rawDisposition: 'ACCEPT',
  dispositionAlias: 'ACCEPT', sensitivityLevel: 'public', effectiveDate: '2026-01-02',
  authorityLevel: 'policy', titleSnippet: 'Leave policy', contentSnippet: 'leave policy public evidence',
  ...overrides,
});

function request(body: unknown) {
  const bodyText = typeof body === 'string' ? body : JSON.stringify(body);
  const timestamp = String(Date.now());
  return new NextRequest('http://localhost/api/lpci/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-cvf-service-token': 'fake-service-token',
      'x-cvf-service-timestamp': timestamp,
      'x-cvf-service-signature': computeServiceRequestSignature(
        'fake-service-token',
        timestamp,
        bodyText,
      ),
    },
    body: bodyText,
  });
}

async function post(body: unknown = { query: 'leave policy', corpusId, filters: {} }) {
  const response = await POST(request(body));
  return { response, data: await response.json() };
}

function expectAuditedCorrelation(
  data: Record<string, unknown>,
  evidenceOutcome?: string,
  matchedPaths?: string[],
) {
  const audit = data.auditReceipt as Record<string, unknown>;
  const proof = data.routeGovernanceProof as Record<string, unknown>;
  expect(data.auditId).toBe(audit.auditId);
  expect(data.corpusId).toBe(corpusId);
  expect(data.authorizationDecision).toBe('PUBLIC_ONLY');
  if (evidenceOutcome) expect(data.evidenceOutcome).toBe(evidenceOutcome);
  if (matchedPaths) expect(audit.matched_paths).toEqual(matchedPaths);
  expect(proof.authMode).toBe('service_token');
  expect(proof.actorId).toBe(deriveServiceTokenIdentity('fake-service-token'));
  expect(proof.decision).toBe('ALLOW');
  expect(proof.routeId).toBe('/api/lpci/query');
}

function expectExactKeys(data: Record<string, unknown>, keys: string[]) {
  expect(Object.keys(data).sort()).toEqual([...keys].sort());
}

describe('POST /api/lpci/query conformance', () => {
  beforeEach(() => {
    registered = true;
    indexValue = [baseRecord()];
    process.env.CVF_SERVICE_TOKEN = 'fake-service-token';
    process.env.LPCI_QUERY_SERVICE_ACTOR_ALLOWLIST = digestReleaseIdentity(
      'service',
      deriveServiceTokenIdentity('fake-service-token'),
    );
    process.env.LPCI_LLM_CONFIG_BUNDLE_VERSION = 'test-bundle-v1';
    process.env.LPCI_LLM_API_KEY = 'fake-lpci-test-secret';
    process.env.LPCI_LLM_MODEL = 'openai/gpt-4o';
    process.env.LPCI_LLM_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
    appendLpciTerminalAuditMock.mockReset();
    appendLpciTerminalAuditMock.mockResolvedValue({ id: 'durable-test-event' });
    consumeQueryMock.mockReset();
    consumeQueryMock.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    consumeProviderAttemptMock.mockReset();
    consumeProviderAttemptMock.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    executeLpciProviderBindingMock.mockReset();
    executeLpciProviderBindingMock.mockResolvedValue({ outcome: 'NO_PROVIDER_CONFIGURED' });
    verifySessionCookieMock.mockReset();
    verifySessionCookieMock.mockResolvedValue(null);
    fsMocks.existsSync.mockReset();
    fsMocks.existsSync.mockReturnValue(true);
    fsMocks.readFileSync.mockReset();
    fsMocks.readFileSync.mockImplementation((path: unknown) => {
      const text = String(path);
      if (text.includes('CVF_CORPUS_SCAN_REGISTRY.json')) {
        return JSON.stringify({ corpora: registered ? [{ id: corpusId }] : [] });
      }
      return typeof indexValue === 'string' ? indexValue : JSON.stringify(indexValue);
    });
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    delete process.env.LPCI_LLM_API_KEY;
    delete process.env.LPCI_LLM_MODEL;
    delete process.env.LPCI_LLM_ENDPOINT;
    delete process.env.LPCI_LLM_CONFIG_BUNDLE_VERSION;
    delete process.env.LPCI_QUERY_SERVICE_ACTOR_ALLOWLIST;
    delete process.env.CVF_SERVICE_TOKEN;
    vi.unstubAllGlobals();
  });

  it('returns minimized CORPUS_NOT_REGISTERED with sanitized filters and zero fetches', async () => {
    registered = false;
    const { response, data } = await post({
      query: 'leave policy', corpusId, filters: { sensitivityClearance: true, jurisdiction: ' Vietnam ' },
    });
    expect(response.status).toBe(403);
    expect(Object.keys(data).sort()).toEqual([
      'auditId', 'auditReceipt', 'authorizationDecision', 'corpusId', 'evidenceOutcome',
      'message', 'outcome', 'query', 'routeGovernanceProof',
    ].sort());
    expect(data.outcome).toBe('CORPUS_NOT_REGISTERED');
    expect(data.auditReceipt.applied_filters).toEqual({ jurisdiction: 'Vietnam', sensitivityClearance: false });
    expect(data.auditReceipt.matched_paths).toEqual([]);
    expectAuditedCorrelation(data);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(['not-json', '{}', '[1]'])('maps malformed registered index to grounding unavailable: %s', async (value) => {
    indexValue = value;
    const { data } = await post();
    expect(data.outcome).toBe('GROUNDING_EVIDENCE_UNAVAILABLE');
    expect(data.message).toBe('Grounding evidence is unavailable for this query.');
    expect(data.auditReceipt.matched_paths).toEqual([]);
    expect(data.auditReceipt.sensitivity_pre_filter_applied).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('maps missing index and invalid sensitivity to pre-filter grounding failures', async () => {
    fsMocks.existsSync.mockReturnValue(false);
    expect((await post()).data.outcome).toBe('GROUNDING_EVIDENCE_UNAVAILABLE');
    fsMocks.existsSync.mockReturnValue(true);
    indexValue = [{ sensitivityLevel: 'Public', normalizedPath: 'secret' }];
    const { data } = await post();
    expect(data.auditReceipt.sensitivity_pre_filter_applied).toBe(false);
    expect(data.auditReceipt.matched_paths).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('filters non-public rows before malformed nonsensitivity fields can influence output', async () => {
    indexValue = [
      baseRecord(),
      { sensitivityLevel: 'classified', normalizedPath: '../secret', contentSnippet: 'secret', status: null },
    ];
    const { data } = await post();
    expect(data.outcome).toBe('NO_PROVIDER_CONFIGURED');
    expect(data.auditReceipt.matched_paths).toEqual(['public/leave.pdf']);
    expect(JSON.stringify(data)).not.toContain('secret');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns top-level Phase 1 receipts with compatibility and exact hash bytes', async () => {
    indexValue = [baseRecord({ contentSnippet: 'other topic', titleSnippet: 'other topic' })];
    const { data } = await post();
    expect(data.outcome).toBe('PHASE1_NEGATIVE');
    expect(data.receiptType).toBe('NO_RESULTS');
    expect(data.auditReceipt.phase1_receipt_type).toBe(data.receiptType);
    expect(data.auditReceipt.matched_paths).toEqual([]);
    expect(data.phase1Receipt).toBeUndefined();
    const expected = serializeExactJson({
      outcome: 'PHASE1_NEGATIVE', receiptType: 'NO_RESULTS', query: 'leave policy', corpusId,
      authorizationDecision: 'PUBLIC_ONLY', evidenceOutcome: 'NO_MATCHES',
    });
    expect(data.auditReceipt.model_response_hash).toBe(sha256Hex(expected));
    expect(fetch).not.toHaveBeenCalled();
  });

  it('preserves all three canonical Phase 1 variants at top level', async () => {
    const cases = [
      {
        records: [baseRecord({ contentSnippet: 'other topic', titleSnippet: 'other topic' })],
        receiptType: 'NO_RESULTS', evidenceOutcome: 'NO_MATCHES', reason: undefined,
      },
      {
        records: [baseRecord({ sensitivityLevel: 'classified' })],
        receiptType: 'FILTERED_OUT', evidenceOutcome: 'FILTERED_PUBLIC_ONLY',
        reason: 'all records excluded by sensitivity filter',
      },
      {
        records: [baseRecord({ answerClass: 'ESCALATE_OR_ABSTAIN' })],
        receiptType: 'ESCALATED', evidenceOutcome: 'ABSTAINED',
        reason: 'all matched records require escalation or abstention',
      },
    ] as const;

    for (const testCase of cases) {
      indexValue = testCase.records;
      const { data } = await post();
      expect(data).toMatchObject({
        outcome: 'PHASE1_NEGATIVE', receiptType: testCase.receiptType,
        query: 'leave policy', evidenceOutcome: testCase.evidenceOutcome,
      });
      expect(data.reason).toBe(testCase.reason);
      expect(data.phase1Receipt).toBeUndefined();
      expect(data.auditReceipt.phase1_receipt_type).toBe(testCase.receiptType);
      expectExactKeys(data, [
        'outcome', 'receiptType', 'query',
        ...(testCase.reason === undefined ? [] : ['reason']),
        'corpusId', 'auditId', 'authorizationDecision', 'evidenceOutcome',
        'auditReceipt', 'routeGovernanceProof',
      ]);
      expectAuditedCorrelation(data, testCase.evidenceOutcome, []);
    }
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns FILTERED_OUT for all denied records regardless of client clearance', async () => {
    indexValue = [baseRecord({ sensitivityLevel: 'classified' })];
    const { data } = await post({ query: 'leave policy', corpusId, filters: { sensitivityClearance: true } });
    expect(data).toMatchObject({ outcome: 'PHASE1_NEGATIVE', receiptType: 'FILTERED_OUT' });
    expect(data.auditReceipt.applied_filters.sensitivityClearance).toBe(false);
    expect(data.auditReceipt.matched_paths).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('fails malformed admitted-public records before search with empty audit paths', async () => {
    indexValue = [baseRecord({ normalizedPath: '../bad' })];
    const { data } = await post();
    expect(data.outcome).toBe('GROUNDING_EVIDENCE_UNAVAILABLE');
    expect(data.auditReceipt.sensitivity_pre_filter_applied).toBe(true);
    expect(data.auditReceipt.matched_paths).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    ['status', 'invalid'],
    ['answerClass', 'INVALID'],
    ['effectiveDate', '2026-02-30'],
    ['normalizedPath', '../bad'],
    ['contentSnippet', 7],
    ['authorityLevel', []],
  ])('fails admitted-public invalid %s before matching', async (field, value) => {
    indexValue = [baseRecord({ [field]: value })];
    const { data } = await post();
    expect(data.outcome).toBe('GROUNDING_EVIDENCE_UNAVAILABLE');
    expectAuditedCorrelation(data, 'UNAVAILABLE', []);
    expect(data.auditReceipt.sensitivity_pre_filter_applied).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('abstains on mixed direct and escalate matches with zero fetches', async () => {
    indexValue = [
      baseRecord(),
      baseRecord({ normalizedPath: 'public/escalate.pdf', answerClass: 'ESCALATE_OR_ABSTAIN' }),
    ];
    const { data } = await post();
    expect(data.outcome).toBe('ABSTAINED');
    expect(data.auditReceipt.matched_paths).toEqual(['public/leave.pdf', 'public/escalate.pdf']);
    expect(data.auditReceipt.response_boundary_class).toBe('ABSTAINED');
    expectAuditedCorrelation(data);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('SP-10 keeps non-provider S1 outcomes outside the binding', async () => {
    registered = false;
    expect((await post()).data.outcome).toBe('CORPUS_NOT_REGISTERED');
    expect(executeLpciProviderBindingMock).not.toHaveBeenCalled();

    registered = true;
    indexValue = '{}';
    expect((await post()).data.outcome).toBe('GROUNDING_EVIDENCE_UNAVAILABLE');
    expect(executeLpciProviderBindingMock).not.toHaveBeenCalled();

    indexValue = [baseRecord({ contentSnippet: 'other topic', titleSnippet: 'other topic' })];
    expect((await post()).data.outcome).toBe('PHASE1_NEGATIVE');
    expect(executeLpciProviderBindingMock).not.toHaveBeenCalled();

    indexValue = [
      baseRecord(),
      baseRecord({ normalizedPath: 'public/escalate.pdf', answerClass: 'ESCALATE_OR_ABSTAIN' }),
    ];
    expect((await post()).data.outcome).toBe('ABSTAINED');
    expect(executeLpciProviderBindingMock).not.toHaveBeenCalled();
    expect(consumeProviderAttemptMock).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('DS-07 denies exhausted query quota before corpus and provider work', async () => {
    consumeQueryMock.mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 12 });
    const { response, data } = await post();
    expect(response.status).toBe(429);
    expect(data.outcome).toBe('RATE_LIMITED');
    expect(data.retryAfterSeconds).toBe(12);
    expect(fsMocks.readFileSync).not.toHaveBeenCalled();
    expect(consumeProviderAttemptMock).not.toHaveBeenCalled();
    expect(executeLpciProviderBindingMock).not.toHaveBeenCalled();
    expect(appendLpciTerminalAuditMock).toHaveBeenCalledTimes(1);
  });

  it('DS-08 denies exhausted provider quota without entering the binding', async () => {
    consumeProviderAttemptMock.mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 61 });
    const { response, data } = await post();
    expect(response.status).toBe(429);
    expect(data.outcome).toBe('RATE_LIMITED');
    expect(executeLpciProviderBindingMock).not.toHaveBeenCalled();
    expect(appendLpciTerminalAuditMock).toHaveBeenCalledTimes(1);
  });

  it('DS-02 denies an unregistered service actor before parse and quota', async () => {
    process.env.LPCI_QUERY_SERVICE_ACTOR_ALLOWLIST = '';
    const { response, data } = await post();
    expect(response.status).toBe(403);
    expect(data.outcome).toBe('SERVICE_IDENTITY_NOT_ALLOWED');
    expect(consumeQueryMock).not.toHaveBeenCalled();
    expect(fsMocks.readFileSync).not.toHaveBeenCalled();
    expect(executeLpciProviderBindingMock).not.toHaveBeenCalled();
    expect(appendLpciTerminalAuditMock).toHaveBeenCalledTimes(1);
  });

  it('DS-02 denies an unsigned service actor even in deterministic test mode', async () => {
    const bodyText = JSON.stringify({ query: 'leave policy', corpusId, filters: {} });
    const response = await POST(new NextRequest('http://localhost/api/lpci/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cvf-service-token': 'fake-service-token',
      },
      body: bodyText,
    }));
    // The route runs authorizeRouteGovernanceProof before the release-policy
    // role check, so an unsigned service token is rejected as unauthorized (401)
    // and never reaches the SERVICE_IDENTITY_NOT_ALLOWED (403) branch. The
    // security invariant under test is unchanged: the actor is denied and no
    // quota, retrieval or provider work happens.
    expect(response.status).toBe(401);
    expect((await response.json()).outcome).toBe('AUTHORIZATION_DENIED');
    expect(consumeQueryMock).not.toHaveBeenCalled();
    expect(executeLpciProviderBindingMock).not.toHaveBeenCalled();
  });

  it('returns minimized no-provider response and audit-path count source', async () => {
    const { data } = await post();
    expect(data.outcome).toBe('NO_PROVIDER_CONFIGURED');
    expect(data.message).toBe('No answer provider is configured.');
    expect(data.retrievalReceipt).toBeUndefined();
    expect(data.matchedSources).toBeUndefined();
    expect(data.auditReceipt.matched_paths).toEqual(['public/leave.pdf']);
    expect(data.auditReceipt.sensitivity_pre_filter_applied).toBe(true);
    expectAuditedCorrelation(data);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('sends one allowlisted JSON evidence object to the binding and emits correlated answer', async () => {
    executeLpciProviderBindingMock.mockResolvedValueOnce({
      outcome: 'ANSWER_EMITTED',
      response: 'Based on retrieved documents only. Answer.',
    });
    const { data } = await post();
    expect(executeLpciProviderBindingMock).toHaveBeenCalledTimes(1);
    const bindingInput = executeLpciProviderBindingMock.mock.calls[0][0];
    const prompt = bindingInput.systemPrompt as string;
    expect(prompt.match(/"schemaVersion"/g)).toHaveLength(1);
    expect(prompt).toContain('leave policy public evidence');
    expect(prompt).not.toContain('must-not-leak');
    expect(bindingInput.prompt).toBe('leave policy');
    expect(data.outcome).toBe('ANSWER_EMITTED');
    expect(data.matchedSources).toEqual(data.auditReceipt.matched_paths);
    expect(data.auditReceipt.model_response_hash).toBe(sha256Hex(data.response));
    expectAuditedCorrelation(data);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('sends four valid boundary records in exactly one mocked provider call', async () => {
    indexValue = Array.from({ length: 4 }, (_, index) => baseRecord({
      normalizedPath: `public/${index}.pdf`,
      contentSnippet: `${'x'.repeat(499)} leave policy`,
    }));
    executeLpciProviderBindingMock.mockResolvedValueOnce({
      outcome: 'ANSWER_EMITTED',
      response: 'Based on retrieved documents only. Four records.',
    });

    const { data } = await post();

    expect(data.outcome).toBe('ANSWER_EMITTED');
    expect(data.auditReceipt.matched_paths).toHaveLength(4);
    expect(executeLpciProviderBindingMock).toHaveBeenCalledTimes(1);
    const prompt = executeLpciProviderBindingMock.mock.calls[0][0].systemPrompt as string;
    expect((prompt.match(/"normalizedPath"/g) ?? [])).toHaveLength(4);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns fixed safe provider error after exactly one binding call', async () => {
    executeLpciProviderBindingMock.mockResolvedValueOnce({ outcome: 'PROVIDER_ERROR' });
    const { response, data } = await post();
    expect(executeLpciProviderBindingMock).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();
    expect(response.status).toBe(502);
    expect(data.outcome).toBe('PROVIDER_ERROR');
    expect(data.message).toBe('The answer provider is temporarily unavailable.');
    expect(JSON.stringify(data)).not.toContain('sensitive provider body');
    expect(data.error).toBeUndefined();
    const expected = serializeExactJson({
      outcome: 'PROVIDER_ERROR', query: 'leave policy', corpusId,
      authorizationDecision: 'PUBLIC_ONLY', evidenceOutcome: 'PROVIDER_FAILED',
      message: 'The answer provider is temporarily unavailable.',
    });
    expect(data.auditReceipt.model_response_hash).toBe(sha256Hex(expected));
    expectAuditedCorrelation(data, 'PROVIDER_FAILED', ['public/leave.pdf']);
  });

  it('DS-12 maps one provider timeout to a safe 504 without retry', async () => {
    executeLpciProviderBindingMock.mockResolvedValueOnce({
      outcome: 'PROVIDER_TIMEOUT', diagnosticCode: 'PROVIDER_TIMEOUT',
    });
    const { response, data } = await post();
    expect(response.status).toBe(504);
    expect(data.outcome).toBe('PROVIDER_TIMEOUT');
    expect(data.message).toBe('The answer provider is temporarily unavailable.');
    expect(executeLpciProviderBindingMock).toHaveBeenCalledTimes(1);
    expect(appendLpciTerminalAuditMock).toHaveBeenCalledTimes(1);
    expect(appendLpciTerminalAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        providerAttemptCount: 1, timeoutFlag: true, diagnosticCode: 'PROVIDER_TIMEOUT',
      }),
    );
  });

  it('DS-11 withholds a pending answer when durable append rejects', async () => {
    executeLpciProviderBindingMock.mockResolvedValueOnce({
      outcome: 'ANSWER_EMITTED', response: 'Based on retrieved documents only. Pending answer.',
    });
    appendLpciTerminalAuditMock.mockRejectedValueOnce(new Error('test append failure'));
    const { response, data } = await post();
    expect(response.status).toBe(503);
    expect(data).toEqual({
      outcome: 'AUDIT_UNAVAILABLE',
      message: 'The LPCI audit service is temporarily unavailable.',
    });
    expect(JSON.stringify(data)).not.toContain('Pending answer');
    expect(executeLpciProviderBindingMock).toHaveBeenCalledTimes(1);
    expect(appendLpciTerminalAuditMock).toHaveBeenCalledTimes(1);
  });

  it('enforces exact response allowlists and correlation for every audited variant', async () => {
    const common = [
      'outcome', 'query', 'corpusId', 'auditId', 'authorizationDecision',
      'evidenceOutcome', 'auditReceipt', 'routeGovernanceProof',
    ];

    registered = false;
    let result = (await post()).data;
    expectExactKeys(result, [...common, 'message']);
    expectAuditedCorrelation(result, 'NOT_EVALUATED', []);

    registered = true;
    indexValue = 'not-json';
    result = (await post()).data;
    expectExactKeys(result, [...common, 'message']);
    expectAuditedCorrelation(result, 'UNAVAILABLE', []);

    indexValue = [baseRecord({ contentSnippet: 'other topic', titleSnippet: 'other topic' })];
    result = (await post()).data;
    expectExactKeys(result, [...common, 'receiptType']);
    expectAuditedCorrelation(result, 'NO_MATCHES', []);

    indexValue = [baseRecord(), baseRecord({
      normalizedPath: 'public/escalate.pdf', answerClass: 'ESCALATE_OR_ABSTAIN',
    })];
    result = (await post()).data;
    expectExactKeys(result, [...common, 'response', 'answerClass']);
    expectAuditedCorrelation(result, 'ABSTAINED', ['public/leave.pdf', 'public/escalate.pdf']);

    indexValue = [baseRecord()];
    result = (await post()).data;
    expectExactKeys(result, [...common, 'message']);
    expectAuditedCorrelation(result, 'ELIGIBLE_NOT_SENT', ['public/leave.pdf']);

    executeLpciProviderBindingMock.mockResolvedValueOnce({ outcome: 'PROVIDER_ERROR' });
    result = (await post()).data;
    expectExactKeys(result, [...common, 'message']);
    expectAuditedCorrelation(result, 'PROVIDER_FAILED', ['public/leave.pdf']);

    executeLpciProviderBindingMock.mockResolvedValueOnce({
      outcome: 'ANSWER_EMITTED', response: 'Based on retrieved documents only. Answer.',
    });
    result = (await post()).data;
    expectExactKeys(result, [
      ...common, 'response', 'answerClass', 'matchedSources', 'freshnessFlag', 'conflictFlag',
    ]);
    expectAuditedCorrelation(result, 'ANSWER_EMITTED', ['public/leave.pdf']);
    expect(result.matchedSources).toEqual((result.auditReceipt as { matched_paths: string[] }).matched_paths);
    expect(executeLpciProviderBindingMock).toHaveBeenCalledTimes(3);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('fails record and aggregate evidence limits with zero fetches', async () => {
    indexValue = Array.from({ length: 5 }, (_, index) => baseRecord({ normalizedPath: `public/${index}.pdf` }));
    let data = (await post()).data;
    expect(data.outcome).toBe('GROUNDING_EVIDENCE_UNAVAILABLE');
    expectAuditedCorrelation(data, 'UNAVAILABLE', [
      'public/0.pdf', 'public/1.pdf', 'public/2.pdf', 'public/3.pdf', 'public/4.pdf',
    ]);
    expect(fetch).not.toHaveBeenCalled();
    indexValue = [baseRecord({ contentSnippet: 'x'.repeat(513), titleSnippet: 'leave policy' })];
    data = (await post()).data;
    expect(data.outcome).toBe('GROUNDING_EVIDENCE_UNAVAILABLE');
    expectAuditedCorrelation(data, 'UNAVAILABLE', []);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects unpaired request strings before corpus work', async () => {
    const { response, data } = await post({ query: `leave\ud800`, corpusId });
    expect(response.status).toBe(400);
    expect(data.outcome).toBe('INVALID_REQUEST');
    expect(data.auditReceipt).toBeUndefined();
    expect(fsMocks.readFileSync).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
});
