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
