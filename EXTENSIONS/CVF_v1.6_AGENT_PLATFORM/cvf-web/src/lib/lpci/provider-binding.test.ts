import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  CredentialBoundary,
  GatewayReceiptBuilder,
  type GatewayExecuteRequest,
  type OpenAiCompatibleFetch,
  type ProviderExecutionBridgeResult,
} from 'cvf-model-gateway';
import {
  executeLpciProviderBinding,
  LPCI_PROVIDER_ATTEMPT_TIMEOUT_MS,
  resolveLpciProviderBindingConfig,
} from './provider-binding';

const validEnv = {
  LPCI_LLM_API_KEY: 'fake-lpci-test-secret',
  LPCI_LLM_MODEL: 'openai/gpt-4o',
  LPCI_LLM_ENDPOINT: 'https://api.openai.com/v1/chat/completions',
};

const bindingInput = {
  prompt: 'leave policy',
  systemPrompt: 'Use only {"modelEvidenceProjection":[]}',
};

function receipt(traceId: string, providerId = 'openai', modelId = 'gpt-4o') {
  return new GatewayReceiptBuilder(
    () => new Date('2026-08-09T00:00:00.000Z'),
    () => 'test',
  ).build({
    traceId,
    providerId,
    selectedModelId: modelId,
    decision: 'selected',
    reason: 'test',
    validationState: 'passed',
  });
}

function bridgeResult(
  traceId: string,
  overrides: Partial<ProviderExecutionBridgeResult> = {},
): ProviderExecutionBridgeResult {
  return {
    response: {
      traceId,
      text: 'Based on retrieved documents only. Answer.',
      model: { providerId: 'openai', modelId: 'gpt-4o' },
    },
    receipt: receipt(traceId),
    ...overrides,
  };
}

describe('LPCI Model Gateway provider binding', () => {
  it('SP-01 executes one exact OpenAI pair through an injected fetch double', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: 'Based on retrieved documents only. Answer.' } }],
      }),
    })) as unknown as OpenAiCompatibleFetch;

    const result = await executeLpciProviderBinding(bindingInput, {
      env: validEnv,
      fetchImpl,
      traceId: () => 'sp-01',
    });

    expect(result).toEqual({
      outcome: 'ANSWER_EMITTED',
      response: 'Based on retrieved documents only. Answer.',
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [endpoint, init] = vi.mocked(fetchImpl).mock.calls[0];
    expect(endpoint).toBe('https://api.openai.com/v1/chat/completions');
    expect(JSON.parse(init.body)).toMatchObject({ model: 'gpt-4o', stream: false });
    expect(init.body).toContain('modelEvidenceProjection');
  });

  it.each([
    ['missing', undefined],
    ['blank', '   '],
  ])('SP-02 maps %s credential to no-provider before bridge execution', async (_label, key) => {
    const execute = vi.fn();
    const result = await executeLpciProviderBinding(bindingInput, {
      env: { ...validEnv, LPCI_LLM_API_KEY: key },
      bridge: { execute },
      traceId: () => 'sp-02',
    });
    expect(result).toEqual({ outcome: 'NO_PROVIDER_CONFIGURED' });
    expect(execute).not.toHaveBeenCalled();
  });

  it('SP-02 preserves non-empty credential bytes inside CredentialBoundary', async () => {
    const original = '  fake-secret-with-boundary-spaces  ';
    const boundary = new CredentialBoundary({ LPCI_LLM_API_KEY: original });
    const execute = vi.fn(async (request: GatewayExecuteRequest) => bridgeResult(request.traceId));
    const result = await executeLpciProviderBinding(bindingInput, {
      env: { LPCI_LLM_MODEL: 'openai/gpt-4o' },
      credential: boundary,
      bridge: { execute },
      traceId: () => 'sp-02-bytes',
    });
    expect(result.outcome).toBe('ANSWER_EMITTED');
    expect(boundary.resolveSecretForRuntime({
      providerId: 'openai', keyId: 'lpci-openai', envNames: ['LPCI_LLM_API_KEY'],
    })).toBe(original);
  });

  it('SP-03 maps missing model to no-provider before bridge execution', async () => {
    const execute = vi.fn();
    const result = await executeLpciProviderBinding(bindingInput, {
      env: { LPCI_LLM_API_KEY: 'fake' },
      bridge: { execute },
    });
    expect(result).toEqual({ outcome: 'NO_PROVIDER_CONFIGURED' });
    expect(execute).not.toHaveBeenCalled();
  });

  it.each(['openai/gpt-4o-mini', 'missing/model', 'openai/gpt-4o/extra', ' openai /gpt-4o'])
    ('SP-04 rejects unsupported or malformed pair %s before bridge execution', async (model) => {
      const execute = vi.fn();
      const result = await executeLpciProviderBinding(bindingInput, {
        env: { ...validEnv, LPCI_LLM_MODEL: model },
        bridge: { execute },
      });
      expect(result).toEqual({ outcome: 'PROVIDER_ERROR' });
      expect(execute).not.toHaveBeenCalled();
    });

  it.each([
    'http://api.openai.com/v1/chat/completions',
    'https://example.invalid/v1/chat/completions',
    'https://api.openai.com/v1/chat/completions?x=1',
  ])('SP-05 rejects arbitrary endpoint %s before bridge execution', async (endpoint) => {
    const execute = vi.fn();
    const result = await executeLpciProviderBinding(bindingInput, {
      env: { ...validEnv, LPCI_LLM_ENDPOINT: endpoint },
      bridge: { execute },
    });
    expect(result).toEqual({ outcome: 'PROVIDER_ERROR' });
    expect(execute).not.toHaveBeenCalled();
  });

  it('SP-06 maps a routing no-candidate result to safe provider error', async () => {
    const execute = vi.fn(async (request: GatewayExecuteRequest): Promise<ProviderExecutionBridgeResult> => ({
      error: {
        errorClass: 'no_candidate', traceId: request.traceId,
        message: 'internal routing detail', credentialShielded: true, retryable: false,
      },
      receipt: new GatewayReceiptBuilder().build({
        traceId: request.traceId, decision: 'no_candidate', reason: 'internal', validationState: 'not_run',
      }),
    }));
    expect(await executeLpciProviderBinding(bindingInput, {
      env: validEnv, bridge: { execute }, traceId: () => 'sp-06',
    })).toEqual({ outcome: 'PROVIDER_ERROR', diagnosticCode: 'PROVIDER_ERROR' });
  });

  it('SP-07 maps bridge credential failure without provider execution detail', async () => {
    const execute = vi.fn(async (request: GatewayExecuteRequest): Promise<ProviderExecutionBridgeResult> => ({
      error: {
        errorClass: 'credential_shielded', traceId: request.traceId,
        message: 'credential detail', credentialShielded: true, retryable: false,
      },
      receipt: receipt(request.traceId),
    }));
    const result = await executeLpciProviderBinding(bindingInput, {
      env: validEnv, bridge: { execute }, traceId: () => 'sp-07',
    });
    expect(result).toEqual({ outcome: 'PROVIDER_ERROR', diagnosticCode: 'PROVIDER_ERROR' });
    expect(JSON.stringify(result)).not.toContain('credential detail');
  });

  it('SP-08 shields adapter exceptions', async () => {
    const execute = vi.fn(async () => { throw new Error('sensitive provider diagnostic'); });
    const result = await executeLpciProviderBinding(bindingInput, {
      env: validEnv, bridge: { execute }, traceId: () => 'sp-08',
    });
    expect(result).toEqual({ outcome: 'PROVIDER_ERROR', diagnosticCode: 'PROVIDER_ERROR' });
    expect(JSON.stringify(result)).not.toContain('sensitive provider diagnostic');
  });

  it.each([
    ['empty response', (traceId: string) => bridgeResult(traceId, { response: {
      traceId, text: ' ', model: { providerId: 'openai', modelId: 'gpt-4o' },
    } })],
    ['trace mismatch', (traceId: string) => bridgeResult(traceId, { response: {
      traceId: 'other', text: 'answer', model: { providerId: 'openai', modelId: 'gpt-4o' },
    } })],
  ] as const)('SP-09 rejects %s', async (_label, makeResult) => {
    const execute = vi.fn(async (request: GatewayExecuteRequest) => makeResult(request.traceId));
    expect(await executeLpciProviderBinding(bindingInput, {
      env: validEnv, bridge: { execute }, traceId: () => 'sp-09',
    })).toEqual({ outcome: 'PROVIDER_ERROR', diagnosticCode: 'EXACT_PAIR_MISMATCH' });
  });

  it('SP-11 constrains the request to one provider with exact model and capability', async () => {
    const execute = vi.fn(async (request: GatewayExecuteRequest): Promise<ProviderExecutionBridgeResult> => ({
      error: {
        errorClass: 'no_candidate', traceId: request.traceId,
        message: 'configured provider unavailable', credentialShielded: true, retryable: false,
      },
      receipt: new GatewayReceiptBuilder().build({
        traceId: request.traceId, decision: 'no_candidate', reason: 'unavailable', validationState: 'not_run',
      }),
    }));
    await executeLpciProviderBinding(bindingInput, {
      env: validEnv, bridge: { execute }, traceId: () => 'sp-11',
    });
    const request = execute.mock.calls[0][0];
    expect(request.policy.allowedProviderIds).toEqual(['openai']);
    expect(request.routing).toMatchObject({
      requestedModelId: 'gpt-4o',
      requiredCapabilities: ['complete'],
    });
    expect(request.policy.allowedProviderIds).not.toContain('alibaba');
  });

  it('DS-12 forwards one signal, aborts at the fixed deadline, and does not retry', async () => {
    const controller = new AbortController();
    const abortSpy = vi.spyOn(controller, 'abort');
    const clearTimeoutImpl = vi.fn();
    const execute = vi.fn(async (
      request: GatewayExecuteRequest,
      options?: { signal?: AbortSignal },
    ) => {
      expect(options?.signal).toBe(controller.signal);
      return bridgeResult(request.traceId);
    });
    const setTimeoutImpl = vi.fn((callback: () => void, milliseconds: number) => {
      expect(milliseconds).toBe(LPCI_PROVIDER_ATTEMPT_TIMEOUT_MS);
      callback();
      return { callback } as unknown as ReturnType<typeof setTimeout>;
    });
    const result = await executeLpciProviderBinding(bindingInput, {
      env: validEnv,
      bridge: { execute },
      traceId: () => 'ds-12',
      abortController: () => controller,
      setTimeoutImpl,
      clearTimeoutImpl,
    });
    expect(result).toEqual({
      outcome: 'PROVIDER_TIMEOUT',
      diagnosticCode: 'PROVIDER_TIMEOUT',
    });
    expect(execute).toHaveBeenCalledTimes(1);
    expect(abortSpy).toHaveBeenCalledTimes(1);
    expect(clearTimeoutImpl).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['response provider', { providerId: 'alibaba', modelId: 'gpt-4o' }, 'openai', 'gpt-4o'],
    ['response model', { providerId: 'openai', modelId: 'other' }, 'openai', 'gpt-4o'],
    ['receipt provider', { providerId: 'openai', modelId: 'gpt-4o' }, 'alibaba', 'gpt-4o'],
    ['receipt model', { providerId: 'openai', modelId: 'gpt-4o' }, 'openai', 'other'],
  ])('SP-12 rejects %s mismatch', async (_label, responseModel, receiptProvider, receiptModel) => {
    const execute = vi.fn(async (request: GatewayExecuteRequest) => bridgeResult(request.traceId, {
      response: { traceId: request.traceId, text: 'answer', model: responseModel },
      receipt: receipt(request.traceId, receiptProvider, receiptModel),
    }));
    expect(await executeLpciProviderBinding(bindingInput, {
      env: validEnv, bridge: { execute }, traceId: () => 'sp-12',
    })).toEqual({ outcome: 'PROVIDER_ERROR', diagnosticCode: 'EXACT_PAIR_MISMATCH' });
  });

  it('keeps package and route ownership source-backed', () => {
    const route = readFileSync(resolve(process.cwd(), 'src/app/api/lpci/query/route.ts'), 'utf8');
    const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'));
    expect(route).toContain("from '@/lib/lpci/provider-binding'");
    expect(route).not.toMatch(/\bfetch\s*\(/);
    expect(packageJson.dependencies['cvf-model-gateway']).toBe('file:../../CVF_MODEL_GATEWAY');
  });

  it('parses the exact safe default endpoint without a supplied override', () => {
    expect(resolveLpciProviderBindingConfig({ LPCI_LLM_MODEL: 'openai/gpt-4o' })).toEqual({
      status: 'ok',
      config: {
        providerId: 'openai', modelId: 'gpt-4o',
        endpoint: 'https://api.openai.com/v1/chat/completions',
      },
    });
  });
});
