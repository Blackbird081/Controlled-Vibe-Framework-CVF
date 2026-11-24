/**
 * Shared test support for `/api/execute` route tests that run through the canonical Model Gateway path.
 *
 * The legacy direct `executeAI` provider path was removed (commit 2886167cc); the route now executes only through the
 * Gateway (`ProviderExecutionBridge`) with a lineage journal. These helpers keep the route tests hermetic:
 *   - `openRouteTestJournal` provisions a real temp SQLite lineage journal and points the server configuration at it.
 *   - `bridgeProviderSpyToFetch` replaces the network `fetch` with a transport double that decodes the real OpenAI-style
 *     request body produced by the Gateway adapter and forwards it to a spy, so tests can still assert the model, token
 *     limit and prompts the provider would have received, and script provider outcomes.
 * No real provider or network is ever contacted.
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, vi } from 'vitest';
import { SQLiteKeyedAtomicRecordStore } from '../../../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/atomic.sqlite.record.store';
import { LINEAGE_CONFIG_ENV, parseLineageConfig, provisionTenantMetadata } from '@/lib/server/canonical-web-lineage';

/**
 * Creates an initialized dedicated lineage journal and sets the server configuration env var. Call after any
 * `process.env = {...}` reset in `beforeEach`; call the returned function in `afterEach`.
 */
export function openRouteTestJournal(options: { tenants?: string[]; activeSlots?: number } = {}): () => void {
    const directory = mkdtempSync(path.join(tmpdir(), 'cvf-route-test-lineage-'));
    SQLiteKeyedAtomicRecordStore.initialize(directory);
    const tenants = options.tenants ?? ['org-1'];
    const raw = JSON.stringify({
        schema: 'cvf.webLineageConfig.v1', revision: 1, directory, namespace: 'cvf-web-lineage-route-test',
        tenants: tenants.map(tenantId => ({ tenantId, activeSlots: options.activeSlots ?? 50, archiveSlots: 50 })),
        servicePrincipal: { principalId: 'service-test', tenantId: tenants[0] },
    });
    const parsed = parseLineageConfig(raw);
    if (!parsed.ok) throw new Error(`route test journal config ${parsed.reason}`);
    if (!provisionTenantMetadata(parsed.config).ok) throw new Error('route test journal provisioning failed');
    process.env[LINEAGE_CONFIG_ENV] = raw;
    return () => { try { rmSync(directory, { recursive: true, force: true }); } catch { /* temp dir cleanup is best effort */ } };
}

/** The call a provider would have received, decoded from the Gateway adapter's real request body. */
export interface BridgedProviderOptions {
    model: string;
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
    signal?: AbortSignal;
}
/** Scripted provider outcome in the legacy `ExecutionResponse` shape (success/output/usage/error). */
export interface BridgedProviderOutcome {
    success?: boolean;
    output?: string;
    error?: string;
    usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
    finishReason?: string;
}
export type BridgedProviderSpy = (provider: string, apiKey: string, userPrompt: string, options: BridgedProviderOptions) => unknown;

function providerOfUrl(url: string): string {
    if (url.includes('api.openai.com')) return 'openai';
    if (url.includes('dashscope') || url.includes('aliyuncs')) return 'alibaba';
    return 'unknown';
}

/**
 * Stubs global `fetch` with a transport double. Each request is decoded and forwarded to `spy(provider, apiKey,
 * userPrompt, options)`; the spy's resolved value is returned to the Gateway adapter as an OpenAI-compatible HTTP
 * response (`success: false` becomes HTTP 500; a rejection becomes a transport failure). Returns the fetch mock.
 */
export function bridgeProviderSpyToFetch(spy: BridgedProviderSpy) {
    const fetchMock = vi.fn(async (url: string, init: { body: string; headers: Record<string, string>; signal?: AbortSignal }) => {
        const payload = JSON.parse(String(init.body)) as { model: string; messages: Array<{ role: string; content: string }>; max_tokens?: number; max_completion_tokens?: number; temperature?: number };
        const system = payload.messages.find(message => message.role === 'system')?.content;
        const user = payload.messages.find(message => message.role === 'user')?.content ?? '';
        const apiKey = String(init.headers.Authorization ?? '').replace(/^Bearer /, '');
        const outcome = await spy(providerOfUrl(String(url)), apiKey, user, {
            model: payload.model, ...(system !== undefined ? { systemPrompt: system } : {}),
            maxTokens: payload.max_tokens ?? payload.max_completion_tokens, temperature: payload.temperature, signal: init.signal,
        }) as BridgedProviderOutcome | undefined;
        if (!outcome) throw new TypeError('provider spy returned no scripted outcome');
        if (outcome.success === false) return new Response(JSON.stringify({ error: { message: 'scripted provider failure' } }), { status: 500 });
        const usage = outcome.usage;
        return new Response(JSON.stringify({
            choices: [{ message: { content: outcome.output ?? '' }, finish_reason: outcome.finishReason ?? 'stop' }],
            ...(usage ? { usage: { prompt_tokens: usage.inputTokens, completion_tokens: usage.outputTokens, total_tokens: usage.totalTokens } } : {}),
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
}

/**
 * Registers per-test hooks inside the calling `describe`: a fresh lineage journal and the provider transport double.
 * Call it as the LAST statement of the describe body so its `beforeEach` runs after the test's own environment reset.
 */
export function useCanonicalRouteHarness(spy: BridgedProviderSpy, options: { tenants?: string[]; activeSlots?: number } = {}): void {
    let cleanup: (() => void) | undefined;
    beforeEach(() => {
        cleanup = openRouteTestJournal(options);
        bridgeProviderSpyToFetch(spy);
    });
    afterEach(() => {
        vi.unstubAllGlobals();
        cleanup?.();
        cleanup = undefined;
    });
}
