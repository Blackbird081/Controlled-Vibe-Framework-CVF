import { describe, expect, it } from 'vitest';

import {
  DEEPSEEK_API_KEY_ENV_NAMES,
  isDeepSeekApiKeyConfigured,
  resolveDeepSeekApiKey,
} from './deepseek-env';

function mockEnv(values: Record<string, string>): NodeJS.ProcessEnv {
  return values as NodeJS.ProcessEnv;
}

describe('deepseek-env', () => {
  it('prefers canonical DEEPSEEK_API_KEY when multiple aliases are present', () => {
    const key = resolveDeepSeekApiKey(mockEnv({
      DEEPSEEK_API_KEY: 'primary-key',
      CVF_BENCHMARK_DEEPSEEK_KEY: 'benchmark-key',
      CVF_DEEPSEEK_API_KEY: 'legacy-key',
    }));

    expect(key).toBe('primary-key');
  });

  it('falls back to compatibility aliases when canonical env is absent', () => {
    expect(
      resolveDeepSeekApiKey(mockEnv({
        CVF_BENCHMARK_DEEPSEEK_KEY: 'benchmark-key',
      })),
    ).toBe('benchmark-key');

    expect(
      resolveDeepSeekApiKey(mockEnv({
        CVF_DEEPSEEK_API_KEY: 'legacy-key',
      })),
    ).toBe('legacy-key');
  });

  it('reports configured state only when a non-empty key is available', () => {
    expect(isDeepSeekApiKeyConfigured(mockEnv({ DEEPSEEK_API_KEY: 'key' }))).toBe(true);
    expect(isDeepSeekApiKeyConfigured(mockEnv({ CVF_BENCHMARK_DEEPSEEK_KEY: 'key' }))).toBe(true);
    expect(isDeepSeekApiKeyConfigured(mockEnv({ DEEPSEEK_API_KEY: '   ' }))).toBe(false);
    expect(isDeepSeekApiKeyConfigured(mockEnv({}))).toBe(false);
  });

  it('documents canonical env order for future runtime surfaces', () => {
    expect(DEEPSEEK_API_KEY_ENV_NAMES).toEqual([
      'DEEPSEEK_API_KEY',
      'CVF_BENCHMARK_DEEPSEEK_KEY',
      'CVF_DEEPSEEK_API_KEY',
    ]);
  });
});
