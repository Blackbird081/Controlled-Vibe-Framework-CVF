const nativeProbe = vi.hoisted(() => vi.fn());
vi.mock('cvf-model-gateway', async () => {
    const actual = await vi.importActual<typeof import('cvf-model-gateway')>('cvf-model-gateway');
    return { ...actual, probeClaudeCliSubscription: nativeProbe, createClaudeCliExecutionAdapter: () => ({ providerId: 'claude', execute: async () => ({ text: 'fixture native inference', executionSurface: 'claude_cli_subscription', nativeProcessState: 'started', observedModelId: 'fixture-observed' }) }) };
});
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
    ProviderExecutionBridge,
    type ProviderExecutionAdapter,
    type ProviderExecutionAdapterResult,
    type ProviderExecutionBridgeOptions,
    type CredentialReference,
    RoutingPolicyEngine,
    CredentialBoundary,
    fingerprintSecret,
    ProviderHealthMonitor,
    QuotaLedger,
    ProviderRegistry,
    GatewayReceiptBuilder,
} from 'cvf-model-gateway';
import {
    CANONICAL_WEB_GATEWAY_EXECUTION_VERSION,
    createCanonicalWebGatewayExecutor,
    buildCanonicalWebAttemptBoundary,
} from './canonical-web-gateway-execution';
import { createProviderAttemptLedger } from './provider-attempt-admission';
import { resetRateLimitStoresForTest } from './rate-limit';

// CSCC-R1-T2 rework, Finding 5 (risk class 10): the integrated end-to-end
// test below drives resolveKnowledgeContext (the SOT3 lane), which imports
// next/server and @/lib/middleware-auth. These mocks mirror the exact ones
// already used by route-knowledge-context.test.ts so this in-manifest test
// file can exercise that same module without a real Next.js runtime.
vi.mock('next/server', () => ({
    NextResponse: {
        json: (body: unknown, init?: { status?: number }) => ({ status: init?.status ?? 200, json: async () => body }),
    },
}));

vi.mock('@/lib/middleware-auth', () => ({
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

import { resolveKnowledgeContext } from '../app/api/execute/route-knowledge-context';
import { Sot3ActivationEvidenceStore } from './sot3-activation-evidence-store';

const TEST_PROVIDER_ID = 'test-provider';
const TEST_MODEL_ID = 'test-model-v1';
const TEST_KEY_ID = 'test-key-01';
const TEST_SECRET = 'test-secret-value-for-testing';
const TEST_CANONICAL_ID = 'env-canonical-web-001';

function makeCredentialRef(): CredentialReference {
    return { providerId: TEST_PROVIDER_ID, keyId: TEST_KEY_ID, envNames: ['TEST_API_KEY'] };
}

function makeMockAdapter(): ProviderExecutionAdapter & { execute: ReturnType<typeof vi.fn> } {
    const executeFn = vi.fn(
        async (): Promise<ProviderExecutionAdapterResult> => ({
            text: 'Hello from test adapter',
            usage: { inputTokens: 10, outputTokens: 15 },
        }),
    );
    return { providerId: TEST_PROVIDER_ID, execute: executeFn };
}

function makeBridge(overrides?: Partial<ProviderExecutionBridgeOptions>): { bridge: ProviderExecutionBridge; adapter: ReturnType<typeof makeMockAdapter> } {
    const registry = new ProviderRegistry();
    registry.register({
        id: TEST_PROVIDER_ID,
        displayName: 'Test Provider',
        status: 'enabled',
        riskClass: 'low',
        models: [{ id: TEST_MODEL_ID, riskClass: 'low' }],
    });
    const health = new ProviderHealthMonitor();
    const quota = new QuotaLedger();
    const credential = new CredentialBoundary({ TEST_API_KEY: TEST_SECRET });
    const receipt = new GatewayReceiptBuilder(
        () => new Date('2026-09-03T10:00:00Z'),
        () => 'testnonce',
    );
    const routing = new RoutingPolicyEngine(registry, health, quota);
    const credentialRefs = new Map<string, CredentialReference>();
    credentialRefs.set(TEST_PROVIDER_ID, makeCredentialRef());
    const adapter = makeMockAdapter();
    const adapters = new Map<string, ProviderExecutionAdapter>();
    adapters.set(TEST_PROVIDER_ID, adapter);
    const bridge = new ProviderExecutionBridge({
        routing, credential, health, quota, receipt, credentialRefs, adapters, ...overrides,
    });
    return { bridge, adapter };
}

function makePolicy() {
    return {
        traceId: TEST_CANONICAL_ID,
        policyResult: 'allow' as const,
        reason: 'test_allow',
        allowedProviderIds: [TEST_PROVIDER_ID],
    };
}

describe('canonical-web-gateway-execution', () => {
    it('exports the composition version constant', () => {
        expect(CANONICAL_WEB_GATEWAY_EXECUTION_VERSION).toBe('cvf.canonicalWebGatewayExecution.csccR1T2.v1');
    });

    describe('wiring: mandatory callback reaches the port and admits exactly once before the single adapter call', () => {
        it('admits, records call-start, and calls the adapter exactly once on a clean initial attempt', async () => {
            resetRateLimitStoresForTest();
            const { bridge, adapter } = makeBridge();
            const executor = createCanonicalWebGatewayExecutor(bridge);
            const ledger = createProviderAttemptLedger({
                identityKind: 'session',
                identityHash: 'user-wiring-1',
                providerModel: `${TEST_PROVIDER_ID}:${TEST_MODEL_ID}`,
            });
            const result = await executor.execute({
                canonicalExecutionId: TEST_CANONICAL_ID,
                prompt: 'Hello, world',
                policy: makePolicy(),
                preferredProviderId: TEST_PROVIDER_ID,
                routing: { requestedModelId: TEST_MODEL_ID },
                ledger,
                purpose: 'initial',
            });
            expect(adapter.execute).toHaveBeenCalledTimes(1);
            expect(ledger.admittedCount).toBe(1);
            expect(ledger.providerCallCount).toBe(1);
            expect(ledger.deniedCount).toBe(0);
            expect(result.attemptOutcome).toBe('invoked');
            expect(result.response).toBeDefined();
            expect(result.canonicalExecutionId).toBe(TEST_CANONICAL_ID);
        });

        it('denies admission before any adapter call when the per-attempt quota is exhausted, and increments neither admitted nor call-start counts', async () => {
            resetRateLimitStoresForTest();
            const { bridge, adapter } = makeBridge();
            const executor = createCanonicalWebGatewayExecutor(bridge);
            const ledger = createProviderAttemptLedger({
                identityKind: 'session',
                identityHash: 'user-wiring-denied',
                providerModel: `${TEST_PROVIDER_ID}:${TEST_MODEL_ID}`,
            });
            const limiter = (await import('./rate-limit')).getRateLimiter();
            process.env.CVF_PROVIDER_QUOTA_PER_MIN = '1';
            await limiter.consumeProviderAttempt('session', 'user-wiring-denied', `${TEST_PROVIDER_ID}:${TEST_MODEL_ID}`);

            const result = await executor.execute({
                canonicalExecutionId: TEST_CANONICAL_ID,
                prompt: 'Hello, world',
                policy: makePolicy(),
                preferredProviderId: TEST_PROVIDER_ID,
                routing: { requestedModelId: TEST_MODEL_ID },
                ledger,
                purpose: 'initial',
            });
            expect(adapter.execute).not.toHaveBeenCalled();
            expect(ledger.admittedCount).toBe(0);
            expect(ledger.providerCallCount).toBe(0);
            expect(ledger.deniedCount).toBe(1);
            expect(result.attemptOutcome).toBe('denied');
            delete process.env.CVF_PROVIDER_QUOTA_PER_MIN;
        });
    });

    describe('retry: a fresh attempt index is allocated and no prior admission state is reused', () => {
        it('allocates a distinct attemptIndex for a retry sharing the same canonicalExecutionId', async () => {
            resetRateLimitStoresForTest();
            const { bridge, adapter } = makeBridge();
            const executor = createCanonicalWebGatewayExecutor(bridge);
            const ledger = createProviderAttemptLedger({
                identityKind: 'session',
                identityHash: 'user-wiring-retry',
                providerModel: `${TEST_PROVIDER_ID}:${TEST_MODEL_ID}`,
            });
            await executor.execute({
                canonicalExecutionId: TEST_CANONICAL_ID,
                prompt: 'Hello, world',
                policy: makePolicy(),
                preferredProviderId: TEST_PROVIDER_ID,
                routing: { requestedModelId: TEST_MODEL_ID },
                ledger,
                purpose: 'initial',
            });
            await executor.execute({
                canonicalExecutionId: TEST_CANONICAL_ID,
                prompt: 'Hello, world (retry)',
                policy: makePolicy(),
                preferredProviderId: TEST_PROVIDER_ID,
                routing: { requestedModelId: TEST_MODEL_ID },
                ledger,
                purpose: 'retry',
            });
            expect(adapter.execute).toHaveBeenCalledTimes(2);
            expect(ledger.admittedCount).toBe(2);
            expect(ledger.providerCallCount).toBe(2);
            expect(ledger.attempts[0].attemptIndex).not.toBe(ledger.attempts[1].attemptIndex);
        });
    });

    describe('buildCanonicalWebAttemptBoundary: exactly one awaited/fallible operation, then a synchronous non-throwing call-start', () => {
        it('returns allow with the fresh attemptIndex on admission success', async () => {
            resetRateLimitStoresForTest();
            const ledger = createProviderAttemptLedger({
                identityKind: 'session',
                identityHash: 'user-boundary-allow',
                providerModel: `${TEST_PROVIDER_ID}:${TEST_MODEL_ID}`,
            });
            const boundary = buildCanonicalWebAttemptBoundary(ledger, 'initial');
            const outcome = await boundary({
                canonicalExecutionId: TEST_CANONICAL_ID,
                providerId: TEST_PROVIDER_ID,
                modelId: TEST_MODEL_ID,
                traceId: TEST_CANONICAL_ID,
            });
            expect(outcome.decision).toBe('allow');
            expect(ledger.admittedCount).toBe(1);
            expect(ledger.providerCallCount).toBe(1);
            expect(ledger.attempts[0].callStarted).toBe(true);
        });

        it('returns deny with a reason and retryAfterSeconds without recording call-start when admission is denied', async () => {
            resetRateLimitStoresForTest();
            const ledger = createProviderAttemptLedger({
                identityKind: 'session',
                identityHash: 'user-boundary-deny',
                providerModel: `${TEST_PROVIDER_ID}:${TEST_MODEL_ID}`,
            });
            process.env.CVF_PROVIDER_QUOTA_PER_MIN = '1';
            const limiter = (await import('./rate-limit')).getRateLimiter();
            await limiter.consumeProviderAttempt('session', 'user-boundary-deny', `${TEST_PROVIDER_ID}:${TEST_MODEL_ID}`);
            const boundary = buildCanonicalWebAttemptBoundary(ledger, 'initial');
            const outcome = await boundary({
                canonicalExecutionId: TEST_CANONICAL_ID,
                providerId: TEST_PROVIDER_ID,
                modelId: TEST_MODEL_ID,
                traceId: TEST_CANONICAL_ID,
            });
            expect(outcome.decision).toBe('deny');
            if (outcome.decision === 'deny') {
                expect(typeof outcome.reason).toBe('string');
                expect(typeof outcome.retryAfterSeconds).toBe('number');
            }
            expect(ledger.providerCallCount).toBe(0);
            expect(ledger.attempts[0].callStarted).toBeUndefined();
            delete process.env.CVF_PROVIDER_QUOTA_PER_MIN;
        });
    });

    describe('secret-safe lineage: no credential or raw payload material crosses into the port result', () => {
        it('serialized result never contains the test provider secret or the raw prompt', async () => {
            resetRateLimitStoresForTest();
            const { bridge } = makeBridge();
            const executor = createCanonicalWebGatewayExecutor(bridge);
            const ledger = createProviderAttemptLedger({
                identityKind: 'session',
                identityHash: 'user-secret-safe',
                providerModel: `${TEST_PROVIDER_ID}:${TEST_MODEL_ID}`,
            });
            const secretPrompt = 'the exact raw canonical web prompt text';
            const result = await executor.execute({
                canonicalExecutionId: TEST_CANONICAL_ID,
                prompt: secretPrompt,
                policy: makePolicy(),
                preferredProviderId: TEST_PROVIDER_ID,
                routing: { requestedModelId: TEST_MODEL_ID },
                ledger,
                purpose: 'initial',
            });
            const serialized = JSON.stringify(result);
            expect(serialized).not.toContain(TEST_SECRET);
            expect(serialized).not.toContain(secretPrompt);
            expect(result.receipt.canonicalExecutionId).toBe(TEST_CANONICAL_ID);
            expect(result.materialContextManifest?.canonicalExecutionId).toBe(TEST_CANONICAL_ID);
        });
    });

    // Risk class 10 (frozen T1 test-name manifest, Future T2 Deterministic
    // Test-Name Manifest #10): one real, executable, deterministic request
    // driven through SOT3 context resolution -> canonical execution port ->
    // adapter (faked) -> receipt/manifest/SOT3-record construction, asserting
    // all three schemas share one canonicalExecutionId and none leak the raw
    // prompt, system prompt, or a credential/secret value.
    describe('integrated deterministic execution end-to-end: SOT3 -> canonical port -> adapter -> receipt/manifest/SOT3-record', () => {
        const originalEnv = { ...process.env };
        let tempDir = '';

        beforeEach(async () => {
            tempDir = await mkdtemp(join(tmpdir(), 'cvf-canonical-web-gateway-e2e-'));
            process.env = { ...originalEnv };
            process.env.CVF_CONTROL_PLANE_EVENTS_PATH = join(tempDir, 'events.json');
            process.env.CVF_SOT3_KNOWLEDGE_ACTIVATION_MODE = 'SHADOW';
            resetRateLimitStoresForTest();
        });

        afterEach(async () => {
            process.env = { ...originalEnv };
            if (tempDir) await rm(tempDir, { recursive: true, force: true });
        });

        it('GatewayReceipt, MaterialContextManifest, and Sot3ActivationEvidenceRecord all carry the same canonicalExecutionId for one request without leaking the raw prompt, system prompt, or a credential/secret value', async () => {
            // Reuses TEST_CANONICAL_ID because makePolicy() hardcodes its
            // GatewayPolicyContext.traceId to that same constant, and the
            // manifest builder's assertNestedTrace requires policy.traceId to
            // equal the request's top-level traceId (== canonicalExecutionId
            // on a canonical call).
            const canonicalExecutionId = TEST_CANONICAL_ID;
            const secretPrompt = 'the exact raw end-to-end canonical prompt text';
            const secretSystemPrompt = 'the exact raw end-to-end canonical system prompt text';

            // Stage 1: SOT3 knowledge-context resolution -- the real pre-port
            // lane, using a real (temp-file-backed) evidence store and the
            // module's actual canonicalExecutionId fan-out parameter.
            const evidenceStore = new Sot3ActivationEvidenceStore(join(tempDir, 'sot3-activation-evidence.json'));
            const knowledgeContext = await resolveKnowledgeContext({
                intent: 'end-to-end canonical composition question',
                orgId: 'org-e2e',
                teamId: 'team-e2e',
                requestedCollectionId: undefined,
                templateLabel: 'canonical-web-gateway-e2e',
                session: null,
                evidenceStore,
                canonicalExecutionId,
            });
            expect(knowledgeContext.sot3).not.toBeNull();

            const persistedRecords = evidenceStore.list();
            expect(persistedRecords).toHaveLength(1);
            const sot3Record = persistedRecords[0];
            expect(sot3Record.canonicalExecutionId).toBe(canonicalExecutionId);

            // Stage 2: canonical execution port -> faked adapter, using the
            // real CanonicalWebGatewayExecutor/ProviderExecutionBridge
            // composition (test-double adapter, routing, credential, health,
            // and quota owners only -- no live provider call).
            const { bridge } = makeBridge();
            const executor = createCanonicalWebGatewayExecutor(bridge);
            const ledger = createProviderAttemptLedger({
                identityKind: 'session',
                identityHash: 'user-e2e-integrated',
                providerModel: `${TEST_PROVIDER_ID}:${TEST_MODEL_ID}`,
            });
            const portResult = await executor.execute({
                canonicalExecutionId,
                prompt: secretPrompt,
                systemPrompt: secretSystemPrompt,
                policy: makePolicy(),
                preferredProviderId: TEST_PROVIDER_ID,
                routing: { requestedModelId: TEST_MODEL_ID },
                ledger,
                purpose: 'initial',
            });

            // Identity equality across all three real, code-produced schemas.
            expect(portResult.canonicalExecutionId).toBe(canonicalExecutionId);
            expect(portResult.receipt.canonicalExecutionId).toBe(canonicalExecutionId);
            expect(portResult.materialContextManifest?.canonicalExecutionId).toBe(canonicalExecutionId);
            expect(sot3Record.canonicalExecutionId).toBe(portResult.receipt.canonicalExecutionId);
            expect(sot3Record.canonicalExecutionId).toBe(portResult.materialContextManifest?.canonicalExecutionId);

            // No raw prompt, system prompt, or credential/secret value in any
            // of the three serialized structures.
            const serializedReceipt = JSON.stringify(portResult.receipt);
            const serializedManifest = JSON.stringify(portResult.materialContextManifest);
            const serializedSot3Record = JSON.stringify(sot3Record);
            for (const serialized of [serializedReceipt, serializedManifest, serializedSot3Record]) {
                expect(serialized).not.toContain(secretPrompt);
                expect(serialized).not.toContain(secretSystemPrompt);
                expect(serialized).not.toContain(TEST_SECRET);
            }
        });
    });
});


import { buildJevCanonicalAttemptBoundary, executeJevCanonicalStage, assertJevAdmission } from './canonical-web-gateway-execution';
import { buildProviderAttemptReconciliation } from './provider-attempt-admission';
import type { AdapterAdmissionRecord, CanonicalExecutionPortRequest } from 'cvf-model-gateway';
const jevRecord={status:'admitted',providerId:'typesafe',modelId:'jev-latest',requestedMethod:'system_one',normalizedMethod:'system_one',supportedMethods:['system_one'],conformanceStatus:'conformant',liveExecutionAuthorized:false} as unknown as AdapterAdmissionRecord;
describe('Jev additive mandatory callback profile',()=>{
  it('denies absent/mismatched structural admission and selected tuple before custody',async()=>{
    expect(()=>assertJevAdmission(undefined)).toThrow();expect(()=>assertJevAdmission({...jevRecord,normalizedMethod:'chat'})).toThrow();
    const ledger=createProviderAttemptLedger({identityKind:'session',identityHash:'jev-wrong',providerModel:'typesafe/jev-latest'});const commit=vi.fn();
    const boundary=buildJevCanonicalAttemptBoundary({canonicalExecutionId:'env-jev-test',stageId:'wide',ledger,admission:jevRecord,verifyAndCommitStart:commit,onRetainedReservation:vi.fn()});
    expect(await boundary({canonicalExecutionId:'env-jev-test',traceId:'env-jev-test',providerId:'alibaba',modelId:'jev-latest'})).toMatchObject({decision:'deny'});expect(commit).not.toHaveBeenCalled();expect(ledger.admittedCount).toBe(0);
  });
  it('retains rate admission and false reconciliation on synchronous custody failure',async()=>{
    const ledger=createProviderAttemptLedger({identityKind:'session',identityHash:'jev-retained',providerModel:'typesafe/jev-latest'});const retained=vi.fn();
    const boundary=buildJevCanonicalAttemptBoundary({canonicalExecutionId:'env-jev-test',stageId:'wide',ledger,admission:jevRecord,verifyAndCommitStart:()=>{throw Error('COMMIT_UNKNOWN');},onRetainedReservation:retained});
    expect(await boundary({canonicalExecutionId:'env-jev-test',traceId:'env-jev-test',providerId:'typesafe',modelId:'jev-latest'})).toMatchObject({decision:'deny',attemptIndex:0,reason:'RESERVATION_RETAINED_NO_INVOCATION'});
    expect(retained).toHaveBeenCalledOnce();expect(buildProviderAttemptReconciliation(ledger,'typesafe','jev-latest')).toMatchObject({admittedAttemptCount:1,providerCallCount:0,reconciles:false});
  });
  it('keeps one canonical identity, bounded native routing and explicit continuation',async()=>{
    const ledger=createProviderAttemptLedger({identityKind:'session',identityHash:'jev-success',providerModel:'typesafe/jev-latest'});const calls:CanonicalExecutionPortRequest[]=[];
    const port={execute:vi.fn(async(request:CanonicalExecutionPortRequest)=>{calls.push(request);await request.attemptBoundary({canonicalExecutionId:request.canonicalExecutionId,traceId:request.canonicalExecutionId,providerId:'typesafe',modelId:'jev-latest'});return {} as never;})};
    for(const stageId of ['wide','narrow'] as const)await executeJevCanonicalStage(port,{canonicalExecutionId:'env-jev-test',stageId,ledger,admission:jevRecord,verifyAndCommitStart:()=>{},onRetainedReservation:()=>{}},'{}');
    expect(calls.map(c=>c.canonicalExecutionId)).toEqual(['env-jev-test','env-jev-test']);expect(calls[0].routing).toMatchObject({requestedModelId:'jev-latest',requiredCapabilities:['system_one']});expect(calls[0].policy.allowedProviderIds).toEqual(['typesafe']);
    expect(ledger.attempts.map(a=>a.purpose)).toEqual(['initial','continuation']);expect(buildProviderAttemptReconciliation(ledger,'typesafe','jev-latest')).toMatchObject({providerCallCount:2,retryCount:0,reconciles:true});
    const third=buildJevCanonicalAttemptBoundary({canonicalExecutionId:'env-jev-test',stageId:'narrow',ledger,admission:jevRecord,verifyAndCommitStart:vi.fn(),onRetainedReservation:vi.fn()});
    expect(await third({canonicalExecutionId:'env-jev-test',traceId:'env-jev-test',providerId:'typesafe',modelId:'jev-latest'})).toMatchObject({decision:'deny'});expect(ledger.attempts).toHaveLength(2);
  });
});


it('binds structural admission and attempt to the OpenRouter v2 tuple',async()=>{
 const admission={...jevRecord,providerId:'openrouter',modelId:'typesafe/jev-1.14'};expect(()=>assertJevAdmission(admission,'openrouter-systemone')).not.toThrow();expect(()=>assertJevAdmission(jevRecord,'openrouter-systemone')).toThrow();
 const ledger=createProviderAttemptLedger({identityKind:'session',identityHash:'openrouter-fixture',providerModel:'openrouter/typesafe/jev-1.14'});const commit=vi.fn();const boundary=buildJevCanonicalAttemptBoundary({connection:'openrouter-systemone',canonicalExecutionId:'env-jev-test',stageId:'wide',ledger,admission,verifyAndCommitStart:commit,onRetainedReservation:vi.fn()});
 expect(await boundary({canonicalExecutionId:'env-jev-test',traceId:'env-jev-test',providerId:'typesafe',modelId:'jev-latest'})).toMatchObject({decision:'deny'});expect(commit).not.toHaveBeenCalled();
});


describe('Alibaba canonical candidate', () => {
    it('uses the port selection and fails closed on the direct assertion', async () => {
        const canonicalModule = await import('./canonical-web-gateway-execution');
        expect(canonicalModule.NON_VISION_EXECUTION_PATH_SELECTION).toBe('port');
        expect(() => canonicalModule.assertNonVisionExecutionPathIsDirect()).toThrow();
    });

    it('runs initial and retry through the actual port and one fixture adapter, joining identities and preserving partial usage', async () => {
        const { createAlibabaCanonicalWebExecutor, canonicalWebExecutionResponse } = await import('./canonical-web-gateway-execution');
        resetRateLimitStoresForTest();
        const adapter = { providerId: 'alibaba', execute: vi.fn().mockResolvedValue({ text: 'fixture output', providerUsage: { inputTokens: 7 } }) };
        const executor = createAlibabaCanonicalWebExecutor({ model: 'qwen-plus-character', env: { ALIBABA_API_KEY: 'fixture-secret' }, adapter });
        const ledger = createProviderAttemptLedger({ identityKind: 'session', identityHash: 'candidate-initial-retry', providerModel: 'alibaba:qwen-plus-character' });
        const params = { canonicalExecutionId: 'candidate-trace-1', prompt: 'fixture prompt', policy: { traceId: 'candidate-trace-1', policyResult: 'allow' as const, allowedProviderIds: ['alibaba'] }, preferredProviderId: 'alibaba', routing: { requestedModelId: 'qwen-plus-character' }, ledger };
        const first = await executor.execute({ ...params, purpose: 'initial' });
        const second = await executor.execute({ ...params, purpose: 'retry' });
        expect(adapter.execute).toHaveBeenCalledTimes(2);
        expect(ledger.attempts.map(attempt => attempt.purpose)).toEqual(['initial', 'retry']);
        expect(ledger.providerCallCount).toBe(2);
        for (const result of [first, second]) {
            expect(result.attemptOutcome).toBe('invoked');
            expect(result.receipt.canonicalExecutionId).toBe(params.canonicalExecutionId);
            expect(result.materialContextManifest?.canonicalExecutionId).toBe(params.canonicalExecutionId);
            expect(canonicalWebExecutionResponse(result, 'fallback', Date.now())).toMatchObject({ usage: { inputTokens: 7 }, canonicalGateway: { actualUsage: { inputTokens: 7 }, usageProvenance: 'provider_reported_partial_or_complete' } });
            expect(JSON.stringify(result)).not.toContain('fixture-secret');
            expect(JSON.stringify(result)).not.toContain('fixture prompt');
        }
    });

    it('rejects excluded request profiles without mutating their selectors', async () => {
        const { canonicalWebProfileDenied } = await import('./canonical-web-gateway-execution');
        const body = { provider: 'alibaba' as const, imageUrl: ' https://example.invalid/image ' };
        expect(canonicalWebProfileDenied(body, undefined)).toBe(true);
        expect(body.imageUrl).toBe(' https://example.invalid/image ');
        expect(canonicalWebProfileDenied({ provider: 'alibaba', templateId: 'web_build_handoff' }, undefined)).toBe(true);
        expect(canonicalWebProfileDenied({ provider: 'alibaba', htmlPilotIntent: { operationKey: 'x' } }, undefined)).toBe(true);
        // No provider falls back to the OpenAI default, which is a canonical provider but still excludes the vision/HTML profiles.
        expect(canonicalWebProfileDenied({}, undefined)).toBe(false);
        expect(canonicalWebProfileDenied({ imageUrl: 'https://example.invalid/image' }, undefined)).toBe(true);
        expect(canonicalWebProfileDenied({ provider: 'alibaba' }, undefined)).toBe(false);
    });

    it('admits OpenAI text requests and still denies every other provider and the excluded profiles', async () => {
        const { canonicalWebProfileDenied } = await import('./canonical-web-gateway-execution');
        expect(canonicalWebProfileDenied({ provider: 'openai' }, undefined)).toBe(false);
        expect(canonicalWebProfileDenied({}, 'openai')).toBe(false);
        for (const provider of ['gemini', 'deepseek', 'openrouter'] as const) {
            expect(canonicalWebProfileDenied({ provider }, undefined)).toBe(true);
            expect(canonicalWebProfileDenied({}, provider)).toBe(true);
        }
        expect(canonicalWebProfileDenied({ provider: 'openai', imageBase64: 'eA==' }, undefined)).toBe(true);
        expect(canonicalWebProfileDenied({ provider: 'openai', mimeType: 'image/png' }, undefined)).toBe(true);
        expect(canonicalWebProfileDenied({ provider: 'openai', templateId: 'web_build_handoff' }, undefined)).toBe(true);
        expect(canonicalWebProfileDenied({ provider: 'openai', htmlPilotIntent: { operationKey: 'x' } }, undefined)).toBe(true);
        // Claude stays subscription-only: not admitted without the native subscription mode.
        expect(canonicalWebProfileDenied({ provider: 'claude' }, undefined)).toBe(true);
    });
});

describe('OpenAI canonical candidate', () => {
    it('allowlists exactly the OpenAI models offered in Settings, never a reasoning model, plus server-side extensions only', async () => {
        const { isOpenAiModelAllowed } = await import('./canonical-web-gateway-execution');
        const { AVAILABLE_MODELS } = await import('@/components/Settings');
        for (const model of AVAILABLE_MODELS.openai) expect(isOpenAiModelAllowed(model.id, {})).toBe(true);
        for (const model of ['o1', 'o3-mini', 'o4-mini', 'gpt-5', 'text-davinci-003', '']) expect(isOpenAiModelAllowed(model, {})).toBe(false);
        expect(isOpenAiModelAllowed('gpt-5-mini', { CVF_OPENAI_ALLOWED_MODELS: 'gpt-5-mini' })).toBe(true);
        expect(isOpenAiModelAllowed('evil model', { CVF_OPENAI_ALLOWED_MODELS: 'evil model' })).toBe(false);
    });

    afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
    const params = (ledger: ReturnType<typeof createProviderAttemptLedger>, purpose: 'initial' | 'retry' = 'initial') => ({
        canonicalExecutionId: 'openai-trace-1', prompt: 'fixture prompt',
        policy: { traceId: 'openai-trace-1', policyResult: 'allow' as const, allowedProviderIds: ['openai'] },
        preferredProviderId: 'openai', routing: { requestedModelId: 'gpt-6-luna' }, ledger, purpose,
    });

    it('runs through the actual port and one fixture adapter, joining identities and reporting provider usage only', async () => {
        const { createOpenAiCanonicalWebExecutor, canonicalWebExecutionResponse, CANONICAL_WEB_OPENAI_DEFAULT_MODEL } = await import('./canonical-web-gateway-execution');
        expect(CANONICAL_WEB_OPENAI_DEFAULT_MODEL).toBe('gpt-6-luna');
        resetRateLimitStoresForTest();
        const adapter = { providerId: 'openai', execute: vi.fn().mockResolvedValue({ text: 'fixture output', providerUsage: { inputTokens: 5, outputTokens: 6, totalTokens: 11 } }) };
        const executor = createOpenAiCanonicalWebExecutor({ env: { OPENAI_API_KEY: 'fixture-openai-secret' }, adapter });
        const ledger = createProviderAttemptLedger({ identityKind: 'session', identityHash: 'openai-candidate', providerModel: 'openai:gpt-6-luna' });
        const result = await executor.execute(params(ledger));
        expect(adapter.execute).toHaveBeenCalledTimes(1);
        expect(ledger.providerCallCount).toBe(1);
        expect(result.attemptOutcome).toBe('invoked');
        expect(result.receipt.canonicalExecutionId).toBe('openai-trace-1');
        expect(result.receipt.providerId).toBe('openai');
        const response = canonicalWebExecutionResponse(result, 'fallback', Date.now(), 'openai');
        expect(response).toMatchObject({ provider: 'openai', usage: { inputTokens: 5, outputTokens: 6, totalTokens: 11 }, canonicalGateway: { usageProvenance: 'provider_reported_partial_or_complete' } });
        expect(JSON.stringify(result)).not.toContain('fixture-openai-secret');
        expect(JSON.stringify(result)).not.toContain('fixture prompt');
    });

    it('calls only the admitted OpenAI endpoint with the server key refreshed at invocation, and never leaks it', async () => {
        const { createOpenAiCanonicalWebExecutor } = await import('./canonical-web-gateway-execution');
        resetRateLimitStoresForTest();
        const env: Record<string, string | undefined> = { OPENAI_API_KEY: 'fixture-old' };
        const fetch = vi.fn().mockImplementation(async () => new Response(JSON.stringify({ choices: [{ message: { content: 'valid output' }, finish_reason: 'stop' }] }), { status: 200 }));
        vi.stubGlobal('fetch', fetch);
        const executor = createOpenAiCanonicalWebExecutor({ env, maxTokens: 321 });
        const ledger = createProviderAttemptLedger({ identityKind: 'session', identityHash: 'openai-refresh', providerModel: 'openai:gpt-6-luna' });
        env.OPENAI_API_KEY = 'fixture-new';
        const result = await executor.execute(params(ledger));
        expect(result.response?.text).toBe('valid output');
        const [url, init] = fetch.mock.calls[0];
        expect(url).toBe('https://api.openai.com/v1/chat/completions');
        expect(init.headers.Authorization).toBe('Bearer fixture-new');
        expect(JSON.parse(String(init.body))).toMatchObject({ model: 'gpt-6-luna', max_completion_tokens: 321, reasoning_effort: 'none' });
        expect(result.receipt.credentialFingerprint).toBe(fingerprintSecret('fixture-new'));
        expect(result.response?.providerUsage).toBeUndefined();
        expect(JSON.stringify(result)).not.toContain('fixture-new');
        expect(JSON.stringify(result)).not.toContain('fixture-old');
    });

    it('fails closed without a key: no network call, shielded credential error', async () => {
        const { createOpenAiCanonicalWebExecutor } = await import('./canonical-web-gateway-execution');
        resetRateLimitStoresForTest();
        const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
        const executor = createOpenAiCanonicalWebExecutor({ env: {} });
        const ledger = createProviderAttemptLedger({ identityKind: 'session', identityHash: 'openai-nokey', providerModel: 'openai:gpt-6-luna' });
        const result = await executor.execute(params(ledger));
        expect(fetch).not.toHaveBeenCalled();
        expect(result.response).toBeUndefined();
        // The Gateway bridge shields a missing credential before the adapter is ever reached.
        expect(result.error).toMatchObject({ errorClass: 'credential_shielded', credentialShielded: true });
    });

    it('denies an OPENAI_BASE_URL outside the admitted provider host before any network call', async () => {
        const { createOpenAiCanonicalWebExecutor } = await import('./canonical-web-gateway-execution');
        resetRateLimitStoresForTest();
        const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
        const executor = createOpenAiCanonicalWebExecutor({ env: { OPENAI_API_KEY: 'fixture-key', OPENAI_BASE_URL: 'https://attacker.example/v1' } });
        const ledger = createProviderAttemptLedger({ identityKind: 'session', identityHash: 'openai-baseurl', providerModel: 'openai:gpt-6-luna' });
        const result = await executor.execute(params(ledger));
        expect(fetch).not.toHaveBeenCalled();
        expect(result.error?.providerDiagnostic?.code).toBe('destination_denied');
    });
});


describe('Alibaba canonical invocation-time credentials', () => {
    afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

    it.each(['rotate', 'remove'] as const)('refreshes credential changes during admission: %s', async change => {
        const { createAlibabaCanonicalWebExecutor } = await import('./canonical-web-gateway-execution');
        const rateModule = await import('./rate-limit');
        resetRateLimitStoresForTest();
        const env: Record<string, string | undefined> = { ALIBABA_API_KEY: 'fixture-old', CVF_ALIBABA_QUOTA_SCOPE_CONFIRMED: '1' };
        const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: 'valid output' }, finish_reason: 'stop' }] }), { status: 200 }));
        vi.stubGlobal('fetch', fetch);
        const limiter = rateModule.getRateLimiter();
        const original = limiter.consumeProviderAttempt.bind(limiter);
        const admission = vi.fn(async (...args: Parameters<typeof original>) => {
            const result = await original(...args);
            if (change === 'rotate') env.ALIBABA_API_KEY = 'fixture-new';
            else delete env.ALIBABA_API_KEY;
            return result;
        });
        vi.spyOn(rateModule, 'getRateLimiter').mockReturnValue({ ...limiter, consumeProviderAttempt: admission });
        const executor = createAlibabaCanonicalWebExecutor({ model: 'qwen-plus-character', env });
        const ledger = createProviderAttemptLedger({ identityKind: 'session', identityHash: 'rotation-' + change, providerModel: 'alibaba:qwen-plus-character' });
        const result = await executor.execute({ canonicalExecutionId: 'rotation-trace', prompt: 'fixture', policy: { traceId: 'rotation-trace', policyResult: 'allow', allowedProviderIds: ['alibaba'] }, preferredProviderId: 'alibaba', routing: { requestedModelId: 'qwen-plus-character' }, ledger, purpose: 'initial' });
        if (change === 'rotate') {
            expect(result.response?.text).toBe('valid output');
            expect(fetch).toHaveBeenCalledTimes(1);
            expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer fixture-new');
            expect(result.receipt.credentialFingerprint).toBe(fingerprintSecret('fixture-new'));
        } else {
            expect(fetch).not.toHaveBeenCalled();
            expect(result.error?.providerDiagnostic?.code).toBe('credential_unavailable');
            expect(result.receipt.credentialFingerprint).toBeUndefined();
        }
        expect(admission).toHaveBeenCalledOnce();
        expect(ledger.providerCallCount).toBe(1);
        expect(JSON.stringify(result)).not.toContain('fixture-new');
        expect(JSON.stringify(result)).not.toContain('fixture-old');
    });
});

describe('native sole-provider canonical factory', () => {
    it('keeps API model IDs out and projects actual provider with alias distinct observed model', async () => {
        const { canonicalWebExecutionResponse, canonicalWebProfileDenied } = await import('./canonical-web-gateway-execution');
        const previous = process.env.CVF_CLAUDE_EXECUTION_MODE;
        process.env.CVF_CLAUDE_EXECUTION_MODE = 'subscription_cli';
        try {
            expect(canonicalWebProfileDenied({ provider: 'claude' }, undefined)).toBe(false);
            expect(canonicalWebProfileDenied({ provider: 'claude', imageUrl: 'image' }, undefined)).toBe(true);
            const response = canonicalWebExecutionResponse({ canonicalExecutionId: 'fixture', response: { text: 'actual', model: { modelId: 'sonnet' }, executionSurface: 'claude_cli_subscription', observedModelId: 'observed', nativeProcessState: 'started' }, receipt: {}, materialContextManifestDisposition: 'not_present' } as never, 'sonnet', Date.now(), 'claude');
            expect(response.provider).toBe('claude'); expect(response.model).toBe('sonnet'); expect(response.canonicalGateway).toMatchObject({ executionSurface: 'claude_cli_subscription', observedModelId: 'observed', usageProvenance: 'unknown' });
        } finally { if (previous === undefined) delete process.env.CVF_CLAUDE_EXECUTION_MODE; else process.env.CVF_CLAUDE_EXECUTION_MODE = previous; }
    });
});
