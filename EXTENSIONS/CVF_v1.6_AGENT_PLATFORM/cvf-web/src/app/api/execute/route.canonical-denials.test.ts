// Text Encoding Exception: Vietnamese data fixtures verify UTF-8 fidelity and accepted user input.
/**
 * Canonical route denials: behaviour intentionally removed with the legacy direct provider path (unsupported
 * providers, web build handoff, router fallback) and the explicit failure contracts of the canonical Gateway path
 * (missing key, incomplete output). Split out of route.test.ts to keep that file under its governed size budget.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

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
    withSessionAuditPayload: (_session: unknown, payload?: Record<string, unknown>) => payload,
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
import { resetRateLimitStoresForTest } from '@/lib/rate-limit';

const strategyInputs = { topic: 'SMB market', context: 'Compare market opportunities for SMBs' };

function makeExecuteRequest(body: Record<string, unknown>): Request {
    return new Request('http://localhost/api/execute', {
        method: 'POST',
        body: JSON.stringify({ templateId: 'strategy_analysis', ...body }),
    });
}

describe('/api/execute canonical denials and explicit failures', () => {
    const originalEnv = {
        ...process.env,
        CVF_RATE_LIMIT: '10000',
        CVF_PROVIDER_QUOTA_PER_MIN: '10000',
    };
    const validOutput = '## Governed Response\n\nThis response provides a structured recommendation with enough detail to satisfy output validation requirements.\n\n1. Review the request context carefully.\n2. Apply the governed execution plan.\n3. Return a concise, safe outcome for the operator.';
    let tempDir = '';

    beforeEach(async () => {
        tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-execute-denials-'));
        providerSpy.mockReset();
        evaluateEnforcementMock.mockReset().mockReturnValue({ status: 'ALLOW', reasons: [] });
        verifySessionCookieMock.mockReset().mockResolvedValue({
            userId: 'user-tester', user: 'tester', role: 'admin', orgId: 'org-1', teamId: 'team-1', expiresAt: Date.now() + 1000 * 60 * 60,
        });
        checkTeamQuotaMock.mockReset().mockResolvedValue({ exceeded: false, currentUSD: 0, softCapUSD: 0, hardCapUSD: 0, overrideActive: false });
        appendAuditEventMock.mockReset().mockResolvedValue({ id: 'test-audit-event-id' });
        appendCostEventMock.mockReset();
        resetRateLimitStoresForTest();
        process.env = { ...originalEnv };
        for (const name of ['OPENAI_API_KEY', 'CVF_OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GOOGLE_AI_API_KEY', 'ALIBABA_API_KEY', 'DASHSCOPE_API_KEY',
            'CVF_BENCHMARK_ALIBABA_KEY', 'CVF_ALIBABA_API_KEY', 'OPENROUTER_API_KEY', 'DEEPSEEK_API_KEY', 'DEFAULT_AI_PROVIDER', 'CVF_SESSION_SECRET']) delete process.env[name];
        // Hermetic: every file the route writes lives in the temp dir.
        process.env.CVF_FALSE_POSITIVE_REPORTS_PATH = path.join(tempDir, 'false-positive-events.jsonl');
        process.env.CVF_CONTROL_PLANE_EVENTS_PATH = path.join(tempDir, 'events.json');
    });

    afterEach(async () => {
        process.env = { ...originalEnv };
        if (tempDir) await rm(tempDir, { recursive: true, force: true });
    });

    it('denies explicit DeepSeek V4 Pro calls: direct DeepSeek execution was removed with the legacy provider path', async () => {
        // Intentionally removed behaviour: only Alibaba, OpenAI and Claude subscription are canonical providers.
        // The DeepSeek token budget mapping itself stays covered by resolveExecutionMaxTokens below.
        process.env.DEEPSEEK_API_KEY = 'test-key';
        const fetchSpy = vi.fn();
        vi.stubGlobal('fetch', fetchSpy);

        const req = makeExecuteRequest({
                templateId: 'feature_prioritization',
                templateName: 'Feature Prioritization',
                intent: 'Prioritize features for a small product team',
                inputs: {
                    features: 'Waitlist, checkout reminders, admin dashboard',
                    goal: 'Pick MVP scope',
                    constraints: 'Small team',
                    framework: 'RICE',
                },
                provider: 'deepseek',
                model: 'deepseek-v4-pro',
        });

        const res = await POST(req as never);
        const data = await res.json();
        expect(res.status).toBe(403);
        expect(data.error).toBe('This route supports Alibaba, OpenAI and Claude subscription text requests only.');
        expect(providerSpy).not.toHaveBeenCalled();
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('returns 400 naming the provider when the requested OpenAI provider has no server key', async () => {
        const fetchSpy = vi.fn();
        vi.stubGlobal('fetch', fetchSpy);
        const req = makeExecuteRequest({
                templateName: 'Strategy',
                intent: 'Analyze',
                inputs: strategyInputs,
                provider: 'openai',
        });

        const res = await POST(req as never);
        const data = await res.json();
        expect(res.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.provider).toBe('openai');
        expect(data.error).toMatch(/API key not configured for provider: openai/);
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('does not silently route to another configured provider when the requested provider has no key', async () => {
        // Intentionally removed behaviour: the legacy router fallback to any configured provider (here Claude).
        process.env.ANTHROPIC_API_KEY = 'claude-key';
        const fetchSpy = vi.fn();
        vi.stubGlobal('fetch', fetchSpy);

        const req = makeExecuteRequest({
                templateName: 'Strategy',
                intent: 'Analyze the market',
                inputs: strategyInputs,
                provider: 'openai',
        });

        const res = await POST(req as never);
        const data = await res.json();
        expect(res.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.provider).toBe('openai');
        expect(data.error).toMatch(/API key not configured for provider: openai/);
        expect(providerSpy).not.toHaveBeenCalled();
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('denies the web_build_handoff template: web build handoff was removed from the canonical text route', async () => {
        // Intentionally removed behaviour (was: trusted-form build wording needs no skill preflight for web_build_handoff).
        process.env.OPENAI_API_KEY = 'test-key';

        const req = makeExecuteRequest({
                templateId: 'web_build_handoff',
                templateName: 'Web Build Handoff',
                intent: 'Create a build handoff packet for an agent to implement later',
                inputs: {
                    siteGoal: 'Website giới thiệu sản phẩm',
                    audience: 'Khách hàng SMB',
                    constraints: 'Không thực thi code trong lượt này',
                },
                provider: 'openai',
                mode: 'governance',
                action: 'analyze template execution request',
        });

        const res = await POST(req as never);
        const data = await res.json();

        expect(res.status).toBe(403);
        expect(data.error).toBe('This route supports Alibaba, OpenAI and Claude subscription text requests only.');
        expect(evaluateEnforcementMock).not.toHaveBeenCalled();
        expect(providerSpy).not.toHaveBeenCalled();
    });

    it('does not require skill preflight when a trusted-form generated intent contains build wording', async () => {
        process.env.OPENAI_API_KEY = 'test-key';
        providerSpy.mockResolvedValue({
            success: true,
            output: validOutput,
            provider: 'openai',
            model: 'gpt-4o',
        });

        const req = makeExecuteRequest({
                templateId: 'api_design',
                templateName: 'API Design',
                intent: 'Create a build handoff packet for an agent to implement later',
                inputs: {
                    apiName: 'Booking Reminder API',
                    endpoints: 'Create booking, update booking, send reminder',
                    auth: 'Session token',
                },
                provider: 'openai',
                mode: 'governance',
                action: 'analyze template execution request',
        });

        const res = await POST(req as never);
        const data = await res.json();

        expect(res.status, JSON.stringify({
            error: data.error,
            code: data.code,
            riskLevel: data.governanceEnvelope?.riskLevel,
            guard: data.guardResult?.blockedBy ?? data.guardResult?.escalatedBy,
        })).toBe(200);
        expect(data.success).toBe(true);
        expect(evaluateEnforcementMock).toHaveBeenCalledWith(
            expect.objectContaining({
                requiresSkillPreflight: false,
            }),
        );
    });

    it('treats an empty successful provider answer as an incomplete provider output (no validator retry)', async () => {
        process.env.OPENAI_API_KEY = 'test-key';
        providerSpy.mockResolvedValue({
            success: true,
            output: '',
            provider: 'openai',
            model: 'gpt-4o',
        });

        const req = makeExecuteRequest({
                templateName: 'Strategy',
                intent: 'Analyze the market carefully',
                inputs: strategyInputs,
                provider: 'openai',
        });

        const res = await POST(req as never);
        const data = await res.json();

        // The Gateway adapter rejects a blank answer itself (output_incomplete); it is one admitted attempt, not a retry sequence.
        expect(res.status).toBe(200);
        expect(data.diagnostic).toMatchObject({ class: 'provider_parse_error', retryable: false });
        expect(data.success).toBe(false);
        expect(data.output).toBeUndefined();
        expect(data.canonicalGateway.providerDiagnostic.code).toBe('output_incomplete');
        expect(providerSpy).toHaveBeenCalledTimes(1);
    });

    // Side-effect-free refusals: nothing past provider routing (knowledge/SOT3, memory, lineage, provider) may run.
    async function spyOnDownstreamEffects() {
        const selection = await import('./route-context-selection');
        const knowledge = vi.spyOn(selection, 'selectKnowledgeContext');
        const memory = vi.spyOn(selection, 'resolveMemoryContext');
        const fetchSpy = vi.fn();
        vi.stubGlobal('fetch', fetchSpy);
        return { knowledge, memory, fetchSpy };
    }
    const sot3OrKnowledgeAudit = () => appendAuditEventMock.mock.calls
        .map((call: unknown[]) => (call[0] as { eventType?: string }).eventType ?? '')
        .filter(type => /SOT3|KNOWLEDGE|MEMORY/i.test(type));

    it('refuses a keyless request before knowledge, SOT3, memory, lineage or provider effects', async () => {
        const effects = await spyOnDownstreamEffects();
        const res = await POST(makeExecuteRequest({ templateName: 'Strategy', intent: 'Analyze the market', inputs: strategyInputs, provider: 'openai' }) as never);
        const data = await res.json();
        expect(res.status).toBe(400);
        expect(data.error).toMatch(/API key not configured for provider: openai/);
        expect(effects.knowledge).not.toHaveBeenCalled();
        expect(effects.memory).not.toHaveBeenCalled();
        expect(effects.fetchSpy).not.toHaveBeenCalled();
        expect(providerSpy).not.toHaveBeenCalled();
        expect(sot3OrKnowledgeAudit()).toEqual([]);
        expect(data.canonicalLineage).toBeUndefined();
    });

    it.each(['o1', 'o3-mini', 'gpt-5-mini', 'gpt-6.2-sol', 'gpt-6.2-astra', 'gpt-4-turbo', 'gpt-4o-2099', 'attacker-model'])('refuses OpenAI model %s with MODEL_NOT_ALLOWED before any effect', async model => {
        process.env.OPENAI_API_KEY = 'test-key';
        const effects = await spyOnDownstreamEffects();
        const res = await POST(makeExecuteRequest({ templateName: 'Strategy', intent: 'Analyze the market', inputs: strategyInputs, provider: 'openai', model }) as never);
        const data = await res.json();
        expect(res.status).toBe(400);
        expect(data.code).toBe('MODEL_NOT_ALLOWED');
        expect(data.provider).toBe('openai');
        expect(JSON.stringify(data)).not.toContain('test-key');
        expect(effects.knowledge).not.toHaveBeenCalled();
        expect(effects.memory).not.toHaveBeenCalled();
        expect(effects.fetchSpy).not.toHaveBeenCalled();
        expect(providerSpy).not.toHaveBeenCalled();
        expect(sot3OrKnowledgeAudit()).toEqual([]);
        expect(data.canonicalLineage).toBeUndefined();
    });

    it.each(['gpt-4o-mini', 'gpt-4o', 'gpt-6-luna', 'gpt-6.1-terra', undefined])('admits the offered OpenAI model %s', async model => {
        process.env.OPENAI_API_KEY = 'test-key';
        providerSpy.mockResolvedValue({ success: true, output: validOutput });
        const res = await POST(makeExecuteRequest({ templateName: 'Strategy', intent: 'Analyze the market', inputs: strategyInputs, provider: 'openai', ...(model ? { model } : {}) }) as never);
        expect(res.status).toBe(200);
        expect(providerSpy).toHaveBeenCalledTimes(1);
        expect(providerSpy.mock.calls[0][3]).toMatchObject({ model: model ?? 'gpt-4o-mini' });
    });

    it('extends the allowlist only through the server-side CVF_OPENAI_ALLOWED_MODELS list', async () => {
        process.env.OPENAI_API_KEY = 'test-key';
        process.env.CVF_OPENAI_ALLOWED_MODELS = 'gpt-5-mini, not a model id';
        providerSpy.mockResolvedValue({ success: true, output: validOutput });
        const allowed = await POST(makeExecuteRequest({ templateName: 'Strategy', intent: 'Analyze the market', inputs: strategyInputs, provider: 'openai', model: 'gpt-5-mini' }) as never);
        expect(allowed.status).toBe(200);
        const denied = await POST(makeExecuteRequest({ templateName: 'Strategy', intent: 'Analyze the market', inputs: strategyInputs, provider: 'openai', model: 'o1' }) as never);
        expect(denied.status).toBe(400);
        expect((await denied.json()).code).toBe('MODEL_NOT_ALLOWED');
    });

  // Canonical Gateway harness: lineage journal + provider transport double.
  useCanonicalRouteHarness(providerSpy);
});
