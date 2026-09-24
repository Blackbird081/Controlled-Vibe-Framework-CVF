import { describe, expect, it } from 'vitest';

import {
  OPENAI_API_KEY_ENV_NAMES,
  isOpenAIApiKeyConfigured,
  resolveOpenAIApiKey,
  resolveOpenAIApiKeySourceName,
} from './openai-env';

function mockEnv(values: Record<string, string>): NodeJS.ProcessEnv {
  return values as NodeJS.ProcessEnv;
}

describe('openai-env', () => {
  it('prefers canonical OPENAI_API_KEY when multiple aliases are present', () => {
    const key = resolveOpenAIApiKey(mockEnv({
      OPENAI_API_KEY: 'primary-key',
      CVF_OPENAI_API_KEY: 'legacy-key',
    }));

    expect(key).toBe('primary-key');
  });

  it('falls back to compatibility aliases when canonical env is absent', () => {
    expect(
      resolveOpenAIApiKey(mockEnv({
        CVF_OPENAI_API_KEY: 'legacy-key',
      })),
    ).toBe('legacy-key');
  });

  it('trims the returned key', () => {
    expect(
      resolveOpenAIApiKey(mockEnv({ OPENAI_API_KEY: '  padded-key  ' })),
    ).toBe('padded-key');
  });

  it('returns the winning source name without exposing its value', () => {
    expect(
      resolveOpenAIApiKeySourceName(mockEnv({ CVF_OPENAI_API_KEY: 'legacy-key' })),
    ).toBe('CVF_OPENAI_API_KEY');
  });

  it('skips blank or missing values', () => {
    expect(
      resolveOpenAIApiKey(mockEnv({ OPENAI_API_KEY: '   ', CVF_OPENAI_API_KEY: 'legacy-key' })),
    ).toBe('legacy-key');

    expect(resolveOpenAIApiKey(mockEnv({}))).toBeUndefined();
    expect(resolveOpenAIApiKeySourceName(mockEnv({}))).toBeNull();
  });

  it('reports configured state only when a non-empty key is available', () => {
    expect(isOpenAIApiKeyConfigured(mockEnv({ OPENAI_API_KEY: 'key' }))).toBe(true);
    expect(isOpenAIApiKeyConfigured(mockEnv({ CVF_OPENAI_API_KEY: 'key' }))).toBe(true);
    expect(isOpenAIApiKeyConfigured(mockEnv({ OPENAI_API_KEY: '   ' }))).toBe(false);
    expect(isOpenAIApiKeyConfigured(mockEnv({}))).toBe(false);
  });

  it('documents canonical env order for future runtime surfaces', () => {
    expect(OPENAI_API_KEY_ENV_NAMES).toEqual([
      'OPENAI_API_KEY',
      'CVF_OPENAI_API_KEY',
    ]);
  });
});
