import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const providerSpy = vi.hoisted(() => vi.fn());
const evaluateEnforcementMock = vi.hoisted(() => vi.fn());
const verifySessionCookieMock = vi.hoisted(() => vi.fn());
const checkTeamQuotaMock = vi.hoisted(() => vi.fn());
const appendAuditEventMock = vi.hoisted(() => vi.fn());
const appendCostEventMock = vi.hoisted(() => vi.fn());

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
        session: unknown,
        payload?: Record<string, unknown>,
    ) => payload,
}));

vi.mock('@/lib/quota-guard', () => ({
    checkTeamQuota: checkTeamQuotaMock,
    hasSoftCapAuditEvent: vi.fn().mockResolvedValue(false),
}));

vi.mock('@/lib/control-plane-events', async () => {
    const actual = await vi.importActual<typeof import('@/lib/control-plane-events')>('@/lib/control-plane-events');
    return {
        ...actual,
        appendAuditEvent: appendAuditEventMock,
        appendCostEvent: appendCostEventMock,
    };
});

import { POST } from './route';
import { useCanonicalRouteHarness } from '@/test/canonical-route-test-support';
import { getApprovalStore } from '../approvals/store';
import { resetRateLimitStoresForTest } from '@/lib/rate-limit';

function makeExecuteRequest(body: Record<string, unknown>): Request {
    return new Request('http://localhost/api/execute', {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

const validOutput = '## Governed Response\n\nThis response provides a structured recommendation with enough detail to satisfy output validation requirements.\n\n1. Review the request context carefully.\n2. Apply the governed execution plan.\n3. Return a concise, safe outcome for the operator.';

describe('/api/execute provider-attempt admission (DSH-WRA-R1)', () => {
    const originalEnv = {
        ...process.env,
        CVF_RATE_LIMIT: '10000',
    };

    beforeEach(async () => {
        providerSpy.mockReset();
        evaluateEnforcementMock.mockReset();
        verifySessionCookieMock.mockReset();
        checkTeamQuotaMock.mockReset();
        appendAuditEventMock.mockReset().mockResolvedValue({ id: 'test-audit-event-id' });
        appendCostEventMock.mockReset();
        getApprovalStore().clear();
        resetRateLimitStoresForTest();
        evaluateEnforcementMock.mockReturnValue({ status: 'ALLOW', reasons: [] });
        checkTeamQuotaMock.mockResolvedValue({
            exceeded: false,
            currentUSD: 0,
            softCapUSD: 0,
            hardCapUSD: 0,
            overrideActive: false,
        });
        process.env = { ...originalEnv };
        delete process.env.ANTHROPIC_API_KEY;
        delete process.env.GOOGLE_AI_API_KEY;
        delete process.env.ALIBABA_API_KEY;
        delete process.env.DASHSCOPE_API_KEY;
        delete process.env.CVF_BENCHMARK_ALIBABA_KEY;
        delete process.env.CVF_ALIBABA_API_KEY;
        delete process.env.OPENROUTER_API_KEY;
        delete process.env.DEEPSEEK_API_KEY;
        delete process.env.DEFAULT_AI_PROVIDER;
        delete process.env.CVF_SESSION_SECRET;
        verifySessionCookieMock.mockResolvedValue({
            userId: 'user-tester',
            user: 'tester',
            role: 'admin',
            orgId: 'org-1',
            teamId: 'team-1',
            expiresAt: Date.now() + 1000 * 60 * 60,
        });
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    function baseRequestBody(overrides: Record<string, unknown> = {}) {
        return {
            templateId: 'strategy_analysis',
            templateName: 'Strategy',
            intent: 'Analyze the market',
            inputs: { topic: 'SMB market', context: 'Compare market opportunities for SMBs' },
            provider: 'openai',
            ...overrides,
        };
    }

    // -- Deterministic: initial success ------------------------------------
    it('admits and calls the provider exactly once on a clean success', async () => {
        process.env.OPENAI_API_KEY = 'test-key';
        process.env.CVF_PROVIDER_QUOTA_PER_MIN = '10000';
        providerSpy.mockResolvedValue({ success: true, output: validOutput, provider: 'openai', model: 'gpt-4o' });

        const res = await POST(makeExecuteRequest(baseRequestBody()) as never);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(providerSpy).toHaveBeenCalledTimes(1);
        expect(data.providerAttemptReconciliation).toMatchObject({
            providerCallCount: 1,
            retryCount: 0,
            admittedAttemptCount: 1,
            deniedAttemptCount: 0,
            inboundRequestCount: 1,
            reconciles: true,
        });
        expect(data.governanceEvidenceReceipt.providerAttemptReconciliation).toMatchObject({
            providerCallCount: 1,
            reconciles: true,
        });
    });

    // -- Deterministic: admission denial BEFORE the first provider call -----
    // Note: CVF_PROVIDER_QUOTA_PER_MIN also gates the pre-existing top-level
    // `limiter.consume()` admission (request-level), which runs before the
    // new per-attempt admission this batch adds. To isolate the NEW gate
    // specifically, keep the top-level per-provider quota generous and
    // instead pre-exhaust the per-attempt ledger's underlying bucket
    // directly (same key scheme the new module uses), proving the new gate
    // denies on its own even when the older top-level gate would allow.
    it('denies admission before the first provider call when the per-attempt quota is independently exhausted', async () => {
        process.env.OPENAI_API_KEY = 'test-key';
        process.env.CVF_PROVIDER_QUOTA_PER_MIN = '2';
        providerSpy.mockResolvedValue({ success: true, output: validOutput, provider: 'openai', model: 'gpt-4o' });

        const limiter = (await import('@/lib/rate-limit')).getRateLimiter();
        // Pre-exhaust the exact per-attempt bucket key the route will use
        // for this identity/provider/model (openai:undefined, since no
        // explicit body.model is set in baseRequestBody()).
        await limiter.consumeProviderAttempt('session', 'user-tester', 'openai:default');
        await limiter.consumeProviderAttempt('session', 'user-tester', 'openai:default');

        const res2 = await POST(makeExecuteRequest(baseRequestBody()) as never);
        const data2 = await res2.json();
        expect(res2.status).toBe(429);
        expect(providerSpy).not.toHaveBeenCalled();
        expect(data2.success).toBe(false);
        expect(data2.providerAttemptReconciliation.providerCallCount).toBe(0);
        expect(data2.providerAttemptReconciliation.deniedAttemptCount).toBe(1);
        expect(data2.diagnostic).toMatchObject({ stage: 'rate_limit', class: 'rate_limited', httpStatus: 429 });
    });

    // -- Deterministic: denial specifically before a RETRY, after initial admitted --
    it('denies admission before a retry attempt even though the initial call was admitted', async () => {
        process.env.OPENAI_API_KEY = 'test-key';
        process.env.CVF_PROVIDER_QUOTA_PER_MIN = '1';
        // First call returns output that triggers a validation retry.
        providerSpy.mockResolvedValueOnce({ success: true, output: 'short', provider: 'openai', model: 'gpt-4o' });

        const res = await POST(makeExecuteRequest(baseRequestBody({ intent: 'Analyze the market in depth' })) as never);
        const data = await res.json();

        // Exactly one provider call fires (the initial one); the retry the
        // validator wants is denied by admission before it can call again.
        expect(providerSpy).toHaveBeenCalledTimes(1);
        expect(res.status).toBe(429);
        expect(data.providerAttemptReconciliation.providerCallCount).toBe(1);
        expect(data.providerAttemptReconciliation.deniedAttemptCount).toBe(1);
    });

    // -- Deterministic: one retry admitted and consumed ----------------------
    it('admits and counts exactly one retry when quota allows two attempts', async () => {
        process.env.OPENAI_API_KEY = 'test-key';
        process.env.CVF_PROVIDER_QUOTA_PER_MIN = '2';
        providerSpy
            .mockResolvedValueOnce({ success: true, output: 'short', provider: 'openai', model: 'gpt-4o' })
            .mockResolvedValueOnce({ success: true, output: validOutput, provider: 'openai', model: 'gpt-4o' });

        const res = await POST(makeExecuteRequest(baseRequestBody({ intent: 'Analyze the market in depth' })) as never);
        const data = await res.json();

        expect(providerSpy).toHaveBeenCalledTimes(2);
        expect(res.status).toBe(200);
        expect(data.providerAttemptReconciliation).toMatchObject({
            providerCallCount: 2,
            retryCount: 1,
            admittedAttemptCount: 2,
            deniedAttemptCount: 0,
            reconciles: true,
        });
    });

    // -- Concurrency: parallel requests cannot exceed the per-attempt ceiling --
    it('does not allow concurrent requests to collectively exceed the per-attempt ceiling', async () => {
        process.env.OPENAI_API_KEY = 'test-key';
        process.env.CVF_PROVIDER_QUOTA_PER_MIN = '3';
        providerSpy.mockResolvedValue({ success: true, output: validOutput, provider: 'openai', model: 'gpt-4o' });

        const responses = await Promise.all(
            Array.from({ length: 6 }, () => POST(makeExecuteRequest(baseRequestBody()) as never)),
        );
        const statuses = await Promise.all(responses.map(async (r) => (r as Response).status));
        const successCount = statuses.filter((s) => s === 200).length;
        const deniedCount = statuses.filter((s) => s === 429).length;

        expect(successCount).toBe(3);
        expect(deniedCount).toBe(3);
        expect(providerSpy).toHaveBeenCalledTimes(3);
    });

    // -- Provider failure: admitted attempt, but provider itself fails ------
    it('counts a provider-failure attempt as admitted even though the call did not succeed', async () => {
        process.env.OPENAI_API_KEY = 'test-key';
        process.env.CVF_PROVIDER_QUOTA_PER_MIN = '10000';
        providerSpy.mockResolvedValue({
            success: false,
            error: 'Provider unavailable',
            provider: 'openai',
            model: 'gpt-4o',
        });

        const res = await POST(makeExecuteRequest(baseRequestBody()) as never);
        const data = await res.json();

        expect(providerSpy).toHaveBeenCalledTimes(1);
        expect(data.success).toBe(false);
        expect(data.providerAttemptReconciliation).toMatchObject({
            providerCallCount: 1,
            admittedAttemptCount: 1,
            deniedAttemptCount: 0,
        });
    });

    // -- Timeout/abort: provider call rejects --------------------------------
    it('counts a timed-out/aborted admitted attempt and does not multiply calls on rejection', async () => {
        process.env.OPENAI_API_KEY = 'test-key';
        process.env.CVF_PROVIDER_QUOTA_PER_MIN = '10000';
        providerSpy.mockResolvedValue({
            success: false,
            error: 'Request timed out',
            provider: 'openai',
            model: 'gpt-4o',
        });

        const res = await POST(makeExecuteRequest(baseRequestBody()) as never);
        await res.json();

        expect(providerSpy).toHaveBeenCalledTimes(1);
    });

    // -- Missing usage: success with no output/usage still reconciles -------
    // On the canonical Gateway path an empty/blank provider answer is rejected by the adapter itself
    // (`output_incomplete`), so it is a single admitted provider failure rather than a validator retry sequence.
    // This proves reconciliation stays correct when the attempt has no usable output/usage to report.
    it('reconciles the provider attempt when the provider result carries no usable output', async () => {
        process.env.OPENAI_API_KEY = 'test-key';
        process.env.CVF_PROVIDER_QUOTA_PER_MIN = '10000';
        providerSpy.mockResolvedValue({ success: true, output: '', provider: 'openai', model: 'gpt-4o' });

        const res = await POST(makeExecuteRequest(baseRequestBody()) as never);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(providerSpy).toHaveBeenCalledTimes(1);
        expect(data.success).toBe(false);
        expect(data.canonicalGateway.providerDiagnostic.code).toBe('output_incomplete');
        expect(data.providerAttemptReconciliation.providerCallCount).toBe(1);
        expect(data.providerAttemptReconciliation.retryCount).toBe(0);
        expect(data.providerAttemptReconciliation.reconciles).toBe(true);
    });

    // -- Secret exclusion -----------------------------------------------------
    it('never exposes the provider API key or raw request body in the reconciliation evidence', async () => {
        process.env.OPENAI_API_KEY = 'sk-super-secret-test-key-value';
        process.env.CVF_PROVIDER_QUOTA_PER_MIN = '10000';
        providerSpy.mockResolvedValue({ success: true, output: validOutput, provider: 'openai', model: 'gpt-4o' });

        const res = await POST(makeExecuteRequest(baseRequestBody()) as never);
        const data = await res.json();
        const serialized = JSON.stringify(data.providerAttemptReconciliation);

        expect(serialized).not.toContain('sk-super-secret-test-key-value');
        expect(serialized).not.toMatch(/sk-[a-z0-9_-]+/i);
        expect(data.providerAttemptReconciliation.claimBoundary).toBe(
            'summary_counts_only_no_secret_provider_payload_or_raw_body',
        );
    });

    // -- Regression guard: prove the deny-before-call invariant is real ------
    it('REGRESSION GUARD: never calls the provider when the very first admission is denied, regardless of downstream logic', async () => {
        process.env.OPENAI_API_KEY = 'test-key';
        process.env.CVF_PROVIDER_QUOTA_PER_MIN = '1';
        providerSpy.mockResolvedValue({ success: true, output: validOutput, provider: 'openai', model: 'gpt-4o' });

        await POST(makeExecuteRequest(baseRequestBody()) as never); // consumes the sole unit
        providerSpy.mockClear();

        const res = await POST(makeExecuteRequest(baseRequestBody()) as never);
        expect(res.status).toBe(429);
        // This is the exact invariant a removed/broken admission gate would
        // violate: the provider must never be called once the ledger denies.
        expect(providerSpy).not.toHaveBeenCalled();
    });

    // -- DSH-WRA-R1-RV-F01: invalid vision routing must be rejected BEFORE
    // admission, so it consumes no attempt quota and is never counted as a
    // provider call. Vision is now an intentionally removed capability: the
    // canonical route denies it at the profile gate (403) without invoking any
    // provider. ---------------------------------------------------------------
    it('F01: denies a vision request with 403 before admitting any provider attempt', async () => {
        process.env.OPENAI_API_KEY = 'test-key';
        process.env.CVF_PROVIDER_QUOTA_PER_MIN = '10000';
        providerSpy.mockResolvedValue({ success: true, output: validOutput, provider: 'openai', model: 'gpt-4o' });

        const res = await POST(
            makeExecuteRequest(
                baseRequestBody({ provider: 'openai', imageUrl: 'https://example.com/some-image.png' }),
            ) as never,
        );
        const data = await res.json();

        expect(res.status).toBe(403);
        expect(data.error).toBe('This route supports Alibaba, OpenAI and Claude subscription text requests only.');
        expect(providerSpy).not.toHaveBeenCalled();
        // No provider-attempt admission/ledger evidence should even be
        // present, because the route rejects before creating the ledger -
        // proving this request never reached (and never consumed) the
        // provider-attempt admission gate.
        expect(data.providerAttemptReconciliation).toBeUndefined();

        // The per-attempt quota bucket for this identity/model must remain
        // fully untouched: a subsequent legitimate request for the SAME
        // identity/model combination must still see a full quota, proving
        // the rejected vision request consumed zero attempt quota.
        providerSpy.mockClear();
        process.env.CVF_PROVIDER_QUOTA_PER_MIN = '1';
        const res2 = await POST(makeExecuteRequest(baseRequestBody({ provider: 'openai' })) as never);
        expect(res2.status).toBe(200);
        expect(providerSpy).toHaveBeenCalledTimes(1);
    });

    // -- DSH-WRA-R1-RV-F01: a thrown/rejected initial provider invocation
    // must still carry accurate providerAttemptReconciliation evidence, not
    // fall through to a bare unreconciled error. -----------------------------
    it('F01: a thrown initial provider invocation returns a secret-safe failure with reconciliation evidence, not an unreconciled bare error', async () => {
        process.env.OPENAI_API_KEY = 'test-key';
        process.env.CVF_PROVIDER_QUOTA_PER_MIN = '10000';
        providerSpy.mockRejectedValue(new Error('simulated provider client crash'));

        const res = await POST(makeExecuteRequest(baseRequestBody()) as never);
        const data = await res.json();

        // Contract (same as canonical Alibaba): the Gateway converts a thrown transport error into a closed provider diagnostic
        // (200 + success:false), never a bare 500.
        expect(res.status).toBe(200);
        expect(providerSpy).toHaveBeenCalledTimes(1);
        expect(data.success).toBe(false);
        expect(data.canonicalGateway.providerDiagnostic.code).toBe('unknown_error');
        expect(JSON.stringify(data)).not.toContain('simulated provider client crash');
        expect(data.providerAttemptReconciliation).toMatchObject({
            providerCallCount: 1,
            admittedAttemptCount: 1,
            deniedAttemptCount: 0,
            reconciles: true,
        });
    });

    // -- DSH-WRA-R1-RV-F01: a thrown retry invocation must also carry
    // reconciliation evidence reflecting the admitted-but-thrown retry. ------
    it('F01: a thrown retry provider invocation returns a secret-safe failure with reconciliation evidence reflecting both attempts', async () => {
        process.env.OPENAI_API_KEY = 'test-key';
        process.env.CVF_PROVIDER_QUOTA_PER_MIN = '10000';
        providerSpy
            .mockResolvedValueOnce({ success: true, output: 'short', provider: 'openai', model: 'gpt-4o' })
            .mockRejectedValueOnce(new Error('simulated provider client crash on retry'));

        const res = await POST(makeExecuteRequest(baseRequestBody({ intent: 'Analyze the market in depth' })) as never);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(false);
        expect(JSON.stringify(data)).not.toContain('simulated provider client crash');
        expect(providerSpy).toHaveBeenCalledTimes(2);
        expect(data.providerAttemptReconciliation).toMatchObject({
            providerCallCount: 2,
            admittedAttemptCount: 2,
            reconciles: true,
        });
    });

    // -- CSCC-R1-T2: exactly-once provider invocation. The legacy direct
    // `executeAI` path was removed (2886167cc); the route now has exactly one
    // execution path, the canonical Gateway port, so the "never both active"
    // invariant is now structural: there is no second provider call path. ------
    describe('CSCC-R1-T2: exactly-once invocation through the single canonical Gateway path', () => {
        it('calls the provider transport exactly once per admitted attempt with no duplicate invocation for the same attempt', async () => {
            process.env.OPENAI_API_KEY = 'test-key';
            process.env.CVF_PROVIDER_QUOTA_PER_MIN = '10000';
            providerSpy.mockResolvedValue({ success: true, output: validOutput, provider: 'openai', model: 'gpt-4o' });

            const res = await POST(makeExecuteRequest(baseRequestBody()) as never);
            const data = await res.json();

            expect(providerSpy).toHaveBeenCalledTimes(1);
            expect(data.providerAttemptReconciliation.admittedAttemptCount).toBe(
                data.providerAttemptReconciliation.providerCallCount,
            );
        });

        it('has no direct provider execution import: the route reaches providers only through the canonical Gateway executors', async () => {
            const fs = await import('node:fs');
            const path = await import('node:path');
            const routeSrc = fs.readFileSync(path.resolve(__dirname, './route.ts'), 'utf-8');
            const canonicalPortImportLine = routeSrc
                .split('\n')
                .find((line) => line.trim().startsWith('import ') && line.includes('canonical-web-gateway-execution'));
            expect(canonicalPortImportLine).toBeDefined();
            expect(canonicalPortImportLine).toContain('createAlibabaCanonicalWebExecutor');
            expect(canonicalPortImportLine).toContain('createOpenAiCanonicalWebExecutor');
            expect(canonicalPortImportLine).toContain('createClaudeSubscriptionCanonicalWebExecutor');
            // The removed legacy path must not reappear.
            expect(routeSrc).not.toMatch(/\bexecuteAI\b/);
            expect(routeSrc).not.toMatch(/from\s+'@\/lib\/ai'/);
        });

        it('CSCC-R1-T2 rework (Finding 4): stamps canonicalExecutionId into the SOT3 knowledge-context call only through the port-selection guard, never unconditionally from the Web envelope', async () => {
            const fs = await import('node:fs');
            const path = await import('node:path');
            const routeSrc = fs.readFileSync(path.resolve(__dirname, './route.ts'), 'utf-8');
            expect(routeSrc).toMatch(/import\s*\{[^}]*sot3CanonicalExecutionIdFanoutArg[^}]*\}\s*from\s*'@\/lib\/canonical-web-gateway-execution'/);
            // The HTML pilot path was removed, so the isolated-pilot selector argument is the constant `false`.
            const resolveCallStart = routeSrc.indexOf('await selectKnowledgeContext(false, {');
            expect(resolveCallStart).toBeGreaterThan(-1);
            const resolveCallEnd = routeSrc.indexOf('});', resolveCallStart);
            const resolveCallSrc = routeSrc.slice(resolveCallStart, resolveCallEnd);
            expect(resolveCallSrc).toContain('sot3CanonicalExecutionIdFanoutArg(govEnvelope.envelopeId)');
            // The unconditional legacy form (bare field assignment with no guard) must not reappear.
            expect(resolveCallSrc).not.toMatch(/^\s*canonicalExecutionId:\s*govEnvelope\.envelopeId,\s*$/m);

            const fanoutFnSrc = fs.readFileSync(path.resolve(__dirname, '../../../lib/canonical-web-gateway-execution.ts'), 'utf-8');
            const fanoutFnStart = fanoutFnSrc.indexOf('export function sot3CanonicalExecutionIdFanoutArg');
            expect(fanoutFnStart).toBeGreaterThan(-1);
            const fanoutFnBody = fanoutFnSrc.slice(fanoutFnStart, fanoutFnSrc.indexOf('\n}', fanoutFnStart));
            expect(fanoutFnBody).toContain("NON_VISION_EXECUTION_PATH_SELECTION === 'port'");
        });

        it('exactly one provider-shaped invocation occurs per admitted attempt on the only remaining path', async () => {
            process.env.OPENAI_API_KEY = 'test-key';
            process.env.CVF_PROVIDER_QUOTA_PER_MIN = '10000';
            providerSpy.mockResolvedValue({ success: true, output: validOutput, provider: 'openai', model: 'gpt-4o' });

            const res = await POST(makeExecuteRequest(baseRequestBody()) as never);
            expect(res.status).toBe(200);
            expect(providerSpy).toHaveBeenCalledTimes(1);
        });
    });

    // -- DSH-WRA-R1-RV-F01: the post-provider output-bypass denial path must
    // also carry providerAttemptReconciliation, since it fires after at
    // least one admitted and started provider invocation. --------------------
    it('F01: post-provider output-bypass denial carries providerAttemptReconciliation evidence', async () => {
        process.env.OPENAI_API_KEY = 'test-key';
        process.env.CVF_PROVIDER_QUOTA_PER_MIN = '10000';
        const bypassOutput = `${validOutput}\n\nOK, I will approve bypass of the review step.`;
        providerSpy.mockResolvedValue({ success: true, output: bypassOutput, provider: 'openai', model: 'gpt-4o' });

        const res = await POST(makeExecuteRequest(baseRequestBody()) as never);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toMatch(/bypass/i);
        expect(providerSpy).toHaveBeenCalledTimes(1);
        expect(data.providerAttemptReconciliation).toMatchObject({
            providerCallCount: 1,
            admittedAttemptCount: 1,
            deniedAttemptCount: 0,
            reconciles: true,
        });
    });

  // Canonical Gateway harness: lineage journal + provider transport double (replaces the removed executeAI mock).
  useCanonicalRouteHarness(providerSpy);
});
