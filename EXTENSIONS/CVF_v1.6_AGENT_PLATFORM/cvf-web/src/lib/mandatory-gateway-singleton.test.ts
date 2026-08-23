import { afterEach, describe, expect, it } from 'vitest';
import { getSharedGuardEngine, resetSharedGuardEngine } from '@/lib/guard-engine-singleton';
import { getSharedMandatoryGateway, resetSharedMandatoryGateway } from './mandatory-gateway-singleton';

describe('mandatory-gateway-singleton', () => {
  afterEach(() => {
    resetSharedMandatoryGateway();
    resetSharedGuardEngine();
  });

  it('returns the same gateway instance on repeated calls', () => {
    const first = getSharedMandatoryGateway();
    const second = getSharedMandatoryGateway();
    expect(second).toBe(first);
  });

  it('is backed by the shared guard engine', () => {
    const engine = getSharedGuardEngine();
    const gateway = getSharedMandatoryGateway();
    const result = gateway.check({ action: 'execute:noop', phase: 'BUILD', riskLevel: 'R0' });
    expect(result).toBeDefined();
    expect(engine.getGuardCount()).toBeGreaterThan(0);
  });

  it('is configured with no bypass actions and fail-closed defaults', () => {
    const gateway = getSharedMandatoryGateway();
    const config = gateway.getConfig();
    expect(config.bypassActions).toEqual([]);
    expect(config.enforceAll).toBe(true);
    expect(config.hardBlock).toBe(true);
    expect(config.hardEscalate).toBe(true);
    expect(config.defaultControlMode).toBe('governed');
  });

  it('resets to a fresh instance after resetSharedMandatoryGateway', () => {
    const first = getSharedMandatoryGateway();
    resetSharedMandatoryGateway();
    const second = getSharedMandatoryGateway();
    expect(second).not.toBe(first);
  });

  it('does not treat default gateway bypass substrings as bypassed for execute-route actions', () => {
    const gateway = getSharedMandatoryGateway();
    for (const action of ['health-check', 'ping', 'version', 'openapi']) {
      const result = gateway.check({ action, phase: 'BUILD', riskLevel: 'R0' });
      expect(result.decision).not.toBe('BYPASS');
    }
  });
});
