import { describe, expect, it } from 'vitest';
import { routeWebProvider, WEB_PROVIDER_DEFINITIONS } from './provider-router-adapter';

describe('provider-router-adapter OpenAI lane', () => {
  it('keeps OpenAI at the operator-authorized R2 ceiling', () => {
    expect(WEB_PROVIDER_DEFINITIONS.openai).toMatchObject({
      providerId: 'openai',
      providerName: 'OpenAI',
      modelFamily: 'gpt',
      maxRiskLevel: 'R2',
    });

    const result = routeWebProvider({
      requestedProvider: 'openai',
      riskLevel: 'R2',
      configuredProviders: ['openai'],
    });

    expect(result.decision).toBe('ALLOW');
    expect(result.selectedProvider).toBe('openai');
  });

  it('does not route OpenAI above the policy ceiling', () => {
    const result = routeWebProvider({
      requestedProvider: 'openai',
      riskLevel: 'R3',
      configuredProviders: ['openai'],
    });

    expect(result.decision).toBe('DENY');
    expect(result.selectedProvider).toBeNull();
  });
});
