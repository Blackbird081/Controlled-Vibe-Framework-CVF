import { describe, expect, it } from 'vitest';

import {
  isProviderApiKeyConfiguredFromEnv,
  resolveProviderApiKeyFromEnv,
  resolveProviderApiKeySourceNameFromEnv,
} from './provider-api-key-env';

function mockEnv(values: Record<string, string>): NodeJS.ProcessEnv {
  return values as NodeJS.ProcessEnv;
}

const NAMES = ['PRIMARY_KEY', 'ALIAS_KEY', 'LEGACY_KEY'] as const;

describe('provider-api-key-env', () => {
  it('S1: first non-blank environment value wins in declared order', () => {
    const key = resolveProviderApiKeyFromEnv(NAMES, mockEnv({
      PRIMARY_KEY: 'primary-value',
      ALIAS_KEY: 'alias-value',
      LEGACY_KEY: 'legacy-value',
    }));

    expect(key).toBe('primary-value');
  });

  it('S1: falls back to a later alias when earlier names are absent', () => {
    expect(
      resolveProviderApiKeyFromEnv(NAMES, mockEnv({ ALIAS_KEY: 'alias-value' })),
    ).toBe('alias-value');

    expect(
      resolveProviderApiKeyFromEnv(NAMES, mockEnv({ LEGACY_KEY: 'legacy-value' })),
    ).toBe('legacy-value');
  });

  it('S2: the returned key is trimmed', () => {
    expect(
      resolveProviderApiKeyFromEnv(NAMES, mockEnv({ PRIMARY_KEY: '  padded-value  ' })),
    ).toBe('padded-value');
  });

  it('S3: source-name resolver returns the winning variable name without exposing its value', () => {
    const sourceName = resolveProviderApiKeySourceNameFromEnv(NAMES, mockEnv({
      ALIAS_KEY: 'secret-value',
    }));

    expect(sourceName).toBe('ALIAS_KEY');
  });

  it('S4: blank or missing values are skipped', () => {
    expect(
      resolveProviderApiKeyFromEnv(NAMES, mockEnv({ PRIMARY_KEY: '   ', ALIAS_KEY: 'alias-value' })),
    ).toBe('alias-value');

    expect(
      resolveProviderApiKeyFromEnv(NAMES, mockEnv({})),
    ).toBeUndefined();

    expect(
      resolveProviderApiKeySourceNameFromEnv(NAMES, mockEnv({})),
    ).toBeNull();
  });

  it('S4: a non-string environment value is skipped and the next valid alias wins', () => {
    // NodeJS.ProcessEnv types every value as `string | undefined`, but the
    // real process.env object (and some test/mocking setups) can surface a
    // non-string value at runtime; this narrowly scoped cast exercises that
    // boundary without weakening the production function signature.
    const envWithNonStringValue = {
      PRIMARY_KEY: 42,
      ALIAS_KEY: 'alias-value',
    } as unknown as NodeJS.ProcessEnv;

    expect(resolveProviderApiKeyFromEnv(NAMES, envWithNonStringValue)).toBe('alias-value');
    expect(resolveProviderApiKeySourceNameFromEnv(NAMES, envWithNonStringValue)).toBe('ALIAS_KEY');
  });

  it('S5: configured predicate is true exactly when a resolved string exists', () => {
    expect(isProviderApiKeyConfiguredFromEnv(NAMES, mockEnv({ PRIMARY_KEY: 'value' }))).toBe(true);
    expect(isProviderApiKeyConfiguredFromEnv(NAMES, mockEnv({ PRIMARY_KEY: '   ' }))).toBe(false);
    expect(isProviderApiKeyConfiguredFromEnv(NAMES, mockEnv({}))).toBe(false);
  });

  it('S7: helper is pure, synchronous, and side-effect free across repeated calls', () => {
    const env = mockEnv({ PRIMARY_KEY: 'stable-value' });

    const first = resolveProviderApiKeyFromEnv(NAMES, env);
    const second = resolveProviderApiKeyFromEnv(NAMES, env);

    expect(first).toBe('stable-value');
    expect(second).toBe('stable-value');
    expect(env).toEqual({ PRIMARY_KEY: 'stable-value' });
  });
});
