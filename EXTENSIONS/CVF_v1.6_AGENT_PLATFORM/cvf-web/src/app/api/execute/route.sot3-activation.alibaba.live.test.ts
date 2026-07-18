/**
 * SOT3-ACT-A3 - Real Provider Approved Context Live Proof
 *
 * Calls the real Alibaba DashScope API (qwen-turbo) through the actual
 * `/api/execute` route to prove that SOT3 Flow-approved knowledge context in
 * `CVF_SOT3_KNOWLEDGE_ACTIVATION_MODE=ENFORCE` reaches the downstream
 * provider system prompt. Correlates the live result with the durable A2
 * evidence record read back from an isolated temporary store.
 *
 * Isolation: one temporary control-plane events path and one temporary SOT3
 * activation-evidence path, both unique to this test run. `globalThis.fetch`
 * is wrapped as a pass-through observer: every call is forwarded to the
 * original fetch implementation unchanged, and only the DashScope call is
 * counted/inspected in memory (never persisted as raw body/prompt/key).
 * Authentication, quota, and output validation are mocked only to isolate
 * A3 and force a terminal accepted output so the route cannot auto-retry
 * the provider. `resolveKnowledgeContext`, the three SOT3 packages, the A2
 * store, `executeAI`, and the real DashScope network response are never
 * mocked.
 *
 * Skipped unless the governed Python runner supplies a valid, one-use permit.
 * Run with: python scripts/run_cvf_sot3_a3_live_proof.py
 *
 * Authorization: docs/work_orders/CVF_AGENT_WORK_ORDER_SOT3_ACT_A3_REAL_PROVIDER_APPROVED_CONTEXT_PROOF_2026-07-13.md
 */

import { createHash } from 'node:crypto';
import { readFileSync, unlinkSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { readAuditEvents } from '@/lib/control-plane-events';
import { resolveAlibabaApiKey, resolveAlibabaApiKeySourceName } from '@/lib/alibaba-env';
import { knowledgeStore } from '@/lib/knowledge-store';
import type { Sot3KnowledgeSourceMetadata } from '@/lib/knowledge-store';
import { Sot3ActivationEvidenceStore } from '@/lib/sot3-activation-evidence-store';

const evaluateEnforcementMock = vi.hoisted(() => vi.fn());
const verifySessionCookieMock = vi.hoisted(() => vi.fn());
const checkTeamQuotaMock = vi.hoisted(() => vi.fn());
const validateOutputMock = vi.hoisted(() => vi.fn());
const shouldRetryMock = vi.hoisted(() => vi.fn());

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

// Requirement 5: force output validation to a terminal accepted shape so the
// route cannot auto-retry the real provider call after one live response.
vi.mock('@/lib/output-validator', () => ({
  validateOutput: validateOutputMock,
  shouldRetry: shouldRetryMock,
}));

import { POST } from './route';

const DASHSCOPE_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions';

function sha256Hex(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

interface RunnerPermitResult {
  authorized: boolean;
  reason: string;
}

function consumeRunnerPermit(): RunnerPermitResult {
  const permitPath = process.env.CVF_SOT3_A3_RUN_PERMIT_PATH;
  const permitToken = process.env.CVF_SOT3_A3_RUN_PERMIT_TOKEN;
  const observationPath = process.env.CVF_SOT3_A3_OBSERVATION_OUTPUT_PATH;
  if (!permitPath || !permitToken || !observationPath) {
    return { authorized: false, reason: 'runner permit variables absent' };
  }

  try {
    const permit = JSON.parse(readFileSync(permitPath, 'utf8')) as {
      schemaVersion?: string;
      batchId?: string;
      tokenHash?: string;
      observationPathHash?: string;
      expiresAtEpochMs?: number;
    };
    const valid = permit.schemaVersion === 'cvf.sot3ActA3RunnerPermit.v1'
      && permit.batchId === 'SOT3-ACT-A3R'
      && permit.tokenHash === sha256Hex(permitToken)
      && permit.observationPathHash === sha256Hex(observationPath)
      && typeof permit.expiresAtEpochMs === 'number'
      && permit.expiresAtEpochMs >= Date.now();
    if (!valid) {
      return { authorized: false, reason: 'runner permit invalid or expired' };
    }
    unlinkSync(permitPath);
    return { authorized: true, reason: 'one-use runner permit consumed' };
  } catch {
    return { authorized: false, reason: 'runner permit unreadable' };
  }
}

const RUNNER_PERMIT = consumeRunnerPermit();
const ALIBABA_API_KEY = RUNNER_PERMIT.authorized ? resolveAlibabaApiKey() : null;
const ALIBABA_KEY_ALIAS = RUNNER_PERMIT.authorized ? resolveAlibabaApiKeySourceName() : null;

describe.skipIf(RUNNER_PERMIT.authorized)('SOT3-ACT-A3 runner permit guard', () => {
  it('blocks direct or ad-hoc invocation before provider-key resolution', () => {
    expect(RUNNER_PERMIT.authorized).toBe(false);
    expect(ALIBABA_API_KEY).toBeNull();
  });
});

function computeExpectedContentHash(records: Array<Record<string, unknown>>): string {
  const sorted = records.map((record) => {
    const keys = Object.keys(record).sort();
    return keys.map((key) => [key, record[key]]);
  });
  return `sha256:${sha256Hex(JSON.stringify(sorted))}`;
}

function buildProvenance(sourceId: string, content: string): Sot3KnowledgeSourceMetadata {
  const rawRecord = { source_id: sourceId, id: sourceId, content };
  return {
    sourceId,
    sourceType: 'INTERNAL',
    owner: 'team-eng',
    capturedAtUtc: '2026-07-13T00:00:00.000Z',
    purpose: ['sot3-act-a3-live-proof'],
    confidentiality: 'INTERNAL',
    expectedContentHash: computeExpectedContentHash([rawRecord]),
    rawReference: { type: 'object', location: `knowledge-store://${sourceId}` },
    captureStatus: 'CAPTURED',
    declaredVersion: null,
    validFromUtc: null,
    validUntilUtc: null,
  };
}

/**
 * Interface for the outbound-observation record written to the receipt.
 * Every field is a hash, boolean, length, ID, or timing value  -  never raw
 * prompt/body/key content.
 */
export interface Sot3A3LiveObservation {
  overall: 'PASS' | 'BLOCKED';
  provider: string;
  model: string;
  keyAliasUsed: string | null;
  httpStatus: number | null;
  success: boolean;
  latencyMs: number | null;
  observedCallCount: number;
  providerRequestObserved: boolean;
  approvedContextHash: string | null;
  providerSystemPromptHash: string | null;
  approvedContextIncluded: boolean;
  approvedContextLength: number | null;
  providerSystemPromptLength: number | null;
  governanceReceiptId: string | null;
  envelopeId: string | null;
  sot3RecordId: string | null;
  sot3IntegrityHash: string | null;
  sot3RequestId: string | null;
  traceCount: number | null;
  packetIds: string[];
  kernelDecisionIds: string[];
  truthReceiptIds: string[];
  truthReferenceIds: string[];
  flowPackageIds: string[];
  outputLength: number | null;
  rawKeyPersisted: false;
  rawProviderBodyPersisted: false;
  rawOutputPersisted: false;
  fullPromptPersisted: false;
  diagnostic: {
    stage: string;
    class: string;
    retryable: boolean;
    userAction: string;
    safeMessage: string;
    provider?: string;
    model?: string;
    httpStatus?: number;
    latencyMs?: number;
  } | null;
}

/**
 * Global observation slot the Python runner reads via a written JSON side
 * file after the vitest process exits. Kept as a module-level mutable
 * object so a single `it()` can populate it and the runner script can pick
 * it up from disk (vitest workers do not share memory with the parent
 * Python process).
 */
declare global {
  // eslint-disable-next-line no-var
  var __CVF_SOT3_A3_OBSERVATION__: Sot3A3LiveObservation | undefined;
}

describe.skipIf(!RUNNER_PERMIT.authorized || !ALIBABA_API_KEY)(
  '/api/execute SOT3-ACT-A3 real-provider approved-context live proof  -  Alibaba qwen-turbo',
  () => {
    const originalEnv = { ...process.env };
    const originalFetch = globalThis.fetch;
    let tempDir = '';
    let controlPlaneEventsPath = '';
    let sot3EvidencePath = '';
    let observedDashScopeCallCount = 0;
    let observedRequestBodySystemPrompt: string | undefined;
    let observedHttpStatus: number | null = null;
    let observedLatencyMs: number | null = null;

    const SOURCE_ID = 'sot3-act-a3-live-source';
    const APPROVED_CONTENT = 'SOT3-ACT-A3 approved controlled knowledge chunk for live proof.';

    beforeEach(async () => {
      tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-sot3-a3-live-'));
      controlPlaneEventsPath = path.join(tempDir, 'control-plane-events.json');
      sot3EvidencePath = path.join(tempDir, 'sot3-activation-evidence.json');

      process.env = { ...originalEnv };
      process.env.CVF_CONTROL_PLANE_EVENTS_PATH = controlPlaneEventsPath;
      process.env.CVF_SOT3_ACTIVATION_EVIDENCE_PATH = sot3EvidencePath;
      process.env.CVF_SOT3_KNOWLEDGE_ACTIVATION_MODE = 'ENFORCE';
      process.env.ALIBABA_API_KEY = ALIBABA_API_KEY ?? '';

      observedDashScopeCallCount = 0;
      observedRequestBodySystemPrompt = undefined;
      observedHttpStatus = null;
      observedLatencyMs = null;

      // Requirement 3: seed exactly one in-scope collection containing one
      // safe controlled chunk with valid SOT3 provenance.
      (knowledgeStore as unknown as { _store: Map<string, unknown> })._store.clear();
      (knowledgeStore as unknown as { _ephemeral: Map<string, unknown> })._ephemeral.clear();
      knowledgeStore.seed([
        {
          id: 'sot3-act-a3-collection',
          name: 'SOT3 A3 Live Proof Collection',
          description: 'controlled single-chunk collection for A3 live proof',
          orgId: 'org_cvf',
          teamId: 'team_exec',
          chunks: [
            {
              id: SOURCE_ID,
              content: APPROVED_CONTENT,
              keywords: ['governance', 'sot3', 'proof'],
              sot3Source: buildProvenance(SOURCE_ID, APPROVED_CONTENT),
            },
          ],
        },
      ]);

      evaluateEnforcementMock.mockReset();
      verifySessionCookieMock.mockReset();
      checkTeamQuotaMock.mockReset();
      validateOutputMock.mockReset();
      shouldRetryMock.mockReset();

      evaluateEnforcementMock.mockReturnValue({ status: 'ALLOW', reasons: [] });
      checkTeamQuotaMock.mockResolvedValue({
        exceeded: false,
        currentUSD: 0,
        softCapUSD: 50,
        hardCapUSD: 100,
        overrideActive: false,
      });
      verifySessionCookieMock.mockResolvedValue({
        userId: 'usr_sot3_a3_live',
        user: 'SOT3 A3 Live Tester',
        role: 'admin',
        orgId: 'org_cvf',
        teamId: 'team_exec',
        expiresAt: Date.now() + 3_600_000,
        authMode: 'session',
      });
      // Requirement 5: terminal accepted output validation shape  -  PASS with
      // no issues means the route never enters its RETRY loop.
      validateOutputMock.mockReturnValue({
        decision: 'PASS',
        issues: [],
        reasons: [],
        qualityHint: 'good',
        retryable: false,
      });
      shouldRetryMock.mockReturnValue({ retry: false });

      // Requirement 6: pass-through fetch observer. Every request is
      // forwarded unchanged to the original fetch implementation; only the
      // DashScope call is counted and its outbound system message is
      // inspected in memory. No raw body, prompt, or authorization header
      // value is ever stored on a variable that outlives this call.
      globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
        const isDashScopeCall = url === DASHSCOPE_URL;
        if (isDashScopeCall) {
          observedDashScopeCallCount += 1;
          const callLedgerPath = process.env.CVF_SOT3_A3_CALL_LEDGER_PATH;
          if (callLedgerPath) {
            await writeFile(callLedgerPath, JSON.stringify({
              schemaVersion: 'cvf.sot3ActA3CallLedger.v1',
              batchId: 'SOT3-ACT-A3R',
              observedCallCount: observedDashScopeCallCount,
              provider: 'alibaba',
              model: 'qwen-turbo',
            }), 'utf8');
          }
          try {
            const parsedBody = init?.body ? JSON.parse(String(init.body)) as { messages?: Array<{ role: string; content: string }> } : undefined;
            const systemMessage = parsedBody?.messages?.find((message) => message.role === 'system');
            observedRequestBodySystemPrompt = systemMessage?.content;
          } catch {
            observedRequestBodySystemPrompt = undefined;
          }
        }
        const callStart = Date.now();
        const response = await originalFetch(input, init);
        if (isDashScopeCall) {
          observedHttpStatus = response.status;
          observedLatencyMs = Date.now() - callStart;
        }
        return response;
      }) as typeof fetch;
    });

    afterEach(async () => {
      globalThis.fetch = originalFetch;
      process.env = { ...originalEnv };
      if (tempDir) {
        await rm(tempDir, { recursive: true, force: true });
      }
    });

    it(
      'ENFORCE mode injects only Flow-approved context into exactly one real Alibaba qwen-turbo call',
      async () => {
        // Requirement 7: call the real POST route once with provider
        // alibaba and model qwen-turbo.
        const response = await POST(
          new Request('http://localhost/api/execute', {
            method: 'POST',
            body: JSON.stringify({
              templateName: 'Data Quality Review',
              intent: 'Summarize the governance proof knowledge chunk',
              inputs: {
                topic: 'sot3 act a3 live proof controlled scenario',
              },
              provider: 'alibaba',
              model: 'qwen-turbo',
              knowledgeCollectionId: 'sot3-act-a3-collection',
            }),
          }) as never,
        );

        const body = await response.json() as Record<string, unknown>;

        // Requirement 8: assert success, provider/model, one governance
        // receipt, knowledge injection, and exactly one provider call.
        expect(body.success).toBe(true);
        expect(body.provider).toBe('alibaba');
        expect(body.model).toBe('qwen-turbo');
        expect(body.governanceEvidenceReceipt).toBeTruthy();
        const knowledgeInjection = body.knowledgeInjection as { injected?: boolean } | undefined;
        expect(knowledgeInjection?.injected).toBe(true);
        expect(observedDashScopeCallCount).toBe(1);

        const governanceReceipt = body.governanceEvidenceReceipt as { receiptId?: string; envelopeId?: string } | undefined;

        // Requirement 9: read the A2 record and audit events from fresh
        // readers; prove one full acknowledged trace and collect owner
        // identifiers.
        const freshEvidenceStore = new Sot3ActivationEvidenceStore(sot3EvidencePath);
        const persistedRecords = freshEvidenceStore.list();
        expect(persistedRecords).toHaveLength(1);
        const sot3Record = persistedRecords[0];
        expect(sot3Record.terminalOutcome).toBe('APPROVED');
        expect(sot3Record.traces).toHaveLength(1);
        const trace = sot3Record.traces[0];
        expect(trace.terminalOutcome).toBe('APPROVED');
        expect(trace.flowPackage?.acknowledgement_state).toBeTruthy();

        const auditEvents = await readAuditEvents();
        const activationEvaluatedEvent = auditEvents.find((event) => event.eventType === 'SOT3_KNOWLEDGE_ACTIVATION_EVALUATED');
        const evidencePersistedEvent = auditEvents.find((event) => event.eventType === 'SOT3_ACTIVATION_EVIDENCE_PERSISTED');
        expect(activationEvaluatedEvent).toBeTruthy();
        expect(evidencePersistedEvent).toBeTruthy();
        expect((evidencePersistedEvent?.payload as { diagnosticClass?: string } | undefined)?.diagnosticClass).toBe('PERSISTED');

        // Requirement 10: verify the observed provider system prompt
        // contains the approved context via hash comparison, never raw
        // content, then write only hashes/booleans/lengths/IDs/timing to
        // the explicit receipt path (handled by the Python runner reading
        // this global observation object).
        const approvedContextHash = sha256Hex(APPROVED_CONTENT);
        const providerSystemPromptHash = observedRequestBodySystemPrompt ? sha256Hex(observedRequestBodySystemPrompt) : null;
        const approvedContextIncluded = Boolean(
          observedRequestBodySystemPrompt && observedRequestBodySystemPrompt.includes(APPROVED_CONTENT),
        );
        expect(approvedContextIncluded).toBe(true);

        globalThis.__CVF_SOT3_A3_OBSERVATION__ = {
          overall: 'PASS',
          provider: 'alibaba',
          model: 'qwen-turbo',
          keyAliasUsed: ALIBABA_KEY_ALIAS,
          httpStatus: observedHttpStatus,
          success: true,
          latencyMs: observedLatencyMs,
          observedCallCount: observedDashScopeCallCount,
          providerRequestObserved: observedRequestBodySystemPrompt !== undefined,
          approvedContextHash,
          providerSystemPromptHash,
          approvedContextIncluded,
          approvedContextLength: APPROVED_CONTENT.length,
          providerSystemPromptLength: observedRequestBodySystemPrompt?.length ?? null,
          governanceReceiptId: governanceReceipt?.receiptId ?? null,
          envelopeId: governanceReceipt?.envelopeId ?? null,
          sot3RecordId: sot3Record.recordId,
          sot3IntegrityHash: sot3Record.integrityHash,
          sot3RequestId: sot3Record.requestId,
          traceCount: sot3Record.traces.length,
          packetIds: sot3Record.traces.map((item) => item.refineryPacketId).filter((id): id is string => Boolean(id)),
          kernelDecisionIds: sot3Record.traces.map((item) => item.kernelDecision?.decision_id).filter((id): id is string => Boolean(id)),
          truthReceiptIds: sot3Record.traces.map((item) => item.truthReceipt?.receipt_id).filter((id): id is string => Boolean(id)),
          truthReferenceIds: sot3Record.traces.map((item) => item.truthReference?.reference_id).filter((id): id is string => Boolean(id)),
          flowPackageIds: sot3Record.traces.map((item) => item.flowPackage?.package_id).filter((id): id is string => Boolean(id)),
          outputLength: typeof body.output === 'string' ? body.output.length : null,
          rawKeyPersisted: false,
          rawProviderBodyPersisted: false,
          rawOutputPersisted: false,
          fullPromptPersisted: false,
          diagnostic: null,
        };

        const observationPath = process.env.CVF_SOT3_A3_OBSERVATION_OUTPUT_PATH;
        if (observationPath) {
          await writeFile(observationPath, JSON.stringify(globalThis.__CVF_SOT3_A3_OBSERVATION__, null, 2), 'utf8');
        }
      },
      60_000,
    );
  },
);
