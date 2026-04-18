import { describe, expect, it } from 'vitest';

import {
  ALIBABA_API_KEY_ENV_NAMES,
  isAlibabaApiKeyConfigured,
  resolveAlibabaApiKey,
} from './alibaba-env';

function mockEnv(values: Record<string, string>): NodeJS.ProcessEnv {
  return values as NodeJS.ProcessEnv;
}

describe('alibaba-env', () => {
  it('prefers canonical ALIBABA_API_KEY when multiple aliases are present', () => {
    const key = resolveAlibabaApiKey(mockEnv({
      ALIBABA_API_KEY: 'primary-key',
      CVF_BENCHMARK_ALIBABA_KEY: 'benchmark-key',
      CVF_ALIBABA_API_KEY: 'legacy-key',
    }));

    expect(key).toBe('primary-key');
  });

  it('falls back to compatibility aliases when canonical env is absent', () => {
    expect(
      resolveAlibabaApiKey(mockEnv({
        CVF_BENCHMARK_ALIBABA_KEY: 'benchmark-key',
      })),
    ).toBe('benchmark-key');

    expect(
      resolveAlibabaApiKey(mockEnv({
        CVF_ALIBABA_API_KEY: 'legacy-key',
      })),
    ).toBe('legacy-key');
  });

  it('reports configured state only when a non-empty key is available', () => {
    expect(isAlibabaApiKeyConfigured(mockEnv({ ALIBABA_API_KEY: 'key' }))).toBe(true);
    expect(isAlibabaApiKeyConfigured(mockEnv({ CVF_BENCHMARK_ALIBABA_KEY: 'key' }))).toBe(true);
    expect(isAlibabaApiKeyConfigured(mockEnv({ ALIBABA_API_KEY: '   ' }))).toBe(false);
    expect(isAlibabaApiKeyConfigured(mockEnv({}))).toBe(false);
  });

  it('documents canonical env order for future runtime surfaces', () => {
    expect(ALIBABA_API_KEY_ENV_NAMES).toEqual([
      'ALIBABA_API_KEY',
      'CVF_BENCHMARK_ALIBABA_KEY',
      'CVF_ALIBABA_API_KEY',
    ]);
  });
});
