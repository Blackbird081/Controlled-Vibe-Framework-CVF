import { describe, expect, it, afterEach } from 'vitest';
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

describe('provider-router-adapter ENV risk cap override (GAP 6)', () => {
  afterEach(() => {
    delete process.env['CVF_PROVIDER_RISK_CAP_ALIBABA'];
    delete process.env['CVF_PROVIDER_RISK_CAP_DEEPSEEK'];
    delete process.env['CVF_PROVIDER_RISK_CEILING'];
  });

  it('uses static default when env var is absent', () => {
    // alibaba default is R1 — R2 request should be denied
    const result = routeWebProvider({
      requestedProvider: 'alibaba',
      riskLevel: 'R2',
      configuredProviders: ['alibaba'],
    });
    expect(result.decision).toBe('DENY');
  });

  it('allows higher risk when CVF_PROVIDER_RISK_CAP_ALIBABA=R2', () => {
    process.env['CVF_PROVIDER_RISK_CAP_ALIBABA'] = 'R2';
    const result = routeWebProvider({
      requestedProvider: 'alibaba',
      riskLevel: 'R2',
      configuredProviders: ['alibaba'],
    });
    expect(result.decision).toBe('ALLOW');
    expect(result.selectedProvider).toBe('alibaba');
  });

  it('ignores invalid env var value and uses static default', () => {
    process.env['CVF_PROVIDER_RISK_CAP_ALIBABA'] = 'R9';
    const result = routeWebProvider({
      requestedProvider: 'alibaba',
      riskLevel: 'R2',
      configuredProviders: ['alibaba'],
    });
    // invalid — falls back to R1 default, R2 request denied
    expect(result.decision).toBe('DENY');
  });

  it('CVF_PROVIDER_RISK_CEILING=R3 raises policy ceiling', () => {
    process.env['CVF_PROVIDER_RISK_CAP_DEEPSEEK'] = 'R3';
    process.env['CVF_PROVIDER_RISK_CEILING'] = 'R3';
    const result = routeWebProvider({
      requestedProvider: 'deepseek',
      riskLevel: 'R3',
      configuredProviders: ['deepseek'],
    });
    expect(result.decision).toBe('ALLOW');
    expect(result.selectedProvider).toBe('deepseek');
  });
});
