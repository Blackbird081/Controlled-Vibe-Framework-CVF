import { describe, expect, it, vi } from 'vitest';
import {
  ALIBABA_DASHSCOPE_INTL_ENDPOINT,
  ALIBABA_DASHSCOPE_MAINLAND_ENDPOINT,
  resolveAlibabaDashScopeEndpoint,
} from 'cvf-model-gateway';
import {
  classifyDestination,
  createProviderExecutionFetchGuard,
} from './provider-execution-guard';

// EAFR-R10. classifyDestination is a thin Request-to-URL compatibility
// wrapper over the exact public gateway policy interface. Diagnostic helper
// exports are intentionally unnecessary: tests exercise the public
// three-variant classifier directly.

const grant = JSON.stringify({
  authority: 'ORCHESTRATOR_GRANT_REQUIRED',
  grantId: 'grant-001',
  authorizedBy: 'ORCHESTRATOR',
  subjectAgentId: 'worker-001',
  delegationId: 'delegation-001',
  allowedProviders: ['openai'],
  maxCalls: 1,
  expiresAt: '2026-08-26T00:00:00.000Z',
});

const baseEnv = {
  CVF_AGENT_ID: 'worker-001',
  CVF_DELEGATION_ID: 'delegation-001',
  CVF_PROVIDER_EXECUTION_GRANT_ID: 'grant-001',
  CVF_PROVIDER_EXECUTION_GRANT_JSON: grant,
};

describe('provider execution fetch guard', () => {
  it('denies a provider request when no orchestrator grant exists', async () => {
    const underlying = vi.fn();
    const guarded = createProviderExecutionFetchGuard(underlying as typeof fetch, {}, () => new Date('2026-08-25'));
    await expect(guarded('https://api.openai.com/v1/chat/completions')).rejects.toThrow(
      'CVF_PROVIDER_EXECUTION_DENIED',
    );
    expect(underlying).not.toHaveBeenCalled();
  });

  it('allows only the bounded call granted by the orchestrator', async () => {
    const underlying = vi.fn().mockResolvedValue(new Response('ok'));
    const guarded = createProviderExecutionFetchGuard(underlying as typeof fetch, baseEnv, () => new Date('2026-08-25'));
    await guarded('https://api.openai.com/v1/chat/completions');
    await expect(guarded('https://api.openai.com/v1/chat/completions')).rejects.toThrow('call budget exhausted');
    expect(underlying).toHaveBeenCalledOnce();
  });

  it.each([
    ['wrong subject', { ...baseEnv, CVF_AGENT_ID: 'worker-002' }],
    ['wrong delegation', { ...baseEnv, CVF_DELEGATION_ID: 'delegation-002' }],
    ['wrong grant id', { ...baseEnv, CVF_PROVIDER_EXECUTION_GRANT_ID: 'grant-002' }],
  ])('denies %s', async (_label, env) => {
    const underlying = vi.fn();
    const guarded = createProviderExecutionFetchGuard(underlying as typeof fetch, env, () => new Date('2026-08-25'));
    await expect(guarded('https://api.openai.com/v1/chat/completions')).rejects.toThrow('DENIED');
    expect(underlying).not.toHaveBeenCalled();
  });
});

// EAFR-R7 fail-closed default. The pre-repair control returned the unwrapped
// fetch whenever a hostname was absent from its map, so these cases previously
// reached the network.
describe('fail-closed egress default', () => {
  it('denies an arbitrary unrecognised hostname before any network call', async () => {
    const underlying = vi.fn();
    const guarded = createProviderExecutionFetchGuard(underlying as typeof fetch, {}, () => new Date('2026-08-25'));
    await expect(guarded('https://example.com/data')).rejects.toThrow(
      'CVF_PROVIDER_EXECUTION_DENIED',
    );
    expect(underlying).not.toHaveBeenCalled();
  });

  it('denies an unrecognised hostname even when a valid grant is present', async () => {
    const underlying = vi.fn();
    const guarded = createProviderExecutionFetchGuard(underlying as typeof fetch, baseEnv, () => new Date('2026-08-25'));
    await expect(guarded('https://attacker.invalid/v1/chat/completions')).rejects.toThrow(
      'unrecognised egress destination',
    );
    expect(underlying).not.toHaveBeenCalled();
  });

  it('denies a non-http protocol destination', async () => {
    const underlying = vi.fn();
    const guarded = createProviderExecutionFetchGuard(underlying as typeof fetch, {}, () => new Date('2026-08-25'));
    await expect(guarded('ftp://example.com/payload')).rejects.toThrow('unsupported protocol');
    expect(underlying).not.toHaveBeenCalled();
  });

  it('denies a protocol-relative external hostname before any network call', async () => {
    const underlying = vi.fn();
    const guarded = createProviderExecutionFetchGuard(underlying as typeof fetch, {}, () => new Date('2026-08-25'));
    await expect(guarded('//attacker.invalid/payload')).rejects.toThrow(
      'unparseable request destination',
    );
    expect(underlying).not.toHaveBeenCalled();
  });

  it.each([
    ['loopback host', 'http://localhost:3000/api/health'],
    ['loopback ip', 'http://127.0.0.1:3000/api/health'],
    ['relative path', '/api/health'],
    ['data uri', 'data:text/plain,ok'],
    ['blob uri', 'blob:https://localhost/test-fixture'],
    ['file uri', 'file:///tmp/test-fixture'],
  ])('permits legitimate non-provider traffic: %s', async (_label, target) => {
    const underlying = vi.fn().mockResolvedValue(new Response('ok'));
    const guarded = createProviderExecutionFetchGuard(underlying as typeof fetch, {}, () => new Date('2026-08-25'));
    await guarded(target);
    expect(underlying).toHaveBeenCalledOnce();
  });

  it('does not consume provider authority for permitted non-provider traffic', async () => {
    const underlying = vi.fn().mockResolvedValue(new Response('ok'));
    const guarded = createProviderExecutionFetchGuard(underlying as typeof fetch, baseEnv, () => new Date('2026-08-25'));
    await guarded('http://localhost:3000/api/health');
    // The single granted provider call must still be available.
    await guarded('https://api.openai.com/v1/chat/completions');
    expect(underlying).toHaveBeenCalledTimes(2);
  });
});

// EAFR-R7 endpoint authority derivation. Coverage must come from the gateway,
// which owns endpoint constants, and never from provider identity.
describe('endpoint authority derivation', () => {
  it('covers a gateway endpoint constant that this guard never names literally', () => {
    // Negative derivation test: the mainland hostname appears nowhere in the
    // guard source as a literal. It is covered only because the gateway
    // exports the constant it is derived from.
    expect(classifyDestination(ALIBABA_DASHSCOPE_MAINLAND_ENDPOINT)).toEqual({
      kind: 'provider',
      provider: 'alibaba',
    });
  });

  it('covers both DashScope endpoints rather than inferring from provider identity', () => {
    expect(classifyDestination(ALIBABA_DASHSCOPE_INTL_ENDPOINT)).toEqual({
      kind: 'provider', provider: 'alibaba',
    });
    expect(classifyDestination(ALIBABA_DASHSCOPE_MAINLAND_ENDPOINT)).toEqual({
      kind: 'provider', provider: 'alibaba',
    });
  });

  it('denies the mainland endpoint without a grant, exactly as the intl endpoint is denied', async () => {
    const underlying = vi.fn();
    const guarded = createProviderExecutionFetchGuard(underlying as typeof fetch, {}, () => new Date('2026-08-25'));
    await expect(guarded(ALIBABA_DASHSCOPE_MAINLAND_ENDPOINT)).rejects.toThrow(
      'CVF_PROVIDER_EXECUTION_DENIED',
    );
    expect(underlying).not.toHaveBeenCalled();
  });

  it('recognises every derived and declared provider hostname', () => {
    const expected = [
      ['https://api.anthropic.com/v1/messages', 'claude'],
      ['https://api.deepseek.com/v1/chat/completions', 'deepseek'],
      ['https://api.openai.com/v1/chat/completions', 'openai'],
      [ALIBABA_DASHSCOPE_INTL_ENDPOINT, 'alibaba'],
      [ALIBABA_DASHSCOPE_MAINLAND_ENDPOINT, 'alibaba'],
      ['https://generativelanguage.googleapis.com/v1beta/models', 'gemini'],
      ['https://openrouter.ai/api/v1/chat/completions', 'openrouter'],
    ];
    for (const [endpoint, provider] of expected) {
      expect(classifyDestination(endpoint)).toEqual({ kind: 'provider', provider });
    }
  });
});

// EAFR-R7 environment override row. resolveAlibabaDashScopeEndpoint accepts
// three variables and can return any hostname.
describe('environment endpoint overrides', () => {
  it.each([
    ['DASHSCOPE_COMPAT_ENDPOINT'],
    ['ALIBABA_DASHSCOPE_ENDPOINT'],
    ['CVF_ALIBABA_DASHSCOPE_ENDPOINT'],
  ])('denies an arbitrary hostname injected through %s', async (envName) => {
    const resolved = resolveAlibabaDashScopeEndpoint({
      [envName]: 'https://exfil.invalid/compatible-mode/v1/chat/completions',
    });
    expect(new URL(resolved).hostname).toBe('exfil.invalid');

    const underlying = vi.fn();
    const guarded = createProviderExecutionFetchGuard(underlying as typeof fetch, baseEnv, () => new Date('2026-08-25'));
    await expect(guarded(resolved)).rejects.toThrow('unrecognised egress destination');
    expect(underlying).not.toHaveBeenCalled();
  });

  it('still permits an override that resolves to a covered endpoint', () => {
    const resolved = resolveAlibabaDashScopeEndpoint({
      DASHSCOPE_COMPAT_ENDPOINT: ALIBABA_DASHSCOPE_MAINLAND_ENDPOINT,
    });
    expect(classifyDestination(resolved)).toEqual({ kind: 'provider', provider: 'alibaba' });
  });
});

// EAFR-R7 caller-supplied adapter endpoint row. Identity validation is not
// destination validation; a covered providerId paired with an arbitrary
// endpoint must not reach the network through a guarded fetch.
describe('caller-supplied adapter endpoints', () => {
  it('denies a covered providerId paired with an arbitrary endpoint', async () => {
    const underlying = vi.fn();
    const guarded = createProviderExecutionFetchGuard(underlying as typeof fetch, baseEnv, () => new Date('2026-08-25'));

    // Simulates createOpenAiCompatibleExecuteAdapter({ providerId: 'openai',
    // endpoint: <arbitrary>, fetchImpl: guarded }).
    await expect(guarded('https://evil.example.net/v1/chat/completions')).rejects.toThrow(
      'unrecognised egress destination',
    );
    expect(underlying).not.toHaveBeenCalled();
  });

  it('classifies destinations without consulting any provider identity', () => {
    // The same providerId cannot make an unknown destination permitted.
    expect(classifyDestination('https://evil.example.net/v1/chat/completions').kind).toBe('deny');
    expect(classifyDestination('https://api.openai.com/v1/chat/completions')).toEqual({
      kind: 'provider',
      provider: 'openai',
    });
  });
});
